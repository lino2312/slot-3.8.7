import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import ViewComponent from "db://assets/scripts/game/tsFrameCommon/Base/ViewComponent";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import MoneyComingData, { MoneyComingWinType } from "db://assets/games/MoneyComing/script/MoneyComingData";

import { Node, UIOpacity, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyComingBigWin')
export default class MoneyComingBigWin extends ViewComponent {

    @property([Node])
	ndAniList: Node[] = [];

    @property(Node)
	ndFrameAni: Node = null;

    @property(Node)
	ndWin: Node = null;

    private winScore = 0;
    private cbRollComplete: Function = null;
    private isClicked = false;
    private isStartAniEnd = false;
    private isEndAniReady = false;
    private isStartEnd = false;
    private winType = MoneyComingWinType.Big;
    private readyTime = 0;
    private timeout = null;

    private ndParticle: Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onInit (cbClose: Function, win: number, winType: MoneyComingWinType, cbRollComplete: Function, ndParticle: Node) {
        this.cbClose = cbClose;
        this.winScore = win;
        this.winType = winType-1;
        this.cbRollComplete = cbRollComplete;
        this.isClicked = false;
        this.isStartAniEnd = false;
        this.isEndAniReady = false;
        this.isStartEnd = false;
        this.readyTime = 0;
        this.ndParticle = ndParticle;
        this.ndParticle.getComponent(UIOpacity).opacity = 0;
        let rnWin = this.ndWin.getComponent(RollNumber);
        rnWin.init();
        this.ndAniList.forEach((element, i) => {
            element.active = i == this.winType;
        });
        this.ndAniList[this.winType].getComponent(MySpine).playAni(0, false, () => {
            this.ndAniList[this.winType].getComponent(MySpine).playAni(1, true);
        });
        this.ndFrameAni.getComponent(MySpine).playAni(0, false, () => {
            this.ndFrameAni.getComponent(MySpine).playAni(1, true);
        });
        this.openAction(() => {
            this.ndParticle.getComponent(UIOpacity).opacity = 255;
            let audioWin = '';
            switch (winType) {
                case MoneyComingWinType.Big:
                    audioWin = 'win_bigwin';
                    break;
                case MoneyComingWinType.Mega:
                    audioWin = 'win_mega';
                    break;
                case MoneyComingWinType.Super:
                    audioWin = 'win_super';
                    break;
                default:
                    break;
            }
            Utils.playEffect(SlotGameData.BUNDLE_NAME, audioWin, null, (effectId: number) => {
                this.isStartAniEnd = true;
                rnWin.setScrollTime(Utils.getAudioDuration(effectId));
                rnWin.scrollTo(this.winScore, () => {
                    this.readyTime = Date.now();
                    this.isEndAniReady = true;
                    if (this.cbRollComplete) {
                        this.cbRollComplete();
                    }
                    let timeout = 2000;
                    if (this.isClicked) {
                        timeout = 0;
                    }
                    this.timeout = setTimeout(() => {
                        this.playEndAni();
                    }, timeout);
                });
                if (this.isClicked) {
                    setTimeout(() => {
                        rnWin.stop();
                    }, 100);
                }
            });
        });
    }

    onClickClose () {
        if (this.isClicked) {
            return;
        }
        this.isClicked = true;
        if (!this.isStartAniEnd) {
            
        } else if (!this.isEndAniReady) {
            this.isEndAniReady = true;
            let rnWin = this.ndWin.getComponent(RollNumber);
            rnWin.stop();
        } else {
            this.playEndAni();
        }
    }

    playEndAni() {
        if (this.isStartEnd) {
            return;
        }
        this.isStartEnd = true;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        let timeout = 0;
        if (this.isClicked) {
            let curTime = Date.now();
            if (curTime - this.readyTime < 500) {
                timeout = 500 - (curTime - this.readyTime);
            }
        }
        setTimeout(() => {
            this.ndAniList[this.winType].getComponent(MySpine).playAni(2, false);
            this.ndFrameAni.getComponent(MySpine).playAni(2, false);
            super.closeAction(() => {
                this.ndParticle.getComponent(UIOpacity).opacity = 0;
                Utils.stopAllEffect();
                if (this.cbClose) {
                    this.cbClose();
                }
            }, this.ndAniList[this.winType].getComponent(MySpine).getAniDuration(2), false);
        }, timeout);
    }

}
