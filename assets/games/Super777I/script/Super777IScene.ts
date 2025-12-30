import Super777IGame from "db://assets/games/Super777I/script/Super777IGame";
import Super777ISlots from "db://assets/games/Super777I/script/Super777ISlots";
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
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_MidEnter", this.onEventMsg_MidEnter, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_SkipSpin", this.onEventMsg_SkipSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(Super777IGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(Super777ISlots);

        // Utils.playMusic(SlotGameData.BUNDLE_NAME, "base_bgm", false, () => {
        //     Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
        // });
        App.AudioManager.playBGM('audio/bgm');
    }

    start() {
        super.start();
    }

    // update (dt) {}

    onEventMsg_InitMapList(mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as Super777ISlots).onInitMapInfo(mapInfo);
    }

    onEventMsg_MidEnter() {
        (SlotGameData.scriptSlots as Super777ISlots).onMidEnter();
    }

    onEventMsg_WaitSpinMsg() {
        (SlotGameData.scriptSlots as Super777ISlots).onWaitSpinMsg();
    }

    onEventMsg_StartSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Super777ISlots).onStartSpin(data);
    }

    onEventMsg_StopSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Super777ISlots).onStopSpin();
    }

    onEventMsg_SkipSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as Super777ISlots).onSkipSpin();
    }

    onBetChange() {
        (SlotGameData.scriptGame as Super777IGame).updateScoreList();
    }
}
