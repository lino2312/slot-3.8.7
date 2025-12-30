import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Super777IData from "db://assets/games/Super777I/script/Super777IData";

import { Node, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Super777IItemAni')
export default class Super777IItemAni extends BaseComponent {

    @property(Node)
    ndAni: Node = null;

    // LIFE-CYCLE CALLBACKS:

    index: string;
    type: number;

    // onLoad () {}

    start () {

    }

    // update (dt) {}

    setAniSkin (index: number) {
        if (!this.ndAni) {
            return;
        }
        let script = this.ndAni.getComponent(MySpine);
        script.setSkinIndex(index);
    }

    playAni (index: number = 0, loop: boolean = false, cbComplete: Function = null, cbEvent: Function = null) {
        if (!this.ndAni) {
            return;
        }
        let script = this.ndAni.getComponent(MySpine);
        script.setTimeScale(Super777IData.SPINE_TIMESCALE);
        script.playAni(index, loop, cbComplete, cbEvent);
    }

    getAniDuration (index: number) {
        let duration = 0;
        if (!this.ndAni) {
            return duration;
        }
        let script = this.ndAni.getComponent(MySpine);
        duration = script.getAniDuration(index);
        return duration;
    }
}
