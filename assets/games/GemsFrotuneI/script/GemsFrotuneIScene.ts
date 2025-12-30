import EventDispatcher from "db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher";
import GameEnter from "db://assets/scripts/game/tsFrameCommon/Base/GameEnter";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import { ServerGemsFrotuneIMsgData } from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIData";
import GemsFrotuneIGame from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIGame";
import GemsFrotuneISlots from "db://assets/games/GemsFrotuneI/script/GemsFrotuneISlots";

import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIScene')
export default class GemsFrotuneIScene extends GameEnter {

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg", this.onEventMsg_WaitSpinMsg, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(GemsFrotuneIGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(GemsFrotuneISlots);
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onEventMsg_InitMapList (mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as GemsFrotuneISlots).onInitMapInfo(mapInfo);
    }

    onEventMsg_WaitSpinMsg() {
        (SlotGameData.scriptSlots as GemsFrotuneISlots).onWaitSpinMsg();
    }

    onEventMsg_StartSpin(data: ServerGemsFrotuneIMsgData) {
        (SlotGameData.scriptSlots as GemsFrotuneISlots).onStartSpin(data);
    }

    onEventMsg_StopSpin (_data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as GemsFrotuneISlots).onStopSpin();
    }

    onBetChange () {

    }
}