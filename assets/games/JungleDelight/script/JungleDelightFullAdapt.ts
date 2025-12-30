import { _decorator, Component, view, UITransform, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JungleDelightFullAdapt')
export default class JungleDelightFullAdapt extends Component {

    onLoad() {
        // Get the visible size (replaces cc.winSize in 3.x)
        const visibleSize = view.getVisibleSize();

        // Get UITransform component to access width/height (replaces this.node.width/height in 3.x)
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.warn('UITransform component not found on node');
            return;
        }

        const nodeWidth = uiTransform.width;
        const nodeHeight = uiTransform.height;
        const xScale = visibleSize.width / nodeWidth;
        const yScale = visibleSize.height / nodeHeight;

        // Use setScale with v3 (replaces this.node.scale in 3.x)
        const scale = xScale > yScale ? xScale : yScale;
        this.node.setScale(v3(scale, scale, 1));
    }
}