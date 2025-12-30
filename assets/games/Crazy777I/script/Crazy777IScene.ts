import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

// import EventDispatcher from 'db://assets/scripts/Ts_frame_common/Base/EventDispatcher';
// import Utils from 'db://assets/scripts/Ts_frame_common/Base/MyUtils';
// import GameEnter from "../../../scripts/Ts_frame_common/Base/GameEnter";
// import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "../../../scripts/Ts_frame_common/Slot/SlotsGameData";
import { App } from 'db://assets/scripts/App';
import EventDispatcher from 'db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher';
import GameEnter from 'db://assets/scripts/game/tsFrameCommon/Base/GameEnter';
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from 'db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData';
import Crazy777IGame from "./Crazy777IGame";
import Crazy777ISlots from "./Crazy777ISlots";
@ccclass('Crazy777IScene')
export default class Crazy777IScene extends GameEnter {
    //    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(Crazy777IGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(Crazy777ISlots);

        // Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
        App.AudioManager.playBGM('audio/bgm');
    }
    start() {
        super.start();
    }
    //    // update (dt) {}
    onEventMsg_InitMapList(mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as Crazy777ISlots).onInitMapInfo(mapInfo);
    }
    onEventMsg_WaitSpinMsg() {
        (SlotGameData.scriptSlots as Crazy777ISlots).onWaitSpinMsg();
    }
    onEventMsg_StartSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Crazy777ISlots).onStartSpin(data);
    }
    onEventMsg_StopSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Crazy777ISlots).onStopSpin();
    }
    onBetChange() {
        (SlotGameData.scriptGame as Crazy777IGame).updateScoreList();
    }
}
