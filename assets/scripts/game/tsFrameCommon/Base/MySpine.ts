import Utils from "./MyUtils";
import { _decorator, Component, sp } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("动画/MySpine")
export default class MySpine extends Component {

    @property([String])
    skinList = [];

    @property([String])
    aniList = [];

    // LIFE-CYCLE CALLBACKS:

    private timeScale = 1.0;

    onLoad () {

    }

    start () {
        
    }

    // update (dt) {}

    setTimeScale (timeScale: number) {
        this.timeScale = timeScale;
    }

    setSkinIndex (index: number) {
        let spine = this.node.getComponent(sp.Skeleton);
        if (!spine) {
            return;
        }
        if (this.skinList[index]) {
            spine.setSkin(this.skinList[index]);
        }
    }

    playAni (index: number = 0, loop: boolean = false, cbComplete: Function = null, cbEvent: Function = null) {
        if (!this.aniList[index]) {
            return;
        }
        let spine = this.node.getComponent(sp.Skeleton);
        if (!spine) {
            return;
        }
        spine.setAnimation(0, this.aniList[index], loop);
        spine.timeScale = this.timeScale;
        if (cbEvent) {
            spine.setEventListener(() => {
                spine.setEventListener(null);
                cbEvent();
            });
        } else {
            spine.setEventListener(null);
        }
        if (cbComplete) {
            spine.setCompleteListener(() => {
                spine.setCompleteListener(null);
                cbComplete();
            });
        } else {
            spine.setCompleteListener(null);
        }
    }

    pauseAni () {
        let spine = this.node.getComponent(sp.Skeleton);
        if (!spine) {
            return;
        }
        spine.paused = true;
    }

    stopAni () {
        let spine = this.node.getComponent( sp.Skeleton);
        if (!spine) {
            return;
        }
        spine.setCompleteListener(null);
        spine.clearTracks();
    }

    clearCompleteListener () {
        let spine = this.node.getComponent(sp.Skeleton);
        if (!spine) {
            return;
        }
        spine.setCompleteListener(null);
    }

    getAniDuration (index: number = 0) {
        if (!this.aniList[index]) {
            return;
        }
        let spine = this.node.getComponent(sp.Skeleton);
        if (!spine) {
            return;
        }
        return Utils.getSpineDuration(spine, this.aniList[index]);
    }

}
