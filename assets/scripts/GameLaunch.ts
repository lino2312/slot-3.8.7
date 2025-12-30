import { _decorator, assetManager, Component, director, game, macro, Node, ProgressBar, ResolutionPolicy, screen, sys, native, tween, UITransform, Vec3, view, Label } from 'cc';
import { App } from 'db://assets/scripts/App';
import { Config } from 'db://assets/scripts/config/Config';
import HotUpdate from 'db://assets/scripts/hotupdate/HotUpdate';
const { ccclass, property } = _decorator;

@ccclass('GameLaunch')
export class GameLaunch extends Component {
    @property(ProgressBar)
    public progressBar: ProgressBar = null;

    @property(Node)
    public coinAnimationNode: Node = null;
    @property(Node)
    public hotupdateNode: Node = null;
    @property(Node)
    public hotupdateTips: Node = null;
    @property(Label)
    public hotupdateTipsText: Label = null;

    private maxCoinX: number = 0;
    private coinStartX: number = 0;
    private coinWidth: number = 30;
    private currentTween: any = null; // 存储当前动画实例
    private progressQueue: Array<{ value: number, duration: number, onComplete?: () => void }> = []; // 进度队列
    private isAnimating: boolean = false; // 是否正在执行动画

    /** 设计宽度 */
    private _designWidth: number = 1080;

    /** 设计高度 */
    private _designHeight: number = 1920;

    /** 最大宽高比 */
    private _limitMax: number = 1080 / 1920;

    /** 最小宽高比 */
    private _limitMin: number = 0.1;

    /** 当前宽高比 */
    private _curAspectRatio = 1080 / 1920;

    /** 当前适配状态 */
    private _curResolutionPolicy = -1;

    /** 变化标识 */
    private _isDesignResolutionDrity = false;

    private hotupdateProgressValue: Array<number> = []; // 热更新进度队列




    onLoad() {
        macro.ENABLE_MULTI_TOUCH = false;
        // 关闭 FPS 显示
        if (typeof (director as any).setDisplayStats === 'function') {
            (director as any).setDisplayStats(false);
        }
        Config.resVersion = App.StorageUtils.getLocal('c_resv', Config.resVersion);

        this.ensureUIRefs();

        if (this.coinAnimationNode) {
            this.coinStartX = this.coinAnimationNode.position.x;
            // 触发一次位置写入，避免某些平台首次不刷新
            this.coinAnimationNode.position = this.coinAnimationNode.position.clone().add(new Vec3(1, 0, 0));
        }
        if (this.progressBar) {
            const ui = this.progressBar.node.getComponent(UITransform);
            if (ui) {
                this.maxCoinX = this.progressBar.node.position.x + ui.width / 2 - this.coinWidth; // 减去金币宽度
            }
        } else {
            console.warn('[GameLaunch] progressBar is not bound. Progress UI will be skipped.');
        }
        this._updateDesignResolution();
    }


    /** 更新分辨率适配 */
    private _updateDesignResolution() {
        //获取当前显示框大小
        let viewRect = screen.windowSize;
        //计算宽高比变化
        if (viewRect.width <= viewRect.height) {
            this._curAspectRatio = viewRect.width / viewRect.height;
        } else {
            this._curAspectRatio = viewRect.height / viewRect.width;
        }

        //计算适配方案
        let targetResolutionPolicy = null;
        if (this._curAspectRatio >= this._limitMax) {
            targetResolutionPolicy = 0;
        } else if (this._curAspectRatio <= this._limitMin) {
            targetResolutionPolicy = 2;
        } else {
            targetResolutionPolicy = 1;
        }
        if (this._curResolutionPolicy != targetResolutionPolicy) {
            //
            this._curResolutionPolicy = targetResolutionPolicy;
            //设置变化标识
            this._isDesignResolutionDrity = true;
        }
    }

