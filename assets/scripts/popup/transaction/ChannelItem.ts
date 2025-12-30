import { _decorator, Component, find, instantiate, Label } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('ChannelItem')
export class ChannelItem extends Component {
    @property(Label) price: Label = null!;
    @property(Label) payName: Label = null!;
    private callback: (() => void) | null = null;
    private payID: number = 0;
    private payTypeId: number = 0;

    init(price: any, payName: any, payID: any, payTypeId: any, callback: any) {
        this.price.string = price;
        this.payName.string = payName;
        find("channel", this.node).active = false;
        this.callback = callback;
        this.payID = payID;
        this.payTypeId = payTypeId;
    }

    async initData(payID: any, payTypeId: any, selfPre: any, selfNode: any, amountPre: any, amountNode: any, callback: any, callback2: any) {
        selfNode.removeAllChildren();
        const enumDeposit = {
            NAYIPAY: 21,
            C2C: 20,
            USDT: 19,
            UPI: 12,
            ALL: -1,
        };
        const localBankList = [9, 18];
        callback2();

        const ret = await App.ApiManager.getRechargeTypes(payID, payTypeId);

        let opList = [];
        this.payID = payID;
        if (localBankList.includes(payID)) {
            if (ret.rechargetypelist && ret.rechargetypelist.length > 0) {
                const element = ret.rechargetypelist[0];
                if (ret.banklist && ret.banklist.length > 0) {
                    for (let i = 0; i < ret.banklist.length; i++) {
                        let bankDetails = ret.banklist[i];
                        console.log("bankDetails", bankDetails);
                        let op = instantiate(selfPre).getComponent("ChannelItem");
                        opList.push(op);
                        op.init(
                            element.miniPrice + " - " + element.maxPrice,
                            bankDetails.bankName,
                            element.payID,
                            element.payTypeID,
                            function () {
                                App.TransactionData.rechargePrice = element.miniPrice + " - " + element.maxPrice;
                                let amountOp = instantiate(amountPre).getComponent("AmountItem");
                                amountOp.initData(element.miniPrice, amountPre, amountNode, element.paySendUrl, element.scope);
                            }
                        );
                        selfNode.addChild(op.node);
                        callback({
                            currentPaymentMethod: element,
                            currentChannel: bankDetails,
                            isLocalUsdt: false,
                            isBank: true,
                            accountName: bankDetails.accountName,
                            bankAccountNumber: bankDetails.bankAccountNumber,
                            transferType: bankDetails.transferType,
                            bankName: bankDetails.bankName,
                            payTypeId: element.payTypeID,
                        });
                    }
                }
            }
        }
        else if (payID === enumDeposit.USDT) {
            for (let index = 0; index < ret.rechargetypelist.length; index++) {
                let element = ret.rechargetypelist[index];
                let localUsdtInfo = ret.localUsdtlist[index];
                let op = instantiate(selfPre).getComponent("ChannelItem");
                opList.push(op);
                op.init(
                    element.miniPrice + " - " + element.maxPrice,
                    localUsdtInfo.usdtName,
                    element.payID,
                    element.payTypeID,
                    function () {
                        App.TransactionData.rechargePrice = element.miniPrice + " - " + element.maxPrice;
                        let amountOp = instantiate(amountPre).getComponent("AmountItem");
                        amountOp.initData(element.miniPrice, amountPre, amountNode, element.paySendUrl, element.scope);
                    }
                );
                selfNode.addChild(op.node);
                callback({
                    currentPaymentMethod: localUsdtInfo,
                    currentChannel: element,
                    isLocalUsdt: true,
                    isBank: false,
                    usdtID: localUsdtInfo.usdtID,
                    usdtName: localUsdtInfo.usdtName,
                    usdtType: localUsdtInfo.usdtType,
                    rechargeAddress: localUsdtInfo.coding,
                    payID: element.payID,
                    payTypeID: element.payTypeID
                });
            }
        }
        else {
            console.log("Other payment methods", ret.rechargetypelist);
            for (let index = 0; index < ret.rechargetypelist.length; index++) {
                let element = ret.rechargetypelist[index];
                let op = instantiate(selfPre).getComponent("ChannelItem");
                opList.push(op);
                op.init(
                    element.miniPrice + " - " + element.maxPrice,
                    element.payName,
                    element.payID,
                    element.payTypeID,
                    function () {
                        App.TransactionData.rechargePrice = element.miniPrice + " - " + element.maxPrice;
                        let amountOp = instantiate(amountPre).getComponent("AmountItem");
                        amountOp.initData(element.miniPrice, amountPre, amountNode, element.paySendUrl, element.scope);
                    }
                );
                selfNode.addChild(op.node);
                callback({
                    currentPaymentMethod: element,
                    currentChannel: element,
                    isLocalUsdt: false,
                    isBank: false
                });
            }
        }
        if (opList[0]) opList[0].onSelect();


    }

    onSelect(event: any = null, customEventData: any = null) {
        let array = this.node.parent;
        if (array) {
            for (let index = 0; index < array.children.length; index++) {
                const element = array.children[index];
                find("channel", element).active = false;
            }
        }
        find("channel", this.node).active = true;
        App.TransactionData.payID = this.payID;
        App.TransactionData.payTypeId = this.payTypeId;
        if (this.callback != null) {
            this.callback();
        }
    }

}