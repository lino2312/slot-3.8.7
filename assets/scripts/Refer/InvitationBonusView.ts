import { _decorator, Component, Label } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
const { ccclass, property } = _decorator;

@ccclass('ReferOverview')
export class ReferOverview extends Component {

    @property(Label)
    yesterdays_commission: Label = null!; // 昨日佣金

    @property(Label)
    direct_number_of_register: Label = null!;

    @property(Label)
    direct_deposit_of_number: Label = null!;

    @property(Label)
    direct_deposit_of_amount: Label = null!;

    @property(Label)
    direct_number_of_people_making_first_deposit: Label = null!;

    @property(Label)
    team_number_of_register: Label = null!;

    @property(Label)
    team_deposit_of_number: Label = null!;

    @property(Label)
    team_deposit_of_amount: Label = null!;

    @property(Label)
    team_number_of_people_making_first_deposit: Label = null!;

    @property(Label)
    this_week: Label = null!;

    @property(Label)
    direct_subordinate: Label = null!;

    @property(Label)
    total_commission: Label = null!;

    @property(Label)
    total_number_of_subordinate_in_the_team: Label = null!;

    private _model: ReferModel | null = null;

    onEnable() {
        this._model = ReferModel.getInstance();
        this._model?.getNewPromotion()
            .then((response: any) => {
                console.log('获取到的数据:', response);
                const data = response.data || {};

                this.yesterdays_commission.string = data.children_Lv_RebateAmount_Yesterday || '0';
                this.direct_number_of_register.string = data.children_Lv_1_Count_Add_Yesterday || '0';
                this.direct_deposit_of_number.string = data.children_Lv_1_RechargesSumCount || '0';
                this.direct_deposit_of_amount.string = data.children_Lv_1_RechargesSumAmount || '0';
                this.direct_number_of_people_making_first_deposit.string = data.children_Lv_1_FirstRechargesCount || '0';
                this.team_number_of_register.string = data.children_Lv_Count_X_Add_Yesterday || '0';
                this.team_deposit_of_number.string = data.children_Lv_RechargesSumCount || '0';
                this.team_deposit_of_amount.string = data.children_Lv_RechargesSumAmount || '0';
                this.team_number_of_people_making_first_deposit.string = data.children_Lv_FirstRechargesCount || '0';
                this.this_week.string = data.children_Lv_RebateAmount_Week || '0';
                this.direct_subordinate.string = data.children_Lv_1_Count || '0';
                this.total_commission.string = data.children_Lv_RebateAmount || '0';
                this.total_number_of_subordinate_in_the_team.string = data.children_Lv_Count_X || '0';
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    onClickDetail() {
        // @ts-ignore
        App.PopUpManager.addPopup('prefabs/Refer/CommissionDetail', 'hall', null, true);
    }
}
