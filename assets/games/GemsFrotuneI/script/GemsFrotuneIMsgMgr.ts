import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import GemsFrotuneIData, { GameMapInfo, ServerGemsFrotuneIMsgData } from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIData";

import { _decorator } from 'cc';
import { SlotGameBaseData } from "db://assets/scripts/game/slotgame/SlotGameBaseData";
import { App } from "db://assets/scripts/App";
import Cfg from "./GemsFrotuneI_Cfg";
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIMsgMgr')
export default class GemsFrotuneIMsgMgr extends SlotGameMsgMgr {

    betList = [1, 2, 3, 5, 10, 15];

    onLoad(): void {
        let gameDataScript = this.node.addComponent(SlotGameBaseData);
        //gameDataScript一定要最先set，否则后续取不到数据
        App.SubGameManager.setSlotGameDataScript(gameDataScript);
        let msgDic = App.SubGameManager.getMsgDic();
        gameDataScript.init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
        gameDataScript.setGameCfg(Cfg);
        SlotGameData.BUNDLE_NAME = 'GemsFrotuneI';
        SlotGameData.scriptMsgMgr = this;
        super.onLoad();
    }

    onDestroy(): void { super.onDestroy(); }
    start () { super.start(); }
    onInitMapInfo(mapInfo: SlotMapInfo) { super.onInitMapInfo(mapInfo); }

    onEventMsg_StartSpin(msg: any) {
        console.log(msg);
        let mapInfo: SlotMapInfo = {};
        let data: ServerGemsFrotuneIMsgData = { winScore: 0, dataList: [], mapInfo: mapInfo, betNum: 0, betType: 0 };
        SlotGameData.totalFreeTimes = msg.allFreeCnt;
        SlotGameData.freeTimes = msg.allFreeCnt - msg.freeCnt;
        for (let i = 0; i < GemsFrotuneIData.COL_NUM; i++) {
            for (let j = 0; j < GemsFrotuneIData.ROW_NUM; j++) {
                let num = this.getRandomType(i);
                if (j > 1 && j < 5) {
                    let index = i + (j - 2) * GemsFrotuneIData.COL_NUM;
                    num = msg.resultCards[index];
                    if (index == 7) { data.betNum = this.betList[num - 9]; data.betType = num; }
                }
                mapInfo[`${i}_${j}`] = { type: num };
            }
        }
        for (let i = 0; i < msg.zjLuXian.length; i++) {
            let line: GameMapInfo = { lines: { lineIndex: msg.zjLuXian[i].line - 1, spIcon: GemsFrotuneIData.lineMap[msg.zjLuXian[i].line - 1], win: msg.zjLuXian[i].mult } };
            data.dataList.push(line);
        }
        data.winScore = msg.wincoin;
        super.onEventMsg_StartSpin(data);
    }

    getSingleModeSpinMsgData () {
        let mapList = this.getRandomMapList();
        let data: SlotSpinMsgData = { mapInfo: mapList.mapInfo, rewardList: [], rewardLineInfo: [], winScore: 0, rewardTypeInfo: undefined };
        let rewardRow = 2;
        let isReward = true;
        for (let col = 0; col < GemsFrotuneIData.COL_NUM - 1; col++) {
            if (data.mapInfo[`${col}_${rewardRow}`].type == 0) { isReward = false; break; }
        }
        if (isReward) data.winScore = 0;
        return data;
    }

    getRandomMapList() {
        let mapInfo: SlotMapInfo = {};
        for (let i = 0; i < GemsFrotuneIData.COL_NUM; i++) {
            for (let j = 0; j < GemsFrotuneIData.ROW_NUM; j++) {
                let num = this.getRandomType(i);
                mapInfo[`${i}_${j}`] = { type: num };
            }
        }
        return { mapInfo: mapInfo };
    }

    getItemTypeByServer(type: number) { return type; }
    getRandomType(col: number) { let num = Utils.getRandNum(1, 8); if (col == 3) num = Utils.getRandNum(9, 14); return num; }
}