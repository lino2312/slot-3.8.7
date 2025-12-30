import { _decorator, Button, Component, EditBox, find, Game, game, instantiate, Label, Layout, Node, Prefab, ScrollView, sys } from 'cc';
import { App } from '../../App';
import { Config } from '../../config/Config';
import { ChannelItem } from './ChannelItem';
import { History } from './History';
import { PaymentItem } from './PaymentItem';
import { PromoCodeItem } from './PromoCodeItem';
const { ccclass, property } = _decorator;

@ccclass('Recharge')
export class Recharge extends Component {
    @property(Label)
    coinLabel: Label = null!;
    @property(EditBox)
    rechargeEditBox: EditBox = null!;
    @property(ScrollView)
    scrollView: ScrollView = null!;
    @property(Prefab)
    amountItem: Prefab = null!;
    @property(Node)
    amountNode: Node = null!;

    @property(Prefab)
    paymentItem: Prefab = null!;
    @property(Node)
    paymentNode: Node = null!;

    @property(Prefab)
    channelItem: Prefab = null!;
    @property(Node)
    channelNode: Node = null!;

    @property(Prefab)
    history: Prefab = null!;
    @property(Node)
    historyNode: Node = null!;

    @property(Node)
    under: Node = null!;
    @property(Node)
    pop: Node = null!;
    @property(Node)
    popK: Node = null!;

    @property(Prefab)
    ydPromoCodeItem: Prefab = null!;

    @property(Label)
    depositNowLabel: Label = null!;
    @property(Node)
    timerNode: Node = null!;
    @property(Label)
    timerLabel: Label = null!;
    @property(Label)
    messageLabel: Label = null!;

    @property(EditBox)
    accountNameEditBox: EditBox = null!;
    @property(EditBox)
    bankAccountNumberEditBox: EditBox = null!;
    @property(Node)
    userInfoBox: Node = null!;
    @property(EditBox)
    rechargeConvertedEditBox: EditBox = null!;
    @property(EditBox)
    rechargeUsdEditBox: EditBox = null!;

    @property(Node)
    node7Copy: Node = null!;
    @property(Node)
    node7001: Node = null!;
    @property(Node)
    node7002: Node = null!;
    @property(Node)
    arPay: Node = null!;
    @property(Button)
    rule: Button = null!;
    @property(Button)
    goNayi: Button = null!;
    @property([Node])
    lblNayi: Node[] = [];
    @property(Node)
    warningNayiNode: Node = null!;
    @property(Label)
    ratioLbl: Label = null!;

    // 运行期数据
    private usdtId: number = 0;
    private usdtType: number = 0;
    private rechargeAddress: string | number = 0;
    private orderNo: string | number = 0;
    private usdtName: string = '';
    private transferOutAddress: string | null = null;
    private uGold: number = 0;
    private payTypeId: number = 0;

    private selectedPayID: number = 0;
    private remainingSeconds: number = 0;
    private havePendingOrder = false;
    private isFirstShow = true;
    private couponsData: any = null;
    private channelNodeList: Node[] = [];

    onLoad() {
        this.warningNayiNode && (this.warningNayiNode.active = false);
        if (this.node7001) this.node7001.active = false;
        if (this.node7002) this.node7002.active = false;
        if (this.node7Copy) this.node7Copy.active = false;

        // const firstIn = App.StorageUtils.saveLocal('first_in_recharge', '0');
        // if (Number(firstIn) !== 1) {
        //     this.scheduleOnce(() => this.expandNode(), 0.2);
        // }
        App.TransactionData.uRate = App.userData().userInfo.uRate;
        if (this.coinLabel) this.coinLabel.string = App.userData().userInfo.amount;

        this.channelNodeList.push(this.channelNode);
    }

