import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { ReferModel } from './ReferModel';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CommissionDetail')
export class CommissionDetail extends Component {

    @property(Label)
    dateLab: Label = null!;

    @property(Node)
    content: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    private dateObj: { year: number, month: number, day: number };
    private _model: ReferModel | null = null;

    onLoad() {
        const date = new Date();
        this.dateObj = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        };
        const str = `${this.dateObj.year}-${this.dateObj.month}-${this.dateObj.day}`;
        this.dateLab.string = str;
        this._model = ReferModel.getInstance();
        this.onClickSearch();
    }

    onClickSelectiveDate() {
        const self = this;
        // @ts-ignore
        cc.vv.selectDate.show((dateObj: any) => {
            self.dateLab.string = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
            this.dateObj = dateObj;
            self.onClickSearch();
        }, { type: 0, year: this.dateObj.year, month: this.dateObj.month, day: this.dateObj.day });
    }

    onClickSearch() {
        this.content.removeAllChildren();
        this._model?.getGetCommissionDetails(this.dateLab.string)
            .then((response: any) => {
                console.log('获取到的数据:', response);
                const prefab = instantiate(this.item);
                if (prefab && response.data) {
                    const item = prefab.getComponent('CommissionDetailItem') as any;
                    if (item) {
                        item.datasource = response.data;
                        this.content.addChild(item.node);
                    }
                }
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    onClose() {
        // @ts-ignore
        App.PopUpManager.removePopup(this.node);
    }
}
