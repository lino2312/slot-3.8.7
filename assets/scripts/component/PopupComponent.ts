import { _decorator, Component, Enum, Node, Prefab } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;
export enum ShowBy {
    onClick = 1,
    onLoad = 2,
}

export enum PopUpAnimType {
    normal = 0,
    scale = 1,
    fadeIn = 2,
    fromTop = 3,
    fromBottom = 4,
    fromLeft = 5,
    fromRight = 6,
}


@ccclass('PopupComponent')
export class PopupComponent extends Component {

    @property(Prefab)
    popupPrefab: Prefab = null;

    @property({ tooltip: "显示方式", type: Enum(ShowBy) })
    showBy: ShowBy = ShowBy.onClick;

    @property({ tooltip: "延迟出现时间", type: Number, min: 0, visible() { return this.showBy === ShowBy.onLoad } })
    delayTime: number = 0;

    @property({ tooltip: "点击空白区域关闭", type: Boolean })
    clickBlankClose: boolean = true;

    @property({ tooltip: "弹出时动画类型", type: Enum(PopUpAnimType) })
    showAnimType: PopUpAnimType = PopUpAnimType.scale;

    @property({ tooltip: "关闭时动画类型", type: Enum(PopUpAnimType) })
    closeAnimType: PopUpAnimType = PopUpAnimType.scale;

    @property({ tooltip: "是否开启多弹窗共存", type: Boolean })
    isMulti: boolean = false;

    protected onLoad(): void {
        App.PopUpManager.allowMultiple = this.isMulti;
        if (this.showBy === ShowBy.onLoad) {
            if (this.delayTime > 0) {
                this.scheduleOnce(() => {
                    this.showPopup();
                }, this.delayTime);
            } else {
                this.showPopup();
            }
        } else if (this.showBy === ShowBy.onClick) {
            this.node.on(Node.EventType.TOUCH_END, () => {
                this.showPopup();
            }, this);
        }
    }

    showPopup() {
        if (this.popupPrefab) {
            App.PopUpManager.addPopup(this.popupPrefab, "hall", null, this.clickBlankClose
                , null, this.showAnimType, this.closeAnimType);
        }
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


