import { _decorator, Component, Label, ProgressBar, Button } from 'cc';
import { App } from '../App';
import { ButtonGrayCmp } from '../ButtonGrayCmp';
const { ccclass, property } = _decorator;

@ccclass('bonusTaskItem')
export class bonusTaskItem extends Component {

    @property(Label)
    value: Label = null!;

    @property(Label)
    title: Label = null!;

    @property(ProgressBar)
    ProgressBar: ProgressBar = null!;

    @property(Label)
    ProgressBarLab: Label = null!;

    @property(Button)
    btn: Button = null!;

    @property(Label)
    btnLab: Label = null!;

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
            this.title.string = datasource.taskTitle || '';
            this.value.string = datasource.taskAwardAmount || '';
            this.ProgressBar.progress = datasource.taskTarget ? datasource.schedule / datasource.taskTarget : 0;
            this.ProgressBarLab.string = `${datasource.schedule}/${datasource.taskTarget}`;
            // @ts-ignore
            this.btn.getComponent(ButtonGrayCmp).interactable = datasource.status === 2;
            this.btnLab.string = datasource.status === 3 ? 'Claimed' : 'Claim';
        }
    }

    onClick() {
        const datasource = this.datasource;
        if (!datasource) return;

        let params: any = {};
        let url = '';

        switch (datasource.type) {
            case 'week':
                params = { weeklyAwardId: datasource.configId };
                url = 'ReceiveWeeklyAward';
                break;
            case 'day':
                params = { dailyAwardId: datasource.configId };
                url = 'ReceiveDailyAward';
                break;
            case 'month':
                params = { dailyAwardId: datasource.configId };
                url = 'ReceiveMonthlyAward';
                break;
        }

        // @ts-ignore
        App.HttpUtils.sendPostRequest(url, params, (error: any, response: any) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('响应结果:', response);
            if (response.code === 0 && response.msg === 'Succeed') {
                // @ts-ignore
                App.AlertManager.showFloatTip(response.msg);
                // @ts-ignore
                // this.btn.getComponent('ButtonGrayCmp').interactable = false;
                this.btnLab.string = 'Claimed';
                if (datasource.cb) datasource.cb();
            } else {
                // @ts-ignore
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }
}
