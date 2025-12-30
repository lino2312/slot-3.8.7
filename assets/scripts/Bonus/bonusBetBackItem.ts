import { _decorator, Component, Label } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('bonusBetBackItem')
export class bonusBetBackItem extends Component {

    @property(Label)
    gameName: Label = null!;

    @property(Label)
    betState: Label = null!;

    @property(Label)
    date: Label = null!;

    @property(Label)
    bettingRebate: Label = null!;

    @property(Label)
    rebateRate: Label = null!;

    @property(Label)
    rebateAmount: Label = null!;

    private _datasource: any = null;

    get datasource() {
        return this._datasource;
    }

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    initItem() {
        const datasource = this.datasource;
        if (datasource) {
            this.gameName.string = datasource.gameType || '';
            this.betState.string = 'Completed';
            this.date.string = datasource.addTime || '';
            this.bettingRebate.string = datasource.washVolume || '';
            this.rebateRate.string = (datasource.washRate || '') + '%';
            this.rebateAmount.string = datasource.rebateAmount || '';
        }
    }
}
