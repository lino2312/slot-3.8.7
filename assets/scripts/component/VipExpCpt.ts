import { _decorator, Component, find, Label, ProgressBar, Sprite, tween, Vec3, Node, UITransform } from "cc";
import { App } from "../App";

const { ccclass, property } = _decorator;

@ccclass
export default class VipExpCpt extends Component {

    @property(Sprite)
    icon: Sprite = null;
    @property(Label)
    label: Label = null;
    @property(ProgressBar)
    progress: ProgressBar = null;
    @property(Node)
    animNode: Node = null;


    private svip: number;
    private svipexp: number;
    private nextvipexp: number;

    onLoad() {
        this.svip = App.userData().svip;
        this.svipexp = App.userData().svipexp;
        this.nextvipexp = App.userData().nextvipexp;
    }

    updateVipNoAnim() {
        // 在当前等级进度计算
        let need = this.nextvipexp;
        let cur = this.svipexp;
        let per = need ? cur / need : 1;
        per = Math.min(per, 1);
        per = Math.max(per, 0);
        if (!need) {
            this.label.string = App.FormatUtils.FormatNumToComma(cur);
        } else {
            this.label.string = App.FormatUtils.formatNumShort(cur) + "/" + App.FormatUtils.formatNumShort(need);
        }
        App.ComponentUtils.setVipFrame(this.icon, this.svip);
        this.progress.progress = per;
    }


    // 更新VIP进度条
    updateVipExp() {
        if (this.svipexp == undefined) {
            this.svipexp = App.userData().svipexp;
        }
        let lock = find("lock", this.icon.node)
        if (lock) {
            lock.active = this.svip <= 0;
        }

        let need = this.nextvipexp;
        let cur = this.svipexp;
        let per = cur / need;
        per = Math.min(per, 1);
        per = Math.max(per, 0);

        let sNum = App.FormatUtils.FormatCommaNumToNum(this.label.string);
        App.AnimationUtils.doRoallNumEff(this.label.node, Math.max(sNum, 0), cur, 1.2, () => {
            App.EventUtils.dispatchEvent("USER_VIP_EXP_CHANGE_END");
            this.label.string = App.FormatUtils.FormatNumToComma(cur) + "/" + App.FormatUtils.FormatNumToComma(need);
        }, (num) => {
            this.label.string = App.FormatUtils.FormatNumToComma(parseInt(num)) + "/" + App.FormatUtils.FormatNumToComma(need);
        }, 0, true);

        if (App.userData().svip == this.svip && App.userData().svipexp == this.svipexp) {
            App.ComponentUtils.setVipFrame(this.icon, App.userData().svip);
            this.progress.progress = per;
            return;
        }

        if (this.animNode && this.icon) {
            let toPreTween = tween()
                .call(() => {
                    this.animNode.active = true;
                })
                .to(1, { progress: per }, {
                    progress: (start, end, current, ratio) => {
                        this.animNode.setPosition(
                            this.progress.barSprite.node.getPosition().add(
                                new Vec3(this.progress.barSprite.node.getComponent(UITransform).width * current, 0, 0)
                            )
                        );
                        return start + (end - start) * ratio;
                    }
                })
                .call(() => {
                    this.animNode.active = false;
                });

            // 判断是否有升级
            let upTween = null;
            if (App.userData().svip > this.svip) {
                upTween = tween()
                    .call(() => {
                        this.animNode.active = true;
                    })
                    .to(0.5, { progress: 1 }, {
                        progress: (start, end, current, ratio) => {
                            this.animNode.setPosition(
                                this.progress.barSprite.node.getPosition().add(
                                    new Vec3(this.progress.barSprite.node.getComponent(UITransform).width * current, 0, 0)
                                )
                            );
                            return start + (end - start) * ratio;
                        }
                    })
                    .call(() => {
                        this.progress.progress = 0;
                        let initScale = this.icon.node.getScale();
                        // 图标更换
                        tween(this.icon.node)
                            .to(0.1, { scale: new Vec3(initScale.x * 1.2, initScale.y * 1.2, initScale.z) })
                            .call(() => {
                                App.ComponentUtils.setVipFrame(this.icon, App.userData().svip);
                            })
                            .to(0.1, { scale: initScale })
                            .start();
                    })
                    .call(() => {
                        this.animNode.active = false;
                    });
            }
            if (upTween) {
                tween(this.progress).then(upTween).then(toPreTween).start();
            } else {
                tween(this.progress).then(toPreTween).start();
                App.ComponentUtils.setVipFrame(this.icon, App.userData().svip);
            }
        }
        else if (this.icon) {
            App.ComponentUtils.setVipFrame(this.icon, App.userData().svip);
            this.progress.progress = per;
        }
        this.svip = App.userData().svip;
        this.svipexp = App.userData().svipexp;
        this.nextvipexp = App.userData().nextvipexp;
    }

    // update (dt) {}
}
