import BaseComponent from "../Base/BaseComponent";
import { _decorator, ProgressBar, Node, tween, Tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class SlotsBetTips extends BaseComponent {

    @property(ProgressBar)
    proBarBet: ProgressBar = null;

    @property(Node)
	ndPoint: Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}

    setBetPercent (progress: number) {
        let self = this 

        tween(this.proBarBet)
            .to(0.2,{progress: progress})
            .start()

        //指针
        let toAngle = 55 + (-11)*(progress/0.1)
        
        tween(this.ndPoint)
            .to(0.2,{angle:toAngle})
            .start()

        Tween.stopAllByTarget(this.node)
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255
        tween(this.node)
            .delay(2.5)
            .call(() => {
                self.HideTips()
            })
            .start()
    }

    HideTips () {
        let self = this
        Tween.stopAllByTarget(this.node)
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (uiOpacity) {
            tween(uiOpacity)
            .to(0.3,{opacity:0})
            .call(() => {
                self.node.active = false
            })
            .start()
        }
    }
}
