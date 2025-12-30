import { _decorator, Component, Label, Node, EventTouch } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('FreeCash')
export class FreeCash extends Component {
    @property(Label)
    urlLbl: Label = null!;
    @property(Node)
    shareNode: Node = null!;
    private url: string = '';
    private title: string = 'Join the game';

    onLoad() {
        if (App.DeviceUtils.isBrowser()) {
            this.shareNode.active = false;
        } else {
            this.shareNode.active = true;
        }
        this.getUrlAddress();
    }

    async getUrlAddress() {
        try {
            if (!App.userData().isLogin) return;
            await App.ApiManager.getUrlAddress();
            console.log("getUrlAddress:", App?.status?.urlAddress);
            const link = App?.status?.urlAddress || '';
            this.url = link;
            this.urlLbl.string = this.url;
        } catch (err) {
            console.warn("Failed to get UrlAddress:", err);
        }
    }

    onClickShare(e: EventTouch, index: number) {
        const indexStr = Number(index);
        console.log('onClickShare', index);
        console.log('onClickShare Click!');
        this.title = "Join the game";
        const shareStr = `${this.title} ${this.url}`;
        console.log("Share to Friend: STR - ", encodeURIComponent(shareStr));


        switch (indexStr) {
            case 0:  // WhatsApp
                console.log("Share to Friend: WHATSAPP - ", encodeURIComponent(shareStr));
                App.PlatformApiMgr.openURL(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(shareStr)}`
                );
                break;
            case 1:  // Telegram
                if (!this.url) return;
                console.log("Share to Friend: TITLE - ", encodeURIComponent(this.title));
                console.log("Share to Friend: URL - ", encodeURIComponent(this.url));
                App.PlatformApiMgr.openURL(
                    `https://t.me/share/url?url=${encodeURIComponent(this.url)}`
                );
                break;
            case 2:  // Facebook
                console.log("Share to Friend: Facebook - ", encodeURIComponent(this.url));
                App.PlatformApiMgr.openURL(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url)}`
                );
                break;
            case 3:  // System Share
                const data = {
                    title: App.TransactionData.homeSettings.projectName,
                    content: shareStr,
                    imgUrl: ''
                };
                console.log("Share to Friend: System Share - ", JSON.stringify(data));
                App.PlatformApiMgr.systemShare(JSON.stringify(data));
                break;
        }
    }

    onCopyText() {
        App.AlertManager.showFloatTip("Copied to clipboard successfully!");
        App.PlatformApiMgr.Copy(String(this.url));
    }
}
