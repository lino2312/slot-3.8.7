import { _decorator, Component, Node, Label, EditBox, Button, Prefab, instantiate, ScrollView } from 'cc';
import { App } from '../../App';
import { BankInfo } from './BankInfo';
import { WithdrawHistoryCol } from './WithdrawHistoryCol';
const { ccclass, property } = _decorator;

@ccclass('Withdraw')
export class Withdraw extends Component {
    @property(Label) coin: Label = null!;
    @property(EditBox) editboxWithdraw: EditBox = null!;

    @property(Prefab) amountItem: Prefab = null!;
    @property(Node) amountNode: Node = null!;

    @property(Prefab) paymentItem: Prefab = null!;
    @property(Node) paymentNode: Node = null!;

    @property(Prefab) channelItem: Prefab = null!;
    @property(Node) channelNode: Node = null!;

    @property(Prefab) history: Prefab = null!;
    @property(Node) historyNode: Node = null!;

    // 提现类型相关
    @property(Label) withdrawableBalanceLabel: Label = null!;
    @property(Label) withdrawalAmountReceived: Label = null!;
    @property(Label) amountOfCode: Label = null!;
    @property(Label) time: Label = null!;
    @property(Label) withdrawRemainingCount: Label = null!;
    @property(Label) range: Label = null!;
    @property({ tooltip: 'Withdraw rate' }) uRate = 1;

    // 银行卡相关
    @property([Node]) add: Node[] = [];
    @property(Label) bankName: Label = null!;
    @property(Label) accountNo: Label = null!;

    @property(Button) buttonComponent: Button = null!;

    @property({ tooltip: 'Bank id' }) bid = 0;
    @property({ tooltip: 'Withdraw type' }) withType = 0;

    @property(Prefab) bankInfoPre: Prefab = null!;

    @property(Node) labelNode: Node = null!;

    @property(ScrollView)
    scrollView: ScrollView = null!;

    onLoad() {
        App.EventUtils.on('setBankInfo', this.setBankInfo, this);
        App.EventUtils.on('updateWithdrawBankListUI', this.updateWithdrawBankListUI, this);
        // App.EventUtils.on('RefreshBalance', this.display, this);
        App.EventUtils.on('RefreshBalance', this.display, this);
        this.editboxWithdraw.node.on(EditBox.EventType.TEXT_CHANGED, this.onEditBoxChanged, this);
        // App.TransactionData.canWithdrawAmount
        // console.log('canWithdrawAmount=', App.TransactionData.canWithdrawAmount);
        // if (App.TransactionData.canWithdrawAmount === 0 && this.buttonComponent) {
        //     this.buttonComponent.interactable = false;
        // }
        this.display();
    }

    onDestroy() {
        // App.EventUtils.offTarget(this);
        App.EventUtils.off('setBankInfo', this.setBankInfo, this);
        App.EventUtils.off('updateWithdrawBankListUI', this.updateWithdrawBankListUI, this);
        App.EventUtils.off('RefreshBalance', this.display, this);
        // this.editboxWithdraw.node.off(EditBox.EventType.TEXT_CHANGED, this.onEditBoxChanged, this);
        if (this.editboxWithdraw && this.editboxWithdraw.node && this.onEditBoxChanged) {
            this.editboxWithdraw.node.off(EditBox.EventType.TEXT_CHANGED, this.onEditBoxChanged, this);
        }
    }

    private updateWithdrawBankListUI() {
        const ret = App.TransactionData.withdrawalTypes;
        const withdrawalsData = App.TransactionData.withdrawals;
        let firstType = true;
        if (ret && ret.withdrawlist && ret.withdrawlist.length > 0) {
            this.channelNode.removeAllChildren();
            for (let i = 0; i < ret.withdrawlist.length; i++) {
                const element = ret.withdrawlist[i];
                const data = withdrawalsData[element.withdrawID];

                const card = () => {
                    if (data && data.withdrawalslist && data.withdrawalslist.length > 0) {
                        const node = instantiate(this.bankInfoPre);
                        const op: BankInfo = node.getComponent(BankInfo);
                        op.init(data || { withdrawalslist: [] }, element.withdrawID, firstType, element.name, element.withBeforeImgUrl);
                        firstType = false;
                        this.channelNode.addChild(node);
                        App.TransactionData.withdrawID = element.withdrawID; // 1 银行卡 3 usdt
                        App.TransactionData.bindedWithdrawalCount = !!(data && data.withdrawalslist && data.withdrawalslist.length > 0);
                    }
                };

                if (element.withdrawID !== 1) {
                    setTimeout(card, 0.1);
                } else {
                    card();
                }
            }
        }
    }

