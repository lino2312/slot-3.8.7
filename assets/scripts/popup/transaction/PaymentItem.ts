import { _decorator, Component, Node, Label, Sprite, SpriteFrame, ImageAsset, find, assetManager } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('PaymentItem')
export class PaymentItem extends Component {
    @property(Label) payment: Label = null!;
    @property(Node) icon: Node = null!;
    @property(Label) extra: Label = null!;

    private data: any = null;
    private selectEvent: Function | null = null;

    onLoad() {

    }

    start() {

    }

    onDestroy() {

    }

    public init(data: any,selectEvent: Function) {
        this.data = data;
        this.selectEvent = selectEvent;
        const methodNode = find('method', this.node);
        if (methodNode) methodNode.active = false;
        this.updateView();
        this.loadImage();
    }

    // 切换选中状态（可绑定到 Button 的点击事件）
    public onSelect() {
        const parent = this.node.parent;
        if (parent) {
            for (const child of parent.children) {
                const n = find('method', child);
                if (n) n.active = false;
            }
        }
        const selfMethod = find('method', this.node);
        if (selfMethod) selfMethod.active = true;
        this.selectEvent && this.selectEvent(this.data);
    }

    private updateView() {
        if (!this.data) return;

        if (this.payment) {
            this.payment.string = this.data.paySysName ?? '';
        }

        if (this.extra) {
            const rate = Number(this.data.maxRechargeRifts ?? 0);
            this.extra.string = `+extra${(rate * 100)}%`;
            if (rate === 0 && this.extra.node?.parent) {
                this.extra.node.parent.active = false;
            } else if (this.extra.node?.parent) {
                this.extra.node.parent.active = true;
            }
        }
    }

    private loadImage() {
        if (!this.data?.payNameUrl || !this.icon?.isValid) return;

        App.ResUtils.getRemoteSpriteFrame(this.data.payNameUrl).then((sf: SpriteFrame | null) => {
            if (sf && this.icon.isValid) {
                const sprite = this.icon.getComponent(Sprite);
                if (sprite) {
                    sprite.spriteFrame = sf;
                }
            }
        });
    }
}