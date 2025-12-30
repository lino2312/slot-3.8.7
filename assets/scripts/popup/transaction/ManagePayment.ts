import { _decorator, Component, EditBox, find, instantiate, Label, Node, Prefab, tween, Vec3 } from 'cc';
import { App } from '../../App';
import { PopUpAnimType } from '../../component/PopupComponent';
import { Config } from '../../config/Config';
import { WithdrawalTypes } from './WithdrawalTypes';
const { ccclass, property } = _decorator;

export const WithdrawId = {
    BANKCARD: 1,
    UPI: 2,
    USDT: 3,
    EWALLET: 4,
    PIX: 5,
    GCASH: 6,
    PAYMAYA: 8,
    ARPAY: 21,
};


@ccclass('ManagePayment')
export class ManagePayment extends Component {
    @property(Node) pop1: Node = null!;
    @property(Label) editLbl1: Label = null!;
    @property(Label) editLbl2: Label = null!;
    @property(EditBox) editBox: EditBox = null!;

    @property(Node) pop2: Node = null!;
    @property(Label) enterLbl1: Label = null!;
    @property(Label) enterLbl2: Label = null!;
    @property(EditBox) enterBox: EditBox = null!;

    @property(Node) mask: Node = null!;

    @property(Node) bankItem: Node = null!;
    @property(Node) bankItemNode: Node = null!;
    @property(Prefab) withdrawalItem: Prefab = null!;
    @property(Node) nodeContent: Node = null!;

    private index = 0;

    onLoad() {
        App.EventUtils.on('updateBindedBankListUI', this.updateBindedBankListUI, this);
        const inr = find('ui/New ScrollView/view/content/2', this.node);
        if (inr && Config.gameChannel === 'D107') {
            inr.active = false;
        }
        this.bankInfo();
        this.globalClickEvent();
    }

    onEnable() {
        this.updateBindedBankListUI();
    }

    protected onDestroy(): void {
        App.EventUtils.off('updateBindedBankListUI', this.updateBindedBankListUI, this);
    }

    start() {

    }

    private getReturnUrl() {
        if (!App.DeviceUtils.isNative()) {
            return window.location.hostname;
        }
        return Config.domainurl;
    }

    goActive() {
        const returnUrl = 'https://' + this.getReturnUrl();
        const query = { returnUrl };
        App.ApiManager.arbWalletActivate(query).then((res: any) => {
            const url =
                res?.walletActivationPageUrl +
                '&memberId=' +
                res?.memberId +
                '&merchantCode=' +
                res?.merchantCode +
                '&timestamp=' +
                res?.timestamp;
            if (url) App.SystemUtils.openThirdGame(url, returnUrl);
        });
    }

    private goWallet() {
        const returnUrl = 'https://' + this.getReturnUrl();
        const query = { returnUrl };
        App.ApiManager.arbWalletEnter(query).then((res: any) => {
            const url = res?.walletAccessUrl;
            if (url) App.SystemUtils.openThirdGame(url, returnUrl);
        });
    }

    handleWallet() {
        if (App.TransactionData.arbWallet?.walletActivationStatus === 1) {
            this.goWallet();
        } else {
            this.goActive();
        }
    }

    private updateBindedBankListUI() {
        const ret = App.TransactionData.withdrawalTypes;
        if (!ret || !Array.isArray(ret.withdrawlist) || ret.withdrawlist.length === 0) return;

        this.nodeContent?.removeAllChildren();

        for (let i = 0; i < ret.withdrawlist.length; i++) {
            const element = ret.withdrawlist[i];
            const node = instantiate(this.withdrawalItem);
            const comp: WithdrawalTypes = node.getComponent(WithdrawalTypes);
            comp.init(
                element.withdrawID,
                element?.name,
                element.withBeforeImgUrl,
                element.withdrawID === WithdrawId.ARPAY,
                () => {
                    if (App.userData().isGuest) {
                        App.PopUpManager.addPopup('prefabs/popup/popupBindCardVerify', "hall", null, false);
                        App.TransactionData.WithdrawRequirefirst = true;
                        return;
                    }
                    App.TransactionData.withdrawID = element.withdrawID; // 1 bank, 2 upi, 3 usdt
                    if (element.withdrawID === WithdrawId.BANKCARD) {
                        App.PopUpManager.addPopup('prefabs/popup/popupBindCardYonoCard', "hall", null, false);
                        return;
                    }
                    if (element.withdrawID === WithdrawId.UPI) {
                        App.PopUpManager.addPopup('prefabs/popup/popupBindCardUpi', "hall", null, false);
                        return;
                    }
                    if (element.withdrawID === WithdrawId.USDT) {
                        App.PopUpManager.addPopup('prefabs/popup/popupBindCardUsdt', "hall", null, false);
                        return;
                    }
                    if (
                        element.withdrawID === WithdrawId.EWALLET ||
                        element.withdrawID === WithdrawId.GCASH ||
                        element.withdrawID === WithdrawId.PAYMAYA
                    ) {
                        App.PopUpManager.addPopup('prefabs/popup/popupBindCardEwallet', "hall", null, false);
                        return;
                    }
                    if (element.withdrawID === WithdrawId.ARPAY) {
                        this.handleWallet();
                        return;
                    }
                }
            );
            this.nodeContent.addChild(node);
        }
    }

