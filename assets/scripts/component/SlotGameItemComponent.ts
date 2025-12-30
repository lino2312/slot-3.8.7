import { _decorator, Component, Node, Sprite } from 'cc';
import { App } from 'db://assets/scripts/App';
import { JackpotPrizePool } from '../widget/JackpotPrizePool';
import { Config } from 'db://assets/scripts/config/Config';
const { ccclass, property } = _decorator;

@ccclass('SlotGameItemComponent')
export class SlotGameItemComponent extends Component {

    @property(Node)
    favoriteNode: Node = null;

    @property(Sprite)
    icon: Sprite = null;

    @property(Node)
    jackpotNode: Node = null;

    private gameId: number = 0;

    start() {

    }

    update(deltaTime: number) {

    }

    init(gameId: number) {
        this.gameId = gameId;
        let favoriteGames = App.GameManager.getFavoriteGames();

        this.setFavorite(false);
        //检查是否收藏
        for (let favoriteGame of favoriteGames) {
            if (favoriteGame.gameCode == gameId) {
                this.setFavorite(true);
                break;
            }
        }

        let gameName = App.GameManager.getGameName(this.gameId).trim();
        // App.CacheUtils.getSlotSpriteFrameCached(gameName).then((spr) => {
        //     this.icon.spriteFrame = spr;
        // }).catch((err) => {
        //     console.warn(err);
        // });
        console.log("gameName",gameName)
        App.ResUtils.getSpriteFrameFromCommonBundle(`image/game/icon/${gameName}/spriteFrame`)
            .then((spr) => {
                this.icon.spriteFrame = spr;
            })
            .catch((err) => {
                console.warn(err);
            });
        this.jackpotNode.getComponent(JackpotPrizePool).init(this.gameId);
    }

    async onClickGame() {
        if (this.gameId >= 9999) {
            return
        }
        const pGameUrl = await App.ApiManager.getGameUrl(String(this.gameId));
           console.log("本地游戏进人url：",pGameUrl)
        if (pGameUrl.msg == "Succeed") {
            App.GameManager.EnterGame(this.gameId, null)
            
        } else {
            App.AlertManager.showFloatTip(pGameUrl.msg);
        }
    }

    onclickFavorite() {
        let sprite = this.favoriteNode.getComponent(Sprite);
        let spriteName = sprite.spriteFrame.name;
        if (spriteName.includes("01")) {
            this.setFavorite(false);
        } else {
            this.setFavorite(true);
        }
    }

    setFavorite(bFavorite: boolean) {
        let sprite = this.favoriteNode.getComponent(Sprite);
        let path = bFavorite ? "plist/Slot/icon_01" : "plist/Slot/icon_02";
        App.ResUtils.getSpriteFrameFormAtlas(path)
            .then((spr) => {
                sprite.spriteFrame = spr;
            })
            .catch((err) => {
                console.warn(err);
            });
    }
}


