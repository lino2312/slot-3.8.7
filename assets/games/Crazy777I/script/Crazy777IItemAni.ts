import { _decorator, Node } from 'cc';
import BaseComponent from 'db://assets/scripts/game/tsFrameCommon/Base/BaseComponent';
import MySpine from 'db://assets/scripts/game/tsFrameCommon/Base/MySpine';
import Crazy777IData from "./Crazy777IData";
const { ccclass, property } = _decorator;
@ccclass('Crazy777IItemAni')
export default class Crazy777IItemAni extends BaseComponent {
    @property(Node)
    ndAni: Node | null = null;
    //    // LIFE-CYCLE CALLBACKS:
    index: string;
    type: number;
    //    // onLoad () {}
    start() {

    }
    //    // update (dt) {}
    setAniSkin(index: number) {
        if (!this.ndAni) {
            return;
        }
        let script = this.ndAni.getComponent(MySpine);
        script.setSkinIndex(index);
    }
    playAni(index: number = 0, loop: boolean = false, cbComplete: Function = null, cbEvent: Function = null) {
        if (!this.ndAni) {
            return;
        }
        let script = this.ndAni.getComponent(MySpine);
        script.setTimeScale(Crazy777IData.SPINE_TIMESCALE);
        script.playAni(index, loop, cbComplete, cbEvent);
    }
}

