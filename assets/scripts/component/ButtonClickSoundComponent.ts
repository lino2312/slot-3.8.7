import { _decorator, Button, Component, Node, Toggle } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ButtonClickSoundComponent')
export class ButtonClickSoundComponent extends Component {

    @property({ tooltip: "点击音效1或2", type: Number })
    clickSoundType: number = 1;

    protected onLoad() {
        let button = this.node.getComponent(Button)
        if (button) {
            this.node.on(Button.EventType.CLICK, () => {
                if (this.clickSoundType == 1) {
                    App.AudioManager.playBtnClick();
                } else {
                    App.AudioManager.playBtnClick2();
                }
            }, this);
        }

        let toggle = this.node.getComponent(Toggle);
        if (toggle) {
            this.node.on(Toggle.EventType.TOGGLE, () => {
                if (this.clickSoundType == 1) {
                    App.AudioManager.playBtnClick();
                } else {
                    App.AudioManager.playBtnClick2();
                }
            }, this);
        }
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


