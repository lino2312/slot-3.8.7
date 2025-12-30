import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import SlotGameData, { SlotMapInfo, SlotRewardTypeInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import GemsFrotuneIIData, { GameMapInfo, ServerGemsFrotuneIIMsgData } from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIData";
import { _decorator } from 'cc';
import { SlotGameBaseData } from "db://assets/scripts/game/slotgame/SlotGameBaseData";
import { App } from "db://assets/scripts/App";
import Cfg from "./GemsFrotuneII_Cfg";
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIIMsgMgr')
export default class GemsFrotuneIIMsgMgr extends SlotGameMsgMgr {

    betList = [1, 2, 3, 5, 10, 15];

    onLoad(): void {
        let gameDataScript = this.node.addComponent(SlotGameBaseData);
        //gameDataScript一定要最先set，否则后续取不到数据
        App.SubGameManager.setSlotGameDataScript(gameDataScript);
        let msgDic = App.SubGameManager.getMsgDic();
        gameDataScript.init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
        gameDataScript.setGameCfg(Cfg);
        SlotGameData.BUNDLE_NAME = 'GemsFrotuneII';
        SlotGameData.scriptMsgMgr = this;
        super.onLoad();
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
    onEventMsg_StartSpin(msg: any) {
        console.log(msg);
//         msg={
//     "allFreeCnt": 0,
//     "c": 44,
//     "code": 200,
//     "gameid": 578,
//     "wincoin": 26.4,
//     "issue": "XX2509215943670013",
//     "freeResult": {
//         "freeInfo": [],
//         "triFreeCnt": 0
//     },
//     "c_idx": 35,
//     "freeWinCoin": 0,
//     "coin": 4508533.86,
//     "betcoin": 1,
//     "subGameInfo": {
//         "isMustJoin": -1,
//         "subGamid": -1
//     },
//     "spcode": 200,
//     "lastBetCoin": 4508507.46,
//     "lWin": 26.4,
//     "resultCards": [
//         8,
//         7,
//         8,
//         9,
//         2,
//         5,
//         2,
//         11,
//         5,
//         3,
//         5,
//         9
//     ],
//     "addMult": 1,
//     "spLuXian": 0,
//     "freeCnt": 0,
//     "zjLuXian": [
//         {
//             "mult": 4,
//             "icon": 7,
//             "line": 1
//         },
//         {
//             "mult": 2.4,
//             "icon": 5,
//             "line": 4
//         },
//         {
//             "mult": 2.4,
//             "icon": 5,
//             "line": 5
//         }
//     ],
//     "pooljp": 0,
//     "nextBetLine": {
//         "spcode": 500
//     },
//     "spEffect": {
//         "wincoin": 26.4,
//         "kind": 2
//     }

// }
        let mapInfo: SlotMapInfo = {};
        let data: ServerGemsFrotuneIIMsgData = {
            winScore: 0,//总赢
            dataList: [],
            mapInfo: mapInfo,
            betNum: 0,
            betType: 0,
            stopIndex: -1,
            lWin: 0,//线赢
            rWin: 0,//转盘赢
            betPosIndexs: [],//哪些位置会展示倍数，服务端只发一个，就是停的位置的，如果没发就随机四个
            betlists: []//展示倍数有哪些
        };
        SlotGameData.totalFreeTimes = msg.allFreeCnt;
        SlotGameData.freeTimes = msg.allFreeCnt - msg.freeCnt;

        for (let i = 0; i < GemsFrotuneIIData.COL_NUM; i++) {
            for (let j = 0; j < GemsFrotuneIIData.ROW_NUM; j++) {
                let num = this.getRandomType(i);
                if (j > 1 && j < 5) {
                    let index = i + (j - 2) * GemsFrotuneIIData.COL_NUM;//按二维数组取值
                    num = msg.resultCards[index];
                    if(index == 7){
                        data.betNum = this.betList[num - 9];
                        data.betType = num;
                    }
                }
                mapInfo[`${i}_${j}`] = {
                    type: num,
                };
            }
        }
        for (let i = 0; i < msg.zjLuXian.length; i++) {
            let line: GameMapInfo = {
                lines: {
                    lineIndex: msg.zjLuXian[i].line - 1,// 连线id
                    spIcon: GemsFrotuneIIData.lineMap[msg.zjLuXian[i].line - 1],
                    win: msg.zjLuXian[i].mult,//这条线赢了多少
                }
            }
            data.dataList.push(line);
        }
        data.winScore = msg.wincoin;
        if (msg.lWin) {
            data.lWin = msg.lWin;
        } 
        if (msg.rWin) {
            data.rWin = msg.rWin;
        } 
        if (msg.ttIdx) {
            data.stopIndex = msg.ttIdx - 1;
            if (SlotGameData.buyDouble) {
                let index = Utils.getRandNum(0, 3);
                data.betPosIndexs = this.getRandomNumbers(4, 0, 11, data.stopIndex);
                data.betPosIndexs[index] = data.stopIndex;
                for (let i = 0; i < 4; i++){
                    data.betlists.push(Utils.getRandNum(0, 5));
                }
                if (msg.mIdx > 1) {//如果有中倍数
                    data.betlists[index] = msg.mIdx - 1;
                } else {
                    data.betlists[index] = 0;
                }
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
            rewardLineInfo: [],
            winScore: 0,
            rewardTypeInfo: undefined,
        };
        let rewardRow = 2;
        let isReward = true;
        for (let col = 0; col < GemsFrotuneIIData.COL_NUM-1; col++) {
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
        let data = [[1,2,8,8,8,4,5],[6,7,7,7,7,8,8],[1,2,6,6,6,4,5],[9,10,11,13,15,11,12]]
        let mapInfo: SlotMapInfo = {};
        for (let i = 0; i < GemsFrotuneIIData.COL_NUM; i++) {
            for (let j = 0; j < GemsFrotuneIIData.ROW_NUM; j++) {
                let num = data[i][j];
                mapInfo[`${i}_${j}`] = {
                    type: num,
                };
            }
        }
        return {
            mapInfo: mapInfo,
        };
    }

    // 转换服务器发过来的符号
    getItemTypeByServer(type: number) {
        return type;
    }

    getRandomType(col) {
        let num = Utils.getRandNum(1,8);//sc符号不随机所以只到九
        if(col == 3)num = Utils.getRandNum(9,14);
        return num;
    }

    /** 随机获得一个范围内的数组 */
    getRandomNumbers(count: number, min: number, max: number, num: number): number[] {
        if (max - min + 1 < count) {
            throw new Error("范围太小，无法生成不重复的数字");
        }
        const numbers: Set<number> = new Set();
        while (numbers.size < count) {
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            if (randomNum != num){
                numbers.add(randomNum);
            }
        }
        return Array.from(numbers);
    }
}