import { App } from '../App';
export class yd_bonus_model {
    private static _instance: yd_bonus_model;
    private task: any;

    static getInstance(): yd_bonus_model {
        if (!this._instance) {
            this._instance = new yd_bonus_model();
        }
        return this._instance;
    }

    constructor(task?: any) {
        this.task = task;
    }

    ActiveTaskMap: Record<string, { icon?: string; name: string }> = {
        A1: { icon: 'weeklyType1', name: 'Deposit' }, // 充值任务
        A3: { icon: 'weeklyType2', name: 'Profit' },  // 提现任务
        B1: { name: 'Slot' },   // 电子打码任务
        B3: { name: 'Video' },  // 真人打码任务
        B5: { name: 'Sport' },  // 体育打码任务
        B7: { name: 'Chess' },  // 棋牌打码任务
    };

    private _request(api: string, params: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest(api, params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    console.log(`响应结果 [${api}]:`, response);
                    if (response.code === 0 && response.msg === 'Succeed') {
                        resolve(response);
                    } else {
                        // @ts-ignore
                        App.AlertManager.showFloatTip(response.msg);
                        reject(response.msg);
                    }
                }
            });
        });
    }

    // 每日任务
    getDailyAwardList() {
        return this._request('GetDailyAwardList');
    }

    // 每周任务
    getWeeklyAwardList() {
        return this._request('GetWeeklyAwardList');
    }

    // 每月任务
    getMonthlyAwardList() {
        return this._request('GetMonthlyAwardList');
    }

    // 活动列表
    getActivityList() {
        return this._request('GetActivityList');
    }

    // 洗码
    getCodeWashAmount(type: any) {
        return this._request('GetCodeWashAmount', type);
    }

    // 签到
    getContinuousSignInRecharges() {
        return this._request('GetContinuousSignInRecharges');
    }

    // 返水游戏列表
    getRabateGamelist() {
        return this._request('GetRabateGamelist');
    }
}
