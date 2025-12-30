// // 通用奖励组件

import { _decorator, Component, find, instantiate, Node, tween, UIOpacity } from 'cc';
import RewardItemCpt from './RewardItemCpt';
const { ccclass, property, menu } = _decorator;


@ccclass('RewardListCpt')
@menu("UI/奖励列表")
export default class RewardListCpt extends Component {
    //    // 奖励Item
    @property(Node)
    itemNode: Node | null = null;
    //    // 容器节点
    @property(Node)
    contentNode: Node | null = null;
    private nodeMap = {};
    updateView(config, parms?) {
        parms = parms || [];
        // 数据处理
        let tempList = [];
        if (config instanceof Array) {
            tempList = config;
        } else {
            let coin = config.addCoin || config.coin;
            if (coin) {
                tempList.push({ type: 1, count: coin })
            }
            let diamond = config.addDiamond || config.diamond;
            if (diamond) {
                tempList.push({ type: 25, count: diamond })
            }
        }
        // 关闭所有节点
        this.closeAll();
        this.nodeMap = {};
        for (let i = 0; i < tempList.length; i++) {
            let item = tempList[i];
            // for (const item of tempList) {
            if (item.type == 2) {
                this.nodeMap[item.type] = { data: item };
                continue;
            }
            let node = this.contentNode.children[i];
            if (!node) {
                node = instantiate(this.itemNode);
                node.parent = this.contentNode;
            }
            node.active = true;
            // 设置大小
            for (const info of parms) {
                if (info.type == item.type) {
                    if (find("icon", node)) find("icon", node).scale = info.scale;
                    if (find("avatar", node)) find("avatar", node).scale = info.scale;
                    if (find("hddj", node)) find("hddj", node).scale = info.scale;
                }
            }
            this.nodeMap[item.type] = {
                node: node,
                data: item,
                icon: find("icon", node),
                avatar: find("avatar", node),
                hddj: find("hddj", node),
                value: find("value", node),
            };
            node.getComponent(RewardItemCpt).updateView(item);
        }
        return this.nodeMap;
    }
    closeAll() {
        for (let i = 0; i < this.contentNode.children.length; i++) {
            this.contentNode.children[i].active = false;
        }
    }
    showAll() {
        for (let i = 0; i < this.contentNode.children.length; i++) {
            this.contentNode.children[i].active = true;
        }
    }

    runHintAnim(delay: number, padding: number) {
        const children = this.contentNode.children;
        for (let i = 0; i < children.length; i++) {
            const item = children[i];
            item.active = true;
            tween(item).stop();
            const oldPos = item.position.clone();
            item.setPosition(oldPos.x, oldPos.y + 100, oldPos.z);
            let uiOp = item.getComponent(UIOpacity);
            if (!uiOp) {
                uiOp = item.addComponent(UIOpacity);
            }
            uiOp.opacity = 0;

            tween(item)
                .delay(delay + padding * i)
                .to(0.3, {
                    position: oldPos,
                    opacity: 255
                }, { easing: "backOut" })
                .start();
        }
    }



}