    async start() {
        var self = this;
        try {
            const ret = await App.ApiManager.getPayTypeName();
            console.log("GetPayTypeName Result: ", ret);
            let opList = [];
            const enumDeposit = {
                USDT: 19,
                NAYIPAY: 21,
            };
            const localBanklist = [9, 18];
            for (let index = 0; index < ret.typelist.length; index++) {
                let element = ret.typelist[index];
                let op = instantiate(self.paymentItem).getComponent(PaymentItem);
                opList.push(op);
                op.init(element, function () {
                    let channelOp = instantiate(self.channelItem).getComponent(ChannelItem);
                    channelOp.initData(element.payID, element.payTypeID, self.channelItem, self.channelNode, self.amountItem, self.amountNode,
                        function (ret) {
                            console.log("initData - ret", ret);
                            self.selectedPayID = element.payID;
                            if (element.payID === enumDeposit.NAYIPAY) {
                                self.arPay.active = true;
                                self.getARBWalletMemberInfo();
                            } else {
                                self.arPay.active = false;
                            }
                            if (ret.isLocalUsdt) {
                                if (self.node7001) self.node7001.active = false;
                                if (self.node7002) self.node7002.active = true;
                                if (self.node7Copy) self.node7Copy.active = false;
                                self.usdtName = ret.currentPaymentMethod.usdtName ? ret.currentPaymentMethod.usdtName : ''
                                self.usdtId = ret.currentPaymentMethod.usdtID ? ret.currentPaymentMethod.usdtID : ''
                                self.usdtType = ret.currentPaymentMethod.usdtType ? ret.currentPaymentMethod.usdtType : ''
                                self.rechargeAddress = ret.currentPaymentMethod.coding ? ret.currentPaymentMethod.coding : ''
                                //self.usdtType = ret.currentChannel?.payTypeID || ret.currentPaymentMethod?.payTypeID || 0;
                                self.checkOngoingOrder({
                                    payID: element.payID,
                                    payTypeID: ret.currentChannel.payTypeID
                                });
                            } else {
                                if (self.node7001) self.node7001.active = false;
                                if (self.node7002) self.node7002.active = false;
                                if (self.node7Copy) self.node7Copy.active = false;
                                App.TransactionData.currentChannel = ret.currentChannel;
                                App.TransactionData.currentPaymentMethod = ret.currentPaymentMethod;
                                self.checkOngoingOrder({
                                    payID: element.payID,
                                    payTypeID: ret.currentPaymentMethod.payTypeID
                                });
                            }
                            self.timerNode.active = false;
                        },
                        function () {
                            self.timerNode.active = false;
                            self.depositNowLabel.string = "Deposit Now";
                            self.unschedule(self.updateTimer);
                            self.havePendingOrder = false;
                        }
                    );
                    if (element.payID === enumDeposit.USDT) {
                        console.log("Detected: USDT");
                    } else if (localBanklist.includes(element.payID)) {
                        console.log("Detected: Local Bank");
                    } else {
                        console.log("Detected: Other Payment Type");
                    }
                });
                self.paymentNode.addChild(op.node);

            }
            if (opList[0]) opList[0].onSelect();
            this.scheduleOnce(() => {
                this.scrollView.scrollToTop(0.1);
            }, 0.1);
            //this.getClaimedCoupons();
            this.getRechargeRecord();
            App.TransactionData.promoVoucher = true;
            App.TransactionData.promoTye = 1;
            this.isFirstShow = true;

        } catch (e) {
            console.error('Recharge.start init failed:', e);
        }
    }

