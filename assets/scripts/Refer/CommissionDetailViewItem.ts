import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CommissionDetailViewItem')
export class CommissionDetailViewItem extends Component {

    private _datasource: any = null;

    @property(Label)
    title: Label = null!;

    @property(Label)
    betP: Label = null!;

    @property(Label)
    rebateLevel: Label = null!;

    @property(Label)
    betA: Label = null!;

    @property(Label)
    commissionPayout: Label = null!;

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
            // 1 彩票 2 电子 3 视讯 4 体育 5 小游戏 6 棋牌
            const textList: Record<number, string> = {
                1: "Lottery commission",
                2: "Slots commission",
                3: "Casino commission",
                4: "Sports rebate",
                5: "Mini game rebate",
                6: "Chess and card rebates",
            };

            this.title.string = textList[datasource.type] || "";
            this.betP.string = datasource.children_LotteryAmount_Users;
            this.rebateLevel.string = datasource.rebateLevel;
            this.betA.string = datasource.rebateAmount;
            this.commissionPayout.string = datasource.children_LotteryAmount;

            if (datasource.rebateWhereItemDetails && Array.isArray(datasource.rebateWhereItemDetails)) {
                for (let i = 0; i < datasource.rebateWhereItemDetails.length; i++) {
                    const element = datasource.rebateWhereItemDetails[i];
                    const prefab = instantiate(this.item);
                    if (prefab) {
                        const item = prefab.getComponent('ReferRulesItem') as any;
                        if (item) {
                            item.datasource = {
                                lv: element.levelId,
                                lvCount: element.children_LotteryAmount,
                                lotteryAmount: element.rebateRate,
                                rechargeAmount: element.rebateAmount
                            };
                            this.content.addChild(item.node);
                        }
                    }
                }
            }
        }
    }
}
