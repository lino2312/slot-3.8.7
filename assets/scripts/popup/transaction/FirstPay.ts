import { _decorator, Component, EditBox, instantiate, Node, Prefab, sys } from 'cc';
import { App } from '../../App';
import { Config } from '../../config/Config';
import { FirstPayItem } from './FirstPayItem';
const { ccclass, property } = _decorator;

@ccclass('FirstPay')
export class FirstPay extends Component {
    @property(EditBox) editbox_recharge: EditBox = null!;

    @property(Prefab) firstPayItem: Prefab = null!;
    @property(Node) firstPayNode: Node = null!;
    @property(Node) UserPopUp: Node = null!;
    @property(EditBox) AccountNameLabel: EditBox = null!;
    @property(EditBox) BankAccountNameLabel: EditBox = null!;

    private _lastBankData: any = null;
    private PAYID: number = null;

    onLoad() {

        const enumDeposit = { USDT: 19 };
        const localBanklist = [9, 18];

        void this.populatePayOptions(enumDeposit, localBanklist);

        if (this.editbox_recharge) {
            this.editbox_recharge.string = String(App.TransactionData.firstStr ?? '');
        }
    }

    private addPayItem(
        element: any,
        rechargeInfo: any,
        localUsdtInfo: any,
        payID: number,
        cb: (sel: any) => void
    ) {
        const node = instantiate(this.firstPayItem);
        const op: FirstPayItem = node.getComponent(FirstPayItem);
        op.init(element, rechargeInfo, localUsdtInfo, payID, cb);
        this.firstPayNode.addChild(node);
    }

    private async populatePayOptions(enumDeposit: { USDT: number }, localBanklist: number[]) {
        try {
            const ret = await App.ApiManager.getPayTypeName();
            const list = ret?.typelist ?? [];
            if (!Array.isArray(list) || list.length === 0) return;

            for (const element of list) {
                if (!element?.payID) continue;

                // USDT
                if (element.payID === enumDeposit.USDT) {
                    const typesRet = await App.ApiManager.getRechargeTypes(element.payID, element.payTypeID);
                    const rcList = typesRet?.rechargetypelist ?? [];
                    const localUsdtlist = typesRet?.localUsdtlist ?? [];
                    const count = rcList.length;
                    this.PAYID = element.payID;

                    for (let i = 0; i < count; i++) {
                        const rechargeInfo = rcList[i];
                        const localUsdtInfo = localUsdtlist[i] ?? null;
                        this.addPayItem(element, rechargeInfo, localUsdtInfo, element.payID, (sel: any) => {
                            this.recharge(sel);
                        });
                    }
                }
                // 本地银行
                else if (localBanklist.includes(element.payID)) {
                    const typesRet = await App.ApiManager.getRechargeTypes(element.payID, element.payTypeID);
                    const banklist = typesRet?.banklist ?? [];
                    const rc0 = typesRet?.rechargetypelist?.[0] ?? null;
                    App.TransactionData.payID = element.payID;

                    for (const rechargeInfo of banklist) {
                        this.addPayItem(element, rechargeInfo, rc0, element.payID, (sel: any) => {
                            this.bankRecharge(sel);
                        });
                    }
                }
                // 其它
                else {
                    this.addPayItem(element, null, null, element.payID, (sel: any) => {
                        App.TransactionData.payID = element.payID;
                        this.recharge(sel);
                    });
                }
            }
        } catch (err) {
            console.error('Failed to populate pay options:', err);
        }
    }

    init(_data: any) {
        // noop
    }

    private recharge(ret: any) {
        const enumDeposit = { USDT: 19 };
        if (!ret) return;

        if (ret.payID === enumDeposit.USDT) {
            this.usdtRecharge(ret);
            return;
        }

        const rechargeType = ret?.rechargetypelist?.[0];
        if (!rechargeType?.miniPrice || !rechargeType?.maxPrice) return;

        const amountStr = this.editbox_recharge?.string ?? '';
        const amountNum = parseInt(amountStr);

        if (!amountStr) {
            App.AlertManager.showFloatTip('Please enter the amount');
            return;
        }

        if (isNaN(amountNum) || amountNum < rechargeType.miniPrice || amountNum > rechargeType.maxPrice) {
            App.AlertManager.showFloatTip(
                `Please enter an amount within the recharge amount range: ${rechargeType.miniPrice} - ${rechargeType.maxPrice}`
            );
            return;
        }

        const url =
            `${rechargeType.paySendUrl}?tyid=${rechargeType.payTypeID}` +
            `&amount=${amountStr}&uid=${App.userData().userInfo.userId}` +
            `&sign=${App.userData().userInfo.sign}` +
            `&urlInfo=https://play.${Config.domainurl}&pixelId=&fbcId=`;

        sys.openURL(url);
    }

