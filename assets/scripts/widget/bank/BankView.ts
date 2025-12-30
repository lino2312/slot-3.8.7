import { _decorator, Component, find, Label, Node, ScrollView } from 'cc';
import { App } from '../../App';
import { PopUpAnimType } from '../../component/PopupComponent';
const { ccclass, property } = _decorator;


@ccclass('BankView')
export class BankView extends Component {
    @property(Node) walletNode: Node = null!;
    @property(Label) totalBalanceLabel: Label = null!;
    @property(Label) cashLabel: Label = null!;
    @property(Label) withdrawableBalanceLabel: Label = null!;
    @property(Label) bonusLabel: Label = null!;

    private bindedWithdrawalCount = false;

    onLoad() {
        console.log('BankView onLoad');
        this.initWalletNode();

        const scroll = find('ScrollView', this.node).getComponent(ScrollView);
        scroll?.scrollToTop(0.1);
        this.bindedWithdrawalCount = false;

    }

    onEnable() {
        App.EventUtils.on(App.EventID.UPATE_COINS, this.updateCoin, this);
        App.EventUtils.on("RefreshtotalBalanceLabel", this.refreshData, this);
        App.EventUtils.on("updateBindedBankList", this.updateBindedBankList, this);
        this.setupWallleInfo();
    }

    async setupWallleInfo() {
        if (App.userData().isLogin) {
            const [ptBonusWalletSettings, pHomeSettings, pWithdrawalTypes] = await Promise.all([
                App.ApiManager.getBonusWalletSettings(),
                App.ApiManager.getHomeSettings(),
                App.ApiManager.getWithdrawalTypes()
            ]);
            App.TransactionData.bonusWalletSettings = ptBonusWalletSettings;
            const combined = (ptBonusWalletSettings.lockedBonusBalance || 0) + (ptBonusWalletSettings.unlockedBonusBalance || 0);
            const val = combined > 0 ? combined : '0.00';
            if (this.bonusLabel) this.bonusLabel.string = val;


            App.TransactionData.homeSettings = pHomeSettings;
            App.TransactionData.withdrawModel = pHomeSettings.withdrawModel;
            App.TransactionData.withdrawalTypes = pWithdrawalTypes;
            this.updateBindedBankList();
            if (App.TransactionData.withdrawModel == '2') {
                const pWallet = await App.ApiManager.getWallet();
                App.TransactionData.balance = pWallet.balance;
                App.TransactionData.cash = pWallet.cash;
                App.TransactionData.money = pWallet.money;
                App.TransactionData.uRate = pWallet.uRate;
                this.updateWalletView();
                const tipsNode = find('layout/tips', this.walletNode);
                if (tipsNode) tipsNode.active = true;
            }
        }
    }

    onDisable(): void {
        App.EventUtils.off(App.EventID.UPATE_COINS, this.updateCoin, this);
        App.EventUtils.off("RefreshtotalBalanceLabel", this.refreshData, this);
        App.EventUtils.off("updateBindedBankList", this.updateBindedBankList, this);
    }

    // 更新已绑定的提现账户
    updateBindedBankList(id = -1, callback?: () => void) {
        if (id === -1) {
            const withdrawalTypes = App.TransactionData.withdrawalTypes;
            if (withdrawalTypes?.withdrawlist?.length > 0) {
                withdrawalTypes.withdrawlist.forEach((it: any) => {
                    const withdrawID = it.withdrawID;
                    App.ApiManager.getWithdrawals(withdrawID).then((data: any) => {
                        const hasList = Array.isArray(data?.withdrawalslist) && data.withdrawalslist.length > 0;
                        if (hasList) {
                            this.bindedWithdrawalCount = true;
                            App.TransactionData.withdrawals[withdrawID] = data;
                            App.TransactionData.lastBandCarkName = data.lastBandCarkName;
                            if (withdrawID == 21) {
                                App.ApiManager.getARBWalletMemberInfo().then((ret: any) => {
                                    App.TransactionData.arbWallet = ret;
                                });
                            }
                        }

                        if (App.TransactionData.withdrawModel == '1') {
                            const rule = data?.withdrawalsrule;
                            if (rule) {
                                App.TransactionData.canWithdrawAmount = rule.canWithdrawAmount;
                                App.TransactionData.amount = rule.amount;
                                App.TransactionData.AmountOfCode = rule.amountofCode;
                            } else {
                                App.TransactionData.canWithdrawAmount = App.TransactionData.canWithdrawAmount ?? 0;
                                App.TransactionData.amount = App.TransactionData.amount ?? 0;
                                App.TransactionData.AmountOfCode = App.TransactionData.AmountOfCode ?? 0;
                            }
                            this.updateWalletView();
                        }
                    }).catch(() => {
                        if (App.TransactionData.withdrawModel == '1') this.updateWalletView();
                    });
                });
            }
        } else {
            App.ApiManager.getWithdrawals(id).then((data: any) => {
                const hasList = Array.isArray(data?.withdrawalslist) && data.withdrawalslist.length > 0;
                if (hasList) {
                    this.bindedWithdrawalCount = true;
                    App.TransactionData.withdrawals[id] = data;
                    if (App.TransactionData.withdrawModel == '1' && data?.withdrawalsrule) {
                        const rule = data.withdrawalsrule;
                        App.TransactionData.canWithdrawAmount = rule.canWithdrawAmount;
                        App.TransactionData.amount = rule.amount;
                        App.TransactionData.AmountOfCode = rule.amountofCode;
                        this.updateWalletView();
                    }
                    callback && callback();
                }
            }).catch(() => {
                // ignore
            });
        }
    }

