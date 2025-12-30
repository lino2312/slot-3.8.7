import { _decorator, Component, Node, Prefab, Label, instantiate } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('LuckyWheelRecord')
export class LuckyWheelRecord extends Component {
    @property(Node) content: Node = null!;
    @property(Prefab) item: Prefab = null!;

    async onLoad() {
        App.ApiManager.luckyWheelRecords().then((data: any) => {
            const list = data?.data?.list || [];
            this.content?.removeAllChildren();
            for (let i = 0; i < list.length; i++) {
                const rec = list[i];
                const row = instantiate(this.item);
                // children[0] -> date
                row.children[0]?.getComponent(Label) && (row.children[0].getComponent(Label)!.string = rec.date || rec.drawTime || '');
                // children[1] -> type
                row.children[1]?.getComponent(Label) && (row.children[1].getComponent(Label)!.string = rec.type || '');
                // children[2] -> reward
                row.children[2]?.getComponent(Label) && (row.children[2].getComponent(Label)!.string = String(rec.reward ?? rec.rewardAmount ?? ''));
                row.parent = this.content;
                row.active = true;
            }
        }).catch((error: any) => {
            console.warn('LuckyWheelRecord load error:', error);
        });
    }

    start() { }
}