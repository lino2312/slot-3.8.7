import { _decorator, Component, find, Node, UIOpacity } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('MaskForClose')
export class MaskForClose extends Component {
    
    onLoad(): void {
        //背景透明度
        if (this.node.getComponent(UIOpacity) == null) {
            this.node.addComponent(UIOpacity);
        }
        this.node.getComponent(UIOpacity).opacity = 192;
        this.node.on(Node.EventType.TOUCH_END, this.onclick, this);
        App.AudioManager.playEff(null, null, null);
    }
    start() {

    }

    onclick() {
        this.node.destroy();
    }

    update(deltaTime: number) {
        
    }
}