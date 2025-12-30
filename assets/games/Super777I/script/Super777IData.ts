import { SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

export enum Super777IMode {
    Normal,
    Special,
}

export enum Super777IWinType {
    normal,
    big,
    huge,
    massive,
    legendary,
}

export default class Super777IData {

    static COL_NUM = 3;
    static ROW_NUM = 5;
    static ITEM_NUM = 9;
    static ITEM_NORMAL_NUM = 6;
    static ITEM_SPECIAL_NUM = 3;
    static SCATTER_ITEM = 9;
    static SPINE_TIMESCALE = 1;
    static NICE_WIN_MIN_REWARD = 5;
    static BIG_WIN_MIN_REWARD = 10;

    static NICE_WIN_VIEW = 'nicewin';
    static BIG_WIN_VIEW = 'bigwin';
    static FREE_START_VIEW = 'freestart';
    static FREE_END_VIEW = 'freeend';

    static ITEM_REWARD_CONFIG = [0.3, 0.5, 1, 3, 5, 2, 0.2, 40, 60, 90, 135, 1000];

    static REWARD_LINE_CONFIG = [
        [ 2, 2, 2 ], [ 1, 1, 1 ], [ 3, 3, 3 ], [ 1, 2, 1 ], [ 2, 3, 2 ],
        [ 2, 1, 2 ], [ 3, 2, 3 ], [ 1, 2, 3 ], [ 3, 2, 1 ], [ 1, 1, 2 ],
        [ 2, 2, 3 ], [ 2, 2, 1 ], [ 3, 3, 2 ], [ 2, 1, 1 ], [ 3, 2, 2 ],
        [ 1, 2, 2 ], [ 2, 3, 3 ], [ 1, 3, 1 ], [ 3, 1, 3 ], [ 1, 1, 3 ],
    ];

    static curRollServerData: SlotSpinMsgData = null;

    static gameMode = Super777IMode.Normal;

    static init () {
        this.curRollServerData = null;
    }

}