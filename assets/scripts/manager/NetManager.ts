import { _decorator, Component, director, game, Node, Game, Director } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
import '../polyfill';
import * as msgpack from "@msgpack/msgpack";
import md5 from 'md5';

const { ccclass, property } = _decorator;

// 类型定义
interface MessageHandler {
    _fn: Function;
    _tgt: any;
    _id?: Symbol;
}

interface CacheObject {
    parm: PartialNetworkMessage;
    callback?: (msg: NetworkMessage) => void;
    msg?: NetworkMessage;
    c_idx?: number;
    timestamp?: number;
}

interface MessageOptions {
    priority?: 'normal' | 'high';
    once?: boolean;
}

interface NetworkMessage {
    c: number;           // 命令ID
    c_ts?: number;       // 时间戳
    c_idx?: number;      // 消息序号
    uid?: string;        // 用户ID
    language?: number;   // 语言
    code?: number;       // 错误码
    cache?: number;      // 缓存标识
    [key: string]: any;  // 其他属性
}

// 部分消息接口，用于缓存等场景
interface PartialNetworkMessage {
    c?: number;
    c_ts?: number;
    c_idx?: number;
    uid?: string;
    language?: number;
    code?: number;
    cache?: number;
    [key: string]: any;
}

@ccclass('NetManager')
export class NetManager extends Component {    // 网络连接相关
    private curtime: number = 0;
    private address: string = '';
    private ws: WebSocket | null = null;
    private noNeedReconnect: boolean | null = null;
    private reconnecting: boolean | null = null;

    // 心跳相关
    private readonly hearBeatTimeout: number = 3000; // 超时时间3秒
    private readonly hearBeatInterval: number = 7000; // 心跳间隔
    private hearBeatIntervalIdx: NodeJS.Timeout | null = null;
    private lastHearBeatTime: number = 0;
    private lastReplyInterval: number = 50; // 最后回复间隔(默认50毫秒)
    private curReplyInterval: number = 0.0; // 当前回复间隔

    // 重连相关
    private nextAutoConnectDelay: number = 0; // 下次自动连接的时间
    private autoConnectCount: number = 0; // 自动连接次数
    private readonly autoConnectCountMax: number = 2; // 最大自动连接次数

    // 时间和更新相关
    private updateTimeIntervar: number = 0;

    // 消息处理相关
    private handlers: { [key: string]: MessageHandler[] } = {}; // 消息处理器
    private handlersHigh: { [key: string]: MessageHandler[] } = {}; // 高优先级消息处理器
    private idx: number = 0; // 消息序号

    // 缓存相关
    private cacheList: CacheObject[] = [];
    private cacheIdxList: number[] = [];

    // 通知相关
    private notifyHandler: Function[] = [];

    private heartBeatHandlerRef: ((msg: any) => void) | null = null;

    // 回调函数
    private fnDisconnect: Function | null = null;    /**
     * 组件加载时初始化
     */
    protected onLoad(): void {
        App.NetManager = this;
        this.init();

        // 监听应用生命周期事件
        this.setupAppLifecycleEvents();
    }

    /**
     * 组件启动方法
     */
    start(): void {
        // 预留启动逻辑
        console.log('NetManager started successfully');
    }

