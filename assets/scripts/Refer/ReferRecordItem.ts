import { _decorator, Component, Label, find } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ReferRulesItem')
export class ReferRulesItem extends Component {

    private _datasource: any = null;

    @property(Label)
    lv: Label = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    get datasource() {
        return this._datasource;
    }

    private initItem() {
        const datasource = this._datasource;
        if (datasource && datasource.rebateLevels) {
            for (let i = 0; i < datasource.rebateLevels.length; i++) {
                const element = datasource.rebateLevels[i];
                const lab = find(`${i}`, this.node);
                if (lab) {
                    const label = lab.getComponent(Label);
                    if (label) {
                        label.string = `${element.levelId} level lower level commission rebate           ${Number(element.amount).toFixed(3)}%`;
                    }
                }
            }
            this.lv.string = `L${datasource.rebate_Lv}`;
        }
    }
}
