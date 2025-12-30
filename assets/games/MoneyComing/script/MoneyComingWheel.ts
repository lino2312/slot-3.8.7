import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import MoneyComingData, { MoneyComingSpinMsgData } from "db://assets/games/MoneyComing/script/MoneyComingData";
import MoneyComingGame from "db://assets/games/MoneyComing/script/MoneyComingGame";

import { Label, Node, _decorator } from 'cc';
import { RotatingLottery, RotatingLottery_ } from "db://assets/scripts/game/tsFrameCommon/Base/RotatingLottery";
const { ccclass, property } = _decorator;

@ccclass('MoneyComingWheel')
export default class MoneyComingWheel extends BaseComponent {

    @property(Node)
    ndRotatingLottery: Node = null;

    @property(Node)
    ndNormalBg: Node = null;

    @property(Node)
    ndSpecialBg: Node = null;

    @property(Node)
    ndNormalCenter: Node = null;

    @property(Node)
    ndSpecialCenter: Node = null;

    @property([Node])
    ndWheelAniList: Node[] = [];

    @property(Node)
    ndCenterAni: Node = null;

    @property(Node)
    ndChangeBetAni: Node = null;

    @property(Node)
    ndLockAni: Node = null;

    @property(Node)
    ndTips: Node = null;

    // LIFE-CYCLE CALLBACKS:

    isLock = true;
    isResetView = false;

    onLoad () {
        this.playLockAni(0);
        this.resetRewardAni();
        this.ndTips.active = true;
    }

    start () {
        this.startWheelIdleAni();
    }

    // update (dt) {}

    onStartWheel () {
        this.resetView();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'wheel_run');
        this.isResetView = false;
        let scriptWheel = this.ndRotatingLottery.getComponent(RotatingLottery);
        const config = new RotatingLottery_.ScrollConfig({
			tweenIndexNS: [0],
			turnN: 10,
		});
        scriptWheel.stop();
        scriptWheel.move(MoneyComingData.curRollServerData.wheelRewardIndex, {
			...config,
			endCBF: this.updateWheelEnd.bind(this),
		});
        this.playRewardAni(0);
    }

    updateWheelEnd () {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'wheel_reward');
        this.playRewardAni(1);
        this.playRewardAni(2);
        this.setTimeout(() => {
            (SlotGameData.scriptGame as MoneyComingGame).onSlotEnd(() => {
                this.resetRewardAni();
                this.startWheelIdleAni();
            });
        }, 1000);
    }

    updateWheelBg (isSpecial: boolean) {
        this.ndNormalBg.active = !isSpecial;
        this.ndSpecialBg.active = isSpecial;
        this.ndNormalCenter.active = !isSpecial;
        this.ndSpecialCenter.active = isSpecial;
    }

    udpateWheelItemList () {
        let curWheelConfig = MoneyComingData.getCurBetWheelConfig();
        let scriptWheel = this.ndRotatingLottery.getComponent(RotatingLottery);
        scriptWheel.contentNode.children.forEach((item, i) => {
            let lbReward = item.getChildByName('reward').getComponent(Label);
            lbReward.string = Utils.floatToFormat(curWheelConfig[i], 2, true, false, true);
        });
    }

    startWheelIdleAni () {
        let scriptWheel = this.ndRotatingLottery.getComponent(RotatingLottery);
        scriptWheel.stop();
        scriptWheel.loop(5);
    }

    resetRewardAni () {
        this.ndWheelAniList.forEach(element => {
            element.active = false;
        });
    }

    playRewardAni (index: number) {
        let ndAni = this.ndWheelAniList[index];
        ndAni.active = true;
        ndAni.getComponent(MySpine).playAni(0, true);
    }

    playCenterAni (callback: Function = null) {
        this.ndCenterAni.getComponent(MySpine).playAni(0, false, callback);
    }

    playChangeBetAni (callback: Function = null) {
        this.ndChangeBetAni.getComponent(MySpine).playAni(0, false, callback);
    }

    playLockAni (index: number, callback: Function = null) {
        this.ndLockAni.getComponent(MySpine).playAni(index, false, callback);
    }

    startLockAni () {
        this.isLock = true;
        this.playLockAni(2, () => {
            this.ndTips.active = true;
            this.playLockAni(0);
        });
    }

    startUnLockAni () {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'wheel_unlock');
        this.isLock = false;
        this.ndTips.active = false;
        this.playLockAni(1);
    }

    getIsLock () {
        return this.isLock;
    }

    resetView() {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
    }

}
