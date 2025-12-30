import { _decorator, Component, Node, Label, Prefab, instantiate, find } from 'cc';
import { App } from '../../App';
import { BankInfoBase } from './BankInfoBase';
import { Withdraw } from './Withdraw';
const { ccclass, property } = _decorator;

@ccclass('BankChange')
export class BankChange extends Component {
    @property(Label) bankName: Label = null!;
    @property(Prefab) cardItem: Prefab = null!;
    @property(Node) cardNode: Node = null!;

    onLoad() {
        const withdrawID = App.TransactionData.withdrawID;
        // 1: Bank, 3: USDT, 4: Wallet
        let title = 'Bank';
        if (withdrawID === 3) title = 'USDT';
        if (withdrawID === 4) title = 'Wallet';
        if (this.bankName) this.bankName.string = title;

        this.cardNode?.removeAllChildren();
        App.ApiManager.getWithdrawals(withdrawID).then((data: any) => {
            const list = data?.withdrawalslist || [];
            for (let i = 0; i < list.length; i++) {
                const elementCard = list[i];
                const node = instantiate(this.cardItem);
                const comp: BankInfoBase = node.getComponent(BankInfoBase);
                comp.init(elementCard, () => {
                    const ui = find('Canvas/popupWithdraw');
                    const uiWithdraw: Withdraw = ui?.getComponent(Withdraw);
                    uiWithdraw.setacc(elementCard);
                    this.onClickBack();
                }
                );
                this.cardNode.addChild(node);
            }
        });
    }

    public onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }
}