    start() {
        this.updateWithdrawBankListUI();
        this.scrollView.scrollToTop();
    }

    private display() {
        const model = App.TransactionData.homeSettings.withdrawModel;
        if (model === '1') {
            if (this.coin) this.coin.string = String(App.TransactionData.canWithdrawAmount ?? '');
            if (this.withdrawableBalanceLabel) this.withdrawableBalanceLabel.string = String(App.TransactionData.canWithdrawAmount ?? '');
            console.log('canWithdrawAmount=', App.TransactionData.canWithdrawAmount);
            if (App.TransactionData.canWithdrawAmount === 0 && this.buttonComponent) {
                this.buttonComponent.interactable = false;
            } else {
                this.buttonComponent.interactable = true;
            }
        } else if (model === '2') {
            if (this.coin) this.coin.string = String(App.TransactionData.money ?? '');
            if (this.withdrawableBalanceLabel) this.withdrawableBalanceLabel.string = String(App.TransactionData.money ?? '');
            console.log('money=', App.TransactionData.money);
            if (App.TransactionData.money === 0 && this.buttonComponent) {
                this.buttonComponent.interactable = false;
            } else {
                this.buttonComponent.interactable = true;
            }
        }
    }

    onClickBack() {
        if (!App.TransactionData.WithdrawRequirefirst) {
            App.PopUpManager.closeAllPopups();
        } else {
            App.PopUpManager.closePopup(this.node);
        }
    }

    getWithdrawRecord() {
        App.ApiManager.getWithdrawLog(-1, 1, 3).then((data: any) => {
            for (let i = 0; i < (data.list.length ?? 0); i++) {
                const element = data.list[i];
                const node = instantiate(this.history);
                const op: WithdrawHistoryCol = node.getComponent(WithdrawHistoryCol);
                op.init(element);
                this.historyNode.addChild(node);
            }
        });
    }

    goWithdrawRecord() {
        App.PopUpManager.addPopup('prefabs/popup/popupTransactionsRecord', 'hall', null, false);
    }

    private onEditBoxChanged() {
        const amount = parseFloat(this.editboxWithdraw.string);
        console.log('onEditBoxChanged amount=', amount);
        console.log('uRate=', this.uRate);
        console.log("TransactionData.uRate=", App.TransactionData.uRate);
        const model = App.TransactionData.withdrawModel;
        // if (model === '2') {
        //     this.withdrawalAmountReceived.string = (amount * (App.TransactionData.uRate ?? 1)).toFixed(2);
        // } else {
        //     // fallback
        //     this.withdrawalAmountReceived.string = (amount * this.uRate).toFixed(2);
        // }
        if (model === '1') {
            this.withdrawalAmountReceived.string = (amount || 0 * this.uRate).toFixed(2);
        }
        if (model === '2') {
            this.withdrawalAmountReceived.string = (amount || 0 * App.TransactionData.uRate).toFixed(2);
        }
    }

    onClickSetWithdrawableBalance() {
        if (this.withdrawableBalanceLabel.string) {
            this.editboxWithdraw.string = this.withdrawalAmountReceived.string = this.withdrawableBalanceLabel.string;
        }
    }

    bindBank() {
        App.PopUpManager.addPopup('prefabs/popup/popupBindBankCard', 'hall', null, false);
    }

    selectBank() {
        App.PopUpManager.addPopup('prefabs/popup/popupBankChange', 'hall', null, false);
    }

    setacc(data: any) {
        this.bankName && (this.bankName.string = data.bankName);
        this.accountNo && (this.accountNo.string = data.accountNo);
        this.bid = data.bid;
        this.withType = data.withType;
    }