    private async populateChannels(
        payID: number,
        payTypeId: number,
        channelNode: Node,
        enumDeposit: { NAYIPAY: number; C2C: number; USDT: number; UPI: number; ALL: number },
        localBankList: number[],
    ): Promise<{ firstInfo: any }> {
        const ret = await App.ApiManager.getRechargeTypes(payID, payTypeId);
        console.log("GetRechargeTypes Result: ", ret);
        const ops: ChannelItem[] = [];
        App.TransactionData.payID = payID;
        let firstInfo: any | null = null;

        // Local Bank
        if (localBankList.includes(payID)) {
            const element = ret?.rechargetypelist?.[0];
            console.log("Local Bank Element: ", element);
            const banklist = ret?.banklist || [];
            if (element && banklist.length > 0) {
                for (let i = 0; i < banklist.length; i++) {
                    App.TransactionData.rechargePrice = `${element.miniPrice} - ${element.maxPrice}`;
                    const bankDetails = banklist[i];
                    const opNode = instantiate(this.channelItem);
                    const op = opNode.getComponent(ChannelItem);
                    op.init(element, bankDetails.bankName, this.amountItem, this.amountNode, (selectedMoney: string) => {
                        if (this.rechargeEditBox) this.rechargeEditBox.string = selectedMoney;
                        const amt = Number(selectedMoney);
                        const rate = Number(App.TransactionData.uRate) || 1;
                        if (this.rechargeUsdEditBox && this.rechargeConvertedEditBox) {
                            this.rechargeUsdEditBox.string = `$ ${amt}`;
                            this.rechargeConvertedEditBox.string = `${App.TransactionData.homeSettings.dollarSign || '$'} ${amt * rate}`;
                        }
                    });
                    ops.push(op);
                    channelNode.addChild(opNode);

                    if (!firstInfo) {
                        firstInfo = {
                            currentPaymentMethod: element,
                            currentChannel: bankDetails,
                            isLocalUsdt: false,
                            isBank: true,
                            accountName: bankDetails.accountName,
                            bankAccountNumber: bankDetails.bankAccountNumber,
                            transferType: bankDetails.transferType,
                            bankName: bankDetails.bankName,
                            payTypeID: element.payTypeID,
                        };
                    }
                }
            }
        }
        // USDT
        else if (payID === enumDeposit.USDT) {
            const rtl = ret?.rechargetypelist || [];
            const lusdt = ret?.localUsdtlist || [];
            for (let i = 0; i < rtl.length; i++) {
                const element = rtl[i];
                const localUsdtInfo = lusdt[i];
                if (!element || !localUsdtInfo) continue;

                const opNode = instantiate(this.channelItem);
                const op = opNode.getComponent(ChannelItem);
                op.init(element, localUsdtInfo.usdtName ?? '', this.amountItem, this.amountNode, (selectedMoney: string) => {
                    if (this.rechargeEditBox) this.rechargeEditBox.string = selectedMoney;
                    const amt = Number(selectedMoney);
                    const rate = Number(App.TransactionData.uRate) || 1;
                    if (this.rechargeUsdEditBox && this.rechargeConvertedEditBox) {
                        this.rechargeUsdEditBox.string = `$ ${amt}`;
                        this.rechargeConvertedEditBox.string = `${App.TransactionData.homeSettings.dollarSign || '$'} ${amt * rate}`;
                    }
                });
                ops.push(op);
                channelNode.addChild(opNode);

                if (!firstInfo) {
                    firstInfo = {
                        currentPaymentMethod: localUsdtInfo,
                        currentChannel: element,
                        isLocalUsdt: true,
                        isBank: false,
                        usdtID: localUsdtInfo.usdtID,
                        usdtName: localUsdtInfo.usdtName,
                        usdtType: localUsdtInfo.usdtType,
                        rechargeAddress: localUsdtInfo.coding,
                        payID: element.payID,
                        payTypeID: element.payTypeID,
                    };
                }
            }
        }
        // Others
        else {
            const rtl = ret?.rechargetypelist || [];
            for (let i = 0; i < rtl.length; i++) {
                const element = rtl[i];
                if (!element) continue;

                const opNode = instantiate(this.channelItem);
                const op = opNode.getComponent(ChannelItem);
                op.init(element, element.payName, this.amountItem, this.amountNode, (selectedMoney: string) => {
                    if (this.rechargeEditBox) this.rechargeEditBox.string = selectedMoney;
                    const amt = Number(selectedMoney);
                    const rate = Number(App.TransactionData.uRate) || 1;
                    if (this.rechargeUsdEditBox && this.rechargeConvertedEditBox) {
                        this.rechargeUsdEditBox.string = `$ ${amt}`;
                        this.rechargeConvertedEditBox.string = `${App.TransactionData.homeSettings.dollarSign || '$'} ${amt * rate}`;
                    }
                });
                ops.push(op);
                channelNode.addChild(opNode);

                if (!firstInfo) {
                    firstInfo = {
                        currentPaymentMethod: element,
                        currentChannel: element,
                        isLocalUsdt: false,
                        isBank: false,
                        payID: element.payID,
                        payTypeID: element.payTypeID,
                    };
                }
            }
        }

        ops[0]?.onSelect?.();

        return { firstInfo };
    }

    onEnable() {
        App.EventUtils.on('refreshCouponCode', this.refreshCouponCode, this);
        App.EventUtils.on('UpdateUI', this.checkOngoingOrder, this);
        App.EventUtils.on('getARBWalletMemberInfo', this.getARBWalletMemberInfo, this);
        game.on(Game.EVENT_SHOW, this.getARBWalletMemberInfo, this);
    }

    onDisable() {
        App.EventUtils.offTarget(this);
        game.off(Game.EVENT_SHOW, this.getARBWalletMemberInfo, this);
    }


