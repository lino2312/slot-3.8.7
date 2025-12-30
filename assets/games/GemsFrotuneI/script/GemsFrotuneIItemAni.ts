import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import GemsFrotuneIData from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIData";

import { Node, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIItemAni')
export default class GemsFrotuneIItemAni extends BaseComponent {

    @property(Node)
    ndAni: Node = null;

    index: string;
    type: number;

    start () {}

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
        script.setTimeScale(GemsFrotuneIData.SPINE_TIMESCALE);
        script.playAni(index, loop, cbComplete, cbEvent);
    }
}