    refreshData() {
        this.setupWallleInfo();
    };

    private initWalletNode() {
        // 充值
        const btnAdd = find('btn_add', this.walletNode);
        console.log("App.userData().userInfo.firstRecharge:", App.userData().userInfo.firstRecharge);
        btnAdd?.on(Node.EventType.TOUCH_END, () => {
            if (App.userData().userInfo.firstRecharge && App.userData().userInfo.firstRecharge > 0) {
                App.PopUpManager?.addPopup('prefabs/popup/popupRecharge', "hall", null, false);
            } else {
                App.PopUpManager?.addPopup('prefabs/popup/popupFirstRecharge', "hall", null, true);
            }
            return;
        });

        // 提取
        // https://ycapi.fastpay10.com/api/webapi/GetUserInfo
        const btnWithdraw = find('layout/item_winnings/btn_withdraw', this.walletNode);
        const ret = App.ApiManager.getUserInfo();
        console.log("User Info:", ret);
        btnWithdraw?.on(Node.EventType.TOUCH_END, () => {
            if (App.userData().isGuest) {
                App.PopUpManager.addPopup('prefabs/popup/popupBindCardVerify', "hall", null, false);
                App.TransactionData.WithdrawRequirefirst = true;
            } else {
                if (this.bindedWithdrawalCount) {
                    App.PopUpManager?.addPopup('prefabs/popup/popupWithdraw', "hall", null, false);
                    App.TransactionData.WithdrawRequirefirst = false;
                } else {
                    App.PopUpManager?.addPopup('prefabs/popup/popupBindCardYono', "hall", null, false);
                    App.TransactionData.WithdrawRequirefirst = true;
                }
            }
            return;
        });

        // 金额提示
        const btnAmountHint = find('layout/item_amount/btn_hint', this.walletNode);
        btnAmountHint?.on(Node.EventType.TOUCH_END, () => {
            App.AlertManager.showFloatTip("Money that you can use to play games but can't withdraw.");
        });

        // 中奖提示
        const btnWinningsHint = find('layout/item_winnings/btn_hint', this.walletNode);
        btnWinningsHint?.on(Node.EventType.TOUCH_END, () => {
            App.AlertManager.showFloatTip("Money that you can withdraw or re-use to play games.");
        });

        // 现金券提示
        const btnCashBonusHint = find('layout/item_cashbouns/btn_hint', this.walletNode);
        btnCashBonusHint?.on(Node.EventType.TOUCH_END, () => {
            App.AlertManager.showFloatTip("Money that you can transfer to cash balance.");
        });

        // 第三方钱包提示
        const btnWalletHint = find('layout/third/btn_hint', this.walletNode);
        btnWalletHint?.on(Node.EventType.TOUCH_END, () => {
            App.AlertManager.showFloatTip("Money that you can transfer to main wallet.");
        });
        //

        // 现金券转账
        const btnCashBonusTrans = find('layout/item_cashbouns/btn_transfer', this.walletNode);
        btnCashBonusTrans?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/popup/popupBonusWallet', "hall", null, true);
        });

        // 交易记录
        const btnCardWeek = find('layout/200card', this.walletNode);
        btnCardWeek?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/popup/popupCardWeek', "hall", null, true);
        });

        // item_3rd.  prefabs/Bonus/bonusStrongbox.prefab
        const btnItem3rd = find('layout/item_3rd', this.walletNode);
        btnItem3rd?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/Bonus/bonusStrongbox', "hall", null, false, null, PopUpAnimType.normal, PopUpAnimType.normal);
        });


        // 交易记录
        const btnTranscation = find('layout/item_mytransfer', this.walletNode);
        btnTranscation?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/popup/popupTransactionsRecord', "hall", null, false, null, PopUpAnimType.normal);
            //YD_Pro/recharge/ui_all_record
        });

        // 账户管理
        const btnManager = find('layout/item_manager', this.walletNode);
        btnManager?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/popup/popupBindCardYono', "hall", null, false, null, PopUpAnimType.normal);
            //YD_Pro/bank/ui_bindCard_yono
        });

        // 客服
        const btnSupport = find('layout/item_support', this.walletNode);
        btnSupport?.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager?.addPopup('prefabs/popup/popupContactUs', "hall", null, true);
            // let url = "YD_Pro/prefab/yd_service"
        });
    }

    updateWalletView() {
        if (App.TransactionData.withdrawModel == '1') {
            this.totalBalanceLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.amount ?? '0.00'}`;
            this.cashLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.amount ?? '0.00'}`;
            if (App.TransactionData.canWithdrawAmount != null) {
                this.withdrawableBalanceLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.canWithdrawAmount}`;
            }
        } else if (App.TransactionData.withdrawModel == '2') {
            this.totalBalanceLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.balance ?? '0.00'}`;
            this.cashLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.cash ?? '0.00'}`;
            if (App.TransactionData?.money != null) {
                this.withdrawableBalanceLabel.string = `${App.TransactionData.currency || ''}${App.TransactionData.money}`;
            }
        }
    }

    updateCoin = () => {
        this.updateWalletView();
    };
}