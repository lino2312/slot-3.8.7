import { _decorator, Label, Node } from 'cc';
import { App } from "../../../App";
import EventDispatcher from "../Base/EventDispatcher";
import Utils from "../Base/MyUtils";
import ViewComponent from "../Base/ViewComponent";
import SlotGameData from "./SlotsGameData";
const { ccclass, property } = _decorator;

@ccclass
export default class SlotsSpinOptions extends ViewComponent {

    @property(Node)
    ndSpeeds: Node = null;

    @property(Node)
    ndAutoSpins: Node = null;

    @property(Label)
    lbBetScore: Label = null;

    protected cbSpeedChange: Function = null;
    protected cbBetChange: Function = null;
    protected cbAutoConfirm: Function = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();
        for (let i = 0; i < this.ndSpeeds.children.length; i++) {
            let ndSpeed = this.ndSpeeds.children[i];
            ndSpeed.children[0].children[1].getComponent(Label).string = SlotGameData.curSpeedList[i];
            ndSpeed.children[1].children[1].getComponent(Label).string = SlotGameData.curSpeedList[i];
        }
        for (let i = 0; i < this.ndAutoSpins.children.length; i++) {
            let ndAutoSpin = this.ndAutoSpins.children[i];
            let autoTimes = SlotGameData.curAutoList[i];
            ndAutoSpin.children[0].children[1].getComponent(Label).string = autoTimes != -1 ? autoTimes.toString() : '∞';
            ndAutoSpin.children[1].children[1].getComponent(Label).string = autoTimes != -1 ? autoTimes.toString() : '∞';
        }
    }

    start() {
        super.start();
    }

    // update (dt) {}

    init(cbClose: Function, cbSpeedChange: Function, cbAutoConfirm: Function) {
        this.cbClose = cbClose;
        this.cbSpeedChange = cbSpeedChange;
        this.cbAutoConfirm = cbAutoConfirm;
        this.updateSpeedList();
        this.updateAutoSpinList();
        this.updateTotalBet();
        this.openAction();
    }

    onClickClose() {
        Utils.playSlotsCommonEffect('slot_openBetSelector');
        super.onClickClose();
    }

    onClickSpeeds(_event, data: string) {
        Utils.playSlotsCommonEffect('slot_openBetSelector');
        SlotGameData.curSpeedIndex = parseInt(data);
        this.updateSpeedList();
        if (this.cbSpeedChange) {
            this.cbSpeedChange();
        }
    }

    onClickAutoSpins(_event, data: string) {
        Utils.playSlotsCommonEffect('slot_openBetSelector');
        SlotGameData.curAutoIndex = parseInt(data);
        this.updateAutoSpinList();
    }

    onClickMinus() {
        if (SlotGameData.curBetIndex > 0) {
            SlotGameData.curBetIndex--;
        }
        this.onPlayBetAudio();
        this.updateTotalBet();
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_BetChange");
    }

    onClickAdd() {
        if (SlotGameData.curBetIndex < SlotGameData.curBetList.length - 1) {
            SlotGameData.curBetIndex++;
        }
        this.onPlayBetAudio();
        this.updateTotalBet();
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_BetChange");
    }

    onClickAutoConfirm() {
        SlotGameData.totalAutoTimes = SlotGameData.curAutoList[SlotGameData.curAutoIndex];
        SlotGameData.autoTimes = 0;
        if (this.cbAutoConfirm) {
            this.cbAutoConfirm();
        }
        this.onClickClose();
    }

    updateSpeedList() {
        for (let i = 0; i < this.ndSpeeds.children.length; i++) {
            let ndSpeed = this.ndSpeeds.children[i];
            ndSpeed.children[0].active = i != SlotGameData.curSpeedIndex;
            ndSpeed.children[1].active = i == SlotGameData.curSpeedIndex;
        }
    }

    updateAutoSpinList() {
        for (let i = 0; i < this.ndAutoSpins.children.length; i++) {
            let ndAutoSpin = this.ndAutoSpins.children[i];
            ndAutoSpin.children[0].active = i != SlotGameData.curAutoIndex;
            ndAutoSpin.children[1].active = i == SlotGameData.curAutoIndex;
        }
    }

    updateTotalBet() {
        if (SlotGameData.buyDouble) {
            this.lbBetScore.string = (SlotGameData.getCurBetScore() * 1.5).toString();
        } else {
            this.lbBetScore.string = SlotGameData.getCurBetScore().toString();
        }
    }

    //播放押注变化的音效
    onPlayBetAudio() {
        let idx = SlotGameData.curBetIndex + 1
        let maxLen = SlotGameData.curBetList.length
        let filename = "bet" + idx
        if (idx == maxLen) {
            filename = "global_max_bet"
        }
        //Utils.playSlotsCommonEffect('bet/' + filename)
        App.AudioManager.playSfx("audio/slotGame/bet/", filename, null, true);
    }
}
