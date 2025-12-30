import { _decorator, Component, Node, Prefab, Label, instantiate } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

interface RankData {
    rankId: string;
    userId: string;
    effectiveBet: string;
    prize: string;
}

@ccclass('Ranking')
export class Ranking extends Component {
    
    @property(Label)
    public pages: Label = null!;
    @property(Node)
    public content: Node = null!;
    @property(Prefab)
    public rankItem: Prefab = null!;

    public datasource: RankData[] | null = null;
    private index: number = 0;

    onLoad() {
        this.index = 0;
        if (this.datasource) {
            this.pages.string = `1/${Math.ceil(this.datasource.length / 20)}`;
            const arr = this.datasource.slice(0, 20);
            for (let element of arr) {
                const prefab = instantiate(this.rankItem);
                if (prefab) {
                    prefab.children[0].getComponent(Label)!.string = element.rankId;
                    prefab.children[1].getComponent(Label)!.string = element.userId;
                    prefab.children[2].getComponent(Label)!.string = element.effectiveBet;
                    prefab.children[3].getComponent(Label)!.string = element.prize;
                    this.content.addChild(prefab);
                }
            }
        }
    }

    public onClick(e: Event, index: string) {
        if (!this.datasource) return;
        const i = Number(index);
        if ((this.index + i) < 0) return;

        const start = (this.index + i) * 20;
        const end = start + 20;
        const arr = this.datasource.slice(start, end);

        if (arr.length) {
            this.index += i;
            this.pages.string = `${this.index + 1}/${Math.ceil(this.datasource.length / 20)}`;

            for (let j = 0; j < 20; j++) {
                const element = arr[j];
                const node = this.content.children[j];
                if (node) node.active = false;

                if (node && element) {
                    node.children[0].getComponent(Label)!.string = element.rankId;
                    node.children[1].getComponent(Label)!.string = element.userId;
                    node.children[2].getComponent(Label)!.string = element.effectiveBet;
                    node.children[3].getComponent(Label)!.string = element.prize;
                    node.active = true;
                } else if (element) {
                    const prefab = instantiate(this.rankItem);
                    if (prefab) {
                        prefab.children[0].getComponent(Label)!.string = element.rankId;
                        prefab.children[1].getComponent(Label)!.string = element.userId;
                        prefab.children[2].getComponent(Label)!.string = element.effectiveBet;
                        prefab.children[3].getComponent(Label)!.string = element.prize;
                        this.content.addChild(prefab);
                    }
                }
            }
        }
    }

    onClose() {
        const popupNode = this.node;
        App.PopUpManager.closePopup(popupNode);
    }
}
