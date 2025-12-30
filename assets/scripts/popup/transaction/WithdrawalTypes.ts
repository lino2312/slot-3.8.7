import { _decorator, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
import { WithdrawBindedBank } from './WithdrawBindedBank';
const { ccclass, property } = _decorator;

@ccclass('WithdrawalTypes')
export class WithdrawalTypes extends Component {
    @property(Label) title: Label = null!;
    @property(Label) detail: Label = null!;
    @property(Sprite) icon: Sprite = null!;
    @property(Node) verifyBtn: Node = null!;
    @property(Node) content: Node = null!;
    @property(Prefab) bindedBank: Prefab = null!;
    @property([SpriteFrame]) bg: SpriteFrame[] = [];
    @property(Node) checkLbl: Node = null!;

    onLoad() { }

    public init(withdrawID: number, labelValue: string, iconUrl: string, isNayi = false, callBack?: () => void) {
        this.title.string = `My ${labelValue}`;
        this.detail.string = `Verify New ${labelValue}`;

        if (isNayi) {
            if (this.checkLbl) this.checkLbl.active = true;
            this.verifyBtn?.getComponent(Sprite) && (this.verifyBtn.getComponent(Sprite)!.spriteFrame = this.bg[1] || null);
        } else {
            if (this.checkLbl) this.checkLbl.active = false;
            this.verifyBtn?.getComponent(Sprite) && (this.verifyBtn.getComponent(Sprite)!.spriteFrame = this.bg[0] || null);
        }
        if (iconUrl != "") {
            App.ResUtils.getRemoteSpriteFrame(iconUrl).then((sf) => {
                if (this.icon && this.icon.node?.isValid) {
                    this.icon.spriteFrame = sf;
                    this.icon.node.active = true;
                }
            });
        }

        this.verifyBtn?.on(Node.EventType.TOUCH_END, () => {
            callBack && callBack();
        }, this);

        const data = App.TransactionData.withdrawals?.[withdrawID];
        if (data && Array.isArray(data.withdrawalslist) && data.withdrawalslist.length > 0) {
            for (let i = 0; i < data.withdrawalslist.length; i++) {
                const element = data.withdrawalslist[i];
                const node = instantiate(this.bindedBank);
                const comp: WithdrawBindedBank = node.getComponent(WithdrawBindedBank);
                comp.init(
                    element?.accountNo || element?.bankName || element?.mobileNO || element?.arbWalletUrl,
                    iconUrl,
                    isNayi
                );
                this.content?.addChild(node);
            }
        }
    }
}


