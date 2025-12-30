import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ImageSwithComponent')
export class ImageSwithComponent extends Component {
    @property(Sprite)
    imgSprite: Sprite = null;

    @property({
        type: [SpriteFrame],
        tooltip: "图片列表"
    })
    frames: SpriteFrame[] = [];

    _currIndex: number = 0;

    @property({
        type: Number,
        tooltip: "默认显示图片在列表中的下标"
    })

    get currIndex(): number {
        return this._currIndex;
    }
    set currIndex(value: number) {
        if (this._currIndex == value) {
            return;
        }
        this._currIndex = value;
        this.showSprite();
    }

    onLoad() {
        if (!this.imgSprite) {
            this.imgSprite = this.node.getComponent(Sprite);
        }
        if (this.imgSprite) {
            this.showSprite();
        } else {
            console.log("#error# ImgSwitchCmpTS 找不到 cc.Sprite");
        }
    }

    showSprite() {
        if (this.frames.length > 0) {
            this.imgSprite.spriteFrame = this.frames[this._currIndex];
        }
    }

    showSpriteByName(name: string) {
        if (!name || !this.frames) {
            return;
        }
        for (let i = 0; i < this.frames.length; i++) {
            let frame = this.frames[i];
            if (frame.name == name) {
                this.imgSprite.spriteFrame = frame;
                this._currIndex = i;
            }
        }
    }

    setIndex(index: number) {
        this._currIndex = index;
        this.showSprite();
    }



    getIndex() {
        return this._currIndex;
    }
}


