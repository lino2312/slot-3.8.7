import SlotGameData, { SlotMapInfo, SlotRewardTypeInfo } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import MoneyComingData, { MoneyComingSpinMsgData } from "db://assets/games/MoneyComing/script/MoneyComingData";

import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyComingMsgMgr')
export default class MoneyComingMsgMgr extends SlotGameMsgMgr {

    onLoad(): void {
        SlotGameData.BUNDLE_NAME = 'MoneyComing';
        SlotGameData.scriptMsgMgr = this;
        super.onLoad();
        MoneyComingData.init();
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
        let data: MoneyComingSpinMsgData = {
            mapInfo: {},
            rewardList: [],
            rewardTypeInfo: {},
            rewardLineInfo: [],
            winScore: msg.wincoin,
            leftWinScore: msg.lWin ? msg.lWin : 0,
            rightWinScore: msg.rWin ? msg.rWin : 0,
        };
        SlotGameData.totalWinScore = msg.wincoin;
        for (let col = 0; col < MoneyComingData.COL_NUM; col++) {
            data.mapInfo[`${col}_0`] = {
                type: 0
            }
        }
        for (let i = 0; i < msg.resultCards.cards.length; i++) {
            let type = this.getItemTypeByServer(msg.resultCards.cards[i]);
            let pos = this.getItemPosByServerIndex(i, MoneyComingData.COL_NUM);
            data.mapInfo[`${pos.col}_${pos.row+1}`] = {
                type: type
            }
        }
        for (let col = 0; col < MoneyComingData.COL_NUM; col++) {
            data.mapInfo[`${col}_${MoneyComingData.ROW_NUM-1}`] = {
                type: 0
            }
        }
        if (msg.resultCards.adds) {
            data.respinMapInfo = {};
            for (let col = 0; col < MoneyComingData.COL_NUM; col++) {
                data.respinMapInfo[`${col}_0`] = {
                    type: 0
                }
            }
            for (let i = 0; i < msg.resultCards.adds.length; i++) {
                let type = this.getItemTypeByServer(msg.resultCards.adds[i]);
                let pos = this.getItemPosByServerIndex(i, MoneyComingData.COL_NUM-1);
                data.respinMapInfo[`${pos.col}_${pos.row+1}`] = {
                    type: type
                }
            }
            for (let row = 1; row <= 3; row++) {
                let col = MoneyComingData.COL_NUM-1;
                data.respinMapInfo[`${col}_${row}`] = {
                    type: data.mapInfo[`${col}_${row}`].type
                }
            }
            for (let col = 0; col < MoneyComingData.COL_NUM; col++) {
                data.respinMapInfo[`${col}_${MoneyComingData.ROW_NUM-1}`] = {
                    type: 0
                }
            }
        }
        if (msg.resultCards.ttIdx != null) {
            data.wheelRewardIndex = msg.resultCards.ttIdx-1;
        }
        super.onEventMsg_StartSpin(data);
    }

    // 模拟单机模式下的spin消息数据
    getSingleModeSpinMsgData () {
        let mapList = this.getRandomMapList();
        let data: MoneyComingSpinMsgData = {
            mapInfo: mapList.mapInfo,
            rewardList: [],
            rewardTypeInfo: mapList.rewardTypeInfo,
            rewardLineInfo: [],
            winScore: 0,
            leftWinScore: 0,
            rightWinScore: 0,
        };
        let rewardRow = 2;
        let isReward = true;
        for (let col = 0; col < MoneyComingData.COL_NUM-1; col++) {
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
        let funCreateOneItem = (isBlank: boolean, col: number) => {
            let startIndex = col == MoneyComingData.COL_NUM-1 ? MoneyComingData.ITEM_NORMAL_NUM : 0;
            let num = col == MoneyComingData.COL_NUM-1 ? MoneyComingData.SPECIAL_ITEM_NUM : MoneyComingData.ITEM_NORMAL_NUM;
            if (isBlank) {
                num += 1;
            }
            let type = Math.floor(Math.random()*num)+startIndex;
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
                list.push(funCreateOneItem(false, col));
                list.push(0);
            } else {
                list.push(funCreateOneItem(false, col));
                list.push(0);
                list.push(funCreateOneItem(false, col));
            }
            list.push(0);
            return list;
        };
        let mapInfo: SlotMapInfo = {};
        let rewardTypeInfo: SlotRewardTypeInfo = {};
        for (let i = 0; i < MoneyComingData.COL_NUM; i++) {
            let items = funCreateRollItems(i);
            for (let j = 0; j < MoneyComingData.ROW_NUM; j++) {
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