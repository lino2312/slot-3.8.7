import { _decorator, Component, EditBox, Label, Layout, Node } from 'cc';
import { App } from '../../App';

const { ccclass, property } = _decorator;

@ccclass('Usdt')
export class Usdt extends Component {
    @property(EditBox) usdtAddress: EditBox = null!;
    @property(EditBox) depositMainNetwork: EditBox = null!;
    @property(EditBox) transferAddress: EditBox = null!;
    @property(Label) depositLabel: Label = null!;

    @property(Node) usdtPage: Node = null!;
    @property(Node) bankPage: Node = null!;
    @property(Node) twoBtn: Node = null!;

    @property(Label) fullName: Label = null!;
    @property(Label) bankAccountNumber: Label = null!;
    @property(Label) ifsc: Label = null!;
    @property(EditBox) balance: EditBox = null!;
    @property(EditBox) utr: EditBox = null!;

    @property(Label) time: Label = null!;
    @property(Node) timer: Node = null!;

    private usdtinfo: any = null;
    private remainingSeconds = 0;

    // 供弹窗管理器注入数据
    public init(data: any) {
        // this.usdtinfo = data;
    }

    onLoad() {
        // 绑定输入大写
        this.ifsc?.node?.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
            const upper = (editBox.string || '').toUpperCase();
            if (editBox.string !== upper) editBox.string = upper;
        }, this);

        this.utr?.node?.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
            const upper = (editBox.string || '').toUpperCase();
            if (editBox.string !== upper) editBox.string = upper;
        }, this);

        // 默认隐藏
        if (this.usdtPage) this.usdtPage.active = false;
        if (this.bankPage) this.bankPage.active = false;
        if (this.twoBtn) this.twoBtn.active = false;
        var usdtinfo = this.usdtinfo;
        console.log("usdtinfo: setParams ", usdtinfo);
        console.log("App.TransactionData.payID: ", App.TransactionData.payID);
        if (App.TransactionData.payID === 19) {
            // USDT
            if (this.usdtPage) this.usdtPage.active = true;
            if (this.timer) this.timer.active = false;

            const ds = this.usdtinfo || {};
            this.usdtAddress && (this.usdtAddress.string = ds.rechargeAddress || '');
            this.transferAddress && (this.transferAddress.string = ds.transferOutAddress || '');
            this.depositMainNetwork && (this.depositMainNetwork.string = ds.usdtName || '');
            if (ds.PendingOrder && this.depositLabel) {
                this.depositLabel.string = 'Update Now';
            }
        } else {
            // BANK/UPI
            if (this.bankPage) this.bankPage.active = true;
            if (this.twoBtn) this.twoBtn.active = true;

            const ds = this.usdtinfo || {};
            this.fullName && (this.fullName.string = ds.accountName || '');
            this.bankAccountNumber && (this.bankAccountNumber.string = ds.bankAccountNumber || '');
            this.ifsc && (this.ifsc.string = ds.ifscCode || '');
            this.balance && (this.balance.string = ds.amount || '');

            this.startCountdown(ds.addTime1, ds.serverTime, '-');
        }

        if (this.usdtPage) this.usdtPage.getComponent(Layout).enabled = false;
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    onCopy() {
        const val = this.usdtAddress?.string || '';
        if (!val) return App.AlertManager.showFloatTip('Nothing to Copy');
        App.PlatformApiMgr.Copy(val);
        App.AlertManager.showFloatTip('Copy Success');

    }

    setParams(usdtinfo) {
        this.usdtinfo = usdtinfo;

    }

    onCopyFN() {
        const val = this.fullName?.string || '';
        if (!val) return App.AlertManager.showFloatTip('Nothing to Copy');
        App.PlatformApiMgr.Copy(val);
        App.AlertManager.showFloatTip('Copy Success');
    }

    onCopyBankAccount() {
        const val = this.bankAccountNumber?.string || '';
        if (!val) return App.AlertManager.showFloatTip('Nothing to Copy');
        App.PlatformApiMgr.Copy(val);
        App.AlertManager.showFloatTip('Copy Success');
    }

    onCopyIFSC() {
        const val = this.ifsc?.string || '';
        if (!val) return App.AlertManager.showFloatTip('Nothing to Copy');
        App.PlatformApiMgr.Copy(val);
        App.AlertManager.showFloatTip('Copy Success');
    }

    onCopyBalance() {
        const val = this.balance?.string || '';
        if (!val) return App.AlertManager.showFloatTip('Nothing to Copy');
        App.PlatformApiMgr.Copy(val);
        App.AlertManager.showFloatTip('Copy Success');
    }

    async onPasteUTR() {
        try {
            let pastedText: string = ""
            if (App.DeviceUtils.isNative()) {
                pastedText = App.PlatformApiMgr.getTxtFromClipboard?.() || "";
            }
            else {
                pastedText = await navigator.clipboard.readText();
            }
            if (this.utr) this.utr.string = pastedText || '';
            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    async onPaste() {
        try {
            let pastedText: string = ""
            if (App.DeviceUtils.isNative()) {
                pastedText = App.PlatformApiMgr.getTxtFromClipboard?.() || "";
            }
            else {
                pastedText = await navigator.clipboard.readText();
            }
            if (this.transferAddress) this.transferAddress.string = pastedText || '';

            App.AlertManager.showFloatTip('Paste Success');
        } catch {
            App.AlertManager.showFloatTip('Please allow permission to Clipboard');
        }
    }

    parseCustomDate(timeString: string, typeSplit: string = '/') {
        if (!timeString) return null as any;
        const [datePart, timePart = '00:00:00'] = timeString.split(' ');
        let year: string, month: string, day: string;

        if (datePart.includes('/')) {
            const parts = datePart.split('/');
            if (parts[0].length === 4) {
                [year, month, day] = parts;
            } else {
                [day, month, year] = parts;
            }
        } else if (datePart.includes('-')) {
            [year, month, day] = datePart.split('-');
        } else {
            // 兜底：按 typeSplit 分割
            const parts = datePart.split(typeSplit);
            [year, month, day] = parts.length === 3 ? parts : ['1970', '01', '01'];
        }

        const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
        const isoString =
            `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T` +
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return new Date(isoString);
    }

    getTimeRemainingInHHMMSS(startTime: Date, endTime: Date) {
        const diffMs = Math.abs(endTime.getTime() - startTime.getTime());
        return Math.floor(diffMs / 1000);
    }

    startCountdown(addTime1: string, serverTime: string, typeSplit: string = '/') {
        const addTimeDate = this.parseCustomDate(addTime1, typeSplit);
        const serverTimeDate = this.parseCustomDate(serverTime, typeSplit);
        if (!addTimeDate || !serverTimeDate) return;

        this.remainingSeconds = this.getTimeRemainingInHHMMSS(serverTimeDate, addTimeDate);
        this.unschedule(this.updateTimer);
        this.schedule(this.updateTimer, 1);
    }

    updateTimer = () => {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            const hours = Math.floor(this.remainingSeconds / 3600);
            const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
            const seconds = this.remainingSeconds % 60;
            const pad = (n: number) => n.toString().padStart(2, '0');

            if (this.time) this.time.string = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            if (this.timer) this.timer.active = true;
        } else {
            if (this.time) this.time.string = '00:00:00';
            this.unschedule(this.updateTimer);
        }
    };

    updateTimerDisplay() {
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;
        if (this.time) {
            this.time.string =
                `${hours.toString().padStart(2, '0')}:` +
                `${minutes.toString().padStart(2, '0')}:` +
                `${seconds.toString().padStart(2, '0')}`;
        }
    }

    DepositBtn() {
        const ds = this.usdtinfo || {};
        if (App.TransactionData.payID === 19) {
            // USDT
            if (ds.PendingOrder) {
                const updateData = {
                    ...ds,
                    orderNo: ds.orderNo,
                    rechargeAddress: ds.rechargeAddress,
                    transferOutAddress: this.transferAddress?.string || '',
                };
                App.ApiManager.updateRechargesUsdtOrder(updateData).then((res: any) => {
                    if (res && res.msg === 'Succeed') {
                        App.ApiManager.getUsdtOrder({ type: ds.type }).then((_data: any) => {
                            App.EventUtils.dispatchEvent('UpdateUI', {
                                payID: App.TransactionData.payID,
                                payTypeID: App.TransactionData.payTypeId,
                            });
                            App.AlertManager.showFloatTip('Order Updated');
                            App.PopUpManager.closePopup(this.node);
                        });
                    } else {
                        console.warn('Invalid Data');
                    }
                });
            } else {
                const query = {
                    usdtId: ds.usdtId,
                    amount: ds.amount,
                    usdtType: ds.usdtType,
                    rechargeAddress: this.usdtAddress?.string || '',
                    transferOutAddress: this.transferAddress?.string || '',
                };

                if (!query.rechargeAddress) {
                    return App.AlertManager.showFloatTip('Please enter USDT address');
                }
                if (query.rechargeAddress === query.transferOutAddress) {
                    return App.AlertManager.showFloatTip('USDT address and Transfer address cannot be the same');
                }

                App.ApiManager.rechargeUsdtOrder(query).then((res: any) => {
                    App.ApiManager.getUsdtOrder({ type: res.payID }).then((_data: any) => {
                        App.AlertManager.showFloatTip('USDT Deposit Created');
                        App.EventUtils.dispatchEvent('UpdateUI', {
                            payID: App.TransactionData.payID,
                            payTypeID: App.TransactionData.payTypeId,
                        });
                        App.PopUpManager.closePopup(this.node);
                    });
                });

            }
        } else {
            // BANK / UPI
            const orderNo = ds.orderNumber;
            const tranrefId = this.utr?.string || '';
            if (!tranrefId) return App.AlertManager.showFloatTip('Please enter UTR');
            App.ApiManager.updateRechargesUpiOrder(orderNo, tranrefId).then((_res: any) => {
                App.ApiManager.getBankOrder({ payTypeId: App.TransactionData.payTypeId }).then((_data: any) => {
                    App.EventUtils.dispatchEvent('UpdateUI', {
                        payID: App.TransactionData.payID,
                        payTypeID: App.TransactionData.payTypeId,
                    });
                    App.AlertManager.showFloatTip('Success');
                    App.PopUpManager.closePopup(this.node);
                });
            });
        }
    }
}