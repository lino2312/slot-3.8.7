import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

interface PrizeData {
    name: string;
    amount: number;
}

@ccclass('RewardRules')
export class RewardRules extends Component {

    @property(Prefab)
    public item: Prefab = null!;

    @property(Node)
    public content: Node = null!;
    public datasource: any = null;
    protected onLoad(): void {
        this.API_getDailyRankings();
    }


    /**
     * Generic POST wrapper (Promise-based)
     */
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

    /**
     * Fetch and render daily rankings config
     */
    private async API_getDailyRankings(): Promise<void> {
        try {
            const response = await this.sendPost("GetDailyRankingsConfig", {});
            console.log("GetDailyRankingsConfig:", response);

            if (response.code !== 0 || !response.data?.setContent) {
                App.AlertManager.showFloatTip(response.msg || "Failed to load ranking config");
                return;
            }

            const prizes: PrizeData[] = response.data.setContent.split(',').map((entry: string) => {
                const [name, amount] = entry.split(':');
                return { name, amount: Number(amount) };
            });

            this.content.removeAllChildren();

            prizes.forEach((prize, index) => {
                const node = instantiate(this.item);
                const itemComp = node.getComponent("RankPrize_Item") as any;
                if (itemComp && typeof itemComp.onInit === "function") {
                    itemComp.onInit(prize.name, prize.amount, index === prizes.length - 1);
                }
                this.content.addChild(node);
            });

        } catch (err) {
            console.error("GetDailyRankingsConfig error:", err);
        }
    }
}
