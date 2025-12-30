import { _decorator, Button, Component, isValid, Sprite, SpriteAtlas, SpriteFrame } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('HallAdItemCpt')
export default class HallAdItemCpt extends Component {
    @property(Button)
    button: Button | null = null;
    @property(Sprite)
    icon: Sprite | null = null;
    @property(SpriteAtlas)
    atlas: SpriteAtlas | null = null;
    url: string = "";
    _reqHandle = null;
    set img(value) {
        if (value && value.indexOf('http') > -1) { //网络头像
            App.ResUtils.getRemoteSpriteFrame(value).then((spriteFrame: SpriteFrame) => {
                if (isValid(this.icon) && isValid(this.icon.node)) {
                    if (spriteFrame) {
                        this.icon.spriteFrame = spriteFrame;
                    }
                }
            });

        }
        else {
            let sprF = this.atlas.getSpriteFrame(value);
            if (sprF) {
                this.icon.spriteFrame = sprF;
            } else {
                console.log("ad not image");
            }
        }
    }
    onLoad() {
        var self = this;
        this.button.node.on("click", () => {
            let path = "";
            if (this.url.toLowerCase().includes("firstdeposit")) {
                path = "prefabs/popup/popupFirstRecharge";
            } else if (this.url.toLowerCase().includes("withdrawal")) {
                path = "prefabs/popup/popupWithdraw";
                var fun = function () { }
            } else if (this.url.toLowerCase().includes("makemoney")) {
                var fun = function () { }
            } else if (this.url.toLowerCase().includes("freecash")) {
                path = "BalootClient/Invitation/InvitationView";//没有
            } else if (this.url.toLowerCase().includes("cards")) {
                path = "prefabs/popup/popupCardWeek";
            } else if (this.url.toLowerCase().includes("deposit")) {
                path = "prefabs/popup/popupRecharge";
            } else if (this.url.toLowerCase().includes("service")) {
                path = "prefabs/popup/popupContactUs";
            } else if (this.url.toLowerCase().includes("leaderboard")) {
                path = "prefabs/popup/popupDailyProfitRank";
            } else if (this.url.toLowerCase().includes("vip")) {
                path = "prefabs/popup/popupVIP";
            } else if (this.url.toLowerCase().includes("gift")) {
                path = "prefabs/popup/GiftExchange/GiftExchangeView";
            } else if (this.url.toLowerCase().includes("bonus")) {
                App.GameManager.jumpTo(11.3);
            } else if (this.url.toLowerCase().includes("www") || this.url.toLowerCase().includes("http")) {
                // 跳链接
                var fun = function () {
                    // cc.vv.PlatformApiMgr.openURL(self.url);
                    App.PlatformApiMgr.openURL(self.url);
                }
            }

            if (App.userData().isLogin) {
                if (path) {
                    // cc.vv.PopupManager.addPopup(path)
                    App.PopUpManager.addPopup(path, "hall", null, true);
                } else {
                    fun();
                }
            }
        });

    }


    start() {

    }
    //    // update (dt) {}
}

