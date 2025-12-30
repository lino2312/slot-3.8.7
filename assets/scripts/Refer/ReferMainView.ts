import { _decorator, Component, Node, Label, Toggle } from 'cc';
import { ReferModel } from './ReferModel';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ReferMainView')
export class ReferMainView extends Component {

    @property(Node)
    content: Node = null!;

    @property(Node)
    urlBox: Node = null!;

    @property([Node])
    appNode: Node[] = [];

    @property(Label)
    url: Label = null!;

    @property(Label)
    shareText: Label = null!;

    @property(Node)
    bg: Node = null!;

    @property(Node)
    ANode: Node = null!;

    @property(Node)
    MList: Node = null!;

    private _url: string = '';
    private index: number | string = '';
    private Telegram: any = null;
    private smedias: any = null;
    private dataList: any[] = [];
    private title: string = 'Join Game';

    async onLoad() {
        this.index = '';

        try {
            const urlData = await App.ApiManager.getUrlAddress();
            this._url = App.status.urlAddress;
            this.url.string = this._url;

            this.Telegram = await App.ApiManager.getSettingByKey('Telegram');

            this.dataList = await App.ApiManager.getCustomerServiceList();

            const rets = App.TransactionData.homeSettings;
            this.smedias = rets;
            console.log('this.smedias: RETS', this.smedias);

            const mediaButtons = [
                { name: 'm_fb', platform: rets.facebookPlatform },
                { name: 'm_youtobe', platform: rets.youtubePlatform },
                { name: 'm_ins', platform: rets.instagramPlatform },
                { name: 'm_telgram', platform: rets.telegramPlatform },
                { name: 'm_wa', platform: rets.whatsappPlatform },
            ];

            for (const btn of mediaButtons) {
                const node = this.node.getChildByPath(`bottom/media_list/layout/${btn.name}`);
                if (node) {
                    node.active = !!btn.platform;
                    if (btn.platform) {
                        node.on('click', () => {
                            // @ts-ignore
                            App.PlatformApiMgr.openURL(btn.platform);
                        });
                    }
                } else {
                    console.warn(`Node not found: ${btn.name}`);
                }
            }

        } catch (err) {
            console.error('onLoad 错误:', err);
        }
    }

    async onClickTab(e: Event, indexStr: string) {
        // const toggle = e.target.getComponent(Toggle);
        // if (!toggle || !toggle.isChecked) return;
        if (e) {
            const target = e.target as unknown as Node;
            const toggle = target.getComponent(Toggle);
            if (toggle && !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        const index = Number(indexStr);
        this.index = index;
        const children = this.content.children;
        for (const element of children) {
            element.active = false;
        }
        if (children[index]) {
            children[index].active = true;
        }
        this.shareText.string =
            index === 0
                ? 'Join agent channel to learn how be a agent and earn much'
                : 'Share referral link to your friends start to earn';

        this.urlBox.active = index !== 0;
        this.bg.active = index === 1;
        this.ANode.active = index !== 0;
        this.MList.active = index === 0;

        for (let j = 0; j < this.appNode.length; j++) {
            const element = this.appNode[j];
            if (App.DeviceUtils.isAndroid()) {
            } else {
                if (element.name === 'SHARE') continue;
            }
            element.active = index === 1 || index === 2 || index === 3 || index === 4;
        }

        try {
            App.status.urlAddress = '';
            await App.ApiManager.getUrlAddress();
            this._url = App.status.urlAddress;
            this.url.string = this._url;
        } catch (err) {
            console.error('获取推广链接失败:', err);
        }


    }

    onClickCopy() {
        // @ts-ignore
        App.PlatformApiMgr.Copy(this._url);
        // @ts-ignore
        App.AlertManager.showFloatTip(('Copy successfully! Share to your friends now!'));
    }

    onClickShare(e: Event, index: string) {
        switch (index) {
            case '0': {
                const shareStr = `${this.title} ${this._url}`;
                // @ts-ignore
                App.PlatformApiMgr.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareStr)}`);
                break;
            }
            case '1': {
                if (!this._url) return;
                // @ts-ignore
                App.PlatformApiMgr.openURL(`https://t.me/share/url?url=${encodeURIComponent(this._url)}`);
                break;
            }
            case '2': {
                // @ts-ignore
                App.PlatformApiMgr.openURL(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this._url)}`
                );
                break;
            }
            case '3': {
                const shareStr = `${this.title} ${this._url}`;
                const data = {
                    title: App.TransactionData.homeSettings.projectName,
                    content: shareStr,
                    imgUrl: ''
                };
                console.log("Share to Friend: System Share - ", JSON.stringify(data));
                App.PlatformApiMgr.systemShare(JSON.stringify(data));
                break;
                break;
            }
        }
    }

    shareCallback(data: any) {
        if (data.result === '-2') {
            // @ts-ignore
            App.AlertManager.showFloatTip('Share failed');
        } else if (data.result === '-10') {
            // @ts-ignore
            App.AlertManager.showFloatTip(('未安装Messager'));
        } else if (data.result === '-11') {
            // @ts-ignore
            App.AlertManager.showFloatTip(('未安装whatsapp'));
        }
    }

    onClickFeedback() {
        App.PopUpManager.addPopup("prefabs/popup/popupContactUs", "hall", null, true);
    }
}
