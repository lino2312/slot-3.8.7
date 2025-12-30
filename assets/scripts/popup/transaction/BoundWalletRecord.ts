import { _decorator, Component, Node, ScrollView, Label, Button, instantiate, UITransform, Vec3 } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BoundWalletRecord')
export class BoundWalletRecord extends Component {
    @property(ScrollView) scrollView: ScrollView = null!;
    @property(Node) classItem: Node = null!;
    @property(Node) classList: Node = null!;

    @property(Node) popUpMask: Node = null!;
    @property(Node) popUpInfo: Node = null!;
    @property(Label) popUpDateLabel: Label = null!;
    @property(Label) popUpTypeLabel: Label = null!;
    @property(Label) popUpAmountLabel: Label = null!;
    @property(Button) popUpButtonClose: Button = null!;

    private classData: any = null;

    onLoad() {
        // 点击遮罩关闭
        this.popUpMask?.on(Node.EventType.TOUCH_END, this.closePopUp, this);
        this.popUpButtonClose?.node?.on(Button.EventType.CLICK, this.closePopUp, this);

        // 默认隐藏弹层
        if (this.popUpMask) this.popUpMask.active = false;
        if (this.popUpInfo) this.popUpInfo.active = false;
    }

    start() {
        App.ApiManager.getBonusWalletSettings().then((data: any) => {
            this.classData = data;
            const list = data?.bonusWalletChangeRecords?.list || [];
            const itemHeight = 60;
            const spacing = 5;
            const totalItems = list.length;
            const contentHeight = totalItems * (itemHeight + spacing);

            // 填充内容
            this.classList.removeAllChildren();
            for (let i = 0; i < list.length; i++) {
                const element = list[i];
                const item = instantiate(this.classItem);

                // 0: time, 1: type, 2: amount（按原 prefab 子节点顺序）
                const timeLbl = item.children[0]?.getComponent(Label);
                const typeLbl = item.children[1]?.getComponent(Label);
                const amountLbl = item.children[2]?.getComponent(Label);

                timeLbl && (timeLbl.string = String(element.createDateTime ?? ''));
                amountLbl && (amountLbl.string = String(element.amount ?? ''));
                typeLbl && (typeLbl.string = this.truncateText(String(element.bonusTypeStr ?? ''), 13));

                // 点击条目弹出详情
                const btn = item.getComponent(Button);
                const onClick = () => {
                    this.clickItem(
                        String(element.createDateTime ?? ''),
                        String(element.amount ?? ''),
                        String(element.bonusTypeStr ?? ''),
                        item
                    );
                };
                if (btn) {
                    btn.node.on(Button.EventType.CLICK, onClick, this);
                } else {
                    item.on(Node.EventType.TOUCH_END, onClick, this);
                }

                item.parent = this.classList;
                item.active = true;
            }

            // 计算 content 高度（不小于视图高度）
            const listUI = this.classList.getComponent(UITransform);
            const viewUI = this.scrollView?.node.getComponent(UITransform);
            const viewH = viewUI?.contentSize.height ?? contentHeight;
            if (listUI) {
                listUI.setContentSize(listUI.contentSize.width, Math.max(contentHeight, viewH));
            }
        });
    }

    private truncateText(text: string, maxLength: number) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    closePopUp = () => {
        if (this.popUpMask) this.popUpMask.active = false;
        if (this.popUpInfo) this.popUpInfo.active = false;
    };

    clickItem(dateTime: string, amount: string, type: string, item: Node) {
        if (this.popUpDateLabel) this.popUpDateLabel.string = dateTime;
        if (this.popUpAmountLabel) this.popUpAmountLabel.string = amount;
        if (this.popUpTypeLabel) this.popUpTypeLabel.string = type;

        const itemUI = item.getComponent(UITransform);
        const rootUI = this.node.getComponent(UITransform);
        if (itemUI && rootUI && this.popUpInfo) {
            const world = itemUI.convertToWorldSpaceAR(new Vec3(0, 0, 0));
            world.y += 50;
            const local = rootUI.convertToNodeSpaceAR(world);
            this.popUpInfo.setPosition(local);
        }

        if (this.popUpMask) this.popUpMask.active = true;
        if (this.popUpInfo) this.popUpInfo.active = true;
    }
}