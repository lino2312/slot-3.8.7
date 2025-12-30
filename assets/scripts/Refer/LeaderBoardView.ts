import { _decorator, Component, find, instantiate, Label, Node, Prefab, Sprite, Toggle } from 'cc';
import { App } from '../App';
import { ReferModel } from './ReferModel';
const { ccclass, property } = _decorator;

@ccclass('LeaderBoard')
export class LeaderBoard extends Component {

    @property(Label)
    totalBonus: Label = null!; // 总奖金

    @property(Label)
    date: Label = null!;

    @property(Node)
    one: Node = null!;

    @property(Node)
    two: Node = null!;

    @property(Node)
    three: Node = null!;

    @property(Label)
    myRank: Label = null!;

    @property(Label)
    myPoints: Label = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property(Node)
    content: Node = null!;

    private _model: ReferModel | null = null;
    private datasource: any = null;
    private index: string = '0';
    private isSwitching: boolean = false;

    onEnable() {
        this.index = '0';
        this._model = ReferModel.getInstance();

        this._model?.getLeaderBoard()
            .then((response: any) => {
                console.log('获取到的数据:', response);
                if (response.data) {
                    this.datasource = response.data;
                    this.totalBonus.string = response.data.total || '';
                    this.onClickSelectDate(null, '1');
                }
            })
            .catch((error: any) => {
                console.error('发生错误:', error);
            });
    }

    onClickSelectDate(e: Event | null, date: string) {
        if (this.isSwitching) return;
        if (e) {
            const target = e.target as unknown as Node;
            const toggle = target.getComponent(Toggle);
            if (toggle && !toggle.isChecked) return;
        }
        console.log('onClickSelectDate date:', date);
        this.index = date;

        const toggle1 = find('ToggleContainer/toggle1', this.node)?.getComponent(Toggle);
        const toggle2 = find('ToggleContainer/toggle2', this.node)?.getComponent(Toggle);
        this.isSwitching = true;
        if (toggle1 && toggle2) {
            toggle1.isChecked = (date === '0');
            toggle2.isChecked = (date === '1');
        }
        setTimeout(() => {
            this.isSwitching = false;
        }, 50);
        const datasource = date === '0' ? this.datasource.current : this.datasource.last;
        console.log('datasource: onClickSelectDate', datasource);

        if (!this._model) return;

        const weekDates = this._model.getWeekDates(date);
        this.date.string = `Time Period: ${weekDates.monday} - ${weekDates.sunday}`;
        this.myRank.string = 'Your Rank: ----';
        this.myPoints.string = 'Points: 0';

        const datasource1 = datasource[0] || {};
        const datasource2 = datasource[1] || {};
        const datasource3 = datasource[2] || {};

        this.one.children[2].getComponent(Label)!.string = datasource1.userID || '';
        this.one.children[3].getComponent(Label)!.string = datasource1.betAmount || '';
        this.one.children[4].getComponent(Label)!.string = `Points: ${datasource1.totalCommission || ''}`;

        this.two.children[2].getComponent(Label)!.string = datasource2.userID || '';
        this.two.children[3].getComponent(Label)!.string = datasource2.betAmount || '';
        this.two.children[4].getComponent(Label)!.string = `Points: ${datasource2.totalCommission || ''}`;

        this.three.children[2].getComponent(Label)!.string = datasource3.userID || '';
        this.three.children[3].getComponent(Label)!.string = datasource3.betAmount || '';
        this.three.children[4].getComponent(Label)!.string = `Points: ${datasource3.totalCommission || ''}`;

        const IconHeadPath = 'hall/plist/texture_usercommon';
        // @ts-ignore
        App.ComponentUtils.setSpriteFrame(
            this.one.getChildByName('head_0')!.getComponent(Sprite),
            IconHeadPath,
            'head_1'
        );
        // @ts-ignore
        App.ComponentUtils.setSpriteFrame(
            this.two.getChildByName('head_0')!.getComponent(Sprite),
            IconHeadPath,
            'head_2'
        );
        // @ts-ignore
        App.ComponentUtils.setSpriteFrame(
            this.three.getChildByName('head_0')!.getComponent(Sprite),
            IconHeadPath,
            'head_3'
        );

        this.content.removeAllChildren();
        datasource.sort((a: any, b: any) => (b.betAmount || 0) - (a.betAmount || 0));

        for (let i = 0; i < datasource.length; i++) {
            const element = datasource[i];
            console.log('element: onClickSelectDate', element);

            if (i > 2) {
                const prefab = instantiate(this.item);
                if (prefab) {
                    prefab.children[0].getComponent(Label)!.string = String(i + 1);
                    prefab.children[3].getComponent(Label)!.string = element.userID || '';
                    prefab.children[4].getComponent(Label)!.string = element.betAmount || '';
                    prefab.children[5].getComponent(Label)!.string = element.totalCommission || '';

                    const headIndex = i % 12;
                    const headName = `head_${headIndex}`;
                    const headSprite = prefab.getChildByName('head_0')!.getComponent(Sprite)!;
                    // @ts-ignore
                    App.ComponentUtils.setSpriteFrame(headSprite, IconHeadPath, headName);

                    this.content.addChild(prefab);
                }
            }

            // @ts-ignore
            if (datasource[i].userID === App.userData().userInfo.userId) {
                this.myRank.string = `Your Rank: ${i + 1}`;
                this.myPoints.string = `Points: ${element.betAmount || 0}`;
            }
        }
    }
}
