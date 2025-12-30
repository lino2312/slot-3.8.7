import { _decorator, Component, EditBox, Label, Node, Prefab, instantiate } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
const { ccclass, property } = _decorator;

@ccclass('InvitationLink')
export class InvitationLink extends Component {

    @property(EditBox)
    editBox: EditBox = null!;

    @property(Label)
    rechargeNumber: Label = null!;

    @property(Label)
    rechageAmount: Label = null!;

    @property(Label)
    numberbettors: Label = null!;

    @property(Label)
    betAmount: Label = null!;

    @property(Label)
    firstRechargesC: Label = null!;

    @property(Label)
    firstDepositAmount: Label = null!;

    @property(Node)
    content: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property(Label)
    pageLab: Label = null!;

    @property(Label)
    statusLab: Label = null!;

    @property(Label)
    dateLab: Label = null!;

    private _model: ReferModel | null = null;
    private dateObj: { year: number; month: number; day: number } = { year: 0, month: 0, day: 0 };
    private params: any = {};
    private datasource: any = null;
    private next: boolean = false;
    private statuIndex: number = 0;

    onLoad() {
        const date = new Date();
        this.dateObj = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        };
        this.statuIndex = 0;
        this.dateLab.string = `${this.dateObj.year}-${this.dateObj.month}-${this.dateObj.day}`;
    }

    onEnable() {
        this._model = ReferModel.getInstance();
        this.params = {
            Lv: -1,
            pageNo: 1,
            pageSize: 10,
            day: this._model.getFormattedCurrentDate(),
            userId: null,
        };
        this.onClickSearch();
    }

    private onAddItem(list: any[]) {
        this.content.removeAllChildren();
        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            const prefab = instantiate(this.item);
            if (prefab) {
                const item = prefab.getComponent('InvitationLinkItem') as any;
                if (item) {
                    item.datasource = element;
                    this.content.addChild(item.node);
                }
            }
        }
    }

    onClickSearchUID() {
        if (this.editBox.string === '') return;
        this.params.userId = Number(this.editBox.string);
        this.onClickSearch();
    }

    onClickSelectiveStatus(e: Event, lv: string) {
        const status = [
            'All status',
            'tiere 1',
            'tiere 2',
            'tiere 3',
            'tiere 4',
            'tiere 5',
            'tiere 6',
        ];
        // @ts-ignore
        cc.vv.selectDate.show((index: number) => {
            this.params.Lv = index === 0 ? -1 : index;
            this.statusLab.string = status[index];
            this.statuIndex = index;
            this.onClickSearch();
        }, { type: 1, status: status, index: this.statuIndex });
    }

    onClickSelectiveDate() {
        // @ts-ignore
        cc.vv.selectDate.show((dateObj: any) => {
            this.params.day = this.dateLab.string = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
            this.dateObj = dateObj;
            this.onClickSearch();
        }, { type: 0, year: this.dateObj.year, month: this.dateObj.month, day: this.dateObj.day });
    }

    onClickSearch() {
        this._model?.getTeamDayReport(this.params)
            .then((response: any) => {
                console.log('获取到的数据:', response);
                this.next = false;
                this.datasource = response.data;
                const data = this.datasource.data || {};
                this.rechargeNumber.string = data.recahrgeCount || '0';
                this.rechageAmount.string = data.recahrgeAmountSum || '0';
                this.numberbettors.string = data.betCountSum || '0';
                this.betAmount.string = data.betAmountSum || '0';
                this.firstRechargesC.string = data.firstRecahrgeCount || '0';
                this.firstDepositAmount.string = data.firstRecahrgeAmountSum || '0';
                this.pageLab.string = `${this.datasource.pageNo}/${this.datasource.totalPage}`;
                this.onAddItem(response.data.list);
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    onClickNextPage(e: Event, index: string) {
        const pageNo = this.params.pageNo + Number(index);
        if (pageNo <= 0 || this.next) return;
        if (pageNo > this.datasource.totalPage && pageNo >= this.params.pageNo) return;
        this.next = true;
        this.params.pageNo += Number(index);
        this.onClickSearch();
    }
}
