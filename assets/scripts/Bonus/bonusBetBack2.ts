import { _decorator, Component, Label, Node, Prefab, instantiate, find } from 'cc';
import { yd_bonus_model } from './bonusModel';
import { App } from '../App';
import { Config } from '../config/Config';
const { ccclass, property } = _decorator;

@ccclass('bonusBetBack2')
export class yd_bonus_bet_back_2 extends Component {

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

    private _model: yd_bonus_model | null = null;
    private params: any = {};
    private type: number = 0;

    onLoad() {
        this.node.height = this.node.parent?.parent?.height || this.node.height;
        this._model = yd_bonus_model.getInstance();
        this.onSelectType(null, 0);
        this.type = 0;

        // @ts-ignore
        if (Config.gameChannel === "D107" || Config.gameChannel === "D105") {
            const video = find("topTab/view/content/Toggle3", this.node);
            const sports = find("topTab/view/content/Toggle4", this.node);
            if (video && sports) {
                video.active = false;
                sports.active = false;
            }
        }
    }

    onEnable() { }

    onSelectType(e: Event | null, type: number) {
        if (e) {
            const toggle = e.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        this.type = Number(type);
        this.params = { codeType: this.type };
        this.content.removeAllChildren();

        this._model?.getCodeWashAmount(this.params)
            .then((response: any) => {
                console.log("获取到的数据:", response);
                this.rebateRate.string = (response.data.washRate || "0") + "%";
                this.totalRebate.string = response.data.totalRebate || "0";
                this.rebate.string = response.data.codeWashAmount || "0.00";

                if (response.data.washList) {
                    for (let i = 0; i < response.data.washList.length; i++) {
                        const element = response.data.washList[i];
                        const prefab = instantiate(this.item);
                        if (prefab) {
                            const item = prefab.getComponent('bonusBetBackItem') as any;
                            if (item) {
                                item.datasource = element;
                                this.content.addChild(item.node);
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
                if (response.data.washList) {
                    for (let i = 0; i < response.data.washList.length; i++) {
                        const element = response.data.washList[i];
                        const prefab = instantiate(this.item);
                        if (prefab) {
                            const item = prefab.getComponent('bonusBetBackItem') as any;
                            if (item) {
                                item.datasource = element;
                                this.content.addChild(item.node);
                            }
                        }
                    }
                }
            }
        });
    }
}
