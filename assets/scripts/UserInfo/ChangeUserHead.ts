import { _decorator, Component, Node, Sprite, instantiate } from 'cc';
import { App } from '../App';

const { ccclass, property } = _decorator;

@ccclass('PopupChangeHead')
export class PopupChangeHead extends Component {

    @property(Sprite)
    previewHead: Sprite = null!;   // 上方预览头像

    @property(Node)
    content: Node = null!;         // ScrollView/content

    @property(Node)
    itemTemplate: Node = null!;    // 这里绑定场景里的 Item 节点

    private headList: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    private currentHead: number = 1;

    onLoad() {

        // 当前用户头像
        this.currentHead = App.userData().userIcon ?? 1;

        // 显示预览头像
        App.ComponentUtils.setHeadFrame(this.previewHead, this.currentHead);

        // 生成头像列表
        this.createList();
    }

    /** 生成头像列表 */
    private createList() {

        // 隐藏模板
        this.itemTemplate.active = false;

        this.content.removeAllChildren();

        this.headList.forEach((id) => {

            // 克隆模板
            const item = instantiate(this.itemTemplate);
            item.active = true;

            const spr =
                item.getChildByName("radio_mask")
                    ?.getChildByName("spr_head")
                        ?.getComponent(Sprite);

            const selectNode =
                item.getChildByName("select");

            // 设置图片
            if (spr) {
                App.ComponentUtils.setHeadFrame(spr, id);
            }

            // 设置选中状态
            if (selectNode) {
                selectNode.active = (id === this.currentHead);
            }

            // 点击事件
            item.on(Node.EventType.TOUCH_END, () => {
                this.onSelect(id);
            });

            this.content.addChild(item);
        });
    }

    /** 点击头像 */
    private onSelect(id: number) {

        this.currentHead = id;

        // 更新预览
        App.ComponentUtils.setHeadFrame(this.previewHead, id);

        // 请求接口更新头像
        // App.ApiManager.updateUserIcon(id);
        App.NetManager.send({ c: App.MessageID.UPDATE_USER_INFO, usericon: id });
        // 刷新选中状态
        this.updateSelectState();
    }

    /** 刷新格子的选中效果 */
    private updateSelectState() {

        this.content.children.forEach((item, i) => {

            const selectNode = item.getChildByName("select");
            const spr =
                item.getChildByName("radio_mask")
                    ?.getChildByName("spr_head")
                        ?.getComponent(Sprite);

            if (selectNode && spr && spr.spriteFrame) {
                const isSelected =
                    this.headList[i] === this.currentHead;

                selectNode.active = isSelected;
            }
        });
    }
}
