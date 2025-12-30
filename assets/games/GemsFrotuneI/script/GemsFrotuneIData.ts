import { SlotMapInfo } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

export interface GameMapList {
    [index: string]: { type: number };
}

export interface GameMapInfo {
    lines: {
        lineIndex: number;
        spIcon: string[];
        win: number;
    };
}

export interface ServerGemsFrotuneIMsgData {
    winScore: number;
    dataList: GameMapInfo[];
    mapInfo: SlotMapInfo;
    betNum: number;
    betType: number;
}

export default class GemsFrotuneIData {
    static BUNDLE_NAME = 'GemsFrotuneI';
    static COL_NUM = 4;
    static ROW_NUM = 7;
    static ITEM_NUM = 14;
    static ITEM_NORMAL_NUM = 7;
    static ITEM_WILD_TYPE = 8;
    static ITEM_MULTIPLE_NUM = 6;
    static SPINE_TIMESCALE = 1;
    static ITEM_REWARD_CONFIG = [3, 2, 1, 5, 4, 2, 0.5, 1000, 200, 100, 300, 500];
    static curRollServerData: ServerGemsFrotuneIMsgData = null;

    static lineMap = {
        0: ["0_2", "1_2", "2_2"],
        1: ["0_4", "1_4", "2_4"],
        2: ["0_3", "1_3", "2_3"],
        3: ["0_2", "1_3", "2_4"],
        4: ["0_4", "1_3", "2_2"],
    };
}