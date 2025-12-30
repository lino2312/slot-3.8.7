import Diamond777Game from "db://assets/games/Diamond777/script/Diamond777Game";
import Diamond777Slots from "db://assets/games/Diamond777/script/Diamond777Slots";
import EventDispatcher from "db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher";
import GameEnter from "db://assets/scripts/game/tsFrameCommon/Base/GameEnter";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

import { _decorator } from 'cc';
import { App } from "db://assets/scripts/App";
const { ccclass, property } = _decorator;

@ccclass('Diamond777Scene')
export default class Diamond777Scene extends GameEnter {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_SkipSpin", this.onEventMsg_SkipSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(Diamond777Game);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(Diamond777Slots);
        App.AudioManager.playBGM('audio/bgm');
        // Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
    }

    start() {
        super.start();
    }

    // update (dt) {}

    onEventMsg_InitMapList(mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as Diamond777Slots).onInitMapInfo(mapInfo);
    }

    onEventMsg_WaitSpinMsg() {
        (SlotGameData.scriptSlots as Diamond777Slots).onWaitSpinMsg();
    }

    onEventMsg_StartSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Diamond777Slots).onStartSpin(data);
    }

    onEventMsg_StopSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Diamond777Slots).onStopSpin();
    }

    onEventMsg_SkipSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Diamond777Slots).onSkipSpin();
    }

    onBetChange() {
        (SlotGameData.scriptGame as Diamond777Game).updateScoreList();
    }
}
