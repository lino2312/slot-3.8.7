import Super777IData from "db://assets/games/Super777I/script/Super777IData";
import { PosData } from "db://assets/scripts/game/tsFrameCommon/Base/GameGlobalDefine";
import SlotGameData, { SlotMapInfo, SlotRewardLineInfo, SlotRewardTypeInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";

import { _decorator } from 'cc';
import { App } from "db://assets/scripts/App";
import { SlotGameBaseData } from "db://assets/scripts/game/slotgame/SlotGameBaseData";
import { Super777ICfg } from "./Super777I_Cfg";
const { ccclass, property } = _decorator;

let freeTimes = 0;

@ccclass('Super777IMsgMgr')
export default class Super777IMsgMgr extends SlotGameMsgMgr {

    onLoad(): void {
        SlotGameData.BUNDLE_NAME = 'Super777I';
        SlotGameData.scriptMsgMgr = this;
        let gameDataScript = this.node.addComponent(SlotGameBaseData);
        //gameDataScript一定要最先set，否则后续取不到数据
        App.SubGameManager.setSlotGameDataScript(gameDataScript);
        let msgDic = App.SubGameManager.getMsgDic();
        gameDataScript.init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
        gameDataScript.setGameCfg(Super777ICfg);
        super.onLoad();
        Super777IData.init();
    }

    onDestroy(): void {
        super.onDestroy();
    }

    start() {
        super.start();
        let gameDataScript = this.node.getComponent(SlotGameBaseData);
        let deskInfo = gameDataScript.getDeskInfo();
        if (deskInfo.allFreeCount > 0) {
            SlotGameData.isFreeMode = true;
            SlotGameData.totalFreeTimes = deskInfo.allFreeCount;
            SlotGameData.freeTimes = deskInfo.allFreeCount - deskInfo.restFreeCount;
            SlotGameData.totalWinScore = deskInfo.freeWinCoin;
            SlotGameData.curBetIndex = deskInfo.mults.findIndex(a => a == deskInfo.totalBet);
            SlotGameData.scriptBottom.updateNormlModeBetCoin();
            this.onMidEnter();
        }
    }

    // 初始化底图
    onInitMapInfo(mapInfo: SlotMapInfo) {
        super.onInitMapInfo(mapInfo);
    }

    // 接收开奖数据
    onEventMsg_StartSpin(msg: any) {
        console.log(msg);
        let data: SlotSpinMsgData = {
            mapInfo: {},
            rewardList: [],
            rewardTypeInfo: {},
            rewardLineInfo: [],
            winScore: msg.wincoin,
        };
        SlotGameData.totalWinScore = msg.allFreeCnt > 0 ? msg.freeWinCoin : msg.wincoin;
        if (msg.allFreeCnt > 0 && SlotGameData.totalFreeTimes < msg.allFreeCnt) {
            SlotGameData.isFreeInFreeMode = true;
        }
        SlotGameData.totalFreeTimes = msg.allFreeCnt;
        SlotGameData.freeTimes = msg.allFreeCnt - msg.freeCnt;
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            data.mapInfo[`${col}_0`] = {
                type: 0
            }
        }
        for (let i = 0; i < msg.resultCards.length; i++) {
            let type = this.getItemTypeByServer(msg.resultCards[i]);
            let pos = this.getItemPosByServerIndex(i, Super777IData.COL_NUM);
            data.mapInfo[`${pos.col}_${pos.row + 1}`] = {
                type: type
            }
        }
        for (let i = 0; i < msg.zjLuXian.length; i++) {
            let lineData = msg.zjLuXian[i];
            let rewardLineConfig = Super777IData.REWARD_LINE_CONFIG[lineData.line - 1];
            let rewardLineInfo: SlotRewardLineInfo = {
                list: [],
                winScore: lineData.mult,
            };
            let iconList: PosData[] = [];
            let rewardList: string[] = [];
            for (let i = 0; i < lineData.icons.length; i++) {
                let col: number;
                let row: number;
                let index: string;
                let itemData;
                let reward: number = lineData.icons[i];
                for (let j = 0; j < rewardLineConfig.length; j++) {
                    col = j;
                    row = rewardLineConfig[col];
                    index = `${col}_${row}`;
                    if (!rewardList[index] && data.mapInfo[index].type == reward) {
                        itemData = data.mapInfo[index];
                        break;
                    }
                }
                if (!itemData) {
                    if (lineData.icons.length == 3) {
                        for (let j = 0; j < rewardLineConfig.length; j++) {
                            col = j;
                            row = rewardLineConfig[col];
                            index = `${col}_${row}`;
                            if (!rewardList[index]) {
                                if (data.mapInfo[index].type == 7 || data.mapInfo[index].type == 8) {
                                    itemData = data.mapInfo[index];
                                    break;
                                }
                            }
                        }
                    }
                    if (!itemData) {
                        continue;
                    }
                }
                if (rewardList[index]) {
                    continue;
                }
                rewardList[index] = {};
                iconList.push({
                    col: col,
                    row: row
                });
            }
            iconList.sort((a, b) => a.col - b.col);
            iconList.forEach(posData => {
                let col = posData.col;
                let row = posData.row;
                data.rewardList.push({
                    col: col,
                    row: row,
                });
                let type = data.mapInfo[`${col}_${row}`].type;
                if (type > 0) {
                    if (data.rewardTypeInfo[type] == null) {
                        data.rewardTypeInfo[type] = [];
                    }
                    data.rewardTypeInfo[type].push({
                        col: col,
                        row: row,
                    });
                }
                rewardLineInfo.list.push({
                    col: col,
                    row: row,
                });
            });
            data.rewardLineInfo.push(rewardLineInfo);
        }
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            data.mapInfo[`${col}_${Super777IData.ROW_NUM - 1}`] = {
                type: 0
            }
        }
        super.onEventMsg_StartSpin(data);
    }

    // 模拟单机模式下的spin消息数据
    getSingleModeSpinMsgData() {
        let mapList = this.getRandomMapList();
        let data: SlotSpinMsgData = {
            mapInfo: mapList.mapInfo,
            rewardList: [],
            rewardTypeInfo: mapList.rewardTypeInfo,
            rewardLineInfo: [],
            winScore: 0,
        };
        let rewardRow = 2;
        let isReward = true;
        for (let col = 0; col < Super777IData.COL_NUM - 1; col++) {
            if (data.mapInfo[`${col}_${rewardRow}`].type == 0) {
                isReward = false;
                break;
            }
        }
        if (isReward) {
            data.winScore = 0;
        }
        return data;
    }

    // 生成随机列表
    getRandomMapList() {
        let funCreateOneItem = () => {
            let num = Super777IData.ITEM_NUM;
            let type = Math.floor(Math.random() * num) + 1;
            return type;
        };
        let funCreateRollItems = () => {
            let list: number[] = [];
            list.push(0);
            let isCenterItem = Math.random() > 0.5;
            if (isCenterItem) {
                list.push(funCreateOneItem());
                list.push(funCreateOneItem());
                list.push(funCreateOneItem());
            } else {
                list.push(funCreateOneItem());
                list.push(0);
                list.push(funCreateOneItem());
            }
            list.push(0);
            return list;
        };
        let mapInfo: SlotMapInfo = {};
        let rewardTypeInfo: SlotRewardTypeInfo = {};
        for (let i = 0; i < Super777IData.COL_NUM; i++) {
            let items = funCreateRollItems();
            for (let j = 0; j < Super777IData.ROW_NUM; j++) {
                let type = items[j];
                mapInfo[`${i}_${j}`] = {
                    type: type,
                };
            }
        }
        return {
            mapInfo: mapInfo,
            rewardTypeInfo: rewardTypeInfo
        };
    }

    // 转换服务器发过来的符号
    getItemTypeByServer(type: number) {
        return type;
    }

}