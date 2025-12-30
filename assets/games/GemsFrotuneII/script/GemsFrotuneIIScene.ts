import EventDispatcher from "db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher";
import GameEnter from "db://assets/scripts/game/tsFrameCommon/Base/GameEnter";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import { ServerGemsFrotuneIIMsgData } from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIData";
import GemsFrotuneIIGame from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIGame";
import GemsFrotuneIISlots from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIISlots";

import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIIScene')
export default class GemsFrotuneIIScene extends GameEnter {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);
        
        SlotGameData.scriptGame = this.ndGame.getComponent(GemsFrotuneIIGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(GemsFrotuneIISlots);
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onEventMsg_InitMapList (mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as GemsFrotuneIISlots).onInitMapInfo(mapInfo);
    }

    onEventMsg_WaitSpinMsg() {
        (SlotGameData.scriptSlots as GemsFrotuneIISlots).onWaitSpinMsg();
    }

    onEventMsg_StartSpin(data: ServerGemsFrotuneIIMsgData) {
        (SlotGameData.scriptSlots as GemsFrotuneIISlots).onStartSpin(data);
    }

    onEventMsg_StopSpin (data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as GemsFrotuneIISlots).onStopSpin();
    }

    onBetChange() {
        (SlotGameData.scriptSlots as GemsFrotuneIISlots).updateWheelView();
    }
}
