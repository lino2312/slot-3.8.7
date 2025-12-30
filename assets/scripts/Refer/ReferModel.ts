import { App } from '../App';

export class ReferModel {
    private static _instance: ReferModel | null = null;

    static getInstance(): ReferModel {
        if (!this._instance) {
            this._instance = new ReferModel();
        }
        return this._instance;
    }

    gameTypeEnum = {
        REBATERATE: 1, // 彩票
        DIANZI: 2,     // 电子
        SHIXUN: 3,     // 真人视讯
        TIYU: 4,       // 体育
        XIAOYOUXI: 5,  // 小游戏
        CHESS: 6,      // 棋牌
    };

    // 获取排行榜记录
    getLeaderBoard(): Promise<any> {
        const params = {};
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('GetLeaderBoard', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 获取每日排行榜
    getDailyRankingsList(date: string): Promise<any> {
        const params = { date };
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('GetDailyRankingsList', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 查询当前会员充值奖励信息
    getRechargeManageRewardList(): Promise<any> {
        const params = { isAgent: true };
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('GetRechargeManageRewardList', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 获取返佣比例
    getPromotionTutorial(): Promise<any> {
        const params = {};
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('PromotionTutorial', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 邀请记录
    getTeamDayReport(data: any): Promise<any> {
        const params = {
            Lv: data.Lv || -1,
            pageNo: data.pageNo || 1,
            pageSize: data.pageSize,
            day: data.day || this.getFormattedCurrentDate(),
            userId: data.userId || null,
        };
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('TeamDayReport', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 邀请规则
    GetTotalRebateRules(): Promise<any> {
        const params = {};
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('GetTotalRebateRules', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 新推广数据
    getNewPromotion(): Promise<any> {
        const params = {};
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('NewPromotion', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 获取佣金明细
    getGetCommissionDetails(str: string): Promise<any> {
        const params = { date: str || '' };
        return new Promise((resolve, reject) => {
            // @ts-ignore
            App.HttpUtils.sendPostRequest('GetCommissionDetails', params, (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('响应结果:', response);
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

    // 获取前三年
    getYears(): number[] {
        const thisYear = new Date().getFullYear();
        return [thisYear - 2, thisYear - 1, thisYear];
    }

    // 获取可用月份
    getAvailableMonths(year: number): number[] {
        const thisYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        if (year === thisYear) {
            return Array.from({ length: currentMonth }, (_, i) => i + 1);
        } else if (year < thisYear) {
            return Array.from({ length: 12 }, (_, i) => i + 1);
        } else {
            return [];
        }
    }

    // 获取可用天数
    getAvailableDays(year: number, month: number): number[] {
        const today = new Date();
        const thisYear = today.getFullYear();
        const thisMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const totalDays = new Date(year, month, 0).getDate();

        if (year === thisYear && month === thisMonth) {
            return Array.from({ length: currentDay }, (_, i) => i + 1);
        } else if (year < thisYear || (year === thisYear && month < thisMonth)) {
            return Array.from({ length: totalDays }, (_, i) => i + 1);
        } else {
            return [];
        }
    }

    // 获取当前时间（格式化）
    getFormattedCurrentDate(year: number | null = null, month: number | null = null, day: number | null = null): string {
        const now = new Date();
        const finalYear = year || now.getFullYear();
        const finalMonth = month ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
        const finalDay = day ? String(day).padStart(2, '0') : String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${finalYear}-${finalMonth}-${finalDay} ${hours}:${minutes}:${seconds}`;
    }

    // 获取周日期范围
    getWeekDates(weekType: string): { monday: string; sunday: string } {
        const today = new Date();
        const currentDay = today.getDay();

        const monday = new Date(today);
        monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

        if (weekType === '1') {
            monday.setDate(monday.getDate() - 7);
        }

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const formatDate = (date: Date) => date.toISOString().split('T')[0].slice(5);

        return {
            monday: formatDate(monday),
            sunday: formatDate(sunday),
        };
    }
}