    /**
     * 初始化网络管理器
     */
    private init(): void {
        try {
            // 初始化时间戳
            const now = Date.now();
            this.curtime = now;
            this.lastHearBeatTime = now;

            // 初始化网络状态
            this.resetNetworkState();

            // 初始化数据结构
            this.handlers = {};
            this.handlersHigh = {};
            this.cacheList = [];
            this.cacheIdxList = [];
            this.notifyHandler = [];

            // 设置定时清理缓存
            this.setupCacheCleanup();

            console.log('NetManager initialized at:', new Date(now).toLocaleString());
        } catch (error) {
            console.warn('NetManager initialization failed:', error);
        }
    }    /**
     * 设置应用生命周期事件监听
     */
    private setupAppLifecycleEvents(): void {
        try {
            // 监听应用暂停/恢复
            game.on(Game.EVENT_SHOW, this.onAppResume, this);
            game.on(Game.EVENT_HIDE, this.onAppPause, this);

            // 监听场景切换
            director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onSceneChange, this);
        } catch (error) {
            console.warn('Failed to setup app lifecycle events:', error);
        }
    }

    /**
     * 应用恢复时的处理
     */
    private onAppResume(): void {
        console.log('App resumed - checking network status');

        // 检查网络连接状态
        if (this.address && !this.isConnect()) {
            console.log('App resumed but network disconnected, attempting reconnect');
            setTimeout(() => {
                this.reconnect();
            }, 1000);
        }
    }

    /**
     * 应用暂停时的处理
     */
    private onAppPause(): void {
        console.log('App paused - pausing heartbeat');

        // 暂停心跳以节省资源
        if (this.hearBeatIntervalIdx) {
            this.stopHearBeat();
        }
    }

    /**
     * 场景切换时的处理
     */
    private onSceneChange(): void {
        // 清理过期缓存
        this.clearExpiredCache();
    }

    /**
     * 设置缓存清理定时器
     */
    private setupCacheCleanup(): void {
        // 每10分钟清理一次过期缓存
        setInterval(() => {
            this.clearExpiredCache();
        }, 10 * 60 * 1000);
    }

    /**
     * 组件销毁时清理资源
     */
    protected onDestroy(): void {
        try {
            // 关闭网络连接
            this.close();
            // 移除事件监听
            game.off(Game.EVENT_SHOW, this.onAppResume, this);
            game.off(Game.EVENT_HIDE, this.onAppPause, this);
            director.off(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onSceneChange, this);

            // 清理所有消息处理器
            this.handlers = {};
            this.handlersHigh = {};

            // 清理缓存
            this.cacheList = [];
            this.cacheIdxList = [];

            // 清理通知处理器
            this.notifyHandler = [];

            console.log('NetManager destroyed and cleaned up');
        } catch (error) {
            console.warn('Error during NetManager cleanup:', error);
        }
    }/**
     * 每帧更新方法
     * 处理网络连接状态监控、超时检测、自动重连等逻辑
     * @param deltaTime 帧间隔时间
     */
    update(deltaTime: number): void {
        // 控制更新频率，避免过于频繁的检测
        this.updateTimeIntervar += deltaTime;
        if (this.updateTimeIntervar < 50) { // 50ms检查一次
            return;
        }

        // 没有服务器地址时不进行任何网络相关操作
        if (!this.address) return;

        // 更新当前时间
        this.curtime += this.updateTimeIntervar;

        // 检查心跳超时
        this.checkHeartbeatTimeout();

        // 处理自动重连逻辑  
        this.handleAutoReconnect();

        // 更新网络延迟统计
        this.curReplyInterval += this.updateTimeIntervar;

        // 重置更新时间间隔
        this.updateTimeIntervar = 0;
    }

    /**
     * 检查心跳超时
     */
    private checkHeartbeatTimeout(): void {
        if (!this.address || !this.hearBeatIntervalIdx) return;

        const timeSinceLastHeartbeat = this.curtime - this.lastHearBeatTime;
        const heartbeatTimeout = this.hearBeatInterval + this.hearBeatTimeout;

        if (timeSinceLastHeartbeat > heartbeatTimeout) {
            console.warn(`心跳超时检测 - 当前时间: ${this.curtime}, 上次心跳: ${this.lastHearBeatTime}, 超时: ${timeSinceLastHeartbeat}ms`);

            this.reconnecting = true;
            this.reconnect();
            this.lastHearBeatTime = this.curtime;
        }
    }

    /**
     * 处理自动重连逻辑
     */
    private handleAutoReconnect(): void {
        if (this.nextAutoConnectDelay <= 0) return;

        this.nextAutoConnectDelay -= this.updateTimeIntervar;

        if (this.nextAutoConnectDelay <= 0) {
            this.autoConnectCount++;
            console.log(`自动重连尝试 - 第${this.autoConnectCount}次，最大${this.autoConnectCountMax}次`);

            if (this.autoConnectCount >= this.autoConnectCountMax) {
                console.warn('自动重连次数已达上限，显示网络错误提示');
                this.showNetErrorUI();
                this.nextAutoConnectDelay = 0; // 停止重连
            } else {
                console.log(`发起第${this.autoConnectCount}次自动重连`);
                this.reconnect();
                // 设置下次重连间隔（递增策略）
                this.nextAutoConnectDelay = Math.min(5000 * this.autoConnectCount, 30000); // 最大30秒
            }
        }
    }

    /**
     * 重置网络状态
     */
    resetNetworkState(): void {
        this.reconnecting = null;
        this.autoConnectCount = 0;
        this.nextAutoConnectDelay = 0;
        this.curReplyInterval = 0;
        this.lastReplyInterval = 50;
        console.log('网络状态已重置');
    }

    //注册消息
    //bHighpriority true/false高优先级：界面注册的消息是正常优先级，数据层的应该注册高优先级。先刷数据，再刷界面
    //target : 需要多处监听的消息，fn 需不用bind(this) 而是将this 赋值给target
    //示例：cc.vv.NetManager.registerMsg(App.MessageID.LOGIN, this.onRcvMsgLogin, this)
    registerMsg(cmd: any, fn: Function, target: any = null, bHighpriority: boolean = false) {
        if (cmd == null || cmd == undefined) {
            console.warn("cmd must be not null and not undefined");
            return;
        }
        if (fn == null || fn == undefined) {
            console.warn("fn must be not null and not undefined");
            return;
        }

        let item = { _fn: fn, _tgt: target };
        let cmdKey = String(cmd);

        // 选择对应的处理器
        let handlers = bHighpriority ? this.handlersHigh : this.handlers;
        let msgType = bHighpriority ? "Highcmd" : "cmd";

        // 初始化处理器数组
        handlers[cmdKey] = handlers[cmdKey] || [];

        // 检查是否已经注册过相同的函数和目标
        for (let i = 0; i < handlers[cmdKey].length; i++) {
            let existingItem = handlers[cmdKey][i];
            if (existingItem._fn === fn && existingItem._tgt === target) {
                console.warn(`The ${msgType}:${cmd}==>fn has registered!`);
                return;
            }
        }

        // 添加新的处理器
        handlers[cmdKey].push(item);
        //console.log(`register${bHighpriority ? 'High' : ''}Msg: `, cmd);
    }

    /**
     * 现代化的消息注册 API 
     * @param cmd 消息命令
     * @param handler 消息处理器 - 使用箭头函数自动绑定上下文，或者传入已绑定的函数
     * @param options 配置选项
     * @example 
     * // 使用箭头函数（推荐）
     * NetManager.on(App.MessageID.LOGIN, (msg) => this.handleLogin(msg));
     * 
     * // 使用绑定函数
     * NetManager.on(App.MessageID.LOGIN, this.handleLogin.bind(this));
     * 
     * // 高优先级消息
     * NetManager.on(App.MessageID.DATA_UPDATE, handler, { priority: 'high' });
     */
    on(cmd: any, handler: (msg: any) => boolean | void, options: {
        priority?: 'normal' | 'high',
        once?: boolean
    } = {}) {
        if (cmd == null || cmd == undefined) {
            console.warn("cmd must be not null and not undefined");
            return;
        }
        if (!handler || typeof handler !== 'function') {
            console.warn("handler must be a function");
            return;
        }

        const { priority = 'normal', once = false } = options;
        const bHighpriority = priority === 'high';

        // 创建包装器处理一次性监听
        const wrappedHandler = once ? (msg: any) => {
            const result = handler(msg);
            this.off(cmd, wrappedHandler);
            return result;
        } : handler;

        // 生成唯一ID作为标识符，避免重复注册问题
        const handlerId = Symbol('handler');
        (wrappedHandler as any).__handlerId = handlerId;

        let item = { _fn: wrappedHandler, _tgt: null, _id: handlerId };
        let cmdKey = String(cmd);

        // 选择对应的处理器
        let handlers = bHighpriority ? this.handlersHigh : this.handlers;

        // 初始化处理器数组
        handlers[cmdKey] = handlers[cmdKey] || [];

        // 检查是否已经注册过相同的处理器
        for (let i = 0; i < handlers[cmdKey].length; i++) {
            let existingItem = handlers[cmdKey][i];
            if (existingItem._id && existingItem._id === handlerId) {
                console.warn(`Handler for cmd:${cmd} has already been registered!`);
                return handlerId;
            }
        }

        // 添加新的处理器
        handlers[cmdKey].push(item);
        return handlerId; // 返回处理器ID，用于后续注销
    }

    /**
     * 注销消息监听
     * @param cmd 消息命令
     * @param handler 要注销的处理器函数或处理器ID
     * @example
     * // 注销特定处理器
     * NetManager.off(App.MessageID.LOGIN, handler);
     * 
     * // 使用返回的ID注销
     * const handlerId = NetManager.on(App.MessageID.LOGIN, handler);
     * NetManager.off(App.MessageID.LOGIN, handlerId);
     * 
     * // 注销所有处理器
     * NetManager.off(App.MessageID.LOGIN);
     */
    off(cmd: any, handler?: Function | Symbol) {
        if (cmd == null || cmd == undefined) {
            console.warn("cmd must be not null and not undefined");
            return;
        }

        let cmdKey = String(cmd);

        // 如果没有指定处理器，清空所有处理器
        if (!handler) {
            delete this.handlers[cmdKey];
            delete this.handlersHigh[cmdKey];
            console.log(`Cleared all handlers for cmd:${cmd}`);
            return;
        }

        // 从两个处理器数组中查找并删除
        [this.handlers, this.handlersHigh].forEach(handlersMap => {
            const handlers = handlersMap[cmdKey];
            if (!handlers) return;

            for (let i = handlers.length - 1; i >= 0; i--) {
                const item = handlers[i];

                // 通过ID匹配或函数引用匹配
                const isMatch = (typeof handler === 'symbol' && item._id === handler) ||
                    (typeof handler === 'function' && item._fn === handler) ||
                    (typeof handler === 'function' && (item._fn as any).__handlerId === (handler as any).__handlerId);

                if (isMatch) {
                    handlers.splice(i, 1);
                    console.log(`Removed handler for cmd:${cmd}`);
                    return;
                }
            }
        });
    }

    /**
     * 一次性消息监听
     * @param cmd 消息命令
     * @param handler 消息处理器
     * @param priority 优先级
     */
    once(cmd: any, handler: (msg: any) => boolean | void, priority: 'normal' | 'high' = 'normal') {
        return this.on(cmd, handler, { priority, once: true });
    }

    // 查找相同消息上挂载多个继承同一个脚本，而且注册的事件相同，这种情况不知道到底注销哪个消息
    findSameFuncAdrr(handler: string | any[], fn: any) {
        let num = 0;
        for (let i = 0; i < handler.length; ++i) {
            if (fn === handler[i]._fn) ++num;
        }
        return num;
    }    //注销消息
    //fn : fn的形式如this.onNectCallback就好，不能this.onNectCallback.bind(this)否则无法注销
    //示例：cc.vv.NetManager.registerMsg(App.MessageID.LOGIN, this.onRcvMsgLogin)
    unregisterMsg(cmd: any, fn: Function = null, bHighpriority = false, target: any = null) {
        if (cmd != null && cmd != undefined) {
            let cmdKey = String(cmd);

            // 选择对应的处理器
            let handlers = bHighpriority ? this.handlersHigh : this.handlers;
            let msgType = bHighpriority ? "HighMsg" : "Msg";

            if (fn && typeof (fn) == 'function' && handlers[cmdKey]) {
                let num = this.findSameFuncAdrr(handlers[cmdKey], fn);

                for (let i = 0; i < handlers[cmdKey].length; i++) {
                    let item = handlers[cmdKey][i];
                    if (item._fn === fn) {
                        if (num > 1) {
                            if (target === null || target === undefined) {
                                console.warn("请传入需要注销的消息的target");
                                return;
                            }
                            else {
                                let itemTarget = handlers[cmdKey][i]._tgt;
                                if (itemTarget === target) {
                                    console.log(`unregister${msgType}: `, cmd, '=>function');
                                    handlers[cmdKey].splice(i, 1);
                                    break;
                                }
                            }
                        }
                        else {
                            console.log(`unregister${msgType}: `, cmd, '=>function');
                            handlers[cmdKey].splice(i, 1);
                            break;
                        }
                    }
                }
            }
            else {
                console.log(`unregister${msgType}: `, cmd);
                delete handlers[cmdKey];
            }
        }
    }    // 分发网络消息
    dispatchNetMsg(msg: string | NetworkMessage): void {
        let parsedMsg: NetworkMessage;
        if (typeof msg === 'string') {
            parsedMsg = JSON.parse(msg);
        } else {
            parsedMsg = msg;
        }

        this.handleMsg(parsedMsg);

        if (App.DeviceUtils.isNative()) {
            console.log('客户端主动分发网络消息', JSON.stringify(parsedMsg));
        } else {
            console.log("%c 客户端主动分发网络消息(%d): %o",
                "background: rgb(254,189,1);color:#9932cd;font-weight:bold;", 0, parsedMsg);
        }
    }

    //处理消息
    handleMsg(msgDic: any) {
        if (!msgDic) return;

        // 打印网络日志（排除缓存消息）
        if (this.cacheIdxList.indexOf(msgDic.c_idx) < 0) {
            this.printNetLog("Receive", msgDic);
        }

        let cmd = msgDic.c;
        if (!cmd) {
            console.warn('Received msg has no cmd!');
            return;
        }

        let cmdKey = String(cmd);

        // 通知消息回调
        this.notifyMsgBack(cmdKey);

        // 隐藏加载提示（排除心跳消息）
        if (msgDic.c !== App.MessageID.HEARTBEAT && App.AlertManager.getLoadingTip().isShow) {
            this.hideNetTip();
        }

        // 处理高优先级消息回调
        let processedByHigh = this.executeHandlers(this.handlersHigh[cmdKey], msgDic);

        // 处理普通优先级消息回调
        let cmdHandlers = this.handlers[cmdKey];
        if (!cmdHandlers) {
            if (!this.handlersHigh[cmdKey]) {
                console.warn(`Received msg cmd:${cmd} has no handlers`);
            }
            return;
        }

        let processedByNormal = this.executeHandlers(cmdHandlers, msgDic);

        // 处理错误码
        this.handleErrorCode(msgDic);
    }    // 执行消息处理器
    private executeHandlers(handlers: MessageHandler[] | undefined, msgDic: NetworkMessage): boolean {
        if (!handlers || handlers.length === 0) return false;

        for (let i = handlers.length - 1; i >= 0; i--) {
            const item = handlers[i];
            if (!item?._fn) continue; // 防御性编程

            try {
                let result: boolean | void;

                if (item._tgt) {
                    const cb = item._fn.bind(item._tgt);
                    result = cb(App.SystemUtils.copy(msgDic));
                } else {
                    result = item._fn(App.SystemUtils.copy(msgDic));
                }

                // 若返回了true，则表示处理完成，不续传其他地方处理
                if (result === true) {
                    return true;
                }
            } catch (error) {
                console.warn('Error executing message handler:', error);
                // 继续执行其他处理器，不因为一个处理器出错而影响整体
            }
        }

        return false;
    }    // 处理错误码
    private handleErrorCode(msgDic: NetworkMessage): void {
        // 没有错误码或者是成功状态码，直接返回
        if (!msgDic.code || msgDic.code === 200 || msgDic.code === 20000) {
            return;
        }

        // 尝试通用错误码处理
        if (this.handleCommonErrorCode(msgDic.code, msgDic)) {
            return;
        }

        // 特殊错误码处理
        const errorHandlers: Record<number, () => void> = {
            203: () => App.EventUtils.dispatchEvent(App.EventID.RELOGIN),
            214: () => this.handleUpdateRequired(msgDic.code.toString())
        };

        const handler = errorHandlers[msgDic.code];
        if (handler) {
            handler();
            return;
        }

        // 默认错误处理
        this.handleDefaultError(msgDic.code);
    }

    // 处理需要更新的错误
    private handleUpdateRequired(errorCode: string): void {
        const descStr = "error code:" + errorCode;
        App.AlertManager.getCommonAlert().show(descStr, () => {
            App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
            App.NetManager.close();
            if (App.DeviceUtils.isNative()) {
                // 修复：直接重启应用，让GameLaunch重新检查更新
                // 不再跳转到可能不存在的HotUpdate_BC场景
                console.log('[NetManager] 需要更新，重启应用以触发热更新检查');
                App.AudioManager.stopAll();
                game.restart();
            } else {
                // Web平台：刷新页面
                console.log('[NetManager] Web平台需要更新，刷新页面');
                if (typeof window !== 'undefined' && window.location) {
                    window.location.reload();
                }
            }
        });
    }

    // 处理默认错误
    private handleDefaultError(errorCode: number): void {
        const noTipsCode = [399, 934, 710];
        if (!noTipsCode.includes(errorCode)) {
            const descStr = "error code:" + errorCode.toString();
            App.AlertManager.showFloatTip(descStr);
        }
    }    /**
     * 注册消息返回监听，有时候业务需要监听消息是否返回了
     * @param notifyCall 通知回调函数
     */
    registerNotify(notifyCall: Function): void {
        if (!notifyCall || typeof notifyCall !== 'function') {
            console.warn('registerNotify: notifyCall must be a function');
            return;
        }

        if (!this.notifyHandler.includes(notifyCall)) {
            this.notifyHandler.push(notifyCall);
        }
    }

    /**
     * 取消消息返回注册监听
     * @param notifyCall 通知回调函数
     */
    unregisterNotify(notifyCall: Function): void {
        const index = this.notifyHandler.indexOf(notifyCall);
        if (index > -1) {
            this.notifyHandler.splice(index, 1);
        }
    }

    // 通知消息回调
    private notifyMsgBack(cmd: string): void {
        this.notifyHandler.forEach(handler => {
            try {
                if (handler && typeof handler === 'function') {
                    handler(cmd);
                }
            } catch (error) {
                console.warn('Error in notify handler:', error);
            }
        });
    }    // 处理常用错误码
    private handleCommonErrorCode(errorCode: number, msg: NetworkMessage): boolean {
        switch (errorCode) {
            case 415: //需要重新登录
                App.AlertManager.showFloatTip("重连中...");
                App.GameManager.relogin(); //用户重登录登录服
                break;
            case 500:
                App.AlertManager.showFloatTip("网络错误");
                // cc.vv.AlertView.show(___("登录失败，请检查网络后再重新登录连接"), () => {
                //     cc.vv.GameManager.reqReLogin(); //用户重登录登录服
                // }, () => {
                //     App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
                //     cc.vv.SceneMgr.enterScene(Global.SCENE_NAME.LOGIN, () => {
                //         this.close(); //关闭网络
                //     });
                // });
                break;
            case 538: //有vip限制进入游戏
                let extVal = msg.minsvip
                let tipsmsg = `Upgrade your VIP level to VIP${extVal} to enjoy the game`;
                App.AlertManager.getCommonAlert().setConfirmLabel('Upgrade Now').showWithoutCancel(tipsmsg, () => {
                    App.EventUtils.dispatchEvent("OpenCharge")
                }
                );
                break
            case 559: //游戏维护中
            case 425:
                let tips = ("The game is under maintenance, please wait patiently!")
                App.AlertManager.getCommonAlert().showWithoutCancel(tips);
                break
            case 560:
                if (msg.c == App.MessageID.GET_NEWER_GIFT_REWARDS || msg.c == App.MessageID.EVENT_VIP_SIGN_REWARD) {   // 注册领取
                    //cc.vv.AlertView.show(___("One more step to enjoy the game:Account verify"), () => {
                    //    let kyc = cc.vv.UserManager.kycUrl;
                    //    if (kyc) {
                    // cc.vv.PopupManager.addPopup("YD_Pro/prefab/PhoneBinding", {
                    //     noTouchClose: true,
                    // })
                    //    }
                    //}, null, false, null, null, null, ___("Verify Now"));
                } else {
                    //cc.vv.AlertView.show(___("One more step to enjoy the game:Account verify"), () => {
                    //    let kyc = cc.vv.UserManager.kycUrl;
                    //    if (kyc) {
                    //cc.vv.PopupManager.addPopup("YD_Pro/prefab/PhoneBinding")
                    //    }
                    //}, () => {

                    //}, false, null, null, ___("Verify Later"), ___("Verify Now"));
                }
                break
            case 561:
                App.AlertManager.getCommonAlert()
                    .setCancelLabel('Verify Later')
                    .setConfirmLabel('Verify Now')
                    .show("One more step to enjoy the game: Account verify", () => {
                        App.EventUtils.dispatchEvent("OpenKYC")
                    }, () => {

                    });
                // cc.vv.AlertView.show("One more step to enjoy the game: Bank verify"), () => {
                //     let kyc = cc.vv.UserManager.kycUrl;
                //     if (kyc) {
                //         cc.vv.PopupManager.showTopWin("YD_Pro/prefab/yd_charge", {
                //             onShow: (node) => {
                //                 node.getComponent("yd_charge").setURL(kyc);
                //             }
                //         })
                //     }
                // }, () => {

                // }, false, null, null, ___("Verify Later"), ___("Verify Now"));
                break

            case 801: //必须重启
                App.AlertManager.getCommonAlert()
                    .showWithoutCancel("A new version is available. Please click the update button to update the game to the latest version.", () => {
                        App.AudioManager.stopAll();
                        game.restart();
                    });

                break;
            case 802: //房间解散后的多余操作 目前无需处理
                break;
            case 803: //游戏维护中
                this.noNeedReconnect = true //不需要重连了
                App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
                //
                let curScene = director.getScene()
                if (curScene.name != Config.SCENE_NAME.LOGIN) {
                    App.SceneUtils.enterScene(Config.SCENE_NAME.LOGIN, () => {

                    });
                }
                this.close()
                App.AlertManager.getCommonAlert().showWithoutCancel("系统维护期间无法登录");
                break;
            case 804: //金币不足
                App.AlertManager.showFloatTip("金币不足");
                if (msg.gameChangeDesk && msg.gameChangeDesk == 1) {
                    //换房成功导致的金币不足，不走804(列如：领取破产补助后依旧金币不足)
                } else {
                    App.EventUtils.dispatchEvent(App.EventID.NOT_ENOUGH_COINS);
                }
                break;
            case 211: //token无效 要重新登录
                App.EventUtils.dispatchEvent(App.EventID.RELOGIN);
                App.AlertManager.getCommonAlert().showWithoutCancel("自动登录已过期，请重新登录", () => {
                    App.SceneUtils.enterScene(Config.SCENE_NAME.LOGIN, () => {
                        this.close();
                    })
                });
                break;
            case 931: //房间不存在，需要重连恢复正常
                App.GameManager.relogin();
                break;
            case 4005: //不在语聊房内,重连或者回到大厅
                App.EventUtils.dispatchEvent(App.EventID.ENTER_HALL);
                break
            default:
                return false; //表示未处理
                break;
        };
        return true; //表示已处理
    }

    // 处理回复数据(暂时没有考虑粘包的问题)
    private handleResponeData(msgData: ArrayBuffer | Blob): void {
        this.reconnecting = null;

        const decodeArrayBuff = (arrayBuf: ArrayBuffer): void => {
            try {
                const dataview = new DataView(arrayBuf);
                const headSize = 8;
                const bodyLen = arrayBuf.byteLength - headSize;
                if (bodyLen <= 0) return;

                const uint8Array = new Uint8Array(bodyLen);
                for (let i = 0; i < bodyLen; i++) {
                    uint8Array[i] = dataview.getUint8(headSize + i);
                }

                const realMsgpack = (msgpack as any).default || msgpack;
                const msgDic = realMsgpack.decode(uint8Array);
                this.lastHearBeatTime = this.curtime;

                this.handleMsg(JSON.parse(msgDic as string));
            } catch (e) {
                console.warn('decode message error:', e);
            }
        };

        if (msgData instanceof ArrayBuffer) {
            decodeArrayBuff(msgData);
        } else if (window.FileReader && msgData instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result instanceof ArrayBuffer) {
                    decodeArrayBuff(reader.result);
                }
            };
            reader.readAsArrayBuffer(msgData);
        } else {
            console.log('Unsupported message data type');
        }
    }

    private getWebSocketCtor(): any {
        const g: any = globalThis as any;
        let ctor = g.WebSocket;
        if (typeof ctor !== 'function') {
            // jsb 兜底
            if (g.jsb?.network?.WebSocket) {
                ctor = g.jsb.network.WebSocket;
            }
        }
        if (typeof ctor !== 'function') {
            console.warn('[NetManager] WebSocket ctor not found. typeof=', typeof g.WebSocket, 'value=', g.WebSocket);
        }
        return ctor;
    }

    // 连接服务器
    connect(serverAddress: string, callback?: Function): void {
        this.noNeedReconnect = null;
        this.address = serverAddress?.trim();

        if (this.ws) {
            this.close();
        }

        const protocol = App.SystemUtils.isUserWSS(this.address) ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${this.address}/ws`;

        const WSCtor: any = this.getWebSocketCtor();
        if (typeof WSCtor !== 'function') {
            console.warn('[NetManager] 无可用 WebSocket 构造器，放弃连接');
            return;
        }

        console.log('[NetManager] 准备连接 =>', wsUrl, 'CtorName=', WSCtor.name);

        let inst: WebSocket;
        try {
            inst = new WSCtor(wsUrl);
        } catch (e) {
            console.warn('创建 WebSocket 失败：', e);
            return;
        }
        this.ws = inst;

        inst.binaryType = 'arraybuffer';

        inst.onopen = (event: Event) => {
            console.log('[NetManager] socket connect succeed:', (event.target as WebSocket).url);
            this.autoConnectCount = 0;
            if (callback) callback();

            const target = event.target as WebSocket;
            const isLoginServer = target?.url?.includes(Config.loginServerAddress);

            if (!isLoginServer) {
                this.hearBeat();
                this.lastReplyInterval = 100;
                App.EventUtils.dispatchEvent("GAME_SERVER_SOCKET_OPENED");
            }
        };

        inst.onmessage = (event: MessageEvent) => {
            this.handleResponeData(event.data as any);
        };

        inst.onerror = (event: Event) => {
            console.warn('[NetManager] socket error', event);
            if ((event as any)?.isTrusted) return;
            if (!this.noNeedReconnect) {
                this.nextAutoConnectDelay = 5000;
            }
        };

        inst.onclose = (event: CloseEvent) => {
            const target = event.target as WebSocket;
            console.log('[NetManager] onclose code=', event.code, 'url=', target?.url);

            const isLoginServer = target?.url?.includes(Config.loginServerAddress);
            if (!isLoginServer) {
                this.stopHearBeat();
            }

            if (this.ws && !isLoginServer && !this.noNeedReconnect && this.nextAutoConnectDelay <= 0) {
                this.nextAutoConnectDelay = 1000;
                App.EventUtils.dispatchEvent("SOCKET_BE_CLOSE");
                console.log('[NetManager] 将在 1s 后尝试重连');
            }
        };

        console.log('[NetManager] connecting...', wsUrl);
    }

    /**
     * 关闭网络连接
     * @param callback 关闭完成后的回调函数
     */
    close(callback?: () => void): void {
        console.log('[NetManager] 主动关闭连接');
        this.noNeedReconnect = true;

        try {
            if (this.ws) {
                const local = this.ws;
                this.stopHearBeat();
                local.onopen = local.onmessage = local.onerror = local.onclose = null!;
                try {
                    local.close();
                } catch { }
                this.ws = null;
            }
            this.reconnecting = null;
            if (callback) callback();
        } catch (e) {
            console.warn('close error:', e);
        }
    }

    /**
     * 重新连接服务器
     */
    reconnect(): void {
        console.log('发起重连请求');

        try {
            // 显示重连提示
            this.showNetTipType(1);

            const userData = App.userData();

            if (this.isConnect() && userData?.uid) {
                console.log('连接未断开，直接重新登录节点服');
                App.GameManager.relogin();

                // 如果心跳不存在，重新启动心跳
                if (!this.hearBeatIntervalIdx) {
                    this.hearBeat();
                }
            } else {
                console.log('连接已断开，重新登录');
                App.GameManager.relogin();
            }
        } catch (error) {
            console.warn('重连过程中发生错误:', error);
            // 重连失败，显示错误提示
            this.showNetErrorUI();
        }
    }

    /**
     * 检查是否已连接到服务器
     * @returns 是否连接
     */
    isConnect(): boolean {
        const isConnected = !!(this.ws && this.ws.readyState === WebSocket.OPEN);

        // 开发模式下显示连接状态调试信息
        if (Config.localVersion && !isConnected && this.ws) {
            const statusMap = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
            console.log(`WebSocket连接状态: ${this.ws.readyState}(${statusMap[this.ws.readyState] || 'UNKNOWN'})`);
        }

        return isConnected;
    }

    /**
     * 网络是否可用（连接正常且不在重连状态）
     * @returns 网络是否可用
     */
    isNetAvailable(): boolean {
        return this.isConnect() && !this.reconnecting;
    }

    /**
     * 清除自动重连定时器
     */
    public clearTimeoutReconnect(): void {
        this.nextAutoConnectDelay = 0;
        this.autoConnectCount = 0;
        console.log('已清除自动重连定时器');
    }

    /**
     * 获取连接状态描述
     * @returns 连接状态文本
     */
    getConnectionStatus(): string {
        if (!this.ws) return '未连接';

        const statusMap = {
            [WebSocket.CONNECTING]: '连接中',
            [WebSocket.OPEN]: '已连接',
            [WebSocket.CLOSING]: '关闭中',
            [WebSocket.CLOSED]: '已关闭'
        };

        return statusMap[this.ws.readyState] || '未知状态';
    }

    /**
     * 强制断开并重新连接
     */
    forceReconnect(): void {
        console.log('强制重连');
        this.close(() => {
            setTimeout(() => {
                if (this.address) {
                    this.connect(this.address);
                }
            }, 1000);
        });
    }/**
     * 发送消息
     * @param msgDic 消息对象或字符串
     * @param isNotShowShield 是否不显示加载遮罩
     * @returns 发送是否成功
     */
    send(msgDic: NetworkMessage | PartialNetworkMessage | string, isNotShowShield: boolean = false): boolean {
        if (!this.isConnect()) {
            if (typeof msgDic === 'object' && msgDic?.c) {
                this.showNetErrorUI(msgDic.c);
            }
            return false;
        }

        // 处理重连状态
        if (this.reconnecting && msgDic) {
            const cmd = typeof msgDic === 'string' ? null : msgDic.c;
            this.showNetErrorUI(cmd);
            return false;
        }        // 解析消息
        let parsedMsg: NetworkMessage;
        try {
            if (typeof msgDic === 'string') {
                parsedMsg = JSON.parse(msgDic);
            } else {
                parsedMsg = { ...msgDic } as NetworkMessage; // 创建副本避免修改原对象
            }

            if (!parsedMsg.c) {
                console.warn('The msg msgDic is lost cmd');
                return false;
            }
        } catch (error) {
            console.warn('Failed to parse message:', error);
            return false;
        }

        // 填充消息属性
        this.fillMessageProperties(parsedMsg);

        // 打印发送日志
        if (!parsedMsg.cache) {
            this.printNetLog("Send", parsedMsg);
        }

        // 发送消息
        try {
            const bodyData = this.pack(JSON.stringify(parsedMsg));
            const headData = this.generateHead(bodyData);
            const uint8Array = this.linkHeadBody(headData, bodyData);

            this.ws!.send(uint8Array);

            if (!isNotShowShield) {
                App.AlertManager.getLoadingTip().show();
            }

            return true;
        } catch (error) {
            console.warn('Failed to send message:', error);
            return false;
        }
    }

    // 填充消息属性
    private fillMessageProperties(msgDic: NetworkMessage): void {
        msgDic.c_ts = Date.now(); // 时间戳毫秒级别

        // 协议1加入加密验证
        if (msgDic.c === App.MessageID.LOGIN && App.DeviceUtils.isNative()) {
            msgDic.x = md5(msgDic.c_ts.toString() + "hero888");
        }

        msgDic.c_idx = this.idx++; // 客户端记录的消息序号
        const userData = App.userData();
        if (userData?.uid) {
            msgDic.uid = userData.uid.toString();
        }

        const lanVal = this.getProjectLan();
        if (lanVal) {
            msgDic.language = lanVal;
        }
    }
    /**
     * 获取当前设置的语言
     * @returns 语言代码
     */
    private getProjectLan(): number {
        // return App.i18n._language;
        return 2;
    }
    /**
     * 打印网络日志
     * @param logType 日志类型 
     * @param msgDic 消息对象
     */
    private printNetLog(logType: string, msgDic: NetworkMessage): void {
        if (!Config.localVersion || msgDic.c === 11) return;

        // 特殊处理报告消息
        if (msgDic.c === 245) {
            if (logType === "Send") {
                console.log("%c %s %o",
                    "background: rgb(153,102,255);color:#fff;font-weight:bold;",
                    `report >> ${(msgDic as any).act}`,
                    (msgDic as any).ext);
            }
            return;
        }

        let color = "background: rgb(50,154,207);color:#fff;font-weight:bold;";
        if (logType === "Receive") {
            color = "background: rgb(0,99,0);color:#fff;font-weight:bold;";
        }

        if (App.DeviceUtils.isNative()) {
            console.log(`${logType}: `, JSON.stringify(msgDic));
        } else {
            if (typeof msgDic.c_idx === 'number' && msgDic.c_idx >= 0) {
                console.log("%c %s(%d): %o", color, `[${msgDic.c}] ${logType}`, msgDic.c_idx, msgDic);
            } else if (msgDic.c_idx === undefined) {
                const notificationColor = "background: rgb(255,102,255);color:#fff;font-weight:bold;";
                console.log("%c %s: %o", notificationColor, `[${msgDic.c}] Notification`, msgDic);
            }
        }
    }    /**
     * 数据打包 - 使用 msgpack 编码
     * @param msgDic 要打包的消息对象
     * @returns 编码后的数据
     */
    private pack(msgStr: string): Uint8Array {
        const realMsgpack = (msgpack as any).default || msgpack;
        try {
            return realMsgpack.encode(msgStr);
        } catch (err) {
            const g: any = globalThis;
            if (g.TextEncoder && typeof g.TextEncoder.prototype.encodeInto !== 'function') {
                g.TextEncoder.prototype.encodeInto = function (src: string, dest: Uint8Array) {
                    const bytes = this.encode(src);
                    const written = Math.min(bytes.length, dest.length);
                    dest.set(bytes.subarray(0, written), 0);
                    return { read: src.length, written };
                };
                console.warn('[NetManager] encodeInto patched, retry encode');
                return realMsgpack.encode(msgStr);
            }
            console.warn('[NetManager] msgpack.encode failed:', err);
            throw new Error('Message packing failed');
        }
    }

    /**
     * 生成消息头
     * @param bodyData 消息体数据
     * @returns 生成的消息头字符串
     */
    private generateHead(bodyData: Uint8Array): string {
        try {
            const msgLen = bodyData.length;
            const len = App.CommonUtils.jsToCByShort(msgLen);
            const time = App.CommonUtils.jsToCByInt(Math.floor(this.curtime / 1000)); // 毫秒转秒
            const checkSum = this.getCheckSum(bodyData, msgLen);

            return len + checkSum + time;
        } catch (error) {
            console.warn('Failed to generate head:', error);
            throw new Error('Head generation failed');
        }
    }

    /**
     * 链接消息头和消息体
     * @param headData 消息头数据
     * @param bodyDataBuf 消息体数据缓冲区
     * @returns 完整的消息数据
     */
    private linkHeadBody(headData: string, bodyDataBuf: Uint8Array): Uint8Array {
        try {
            const headLen = headData.length;
            const bodyLen = bodyDataBuf.length;
            const uint8Array = new Uint8Array(headLen + bodyLen);

            // 写入头部数据
            for (let i = 0; i < headLen; i++) {
                uint8Array[i] = headData.charCodeAt(i);
            }

            // 写入体部数据
            uint8Array.set(bodyDataBuf, headLen);

            return uint8Array;
        } catch (error) {
            console.warn('Failed to link head and body:', error);
            throw new Error('Head-body linking failed');
        }
    }    /**
     * 计算校验和
     * @param bodyData 消息体数据
     * @param msgLen 消息长度
     * @returns 校验和字符串
     */
    private getCheckSum(bodyData: Uint8Array, msgLen: number): string {
        try {
            const len = Math.min(msgLen, 128); // 最多计算128字节
            const src = App.CommonUtils.srcSum(Array.from(bodyData), len);
            return App.CommonUtils.jsToCByShort(src);
        } catch (error) {
            console.warn('Failed to calculate checksum:', error);
            throw new Error('Checksum calculation failed');
        }
    }    /**
     * 显示网络错误UI
     * @param msgid 消息ID，可选
     */
    private showNetErrorUI(msgid: number | null = null): void {

        let bPlaying = App.SubGameManager.isInGame();
        // if (cc.vv.NetCacheMgr) {
        //     bPlaying = cc.vv.NetCacheMgr.isPlayingGame()
        // }
        if (bPlaying) {
            this.showNetTipType(2)
            // //TODO游戏内断网退出到大厅其实体验不好
            // //先按需求做吧
            // let bHasCacheHall = cc.vv.NetCacheMgr.isCacheHall()
            // if(bHasCacheHall){
            //     //如果大厅缓存了数据
            //     this.kickToHall()
            // }
            // else{
            //     //在游戏内，没有缓存大厅提示重联
            //     this.showNetTipType(2)
            // }


        }
        else {
            //在大厅中就不给提示
            //是否在需要提示断开的列表中
            // let bInNeddTip = cc.vv.NetCacheMgr.isMsgIdNeedPop(msgid)
            // if (bInNeddTip) {
            //     this.showNetTipType(2)
            // }
        }

    }    /**
     * 显示网络提示类型
     * @param showType 提示类型：1-小的网络图标，2-大的网络提示
     */
    public showNetTipType(showType: number): void {
        let self = this
        if (showType == 1) {
            //显示小的网络图标
            let curName = App.SceneUtils.getCurSceneName() //项目需求：在启动和大厅加载界面不显示
            if (curName != Config.SCENE_NAME.LAUNCH && curName != Config.SCENE_NAME.HALL_PRELOAD) {
                App.AlertManager.getLoadingTip().show();
            }
        }
        // else if (showType == 2) {
        //     //显示大的网络提示
        //     let url = 'BalootClient/BaseRes/prefabs/network_error'
        //     App.ResUtils.getPrefab(url).then((prefab) => {
        //         App.AlertManager.getLoadingTip().hideAll();
        //         let curScene = director.getScene()
        //         let old = curScene.getChildByName('network_error')
        //         if (!old) {
        //             let node = cc.instantiate(prefab);
        //             node.parent = curScene;
        //             let endCall = function () {
        //                 self.reconnect()
        //             }
        //             node.getComponent('NetworkTip').showUI(endCall)
        //         }
        //     });

        // }
    }
    /**
     * 隐藏网络提示
     */
    hideNetTip(): void {
        App.AlertManager.getLoadingTip().hideAll();
    }
    /**
     * 踢出游戏到大厅
     */
    private kickToHall(): void {
        App.AlertManager.getCommonAlert().showWithoutCancel("Connection lost, return to lobby!", () => {
            App.EventUtils.dispatchEvent(App.EventID.ENTER_HALL);
        });
    }

    /**
     * 检查是否需要回到登录界面
     */
    private checkNeedGoLoginUI(): void {
        const currentScene = director.getScene();
        const isInLoginScene = currentScene?.name === Config.SCENE_NAME.LOGIN;

        if (isInLoginScene) {
            App.GameManager.goBackLoginScene();
        }
    }    /**
     * 启动心跳机制
     * WebSocket连接状态: CONNECTING=0 OPEN=1 CLOSING=2 CLOSED=3
     */
    private hearBeat(): void {
        if (!this.isConnect()) {
            console.warn('未连接到WebSocket，停止启动心跳');
            return;
        }
        this.stopHearBeat();

        try {
            this.lastHearBeatTime = this.curtime;
            this.heartBeatHandlerRef = () => this.pong();
            // 使用 registerMsg 普通优先级即可（按需调整）
            this.registerMsg(App.MessageID.HEARTBEAT, this.heartBeatHandlerRef);

            this.hearBeatIntervalIdx = setInterval(() => {
                this.ping();
            }, this.hearBeatInterval);

            console.log('心跳机制已启动');
        } catch (e) {
            console.warn('启动心跳失败:', e);
        }
    }

    /**
     * 停止心跳机制
     */
    private stopHearBeat(): void {
        if (this.hearBeatIntervalIdx) {
            clearInterval(this.hearBeatIntervalIdx);
            this.hearBeatIntervalIdx = null;

            // 注销心跳消息监听
            this.unregisterMsg(App.MessageID.HEARTBEAT);

            // 重置网络状态指标
            this.curReplyInterval = 0;
            this.lastReplyInterval = 520; // 表示网络差

            console.log('心跳机制已停止');
        }
    }

    /**
     * 发送心跳包（ping）
     */
    private ping(): void {
        if (!this.isConnect()) {
            console.warn('连接已断开，停止发送心跳');
            this.stopHearBeat();
            return;
        }

        this.curReplyInterval = 0; // 重置当前回复间隔

        const success = this.send({ c: App.MessageID.HEARTBEAT }, true);
        if (!success) {
            console.warn('心跳包发送失败');
        }
    }

    /**
     * 处理心跳回复（pong）
     */
    private pong(): void {
        this.lastHearBeatTime = this.curtime;

        // 使用指数移动平均计算网络延迟
        const filter = 0.2; // 平滑系数，防止单次延迟造成的剧烈变化
        this.lastReplyInterval = this.lastReplyInterval * filter + this.curReplyInterval * (1 - filter);

        // 如果网络延迟过大，额外发送一次心跳检测
        if (this.curReplyInterval > 500) {
            console.warn(`网络延迟较高: ${this.curReplyInterval}ms，将在2秒后重新检测`);
            setTimeout(() => {
                if (this.isConnect()) {
                    this.ping();
                }
            }, 2000);
        }
    }

    /**
     * 获取网络延迟时间间隔
     * @returns 延迟时间（毫秒）
     */
    getNetworkInterval(): number {
        return Math.round(this.lastReplyInterval);
    }

    /**
     * 获取网络信号强度等级
     * @returns 网络等级：0-无信号，1-弱，2-有延迟，3-很好
     */
    getNetworkLevel(): number {
        const interval = this.lastReplyInterval;

        if (interval <= 100) return 3;      // 很好
        if (interval <= 500) return 2;      // 有延迟  
        if (interval <= 1000) return 1;     // 弱
        return 0;                           // 无信号
    }

    /**
     * 获取网络状态描述
     * @returns 网络状态文本描述
     */
    getNetworkStatusText(): string {
        const level = this.getNetworkLevel();
        const statusMap = ['无信号', '网络较差', '网络一般', '网络良好'];
        return statusMap[level] || '未知';
    }/**
     * 请求数据并进行缓存
     * @param parm 请求参数
     * @param isNotShowShield 是否不显示加载遮罩
     * @param cache 是否使用缓存
     */
    sendAndCache(parm: PartialNetworkMessage, isNotShowShield: boolean = true, cache: boolean = false): void {
        if (!parm?.c) {
            console.warn('sendAndCache: parm must have command ID');
            return;
        }

        try {
            // 获取缓存对象
            let cacheObj = this.getCacheObj(parm);

            // 如果不存在则创建一个
            if (!cacheObj) {
                // 构建缓存对象
                cacheObj = {
                    parm: App.SystemUtils.copy(parm),
                    timestamp: Date.now()
                };

                // 定义缓存处理回调
                cacheObj.callback = (msg: NetworkMessage) => {
                    if (msg.code !== 200) return;
                    if ((msg as any).spcode && (msg as any).spcode > 0) return;
                    // 确定请求ID是否一致
                    if (cacheObj!.c_idx === msg.c_idx) {
                        cacheObj!.msg = App.SystemUtils.copy(msg) as NetworkMessage;
                        console.log("缓存消息已更新", msg.c);
                    }
                };

                // 注册缓存处理函数
                if (cacheObj.callback && parm.c) {
                    this.registerMsg(parm.c, cacheObj.callback, this, true);
                }

                // 放入缓存池
                this.cacheList.push(cacheObj);
            }

            // 记录当前请求ID
            cacheObj.c_idx = this.idx;

            if (cache) {
                parm.cache = 1;
                this.cacheIdxList.push(cacheObj.c_idx);
            }
            // 发送请求
            this.send(parm, isNotShowShield);

            // 查看缓存并模拟一次缓存回包
            if (cacheObj.msg) {
                if (!App.DeviceUtils.isNative()) {
                    console.log("%c cache(%d): %o",
                        "background: rgb(51, 255, 102);color:#9932cd;font-weight:bold;",
                        cacheObj.c_idx, cacheObj.msg);
                }

                // 创建缓存消息副本并标记为缓存消息
                const cachedMsg = { ...cacheObj.msg, c_idx: -1 };
                this.handleMsg(cachedMsg);
            }
        } catch (error) {
            console.warn('Error in sendAndCache:', error);
        }
    }

    /**
     * 在缓存中获取数据
     * @param parm 请求参数
     * @returns 缓存的消息数据
     */
    getMsgInCache(parm: PartialNetworkMessage): NetworkMessage | null {
        const cacheObj = this.getCacheObj(parm);
        return cacheObj?.msg || null;
    }

    /**
     * 获取缓存对象
     * @param parm 请求参数
     * @returns 缓存对象或null
     */
    private getCacheObj(parm: PartialNetworkMessage): CacheObject | null {
        for (const cacheObj of this.cacheList) {
            if (this.isObjectValueEqual(parm, cacheObj.parm)) {
                return cacheObj;
            }
        }
        return null;
    }

    /**
     * 深度比较两个对象是否相等
     * @param a 对象A
     * @param b 对象B
     * @returns 是否相等
     */
    private isObjectValueEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return a === b;

        const aProps = Object.getOwnPropertyNames(a);
        const bProps = Object.getOwnPropertyNames(b);

        // 判断key数量是否一致
        if (aProps.length !== bProps.length) return false;

        // 递归判断值的内容是否一致
        for (const propName of aProps) {
            const propA = a[propName];
            const propB = b[propName];

            if (typeof propA === 'object' && propA !== null) {
                if (!this.isObjectValueEqual(propA, propB)) {
                    return false;
                }
            } else if (propA !== propB) {
                return false;
            }
        }

        return true;
    }

    /**
     * 判断是否存在缓存
     * @param parm 请求参数
     * @returns 是否存在缓存
     */
    hasCache(parm: PartialNetworkMessage): boolean {
        const cacheObj = this.getCacheObj(parm);
        return !!(cacheObj?.msg);
    }

    /**
     * 进行缓存请求
     * @param parm 请求参数
     */
    cache(parm: PartialNetworkMessage): void {
        if (!this.hasCache(parm)) {
            this.sendAndCache(parm, true, true);
        }
    }

    /**
     * 清理过期缓存
     * @param maxAge 最大缓存时间（毫秒），默认30分钟
     */
    clearExpiredCache(maxAge: number = 30 * 60 * 1000): void {
        const now = Date.now();
        this.cacheList = this.cacheList.filter(cacheObj => {
            const isExpired = cacheObj.timestamp && (now - cacheObj.timestamp) > maxAge;
            if (isExpired && cacheObj.parm.c && cacheObj.callback) {
                // 注销过期缓存的消息监听
                this.unregisterMsg(cacheObj.parm.c, cacheObj.callback, true, this);
            }
            return !isExpired;
        });
    }

    /**
     * 异步发送请求
     * @param params 请求参数
     * @returns Promise<NetworkMessage>
     */
    asyncSend(params: NetworkMessage): Promise<NetworkMessage> {
        return new Promise((resolve, reject) => {
            if (!params?.c) {
                reject(new Error('Message must have command ID'));
                return;
            }

            // 设置超时处理
            const timeout = setTimeout(() => {
                this.unregisterMsg(params.c, callback);
                reject(new Error(`Request timeout for command ${params.c}`));
            }, 10000); // 10秒超时

            // 注册监听
            const callback = (msg: NetworkMessage) => {
                clearTimeout(timeout);
                resolve(msg);
                // 移除监听
                this.unregisterMsg(params.c, callback);
            };

            try {
                this.registerMsg(params.c, callback);

                if (!this.send(params)) {
                    clearTimeout(timeout);
                    this.unregisterMsg(params.c, callback);
                    reject(new Error(`Failed to send message for command ${params.c}`));
                }
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * 获取网络管理器统计信息
     * @returns 统计信息对象
     */
    getNetworkStats(): {
        isConnected: boolean;
        connectionStatus: string;
        networkLevel: number;
        networkDelay: number;
        reconnectCount: number;
        handlerCount: number;
        cacheCount: number;
        lastHeartbeat: string;
    } {
        return {
            isConnected: this.isConnect(),
            connectionStatus: this.getConnectionStatus(),
            networkLevel: this.getNetworkLevel(),
            networkDelay: this.getNetworkInterval(),
            reconnectCount: this.autoConnectCount,
            handlerCount: Object.keys(this.handlers).length + Object.keys(this.handlersHigh).length,
            cacheCount: this.cacheList.length,
            lastHeartbeat: new Date(this.lastHearBeatTime).toLocaleString()
        };
    }

    /**
     * 打印网络调试信息
     */
    printDebugInfo(): void {
        const stats = this.getNetworkStats();
        console.group('NetManager Debug Info');
        console.log('📡 Connection Status:', stats.connectionStatus);
        console.log('🌐 Network Level:', stats.networkLevel, `(${this.getNetworkStatusText()})`);
        console.log('⏱️ Network Delay:', stats.networkDelay + 'ms');
        console.log('🔄 Reconnect Count:', stats.reconnectCount);
        console.log('📝 Message Handlers:', stats.handlerCount);
        console.log('💾 Cache Count:', stats.cacheCount);
        console.log('💓 Last Heartbeat:', stats.lastHeartbeat);
        console.log('📍 Server Address:', this.address);
        console.groupEnd();
    }

    /**
     * 获取消息处理器信息
     * @returns 处理器信息
     */
    getHandlerInfo(): { [cmd: string]: { normal: number; high: number } } {
        const info: { [cmd: string]: { normal: number; high: number } } = {};

        // 统计普通优先级处理器
        for (const [cmd, handlers] of Object.entries(this.handlers)) {
            if (!info[cmd]) info[cmd] = { normal: 0, high: 0 };
            info[cmd].normal = handlers?.length || 0;
        }

        // 统计高优先级处理器
        for (const [cmd, handlers] of Object.entries(this.handlersHigh)) {
            if (!info[cmd]) info[cmd] = { normal: 0, high: 0 };
            info[cmd].high = handlers?.length || 0;
        }

        return info;
    }

    /**
     * 清除所有消息处理器
     * @param cmd 可选，指定要清除的命令ID
     */
    clearAllHandlers(cmd?: number): void {
        if (cmd !== undefined) {
            const cmdKey = String(cmd);
            delete this.handlers[cmdKey];
            delete this.handlersHigh[cmdKey];
            console.log(`Cleared all handlers for cmd: ${cmd}`);
        } else {
            this.handlers = {};
            this.handlersHigh = {};
            console.log('Cleared all message handlers');
        }
    }

    /**
     * 批量注册消息处理器
     * @param handlerMap 处理器映射表
     * @param target 目标对象
     * @param priority 优先级
     */
    registerMultipleMsg(
        handlerMap: { [cmd: number]: Function },
        target: any = null,
        priority: 'normal' | 'high' = 'normal'
    ): void {
        for (const [cmd, handler] of Object.entries(handlerMap)) {
            const cmdNum = parseInt(cmd);
            if (!isNaN(cmdNum) && typeof handler === 'function') {
                this.registerMsg(cmdNum, handler, target, priority === 'high');
            }
        }
    }

    /**
     * 发送带重试机制的消息
     * @param msgDic 消息对象
     * @param maxRetries 最大重试次数
     * @param retryDelay 重试延迟（毫秒）
     * @returns Promise<boolean>
     */
    async sendWithRetry(
        msgDic: NetworkMessage,
        maxRetries: number = 3,
        retryDelay: number = 1000
    ): Promise<boolean> {
        let attempts = 0;

        while (attempts < maxRetries) {
            if (this.send(msgDic)) {
                return true;
            }

            attempts++;
            if (attempts < maxRetries) {
                console.warn(`Message send failed, retrying... (${attempts}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                // 如果网络断开，尝试重连
                if (!this.isConnect() && this.address) {
                    await new Promise(resolve => {
                        this.connect(this.address, resolve);
                    });
                }
            }
        }

        console.warn(`Failed to send message after ${maxRetries} attempts`);
        return false;
    }
}


