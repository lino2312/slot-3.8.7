import { _decorator, Component, director, find, instantiate, Label, Node, PageView, Prefab, Sprite, SpriteFrame } from "cc";
import { App } from "../../App";
const { ccclass, property } = _decorator;

interface RankingItem {
    rankId: number;
    userId: string;
    effectiveBet: string | number;
    prize: string | number;
}

interface LeaderboardDailyData {
    itemData: any;
    rankingsList: {
        currentRankingsList: RankingItem[];
    };
}

@ccclass("LeaderboardDailyView")
export class LeaderboardDailyView extends Component {

    @property(PageView)
    pageList: PageView = null!;
    @property(Prefab)
    gameItem: Prefab = null!;
    @property(Node)
    content: Node = null!;
    @property(Prefab)
    rankItem: Prefab = null!;
    @property(Node)
    myRank: Node = null!;

    public datasource: LeaderboardDailyData | null = null;
    private rankArr: RankingItem[] = [];

    private sendPost(url: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest(url, params, (error: any, resp: any) => {
                if (error) return reject(error);
                resolve(resp);
            });
        });
    }

    setParams(data: any) {
        if (data == null) return;
        this.datasource = data.datasource;
        console.log("datasource")
    }

    async onLoad() {
        if (!this.datasource) return;

        const datasource = this.datasource.itemData;
        const list = this.datasource.rankingsList;
        // Update UI labels
        const totalBonus = this.node.getChildByPath("base/box/money")?.getComponent(Label);
        const prize = this.node.getChildByPath("base/box1/prize/money")?.getComponent(Label);
        const bet = this.node.getChildByPath("base/box1/bet/money")?.getComponent(Label);
        const date = this.node.getChildByPath("base/box1/date/money")?.getComponent(Label);

        totalBonus && (totalBonus.string = datasource.totalPrize || "");
        prize && (prize.string = datasource.totalPrize || "");
        bet && (bet.string = datasource.rechargeAmount || "");

        const now = new Date();
        const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        date && (date.string = formattedDate);

        // Rankings
        this.rankArr = this.datasource.rankingsList.currentRankingsList || [];
        this.rankArr.forEach(element => {
            const prefab = instantiate(this.rankItem);
            if (prefab) {
                prefab.children[0].getComponent(Label).string = String(element.rankId);
                prefab.children[1].getComponent(Label).string = element.userId;
                prefab.children[2].getComponent(Label).string = String(element.effectiveBet);
                prefab.children[3].getComponent(Label).string = String(element.prize);
                this.content.addChild(prefab);
            }

            if (element.userId === "YOUR_USER_ID_HERE") { // replace with your logic
                this.myRank.active = true;
                const ranking = this.myRank.getChildByName("ranking")?.getComponent(Label);
                const PlayerNum = this.myRank.getChildByName("PlayerNum")?.getComponent(Label);
                const Points = this.myRank.getChildByName("Points")?.getComponent(Label);
                const Prize1 = this.myRank.getChildByName("Prize")?.getComponent(Label);

                ranking && (ranking.string = String(element.rankId));
                PlayerNum && (PlayerNum.string = element.userId);
                Points && (Points.string = String(element.effectiveBet));
                Prize1 && (Prize1.string = String(element.prize));
            }
        });

        // Load game items based on gameType
        let gameType = 40;
        switch (datasource.gameType) {
            case 1: gameType = 42; break;
            case 2: gameType = 44; break;
            case 3: gameType = 45; break;
            case 4: case 5: gameType = 40; break;
        }

        try {
            // const params: { gameType: number } = { gameType };
            let params = {
                gameNameEn: '',
                isMiniGame: true,
                type: gameType
            }
            const res: any = await this.sendPost("getThirdGameList", params);
            if (res.code !== 0) {
                return App.AlertManager.showFloatTip(res.msg);
            }
            const data = res.data;
            if (!data || !data.gameLists) return;
            for (const element of data.gameLists as any[]) {
                const item: Node = instantiate(this.gameItem);
                if (gameType === 40) {
                    try {
                        const imgRes: SpriteFrame = await App.ResUtils.getRemoteSpriteFrame(element.img);
                        if (imgRes) {
                            item.children[0].children[0].getComponent(Sprite)!.spriteFrame = imgRes;
                        }
                    } catch (err) {
                        console.warn("40 [LeaderboardDailyView] Failed to load remote image:", element.img, err);
                    }
                } else if (gameType === 42) {
                    const iconName: string | undefined = App.GameItemCfg[Number(element.gameID)]?.title;
                    if (iconName) {
                        try {//db://assets/hall/image/game/icon/287.png
                            const spriteFrame: SpriteFrame = await App.ResUtils.getSpriteFrameFromCommonBundle(`image/game/icon/${iconName}/spriteFrame`);
                            if (spriteFrame) {
                                item.children[0].children[0].getComponent(Sprite)!.spriteFrame = spriteFrame;
                            }
                        } catch (err) {
                            console.warn("42 [LeaderboardDailyView] Failed to load sprite frame:", iconName, err);
                        }
                    }
                } else {
                    try {
                        const spriteFrame: SpriteFrame = await App.ResUtils.getSpriteFrameFromCommonBundle(`image/game/icon/${element.gameID}/spriteFrame`);
                        if (spriteFrame) {
                            item.children[0].children[0].getComponent(Sprite)!.spriteFrame = spriteFrame;
                        }
                    } catch (err) {
                        console.warn("SpriteFrame [LeaderboardDailyView] Failed to load game icon:", element.gameID, err);
                    }
                }
                this.pageList.addPage(item);
            }
        } catch (err) {
            console.error("[LeaderboardDailyView] loadGameList error:", err);
        }
    }

    public onClickSelect(event: any, index: number) {
        const curPageIdx = Math.max(0, Math.min(this.pageList.content.children.length - 1, this.pageList.getCurrentPageIndex() + index));
        this.pageList.scrollToPage(curPageIdx);
    }

    public onClick(): void {
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup("prefabs/Leaderboard/popupRanking", "hall", { scriptName: "Ranking", datasource: this.rankArr });
    }

    public onClickRules(): void {
        if (this.datasource?.itemData?.setContent && typeof this.datasource.itemData.setContent === "string") {
            App.PopUpManager.allowMultiple = true;
            App.PopUpManager.addPopup("prefabs/Leaderboard/RewardRules", "hall", { scriptName: "RewardRules", datasource: this.datasource.itemData.setContent }, true);
        } else {
            console.warn("setContent is missing or not a string:", this.datasource);
        }
    }

    public onClickPlayNow(): void {
        // App.PopUpManager.removeAll();
        // const hallFloatMenu = director.getScene().getComponentInChildren("HallFloatMenuCpt");
        // hallFloatMenu?.onClickMask();

        // let index = 2;
        // switch (this.datasource?.itemData?.gameType) {
        //     case 1: index = 3; break;
        //     case 2: index = 7; break;
        //     case 3: index = 8; break;
        //     case 4: index = 6; break;
        //     case 5: index = 5; break;
        // }

        // const tabbar = director.getScene().getComponentInChildren("Tabbar");
        // tabbar?.setPage(index);
        App.PopUpManager.closeAllPopups();
        director.loadScene('Hall', () => {
            const lobbyNode = find('Hall/Canvas/bottom/tabbar/hall/select');
            if (lobbyNode) {
                lobbyNode.active = true;
            }
            // } else {
            //     App.AlertManager.getCommonAlert().showWithoutCancel("Hall scene Game Tab not found!");
            // }
        });
    }

    onClosePopup() {
        const popupNode = this.node;
        App.PopUpManager.closePopup(popupNode);
    }
}
