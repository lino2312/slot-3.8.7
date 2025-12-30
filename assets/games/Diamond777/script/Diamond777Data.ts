import { SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

export enum Diamond777WinType {
    normal,
    big,
    huge,
    massive,
    legendary,
}

export default class Diamond777Data {
    
    static COL_NUM = 3;
    static ROW_NUM = 5;
    static ITEM_NUM = 9;
    static ITEM_NORMAL_NUM = 5;
    static ITEM_SPECIAL_NUM = 4;
    static SPINE_TIMESCALE = 1;
    static NICE_WIN_MIN_REWARD = 5;
    static BIG_WIN_MIN_REWARD = 10;

    static NICE_WIN_VIEW = 'nicewin';
    static BIG_WIN_VIEW = 'bigwin';

    static ITEM_REWARD_CONFIG = [1, 2, 3, 4, 5, 2, 0.5, 1000, 200, 100, 300, 500];

    static REWARD_LINE_CONFIG = [
        [2, 2, 2],  // 第2行全列
        [1, 1, 1],  // 第1行全列
        [3, 3, 3],  // 第3行全列
        [1, 2, 3],  // 主对角线
        [3, 2, 1]   // 副对角线逆序
    ];

    static curRollServerData: SlotSpinMsgData = null;

    static init () {
        this.curRollServerData = null;
    }

}