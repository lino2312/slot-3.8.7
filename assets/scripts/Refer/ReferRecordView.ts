import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
const { ccclass, property } = _decorator;

@ccclass('ReferRecordView')
export class ReferRecordView extends Component {

    @property(Node)
    topContent: Node = null!;

    @property(Node)
    itemContent: Node = null!;

    @property(Prefab)
    tab: Prefab = null!;

    @property(Prefab)
    item: Prefab = null!;

    private _model: ReferModel | null = null;
    private datasource: any = null;

    onLoad() {
        this.node.height = this.node.parent?.parent?.height ?? this.node.height;
    }

    onEnable() {
        this._model = ReferModel.getInstance();
        this._model?.getPromotionTutorial()
            .then((response: any) => {
                console.log('获取到的数据:', response);
                this.datasource = response.data;
                this.onAddTab();
                this.onAddItem(1);
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    private onAddTab() {
        if (this.topContent.children.length) {
            this.topContent.removeAllChildren();
        }

        const datasource = this.datasource;
        if (!datasource) return;

        for (const key in datasource) {
            if (
                datasource.hasOwnProperty(key) &&
                datasource[key].length > 0 &&
                datasource[key][0].type !== this._model!.gameTypeEnum.XIAOYOUXI
            ) {
                const prefab = instantiate(this.tab);
                if (prefab) {
                    const item = prefab.getComponent('ReferRecordToggleItem') as any;
                    if (item) {
                        item.datasource = {
                            type: datasource[key][0].type,
                            cb: (type: number) => this.onAddItem(type),
                        };
                        this.topContent.addChild(item.node);
                    }
                }
            }
        }
    }

    private onAddItem(type: number) {
        const datasource = this.datasource;
        if (!datasource) return;

        for (const key in datasource) {
            if (
                datasource.hasOwnProperty(key) &&
                datasource[key].length > 0 &&
                datasource[key][0].type === type
            ) {
                const children = this.itemContent.children;
                for (let i = 0; i < datasource[key].length; i++) {
                    const element = datasource[key][i];
                    setTimeout(() => {
                        if (!this.isValid) return;
                        let prefab: Node | null = null;

                        if (children[i]) {
                            prefab = children[i];
                        } else {
                            prefab = instantiate(this.item);
                            this.itemContent.addChild(prefab);
                        }

                        if (prefab) {
                            const item = prefab.getComponent('ReferRecordItem') as any;
                            if (item) {
                                item.datasource = element;
                            }
                        }
                    }, 50);
                }

                for (let j = 0; j < children.length; j++) {
                    const el = children[j];
                    el.active = j < datasource[key].length;
                }
            }
        }
    }

    onDisable() {
        this.itemContent.destroyAllChildren();
        this.topContent.destroyAllChildren();
    }
}
