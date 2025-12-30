import { _decorator, Button, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ButtonClickLimitComponent')
export class ButtonClickLimitComponent extends Component {

    @property({ tooltip: "按钮锁定时间，单位秒", type: Number })
    lockTime: number = 1;

    protected onLoad() {
        let button = this.getComponent(Button);
        // 给按钮添加一个点击时间
        this.node.on(Button.EventType.CLICK, () => {
            button.interactable = false;
            // 定时解开
            this.scheduleOnce(() => {
                button.interactable = true;
            }, this.lockTime);
        }, this);
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


