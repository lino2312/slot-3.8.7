import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

import { Component, Node, UIOpacity, UITransform, Vec3, _decorator, instantiate, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777NiceWin')
export default class Diamond777NiceWin extends Component {

    @property(Node)
    ndNiceWinLight: Node = null;

    @property(Node)
    ndNiceWinText: Node = null;

    @property(Node)
    ndNiceWinNum: Node = null;

    private cbRemove: Function = null;
    private curRollingIndex = 0;
    private winScore = 0;
    private cbRollComplete: Function = null;
    private scrollEffectId = 0;
    private nickwinEffectId = 0;
    private ndNiceWinNumTmp: Node = null;

    private ndParticle: Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

    }

    start () {

    }

    // update (dt) {}

    onInit (cbRemove: Function, curRollingIndex: number, win: number, cbRollComplete: Function, ndParticle: Node) {
        this.cbRemove = cbRemove;
        this.curRollingIndex = curRollingIndex;
        this.winScore = win;
        this.cbRollComplete = cbRollComplete;
        this.ndParticle = ndParticle;
        this.ndParticle.getComponent(UIOpacity).opacity = 255;
        let spineLight = this.ndNiceWinLight.getComponent(MySpine)
        spineLight.playAni(0, false, () => {
            spineLight.playAni(1, true);
        });
        let spineText = this.ndNiceWinText.getComponent(MySpine);
        spineText.playAni(0, false, () => {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, "nice_win", () => {
                this.nickwinEffectId = 0;
            }, (effectId: number) => {
                this.nickwinEffectId = effectId;
            });
            spineText.playAni(1, true);
        });
        this.ndNiceWinNum.getComponent(UIOpacity).opacity = 255;
        let rnWin = this.ndNiceWinNum.getComponent(RollNumber);
        rnWin.init();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1", () => {
            this.scrollEffectId = 0;
        }, (effectId: number) => {
            this.scrollEffectId = effectId;
            rnWin.setScrollTime(Utils.getAudioDuration(effectId));
            rnWin.scrollTo(this.winScore, () => {
                if (this.cbRollComplete) {
                    this.cbRollComplete();
                }
                spineLight.playAni(2, false);
                spineText.playAni(2, false);
                if (this.node.getComponent(UIOpacity).opacity > 0) {
                    this.ndNiceWinNumTmp = instantiate(this.ndNiceWinNum);
                    this.ndNiceWinNumTmp.parent = SlotGameData.scriptBottom.ndWinNum.parent;
                    this.ndNiceWinNum.getComponent(UIOpacity).opacity = 0;
                    let this_ndNiceWinNum_uiTransform = this.ndNiceWinNum.getComponent(UITransform) as UITransform;
                    let worldPos = this_ndNiceWinNum_uiTransform.convertToWorldSpaceAR(v3());
                    let SlotGameData_scriptBottom_ndWinNum_uiTransform = SlotGameData.scriptBottom.ndWinNum.getComponent(UITransform) as UITransform;
                    this.ndNiceWinNumTmp.position = SlotGameData_scriptBottom_ndWinNum_uiTransform.convertToNodeSpaceAR(worldPos);
                    tween(this.ndNiceWinNumTmp)
                        .to(this.ndNiceWinText.getComponent(MySpine).getAniDuration(2), { position: SlotGameData.scriptBottom.ndWinNum.position })
                        .call(() => {
                            this.ndNiceWinNumTmp.destroy();
                            this.ndNiceWinNumTmp = null;
                            if (this.node.getComponent(UIOpacity).opacity > 0) {
                                this.onRemove();
                            }
                            this.node.destroy();
                        })
                        .start();
                } else {
                    this.node.destroy();
                }
            });
        });
        this.node.scale = new Vec3(0, 0, 0);
        tween(this.node)
            .to(this.ndNiceWinText.getComponent(MySpine).getAniDuration(0), { scale: new Vec3(1, 1, 1) })
            .start();
    }

    onStop () {
        this.onRemove();
        if (this.scrollEffectId) {
            Utils.stopEffect(this.scrollEffectId);
            this.scrollEffectId = 0;
        }
        if (this.nickwinEffectId) {
            Utils.stopEffect(this.nickwinEffectId);
            this.nickwinEffectId = 0;
        }
        if (this.ndNiceWinNumTmp) {
            this.ndNiceWinNumTmp.getComponent(UIOpacity).opacity = 0;
        }
        let rnWin = this.ndNiceWinNum.getComponent(RollNumber);
        if (rnWin.getIsScrolling()) {
            rnWin.stop();
        }
    }

    onRemove () {
        this.node.getComponent(UIOpacity).opacity = 0;
        this.ndParticle.getComponent(UIOpacity).opacity = 0;
        if (this.cbRemove) {
            this.cbRemove();
        }
    }

}