    getClaimedCoupons() {
        App.ApiManager.getClaimedCoupons().then((data: any) => {
            this.couponsData = data;
            const addNode = find('ui/New ScrollView/view/content/node7.1/amountbar/New ScrollView/view/content', this.node);
            const amountbar = find('ui/New ScrollView/view/content/node7.1/amountbar', this.node);
            const voucher = find('ui/New ScrollView/view/content/node7.1/voucher', this.node);
            if (!addNode || !amountbar || !voucher) {
                console.error('Required nodes not found for coupons UI');
                return;
            }
            addNode.removeAllChildren();
            let hasCoupon = false;
            if (Array.isArray(this.couponsData)) {
                for (let i = 0; i < this.couponsData.length; i++) {
                    const item = this.couponsData[i];
                    console.log("COUPONS: =============================", item);
                    if (item.type === 'Deposit' && item.isUsed === false) {
                        const op = instantiate(this.ydPromoCodeItem);
                        // const voucherNode = op.getChildByName('voucher');
                        // const comp = voucherNode?.getComponent(PromoCodeItem);
                        const comp = op?.getComponent(PromoCodeItem);
                        comp.init(item);
                        addNode.addChild(op);
                        hasCoupon = true;
                    }
                }
            }
            amountbar.active = hasCoupon;
            voucher.active = !hasCoupon;
            addNode.getComponent(Layout)?.updateLayout();
        });
    }

    getARBWalletMemberInfo = async () => {
        try {
            const ret: any = await App.ApiManager.getARBWalletMemberInfo();
            if (!ret) return;
            console.log('getARBWalletMemberInfo', ret);
            App.TransactionData.arbWallet = ret;
            const lbl0 = this.lblNayi[0];
            const lbl1 = this.lblNayi[1];
            if (ret.walletActivationStatus === 1) {
                if (lbl0) lbl0.active = true;
                if (lbl1) lbl1.active = false;
                const amountNode = lbl0 ? find('amount', lbl0) : null;
                if (amountNode) {
                    const labelComp = amountNode.getComponent(Label);
                    if (labelComp) labelComp.string = `${ret.balance || 0} Nayi`;
                }
                if (this.ratioLbl) {
                    this.ratioLbl.string = `Receive an additional ${ret.withdrawalRewardRatio || 0}% bonus when recharging with Nayi`;
                }
            } else {
                if (lbl0) lbl0.active = true;
                if (lbl1) lbl1.active = false;
            }
        } catch (err) {
            console.error("Failed to get ARB Wallet Member Info:", err);
            App.AlertManager?.showFloatTip("Unable to fetch wallet info. Please try again later.");
            // Optionally, disable wallet buttons or fallback to another flow
        }
    };

    checkOngoingOrder = (query?: { payID?: number; payTypeID?: number }) => {
        const enumDeposit = { USDT: 19 };
        const localBankList = [9, 18, enumDeposit.USDT];
        const isLocalBank = (payID?: number) => localBankList.includes(payID as number);

        if (isLocalBank(query?.payID) && query?.payID === enumDeposit.USDT) {
            App.ApiManager.getUsdtOrder({ type: query?.payTypeID }).then((data: any) => {
                if (data) {
                    if (data.addTime1 && data.serverTime) {
                        this.startCountdown(data.addTime1, data.serverTime, '/');
                    }
                    this.transferOutAddress = data.transferOutAddress;
                    this.rechargeAddress = data.rechargeAddress;
                    this.usdtType = data.usdtType;
                    this.usdtName = data.bankName;
                    this.orderNo = data.orderNumber;
                    if (this.rechargeEditBox) this.rechargeEditBox.string = String(data.uGold ?? '');
                    if (this.messageLabel) this.messageLabel.string = 'You have 1 unpaid order';
                    if (this.depositNowLabel) this.depositNowLabel.string = 'Update';
                }
            });
        } else if (isLocalBank(query?.payID)) {
            App.ApiManager.getBankOrder({ payTypeId: query?.payTypeID }).then((data: any) => {
                if (data && data?.addTime1 && data?.serverTime) {
                    this.startCountdown(data.addTime1, data.serverTime, '-');
                    if (this.messageLabel) this.messageLabel.string = 'You have 1 unpaid order';
                    if (this.depositNowLabel) this.depositNowLabel.string = 'Go pay';
                }
            });
        }
    };

