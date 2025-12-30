import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";

import { Color, Node, Sprite, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777Item')
export default class Diamond777Item extends BaseComponent {

    @property(Node)
    ndIcon: Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        
    }

    start () {
        this.updateIsIconGray();
    }

    // update (dt) {}

    updateIsIconGray (isGray = false) {
        if (isGray) {
            this.ndIcon.getComponent(Sprite).color = new Color(100, 100, 100, 255);
        } else {
            this.ndIcon.getComponent(Sprite).color = new Color(255, 255, 255, 255);
        }
    }
}
