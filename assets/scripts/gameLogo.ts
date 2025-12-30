import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { Config } from './config/Config'; 
const { ccclass, property } = _decorator;

@ccclass('ChannelSprite')
export class ChannelSprite extends Component {

    @property({ type: [String] })
    keyList: string[] = [];

    @property({ type: [SpriteFrame] })
    spriteList: SpriteFrame[] = [];

    onLoad() {
        this.updateSprite();
    }

    onValidate() {
        this.updateSprite();
    }

    private updateSprite() {
        const sprite = this.getComponent(Sprite);
        if (!sprite) return;

        const channel = Config.gameChannel;  

        const idx = this.keyList.indexOf(channel);

        if (idx !== -1 && this.spriteList[idx]) {
            sprite.spriteFrame = this.spriteList[idx];
        }
    }
}