    usdtRecharge() {
        const input = this.rechargeEditBox?.string?.trim() || '';

        if (!input) return App.AlertManager.showFloatTip('Please enter the amount');
        const amount = Number(input);
        if (isNaN(amount) || amount <= 0) return App.AlertManager.showFloatTip('Please enter a valid amount');

        const query = {
            usdtId: this.usdtId,
            amount,
            usdtType: this.usdtType,
            usdtName: (this as any).usdtName,
            rechargeAddress: this.rechargeAddress,
            transferOutAddress: this.transferOutAddress,
            orderNo: this.orderNo,
            PendingOrder: this.havePendingOrder,
            type: this.payTypeId,
        };

        if (this.havePendingOrder) {
            App.PopUpManager?.addPopup('prefabs/popup/popupUsdt', "hall", query, false);
        } else {
            const usdtinfo = {
                usdtId: this.usdtId,
                amount,
                usdtType: this.usdtType,
                usdtName: (this as any).usdtName,
                rechargeAddress: this.rechargeAddress,
                transferOutAddress: this.transferOutAddress,
            };
            App.PopUpManager?.addPopup('prefabs/popup/popupUsdt', "hall", usdtinfo, false);
        }
    }

    localBankRecharge() {
        const accountName = this.accountNameEditBox?.string?.trim();
        const bankAccountNumber = this.bankAccountNumberEditBox?.string?.trim();

        if (App.status.isOpenOfficialRechargeInputDialog) {
            if (!accountName) return App.AlertManager.showFloatTip('Please enter Account Name');
            if (!bankAccountNumber) return App.AlertManager.showFloatTip('Please enter Bank Account Number');
        }

        const input = this.rechargeEditBox?.string?.trim() || '';
        if (!input) return App.AlertManager.showFloatTip('Please enter the amount');
        const amountVal = Number(input);
        if (isNaN(amountVal) || amountVal <= 0) return App.AlertManager.showFloatTip('Please enter a valid amount');

        const amount = amountVal;
        const payTypeId = Number(App.TransactionData.payTypeId);
        const transferType = Number(App.TransactionData.currentChannel?.transferType);

        App.ApiManager.newSetRechargesBankOrder(amount, payTypeId, transferType, accountName, bankAccountNumber).then((res: any) => {
            if (res) {
                App.PopUpManager?.addPopup('prefabs/popup/popupUsdt', "hall", res, false);
                this.userInfoBox && (this.userInfoBox.active = false);
            }
        });
    }

    parseCustomDate(timeString: string, typeSplit = '/') {
        const [datePart, timePart] = timeString.split(' ');
        const [year, month, day] = datePart.split(typeSplit);
        const [hours, minutes, seconds] = timePart.split(':');
        const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
        return new Date(isoString);
    }

    getTimeRemainingInSeconds(startTime: Date, endTime: Date) {
        const diffMs = Math.abs(endTime.getTime() - startTime.getTime());
        return Math.floor(diffMs / 1000);
    }

    startCountdown(addTime1: string, serverTime: string, typeSplit = '/') {
        const addTimeDate = this.parseCustomDate(addTime1, typeSplit);
        const serverTimeDate = this.parseCustomDate(serverTime, typeSplit);
        this.remainingSeconds = this.getTimeRemainingInSeconds(serverTimeDate, addTimeDate);
        this.unschedule(this.updateTimer);
        this.schedule(this.updateTimer, 1);
    }

