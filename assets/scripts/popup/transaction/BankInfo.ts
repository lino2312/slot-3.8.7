import { _decorator, Component, Node, Sprite, SpriteFrame, Label, instantiate } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BankInfo')
export class BankInfo extends Component {
    @property(Node) bankItem: Node = null!;
    @property(Node) bankItemNode: Node = null!;

    @property(Sprite) icon: Sprite = null!;
    @property(Sprite) icon2: Sprite = null!;
    @property([SpriteFrame]) iconbg: SpriteFrame[] = [];

    @property(Label) lb1: Label = null!;
    @property(Label) lb2: Label = null!;
    @property([SpriteFrame]) bg: SpriteFrame[] = [];
    @property(Node) bar: Node = null!;
    @property(Node) checkLbl: Node = null!;

    private data: any = null;
    private id = 0;
    private firstType = false;
    private iconUrl = '';
    private bankItemList: Node[] = [];

    onLoad() {

    }

    public init(data: any, id: number, firstType = false, name?: string, icon?: string) {
        this.data = data;
        this.id = id;
        this.firstType = firstType;
        this.iconUrl = icon || '';
        this.bankItemList = [];


        const nameMappings: Record<number, string> = {
            1: name || 'Bank',
            2: name || 'UPT',
            3: name || 'USDT',
            4: name || 'WALLET',
            21: name || 'NAYIPAY',
        };
        const replacementName = nameMappings[this.id] || 'Bank';
        if (this.lb1?.string != null) this.lb1.string = this.lb1.string.replace('Bank', replacementName);
        if (this.lb2?.string != null) this.lb2.string = this.lb2.string.replace('Bank', replacementName.toLowerCase());

        if (this.id === 21) {
            if (this.checkLbl) this.checkLbl.active = true;
            this.bar?.getComponent(Sprite) && (this.bar.getComponent(Sprite)!.spriteFrame = this.bg?.[1] || null);
        } else {
            if (this.checkLbl) this.checkLbl.active = false;
            this.bar?.getComponent(Sprite) && (this.bar.getComponent(Sprite)!.spriteFrame = this.bg?.[0] || null);
        }


        if (this.iconUrl.length > 0) {
            App.ResUtils.getRemoteSpriteFrame(this.iconUrl).then((sp: SpriteFrame) => {
                if (!this.icon) return;
                this.icon.spriteFrame = sp;
                this.icon.node.active = true;
            }).catch(() => {
                if (this.id >= 1 && this.id <= 4) {
                    const sf = this.iconbg[this.id - 1];
                    if (sf && this.icon) this.icon.spriteFrame = sf;
                }
            });
        } else if (this.id >= 1 && this.id <= 4) {
            const sf = this.iconbg[this.id - 1];
            if (sf && this.icon) this.icon.spriteFrame = sf;
        }


        this.bankItemNode?.removeAllChildren();
        const list = data?.withdrawalslist || [];
        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            const item = instantiate(this.bankItem);

            const labelSpr = item.children?.[1]?.getComponent(Label);
            if (App.TransactionData.arbWallet && this.id === 21) {
                if (App.TransactionData.arbWallet.walletActivationStatus === 1) {
                    if (labelSpr) labelSpr.string = `${App.TransactionData.arbWallet.balance} Nayi`;
                } else {
                    if (labelSpr) labelSpr.string = 'NayiPay';
                }
            } else {
                if (labelSpr) labelSpr.string = element.accountNo || element.bankName || element.mobileNO || '';
            }

            // 列表项图标
            if (this.iconUrl.length > 0) {
                App.ResUtils.getRemoteSpriteFrame(this.iconUrl).then((sp: SpriteFrame) => {
                    const spr = item.children?.[0]?.getComponent(Sprite);
                    if (spr) {
                        spr.spriteFrame = sp;
                        spr.node.active = true;
                    }
                }).catch(() => {
                    if (this.id >= 1 && this.id <= 4) {
                        const spr = item.children?.[0]?.getComponent(Sprite);
                        if (spr) spr.spriteFrame = this.iconbg[this.id - 1] || spr.spriteFrame;
                    }
                });
            } else if (this.id >= 1 && this.id <= 4) {
                const spr = item.children?.[0]?.getComponent(Sprite);
                if (spr) spr.spriteFrame = this.iconbg[this.id - 1] || spr.spriteFrame;
            }

            // 默认选中
            if (this.firstType && i === 0) {
                const checkNode = item.children?.[4];
                if (checkNode) checkNode.active = true;
                App.EventUtils.dispatchEvent('setBankInfo', { data: this.data, ret: element });
            }

            item.setParent(this.bankItemNode);
            item.active = true;

            // 点击事件
            App.ComponentUtils.onClick(item, () => {
                this.bankItemList.forEach((it: Node) => {
                    const n = it.children?.[4];
                    if (n) n.active = false;
                });

                const checkNode = item.children?.[4];
                if (checkNode) checkNode.active = true;

                App.EventUtils.dispatchEvent('setBankInfo', { data: this.data, ret: element });
            }, this);

            this.bankItemList.push(item);
        }
    }

    public bankEndit() {
        if (this.id === 1) {
            App.PopUpManager.addPopup('prefabs/popup/popupBindCardYonoCard', "hall", null, false);
        } else {
            App.PopUpManager.addPopup('prefabs/popup/popupBindCardYono', "hall", null, false);
        }
    }

    public bankESeclet() {
        App.EventUtils.dispatchEvent('setBankInfo', this.data);
    }
}