import { _decorator, Component, Node, EditBox, Prefab, instantiate } from 'cc';
import { App } from '../../App';
import { BankItem } from './BankItem';
const { ccclass, property } = _decorator;

@ccclass('SelectBank')
export class SelectBank extends Component {
    @property(Prefab) itemBank: Prefab = null!;
    @property(Node) itemNode: Node = null!;
    @property(EditBox) inputField: EditBox = null!;

    private allBankNames: any[] = [];

    onLoad() {
        const withdrawID = App.TransactionData.withdrawID;
        App.ApiManager.getBankList(withdrawID).then((ret: any) => {
            this.allBankNames = ret?.banklist || [];
            this.displayFilteredBanks(this.allBankNames);
        });
        this.inputField?.node.on(EditBox.EventType.TEXT_CHANGED, this.onInputChanged, this);
    }

    start() { }

    onDestroy() {
        // this.inputField?.node.off(EditBox.EventType.TEXT_CHANGED, this.onInputChanged, this);
        if (this.inputField && this.inputField.node && this.inputField.node.isValid) {
            this.inputField.node.off(EditBox.EventType.TEXT_CHANGED, this.onInputChanged, this);
        }
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    private onInputChanged() {
        const inputText = this.inputField?.string || '';
        this.filterBanks(inputText);
    }

    private filterBanks(input: string) {
        const q = (input || '').toLowerCase();
        if (!q) {
            this.displayFilteredBanks(this.allBankNames);
            return;
        }
        const filtered = this.allBankNames.filter((bank: any) => {
            const name = String(bank?.bankName || '').toLowerCase();
            return name.includes(q);
        });
        this.displayFilteredBanks(filtered);
    }

    private displayFilteredBanks(banks: any[]) {
        if (!this.itemNode || !this.itemBank) return;
        this.itemNode.removeAllChildren();

        banks.forEach((bank) => {
            const node = instantiate(this.itemBank);
            const comp: BankItem = node.getComponent(BankItem);
            comp.init(bank, () => {
                App.EventUtils.dispatchEvent('setBankName', bank);
                this.onClickBack();
            });
            this.itemNode.addChild(node);
        });
    }
}