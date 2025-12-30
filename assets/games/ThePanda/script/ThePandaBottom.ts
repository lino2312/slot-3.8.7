import { _decorator } from 'cc';
import { SlotGameBottomBase } from 'db://assets/scripts/game/slotgame/SlotGameBottomBase';

const { ccclass } = _decorator;

@ccclass('ThePandaBottom')
export class ThePandaBottom extends SlotGameBottomBase {

    onClickSpin() {
        let slots = this.slotGameDataScript.getSlotsScript();
        let res = this.checkCoinEnough();
        if (res) {
            slots.onSpin();
        }
        super.onClickSpin();
    }

    canDoNextRound() {
        this.isStartRound = false;
        this.showBtnsByState("idle");
        this.checkForsePoptips();
        let selectdata = this.slotGameDataScript.getSelectData();
        let bonusdata = this.slotGameDataScript.getBounusData();
        if (bonusdata.state || selectdata.state) {
            this.sendSpinReq();
            return;
        }
        let autoTime = this.slotGameDataScript.getAutoModelTime();
        if (autoTime > 0) {
            let cfg = this.slotGameDataScript.getGameCfg();
            this.scheduleOnce(this.doAutoSpine.bind(this), cfg.autoModelDelay);
        }
    }

}
