import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class BaseComponent extends Component {

    // LIFE-CYCLE CALLBACKS:

    protected timeoutList = [];

    // onLoad () {}

    start() {

    }

    onDestroy() {
        this.closeAllTimeout();
    }

    // update (dt) {}

    protected setTimeout(callback: Function, time: number) {
        if (!this.node || !this.node.isValid) return;
        let index = this.timeoutList.length;
        let timeout = setTimeout(() => {
            this.timeoutList[index] = null;
            if (this.node && this.node.isValid) {
                if (callback) {
                    callback();
                }
            }
        }, time);
        this.timeoutList.push(timeout);
    }

    public closeAllTimeout() {
        this.timeoutList.forEach(element => {
            if (element) {
                clearTimeout(element);
            }
        });
        this.timeoutList = [];
    }

}
