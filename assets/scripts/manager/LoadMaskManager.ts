import { _decorator, Component, Node } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class LoadMaskManager extends Component {
    @property(Node)
    public loadMask: Node | null = null;
    protected waitTimer: any;
    protected onLoad(): void {
        App.LoadMaskManager = this;
    }

    public waitOpen() {
        this.loadMask.active = true;
        this.waitTimer = setTimeout(this.waitClose.bind(this), 7000);
    }

    public waitClose() {
        this.loadMask.active = false;
    }

}