    private usdtRecharge(ret: any) {
        const inputValue = this.editbox_recharge?.string?.trim?.() || '';
        if (!inputValue) {
            App.AlertManager.showFloatTip('Please enter the amount');
            return;
        }

        const min = ret?.currentChannel?.miniPrice;
        const max = ret?.currentChannel?.maxPrice;
        const iv = parseInt(inputValue);

        if (isNaN(iv) || iv < min || iv > max) {
            App.AlertManager.showFloatTip(`Please enter an amount within the recharge amount range:   ${min} - ${max}`);
            return;
        }

        const amountValue = parseFloat(inputValue);
        if (isNaN(amountValue) || amountValue <= 0) {
            App.AlertManager.showFloatTip('Please enter a valid amount');
            return;
        }

        const usdtinfo = {
            usdtId: ret.usdtID,
            amount: amountValue,
            usdtType: ret.usdtType,
            usdtName: ret.usdtName,
            rechargeAddress: ret.rechargeAddress,
            transferOutAddress: '',
        };

        App.TransactionData.payID = this.PAYID;
        console.log("App.TransactionData.payID: FirstPay ", App.TransactionData.payID);
        App.PopUpManager.addPopup("prefabs/popup/popupUsdt", "hall", usdtinfo, false);
    }

    private bankRecharge(ret: any) {
        console.log('BANK RECHARGE: ret', ret);
        const localBanklist = [9, 18];
        const payId = ret?.currentPaymentMethod?.payID ?? ret?.payID;

        if (localBanklist.includes(payId)) {
            this._lastBankData = ret;
            if (App.status.isOpenOfficialRechargeInputDialog) {
                if (this.UserPopUp) this.UserPopUp.active = true;
            } else {
                this.localbankRecharge(ret);
            }
        }
    }

    public onClickLocalBank() {
        if (!this._lastBankData) {
            console.error('No Bank Data Available');
            return;
        }
        this.localbankRecharge(this._lastBankData);
    }

    public onCancelLocalBank() {
        if (this.UserPopUp) this.UserPopUp.active = false;
        if (this.AccountNameLabel) this.AccountNameLabel.string = '';
        if (this.BankAccountNameLabel) this.BankAccountNameLabel.string = '';
    }

    private localbankRecharge(ret: any) {
        const vv = (globalThis as any).cc?.vv;

        const AName = this.AccountNameLabel?.string?.trim?.() || '';
        const BANumber = this.BankAccountNameLabel?.string?.trim?.() || '';
        const inputValue = this.editbox_recharge?.string?.trim?.() || '';

        if (App.status.isOpenOfficialRechargeInputDialog) {
            if (!AName) {
                App.AlertManager.showFloatTip('Please enter Account Name');
                return;
            }
            if (!BANumber) {
                App.AlertManager.showFloatTip('Please enter Bank Account Number');
                return;
            }
        }

        if (!inputValue) {
            App.AlertManager.showFloatTip('Please enter the amount');
            return;
        }

        const min = ret?.currentPaymentMethod?.miniPrice;
        const max = ret?.currentPaymentMethod?.maxPrice;
        const iv = parseInt(inputValue);
        if (isNaN(iv) || iv < min || iv > max) {
            App.AlertManager.showFloatTip(`Please enter an amount within the recharge amount range:   ${min} - ${max}`);
            return;
        }

        const amountValue = parseFloat(inputValue);
        if (isNaN(amountValue) || amountValue <= 0) {
            App.AlertManager.showFloatTip('Please enter a valid amount');
            return;
        }

        const amount = amountValue;
        const payTypeId = ret?.currentPaymentMethod?.payTypeID;
        const transferType = ret?.currentChannel?.transferType;
        App.ApiManager.newSetRechargesBankOrder(amount, payTypeId, transferType, AName, BANumber).then((res: any) => {
            if (res) {
                // vv?.PopupManager?.addPopup?.('YD_Pro/recharge/usdt', { scriptName: 'usdt', datasource: res });
                App.TransactionData.payID = payTypeId;
                App.PopUpManager?.addPopup('prefabs/popup/popupUsdt', "hall", res, false);
                if (this.UserPopUp) this.UserPopUp.active = false;
            }
        });
    }

    public onSelect() {
        // noop
    }
}