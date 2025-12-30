import { _decorator, Component } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("动画/MyAnimation")
export class MyAnimation extends Component {

    funList: Function[];

    start() {
        
    }

    onFrame1() {
        if (this.funList[0]) {
            this.funList[0]();
        }
    }

    onFrame2() {
        if (this.funList[1]) {
            this.funList[1]();
        }
    }

    onFrame3() {
        if (this.funList[2]) {
            this.funList[2]();
        }
    }

    init(funList: Function[]) {
        this.funList = funList;
    }
}

