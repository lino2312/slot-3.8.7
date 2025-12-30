import { _decorator, Component, Node, Label, EditBox, Prefab, find, instantiate, Sprite } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;


@ccclass('BindBankCard')
export class BindBankCard extends Component {
    @property(Node) nameMask: Node = null!;

    @property(Label) bankName: Label = null!;
    @property(Node) select: Node = null!;
    @property(EditBox) fullRecipientName: EditBox = null!;
    @property(EditBox) bankAccountNumber: EditBox = null!;
    @property(EditBox) phoneNumber: EditBox = null!;
    @property(EditBox) ifscCode: EditBox = null!;

    @property(Prefab) itemItem: Prefab = null!;
    @property(Node) itemNode: Node = null!;

    // USDT
    @property(Label) usdtName: Label = null!;
    @property(Node) selectUSDT: Node = null!;
    @property(EditBox) usdtAddress: EditBox = null!;
    @property(EditBox) usdtRemarkName: EditBox = null!;
    @property(Node) itemNodeUsdt: Node = null!;

    // E-Wallet
    @property(Label) walletName: Label = null!;
    @property(Node) selectWallet: Node = null!;
    @property(Node) itemNodeWallet: Node = null!;
    @property(EditBox) fullRecipientNameWallet: EditBox = null!;
    @property(EditBox) walletNumber: EditBox = null!;
    @property(Node) nameMaskWallet: Node = null!;

    public classData: any[] = [];
    public statusIndex = 0;

    private bankID: number = 0;

    onLoad() {
        // Switch panels by withdraw ID
        const isBank = App.TransactionData.withdrawID === 1;
        const isUSDT = App.TransactionData.withdrawID === 3;
        const isWallet = App.TransactionData.withdrawID === 4;

        const bankNode = find('bank', this.node);
        const usdtNode = find('usdt', this.node);
        const walletNode = find('wallet', this.node);

        if (bankNode) bankNode.active = !!isBank;
        if (usdtNode) usdtNode.active = !!isUSDT;
        if (walletNode) walletNode.active = !!isWallet;

        if (isBank) {
            this.onLoadBank();
            App.EventUtils.on('setBankName', this.setBankName, this);
        } else if (isUSDT) {
            this.onLoadBankUSDT();
        } else if (isWallet) {
            this.onLoadBankWallet();
        }
    }

    onDestroy() {
        App.EventUtils.offTarget(this);
    }

    // Bank
    private onLoadBank() {
        if (this.nameMask) this.nameMask.active = false;
        if (App.TransactionData.lastBandCarkName) {
            if (this.fullRecipientName) this.fullRecipientName.string = App.TransactionData.lastBandCarkName;
            if (this.nameMask) this.nameMask.active = true;
        }
    }

    private setBankName(res: any) {
        const data = res;
        if (this.bankName) this.bankName.string = data?.bankName || '';
        this.bankID = data?.bankID ?? 0;
    }

    public onClickItemNode() {
        App.PopUpManager.addPopup('prefabs/popup/popupSelectBank', 'hall', null, false);
    }

    public onBind() {

        const beneficiaryname = this.fullRecipientName?.string || '';
        const accountno = this.bankAccountNumber?.string || '';
        const mobileno = `${App.userData().phoneNumber || ''}${this.phoneNumber?.string || ''}`;
        const ifsccode = this.ifscCode?.string || '';
        const bankID = this.bankID;

        App.ApiManager.setWithdrawalBankCard(beneficiaryname, accountno, mobileno, ifsccode, bankID).then((_ret: any) => {
            App.PopUpManager.closePopup(this.node);

            // Keep original navigation behavior
            const canvasBind = find('Canvas/popupWithdrawManagePayment');
            if (canvasBind) {
                App.PopUpManager.closePopup(canvasBind);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdrawManagePayment', 'hall', null, false);
            }
            const canvasWithdraw = find('Canvas/popupWithdraw');
            if (canvasWithdraw) {
                App.PopUpManager.closePopup(canvasWithdraw);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', 'hall', null, false);
            }
        });
    }

