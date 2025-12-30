import { _decorator, Component, Node, Label, instantiate } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('Yd_MyRewardsView')
export class Yd_MyRewardsView extends Component {

    @property(Node)
    itemTmpContent: Node = null!;

    @property(Node)
    itemTmp: Node = null!;

    @property(Label)
    lb: Label = null!;

    onLoad() {
        const self = this as any;
        console.log('onLoad: MyRewardsViewPre ', App.userData().rewardsDetailsOrBonusDetails);
        // @ts-ignore
        if (App.userData().rewardsDetailsOrBonusDetails === 'rewardsDetails') {
            // @ts-ignore
            if (!App.userData().rewardsDetails || !App.userData().rewardsDetails.list) {
                console.warn('No rewardsDetails data');
                return;
            }
            // @ts-ignore
            const array = App.userData().rewardsDetails.list;
            console.log('onLoad: rewardsDetails', array);

            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                const item = instantiate(this.itemTmp);
                const children = item.children;

                if (children.length >= 4) {
                    children[0].getComponent(Label)!.string = element.userId ?? '';
                    children[1].getComponent(Label)!.string = element.action ?? '';
                    children[2].getComponent(Label)!.string = element.cash ?? '';
                    children[3].getComponent(Label)!.string = element.bonus ?? '';
                }

                item.parent = this.itemTmpContent;
                item.active = true;
            }
        } 
        // @ts-ignore
        else if (App.userData().rewardsDetailsOrBonusDetails === 'bonusDetails') {
            // @ts-ignore
            if (!App.userData().bonusDetails || !App.userData().bonusDetails.list) {
                console.warn('No bonusDetails data');
                return;
            }
            // @ts-ignore
            const array = App.userData().bonusDetails.list;
            console.log('onLoad: bonusDetails', array);

            this.lb.string = 'Date';

            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                const item = instantiate(this.itemTmp);
                const children = item.children;

                if (children.length >= 4) {
                    // @ts-ignore
                    children[0].getComponent(Label)!.string = App.userData().bonusDetails.userId ?? '';
                    children[1].getComponent(Label)!.string = element.addTime ?? '';
                    children[2].getComponent(Label)!.string = element.cash ?? '';
                    children[3].getComponent(Label)!.string = element.bonus ?? '';
                }

                item.parent = this.itemTmpContent;
                item.active = true;
            }
        }
    }
}
