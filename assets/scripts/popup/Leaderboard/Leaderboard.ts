import { _decorator, Component, Node, Prefab, instantiate, Label } from "cc";
import { LeaderboardAPI } from "./LeaderboardAPI";
import { App } from "../../App";

const { ccclass, property } = _decorator;

@ccclass("Leaderboard")
export class Leaderboard extends Component {
    @property(Node)
    content: Node = null!;
    @property(Prefab)
    item: Prefab = null!;
    @property(Node)
    box: Node = null!;

    private _model: LeaderboardAPI | null = null;

    onLoad() {
        this._model = LeaderboardAPI.getInstance();

        if (!this._model) {
            console.error("[Leaderborad] Model instance not found");
            return;
        }

        // 并行请求两个API，提升加载速度
        Promise.all([
            this._model.getDailyCurrentRankings(),
            this._model.getDailyRankingsList()
        ]).then(([currentResponse, rankingsListResponse]) => {
            console.log("[Leaderborad] getDailyCurrentRankings:", currentResponse);
            console.log("[Leaderborad] getDailyRankingsList:", rankingsListResponse);

            const currentData = currentResponse?.data || [];
            const rankingsData = rankingsListResponse?.data || [];
            const userId = App.userData().uid;

            // 构建 gameType -> currentRankings 的映射，避免嵌套循环
            const rankingsMap = new Map<number, any>();
            for (const item of currentData) {
                rankingsMap.set(item.gameType, item);
            }

            // 构建 title -> box child 的映射
            const boxChildMap = new Map<string, Node>();
            for (const child of this.box.children) {
                boxChildMap.set(child.name, child);
            }

            // 处理当前用户排名显示
            const priorityNodes: Node[] = [];
            for (const rankingData of currentData) {
                const currentRankingsList = rankingData.currentRankingsList || [];
                for (const element of currentRankingsList) {
                    if (element.userId === userId) {
                        const child = boxChildMap.get(rankingData.title);
                        if (child) {
                            const rankNode = child.getChildByPath("0/rank");
                            const prizeNode = child.getChildByPath("0/prize");

                            if (rankNode) {
                                const rankLabel = rankNode.getComponent(Label);
                                if (rankLabel) rankLabel.string = "Rank " + element.rankId;
                            }
                            if (prizeNode) {
                                const prizeLabel = prizeNode.getComponent(Label);
                                if (prizeLabel) prizeLabel.string = element.prize;
                            }

                            if (child.children[0]) {
                                child.children[0].active = true;
                            }
                            priorityNodes.push(child);
                        }
                        break; // 找到当前用户后跳出内层循环
                    }
                }
            }

            // 重新排序节点：当前用户的排在前面
            if (priorityNodes.length > 0) {
                const otherNodes = this.box.children.filter(n => !priorityNodes.includes(n));
                const sortedNodes = [...priorityNodes, ...otherNodes];
                this.box.removeAllChildren();
                for (const node of sortedNodes) {
                    this.box.addChild(node);
                }
            }

            // 批量创建排行榜项目
            for (const element of rankingsData) {
                const prefab = instantiate(this.item);
                if (!prefab) continue;

                const itemComp = prefab.getComponent("LeaderboardItem");
                if (itemComp) {
                    const rankings: any = {
                        itemData: element,
                        rankingsList: rankingsMap.get(element.gameType) || {}
                    };
                    (itemComp as any).datasource = rankings;
                    this.content.addChild(prefab);
                }
            }
        }).catch((error: any) => {
            console.error("[Leaderborad] API error:", error);
        });
    }

    onHelp() {
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup("prefabs/Leaderboard/LeaderboardRules", "hall", null, true);
    }

    onClosePopup() {
        const popupNode = this.node;
        App.PopUpManager.closePopup(popupNode);
    }
}
