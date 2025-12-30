import { _decorator, Component, Node, ScrollView, Label, Button, UITransform, instantiate, Vec3 } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BonusWalletRecord')
export class BonusWalletRecord extends Component {
    @property(ScrollView) scrollView: ScrollView = null!;
    @property(Node) classItem: Node = null!;
    @property(Node) classList: Node = null!;

    @property(Node) popUpInfo: Node = null!;
    @property(Label) popUpDateLabel: Label = null!;
    @property(Label) popUpTypeLabel: Label = null!;
    @property(Label) popUpAmountLabel: Label = null!;
    @property(Button) popUpButtonClose: Button = null!;


    closePopUp() {
        if (this.popUpInfo) this.popUpInfo.active = false;
    }

    onLoad() {
        this.popUpButtonClose?.node.on(Node.EventType.TOUCH_END, this.closePopUp, this);
    }

    private clickItem(dateTime: string, amount: string, type: string, item: Node) {
        if (this.popUpDateLabel) this.popUpDateLabel.string = dateTime || '';
        if (this.popUpAmountLabel) this.popUpAmountLabel.string = amount || '';
        if (this.popUpTypeLabel) this.popUpTypeLabel.string = type || '';

        const world = item.worldPosition.clone();
        world.y += 50;

        const uiTrans = this.node.getComponent(UITransform)!;
        const local = uiTrans.convertToNodeSpaceAR(world);

        this.popUpInfo?.setPosition(new Vec3(local.x, local.y, 0));

        if (this.popUpInfo) this.popUpInfo.active = true;
    }

    start() {
        const data = App.TransactionData.bonusWalletSettings;
        const itemHeight = 60;
        const spacing = 5;
        const list = data.bonusWalletChangeRecords?.list || [];
        const totalItems = list.length;
        const contentHeight = totalItems * (itemHeight + spacing);
        const listTrans = this.classList.getComponent(UITransform)!;
        const viewHeight = this.scrollView.node.getComponent(UITransform)!.height;
        listTrans.height = Math.max(contentHeight, viewHeight);
        const truncateText = (text: string, maxLength: number) =>
            (text || '').length <= maxLength ? (text || '') : (text || '').slice(0, maxLength) + '...';
        for (let i = 0; i < list.length; i++) {
            const rec = list[i];
            const item = instantiate(this.classItem);
            item.children[0]?.getComponent(Label) && (item.children[0].getComponent(Label)!.string = rec.createDateTime || '');
            item.children[2]?.getComponent(Label) && (item.children[2].getComponent(Label)!.string = String(rec.amount ?? ''));
            item.children[1]?.getComponent(Label) && (item.children[1].getComponent(Label)!.string = truncateText(rec.bonusTypeStr || '', 13));
            item.on(Node.EventType.TOUCH_END, () => {
                this.clickItem(rec.createDateTime, String(rec.amount ?? ''), rec.bonusTypeStr || '', item);
            });
            item.parent = this.classList;
            item.active = true;
        }
    }
}