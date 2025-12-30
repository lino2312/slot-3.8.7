declare global {
    interface Window {
        Global: {
            PromotionCardsDayBonus?: any;
            [key: string]: any;
        };
    }
}

window.Global = window.Global || {};

import { _decorator, Component, Node, Label, Sprite, SpriteFrame, UITransform, director, EditBox, find, ScrollView, Button, instantiate} from "cc";
import { App } from "../App";
import { UserData } from "../data/UserData";
const { ccclass, property } = _decorator;

@ccclass("RewardToday")
export class RewardToday extends Component {

    @property(ScrollView)
    // listView: Node = null;
    listView: ScrollView = null;

    @property([SpriteFrame])
    logobg: SpriteFrame[] = [];

    private localData: any[] = [];
    private _canClickCnt: number = 0;
    private canClickClaim: boolean = true;
    private clickItem: Node | null = null;
    private content: Node | null = null;
    private logo: Node | null = null;
    private listData: any[] = [];
    private totalAmount: number = 0;

    onLoad() {
        this.content = this.listView.content;
        // this.content.removeAllChildren();
        // setup UI position and show splash
        const splash = this.node.getChildByPath("db/SpriteSplash");
        splash && (splash.active = true);

        const list = this.node.getChildByPath("list");
        const uiTransform = list.getComponent(UITransform);
        if (uiTransform) {
            (uiTransform as any).height = 1329;
        }

        // register listener
        const netListener = this.node.addComponent("NetListenerCmp") as any;
        netListener.registerMsg("REQ_OPEN_GIFT", this.REQ_OPEN_GIFT, this);
    }

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
                reject(e);
            }
        });
    }

    start() {
        this.todayRewards();
        this.canClickClaim = true;
    }

    public async todayRewards(): Promise<void> {
        try {
            if (!App.userData().isLogin) return;
            // if (UserData.todayrewards) {
            //     this.updateView(UserData.todayrewards);
            //     return;
            // }

            const res: any = await this.sendPost("GetTodayRewards", {});
            if (!res || res.code !== 0) {
                if (res?.msg) App.AlertManager.showFloatTip(res.msg);
                return;
            }

            const rewards = res.data || res;
            UserData.todayrewards = rewards;
            this.updateView(rewards);

            if (Array.isArray(rewards) && rewards.some((r: any) => r.id === 9)) {
                try {
                    const bonusRes: any = await this.sendPost("GetPromotionCardsDayBonusList", {});
                    const list = bonusRes.data || bonusRes;
                    if (Array.isArray(list)) {
                        const bonus = list.find((it: any) => it.state === 0);
                        if (bonus) {
                            window.Global = window.Global || {};
                            window.Global.PromotionCardsDayBonus = bonus;
                        }
                    }
                } catch (e) {
                    console.warn("GetPromotionCardsDayBonusList failed", e);
                }
            }
        } catch (err) {
            console.error("todayRewards error:", err);
        }
    }

    public async getTurnTableUserRotateNum(): Promise<void> {
        try {
            const res: any = await this.sendPost("GetTurnTableUserRotateNum", {});
            const ret = (res && res.data) ? res.data : res;
            if (!ret) return;

            const surplusRotateNum = ret.surplusRotateNum ?? ret.surplusRotateNum; // defensive
            if (typeof surplusRotateNum === "undefined") return;

            for (let i = 0; i < this.localData.length; i++) {
                const itemData = this.localData[i];
                if (itemData.id === 5) { // id 5 = Lucky Wheel / turntable
                    itemData.coin = surplusRotateNum;
                    itemData.status = ret.status ?? itemData.status;
                    this.renderItemById(5);
                    break;
                }
            }
        } catch (err) {
            console.error("getTurnTableUserRotateNum error:", err);
        }
    }

    // --- claim promotion cards day bonus ---
    public async getPromotionCardsDayBonus(): Promise<void> {
        try {
            if (!App.userData().isLogin) return;
            const promo = (window as any).Global?.PromotionCardsDayBonus;
            if (!promo) return;

            const res: any = await this.sendPost("GetPromotionCardsDayBonus", { id: promo.id });
            if (!res) {
                return;
            }
            if (res.code === 0) {
                App.AlertManager.showFloatTip("Successfully received");
                // refresh list
                try {
                    const listRes: any = await this.sendPost("GetPromotionCardsDayBonusList", {});
                    const list = listRes.data || listRes;
                    if (Array.isArray(list)) {
                        const bonusItem = list.find((it: any) => it.state === 0);
                        if (bonusItem) {
                            window.Global = window.Global || {};
                            window.Global.PromotionCardsDayBonus = bonusItem;
                        }
                    }
                } catch (e) {
                    console.warn("refresh PromotionCardsDayBonusList failed", e);
                }
            } else {
                App.AlertManager.showFloatTip(res.msg || "Failed to claim promotion bonus");
            }
        } catch (err) {
            console.error("getPromotionCardsDayBonus error:", err);
        }
    }

    private renderItemById(id: number) {
        const index = this.localData.findIndex(item => item.id === id);
        if (index >= 0 && this.content && this.content.children[index]) {
            this.onListVRender(this.content.children[index], index);
        }
    }

    // --- update view with reward list ---
    public updateView(data: any[]): void {
        if (!Array.isArray(data) || data.length === 0) return;
        this._canClickCnt = 0;

        const sortMap: Record<number, { sort: number; idx: number }> = {
            5: { sort: 0, idx: 0 },
            1: { sort: 1, idx: 1 },
            3: { sort: 2, idx: 2 },
            4: { sort: 3, idx: 3 },
            7: { sort: 4, idx: 4 },
            6: { sort: 5, idx: 5 },
            8: { sort: 6, idx: 6 },
            9: { sort: 6, idx: 6 },
        };

        const list = data.map((item: any) => {
            const base = { ...(item || {}), ...(sortMap[item.id] || { sort: 999, idx: 0 }) };
            // attach claim function bound to this item
            base.claimFunc = () => {
                if (this.canClickClaim) {
                    this.canClickClaim = false;
                    this.onClickItem(base);
                    this.scheduleOnce(() => { this.canClickClaim = true; }, 0.5);
                }
            };
            return base;
        }).sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));

        this.localData = list;
        this._canClickCnt = list.length;

        // if (this.listView) {
        //     this.listView.active = true;
        //     const listComp: any = this.listView.getComponent("List");
        //     if (listComp) listComp.numItems = list.length;
        // }
        // this.content.removeAllChildren();
        const itemTemplate = this.content.getChildByName("item");
        if (!itemTemplate) return;
        itemTemplate.active = false;
        this.content.removeAllChildren();

        // Instantiate a node for each reward
        for (let i = 0; i < this.localData.length; i++) {
            const itemNode = instantiate(itemTemplate);
            itemNode.active = true;
            this.content.addChild(itemNode);
            this.onListVRender(itemNode, i);
        }

        // request additional coin/status info for VIP etc
        const vipLevel = UserData.svip;
        if (Number.isInteger(vipLevel) && vipLevel > 0) {
            this.requestCoinValue();
        }
    }

    onListVRender(item: Node, idx: number): Node {
        const data = this.localData[idx];
        console.log("onListVRender: data", data);
        if (!data) return;

        const index = data.idx ?? 0;

        const bg = item.getChildByName("bg")?.getComponent("ImageSwithComponent") as any;
        const icon = item.getChildByName("icon")?.getComponent("ImageSwithComponent") as any;
        if (bg) bg.setIndex(index);
        if (icon) icon.setIndex(index);

        const titleMap: Record<string, string> = {
            "月奖励": "Monthly Bonus",
            "升级奖励": "Level Up Bonus",
            "转盘": "Lucky Wheel",
            "邮件奖励": "Email Bonus",
            "周奖励": "Weekly Bonus",
            "返水": "BETTING CASH BACK"
        };
        const title = titleMap[data.name] || data.name;

        const lbTitle = item.getChildByName("lbTitle")?.getComponent(Label);
        if (lbTitle) lbTitle.string = title;

        const btn_claim = item.getChildByName("btn_claim");
        this.logo = item.getChildByName("month_icon");

        if (["Level Up Bonus", "Monthly Bonus", "Weekly Bonus"].includes(title)) {
            App.ComponentUtils.setLabelString("coin", item, App.FormatUtils.FormatNumToComma(Number(data.coin) || 0));
            const btnComp = btn_claim?.getComponent(Button);
            if (btnComp) btnComp.interactable = (data.status === 1);
        } else if (title === "Lucky Wheel") {
            const coinLabel = item.getChildByName("coin")?.getComponent(Label);
            if (coinLabel) coinLabel.string = "win up to 5000+";
            const btnComp = btn_claim?.getComponent(Button);
            if (btnComp) btnComp.interactable = true;
        } else if (title === "Email Bonus") {
            App.ApiManager.getMessageList().then((data: any) => {
                this.listData = data.list || [];
                this.totalAmount = 0;
                console.log("getMessage mailRewards:", this.listData);
                for (let i = 0; i < this.listData.length; i++) {
                    const Mail = this.listData[i];
                    if (Mail.type === 3 && Mail.mailReward) {
                        this.totalAmount += Number(Mail.mailReward.amount) || 0;
                    }
                }
                App.ComponentUtils.setLabelString("coin", item, App.FormatUtils.FormatNumToComma(Number(this.totalAmount) || 0));
            });
        } else if (title === "BETTING CASH BACK") {
            App.ComponentUtils.setLabelString("coin", item, App.FormatUtils.FormatNumToComma(Number(data.coin) || 0));
        }

        if (this.logo) this.logo.active = false;
        if (title === "Monthly Bonus" && this.logo) {
            this.logo.active = true;
            this.logo.getComponent(Sprite)!.spriteFrame = this.logobg[1];
        } else if (title === "Weekly Bonus" && this.logo) {
            this.logo.active = true;
            this.logo.getComponent(Sprite)!.spriteFrame = this.logobg[0];
        } else if (data.id === 9) {
            const coinLabel = item.getChildByName("coin")?.getComponent(Label);
            if (coinLabel) {
                window.Global = window.Global || {};
                coinLabel.string = String(window.Global?.PromotionCardsDayBonus?.dayBonus ?? 0);
            }
        } else if (data.id === 8) {
            const coinLabel = item.getChildByName("coin")?.getComponent(Label);
            if (coinLabel) {
                coinLabel.string = String(data.coin || 0);
            }
        }

        const btnLabel = btn_claim?.getChildByName("New Label")?.getComponent(Label);
        if (btnLabel) btnLabel.string = "Claim";

        if (btn_claim) {
            App.ComponentUtils.onClick(btn_claim, () => {
                this.clickItem = btn_claim;
                data.claimFunc?.();
            }, this);
        }
    }

    // --- request coin/status for particular items ---
    public requestCoinValue(): void {
        let executed = false;
        for (const item of this.localData) {
            switch (item.id) {
                case 1:
                case 3:
                case 4:
                    if (!executed) {
                        const vip = UserData.svip;
                        this.getListVipUserRewards(vip);
                        executed = true;
                    }
                    break;
                case 5:
                    this.getTurnTableUserRotateNum();
                    break;
                case 7:
                    this.getCodeWashAmount(-1);
                    break;
                default:
                    break;
            }
        }
    }

    // --- on item click handling ---
    public onClickItem(item: any): void {
        if (!item) return;
        if (item.id === 5) {
            this.gotoActivityPage(item.id);
        } else if (item.id === 6) {
            this.EmailRewards();
        } else if (item.id === 1 || item.id === 3 || item.id === 4 || item.id === 7) {
            this.receiveRewards(item);
        } else if (item.id === 9) {
            this.getPromotionCardsDayBonus();
        } else {
            this.gotoActivityPage(item.id);
        }
    }

    public async EmailRewards(): Promise<void> {
        console.log("EmailRewards totalAmount:", this.totalAmount);
        const unreadMails = this.listData.filter(m => m.type === 3 && m.stateName === "unread" && m.claimStatus === 0);
        console.log("EmailRewards unreadMails:", unreadMails);
        if (unreadMails.length === 0) {
            this.gotoActivityPage(6);
            return;
        }

        try {
            for (const mailData of unreadMails) {
                try {
                    await App.ApiManager.claimMailReward(mailData.messageID);
                    mailData.claimStatus = 1;
                    mailData.stateName = "read";
                    App.EventUtils.dispatchEvent("refreshMail", mailData);
                    App.AlertManager.showFloatTip(`Claimed Successfully: ${mailData.mailReward?.amount || 0}`);
                } catch (err) {
                    App.AlertManager.showFloatTip("Claim Failed");
                }
            }
            this.totalAmount = this.listData
                .filter(m => m.type === 3 && m.stateName === "unread" && m.claimStatus === 0)
                .reduce((sum, m) => sum + (Number(m.mailReward?.amount) || 0), 0);
            console.log("EmailRewards totalAmount after claiming:", this.totalAmount);
        } catch (err) {
            App.AlertManager.showFloatTip("EmailRewards error:", err);
        }
    }

    // --- navigate to activity page (keeps previous behavior) ---
    public gotoActivityPage(id: number): void {
        // special case: open GameHall and switch tab
        console.log("gotoActivityPage id:", id);
        if (id === 5 || id === 7) {
            const gameHall: any = director.getScene()?.getComponentInChildren?.("GameHall");
            if (gameHall && gameHall.pageTabbar && typeof gameHall.pageTabbar.setPage === "function") {
                gameHall.pageTabbar.setPage(id === 5 ? 4 : 3);
            }
            // delay to allow tab switch, then dispatch event and close popups
            this.scheduleOnce(() => {
                App.EventUtils.dispatchEvent("Select_Tab_Index");
                App.PopUpManager?.closeAllPopups();
            }, 0.3);
            return;
        }

        const pathMap: Record<number, string> = {
            1: "prefabs/popup/popupVIP",
            3: "prefabs/popup/popupVIP",
            4: "prefabs/popup/popupVIP",
            6: "prefabs/Email/PopupMailView",
            8: "prefabs/popup/popupPromoCode",
        };

        const path = pathMap[id];
        if (path) {
            this.close(); // close this popup
            App.PopUpManager.addPopup(path, 'hall', null, true);
        }
    }

    // --- handle receiving rewards (uses existing helper methods) ---
    public receiveRewards(item: any): void {
        const id = item?.id;
        if (id === 7) {
            // add code wash record then show tip
            if (item.status === 1) {
                this.addCodeWashRecord(-1);
            } else {
                const gameHall: any = director.getScene()?.getComponentInChildren?.("GameHall");
                if (gameHall && gameHall.pageTabbar && typeof gameHall.pageTabbar.setPage === "function") {
                    gameHall.pageTabbar.setPage(item.id === 5 ? 4 : 3);
                }
                this.scheduleOnce(() => {
                    App.EventUtils.dispatchEvent("Select_Tab_Index");
                    App.PopUpManager?.closeAllPopups();
                }, 0.3);
                return;
            }
            // App.AlertManager.showFloatTip("Successfully received");
        } else if ([1, 3, 4].includes(id)) {
            const type = id === 1 ? 3 : id === 3 ? 2 : 1;
            const vip = UserData.svip;
            this.addReceiveAward(vip, type, item.receiveId);
        }
    }

    public async getRewards(): Promise<void> {
        const dbNode = find("db", this.node);
        if (!dbNode) return;
        const editBoxNode = find("editBox", dbNode);
        if (!editBoxNode) return;
        const editBox = editBoxNode.getComponent(EditBox);
        if (!editBox) return;
        const inputString = (editBox.string || "").trim();
        if (inputString.length === 0) {
            App.AlertManager.showFloatTip("Please enter a code");
            return;
        }

        try {
            const res: any = await this.sendPost("conversionRedpage", { code: inputString });
            const payload = res?.data ?? res;
            if (res && res.code === 0) {
                App.AlertManager.showFloatTip(res.msg || "Redeem success");
            } else {
                App.AlertManager.showFloatTip(res?.msg || "Redeem failed");
            }
        } catch (err) {
            console.error("conversionRedpage error:", err);
            App.AlertManager.showFloatTip("Network error, please try again");
        }
    }

    public async getListVipUserRewards(vipLevel: number): Promise<void> {
        try {
            const res = await App.ApiManager.getListVipUserRewards(vipLevel);
            const arr = Array.isArray(res) ? res : res?.data ?? [];

            for (let i = 0; i < this.localData.length; i++) {
                const local = this.localData[i];
                let reward;

                if (local.id === 4) {
                    reward = arr.find(r => r.rewardType === 1);
                    if (reward) {
                        local.coin = reward.balance;
                        local.receiveId = reward.id;
                        local.status = reward.status;
                        this.renderItemById(4);
                    }
                } else if (local.id === 3) {
                    reward = arr.find(r => r.rewardType === 2);
                    if (reward) {
                        local.coin = reward.balance;
                        local.receiveId = reward.id;
                        local.status = reward.status;
                        this.renderItemById(3);
                    }
                } else if (local.id === 1) {
                    reward = arr.find(r => r.rewardType === 3);
                    if (reward) {
                        local.coin = reward.balance;
                        local.receiveId = reward.id;
                        local.status = reward.status;
                        this.renderItemById(1);
                    }
                }
            }
        } catch (err) {
            console.error("getListVipUserRewards error:", err);
        }
    }

    public async getCodeWashAmount(codeType: number): Promise<void> {
        try {
            const res = await App.ApiManager.getCodeWashAmount(codeType);
            if (res && typeof res.codeWashAmount !== "undefined") {
                for (let i = 0; i < this.localData.length; i++) {
                    const local = this.localData[i];
                    if (local.id === 7) {
                        local.coin = res.codeWashAmount;
                        local.status = res.status;
                        this.onListVRender(this.content.children[i], i);
                        break;
                    }
                }
            }
        } catch (err) {
            console.error("getCodeWashAmount error:", err);
        }
    }

    public async addCodeWashRecord(codeType: number): Promise<void> {
        try {
            await App.ApiManager.addCodeWashRecord(codeType);
            await this.getCodeWashAmount(-1);
        } catch (err) {
            console.log("addCodeWashRecord error:", err);
        }
    }

    public async addReceiveAward(vipLevel: number, rewardType: number, receiveId: number): Promise<void> {
        try {
            await App.ApiManager.addReceiveAward(vipLevel, rewardType, receiveId);
            await this.getListVipUserRewards(UserData.svip);
        } catch (err) {
            console.error("addReceiveAward error:", err);
        }
    }

    REQ_OPEN_GIFT(msg: any) {
        if (msg.code == 200 && msg.spcode == 0) {
            App.AnimationUtils.RewardFly(msg.rewards, this.clickItem.getWorldPosition());
            this._canClickCnt -= 1;
            if (this._canClickCnt <= 0) this.close();
        }
    }

    close() {
        App.PopUpManager.closePopup(this.node);
    }
}
