import { _decorator, Component, EditBox, find, instantiate, Label } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('AmountItem')
export class AmountItem extends Component {
    @property(Label) money: Label = null!;

    private paySendUrl: string = '';
    private callback: ((moneyStr: string) => void) | null = null;

    // public init(money: string, paySendUrl: string, callback?: (moneyStr: string) => void) {
    //     this.money.string = money;
    //     this.paySendUrl = paySendUrl;
    //     this.callback = callback;
    //     const n = find('amount', this.node);
    //     if (n) n.active = false;
    // }

    // public onSelect() {
    //     const parent = this.node.parent;
    //     if (parent) {
    //         for (const child of parent.children) {
    //             const n = find('amount', child);
    //             if (n) n.active = false;
    //         }
    //     }

    //     const selfN = find('amount', this.node);
    //     if (selfN) selfN.active = true;
    //     App.TransactionData.paySendUrl = this.paySendUrl;
    //     if (this.callback) {
    //         this.callback(this.money.string);
    //     }
    // }

    init(money: any, paySendUrl: any, callback: any) {
        var self = this;
        this.money.string = money;
        this.callback = callback;
        find("amount", this.node).active = false;
        this.paySendUrl = paySendUrl;
    }

    initData(money: any, amountPre: any, amountNode: any, paySendUrl: any, scope: any) {
        var self = this;
        App.TransactionData.paySendUrl = paySendUrl;
        amountNode.removeAllChildren();
        var split = scope.split("|");
        console.log("initData split", split);
        if (split.length > 1) {
            let opList = [];
            for (var i = 0; i < split.length; i++) {
                let moneyStr = split[i];
                let op = instantiate(amountPre).getComponent("AmountItem");
                opList.push(op);
                op.init(moneyStr, paySendUrl, function (ret) {
                    var node = find("Canvas/popupRecharge/ui/New ScrollView/view/content/node2/recharge_EditBox");
                    node.getComponent(EditBox).string = moneyStr;
                    // Global.moneyStr = moneyStr;
                    const initialNode = find("Canvas/popupRecharge/ui/New ScrollView/view/content/node7.001/rechargeUsd_EditBox");
                    const convertedNode = find("Canvas/popupRecharge/ui/New ScrollView/view/content/node7.002/rechargeConverted_EditBox");
                    if (convertedNode) {
                        const rate = Number(App.TransactionData.uRate) || 1;
                        const amt = Number(moneyStr) || 0;
                        convertedNode.getComponent(EditBox).string = App.TransactionData.homeSettings.dollarSign + ' ' + String(amt * rate);
                        initialNode.getComponent(EditBox).string = '$ ' + String(moneyStr);
                    }
                });
                amountNode.addChild(op.node);
            }
        }
    }

    onSelect(event: any, customEventData: any) {
        let array = this.node.parent;
        if (array) {
            for (let index = 0; index < array.children.length; index++) {
                const element = array.children[index];
                find("amount", element).active = false;
            }
        }
        find("amount", this.node).active = true;
        App.TransactionData.paySendUrl = this.paySendUrl;
        if (this.callback != null) {
            this.callback(this.money.string);
        }
    }


}