    private globalClickEvent() {
        const bindClick = (path: string, handler: (...args: any[]) => void) => {
            const n = find(path, this.node);
            if (n) {
                n.on(Node.EventType.TOUCH_END, handler, this);
            }
        };

        bindClick('ui/New ScrollView/view/content/1/edit', this.bank.bind(this, 1));
        bindClick('ui/New ScrollView/view/content/2/edit', this.bank.bind(this, 2));
        bindClick('ui/New ScrollView/view/content/3/edit', this.bank.bind(this, 3));
        bindClick('ui/New ScrollView/view/content/4/edit', this.bank.bind(this, 4));

        bindClick('ui/New ScrollView/view/content/1/bar', this.bankEndit.bind(this, 1));
        bindClick('ui/New ScrollView/view/content/2/bar', this.bankEndit.bind(this, 2));
        bindClick('ui/New ScrollView/view/content/3/bar', this.bankEndit.bind(this, 3));
        bindClick('ui/New ScrollView/view/content/4/bar', this.bankEndit.bind(this, 4));

        bindClick('mask', this.close.bind(this));
        bindClick('pop02Enter/endit/x', this.close.bind(this));
        bindClick('pop01Endit/endit/x', this.close.bind(this));
        bindClick('pop01Endit/endit/redBtn', this.close.bind(this));

        bindClick('pop01Endit/endit/copy', this.copy1.bind(this));
        bindClick('pop02Enter/endit/copy', this.copy2.bind(this));
    }

    private bankInfo() {
        const data = App.TransactionData.withdrawals[1];
        if (!data || !Array.isArray(data.withdrawalslist) || data.withdrawalslist.length === 0) {
            console.warn('No withdrawal data for Bank (ID 1).');
            return;
        }

        this.bankItemNode?.removeAllChildren();
        for (let i = 0; i < data.withdrawalslist.length; i++) {
            const element = data.withdrawalslist[i];
            const item = instantiate(this.bankItem);
            item.children?.[1]?.getComponent(Label) && (item.children[1].getComponent(Label)!.string = element.accountNo || '');
            item.parent = this.bankItemNode;
            item.active = true;
        }
    }

    private bank(index: number) {
        this.index = index;
        if (!this.pop2 || !this.mask) return;

        this.pop2.active = true;
        this.pop2.setScale(0, 0, 1);
        this.mask.active = true;

        const i = index - 1;
        const edit = [
            'bank',
            'Edit your vaild INR Wallets Address',
            'Edit your vaild UPI ID',
            'Enter your valid USDT(TRC20) Address',
        ];
        const editNode = [
            'bank',
            "INR Wallets once added can't be changed later",
            "UPI ID once added can't be changed late",
            "Make sure USDT Address is TRC20,once added can't be changed late",
        ];

        if (this.enterLbl1) this.enterLbl1.string = edit[i] || '';
        if (this.enterLbl2) this.enterLbl2.string = editNode[i] || '';

        this.open(2);
        this.bankInfo();
    }

    private bankEndit(index: number) {
        const vv = (globalThis as any).cc?.vv;
        if (index === 1) {
            // vv?.PopupManager?.addPopup?.('YD_Pro/bank/ui_bindCard_yono_card');
            App.PopUpManager.addPopup('prefabs/popup/popupBindCardYonoCard', "hall", null, false);
            return;
        }

        if (!this.pop1 || !this.mask) return;
        this.pop1.active = true;
        this.pop1.setScale(0, 0, 1);
        this.mask.active = true;

        const i = index - 1;
        const edit = ['bank', 'Edit INR Wallets', 'Edit UPI', 'Edit USDT'];
        const editNode = [
            'bank',
            'Enter your New INR Wallet Address',
            'Enter your valid UPI ID',
            'Enter your valid USDT(TRC20) Address',
        ];
        if (this.editLbl1) this.editLbl1.string = edit[i] || '';
        if (this.editLbl2) this.editLbl2.string = editNode[i] || '';

        this.open(1);
    }

