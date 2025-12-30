import { _decorator, Component, Sprite, Label, SpriteFrame, Texture2D, resources } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ReferPage4Item')
export class ReferPage4Item extends Component {

    private _datasource: any = null;

    @property(Sprite)
    icon: Sprite = null!;

    @property(Sprite)
    icon01: Sprite = null!;

    @property(Label)
    gameName: Label = null!;

    @property(Label)
    gameName01: Label = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    get datasource() {
        return this._datasource;
    }

    private initItem() {
        const nameObj: Record<number, string> = {
            1: 'Lottery',
            2: 'Slot',
            3: 'Live',
            4: 'Sport',
            5: 'xiaoyouxi',
            6: 'Rummy',
        };

        const self = this;
        const type = self._datasource?.type;
        if (!type) return;

        const loadIcon = (path: string, target: Sprite) => {
            resources.load(path, Texture2D, (err, texture) => {
                if (err) {
                    console.error('加载图片出错:', err);
                    return;
                }
                const spriteFrame = new SpriteFrame(texture);
                if (self.isValid) {
                    target.spriteFrame = spriteFrame;
                }
            });
        };

        loadIcon(`hall/prefabs/Refer/texture/page4/icon/${type}`, this.icon);
        loadIcon(`hall/prefabs/Refer/texture/page4/icon/0${type}`, this.icon01);

        const name = nameObj[type] || '';
        this.gameName.string = name;
        this.gameName01.string = name;
    }

    onClick() {
        if (this._datasource && this._datasource.cb) {
            this._datasource.cb(this._datasource.type);
        }
    }
}
