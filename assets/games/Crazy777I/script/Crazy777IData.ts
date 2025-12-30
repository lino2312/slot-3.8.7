import { SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";


export default class Crazy777IData {
    static COL_NUM = 4;
    static ROW_NUM = 5;
    static ITEM_NUM = 11;
    static ITEM_NORMAL_NUM = 5;
    static SPECIAL_ITEM_NUM = 6;
    static SPINE_TIMESCALE = 1;
    static ITEM_REWARD_CONFIG = [1000, 200, 100, 40, 20, 40, 10, 4, 100, 10];
    static curRollServerData: SlotSpinMsgData = null;
    static init() {
        this.curRollServerData = null;
    }
}

