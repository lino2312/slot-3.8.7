import { _decorator, Component, find, instantiate, Node } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('CarouselIndicatorCpt')
export default class CarouselIndicatorCpt extends Component {
    @property(Node)
    item: Node | null = null;
    itemList: Node[] = [];
    onLoad() {
    }
    initPage(cnt) {
        for (let i = 0; i < cnt; i++) {
            if (this.itemList[i]) {

            } else {
                let node = instantiate(this.item);
                node.parent = this.node;
                node.active = true;
                this.itemList.push(node);
            }
        }
    }
    showPage(pageIdx) {
        this.node.active = this.itemList.length >= 2;

        this.itemList.forEach((node, idx) => {
            find("select", node).active = idx == pageIdx;
        })
    }
}

