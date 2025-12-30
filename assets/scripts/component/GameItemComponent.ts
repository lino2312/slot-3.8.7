import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { App } from 'db://assets/scripts/App';
const { ccclass, property } = _decorator;

@ccclass('GameItemComponent')
export class GameItemComponent extends Component {
    @property(Node)
    favoriteNode: Node = null;

    @property(Sprite)
    icon: Sprite = null;

    @property(Boolean)
    showFavorite: boolean = false;
    @property(SpriteFrame)
    iconSpr: SpriteFrame = null;

    private gameId: string | number;

    private vendorId: string;

    private gameName : string;

    protected onLoad(): void {
        // App.EventUtils.on("GO_ROOMGAME_ID", this.onEventGoGame);
        if (!this.showFavorite) {
            this.favoriteNode.active = false;
        }
    }

    init(gameId: string | number, vendorId: string = "", showFavorite: boolean = true, gameName: string = "", data: any = null, gameHallIndex: number = -1) {
        this.gameId = gameId;
        this.vendorId = vendorId;
        this.gameName = gameName;
        const favoriteGames = App.GameManager.getFavoriteGames();
        this.icon.spriteFrame = this.iconSpr;
        if (this.showFavorite) {
            this.setFavorite(false);
            for (const favoriteGame of favoriteGames) {
                if (favoriteGame.gameCode == gameId) {
                    this.setFavorite(true);
                    break;
                }
            }
        }

        // 3=slot, 5=sport, 6=video, 7=chess, 8=bingo - 使用厂商图标
        if ([3, 5, 6, 7, 8].includes(gameHallIndex) && data?.slotsName) {
            console.log("gameHallIndex",gameHallIndex)
            const slotsName = data.slotsName;
            App.ResUtils.getSpriteFrame(`image/thirdGame/${slotsName}/spriteFrame`)
                .then((spr) => {
                    if (spr) {
                        this.icon.spriteFrame = spr;
                    } else {
                        this.loadDefaultIcon();
                    }
                })
                .catch(() => {
                    this.loadDefaultIcon();
                });
            return;
        }

        // 先尝试加载本地图片
        App.ResUtils.getSpriteFrame(`image/game/icon/${this.gameId}/spriteFrame`)
            .then((spr) => {
                this.icon.spriteFrame = spr;
            })
            .catch(() => {
                // 本地图片加载失败，尝试加载远程图片
                if (data?.img && (data.img.startsWith("http://") || data.img.startsWith("https://"))) {
                    const cacheKey = (this.gameId != null ? String(this.gameId) : "")
                        || (this.gameName ?? "").trim()
                        || (data.gameID != null ? String(data.gameID) : "")
                        || (data.gameNameEn ?? "").trim();
                    const url = (data.img ?? "").trim();
                    if (cacheKey && url) {
                        App.CacheUtils.getThirdGameSpriteFrameCached(cacheKey, url)
                            .then((spr) => {
                                if (spr) {
                                    this.icon.spriteFrame = spr;
                                } else {
                                    this.loadDefaultIcon();
                                }
                            })
                            .catch(() => {
                                this.loadDefaultIcon();
                            });
                    } else {
                        this.loadDefaultIcon();
                    }
                } else {
                    this.loadDefaultIcon();
                }
            });
    }

    private loadDefaultIcon() {
        App.ResUtils.getSpriteFrame("image/game/loading/spriteFrame")
            .then((spr) => {
                this.icon.spriteFrame = spr;
            })
            .catch((err) => {
                console.warn("默认图片加载失败:", err);
            });
    }


    start() {

    }

    update(deltaTime: number) {

    }

    async onClickGame() {
        const gameCode = this.gameId;
        const pGameUrlThird = await App.ApiManager.getGameUrlThird(String(gameCode), this.vendorId);

        if (pGameUrlThird.url) {
            App.SystemUtils.openThirdGame(pGameUrlThird.url);
        }


    }


    onclickFavorite() {
        if (!this.showFavorite) {
            return;
        }
        let sprite = this.favoriteNode.getComponent(Sprite);
        let spriteName = sprite.spriteFrame.name;
        let path = "";
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


