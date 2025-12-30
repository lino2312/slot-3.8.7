import { _decorator, Component, Node, Label, EditBox } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BindCardUsdt')
export class BindCardUsdt extends Component {
    @property(EditBox) usdtAddress: EditBox = null!;
    @property(EditBox) usdtRemarkName: EditBox = null!;
    @property(Label) bankName: Label = null!;

    private bankID = 0;

    onLoad() {
        App.EventUtils.on("setBankName", this.setBankName, this);
        console.log('onLoad: BindCardUsdt: setBankName');
    }

    onDestroy() {
        App.EventUtils.off("setBankName", this.setBankName, this);
    }

    start() { }

    private setBankName(res: any) {
        console.log("setBankName: ", res);
        const data = res;
        this.bankName && (this.bankName.string = data?.bankName || '');
        this.bankID = data?.bankID ?? 0;
    }

    public onClickItemNode() {
        App.PopUpManager.addPopup('prefabs/popup/popupSelectBank', 'hall', null, false);
    }

    public onBind() {
        const addr = this.usdtAddress?.string || '';
        const alias = this.usdtRemarkName?.string || '';
        if (!addr && !alias) {
            App.AlertManager.showFloatTip('Please complete the form!');
            return;
        }

        const bankID = this.bankID;
        const withdrawID = App.TransactionData.withdrawID;

        App.ApiManager.setWithdrawalUSDT(addr, alias, bankID, withdrawID).then(() => {
            if (App.userData().userInfo.kycVerificationStatus) {
                if (App.TransactionData.WithdrawRequirefirst) {
                    App.TransactionData.WithdrawRequirefirst = false;
                    App.EventUtils.dispatchEvent('updateBindedBankList', { id: App.TransactionData.withdrawID }, () => {
                        App.EventUtils.dispatchEvent('updateWithdrawBankListUI');
                        App.EventUtils.dispatchEvent('updateBindedBankListUI');
                        App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', 'hall', null, false);
                    });
                } else {
                    App.EventUtils.dispatchEvent('updateBindedBankList', App.TransactionData.withdrawID, () => {
                        App.EventUtils.dispatchEvent('updateWithdrawBankListUI', {});
                        App.EventUtils.dispatchEvent('updateBindedBankListUI', {});
                    });
                    App.PopUpManager.addPopup('prefabs/popup/popupBindCardYono', 'hall', null, false);
                }
            } else {
                App.PopUpManager.addPopup('prefabs/popup/popupBindCardVerify', 'hall', null, false);
            }
            App.PopUpManager.closePopup(this.node);
        });
    }

    public async onPasteUsdtAddress() {
        try {
            const text = await navigator.clipboard.readText();
            if (this.usdtAddress) this.usdtAddress.string = text || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    public async onPasteUsdtAlias() {
        try {
            const text = await navigator.clipboard.readText();
            if (this.usdtRemarkName) this.usdtRemarkName.string = text || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    public close() {
        App.PopUpManager.closePopup(this.node);
    }
}