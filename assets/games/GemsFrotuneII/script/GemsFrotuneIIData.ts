import { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

export interface GameMapList {
    [index:string]:{type:number},
}

export interface GameMapInfo {
    lines: {
        lineIndex: number,// 连线id
        spIcon: string[],
        win: number,//这条线赢了多少
    },
}

export interface ServerGemsFrotuneIIMsgData {
    winScore: number,
    dataList: GameMapInfo[],
    mapInfo: SlotMapInfo,
    betNum: number;
    betType: number;
    lWin: number;
    rWin: number;
    stopIndex: number;
    betPosIndexs: number[];
    betlists: number[];
}


export default class GemsFrotuneIIData {

    static BUNDLE_NAME = 'GemsFrotuneII';
    static COL_NUM = 4;
    static ROW_NUM = 7;
    static ITEM_NUM = 16;
    static ITEM_NORMAL_NUM = 7;
    static ITEM_WILD_TYPE = 8;
    static ITEM_MULTIPLE_NUM = 6;
    
    static SPINE_TIMESCALE = 1;

    static ITEM_REWARD_CONFIG = [3, 2, 1, 5, 4, 2, 0.5, 1000, 200, 100, 300, 500];
    
    static curRollServerData: ServerGemsFrotuneIIMsgData = null;

    static lineMap = {
        /**  地图是五行五列
         * 1号线
         * ##,##,##
         * --,--,--
         * --,--,--
         */
        0: ["0_2", "1_2", "2_2"],
        /**
         * 2号线
         * --,--,--
         * --,--,--
         * ##,##,##
         */
        1: ["0_4", "1_4", "2_4"],
        /**
         * 3号线
         * --,--,--
         * ##,##,##
         * --,--,--
         */
        2: ["0_3", "1_3", "2_3"],
        /**
         * 4号线
         * ##,--,--
         * --,##,--
         * --,--,##
         */
        3: ["0_2", "1_3", "2_4"],
        /**
         * 3号线
         * --,--,##
         * --,##,--
         * ##,--,--
         */
        4: ["0_4", "1_3", "2_2"],
    }

}