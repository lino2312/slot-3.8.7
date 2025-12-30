import { _decorator, Component, Label } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CommissionDetailItem')
export class CommissionDetailItem extends Component {

    private _datasource: any = null;

    @property(Label)
    settlementTime: Label = null!;

    @property(Label)
    people: Label = null!;

    @property(Label)
    BetAmount: Label = null!;

    @property(Label)
    CommissionPayout: Label = null!;

    @property(Label)
    time: Label = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    get datasource() {
        return this._datasource;
    }

    private initItem() {
        const datasource = this._datasource;
        if (datasource) {
            // this.settlementTime.string = datasource.settlementTime;
            this.people.string = datasource.children_LotteryAmount_Users;
            this.BetAmount.string = datasource.children_LotteryAmount;
            this.CommissionPayout.string = datasource.rebateAmount_Last;
            this.time.string = datasource.time;
        }
    }

    onClick() {
        // @ts-ignore
        // App.PopUpManager.addPopup("hall/prefabs/Refer/CommissionDetailView", { scriptName: "CommissionDetailView", datasource: this._datasource });
    }
}
