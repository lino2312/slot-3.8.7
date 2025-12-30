import SlotGameData, { SlotMapInfo, SlotRewardLineInfo, SlotRewardTypeInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import Diamond777Data from "db://assets/games/Diamond777/script/Diamond777Data";

import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777MsgMgr')
export default class Diamond777MsgMgr extends SlotGameMsgMgr {

    onLoad(): void {
        SlotGameData.BUNDLE_NAME = 'Diamond777';
        SlotGameData.scriptMsgMgr = this;
        super.onLoad();
        Diamond777Data.init();
    }

    onDestroy(): void {
        super.onDestroy();
    }

    start () {
        super.start();
    }

    // 初始化底图
    onInitMapInfo(mapInfo: SlotMapInfo) {
        super.onInitMapInfo(mapInfo);
    }

    // 接收开奖数据
    onEventMsg_StartSpin (msg: any) {
        console.log(msg);
        let data: SlotSpinMsgData = {
            mapInfo: {},
            rewardList: [],
            rewardTypeInfo: {},
            rewardLineInfo: [],
            winScore: msg.allFreeCnt > 0 ? msg.freeWinCoin : msg.wincoin,
        };
        SlotGameData.totalWinScore = msg.allFreeCnt > 0 ? msg.freeWinCoin : msg.wincoin;
        SlotGameData.totalRespinTimes = msg.allFreeCnt;
        SlotGameData.respinTimes = msg.allFreeCnt-msg.freeCnt;
        for (let col = 0; col < Diamond777Data.COL_NUM; col++) {
            data.mapInfo[`${col}_0`] = {
                type: 0
            }
        }
        for (let i = 0; i < msg.resultCards.length; i++) {
            let type = this.getItemTypeByServer(msg.resultCards[i]);
            let pos = this.getItemPosByServerIndex(i, Diamond777Data.COL_NUM);
            data.mapInfo[`${pos.col}_${pos.row+1}`] = {
                type: type
            }
        }
        for (let i = 0; i < msg.lines.length; i++) {
            let lineData = msg.lines[i];
            let rewardLineConfig = Diamond777Data.REWARD_LINE_CONFIG[lineData.id-1];
            let rewardLineInfo: SlotRewardLineInfo = {
                list: [],
                winScore: lineData.fan,
            };
            let rewardList: string[] = [];
            for (let col = 0; col < rewardLineConfig.length; col++) {
                let row = rewardLineConfig[col];
                let index = `${col}_${row}`;
                if (rewardList[index]) {
                    continue;
                }
                rewardList[index] = {};
                data.rewardList.push({
                    col: col,
                    row: row,
                });
                let type = data.mapInfo[index].type;
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
            }
            data.rewardLineInfo.push(rewardLineInfo);
        }
        for (let col = 0; col < Diamond777Data.COL_NUM; col++) {
            data.mapInfo[`${col}_${Diamond777Data.ROW_NUM-1}`] = {
                type: 0
            }
        }
        super.onEventMsg_StartSpin(data);
    }

    // 模拟单机模式下的spin消息数据
    getSingleModeSpinMsgData () {
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
        for (let col = 0; col < Diamond777Data.COL_NUM-1; col++) {
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
        let funCreateOneItem = (isBlank: boolean) => {
            let num = Diamond777Data.ITEM_NUM;
            if (isBlank) {
                num += 1;
            }
            let type = Math.floor(Math.random()*num);
            if (!isBlank) {
                type ++;
            }
            return type;
        };
        let funCreateRollItems = (col: number) => {
            let list: number[] = [];
            list.push(0);
            let isCenterItem = Math.random() > 0.5;
            if (isCenterItem) {
                list.push(0);
                list.push(funCreateOneItem(false));
                list.push(0);
            } else {
                list.push(funCreateOneItem(false));
                list.push(0);
                list.push(funCreateOneItem(false));
            }
            list.push(0);
            return list;
        };
        let mapInfo: SlotMapInfo = {};
        let rewardTypeInfo: SlotRewardTypeInfo = {};
        for (let i = 0; i < Diamond777Data.COL_NUM; i++) {
            let items = funCreateRollItems(i);
            for (let j = 0; j < Diamond777Data.ROW_NUM; j++) {
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