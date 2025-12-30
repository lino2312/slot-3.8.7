/**
 * 背景图适配
 * ios是原来的配置：小图放大2背
 * 针对ipad的话：背景图还是再大一点2.5
 */
import { _decorator, Component, view, UITransform, sys, v3, screen } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SlotGameBgAdapt')
export default class SlotGameBgAdapt extends Component {

    @property({
        displayName: "ipad上的自动缩放",
        tooltip: "挂载了这个就不要再挂widget组建了"
    })
    ipad_auto: boolean = true;

    onLoad() {
        let testIPad = false;
        const platform = sys.platform;
        // Check if device is iPad (iOS tablet)
        // In Cocos Creator 3.x, use screen.windowSize or check screen dimensions
        const windowSize = screen.windowSize;
        const isIPad = sys.os === sys.OS.IOS && (windowSize.width >= 768 || windowSize.height >= 768);
        
        if (testIPad || isIPad) {
            if (this.ipad_auto) {
                // Get visible size (replaces cc.winSize in 3.x)
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
    }

    // start () {

    // },

    // update (dt) {}
}
