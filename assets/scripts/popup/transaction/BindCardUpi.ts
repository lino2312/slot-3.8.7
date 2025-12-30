import { _decorator, Component, Node, Label, EditBox, Button, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BindCardUpi')
export class BindCardUpi extends Component {
    @property(EditBox) fullRecipientName: EditBox = null!;
    @property(EditBox) bankAccountNumber: EditBox = null!;
    @property(EditBox) bankAccountNumber2: EditBox = null!;

    @property(Node) otpBtn: Node = null!;
    @property(Label) time: Label = null!;
    @property([SpriteFrame]) sendBg: SpriteFrame[] = [];
    @property(EditBox) smsCode: EditBox = null!;
    @property(Node) smsContainer: Node = null!;

    private timerId = null;

    onLoad() {
        if (App.TransactionData.lastBandCarkName) {
            App.ApiManager.getWithdrawals(App.TransactionData.withdrawID).then((data: any) => {
                App.TransactionData.lastBandCarkName = data?.lastBandCarkName || App.TransactionData.lastBandCarkName;
                if (this.fullRecipientName) this.fullRecipientName.string = App.TransactionData.lastBandCarkName || '';
            });

        }

        App.ApiManager.registerState().then(() => {
            if (this.smsContainer) {
                this.smsContainer.active = (App.status.registerState?.isOpenAddWithdrawSMS !== '0');
            }
        });
    }

    start() { }

    onDestroy() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    public onBind() {

        if ((this.bankAccountNumber?.string || '') !== (this.bankAccountNumber2?.string || '')) {
            App.AlertManager.showFloatTip('Please enter your current account number');
            return;
        }

        const beneficiaryname = (this.fullRecipientName?.string || '').trim();
        const accountno = (this.bankAccountNumber?.string || '').trim();
        const withdrawID = App.TransactionData.withdrawID;
        const smsCode = (this.smsCode?.string || '').trim();
        const mobile = App.userData().userInfo.verifyMethods?.mobile;

        App.ApiManager.setWithdrawalNewUPI(beneficiaryname, accountno, withdrawID, smsCode, mobile).then((res: any) => {
            if (App.userData().userInfo.kycVerificationStatus) {
                if (App.TransactionData.WithdrawRequirefirst) {
                    App.TransactionData.WithdrawRequirefirst = false;
                    App.EventUtils.dispatchEvent('updateBindedBankList', { id: App.TransactionData.withdrawID }, () => {
                        App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', "hall", null, false);
                    });
                } else {
                    App.EventUtils.dispatchEvent('updateBindedBankList', { id: App.TransactionData.withdrawID }, () => {
                        App.EventUtils.dispatchEvent('updateBindedBankListUI', {});
                        App.EventUtils.dispatchEvent('updateWithdrawBankListUI', {});
                    });
                    App.PopUpManager.addPopup('prefabs/popup/popupBindCardYono', "hall", null, false);
                }
            } else {
                App.PopUpManager.addPopup('prefabs/popup/popupBindCardVerify', "hall", null, false);
            }
            App.PopUpManager.closePopup(this.node)
        });
    }

    public async onPasteAccountNumber() {
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

    public close() {
        App.PopUpManager.closePopup(this.node)
    }

    public sendSMS() {
        const btn = this.otpBtn?.getComponent(Button);
        if (!btn || !this.time) return;

        btn.interactable = false;
        let countdown = 120;
        this.time.string = `${countdown}s`;

        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.timerId = setInterval(() => {
            countdown--;
            if (this.time) this.time.string = `${countdown}s`;
            if (countdown <= 0) {
                if (this.timerId !== null) {
                    clearInterval(this.timerId);
                    this.timerId = null;
                }
                btn.interactable = true;
                this.otpBtn?.getComponent(Sprite) && (this.otpBtn.getComponent(Sprite)!.spriteFrame = this.sendBg?.[0] || null);
                if (this.time) this.time.string = 'Send';
            }
        }, 1000);

        const mobile = App.userData().userInfo.verifyMethods?.mobile;
        if (!mobile) {
            App.AlertManager.showFloatTip('Please bind your mobile number first');
            btn.interactable = true;
            if (this.timerId !== null) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
            this.time.string = 'Send';
            return;
        }

        const KYC_VERIFICATION = 16;
        App.ApiManager.smsVerifyCode(mobile, KYC_VERIFICATION).then((response: any) => {
            if (!(response?.code === 0 && response?.msg === 'Succeed')) {
                btn.interactable = true;
                this.otpBtn?.getComponent(Sprite) && (this.otpBtn.getComponent(Sprite)!.spriteFrame = this.sendBg?.[1] || null);
                if (this.timerId !== null) {
                    clearInterval(this.timerId);
                    this.timerId = null;
                }
                if (this.time) this.time.string = 'Send';
                App.AlertManager.showFloatTip(response?.msg || 'Failed to send SMS');
            }
        });
    }
}