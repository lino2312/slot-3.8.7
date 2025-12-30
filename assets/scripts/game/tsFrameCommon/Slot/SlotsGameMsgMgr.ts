import { _decorator, Component, director } from 'cc';
import EventDispatcher from "../Base/EventDispatcher";
import { PosData } from "../Base/GameGlobalDefine";
import Utils from "../Base/MyUtils";
import SlotGameData from "./SlotsGameData";
import { App } from '../../../App';
const { ccclass, property } = _decorator;

@ccclass
export default class SlotGameMsgMgr extends Component {

    onLoad(): void {
        director.on("TsFrameMsg_Spin", this.onEventMsg_StartSpin, this);
        SlotGameData.init();
        // SlotGameData.IS_SINGLE_MODLE = cc.vv ? false : true;
        // SlotGameData.IS_SINGLE_MODLE = false;
        // if (cc.vv) {
        SlotGameData.playerInfo.uid = App.userData().userInfo.userId;
            // SlotGameData.playerInfo.uid = cc.vv.UserManager.uid;
        SlotGameData.playerInfo.userName = App.userData().userInfo.nickName;
        SlotGameData.playerInfo.headIcon = App.userData().userIcon;
        const slotGameDataScript = App.SubGameManager?.getSlotGameDataScript?.();
        if (slotGameDataScript) {
            SlotGameData.curBetList = slotGameDataScript.getBetMults();
            SlotGameData.playerInfo.score = Utils.getMyScore();
            SlotGameData.playerInfo.score = App.TransactionData.amount;
            slotGameDataScript.setShowResultFinish(true);
        } else {
            // 编辑器测试模式，使用默认值
            SlotGameData.curBetList = [1, 2, 3, 5, 10, 15];
            SlotGameData.playerInfo.score = 10000;
        }
        // } else {
        //     SlotGameData.playerInfo.score = 10000;
        // }
    }

    onDestroy(): void {
        director.off("TsFrameMsg_Spin");
    }

    start() {
        this.onInitMapInfo(this.getRandomMapList().mapInfo);
    }

    onInitMapInfo(mapInfo: any) {
        console.log(mapInfo);
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + '_InitMapInfo', mapInfo);
    }

    onMidEnter() {
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_MidEnter");
    }

    onEventMsg_StartSpin(msg: any) {
        console.log(msg);
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_StartSpin", msg);
    }

    reqSpinMsg(betIdx: number, autoVal = null, buyDouble) {
        if (!SlotGameData.isFreeMode && SlotGameData.isResetNextWinNum) {
            SlotGameData.scriptBottom.updateWinNum(0);
        }
        if (SlotGameData.IS_SINGLE_MODLE) {
            this.scheduleOnce(() => {
                let msg = this.getSingleModeSpinMsgData();
                console.log(msg);
                EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_StartSpin", msg);
            }, 0.1);
        } else {
            let isRespin = SlotGameData.isRespinMode || SlotGameData.isFreeMode;
            if (!isRespin) {
                if (!buyDouble) {
                    SlotGameData.playerInfo.score -= SlotGameData.curBetList[betIdx - 1];
                } else {
                    SlotGameData.playerInfo.score -= SlotGameData.curBetList[betIdx - 1] * 1.5;
                }
                EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + '_PlayerScoreChange');
            }
            Utils.reqSpin(betIdx, autoVal, false, buyDouble);
        }
    }

    getSingleModeSpinMsgData() {
        return {};
    }

    getRandomMapList() {
        return {
            mapInfo: {},
        };
    }

    // 开奖列表数据转换为二维数据
    getItemPosByServerIndex(index: number, colNum: number): PosData {
        let row = Math.floor(index / colNum);
        let col = index - colNum * row;
        return {
            col: col,
            row: row
        };
    }

}