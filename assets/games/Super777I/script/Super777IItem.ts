import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";

import { Color, Node, Sprite, UITransform, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Super777IItem')
export default class Super777IItem extends BaseComponent {

    @property(Node)
    ndIcon: Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

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

    moveIconPos (row: number) {
        if (row == 1) {
            this.node.y = -this.node.getComponent(UITransform).contentSize.height/2;
        } else if (row == 3) {
            this.node.y = this.node.getComponent(UITransform).contentSize.height/2;
        } else {
            this.node.y = 0;
        }
    }

    resetIconPos () {
        this.node.y = 0;
    }
}
