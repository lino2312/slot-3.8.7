import { _decorator, Component, Node, Sprite, SpriteFrame, tween, UITransform } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
const { ccclass, property } = _decorator;

@ccclass('SceneTranslate')
export class SceneTranslate extends Component {
    @property(Node)
    public maskNode = null;
    @property(Sprite)
    public logo = null;
    @property([SpriteFrame])
    public logobg = [];

    onLoad() {
         
        App.ScreenUtils.FixDesignScale_V(this.node, true);



        
        switch (Config.gameChannel) {
            case "D101":
                this.logo.spriteFrame = this.logobg[1];
                break;
            case "D105":
                this.logo.spriteFrame = this.logobg[2];
                break;
            case "D105_2":
                this.logo.spriteFrame = this.logobg[3];
                break;
            case "D106":
                this.logo.spriteFrame = this.logobg[4];
                break;
            case "D107":
                this.logo.spriteFrame = this.logobg[5];
                break;
            default:
                break;
        }
    }

    start() {
        console.log("onstart")
        this.scheduleOnce(() => {
            this.doAnim(null);
        }, 0.2);
    }

    doAnim(endCall: any) {
        this.maskNode.getComponent(UITransform).width = 4000; // TODO: 需要修改为屏幕宽度         
        this.maskNode.getComponent(UITransform).height = 4000;
        tween(this.maskNode)
            .to(0.25, { width: 0, height: 0 })  // TODO: 需要修改为屏幕宽度         
            .call(() => {
                App.SystemUtils.stopAllTimer();
                this.enterHall(endCall);
                App.SubGameManager.existSlotGame();
            }).start();
    }

    enterHall(endCall: any) {
        App.SceneUtils.enterHallScene();
        if (endCall) {
            endCall();
        }
    }
}
