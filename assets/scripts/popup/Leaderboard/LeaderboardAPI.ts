import { App } from "../../App";
export class LeaderboardAPI {
    private static _instance: LeaderboardAPI;

    public static getInstance(): LeaderboardAPI {
        if (!this._instance) {
            this._instance = new LeaderboardAPI();
        }
        return this._instance;
    }

    /** /api/webapi/GetDailyCurrentRankings */
    public async getDailyCurrentRankings(): Promise<any> {
        try {
            const response = await this.sendPost("GetDailyCurrentRankings", {});
            if (response.code === 0 && response.msg === "Succeed") {
                console.log("[LeaderboardAPI] GetDailyCurrentRankings:", response);
                return response;
            } else {
                App.AlertManager.showFloatTip(response.msg || "Failed to load current rankings");
                throw new Error(response.msg);
            }
        } catch (err) {
            console.error("[LeaderboardAPI] getDailyCurrentRankings Error:", err);
            throw err;
        }
    }

    /** /api/webapi/GetDailyRankingsRecord */
    public async getDailyRankingsRecord(): Promise<any> {
        try {
            const response = await this.sendPost("GetDailyRankingsRecord", {});
            if (response.code === 0 && response.msg === "Succeed") {
                console.log("[LeaderboardAPI] GetDailyRankingsRecord:", response);
                return response;
            } else {
                App.AlertManager.showFloatTip(response.msg || "Failed to load ranking records");
                throw new Error(response.msg);
            }
        } catch (err) {
            console.error("[LeaderboardAPI] getDailyRankingsRecord Error:", err);
            throw err;
        }
    }

    /** /api/webapi/GetDailyRankingsList */
    public async getDailyRankingsList(): Promise<any> {
        try {
            const response = await this.sendPost("GetDailyRankingsList", {});
            if (response.code === 0 && response.msg === "Succeed") {
                console.log("[LeaderboardAPI] GetDailyRankingsList:", response);
                return response;
            } else {
                App.AlertManager.showFloatTip(response.msg || "Failed to load rankings list");
                throw new Error(response.msg);
            }
        } catch (err) {
            console.error("[LeaderboardAPI] getDailyRankingsList Error:", err);
            throw err;
        }
    }

    /** HTTP POST */
    private sendPost(url: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                App.HttpUtils.sendPostRequest(url, params, (error: any, response: any) => {
                    if (error) {
                        console.error(`[HTTP ERROR] ${url}:`, error);
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });
            } catch (e) {
                console.error(`[EXCEPTION] ${url}:`, e);
                reject(e);
            }
        });
    }
}
