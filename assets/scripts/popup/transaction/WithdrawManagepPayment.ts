import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
import { BankCardItem } from './BankCardItem';
import { App } from '../../App';
import { BankCard } from './BankCard';
const { ccclass, property } = _decorator;

@ccclass('WithdrawManagepPayment')
export class WithdrawManagepPayment extends Component {
    @property(Label) bankName: Label = null!;
    @property(Node) select: Node = null!;

    @property(Prefab) bindCardItem: Prefab = null!;
    @property(Node) bindCardNode: Node = null!;

    @property(Prefab) cardItem: Prefab = null!;
    @property(Node) cardNode: Node = null!;

    @property(Prefab) itemItem: Prefab = null!;
    @property(Node) itemNode: Node = null!;

    @property(Prefab) addCard: Prefab = null!;

    onLoad() {
        App.EventUtils.on('updateBindedBankListUI', this.refreshBankList, this);
        this.refreshBankList();
    }

    start() { }

    onDestroy() {
        App.EventUtils.off('updateBindedBankListUI', this.refreshBankList, this);
    }

    public refreshBankList() {
        // Clear existing items
        this.itemNode?.removeAllChildren();
        this.cardNode?.removeAllChildren();

        const ret = App.TransactionData.withdrawalTypes;
        if (!ret || !Array.isArray(ret.withdrawlist)) return;

        const opList: BankCardItem[] = [];
        for (let i = 0; i < ret.withdrawlist.length; i++) {
            const element = ret.withdrawlist[i];
            const node = instantiate(this.itemItem);
            const comp: BankCardItem = node.getComponent(BankCardItem);
            opList.push(comp);

            comp.init(element, () => {
                if (this.bankName) this.bankName.string = element.name || '';
                if (this.select) this.select.active = false;

                const data = App.TransactionData.withdrawals[element.withdrawID];
                if (!data || !Array.isArray(data.withdrawalslist) || data.withdrawalslist.length === 0) {
                    console.warn('No withdrawal data for ID:', element.withdrawID);
                    return;
                }

                App.TransactionData.lastBandCarkName = data.lastBandCarkName;
                const array = data.withdrawalslist;

                this.cardNode?.removeAllChildren();
                App.TransactionData.withdrawID = element.withdrawID; // 1 bank card, 3 usdt, 4 wallet

                for (let j = 0; j < array.length; j++) {
                    const elementCard = array[j];
                    const cardNode = instantiate(this.cardItem);
                    const cardComp: BankCard = cardNode.getComponent(BankCard);
                    cardComp.init(elementCard, () => {});
                    this.cardNode.addChild(cardNode);
                }

                if (this.addCard) {
                    const add = instantiate(this.addCard);
                    this.cardNode.addChild(add);
                }
            });

            this.itemNode?.addChild(node);
        }

        // auto select first option
        if (opList[0]?.onSelect) opList[0].onSelect();
    }

    public onClickItemNode() {
        if (this.select) this.select.active = !this.select.active;
    }

    public onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    public onBindCard() {
        App.PopUpManager.addPopup('prefabs/popup/popupBindBankCard', 'hall', null, false);
    }
}