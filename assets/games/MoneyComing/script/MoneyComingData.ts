import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

export enum MoneyComingMode {
    Normal,
    Special,
}

export enum MoneyComingSpecialStatus {
    Respin,
    Scatter,
    SuperScatter,
}

export enum MoneyComingRightBg {
    Green,
    Blue,
    Red,
}

export enum MoneyComingWinType {
    Normal,
    Big,
    Mega,
    Super,
}

export interface MoneyComingSpinMsgData extends SlotSpinMsgData {
    leftWinScore: number,
    rightWinScore: number,
    respinMapInfo?: SlotMapInfo,
    wheelRewardIndex?:number,
}

export default class MoneyComingData {

    static BUNDLE_NAME = '';
    static COL_NUM = 4;
    static ROW_NUM = 5;
    static ITEM_NUM = 11;
    static ITEM_NORMAL_NUM = 5;
    static SPECIAL_ITEM_NUM = 6;
    static SPINE_TIMESCALE = 1;
    static MINI_BET = 5;//解锁下注值
    static G_T_R_BET = 50;//绿变红下注值

    static BET_WHEEL_CONFIGS = [
        [5, 10, 15, 20, 30, 50, 100, 200],
        [10, 20, 30, 50, 100, 200, 500, 1000]
    ];

    static BIG_WIN_VIEW = 'bigwin';

    static BIG_WIN_MIN_REWARD = 10;
    static MAGA_WIN_MIN_REWARD = 20;
    static SUPER_WIN_MIN_REWARD = 50;

    static curRollServerData: MoneyComingSpinMsgData = null;

    static gameMode = MoneyComingMode.Normal;
    static specialStatus = MoneyComingSpecialStatus.Respin;
    static specialRightBg = MoneyComingSpecialStatus.Respin;

    static init () {
        this.curRollServerData = null;
        this.gameMode = MoneyComingMode.Normal;
        this.specialStatus = MoneyComingSpecialStatus.Respin;
        this.specialRightBg = MoneyComingSpecialStatus.Respin;
    }

    static getCurBetWheelConfig () {
        let index = SlotGameData.getCurBetScore() < 50 ? 0 : 1;
        return this.BET_WHEEL_CONFIGS[index];
    }

}