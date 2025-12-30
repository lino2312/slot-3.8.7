import { _decorator, Component, Label, ScrollView, Node, EditBox, Prefab, instantiate, Toggle } from 'cc';
import { ReferModel } from './ReferModel';
import { App } from '../App';
import { ComponentUtils } from '../utils/ComponenUtils';
const { ccclass, property } = _decorator;

@ccclass('MyReferralsView')
export class MyReferralsView extends Component {

    @property(Label) totalReferrals: Label = null!;
    @property(Label) todayReferrals: Label = null!;
    @property(ScrollView) scrollView: ScrollView = null!;
    @property(Node) classList: Node = null!;
    @property(EditBox) editBox: EditBox = null!;
    @property(Label) rechargeNumber: Label = null!;
    @property(Label) rechageAmount: Label = null!;
    @property(Label) numberbettors: Label = null!;
    @property(Label) betAmount: Label = null!;
    @property(Label) firstRechargesC: Label = null!;
    @property(Label) firstDepositAmount: Label = null!;
    @property(Node) content: Node = null!;
    @property(Prefab) item: Prefab = null!;
    @property(Label) pageLab: Label = null!;
    @property(Label) statusLab: Label = null!;
    @property(Label) dateLab: Label = null!;
    @property(Node) itemTmpContent: Node = null!;
    @property(Node) itemTmp: Node = null!;
    @property(Node) toggleContainer: Node = null!;

    private _model: ReferModel | null = null;
    private params: any = {};
    private datasource: any = null;
    private dateObj = { year: 0, month: 0, day: 0 };
    private next = false;
    private currentTab = 1; 

    onLoad() {
        this.currentTab = 0;
        this.onToggleSelect(null, '1');
        console.log("onLoad MyReferralsView");
    }

    /**
     * @param e 点击事件（Toggle自带）
     * @param indexStr '1' 或 '-1'
     */
    async onToggleSelect(e: Event | null, indexStr: string) {
        const idx = Number(indexStr);
        // if (idx === this.currentTab) return; 
        if (e !== null && idx === this.currentTab) return;
        this.currentTab = idx;

        const toggles = this.toggleContainer.getComponentsInChildren(Toggle);
        toggles.forEach((t) => {
            const isActive = (t.node.name === 'toggle1' && idx === 1) ||
                             (t.node.name === 'toggle2' && idx === -1);
            if (t.isChecked !== isActive) t.isChecked = isActive;
        });

        if (idx === 1) {
            await this.referals();
        } else {
            await this.friendsReferals();
        }
    }

    async referals() {
        this.itemTmpContent.removeAllChildren();
        try {
            const data = await App.ApiManager.referals();
            console.log('referals data:', data);

            this.totalReferrals.string = String(data.totalCountReferrals || 0);
            this.todayReferrals.string = String(data.todayCountReferrals || 0);

            const array = data.refferalPageDatas?.list || [];
            for (const element of array) {
                const item = instantiate(this.itemTmp);
                ComponentUtils.setLabelString('uid', item, element.userId);
                ComponentUtils.setLabelString('date', item, element.lastTime);
                ComponentUtils.setLabelString('cash', item, element.totalCash);
                ComponentUtils.setLabelString('bouns', item, element.totalBonus);

                const btnDetails = item.getChildByName('Details');
                if (btnDetails) {
                    btnDetails.on('click', () => this.showBonusDetails(Number(element.userId)), this);
                }

                item.parent = this.itemTmpContent;
                item.active = true;
            }
        } catch (err) {
            console.error('referals 发生错误:', err);
        }
    }

    async friendsReferals() {
        this.itemTmpContent.removeAllChildren();
        try {
            const data = await App.ApiManager.friendsReferals();
            const array = data.list || [];
            console.log('friendsReferals data:', array);

            for (const element of array) {
                const item = instantiate(this.itemTmp);
                ComponentUtils.setLabelString('uid', item, element.userId);
                ComponentUtils.setLabelString('date', item, element.lastTime);
                ComponentUtils.setLabelString('cash', item, element.totalCash);
                ComponentUtils.setLabelString('bouns', item, element.totalBonus);

                const btnDetails = item.getChildByName('Details');
                if (btnDetails) {
                    btnDetails.on('click', () => this.showBonusDetails(Number(element.userId)), this);
                }

                item.parent = this.itemTmpContent;
                item.active = true;
            }
        } catch (err) {
            console.error('friendsReferals 发生错误:', err);
        }
    }

    async showBonusDetails(userId: number) {
        try {
            console.log('showBonusDetails userId:', userId);
            const data = await App.ApiManager.bonusDetails(String(userId));
            App.userData().rewardsDetailsOrBonusDetails = 'bonusDetails';
            data.userId = userId;
            App.userData().bonusDetails = data;
            App.PopUpManager.addPopup('prefabs/Refer/MyRewardsViewPre', 'hall', null, true);
        } catch (err) {
            console.error('showBonusDetails 发生错误:', err);
        }
    }
}
