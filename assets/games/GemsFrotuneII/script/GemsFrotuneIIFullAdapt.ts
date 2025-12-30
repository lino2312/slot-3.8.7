import { _decorator, Component, screen, UITransform, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIIFullAdapt')
export default class GemsFrotuneIIFullAdapt extends Component {

    onLoad() {
        const winSize = screen.windowSize;
        const nodeWidth = this.node.getComponent(UITransform).contentSize.width || 1;
        const nodeHeight = this.node.getComponent(UITransform).contentSize.height || 1;
        const xScale = winSize.width / nodeWidth;
        const yScale = winSize.height / nodeHeight;
        const scale = xScale > yScale ? xScale : yScale;
        this.node.setScale(scale, scale, 1);
    }
}
