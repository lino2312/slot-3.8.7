import EventDispatcher from "db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher";
import GameEnter from "db://assets/scripts/game/tsFrameCommon/Base/GameEnter";
import SlotGameData, { SlotMapInfo } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import MoneyComingData, { MoneyComingMode, MoneyComingSpecialStatus, MoneyComingSpinMsgData } from "db://assets/games/MoneyComing/script/MoneyComingData";
import MoneyComingGame from "db://assets/games/MoneyComing/script/MoneyComingGame";
import MoneyComingSlots from "db://assets/games/MoneyComing/script/MoneyComingSlots";
import MoneyComingWheel from "db://assets/games/MoneyComing/script/MoneyComingWheel";

import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyComingScene')
export default class MoneyComingScene extends GameEnter {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME+"_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_SkipSpin", this.onEventMsg_SkipSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(MoneyComingGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(MoneyComingSlots);
        SlotGameData.scriptWheel = this.ndWheel.getComponent(MoneyComingWheel);
    }

    start() {
        super.start();
    }

    // update (dt) {}


    onEventMsg_InitMapList(mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as MoneyComingSlots).onInitMapInfo(mapInfo);
    }

    onEventMsg_WaitSpinMsg () {
        (SlotGameData.scriptSlots as MoneyComingSlots).onWaitSpinMsg();
    }

    onEventMsg_StartSpin(data: MoneyComingSpinMsgData) {
        (SlotGameData.scriptSlots as MoneyComingSlots).onStartSpin(data);
    }

    onEventMsg_StopSpin(data: MoneyComingSpinMsgData) {
        (SlotGameData.scriptSlots as MoneyComingSlots).onStopSpin();
    }

    onEventMsg_SkipSpin (data: MoneyComingSpinMsgData) {
        (SlotGameData.scriptSlots as MoneyComingSlots).onSkipSpin();
    }

    onBetChange() {
        (SlotGameData.scriptGame as MoneyComingGame).updateBetChange();
    }
}
