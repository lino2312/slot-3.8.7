import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import GemsFrotuneIIData from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIData";

import { Node, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIIItemAni')
export default class GemsFrotuneIIItemAni extends BaseComponent {

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
        script.setTimeScale(GemsFrotuneIIData.SPINE_TIMESCALE);
        script.playAni(index, loop, cbComplete, cbEvent);
    }
}
