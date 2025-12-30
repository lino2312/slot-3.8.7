import { PosData } from "../Base/GameGlobalDefine";
import Utils from "../Base/MyUtils";
import SlotsBottom from "./SlotsBottom";
import SlotGameMsgMgr from "./SlotsGameMsgMgr";
import SlotsTop from "./SlotsTop";
import { Node, Component, Prefab, instantiate } from 'cc';

export interface PlayerInfo {
    uid: number,
    userName: string,
    score: number,
    headIcon?: string,
    seat?: number,
}

export interface SlotMapIndex {
    [index:string]:{}
}

// spin地图数据
export interface SlotMapInfo {
    [index:string]:{type:number},
}

// spin中奖符号数据
export interface SlotRewardTypeInfo {
    [type:number]:PosData[],
}

// spin中奖线数据
export interface SlotRewardLineInfo {
    list: PosData[],
    winScore: number,
}

// 动态弹框配置
export interface TopViewConfig {
    prefabName?: string,        // 预制体名称
    prefabPath?: string,        // 预制体路径
    ndParent: Node,          // 弹框父节点
    ndMask?: Node,           // 底部遮罩节点
    viewScript: string,         // 弹框脚本名
    viewLevel?:number,          // 弹框层级
    loadFunction?: string,      // 弹框加载调用接口
    isWaitting?: boolean,       // 弹框是否在创建中
    ndView?: Node,           // 弹框节点
    data?: any
}

// spin结果数据
export interface SlotSpinMsgData {
    mapInfo: SlotMapInfo, // 地图数据
    rewardList?: PosData[],
    rewardTypeInfo?: SlotRewardTypeInfo, // 中奖符号数据
    rewardLineInfo?: SlotRewardLineInfo[], // 中奖线列表
    winScore: number, // 中奖金额
}

// slot状态
export enum SlotStatus {
    idle, // 空闲。(所有按钮可以点击)
    moveing_1, // 旋转，结果还未返回。(所有按钮不可点击,spin按钮灰态)
    moveing_2, // 旋转，结果已经返回。(其它按钮不可点击,stop按钮可以点击)
    stoped, // 停止，但是还在播放加钱。(此时spin亮起来，其他按钮是灰态)
    unstoped, // 不能停止的操作。（stop按钮是灰态，其他按钮是灰态）
    skipSpin, // 跳过开奖动画
    waitSpin, // 等待下一轮spin
}

export default class SlotGameData {

    static BUNDLE_NAME = ''; // 游戏模块名

    static IS_SINGLE_MODLE = false; // 单机模式

    static ENGINE_TIMESCALE = 1; // 时间加速

    static AUTO_INFINITE_TIMES = -1; // 自动无限次

