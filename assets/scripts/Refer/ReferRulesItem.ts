import { _decorator, Component, Sprite, Label, SpriteFrame, Texture2D, resources } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ReferTeamItem')
export class ReferTeamItem extends Component {

    private _datasource: any = null;

    @property(Sprite)
    lvImg: Sprite = null!;

    @property(Label)
    lv: Label = null!;

    @property(Label)
    TeamNumber: Label = null!;

    @property(Label)
    TeamBetting: Label = null!;

    @property(Label)
    TeamDeposit: Label = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    get datasource() {
        return this._datasource;
    }

    private initItem() {
        const datasource = this._datasource;
        if (!datasource) return;

        const path = `hall/prefabs/Refer/texture/page2/level/L${datasource.lv}`;
        resources.load(path, Texture2D, (err, texture) => {
            if (err) {
                console.error('加载图片出错:', err);
                return;
            }
            const spriteFrame = new SpriteFrame(texture);
            if (this.isValid) {
                this.lvImg.spriteFrame = spriteFrame;
            }
        });

        this.lv.string = `Level ${datasource.lv}`;
        this.TeamNumber.string = String(datasource.lvCount ?? '');
        this.TeamBetting.string = String(datasource.lotteryAmount ?? '');
        this.TeamDeposit.string = String(datasource.rechargeAmount ?? '');
    }
}
