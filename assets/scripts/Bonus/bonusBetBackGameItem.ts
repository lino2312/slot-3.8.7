import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('bonusBetBackGameItem')
export class bonusBetBackGameItem extends Component {

    @property(Node)
    Icon: Node = null!;

    private imgUrl: string = '';
    private gameCode: string = '';
    private _reqHandle: any = null;

    onLoad() {
        console.log("onLoad:", this);

        if (this.imgUrl || this.gameCode) {
            try {
                // @ts-ignore
                cc.vv.ResManager.setSpriteFrame(
                    this.Icon.getComponent(Sprite),
                    `BalootClient/GameIcon/${this.gameCode}`,
                    null,
                    null
                );
            } catch (err) {
                if (this._reqHandle && this._reqHandle.rejectFunc) {
                    this._reqHandle.rejectFunc();
                }

                const url = this.imgUrl;
                // @ts-ignore
                this._reqHandle = cc.vv.ResManager.loadImage(url, (error: any, res: Texture2D) => {
                    if (!error && res) {
                        const spriteFrame = new SpriteFrame(res);
                        this.Icon.getComponent(Sprite).spriteFrame = spriteFrame;
                    }
                    this._reqHandle = null;
                });
            }
        }
    }

    // init(data: any) {
    //     this.data = data;
    // }
}