    update() {
        //更新适配方案
        if (this._isDesignResolutionDrity) {
            if (this._curResolutionPolicy == 0) {
                view.setDesignResolutionSize(this._designWidth, this._designWidth / this._limitMax, ResolutionPolicy.SHOW_ALL);
                console.error("ResolutionPolicy.0", screen.windowSize);
            } else if (this._curResolutionPolicy == 2) {
                view.setDesignResolutionSize(this._designWidth, this._designWidth / this._limitMin, ResolutionPolicy.SHOW_ALL);
                console.error("ResolutionPolicy.2", screen.windowSize);
            } else {
                console.error("ResolutionPolicy.1", screen.windowSize);
                view.setDesignResolutionSize(this._designWidth, this._designHeight, ResolutionPolicy.FIXED_WIDTH);
            }
            this._isDesignResolutionDrity = false;
        }
    }


    onDestroy() {
        this.clearProgressQueue();
    }

    private ensureUIRefs() {
        if (!this.progressBar) {
            const n = this.node.getChildByName('ProgressBar');
            this.progressBar = n?.getComponent(ProgressBar) || null;
        }
        if (!this.coinAnimationNode) {
            this.coinAnimationNode = this.node.getChildByName('Coin') || null;
        }
    }

    start() {
        this.scheduleOnce(() => {
            this.init();
        }, 0.01);

    }

    /**
     * 检查热更新
     */
    private async checkHotUpdate(): Promise<void> {
        console.log('[GameLaunch] 开始检查热更新');
        try {
            const hotUpdateComponent = this.hotupdateNode.getComponent(HotUpdate);
            hotUpdateComponent.onProgressCallback = (progress: number,downloadedBytes: number,totalBytes: number) => {
                // 这里接收的 progress 已经是 0~70，需要换算成总进度（例如转为 0~100 的比例）
                this.hotupdateTips.active = true;
                const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
                const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
                console.log(`[GameLaunch] 热更新进度: ${progress}%，已下载: ${downloadedMB}MB / ${totalMB}MB`);
                this.setHotupdateProgress(progress);
                let progressValue = Math.floor(progress);
                this.hotupdateTipsText.string = `${progressValue}% (${downloadedMB}MB/${totalMB}MB)`;
            };
            if (!hotUpdateComponent) {
                console.error('[GameLaunch] 热更新组件未找到');
                return;
            }

            console.log('[GameLaunch] 调用热更新检查版本');

            this.hotupdateTipsText.node.active = true;
            const result = await hotUpdateComponent.checkVersion();
            console.log('[GameLaunch] 热更新检查完成', { result });

            this.setProgressPercentQueued(70, 0.2);
            console.log('[GameLaunch] 热更新完成，开始游戏登录流程');
            this.hotupdateTips.active = false;
            this.hotupdateTipsText.node.active = false;
            assetManager.loadBundle('hall', async (err, hallBundle) => {
                if (err) {
                    console.error('加载 hall bundle 失败:', err);
                    return;
                }
                App.GameManager.setHallBundle(hallBundle);
                console.log('大厅Bundle加载完成（Web模式）');
                this.setProgressPercentQueued(70, 0.2);
                await this.handleGameLogin();
                await this.handleYaCaiLogin();
                this.setProgressPercentQueued(100, 0.3);
                console.log('[GameLaunch] 游戏初始化完成');
            });
        } catch (error) {
            console.error('[GameLaunch] 热更新失败:', error);
            console.error('[GameLaunch] 错误详情:', {
                message: error?.message,
                stack: error?.stack
            });
        }
    }

    async init() {
        // this.setProgressPercentQueued(10, 0.1);
        this.initManager();

        // this.setProgressPercentQueued(20, 0.2);
        await this.initHttpData(); // 等待HTTP请求完成
        // this.setProgressPercentQueued(30, 0.2);
        this.getFbcId();

        if (App.DeviceUtils.isNative()) {
            console.log('[GameLaunch] 开始检查热更新');
            this.checkHotUpdate();
        } else {
            console.log('[GameLaunch] 开始加载 hall bundle（Web模式）');
            this.setProgressPercentQueued(10, 0.1);
            assetManager.loadBundle('hall', async (err, hallBundle) => {
                if (err) {
                    console.error('加载 hall bundle 失败:', err);
                    return;
                }
                App.GameManager.setHallBundle(hallBundle);
                console.log('大厅Bundle加载完成（Web模式）');
                this.setProgressPercentQueued(70, 0.2);
                await this.handleGameLogin();
                await this.handleYaCaiLogin();
                this.setProgressPercentQueued(100, 0.3);
            });
        }
        // this.goToNextScene();
    }

