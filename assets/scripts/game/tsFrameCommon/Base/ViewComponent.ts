import { _decorator, Component, Node, Tween, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class ViewComponent extends Component {

    @property(Node)
    ndBg: Node = null;

    @property(Node)
    ndAction: Node = null;

    bgOpacity = 255;
    actionScale = 1;

    protected cbClose: Function = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (this.ndBg) {
            const uiOpacity = this.ndBg.getComponent(UIOpacity);
            this.bgOpacity = uiOpacity ? uiOpacity.opacity : 255;
        }
        if (this.ndAction) {
            this.actionScale = this.ndAction.scale.x;
        }
    }

    start () {

    }

    // update (dt) {}

    openAction(cbLoaded: Function = null, actionTime: number = null, isScaleAction = true) {
        if (actionTime == null) {
            actionTime = 0.3;
        }
        if (this.ndBg) {
            this.ndBg.active = true;
            Tween.stopAllByTarget(this.ndBg);
            let uiOpacity = this.ndBg.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.ndBg.addComponent(UIOpacity);
            }
            uiOpacity.opacity = 0;
            tween(uiOpacity)
                .to(actionTime, { opacity: this.bgOpacity }, { easing: 'sineIn' })
                .call(() => {
                    if (!this.ndAction) {
                        if (cbLoaded) {
                            cbLoaded();
                        }
                    }
                })
                .start();
        }
        if (this.ndAction) {
            let uiOpacity = this.ndAction.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.ndAction.addComponent(UIOpacity);
            }
            uiOpacity.opacity = 0;
            Tween.stopAllByTarget(this.ndAction);
            if (isScaleAction) {
                this.ndAction.scale = new Vec3(this.actionScale, this.actionScale, 1);
                tween(this.ndAction)
                    .to(actionTime/6*5, { scale: new Vec3(this.actionScale*1.05, this.actionScale*1.05, 1) }, { easing: 'sineIn'})
                    .to(actionTime/6, { scale: new Vec3(this.actionScale, this.actionScale, 1)}, { easing: 'sineIn'})
                    .call(() => {
                        if (cbLoaded) {
                            cbLoaded();
                        }
                    })
                    .start();
                tween(uiOpacity)
                    .to(actionTime/6*5, { opacity: 255 }, { easing: 'sineIn'})
                    .start();
            } else {
                tween(uiOpacity)
                    .to(actionTime, { opacity: 255 }, { easing: 'sineIn'})
                    .call(() => {
                        if (cbLoaded) {
                            cbLoaded();
                        }
                    })
                    .start();
            }
        }
        if (!this.ndBg && !this.ndAction) {
            setTimeout(() => {
                if (cbLoaded) {
                    cbLoaded();
                }
            }, actionTime);
        }
    }

    closeAction(callback: Function = null, actionTime: number = null, isScaleAction = true) {
        if (actionTime == null) {
            actionTime = 0.3;
        }
        if (callback == null) {
            callback = this.cbClose;
        }
        if (this.ndBg) {
            Tween.stopAllByTarget(this.ndBg);
            let uiOpacity = this.ndBg.getComponent(UIOpacity);
            if (uiOpacity) {
                tween(uiOpacity)
                    .to(actionTime, { opacity: 0 }, { easing: 'sineIn' })
                    .call(() => {
                        if (!this.ndAction) {
                            if (callback) {
                                callback();
                            }
                        }
                    })
                    .start();
            }
        }
        if (this.ndAction) {
            Tween.stopAllByTarget(this.ndAction);
            this.ndAction.scale = new Vec3(this.actionScale, this.actionScale, 1);
            let scaleNew = isScaleAction ? 0 : this.actionScale;
            let uiOpacity = this.ndAction.getComponent(UIOpacity);
            if (uiOpacity) {
                tween(uiOpacity)
                    .to(actionTime, { opacity: 0 }, { easing: 'sineIn' })
                    .call(() => {
                        if (callback) {
                            callback();
                        }
                    })
                    .start();
            }
            if (isScaleAction) {
                tween(this.ndAction)
                    .to(actionTime, { scale: new Vec3(scaleNew, scaleNew, 1) }, { easing: 'sineIn' })
                    .start();
            }
        }
        if (!this.ndBg && !this.ndAction) {
            setTimeout(() => {
                if (callback) {
                    callback();
                }
            }, actionTime);
        }
    }

    protected onClickClose(actionTime: number = null, isScaleAction = true) {
        this.closeAction(null, actionTime, isScaleAction);
    }

    protected setTimeout (callback: Function, timeout: number) {
        setTimeout(() => {
            if (this.node && this.node.isValid) {
                if (callback) {
                    callback();
                }
            }
        }, timeout);
    }

    protected remove () {
        this.node.destroy();
    }
    
}
