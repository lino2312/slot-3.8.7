import { _decorator, Component, Node, Label, EditBox, Button, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BindCardEwallet')
export class BindCardEwallet extends Component {
    @property(Label) bankName: Label = null!;
    @property(EditBox) fullRecipientName: EditBox = null!;
    @property(EditBox) walletNumber: EditBox = null!;
    @property(Node) otpBtn: Node = null!;
    @property(Label) time: Label = null!;
    @property([SpriteFrame]) sendBg: SpriteFrame[] = [];
    @property(EditBox) smsCode: EditBox = null!;
    @property(Node) smsContainer: Node = null!;

    private bankID = 0;
    private timerId = null;

    onLoad() {
        if (App.TransactionData.lastBandCarkName) {
            this.fullRecipientName.string = App.TransactionData.lastBandCarkName || '';
        } else if (App.TransactionData.withdrawals?.[App.TransactionData.withdrawID]) {
            const data = App.TransactionData.withdrawals[App.TransactionData.withdrawID];
            this.fullRecipientName.string = data?.lastBandCarkName || '';
        }
        // Prefill mobile
        const mobile = App.userData().userInfo.verifyMethods?.mobile || '';
        if (mobile) this.walletNumber.string = mobile;

        App.ApiManager.registerState()
            .then((data) => {
                console.log('registerState data:', data);
                App.status.registerState = data;
                if (this.smsContainer) {
                    this.smsContainer.active = (data?.isOpenAddWithdrawSMS === '1');
                }
            })
            .catch((err) => {
                console.warn('Failed to get registerState:', err);
                if (this.smsContainer) this.smsContainer.active = false;
            });
        const btn = this.otpBtn.getComponent(Button);
        if (btn) btn.node.on(Button.EventType.CLICK, this.sendSMS, this);
        App.EventUtils.on('setBankName', this.setBankName, this);
        console.log('onLoad: BindCardEWallet: setBankName');
    }

    onDestroy() {
        App.EventUtils.off('setBankName', this.setBankName, this);
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private setBankName(res: any) {
        console.log('setBankName: ', res);
        const data = res;
        if (this.bankName) this.bankName.string = data?.bankName || '';
        this.bankID = data?.bankID ?? 0;
    }

    public onClickItemNode() {
        App.PopUpManager.addPopup('prefabs/popup/popupSelectBank', "hall", null, false);
    }

    public onBind() {
        if (!this.fullRecipientName?.string) {
            App.AlertManager.showFloatTip('Please enter your current account Name');
            return;
        }

        const query = {
            withdrawID: App.TransactionData.withdrawID,
            mobileNo: (this.walletNumber?.string || '').trim(),
            beneficiaryname: (this.fullRecipientName?.string || '').trim(),
            smsCode: (this.smsCode?.string || '').trim(),
            bankID: this.bankID,
        };

        App.ApiManager.setWithdrawalWallet(query).then(() => {
            if (App.userData().userInfo.kycVerificationStatus) {
                if (App.TransactionData.WithdrawRequirefirst) {
                    App.TransactionData.WithdrawRequirefirst = false;
                    App.EventUtils.dispatchEvent('updateBindedBankList', App.TransactionData.withdrawID, () => {
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

    public close() {
        App.PopUpManager.closePopup(this.node);
    }

    public sendSMS() {
        const btn = this.otpBtn?.getComponent(Button);
        console.log('sendSMS btn=', btn);
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
                this.time.string = 'Send';
            }
        }, 1000) as unknown as number;

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

    public async onPasteRecipientName() {
        const vv = (globalThis as any).cc?.vv;
        try {
            const pastedText = await navigator.clipboard.readText();
            if (this.fullRecipientName) this.fullRecipientName.string = pastedText || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }
}