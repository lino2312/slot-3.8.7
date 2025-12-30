import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;


@ccclass('WithdrawBindedBank')
export class WithdrawBindedBank extends Component {
    @property(Label) bankName: Label = null!;
    @property(Sprite) icon: Sprite = null!;
    @property(Label) nayi: Label = null!;

    onLoad() { }

    public init(labelValue: string, iconUrl?: string, isNayi = false) {
        this.bankName.string = labelValue || 'VERIFIED';

        if (isNayi) {
            if (App.TransactionData.arbWallet.walletActivationStatus === 1) {
                this.nayi.string = `${App.TransactionData.arbWallet.balance} Nayi`;
            } else {
                this.nayi.string = 'NayiPay';
            }
        }

        if (iconUrl && iconUrl != "") {
            App.ResUtils.getRemoteSpriteFrame(iconUrl)
                .then((sp: SpriteFrame) => {
                    if (!this.icon || !this.icon.node?.isValid) return;
                    this.icon.spriteFrame = sp;
                    this.icon.node.active = true;
                })
                .catch(() => {
                    if (this.icon) this.icon.node.active = false;
                });
        }
    }
}