    public submitBankEndit(index: number) {

        // E-Wallet
        if (index === 2) {
            App.ApiManager.getBankList(4).then((res: any) => {
                const bankDetails = res?.banklist || [];
                if (!Array.isArray(bankDetails) || !bankDetails[0]) return;
                const ewalletName = this.editBox?.string || '';
                const query = {
                    withdrawID: WithdrawId.EWALLET,
                    mobile: App.userData().userInfo.verifyMethods?.mobile,
                    beneficiaryname: ewalletName,
                    bankID: bankDetails[0]?.bankID,
                };
                App.ApiManager.setWithdrawalWallet(query).then((_data: any) => {
                    console.log("INR BIND DATA", _data);
                    // handle result if needed
                });
            });
        }

        // // UPI
        if (index === 3) {
            // vv?.ApiMgr?.getBankList?.(2, (ret: any) => {
            //     const bankDetails = ret?.banklist || [];
            //     if (!Array.isArray(bankDetails) || !bankDetails[0]) return;

            //     const beneficiaryname = this.editBox?.string || '';
            //     vv?.ApiMgr?.setWithdrawalNewUPI?.(beneficiaryname, bankDetails[0]?.bankID, (_data: any) => {
            //         // handle result
            //     });
            // });
            App.ApiManager.getBankList(2).then((res: any) => {
                const bankDetails = res?.banklist || [];
                if (!Array.isArray(bankDetails) || !bankDetails[0]) return;
                const usdtaddress = this.editBox?.string || '';
                const usdtRemarkName = '';
                App.ApiManager.setWithdrawalNewUPI(usdtaddress, usdtRemarkName, bankDetails[0]?.bankID, "", "").then((_data: any) => {
                    // handle result
                });
            });
        }

        // // USDT
        if (index === 4) {
            // vv?.ApiMgr?.getBankList?.(3, (ret: any) => {
            //     const bankDetails = ret?.banklist || [];
            //     if (!Array.isArray(bankDetails) || !bankDetails[0]) return;

            //     const usdtaddress = this.editBox?.string || '';
            //     const usdtRemarkName = '';
            //     vv?.ApiMgr?.setWithdrawalUSDT?.(usdtaddress, usdtRemarkName, bankDetails[0]?.bankID, (_data: any) => {
            //         // handle result
            //     });
            // });
            App.ApiManager.getBankList(3).then((res: any) => {
                const bankDetails = res?.banklist || [];
                if (!Array.isArray(bankDetails) || !bankDetails[0]) return;
                const usdtaddress = this.editBox?.string || '';
                const usdtRemarkName = '';
                App.ApiManager.setWithdrawalUSDT(usdtaddress, usdtRemarkName, bankDetails[0]?.bankID, 0).then((_data: any) => {
                    // handle result
                });
            });

        }

        this.close();
    }

    private copy1() {
        App.AlertManager.showFloatTip('Copy successful');
        App.PlatformApiMgr?.Copy?.(this.editBox?.string || '');
    }

    private copy2() {
        App.AlertManager.showFloatTip('Copy successful');
        App.PlatformApiMgr?.Copy?.(this.enterBox?.string || '');
    }

    private open(which: number) {
        const node = which === 1 ? this.pop1 : this.pop2;
        if (!node) return;

        node.active = true;
        node.setScale(0, 0, 1);

        tween(node)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                // animation done
            })
            .start();
    }

    private close() {
        const node = this.pop1?.active ? this.pop1 : this.pop2;
        if (!node) return;

        node.active = true;
        node.setScale(1, 1, 1);

        tween(node)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.3, { scale: new Vec3(0, 0, 1) })
            .call(() => {
                node.active = false;
                if (this.mask) this.mask.active = false;

                if (this.editBox) this.editBox.string = '';
                if (this.enterBox) this.enterBox.string = '';
            })
            .start();
    }

    bind() {
        const n = find(`ui/New ScrollView/view/content/${this.index}/bar`, this.node);
        if (n) n.active = true;
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node, PopUpAnimType.normal);
    }

    onClick() {
        if (this.pop1) this.pop1.active = false;
        if (this.pop2) this.pop2.active = false;
        if (this.mask) this.mask.active = false;
    }
}