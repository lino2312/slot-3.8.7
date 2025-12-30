import { _decorator, Component, Node, Prefab, instantiate, RichText, tween, Tween } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
const { ccclass, property } = _decorator;

@ccclass('ReferPage5')
export class ReferPage5 extends Component {

    @property(Node)
    itemContent: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property([RichText])
    lab: RichText[] = [];

    private _model: ReferModel | null = null;
    private moveDuration: number = 0;
    private moveDistance: number = 0;

    onEnable() {
        const self = this;
        this._model = ReferModel.getInstance();

        // 获取返佣比例
        this._model ?.getPromotionTutorial()
            .then((response: any) => {
                console.log('getPromotionTutorial: response', response);
                const rebateLevels = response.data.dianzilist[0].rebateLevels;
                this.lab[0].string = `<color=#ced563>${Number(rebateLevels[0].amount).toFixed(3)}%</c><color=#ffffff> of his bet to your </color><color=#ced563>Cash</color>`;
                this.lab[1].string = `<color=#ced563>${Number(rebateLevels[1].amount).toFixed(3)}%</c><color=#ffffff> of his bet to your </color><color=#ced563>Cash</color>`;
                this.lab[2].string = `<color=#ced563>${Number(rebateLevels[2].amount).toFixed(3)}%</c><color=#ffffff> of his bet to your </color><color=#ced563>Cash</color>`;
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });

        this.itemContent.setPosition(this.itemContent.position.x, 100);
        if (this.itemContent.children.length) {
            this.itemContent.destroyAllChildren();
        }

        for (let i = 0; i < 3; i++) {
            const prefab = instantiate(this.item);
            if (prefab) {
                this.itemContent.addChild(prefab);
            }
        }

        if (3 > 2) {
            this.moveDuration = 1 * 3;
            this.moveDistance = 1 * 120 + 20;

            tween(this.itemContent)
                .to(this.moveDuration, { position: { x: this.itemContent.position.x, y: this.itemContent.position.y + this.moveDistance } })
                .call(() => {
                    this.moveNode();
                })
                .start();
        }
    }

    onClick() {
        this._model ?.getRechargeManageRewardList()
            .then((response: any) => {
                console.log('获取到的数据:', response);
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    private moveNode() {
        Tween.stopAllByTarget(this.itemContent);
        if (this.isValid) {
            this.itemContent.setPosition(this.itemContent.position.x, 100);
            tween(this.itemContent)
                .to(this.moveDuration, { position: { x: this.itemContent.position.x, y: this.itemContent.position.y + this.moveDistance } })
                .call(() => {
                    this.moveNode();
                })
                .start();
        }
    }

    onDisable() {
        this.itemContent.destroyAllChildren();
        Tween.stopAllByTarget(this.itemContent);
    }
}
