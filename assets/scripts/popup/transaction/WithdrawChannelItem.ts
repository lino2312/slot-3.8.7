import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Color, find, Texture2D, ImageAsset } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('WithdrawChannelItem')
export class WithdrawChannelItem extends Component {
    @property(Label) channelName: Label = null!;
    @property(Node) icon: Node = null!;
    @property({ tooltip: 'Withdraw ID of this channel' }) withdrawID = 0;

    private data: any = null;
    private callback: ((ret: any) => void) | null = null;



    public init(data: any, callback: (ret: any) => void) {
        this.data = data;
        this.callback = callback;

        if (this.data?.withdrawID) {
            this.withdrawID = this.data.withdrawID;
        }

        const channel = find('channel', this.node);
        if (channel) channel.active = false;

        const labelNode = find('channelName', this.node);
        const lbl = labelNode?.getComponent(Label);
        if (lbl) lbl.color = Color.BLACK;

        if (this.channelName && data?.name) {
            this.channelName.string = String(data.name);
        }

        this.loadImage();
    }

    public onSelect() {
        const parent = this.node?.parent;
        if (parent) {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const ch = find('channel', child);
                if (ch) ch.active = false;

                const nameNode = find('channelName', child);
                const nameLabel = nameNode?.getComponent(Label);
                if (nameLabel) nameLabel.color = Color.BLACK;
            }
        }

        const channel = find('channel', this.node);
        if (channel) channel.active = true;

        const lblNode = find('channelName', this.node);
        const lbl = lblNode?.getComponent(Label);
        if (lbl) lbl.color = Color.WHITE;

        if (this.callback) {
            App.ApiManager.getWithdrawals(this.data?.withdrawID).then((ret: any) => {
                this.callback && this.callback(ret);
            });
        }
    }

    private loadImage() {
        const url = this.data?.withAfterImgUrl;
        if (!url || !this.icon?.isValid) return;


        App.ResUtils.getRemoteSpriteFrame(url).then((sp: SpriteFrame) => {
            if (!this.icon?.isValid) return;
            const sprite = this.icon.getComponent(Sprite);
            if (sprite) sprite.spriteFrame = sp;
        });
    }

    onDestroy() {
        
    }
}