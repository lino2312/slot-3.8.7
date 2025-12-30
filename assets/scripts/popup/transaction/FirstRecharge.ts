import { _decorator, Component, Node, Prefab, instantiate, Label, Sprite, SpriteFrame, resources, find, EditBox, sys } from 'cc';
import { App } from '../../App';
import { Config } from '../../config/Config';
import { FirstRechargeItem } from './FirstRechargeItem';
const { ccclass, property } = _decorator;


@ccclass('FirstRecharge')
export class FirstRecharge extends Component {
    @property(Label) lbl1: Label = null!;
    @property(Label) lbl2: Label = null!;
    @property(Label) lbl3: Label = null!;

    @property(Prefab) firstItem: Prefab = null!;
    @property(Node) firstNode: Node = null!;
    @property(Node) title: Node = null!;
    @property(EditBox) editbox_recharge: EditBox = null!;

    private currentType = 1;        // Tracks current filter (1, 2, or 3)
    private currentTypeBool = false;
    private opList: any[] = [];     // Stores instantiated item components
    private cachedData: any = null; // Stores API response

    onLoad() {
        this.currentType = 1;
        this.opList = [];
        this.cachedData = null;
        App.ApiManager.getRechargeManageRewardList().then((ret => {
            this.cachedData = ret;
            if (ret?.rewardList?.length > 0) {
                // 根据已领取列表过滤
                if (ret.receiveList?.length === 1) {
                    ret.rewardList = ret.rewardList.filter((item: any) => item.rechargeType !== 1);
                } else if (ret.receiveList?.length === 2) {
                    ret.rewardList = ret.rewardList.filter((item: any) => ![1, 2].includes(item.rechargeType));
                }

                const firstType = ret.rewardList[0].rechargeType;
                this.updateDisplay(ret, firstType);
                this.currentType = firstType;

                // 若为第三档，隐藏两侧按钮
                if (firstType === 3) {
                    const rightBtn = find('ui/SideBtnRight', this.node);
                    const leftBtn = find('ui/SideBtnLeft', this.node);
                    if (rightBtn) rightBtn.active = false;
                    if (leftBtn) leftBtn.active = false;
                }

                this.currentTypeBool = this.currentType === 2;
            }
        }));
    }

    private updateDisplay(ret: any, type: number) {
        this.firstNode?.removeAllChildren();
        this.opList = [];

        const filteredRewards = (ret?.rewardList || []).filter((item: any) => item.rechargeType === type);
        for (const element of filteredRewards) {
            if (!this.firstItem) continue;
            const node = instantiate(this.firstItem);
            const comp = node.getComponent(FirstRechargeItem);
            if (comp?.init) comp.init(element);
            this.opList.push(comp);
            this.firstNode.addChild(node);
        }

        if (this.opList[0]?.onSelect) this.opList[0].onSelect();

        this.updateTitle(type);
    }

    public onRightClick() {
        // 右切换
        if (this.currentTypeBool) {
            this.currentType = this.currentType === 3 ? 2 : 3;
        } else {
            this.currentType = this.currentType === 3 ? 1 : this.currentType + 1;
        }
        this.updateDisplay(this.cachedData, this.currentType);
    }

    public onLeftClick() {
        // 左切换
        if (this.currentTypeBool) {
            this.currentType = this.currentType === 2 ? 3 : 2;
        } else {
            this.currentType = this.currentType === 1 ? 3 : this.currentType - 1;
        }
        this.updateDisplay(this.cachedData, this.currentType);
    }

    private updateTitle(type: number) {
        const titlePath = `image/wallet/firstRecharge/t${type}/spriteFrame`;
        App.ResUtils.getSpriteFrame(titlePath).then((sf => {
            const sp = this.title?.getComponent(Sprite);
            if (sp && sf) {
                sp.spriteFrame = sf;
            }
        }));
    }

    public recharge() {
        const amount = this.editbox_recharge?.string ?? '';
        const url =
            App.TransactionData?.paySendUrl +
            '?tyid=' + App.TransactionData?.payTypeId +
            '&amount=' + amount +
            '&uid=' + App.userData().userInfo?.userId +
            '&sign=' + App.userData().userInfo?.sign +
            '&urlInfo=' + ('https://play.' + Config.domainurl) +
            '&pixelId=&fbcId=';

        sys.openURL(url);
    }

    public other() {
        App.PopUpManager.addPopup("prefabs/popup/popupRecharge", "hall", null, false);
    }
}