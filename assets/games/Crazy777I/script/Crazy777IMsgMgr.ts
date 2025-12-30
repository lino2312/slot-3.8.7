import { _decorator } from 'cc';
import { App } from 'db://assets/scripts/App';
import { SlotGameBaseData } from 'db://assets/scripts/game/slotgame/SlotGameBaseData';
import SlotGameData, { SlotMapInfo, SlotRewardTypeInfo, SlotSpinMsgData } from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import Crazy777IData from "./Crazy777IData";
import { Crazy777ICfg } from './Crazy777I_Cfg';
const { ccclass, property } = _decorator;

@ccclass('Crazy777IMsgMgr')
export default class Crazy777IMsgMgr extends SlotGameMsgMgr {
    onLoad(): void {
        SlotGameData.BUNDLE_NAME = 'Crazy777I';
        SlotGameData.scriptMsgMgr = this;
        let gameDataScript = this.node.addComponent(SlotGameBaseData);
        //gameDataScript一定要最先set，否则后续取不到数据
        App.SubGameManager.setSlotGameDataScript(gameDataScript);
        let msgDic = App.SubGameManager.getMsgDic();
        gameDataScript.init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
        gameDataScript.setGameCfg(Crazy777ICfg);
        super.onLoad();
        Crazy777IData.init();
    }
    onDestroy(): void {
        super.onDestroy();
    }
    start() {
        super.start();
    }
    //    // 初始化底图
    onInitMapInfo(mapInfo: SlotMapInfo) {
        super.onInitMapInfo(mapInfo);
    }
    //    // 接收开奖数据
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
        SlotGameData.totalRespinTimes = msg.allFreeCnt;
        SlotGameData.respinTimes = msg.allFreeCnt - msg.freeCnt;
        for (let col = 0; col < Crazy777IData.COL_NUM; col++) {
            data.mapInfo[`${col}_0`] = {
                type: 0
            }
        }
        for (let i = 0; i < msg.resultCards.length; i++) {
            let type = this.getItemTypeByServer(msg.resultCards[i]);
            let pos = this.getItemPosByServerIndex(i, Crazy777IData.COL_NUM);
            data.mapInfo[`${pos.col}_${pos.row + 1}`] = {
                type: type
            }
        }
        for (let col = 0; col < Crazy777IData.COL_NUM; col++) {
            data.mapInfo[`${col}_${Crazy777IData.ROW_NUM - 1}`] = {
                type: 0
            }
        }
        super.onEventMsg_StartSpin(data);
    }
    //    // 模拟单机模式下的spin消息数据
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
        for (let col = 0; col < Crazy777IData.COL_NUM - 1; col++) {
            if (data.mapInfo[`${col}_${rewardRow}`].type == 0) {
                isReward = false;
                break;
            }
        }
        if (isReward) {
            let betNum = SlotGameData.getCurBetScore();
            let winCoin = 0;
            let reward0 = data.mapInfo[`${0}_${rewardRow}`].type;
            let reward1 = data.mapInfo[`${1}_${rewardRow}`].type;
            let reward2 = data.mapInfo[`${2}_${rewardRow}`].type;
            if (reward0 == reward1 && reward1 == reward2) {
                winCoin = Crazy777IData.ITEM_REWARD_CONFIG[reward0 - 1];
            } else if (reward0 <= 3 && reward1 <= 3 && reward2 <= 3) {
                winCoin = Crazy777IData.ITEM_REWARD_CONFIG[5];
            } else if (reward0 >= 4 && reward0 <= 5 && reward1 >= 4 && reward1 <= 5 && reward2 >= 4 && reward2 <= 5) {
                winCoin = Crazy777IData.ITEM_REWARD_CONFIG[6];
            } else {
                winCoin = Crazy777IData.ITEM_REWARD_CONFIG[7];
            }
            winCoin = winCoin * betNum;
            let multiple = 0
            let addcoin = 0
            let respintime = 0
            let specialCol = Crazy777IData.COL_NUM - 1;
            let specialReward = data.mapInfo[`${specialCol}_${rewardRow}`].type;
            if (specialReward > 0) {
                switch (specialReward) {
                    case 6:
                        multiple += 10
                        break
                    case 7:
                        multiple += 5
                        break
                    case 8:
                        multiple += 2
                        break
                    case 9:
                        addcoin = Crazy777IData.ITEM_REWARD_CONFIG[8] * betNum;
                        break
                    case 10:
                        addcoin = Crazy777IData.ITEM_REWARD_CONFIG[9] * betNum;
                        break
                    case 11:
                        respintime = Math.floor(Math.random() * 4 + 1)
                        break
                    default:
                        break
                }
            }
            if (multiple > 0) {
                winCoin = winCoin * multiple
            }
            data.winScore = winCoin + addcoin;
            if (SlotGameData.totalRespinTimes > 0) {
                SlotGameData.respinTimes++;
            }
            if (respintime > 0) {
                if (SlotGameData.totalRespinTimes + respintime <= 5) {
                    SlotGameData.totalRespinTimes += respintime;
                } else {
                    SlotGameData.totalRespinTimes = 5;
                }
            }
        }
        return data;
    }
    //    // 生成随机列表
    getRandomMapList() {
        let funCreateOneItem = (isSpecial: boolean) => {
            let startIndex = 1;
            let itemCount = Crazy777IData.ITEM_NORMAL_NUM;
            if (isSpecial) {
                startIndex = Crazy777IData.ITEM_NORMAL_NUM + 1;
                itemCount == Crazy777IData.SPECIAL_ITEM_NUM;
            }
            let type = Math.floor(Math.random() * itemCount) + startIndex;
            return type;
        };
        let funCreateRollItems = (col: number) => {
            let isSpecial = col == Crazy777IData.COL_NUM - 1 ? true : false;
            let list: number[] = [];
            list.push(0);
            let isCenterItem = Math.random() > 0.5;
            if (isCenterItem) {
                list.push(0);
                list.push(funCreateOneItem(isSpecial));
                list.push(0);
            } else {
                list.push(funCreateOneItem(isSpecial));
                list.push(0);
                list.push(funCreateOneItem(isSpecial));
            }
            list.push(0);
            return list;
        };
        let mapInfo: SlotMapInfo = {};
        let rewardTypeInfo: SlotRewardTypeInfo = {};
        for (let i = 0; i < Crazy777IData.COL_NUM; i++) {
            let items = funCreateRollItems(i);
            for (let j = 0; j < Crazy777IData.ROW_NUM; j++) {
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
    //    // 转换服务器发过来的符号
    getItemTypeByServer(type: number) {
        let typeNew = 0;
        switch (type) {
            case 0:
                typeNew = 0;
                break;
            case 1:
                typeNew = 5;
                break;
            case 2:
                typeNew = 4;
                break;
            case 3:
                typeNew = 3;
                break;
            case 4:
                typeNew = 2;
                break;
            case 5:
                typeNew = 1;
                break;
            case 6:
                typeNew = 8;
                break;
            case 7:
                typeNew = 7;
                break;
            case 8:
                typeNew = 6;
                break;
            case 9:
                typeNew = 10;
                break;
            case 10:
                typeNew = 9;
                break;
            case 11:
                typeNew = 11;
                break;
            default:
                break;
        }
        return typeNew;
    }
}

