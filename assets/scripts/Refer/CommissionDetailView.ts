import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CommissionDetailView')
export class CommissionDetailView extends Component {

    private _datasource: any = null;

    @property(Label)
    date: Label = null!;

    @property(Label)
    totalBetP: Label = null!;

    @property(Label)
    totalBetA: Label = null!;

    @property(Label)
    totalCommissionA: Label = null!;

    @property(Node)
    content: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initView();
    }

    get datasource() {
        return this._datasource;
    }

    private initView() {
        const datasource = this._datasource;
        if (datasource) {
            this.date.string = datasource.settlementTime;
            this.totalBetP.string = datasource.children_LotteryAmount_Users;
            this.totalBetA.string = datasource.children_LotteryAmount;
            this.totalCommissionA.string = datasource.rebateAmount_Last;

            if (datasource.rebateWhereItems && Array.isArray(datasource.rebateWhereItems)) {
                for (let i = 0; i < datasource.rebateWhereItems.length; i++) {
                    const element = datasource.rebateWhereItems[i];
                    const prefab = instantiate(this.item);
                    if (prefab) {
                        const item = prefab.getComponent('CommissionDetailViewItem') as any;
                        if (item) {
                            item.datasource = element;
                            this.content.addChild(item.node);
                        }
                    }
                }
            }
        }
    }

    onClick() {
        // @ts-ignore
        App.PopUpManager.addPopup("BalootClient/common/prefab/SecondaryInterface", {
            scriptName: "SecondaryInterface",
            datasource: {
                scriptName: "ReferRecordView",
                fun: "onInitView",
                title: "Rebate ratio",
                path: "hall/prefabs/Refer/ReferRecordView"
            }
        });
    }
}
