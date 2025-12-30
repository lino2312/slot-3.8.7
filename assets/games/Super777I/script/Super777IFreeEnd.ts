import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import ViewComponent from "db://assets/scripts/game/tsFrameCommon/Base/ViewComponent";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

import { Node, Tween, UIOpacity, Vec3, _decorator, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Super777IFreeEnd')
export default class Super777IFreeEnd extends ViewComponent {

    @property(Node)
	ndAni: Node = null;

    @property(Node)
	ndWin: Node = null;

    @property(Node)
	ndCollect: Node = null;

    private winScore = 0;
    private cbRollComplete: Function = null;
    private isClicked = false;
    private isStartAniEnd = false;
    private isEndAniReady = false;  
    private isStartEnd = false; 
    private readyTime = 0;

    private collectBtnScale: Vec3 = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onInit (cbClose: Function, win: number, cbRollComplete: Function) {
        this.cbClose = cbClose;
        this.winScore = win;
        this.cbRollComplete = cbRollComplete;
        this.isClicked = false;
        this.isStartAniEnd = false;
        this.isEndAniReady = false;
        this.isStartEnd = false;
        this.ndCollect.getComponent(UIOpacity).opacity = 0;
        this.collectBtnScale = this.ndCollect.scale;
        let rnWin = this.ndWin.getComponent(RollNumber);
        rnWin.init();
        this.openAction(() => {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'congratulations');
            Utils.playEffect(SlotGameData.BUNDLE_NAME, '10109_fg_win_pop', () => {
                if (!this.isClicked) {
                    this.onReadyEnd();
                }
            }, () => {
                this.ndAni.getComponent(MySpine).playAni(0, false, () => {
                    this.ndAni.getComponent(MySpine).playAni(1, true);
                    this.ndCollect.getComponent(UIOpacity).opacity = 255;
                    this.ndCollect.scale = new Vec3(0, 0, 0);
                    Tween.stopAllByTarget(this.ndCollect);
                    tween(this.ndCollect)
                        .to(0.3, { scale: this.collectBtnScale })
                        .start();
                });
                this.isStartAniEnd = true;
            });
            Utils.playEffect(SlotGameData.BUNDLE_NAME, '10109_fg_win_pop_roll', null, (effectId: number) => {
                rnWin.setScrollTime(Utils.getAudioDuration(effectId));
                rnWin.scrollTo(this.winScore, () => {
                    if (this.isClicked) {
                        this.onReadyEnd();
                    }
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
            let rnWin = this.ndWin.getComponent(RollNumber);
            if (rnWin.getIsScrolling()) {
                rnWin.stop();
            } else {
                this.onReadyEnd();
            }
        }
    }

    onReadyEnd () {
        this.readyTime = Date.now();
        this.isEndAniReady = true;
        if (this.cbRollComplete) {
            this.cbRollComplete();
        }
        this.playEndAni();
    }

    playEndAni() {
        if (this.isStartEnd) {
            return;
        }
        this.isStartEnd = true;
        if (this.ndCollect.getComponent(UIOpacity).opacity != 255) {
            Tween.stopAllByTarget(this.ndCollect);
            this.ndCollect.getComponent(UIOpacity).opacity = 255;
            this.ndCollect.scale = this.collectBtnScale;
        }
        this.ndCollect.setSiblingIndex(1000);
        let timeout = 0;
        if (Date.now() - this.readyTime < 1000) {
            timeout = 1000 - (Date.now() - this.readyTime);
        }
        setTimeout(() => { Tween.stopAllByTarget(this.ndCollect);
            tween(this.ndCollect)
                .to(0.3, { scale: new Vec3(0, 0, 0) })
                .start();
            this.ndAni.getComponent(MySpine).playAni(2, false);
            this.closeAction(() => {
                Utils.stopAllEffect();
                if (this.cbClose) {
                    this.cbClose();
                }
            }, this.ndAni.getComponent(MySpine).getAniDuration(2));
        }, timeout);
    }

}
