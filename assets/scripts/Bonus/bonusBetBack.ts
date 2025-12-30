import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { App } from '../App';
import { yd_bonus_model } from './bonusModel';
const { ccclass, property } = _decorator;

@ccclass('bonusBetBack')
export class bonusBetBack extends Component {

    @property(Label)
    rebateRate: Label = null!;

    @property(Label)
    totalRebate: Label = null!;

    @property(Label)
    rebate: Label = null!;

    @property(Node)
    content: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property(Node)
    gameContent: Node = null!;

    @property(Prefab)
    gameItem: Prefab = null!;

    private _model: yd_bonus_model | null = null;
    private params: any = {};
    private type: number = 0;

    onLoad() {
        this._model = yd_bonus_model.getInstance();
        return; // 暂时停止自动执行
        this.node.height = this.node.parent?.parent?.height || this.node.height;
        this.onSelectType(null, 3);
        this.type = 3;
    }

    onEnable() {
        const self = this;
        this.gameContent.removeAllChildren();

        this._model?.getRabateGamelist()
            .then((response: any) => {
                console.log("getRabateGamelist:", response);
                if (response.data) {
                    for (let i = 0; i < response.data.length; i++) {
                        const prefab = instantiate(self.gameItem);
                        if (prefab) {
                            const item = prefab.getComponent('yd_bonus_bet_back_game_item') as any;
                            if (item) {
                                item.imgUrl = response.data[i].imgUrl;
                                item.gameCode = response.data[i].gameCode;
                                self.gameContent.addChild(item.node);
                            }
                        }
                    }
                }
            })
            .catch((error: any) => {
                console.error("Api Error:", error);
            });
    }

    onSelectType(e: any, type: number) {
        App.AudioManager.playBtnClick();
        const self = this;
        self.type = Number(type);
        this.params = { codeType: self.type };
        this.content.removeAllChildren();

        this._model?.getCodeWashAmount(this.params)
            .then((response: any) => {
                console.log("获取到的数据:", response);
                self.rebateRate.string = (response.data.washRate || "0") + "%";
                self.totalRebate.string = response.data.totalRebate || "0";
                self.rebate.string = response.data.codeWashAmount || "0.00";

                if (response.data.washList) {
                    for (let i = 0; i < response.data.washList.length; i++) {
                        const element = response.data.washList[i];
                        const prefab = instantiate(self.item);
                        if (prefab) {
                            const item = prefab.getComponent('yd_bonus_bet_back_item') as any;
                            if (item) {
                                item.datasource = element;
                                if (e && e.target) {
                                    const gameTypeLabel = e.target.children[0]?.children[1]?.getComponent(Label);
                                    if (gameTypeLabel) {
                                        item.datasource.gameType = gameTypeLabel.string;
                                    }
                                }
                                self.content.addChild(item.node);
                            }
                        }
                    }
                }
            })
            .catch((error: any) => {
                console.error("发生错误:", error);
            });
    }

    onOneClickRebate() {
        App.AudioManager.playBtnClick();
        const params = { codeType: this.type };
        // @ts-ignore
        App.HttpUtils.sendPostRequest("AddCodeWashRecord", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                console.log("响应结果:", response);
                // @ts-ignore
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }
}