    /**
     * Bundle 加载后的后续流程
     */
    private async _continueAfterBundleLoad(hallBundle: any): Promise<void> {
        try {
            this.setProgressPercentQueued(70, 0.2);
            await this.handleGameLogin();
            await this.handleYaCaiLogin();
            this.setProgressPercentQueued(100, 0.3);
            console.log('[GameLaunch] 游戏初始化完成');
        } catch (error) {
            console.error('[GameLaunch] 后续流程执行失败:', error);
            console.error('[GameLaunch] 错误详情:', {
                message: error?.message,
                stack: error?.stack
            });
        }
    }


    private async handleGameLogin() {
        let autoLoginReq = App.StorageUtils.getLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, '');
        let bP1Info = App.StorageUtils.getLocal("P1");
        console.log('API下发登陆信息,首次登陆协议2')

        if (bP1Info != '') {
            App.GameManager.loginByUid(JSON.parse(bP1Info));
        } else {
            if (autoLoginReq != '' && Config.openAutoLogin) {
                //直接自动登陆
                console.log('通过本地登陆信息自动登陆');
                App.GameManager.relogin(true)
            } else {
                //游客自动登录 - 正确处理异步调用
                console.log('游客自动登录');
                await App.GameManager.autoTravellerLogin();
            }
        }
    }

    private async handleYaCaiLogin() {
        let yc_username = App.StorageUtils.getLocal('yc_username', "");
        let yc_pwd = App.StorageUtils.getLocal('yc_pwd', "");

        if (yc_username.length > 0 && yc_pwd.length > 0) {
            await App.ApiManager.yaCaiLogin(yc_username, yc_pwd);
        } else {
            let ycGuest_username = App.StorageUtils.getLocal('ycGuest_username', "");
            let ycGuest_pwd = App.StorageUtils.getLocal('ycGuest_pwd', "");
            if (ycGuest_username.length > 0 && ycGuest_pwd.length > 0) {
                await App.ApiManager.guestLogin(ycGuest_username);
            }
        }
    }

    //需按照导入顺序初始化
    initManager() {
        App.GameManager.init();
        App.PayManager.init();
        // App.StorageUtils.clearLocal(); 
    }

    async initHttpData() {
        try {
            const [registerState, homeSettings] = await Promise.all([
                App.ApiManager.registerState(),
                App.ApiManager.getHomeSettings()
            ]);
            this.generalClientuuid();
            console.log('registerState=', registerState);
            console.log('homeSettings=', homeSettings);
        } catch (error) {
            console.warn('Error during initHttpData:', error);
        }
    }

    getFbcId() {
        let fbcId = App.StorageUtils.getLocal('fbcId', '');
        if (fbcId == '') {
            let invitationCode = "";
            if (App.DeviceUtils.isNative()) {
                let clipboardText = App.PlatformApiMgr.getTxtFromClipboard() || "";

                console.log("原始剪贴板内容", clipboardText);

                // 清理前缀等号、多余空格
                clipboardText = clipboardText.replace(/^=+/, '').trim();

                // 拆分参数（支持 invitationCode=xxx&fbcId=yyy）
                clipboardText.split("&").forEach(param => {
                    const [keyRaw, valueRaw] = param.split("=");
                    if (!keyRaw || !valueRaw) return;

                    const key = keyRaw.trim().toLowerCase();
                    const value = valueRaw.trim();

                    if (key === "invitationcode") {
                        invitationCode = value;
                    } else if (key === "fbcid") {
                        fbcId = value;
                    }
                });

                console.log("invitationCode =", invitationCode);
                console.log("fbcId =", fbcId);
                App.userData().invitationCode = invitationCode;
                App.userData().fbcId = fbcId;
                if (!fbcId) {
                    fbcId = App.SystemUtils.generateFBP();
                }
                App.StorageUtils.saveLocal('fbcId', fbcId);
            }
        }
    }

    //生成客户端ID
    generalClientuuid() {
        //生成一个唯一标识码
        //如果没有本地的client_uuid,才取新的, 或者没有登陆过
        let preLoginStr = App.StorageUtils.getLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, '')
        if (App.StorageUtils.getLocal('client_uuid') == '' || preLoginStr == '') {
            let did = (new Date()).getTime() + App.MathUtils.random(1, 9999999);
            App.StorageUtils.saveLocal('client_uuid', '' + did);
        }
    }

    // 队列版本的 setProgress，确保按顺序执行
    setProgressQueued(value: number, duration: number = 0.3, onComplete?: () => void) {
        console.log(`[GameLaunch] setProgressQueued called with value: ${value}, duration: ${duration}`);
        if (!this.progressBar && !this.coinAnimationNode) {
            onComplete?.();
            return;
        }
        this.progressQueue.push({ value, duration, onComplete });
        this.processProgressQueue();
    }

    setHotupdateProgress(progress: number) {
        const normalizedValue = Math.max(0, Math.min(1, progress / 100));
        if (this.progressBar) {
            // 这里添加日志
            console.log(`[GameLaunch] setHotupdateProgress called. progress =`, progress);
            this.progressBar.progress = normalizedValue;
        }
        // 根据进度移动 coinAnimationNode 位置、显示进度、100%时 x 坐标为 388
        if (this.coinAnimationNode) {
            // 进度百分比，进度为 1 时 x = 388，进度为 0 时 x = coinStartX
            // 当前 coinStartX 为初始 x 坐标
            let startX = this.coinStartX;
            let endX = 388;
            let curProgress = Math.max(0, Math.min(1, normalizedValue));
            let newX = startX + (endX - startX) * curProgress;
            // setPosition, y/z 保持不变
            console.log(`[GameLaunch] setHotupdateProgress called. newX =`, newX);
            this.coinAnimationNode.setPosition(newX, this.coinAnimationNode.position.y, this.coinAnimationNode.position.z);
        }
    }

    // 处理进度队列
    private processProgressQueue() {
        if (this.isAnimating || this.progressQueue.length === 0) return;

        this.isAnimating = true;
        const { value, duration, onComplete } = this.progressQueue.shift()!;

        const normalizedValue = Math.max(0, Math.min(1, value));

        // 没有进度条时，仅驱动金币；没有金币时，仅驱动进度条
        const curProgress = this.progressBar ? this.progressBar.progress : 0;
        const curCoinX = this.coinAnimationNode ? this.coinAnimationNode.position.x : 0;

        const targetXBase = (this.progressBar && this.coinAnimationNode)
            ? this.coinStartX + (this.maxCoinX - this.coinStartX) * normalizedValue
            : curCoinX;
        const clampedX = Math.min(Math.max(targetXBase, this.coinStartX), this.maxCoinX) - this.coinWidth;

        const animData = {
            progress: curProgress,
            coinX: curCoinX,
        };

        this.currentTween = tween(animData)
            .to(duration, {
                progress: normalizedValue,
                coinX: clampedX,
            }, {
                onUpdate: () => {
                    if (this.progressBar) {
                        this.progressBar.progress = animData.progress;
                    }
                    if (this.coinAnimationNode) {
                        this.coinAnimationNode.setPosition(
                            animData.coinX,
                            this.coinAnimationNode.position.y,
                            this.coinAnimationNode.position.z
                        );
                    }
                },
                onComplete: () => {
                    this.currentTween = null;
                    this.isAnimating = false;
                    onComplete?.();
                    this.processProgressQueue();
                },
                easing: 'smooth'
            })
            .start();
    }

    // 便捷方法：直接使用百分比值 (0-100)
    setProgressPercentQueued(percent: number, duration: number = 0.3, onComplete?: () => void) {
        const normalizedValue = Math.max(0, Math.min(1, percent / 100));
        this.setProgressQueued(normalizedValue, duration, onComplete);
    }

    // 清空进度队列
    clearProgressQueue() {
        this.progressQueue = [];
        if (this.currentTween) {
            try { this.currentTween.stop(); } catch { }
            this.currentTween = null;
        }
        this.isAnimating = false;
    }



}