    updateTimer() {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            const hours = Math.floor(this.remainingSeconds / 3600);
            const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
            const seconds = this.remainingSeconds % 60;
            const pad = (num: number) => num.toString().padStart(2, '0');
            if (this.timerLabel) this.timerLabel.string = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            this.timerNode && (this.timerNode.active = true);
            this.havePendingOrder = true;
        } else {
            if (this.timerLabel) this.timerLabel.string = '00:00:00';
            this.unschedule(this.updateTimer);
            this.havePendingOrder = false;
            if (this.depositNowLabel) this.depositNowLabel.string = 'Deposit Now';
            this.timerNode && (this.timerNode.active = false);
        }
    };

    updateTimerDisplay() {
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;
        if (this.timerLabel) {
            this.timerLabel.string = `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // expandNode() {
    //     if (!this.pop || !this.popK) return;
    //     this.pop.active = true;
    //     this.popK.active = true;
    //     this.pop.setScale(0, 0, 0);
    //     tween(this.pop)
    //         .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'smooth' })
    //         .start();
    // }

    cancelBtn() {
        if (this.userInfoBox) this.userInfoBox.active = false;
        if (this.accountNameEditBox) this.accountNameEditBox.string = '';
        if (this.bankAccountNumberEditBox) this.bankAccountNumberEditBox.string = '';
    }

    recharge() {
        const enumDeposit = { NAYIPAY: 21, C2C: 20, USDT: 19, UPI: 12, ALL: -1 };
        const localBanklist = [9, 18];

        if (this.selectedPayID === enumDeposit.NAYIPAY) return this.arPayRecharge();
        if (this.selectedPayID === enumDeposit.USDT) return this.usdtRecharge();
        if (localBanklist.includes(this.selectedPayID)) {
            if (App.status.isOpenOfficialRechargeInputDialog) {
                this.userInfoBox && (this.userInfoBox.active = true);
            } else {
                this.localBankRecharge();
            }
            return;
        }

        const priceArray = String(App.TransactionData.rechargePrice || '').split(' - ');
        const min = parseInt(priceArray[0] || '0');
        const max = parseInt(priceArray[1] || '0');

        const input = this.rechargeEditBox?.string?.trim() || '';
        if (input === '') return App.AlertManager.showFloatTip('Please enter the amount');

        const inputNum = parseInt(input);
        if (inputNum < min || inputNum > max) {
            return App.AlertManager.showFloatTip(
                `Please enter an amount within the recharge amount range:   ${min} - ${max}`
            );
        }

        let url = '';
        if (App.TransactionData.couponCode) {//选择优惠卷
            url =
                App.TransactionData.paySendUrl +
                '?tyid=' +
                App.TransactionData.payTypeId +
                '&amount=' +
                input +
                '&uid=' +
                App.userData().userInfo.userId +
                '&sign=' +
                App.userData().userInfo.sign +
                '&urlInfo=' +
                'https://play.' +
                Config.domainurl +
                `&pixelId=&fbcId=&couponCode=` +
                App.TransactionData.couponCode;
        } else {
            url =
                App.TransactionData.paySendUrl +
                '?tyid=' +
                App.TransactionData.payTypeId +
                '&amount=' +
                input +
                '&uid=' +
                App.userData().userInfo.userId +
                '&sign=' +
                App.userData().userInfo.sign +
                '&urlInfo=' +
                'https://play.' +
                Config.domainurl +
                `&pixelId=&fbcId=`;
        }
        sys.openURL(url);
    }

    onClickBack() {
        App.TransactionData.paySendUrl = '';
        App.TransactionData.promoVoucher = false;
        App.TransactionData.couponCode = null;
        App.PopUpManager.closeTopPopup();
    }

    getRechargeRecord() {
        App.ApiManager.getRechargeRecord(-1, 1, 3).then((data: any) => {
            if (!data?.list || !Array.isArray(data.list)) return;
            for (let i = 0; i < data.list.length; i++) {
                const element = data.list[i];
                const itemNode = instantiate(this.history);
                const comp = itemNode.getComponent(History);
                comp.init(element);
                this.historyNode?.addChild(itemNode);
            }
        });
    }

    goRechargeRecord() {
        App.PopUpManager.addPopup('prefabs/popup/popupTransactionsRecord', 'hall', null, false);
    }

    enter() {
        const array = this.amountNode;
        if (!array) return;
        for (let i = 0; i < array.children.length; i++) {
            const element = array.children[i];
            const labelNode = find('amount', element);
            if (labelNode) labelNode.active = false;
        }
    }

    goCollect() {
        if (this.under) this.under.active = true;
        if (this.isFirstShow) {
            this.isFirstShow = false;
        }
        App.TransactionData.promoTye = 2;
    }

    closeCollect() {
        if (this.under) this.under.active = false;
    }

    goPromo() {
        if (this.under) this.under.active = false;
        App.PopUpManager?.addPopup('prefabs/popup/popupPromoCode', "hall", null, true);
    }

    // popClose() {
    //     sys.localStorage.setItem('first_in_recharge', '1');
    //     if (!this.pop || !this.popK) return;
    //     this.pop.active = true;
    //     this.pop.setScale(1, 1, 1);
    //     tween(this.pop)
    //         .to(0.1, { scale: new Vec3(0, 0, 0) }, { easing: 'smooth' })
    //         .call(() => {
    //             this.pop.active = false;
    //             this.popK.active = false;
    //         })
    //         .start();
    // }

    // popSure() {
    //     if (!this.pop || !this.popK) return;
    //     this.pop.active = true;
    //     this.pop.setScale(1, 1, 1);
    //     tween(this.pop)
    //         .to(0.1, { scale: new Vec3(0, 0, 0) }, { easing: 'smooth' })
    //         .call(() => {
    //             this.pop.active = false;
    //             this.popK.active = false;
    //         })
    //         .start();
    // }

    customer() {
        const LIVE_CHAT = 3;
        const openFromList = (data: any[]) => {
            const liveChat = data?.find?.((el: any) => el.typeID == LIVE_CHAT);
            if (liveChat) App.PlatformApiMgr.openURL(liveChat.url);
        };
        App.ApiManager.getCustomerServiceList().then((ret: any) => {
            openFromList(ret);
        });
    }

    email() {
        App.PlatformApiMgr.openURL('https://workspace.google.com/');
    }

    refreshCouponCode = () => {
        const addNode = find('ui/New ScrollView/view/content/node7.1/amountbar/New ScrollView/view/content', this.node);
        if (!addNode) return;
        addNode.removeAllChildren();
        const element = App.TransactionData.claimedCoupons;
        const op = instantiate(this.ydPromoCodeItem);
        // op.getChildByName('voucher')?.getComponent(PromoCodeItem).init(element);
        op.getComponent(PromoCodeItem).init(element);
        addNode.addChild(op);
        this.closeCollect();
    };

    getReturnUrl() {
        if (!App.DeviceUtils.isNative?.()) {
            return window.location.hostname;
        }
        return Config.domainurl;
    }

    onTradRule() {
        const returnUrl = this.getReturnUrl();
        const language = 'en';
        const url = `https://wallet.nayipay.com/#/TradRules?lang=${language}&returnUrl=${returnUrl}`;
        App.SystemUtils.openThirdGame(url, returnUrl);
    }

    async goActive() {
        try {
            const returnUrl = 'https://' + this.getReturnUrl();
            const query = { returnUrl };
            const res: any = await App.ApiManager.arbWalletActivate(query);
            if (!res) {
                App.AlertManager?.showFloatTip("Failed to activate wallet");
                return;
            }
            const url =
                `${res.walletActivationPageUrl ?? ''}` +
                `&memberId=${res.memberId ?? ''}` +
                `&merchantCode=${res.merchantCode ?? ''}` +
                `&timestamp=${res.timestamp ?? ''}`;
            if (url) {
                App.SystemUtils.openThirdGame(url, returnUrl);
            } else {
                App.AlertManager?.showFloatTip("Invalid wallet activation URL");
            }
        } catch (err) {
            console.error("goActive failed:", err);
            App.AlertManager?.showFloatTip("Failed to activate wallet");
        }
    }

    async goWallet() {
        this.warningNayiNode && (this.warningNayiNode.active = false);
        const returnUrl = 'https://' + this.getReturnUrl();
        const query = { returnUrl };
        App.ApiManager.arbWalletEnter(query).then((res: any) => {
            const url = res?.walletAccessUrl;
            if (url) App.SystemUtils.openThirdGame(url, returnUrl);
        });
    }

    async handleWallet() {
        try {
            if (App.TransactionData.arbWallet?.walletActivationStatus === 1) {
                this.goWallet();
            } else {
                await this.goActive();
            }
        } catch (err) {
            console.error("handleWallet failed:", err);
            App.AlertManager?.showFloatTip("Failed to process wallet");
        }
    }

    arPayRecharge() {
        const returnUrl = 'https://' + this.getReturnUrl();
        if (App.TransactionData.arbWallet && App.TransactionData.arbWallet?.walletActivationStatus === 0) {
            App.AlertManager.showFloatTip('Wallet is not activated');
            this.goActive();
            return;
        }
        const inputValue = this.rechargeEditBox?.string?.trim() || '0';
        if ((App.TransactionData.arbWallet?.balance ?? 0) >= Number(inputValue)) {
            const str = '&returnUrl=' + returnUrl;
            const url =
                App.TransactionData.paySendUrl +
                '?tyid=' +
                App.TransactionData.payTypeId +
                '&amount=' +
                inputValue +
                '&uid=' +
                App.userData().userInfo.userId +
                '&sign=' +
                App.userData().userInfo.sign +
                str;
            App.SystemUtils.openThirdGame(url, returnUrl);
        } else {
            this.warningNayiNode && (this.warningNayiNode.active = true);
        }
    }

    hideWarningNayiNode() {
        this.warningNayiNode && (this.warningNayiNode.active = false);
    }
}


