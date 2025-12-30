import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import SlotGameMsgMgr from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameMsgMgr";
import JungleDelightData, { GameMapInfo, ServerJungleDelightMsgData } from "./JungleDelightData";
import JungleDelightGame from "./JungleDelightGame";
import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('JungleDelightMsgMgr')
export default class JungleDelightMsgMgr extends SlotGameMsgMgr {
    private _deskInfo = null;

    onLoad(): void {
        SlotGameData.BUNDLE_NAME = 'JungleDelight';
        SlotGameData.scriptMsgMgr = this;
        super.onLoad();
    }

    onDestroy(): void {
        super.onDestroy();
    }

    start() {
        super.start();
        if ((globalThis as any).cc?.vv) {
            this._deskInfo = (globalThis as any).cc.vv.gameData.getDeskInfo();
            if (this._deskInfo.allFreeCount > 0) {
                SlotGameData.totalFreeTimes = this._deskInfo.allFreeCount;
                SlotGameData.freeTimes = this._deskInfo.allFreeCount - this._deskInfo.restFreeCount;
                SlotGameData.curBetIndex = this._deskInfo.mults.findIndex(a => a == this._deskInfo.totalBet);
                JungleDelightData.freeTotalWin = this._deskInfo.freeWinCoin;
                JungleDelightData.isFreeGame = true;
                SlotGameData.scriptBottom.updateNormlModeBetCoin();
                (SlotGameData.scriptGame as JungleDelightGame).freeModeSelect(SlotGameData.totalFreeTimes);
            }
        }
    }

    // 初始化底图
    onInitMapInfo(mapInfo: SlotMapInfo) {
        super.onInitMapInfo(mapInfo);
    }

    //接收开奖数据
    onEventMsg_StartSpin(msg: any) {
        console.log(msg);
        let mapInfo: SlotMapInfo = {};
        let data: ServerJungleDelightMsgData = {
            mapInfo: mapInfo,
            winScore: 0,
            isSpecial: false,
            specialIconIndex: 0,
            dataList: [],
            isWinFreeGame: false,
            idxs: [],
            isThrowBox: false
        };
        SlotGameData.totalFreeTimes = msg.allFreeCnt;
        SlotGameData.freeTimes = msg.allFreeCnt - msg.freeCnt;

        if (msg.freeWinCoin > 0) {
            JungleDelightData.freeTotalWin = msg.freeWinCoin;
        }
        let scCout = 0;
        for (let i = 0; i < JungleDelightData.COL_NUM; i++) {
            for (let j = 0; j < JungleDelightData.ROW_NUM; j++) {
                let num = this.getRandomType();
                if (j > 0 && j < 4) {
                    let index = i + (j - 1) * 5;//按二维数组取值
                    num = msg.resultCards.icons[index];
                    if (num == 9 && (i < 4 || msg.allFreeCnt > 0)) {
                        scCout++;
                        if (scCout >= 2) {//两个标及两个标以上，展示sc期待动画
                            data.isSpecial = true;
                            data.specialIconIndex = 9;
                            if (scCout >= 3) {//三个标中免费
                                data.isWinFreeGame = true;
                                SlotGameData.isFreeMode = true;
                            }
                        }
                    }
                }
                mapInfo[`${i}_${j}`] = {
                    type: num,
                };
            }
        }
        for (let i = 0; i < msg.lines.length; i++) {
            let line: GameMapInfo = {
                lines: {
                    lineIndex: msg.lines[i].line - 1,// 连线id
                    spIcon: JungleDelightData.lineMap[msg.lines[i].line - 1].slice(0, msg.lines[i].count),
                    win: msg.lines[i].mult,//这条线赢了多少
                }
            }
            data.dataList.push(line);
        }
        if (msg.resultCards.idxs && msg.allFreeCnt > 0) {//免费模式框框数据
            data.idxs = msg.resultCards.idxs;
        }

        if (msg.resultCards.idxs && msg.allFreeCnt == 0) {//扔盒子模式
            data.idxs = msg.resultCards.idxs;
            data.isThrowBox = true;
        }

        if (msg.allFreeCnt > 0 && msg.freeCnt == 0) {
            SlotGameData.isFreeMode = false;
        }
        data.winScore = msg.wincoin;
        super.onEventMsg_StartSpin(data);
    }

    // 模拟单机模式下的spin消息数据
    getSingleModeSpinMsgData() {
        let mapList = this.getRandomMapList();
        let data: ServerJungleDelightMsgData = {
            mapInfo: mapList.mapInfo,
            winScore: 0,
            dataList: [],
            isWinFreeGame: false,
            idxs: [],
            isThrowBox: false
        };
        return data;
    }

    // 生成随机列表
    getRandomMapList() {
        let mapInfo: SlotMapInfo = {};
        for (let i = 0; i < JungleDelightData.COL_NUM; i++) {
            for (let j = 0; j < JungleDelightData.ROW_NUM; j++) {
                let num = this.getRandomType();
                mapInfo[`${i}_${j}`] = {
                    type: num,
                };
            }
        }
        return {
            mapInfo: mapInfo
        };
    }

    getRandomType() {
        let num = Math.floor(Math.random() * 8) + 1;//sc符号不随机所以只到九
        return num;
    }
}