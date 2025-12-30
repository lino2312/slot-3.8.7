import { _decorator, Component, find, Label, Node, Skeleton } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingTip')
export class LoadingTip extends Component {
    @property(Node)
    public loadingNode: Node | null = null;
    @property(Label)
    public tipLabel: Label | null = null;

    protected onLoad(): void {
        // this.node.setPosition(App.ScreenUtils.getCenterPos());
        this.node.active = false;
    }

    start() {

    }

    isShow() {
        return this.node.active;
    }

    show() {
        console.log("----------------" + this.node.name);
        this.hideSubNode();
        this.node.active = true;
        this.loadingNode.active = true;
        this.scheduleOnce(() => {
            this.hideAll();
        }, 20);
    }

    showWithTip(tip: string) {
        console.log(this.node.name);
        this.hideSubNode();
        this.node.active = true;
        this.loadingNode.active = true;
        this.tipLabel.string = tip;
        this.tipLabel.node.active = true;
        this.scheduleOnce(() => {
            this.hideAll();
        }, 20);
    }


    hideAll() {
        this.node.active = false;
        this.hideSubNode();
    }

    hideSubNode() {
        this.tipLabel.string = "";
        this.tipLabel.node.active = false;
        this.loadingNode.active = false;
    }


    protected onEnable(): void {

    }

    protected onDisable(): void {

    }

    update(deltaTime: number) {
        
    }
}