    // USDT
    public onClickItemNodeUSDT() {
        const self = this;
        const options = this.classData.map((e) => e.bankName);
        // vv.selectDate?.show?.(
        //     (index: number) => {
        //         if (self.classData.length === 0) return;
        //         if (self.usdtName) self.usdtName.string = self.classData[index].bankName;
        //         self.bankID = self.classData[index].bankID;
        //         self.statusIndex = index;
        //     },
        //     { type: 1, status: options, index: this.statusIndex }
        // );
    }

    public onBindUSDT() {
        const usdtaddress = this.usdtAddress?.string || '';
        const usdtRemarkName = this.usdtRemarkName?.string || '';
        const bankID = this.bankID;

        App.ApiManager.setWithdrawalUSDT(usdtaddress, usdtRemarkName, bankID, App.TransactionData.withdrawID).then((ret: any) => {
            App.PopUpManager.closePopup(this.node);

            const canvasBind = find('Canvas/popupWithdrawManagePayment');
            if (canvasBind) {
                App.PopUpManager.closePopup(canvasBind);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdrawManagePayment', 'hall', null, false);
            }
            const canvasWithdraw = find('Canvas/popupWithdraw');
            if (canvasWithdraw) {
                App.PopUpManager.closePopup(canvasWithdraw);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', 'hall', null, false);
            }
        });
    }

    private onLoadBankUSDT() {
        App.ApiManager.getBankList(App.TransactionData.withdrawID).then((ret: any) => {
            const list = ret?.banklist || [];
            if (list.length === 0) return;
            const element = list[0];
            this.classData = list;
            if (this.usdtName) this.usdtName.string = element.bankName || '';
            this.bankID = element.bankID ?? 0;
        });
    }

    // Wallet
    public onClickItemNodeWallet() {
        const self = this;
        const options = this.classData.map((e) => e.bankName);
        // vv?.selectDate?.show?.(
        //     (index: number) => {
        //         if (self.classData.length === 0) return;
        //         if (self.usdtName) self.usdtName.string = self.classData[index].bankName;
        //         self.bankID = self.classData[index].bankID;
        //         self.statusIndex = index;
        //     },
        //     { type: 1, status: options, index: this.statusIndex }
        // );
    }

    private onLoadBankWallet() {
        if (this.nameMaskWallet) this.nameMaskWallet.active = false;
        if (App.TransactionData.lastBandCarkName) {
            if (this.fullRecipientNameWallet) this.fullRecipientNameWallet.string = App.TransactionData.lastBandCarkName;
            if (this.nameMaskWallet) this.nameMaskWallet.active = true;
        }

        App.ApiManager.getBankList(App.TransactionData.withdrawID).then((ret: any) => {
            const list = ret?.banklist || [];
            if (list.length === 0) return;
            const element = list[0];
            this.classData = list;
            if (this.walletName) this.walletName.string = element.bankName || '';
            this.bankID = element.bankID ?? 0;
        });
    }

    public onBindWallet() {

        const query = {
            withdrawID: 4,
            mobile: App.userData().userInfo.verifyMethods?.mobile,
            beneficiaryname: this.fullRecipientNameWallet?.string || '',
            bankID: this.bankID,
        };
        App.ApiManager.setWithdrawalWallet(query).then((_ret: any) => {
            App.PopUpManager.closePopup(this.node);
            const canvasBind = find('Canvas/popupWithdrawManagePayment');
            if (canvasBind) {
                App.PopUpManager.closePopup(canvasBind);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdrawManagePayment', 'hall', null, false);
            }
            const canvasWithdraw = find('Canvas/popupWithdraw');
            if (canvasWithdraw) {
                App.PopUpManager.closePopup(canvasWithdraw);
                App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', 'hall', null, false);
            }
        });
    }

    public close() {
        App.PopUpManager.closePopup(this.node);
    }
}