import { _decorator, Component, PageView, Sprite, Label, Node, find } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CardWeek')
export class CardWeek extends Component {
    @property(Label)
    weekTickLabel01: Label = null!;
    @property(Label)
    weekTickLabel02: Label = null!;
    @property(Label)
    weekGetLabel: Label = null!;
    @property(Label)
    weekAll: Label = null!;
    @property(Label)
    weekAll2: Label = null!;
    @property(Label)
    weekSale: Label = null!;
    @property(Label)
    monthTickLabel01: Label = null!;
    @property(Label)
    monthTickLabel02: Label = null!;
    @property(Label)
    monthGetLabel: Label = null!;
    @property(Label)
    monthAll: Label = null!;
    @property(Label)
    monthAll2: Label = null!;
    @property(Label)
    monthSale: Label = null!;

    private datasArray: any[] = [];

    onLoad() {
        const weekButton = find('k1/btn_s02', this.node);
        const monthButton = find('k30/btn_s02', this.node);

        weekButton?.on(Node.EventType.TOUCH_END, this.clickWeekGetBtn, this);
        monthButton?.on(Node.EventType.TOUCH_END, this.clickMonthGetBtn, this);

        this.getPromotionCardsList();
    }

    // goToNextPage() {
    //     this.pageView?.scrollToPage(1, 0.5);
    // }

    // goToPreviousPage() {
    //     this.pageView?.scrollToPage(0, 0.5);
    // }

    async getPromotionCardsList() {
        try {
            if (!App.userData().isLogin) return;
            const ret = await App.ApiManager.getPromotionCardsList();
            console.log("Promotion Cards List:", ret);
            if (Array.isArray(ret) && ret.length > 0) {
                const hasValidCard = ret.some(card => card.cardType === 1 || card.cardType === 2);
                if (hasValidCard) this.updateView(ret);
            }
        } catch (err) {
            console.warn("Failed to get promotion cards list:", err);
        }
    }

    updateView(data: any[]) {
        this.datasArray = data;

        const weekCard = data.find(card => card.cardType === 1);
        const monthCard = data.find(card => card.cardType === 2);

        if (weekCard) {
            this.weekTickLabel01.string = weekCard.bonus.toString();
            this.weekTickLabel02.string = weekCard.dayBonus.toString();
            this.weekGetLabel.string = weekCard.amount.toString();

            const allBonus = (weekCard.dayBonus * weekCard.day) + weekCard.bonus;
            this.weekAll.string = `Priced:${allBonus}`;
            this.weekAll2.string = allBonus.toString();
            this.weekSale.string = `${(weekCard.amount / allBonus * 100).toFixed(2)}%`;
        }

        if (monthCard) {
            this.monthTickLabel01.string = monthCard.bonus.toString();
            this.monthTickLabel02.string = monthCard.dayBonus.toString();
            this.monthGetLabel.string = monthCard.amount.toString();

            const allBonus = (monthCard.dayBonus * monthCard.day) + monthCard.bonus;
            this.monthAll.string = `Priced:${allBonus}`;
            this.monthAll2.string = allBonus.toString();
            this.monthSale.string = `${(monthCard.amount / allBonus * 100).toFixed(2)}%`;
        }
    }

    clickWeekGetBtn() {
        const card = this.datasArray.find(card => card.cardType === 1);
        if (card) this.getPromotionCard(card.id);
    }

    clickMonthGetBtn() {
        const card = this.datasArray.find(card => card.cardType === 2);
        if (card) this.getPromotionCard(card.id);
    }

    async getPromotionCard(id: number) {
        try {
            const ret = await App.ApiManager.getPromotionCards(id);
            console.log("Promotion Card Response:", ret);
        } catch (err) {
            console.warn("Failed to get promotion card:", err);
        }
    }
}