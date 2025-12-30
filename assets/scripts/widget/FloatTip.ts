import { _decorator, Color, Component, Enum, isValid, Label, Node, RichText, Sprite, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('FloatTip')
export class FloatTip extends Component {
    @property(Sprite)
    public bgSprite: Sprite | null = null;
    @property(Label)
    public contentLabel: Label | null = null;


    static SHOW_POS = {
        TOP: 0,
        CENTER: 1,
        BOTTOM: 2
    };

    start() {

    }

    show(tips: string, color: Color) {
        this.contentLabel.string = tips;
        this.contentLabel.color = color;
        this.node.active = true;
            // 设置节点透明度（需要添加 UIOpacity 组件）
            let uiOpacity = this.node.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.node.addComponent(UIOpacity);
            }
            uiOpacity.opacity = 255;
            // 动画：延迟1秒后，向上移动1.5倍高度并渐隐
            const moveY = this.node.getComponent(UITransform).height * 1.5;
            tween(this.node)
                .delay(2)
                .by(0.8, { position: new Vec3(this.node.position.x, moveY, this.node.position.z) })
                .start();

            tween(uiOpacity)
                .delay(2)
                .to(0.8, { opacity: 0 })
                .call(() => {
                    this.node.active = false;
                    this.node.destroy();
                })
                .start();

    }
}