    static BET_LIST = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]; // 当前押注列表
    static SPEED_LIST = ['1.0x', '2.0x']; // 当前速度挡位列表
    static AUTO_LIST = [20, 50, 100, 500, -1]; // 当前自动次数列表

    static scriptMsgMgr: SlotGameMsgMgr = null; // 游戏消息通讯脚本
    static scriptGame = null; // 游戏主界面脚本
    static scriptTop: SlotsTop = null; // 游戏顶部栏脚本
    static scriptBottom: SlotsBottom = null; // 游戏底部栏脚本
    static scriptSlots = null; // 游戏slot脚本
    static scriptWheel = null; // 游戏wheel脚本
    static scriptSpinOptions = null; // 游戏spin设置项脚本
    
    // 玩家信息
    static playerInfo: PlayerInfo = {
        uid: 0,
        userName: "",
        score: 0
    };

    static curBetIndex = 0; // 当前押注索引
    static curBetList = SlotGameData.BET_LIST; // 当前押注列表

    static curSpeedIndex = 0; // 当前速度挡位索引
    static curSpeedList = SlotGameData.SPEED_LIST; // 当前速度挡位列表

    static curAutoIndex = 0; // 当前自动次数索引
    static curAutoList = SlotGameData.AUTO_LIST; // 当前自动次数列表

    static totalAutoTimes = 0; // 自动旋转次数
    static autoTimes = 0; // 已自动旋转次数
    static isAutoMode = false; // 自动模式

    static totalRespinTimes = 0; // 重摇旋转次数
    static respinTimes = 0; // 已重摇旋转次数
    static isRespinMode = false; // 重摇模式

    static totalFreeTimes = 0; // 免费旋转次数
    static freeTimes = 0; // 已免费旋转次数
    static isFreeMode = false; // 免费模式
    static isFreeInFreeMode = false; // 免费模式下中免费

    static totalWinScore: number; // 总中奖金额

    static curRollingIndex = 0; // 当前滚动次数索引

    static isResetNextWinNum = true; // 是否重置下一局中奖金额显示

    static nextSpinDelayTime = 0.3; // 准备下一轮旋转延迟时间

    static slotState = SlotStatus.idle; // 旋转状态

    static isSlotReady = true; // 是否准备就绪

    static isSlotSpinBtnShowByWin = false; // 滚动是否显示spin

    static buyDouble = false; // 是否准备就绪

    static dynamicLoadViewList: {[key:string]:TopViewConfig} = {}; // 动态弹框界面配置

    static clickSpinAudio = ""; // 点击spin音效

    static isTest = false; // 是否测试开始

    // 初始化数据
    static init () {
        this.curBetIndex = 0;
        this.curBetList = SlotGameData.BET_LIST;

        this.curSpeedIndex = 0;
        this.curSpeedList = SlotGameData.SPEED_LIST;

        this.curAutoIndex = 0;
        this.curAutoList = SlotGameData.AUTO_LIST;

        this.totalAutoTimes = 0;
        this.autoTimes = 0;
        this.isAutoMode = false;

        this.totalRespinTimes = 0;
        this.respinTimes = 0;
        this.isRespinMode = false;

        this.totalFreeTimes = 0;
        this.freeTimes = 0;
        this.isFreeMode = false;
        this.isFreeInFreeMode = false;

        this.curRollingIndex = 0;

        this.isResetNextWinNum = true;

        this.nextSpinDelayTime = 0.3;

        this.slotState = SlotStatus.idle;
        
        this.isSlotReady = true;

        this.isSlotSpinBtnShowByWin = false;
        
        this.dynamicLoadViewList = {};

        this.clickSpinAudio = "";
    }

    static getCurBetScore() {
        return this.curBetList[this.curBetIndex];
    }

    static getDynamicLoadViewData (key: string) {
        return this.dynamicLoadViewList[key];
    }

    // 添加动态弹框界面配置
    static addDynamicLoadViewData (key: string, config: TopViewConfig) {
        this.dynamicLoadViewList[key] = {
            prefabName: config.prefabName ? config.prefabName : key,
            prefabPath: config.prefabPath ? config.prefabPath : 'prefab/',
            ndParent: config.ndParent,
            ndMask: config.ndMask,
            viewScript: config.viewScript,
            viewLevel: config.viewLevel,
            loadFunction: config.loadFunction ? config.loadFunction : 'onInit',
            isWaitting: false,
        }
    }

    // 显示动态弹框界面
    static showDynamicLoadView (key: string, cbLoaded: Function, cbClose: Function, ...args: any[]) {
        let dynamicLoadViewData = this.dynamicLoadViewList[key];
        if (!dynamicLoadViewData) {
            return;
        }
        if (dynamicLoadViewData.isWaitting) {
            return;
        }
        if (dynamicLoadViewData.ndView && dynamicLoadViewData.ndView.active) {
            return;
        }
        if (dynamicLoadViewData.ndMask) {
            dynamicLoadViewData.ndMask.active = true;
        }
        let funShowView = () => {
            if (dynamicLoadViewData.viewLevel != null) {
                dynamicLoadViewData.ndView.setSiblingIndex(dynamicLoadViewData.viewLevel);
            }
            let script: Component = dynamicLoadViewData.ndView.getComponent(dynamicLoadViewData.viewScript);
            if (script && dynamicLoadViewData.loadFunction && script[dynamicLoadViewData.loadFunction]) {
                script[dynamicLoadViewData.loadFunction](() => {
                    if (cbClose) {
                        cbClose();
                    }
                }, ...args);
            }
            if (cbLoaded) {
                cbLoaded();
            }
        };
        if (dynamicLoadViewData.ndView) {
            dynamicLoadViewData.ndView.active = true;
            funShowView();
        } else {
            dynamicLoadViewData.isWaitting = true;
            Utils.loadRes(this.BUNDLE_NAME, dynamicLoadViewData.prefabPath+dynamicLoadViewData.prefabName).then((prefab: Prefab) => {
                dynamicLoadViewData.isWaitting = false;
                dynamicLoadViewData.ndView = instantiate(prefab);
                dynamicLoadViewData.ndView.parent = dynamicLoadViewData.ndParent;
                funShowView();
            });
        }
    }

    // 隐藏动态弹框界面
    static hideDynamicLoadView (key: string) {
        let dynamicLoadViewData = this.dynamicLoadViewList[key];
        if (dynamicLoadViewData && dynamicLoadViewData.ndView && dynamicLoadViewData.ndView.active) {
            dynamicLoadViewData.ndView.active = false;
            if (dynamicLoadViewData.ndMask) {
                dynamicLoadViewData.ndMask.active = false;
            }
        }
    }

    // 移除动态弹框界面
    static removeDynamicLoadView (key: string) {
        let dynamicLoadViewData = this.dynamicLoadViewList[key];
        if (dynamicLoadViewData && dynamicLoadViewData.ndView) {
            dynamicLoadViewData.ndView = null;
        }
    }


}