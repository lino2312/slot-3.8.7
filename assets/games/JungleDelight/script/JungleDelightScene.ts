import { _decorator, Component } from 'cc';
// import JungleDelightGame from './JungleDelightGame';
// import JungleDelightSlots from './JungleDelightSlots';
import SlotGameData, { SlotMapInfo, SlotSpinMsgData } from 'db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData';
import { ServerJungleDelightMsgData } from './JungleDelightData';
import EventDispatcher from 'db://assets/scripts/game/tsFrameCommon/Base/EventDispatcher';
import GameEnter from 'db://assets/scripts/game/tsFrameCommon/Base/GameEnter';
import JungleDelightGame from './JungleDelightGame';
import JungleDelightSlots from './JungleDelightSlots';

const {ccclass, property} = _decorator;

@ccclass('JungleDelightScene')
export default class JungleDelightScene extends GameEnter {

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();

        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME+"_InitMapInfo", this.onEventMsg_InitMapList, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StartSpin", this.onEventMsg_StartSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_StopSpin", this.onEventMsg_StopSpin, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onBetChange, this);

        SlotGameData.scriptGame = this.ndGame.getComponent(JungleDelightGame);
        SlotGameData.scriptSlots = this.ndSlots.getComponent(JungleDelightSlots);
    }
    start () {
        super.start();
    }

    update (dt) {}

    onEventMsg_InitMapList (mapInfo: SlotMapInfo) {
        (SlotGameData.scriptSlots as JungleDelightSlots).onInitMapInfo(mapInfo);
    }

    onEventMsg_StartSpin(data: ServerJungleDelightMsgData) {
        (SlotGameData.scriptSlots as JungleDelightSlots).onStartSpin(data);
    }

    onEventMsg_StopSpin(data: SlotSpinMsgData) {
        (SlotGameData.scriptSlots as JungleDelightSlots).onStopSpin();
    }

    onBetChange() {
        let pro = SlotGameData.curBetIndex / SlotGameData.curBetList.length - 1;
        (SlotGameData.scriptGame as JungleDelightGame).changeBetEfect(pro);
    }
}
