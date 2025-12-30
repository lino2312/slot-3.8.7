import { _decorator, Component, Label, Node, Prefab, instantiate, Button, Sprite, SpriteFrame } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
import { ComponentUtils } from '../utils/ComponenUtils';
const { ccclass, property } = _decorator;

@ccclass('MyRewardsView')
export class MyRewardsView extends Component {

    @property(Node)
    content: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property(Label)
    cash: Label = null!;

    @property(Label)
    bonus: Label = null!;

    @property(Label)
    welcome: Label = null!;

    @property(Label)
    deposit: Label = null!;

    @property(Label)
    betting: Label = null!;

    @property(Label)
    tax: Label = null!;

    @property(Label)
    current: Label = null!;

    @property(Node)
    lqbtn: Node = null!;

    @property([SpriteFrame])
    lqbtnSp: SpriteFrame[] = [];

    @property(Node)
    itemTmpContent: Node = null!;

    @property(Node)
    itemTmp: Node = null!;

    private _model: ReferModel | null = null;
    private dateObj: { year: number; month: number; day: number } = { year: 0, month: 0, day: 0 };

    onLoad() {
        this.click(null, '0');
    }

    async click(eve: Event | null, index: string) {
        if(eve){
            const toggle = eve.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        this.itemTmpContent.removeAllChildren();
        const idx = Number(index);

        try {
            const data = await App.ApiManager.bonuses(idx);
            this.cash.string = data.totalCash || '0';
            this.bonus.string = data.totalBonus || '0';
            this.welcome.string = data.welcomeBonus || '0';
            this.deposit.string = data.depositBonus || '0';
            this.betting.string = data.bettingBonus || '0';
            this.tax.string = data.taxBonus || '0';
            this.current.string = data.totalClaimableBonus || '0';

            if (idx === 1) {
                const btn = this.lqbtn.getComponent(Button)!;
                const sprite = this.lqbtn.getComponent(Sprite)!;
                btn.interactable = data.totalClaimableBonus === 0 ? false : true;
                sprite.spriteFrame = data.totalClaimableBonus === 0 ? this.lqbtnSp[1] : this.lqbtnSp[0];
            }

            const array = data.bonusPageDatas?.list || [];
            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                const item = instantiate(this.itemTmp);
                // @ts-ignore
                ComponentUtils.setLabelString('date', item, element.addTime);
                // @ts-ignore
                ComponentUtils.setLabelString('cash', item, element.totalCash);
                // @ts-ignore
                ComponentUtils.setLabelString('bouns', item, element.totalBonus);
                const btnDetails = item.getChildByName('Details');
                if (btnDetails) {
                    btnDetails.on('click', () => {
                        this.showBonusDetails(element.addTime);
                    }, this);
                }
                item.parent = this.itemTmpContent;
                item.active = true;
            }
        } catch (err) {
            console.error('bonuses 调用出错:', err);
        }

        this.lqbtn.active = idx === 1;
    }

    async showBonusDetails(date: string) {
        try {
            const data = await App.ApiManager.rewardsDetails(date);
            // @ts-ignore
            App.userData().rewardsDetailsOrBonusDetails = 'rewardsDetails';
            // @ts-ignore
            App.userData().rewardsDetails = data;
            // @ts-ignore
            App.PopUpManager.addPopup('prefabs/Refer/MyRewardsViewPre', 'hall', null, true);
        } catch (err) {
            console.error('showBonusDetails 出错:', err);
        }
    }

    async lingqu() {
        try {
            await App.ApiManager.claimBonuses();
            // @ts-ignore
            App.AlertManager.showFloatTip('Successful');
        } catch (err) {
            console.error('领取奖励出错:', err);
        }
    }

    async onEnable() {
      
    }

    onClickSelectiveDate() {
        // @ts-ignore
        cc.vv.selectDate.show((dateObj: any) => {
            // @ts-ignore
            this.dateLab.string = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
            this.dateObj = dateObj;
            this.onClickSearch();
        }, { type: 0, year: this.dateObj.year, month: this.dateObj.month, day: this.dateObj.day });
    }

    async onClickSearch() {
        this.content.removeAllChildren();
        try {
            const response = await this._model?.getGetCommissionDetails(
                // @ts-ignore
                this.dateLab.string
            );
            console.log('获取到的数据:', response);
            const prefab = instantiate(this.item);
            if (prefab && response?.data) {
                const item = prefab.getComponent('CommissionDetailItem') as any;
                if (item) {
                    item.datasource = response.data;
                    this.content.addChild(item.node);
                }
            }
        } catch (err) {
            console.error('onClickSearch 出错:', err);
        }
    }
}
