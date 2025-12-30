import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TeleCodeComponent')
export class TeleCodeComponent extends Component {

    @property(Label)
    numberLabel: Label = null!;

    start() {

    }

    update(deltaTime: number) {

    }

    init(labelValue, length, callBack) {
        this.numberLabel.string = labelValue;
        this.node.on(Node.EventType.TOUCH_END, () => {
            callBack && callBack(labelValue, length);
        });
    }
}


