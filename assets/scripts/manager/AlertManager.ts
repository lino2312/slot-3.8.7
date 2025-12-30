import { _decorator, Color, Component, director, instantiate, Node, Scene, UITransform } from 'cc';
import { CommonAlert } from '../widget/CommonAlert';
import { App } from '../App';
import { LoadingTip } from '../widget/LoadingTip';
import { get } from 'http';
import { FloatTip } from '../widget/FloatTip';
const { ccclass, property } = _decorator;

@ccclass('AlertManager')
export class AlertManager extends Component {

    @property(Node)
    public commonAlert: Node | null = null;

    @property(Node)
    public loadingTip: Node | null = null;

    @property(Node)
    public floatTipParent: Node | null = null;

    protected onLoad(): void {
        App.AlertManager = this;
    }
    start() {

    }

    update(deltaTime: number) {

    }

    getCommonAlert() {
        return this.commonAlert.getComponent(CommonAlert) as CommonAlert;
    }

    getLoadingTip() {
        return this.loadingTip.getComponent(LoadingTip) as LoadingTip;
    }

    showFloatTip(tips: string, showPos = FloatTip.SHOW_POS.CENTER, color = Color.WHITE) {
        App.ResUtils.getPrefab("common/prefab/float_tip").then(floatTipPrefab => {
            let floatTipNode = instantiate(floatTipPrefab);
            this.floatTipParent.addChild(floatTipNode);
            const pos = this.floatTipParent.getPosition().clone();
            let posY = pos.y;
            if (showPos === FloatTip.SHOW_POS.CENTER) {
                // 居中显示
                posY = 0;
            } else if (showPos === FloatTip.SHOW_POS.TOP) {
                // 顶部显示
                posY = pos.y + floatTipNode.getComponent(UITransform).height * 5;
            } else if (showPos === FloatTip.SHOW_POS.BOTTOM) {
                // 底部显示
                posY = pos.y - floatTipNode.getComponent(UITransform).height * 5;
            }
            floatTipNode.setPosition(pos.x,posY, pos.z);
            (floatTipNode.getComponent("FloatTip") as FloatTip).show(tips, color);
        });
    }

    clearFloatTip() {
        this.floatTipParent.removeAllChildren();
    }
}


