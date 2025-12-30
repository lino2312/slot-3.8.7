import { _decorator, Component, screen, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIFullAdapt')
export default class GemsFrotuneIFullAdapt extends Component {

    onLoad() {
        const winSize = screen.windowSize;
        const uiTransform = this.node.getComponent(UITransform);
        const nodeWidth = uiTransform?.width || 1;
        const nodeHeight = uiTransform?.height || 1;
        const xScale = winSize.width / nodeWidth;
        const yScale = winSize.height / nodeHeight;
        const scale = xScale > yScale ? xScale : yScale;
        this.node.setScale(scale, scale, 1);
    }
}