    setBankInfo(eventData: any) {
        console.log('setBankInfo eventData=', eventData);
        const { data, ret } = eventData;
        console.log('setBankInfo ret=', ret);
        console.log('setBankInfo data=', data);
        this.bid = ret.bid;
        this.withType = ret.withType;
        App.TransactionData.BankType = ret.withType;
        console.log('TYPE: ', App.TransactionData.BankType);

        const model = App.TransactionData.withdrawModel;
        console.log('setBankInfo model: ', model);
        if (model === '1') {
            App.TransactionData.canWithdrawAmount = data.withdrawalsrule.canWithdrawAmount;
            if (this.withdrawableBalanceLabel) this.withdrawableBalanceLabel.string = data.withdrawalsrule.canWithdrawAmount;
            this.uRate = data.withdrawalsrule.uRate;
        } else if (model === '2') {
            if (this.withdrawableBalanceLabel) this.withdrawableBalanceLabel.string = String(App.TransactionData.money ?? '');
            if (this.labelNode) this.labelNode.active = false;
            this.uRate = data.withdrawalsrule.uRate;
        }

        if (this.amountOfCode) this.amountOfCode.string = data.withdrawalsrule.amountofCode;
        if (this.time) this.time.string = `${data.withdrawalsrule.startTime} - ${data.withdrawalsrule.endTime}`;
        if (this.withdrawRemainingCount) this.withdrawRemainingCount.string = data.withdrawalsrule.withdrawRemainingCount;
        if (this.range) this.range.string = `${data.withdrawalsrule.minPrice} - ${data.withdrawalsrule.maxPrice}`;
        App.TransactionData.lastBandCarkName = data.lastBandCarkName;
    }

    C2CWithdrawAppeal() {
        console.log('Click! C2CWithdrawAppeal');
        const rangeValues = (this.range.string || '').split(' - ');
        const min = parseFloat(rangeValues[0] || '0') || 0;
        const max = parseFloat(rangeValues[1] || '0') || 0;

        const amount = parseFloat(this.editboxWithdraw.string || '0') || 0;
        const remainingCount = parseInt(this.withdrawRemainingCount.string || '0') || 0;

        if (remainingCount <= 0) {
            App.AlertManager.getCommonAlert().showWithoutCancel('Insufficient withdrawal times today');
            return;
        }

        if (!(amount >= min && amount <= max)) {
            App.AlertManager.getCommonAlert().showWithoutCancel(`Please enter the amount within the withdrawal amount range: ${min} - ${max}`);
            return;
        }

        App.ApiManager.newSetWithdrawal(amount, this.withType, this.bid).then((ret: any) => {
            console.log("C2CWithdrawAppeal newSetWithdrawal ret: ", ret);
            App.AlertManager.getCommonAlert().showWithoutCancel(ret.msg);
            const model = App.TransactionData.withdrawModel;
            if (model === '1') {
                App.TransactionData.canWithdrawAmount -= amount;
            } else if (model === '2') {
                App.TransactionData.money -= amount;
            }
            console.log('App.TransactionData.withdrawID: ', App.TransactionData.withdrawID);
            App.EventUtils.dispatchEvent('updateBindedBankList', App.TransactionData.withdrawID, () => {
                App.EventUtils.dispatchEvent('updateWithdrawBankListUI');
                App.EventUtils.dispatchEvent('RefreshBalance');
                App.EventUtils.dispatchEvent('RefreshtotalBalanceLabel');
                App.EventUtils.dispatchEvent('RefreshBalanceTOP');
            });
        });
    }

    goPromo() {
        App.PopUpManager.addPopup('prefabs/popup/popupPromoCode', 'hall', null, false);
    }

    customer() {
        const openLivechat = (list: any[]) => {
            for (let i = 0; i < list.length; i++) {
                const element = list[i];
                if (element.name === 'LIVECHAT') {
                    App.PlatformApiMgr.openURL(element.url);
                    break;
                }
            }
        };

        App.ApiManager.getCustomerServiceList().then((ret: any) => {
            openLivechat(ret.customerservicelist || []);
        });
    }
}