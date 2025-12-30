import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import ViewComponent from "db://assets/scripts/game/tsFrameCommon/Base/ViewComponent";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

import { Node, Tween, UIOpacity, Vec3, _decorator, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Super777IFreeStart')
export default class Super777IFreeStart extends ViewComponent {

    @property(Node)
	ndAni: Node = null;

    @property(Node)
	ndStart: Node = null;

    private isClicked = false;
    private isStartAniEnd = false;
    private isStartEnd = false; 
    private readyTime = 0;

    private startBtnScale: Vec3 = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onInit (cbClose: Function) {
        this.cbClose = cbClose;
        this.isClicked = false;
        this.isStartAniEnd = false;
        this.isStartEnd = false;
        this.ndStart.getComponent(UIOpacity).opacity = 0;
        this.startBtnScale = this.ndStart.scale;
        this.openAction(() => {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'free_games_awarded');
            Utils.playEffect(SlotGameData.BUNDLE_NAME, '10109_fg_trigger', () => {
                this.playEndAni();
            }, (effectId: number) => {
                this.ndAni.getComponent(MySpine).playAni(0, false, () => {
                    this.ndAni.getComponent(MySpine).playAni(1, true);
                    if (!this.isClicked) {
                        this.ndStart.getComponent(UIOpacity).opacity = 255;
                        this.ndStart.scale = new Vec3(0, 0, 0);
                        Tween.stopAllByTarget(this.ndStart);
                        tween(this.ndStart)
                            .to(0.3, {scale: this.startBtnScale})
                            .start();
                    }
                });
                this.onReadyEnd();
                if (this.isClicked) {
                    this.playEndAni();
                }
            });
        });
    }

    onClickClose () {
        if (this.isClicked) {
            return;
        }
        this.isClicked = true;
        if (this.isStartAniEnd) {
            this.playEndAni();
        }
    }

    onReadyEnd () {
        this.readyTime = Date.now();
        this.isStartAniEnd = true;
        this.playEndAni();
    }

    playEndAni() {
        if (this.isStartEnd) {
            return;
        }
        this.isStartEnd = true;
        if (this.ndStart.getComponent(UIOpacity).opacity != 255) {
            Tween.stopAllByTarget(this.ndStart);
            this.ndStart.getComponent(UIOpacity).opacity = 255;
            this.ndStart.scale = this.startBtnScale;
        }
        let timeout = 0;
        if (Date.now() - this.readyTime < 1000) {
            timeout = 1000 - (Date.now() - this.readyTime);
        }
        setTimeout(() => { Tween.stopAllByTarget(this.ndStart);
            tween(this.ndStart)
                .to(0.3, {scale: new Vec3(0, 0, 0) })
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
