import { _decorator, Component, Node, Label, EditBox, Prefab, instantiate } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BindCardYonoCard')
export class BindCardYonoCard extends Component {
    @property(Node) nameMask: Node = null!;

    @property(Label) bankName: Label = null!;
    @property(EditBox) fullRecipientName: EditBox = null!;
    @property(EditBox) bankAccountNumber: EditBox = null!;
    @property(EditBox) bankAccountNumber2: EditBox = null!;
    @property(EditBox) phoneNumber: EditBox = null!;
    @property(EditBox) ifscCode: EditBox = null!;

    @property(Prefab) managePayments: Prefab = null!;

    public classData: any[] = [];
    public statusIndex = 0;

    private bankID = 0;

    onLoad() {
        App.EventUtils.on('setBankName', this.setBankName, this);
        console.log('onLoad: BindCardYonoCard: setBankName');
    }

    onDestroy() {
        App.EventUtils.off('setBankName', this.setBankName, this);
    }

    start() { }

    private setBankName(res: any) {
        console.log('setBankName: ', res);
        // const data = res?.detail;
        const data = res;
        this.bankName && (this.bankName.string = data?.bankName || '');
        this.bankID = data?.bankID ?? 0;
    }

    public onClickItemNode() {
        App.PopUpManager.addPopup('prefabs/popup/popupSelectBank', "hall", null, false);
    }

    public onBind() {
        if ((this.bankAccountNumber?.string || '') !== (this.bankAccountNumber2?.string || '')) {
            App.AlertManager.getCommonAlert().showWithoutCancel('Please enter your current account number');
            return;
        }

        const beneficiaryName = this.fullRecipientName?.string || '';
        const accountNo = this.bankAccountNumber?.string || '';
        const mobileNo = App.userData().userInfo.verifyMethods?.mobile || '';
        const ifscCode = this.ifscCode?.string || '';
        const bankID = this.bankID;
        App.ApiManager.setWithdrawalBankCard(beneficiaryName, accountNo, mobileNo, ifscCode, bankID).then((_ret: any) => {
            if (App.userData().userInfo.kycVerificationStatus) {
                if (App.TransactionData.WithdrawRequirefirst) {
                    App.TransactionData.WithdrawRequirefirst = false;
                    App.EventUtils.dispatchEvent('updateBindedBankList', App.TransactionData.withdrawID, () => {
                        App.EventUtils.dispatchEvent('updateWithdrawBankListUI');
                        App.EventUtils.dispatchEvent('updateBindedBankListUI');
                        App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', "hall", null, false);
                    });
                } else {
                    App.EventUtils.dispatchEvent('updateBindedBankList', App.TransactionData.withdrawID, () => {
                        App.EventUtils.dispatchEvent('updateBindedBankListUI', {});
                        App.EventUtils.dispatchEvent('updateWithdrawBankListUI', {});
                    });
                    App.PopUpManager.addPopup(this.managePayments, "hall", null, false);
                }
            } else {
                App.PopUpManager.addPopup('prefabs/popup/popupBindCardVerify', "hall", null, false);
            }
            App.PopUpManager.closePopup(this.node);
        });
    }

    public async onPasteAccountNumber() {
        const vv = (globalThis as any).cc?.vv;
        try {
            const pastedText = await navigator.clipboard.readText();
            if (this.bankAccountNumber) this.bankAccountNumber.string = pastedText || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    public async onPasteRetypeAccountNumber() {
        try {
            const pastedText = await navigator.clipboard.readText();
            if (this.bankAccountNumber2) this.bankAccountNumber2.string = pastedText || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    public async onPasteIfscCode() {
        const vv = (globalThis as any).cc?.vv;
        try {
            const pastedText = await navigator.clipboard.readText();
            if (this.ifscCode) this.ifscCode.string = pastedText || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    public close() {
        App.PopUpManager.closePopup(this.node);
    }
}