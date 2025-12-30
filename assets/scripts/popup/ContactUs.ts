import { _decorator, Component, Node, Button, SpriteFrame, Color, Label, instantiate, find, Sprite, ScrollView } from 'cc';
// import { UserData } from '../data/UserData';
import { PlatformApiManager } from '../manager/PlatformApiManager';
import { App } from '../App';
import { ComponentUtils } from '../utils/ComponenUtils';
import { ImageSwithComponent } from '../component/ImageSwithComponent';
const { ccclass, property } = _decorator;

@ccclass('ContactUs')
export class ContactUs extends Component {
    @property(ScrollView)
    listScrollView: ScrollView | null = null;;
    @property(Node)
    itemNode: Node | null = null;
    @property(Button)
    feedbackBtn: Button | null = null;
    @property(Node)
    infoNode: Node | null = null;
    @property(SpriteFrame)
    www_item: SpriteFrame | null = null;
    @property(Node)
    spr_head: Node | null = null;
    @property(Node)
    avatar_frame: Node | null = null;

    private dataList: any[] = [];
    private smedias: any[] = [];

    lblCfg: Record<number, { title: string; desc: string }> = {
        1: { title: 'WhatsApp', desc: 'Tap to message us from WhatsApp' },
        2: { title: 'Telegram', desc: 'Tap to join our Telegram channel' },
        3: { title: 'Online Customer Service', desc: 'Tap to connect customer service 24/7' },
        4: { title: 'Email', desc: 'Tap to send email to support@yonogames.com' },
        5: { title: 'Official Channel', desc: 'Tap to join our Telegram channel' },
        6: { title: 'Telephone', desc: 'Tap to call us to get help' },
        7: { title: 'Complaint', desc: 'Apply, commission, complain' },
        8: { title: 'Call Back', desc: 'Tap to order a call back from us' },
        1000: { title: 'www.yonogames.com', desc: 'Tap to visit our official website' },
    };

    onLoad() {
        if (this.feedbackBtn) {
            App.ComponentUtils.onClick(this.feedbackBtn.node, () => {
                App.PopUpManager.addPopup('prefabs/popup/popupFeedback', 'hall', null, true);
            }, this);
        }
        //  Load player head (from texture_usercommon in hall bundle)
        if (this.spr_head) {
            const headSprite = this.spr_head.getComponent(Sprite);
            if (headSprite) {
                const id = Number(App.userData().userIcon) || 1; // Fallback to head_1 if empty
                ComponentUtils.setHeadFrame(headSprite, id);
            } else {
                console.warn('[ContactUs] spr_head node has no Sprite component.');
            }
        }

        //  Load avatar frame (from hall/image/userInfoBar/headFrame/)
        if (this.avatar_frame) {
            const frameSprite = this.avatar_frame.getComponent(Sprite);
            if (frameSprite) {
                ComponentUtils.setAvatarFrame(frameSprite, App.userData().avatarframe);
            } else {
                console.warn('[ContactUs] avatar_frame node has no Sprite component.');
            }
        }
        ComponentUtils.setLabelString('uid/label', this.infoNode, String(App.userData().userInfo.userId.toString())); //App.status.getUserInfo.userId

        const copyBtn = find('uid/btn_copy', this.infoNode!);
        if (copyBtn) {
            App.ComponentUtils.onClick(copyBtn, () => {
                console.log('COPY:', App.userData().userInfo.userId.toString());
                App.AlertManager.showFloatTip('Copied successfully');
                PlatformApiManager.getInstance().Copy(String(App.userData().userInfo.userId.toString()));
            }, this);
        }
    }

    async start() {
        try {
            const ret = await App.ApiManager.getCustomerServiceList();
            console.log('[ContactUs] Customer Service List:', ret);
            this.dataList = ret.sort((a: any, b: any) => a.sort - b.sort);
            this.populateList();

            const rets = await App.ApiManager.getHomeSettings();
            console.log('[ContactUs] Home Settings:', rets);

            this.smedias = rets;
            console.log('[ContactUs] this.smedias:', this.smedias);

            const mediaButtons = [
                { name: 'm_fb', platform: rets.facebookPlatform },
                { name: 'm_youtobe', platform: rets.youtubePlatform },
                { name: 'm_ins', platform: rets.instagramPlatform },
                { name: 'm_telgram', platform: rets.telegramPlatform },
                { name: 'm_wa', platform: rets.whatsappPlatform },
            ];

            mediaButtons.forEach((btn) => {
                const node = find(`media_list/layout/${btn.name}`, this.node);
                if (node) {
                    node.active = !!btn.platform;
                    if (btn.platform) {
                        node.on(Node.EventType.TOUCH_END, () => {
                            PlatformApiManager.getInstance().openURL(btn.platform);
                        });
                    }
                } else {
                    console.warn(`[ContactUs] Node not found: ${btn.name}`);
                }
            });
        } catch (error) {
            console.warn('[ContactUs] Failed to load data:', error);
        }
    }

    private populateList() {
        const scrollView = this.listScrollView?.getComponent(ScrollView);
        if (!scrollView) {
            console.warn('[ContactUs] listScrollView has no ScrollView component.');
            return;
        }

        const content = scrollView.content;
        if (!content) {
            console.warn('[ContactUs] ScrollView.content is not assigned in the Inspector.');
            return;
        }

        if (!this.itemNode) {
            console.warn('[ContactUs] itemNode template not assigned.');
            return;
        }

        content.removeAllChildren();
        this.dataList.forEach((data, i) => {
            const item = instantiate(this.itemNode);
            item.active = true;
            content.addChild(item);
            this.onUpdateItem(item, i);
        });
    }

    // List item update callback
    onUpdateItem(item: Node, idx: number) {
        const data = this.dataList[idx];
        if (!data) return;

        let imgIdx = data.typeID - 1;
        let desc = data.memo || this.lblCfg[data.typeID]?.desc || '';
        let title = this.lblCfg[data.typeID]?.title || '';
        // let descColor = Color.fromHEX('#A6B0B0', 128);
        let descColor: Color = new Color(166, 176, 176, 255);

        if (data.typeID === 1000) {
            imgIdx = 8;
            descColor = Color.WHITE;
            title = data.url;
        }

        const lbl1 = find('lbl1', item);
        const lbl2 = find('lbl2', item);
        const icon = find('icon', item);

        if (lbl1) lbl1.getComponent(Label)!.string = data.name || title;
        if (lbl2) {
            lbl2.getComponent(Label)!.string = desc;
            lbl2.getComponent(Label)!.color = descColor;
        }

        if (icon) icon.getComponent(ImageSwithComponent)?.setIndex(imgIdx);

        item.off(Node.EventType.TOUCH_END);
        item.on(Node.EventType.TOUCH_END, () => {
            switch (data.typeID) {
                case 1:
                case 2:
                case 3:
                case 5:
                case 7:
                case 1000:
                    if (data.url) PlatformApiManager.getInstance().openURL(data.url);
                    break;
                case 4:
                    if (data.url) {
                        const param = {
                            sender: data.url,
                            title: `MY UID: ${App.userData().userInfo.userId.toString()}`,
                            content: 'Please let us know how can we help!',
                            sendway: 'sendto',
                        };
                        PlatformApiManager.getInstance().SendMail(JSON.stringify(param));
                        // App.AlertManager.getCommonAlert().showWithoutCancel("No SendMail in PlatformApiManager!")
                    }
                    break;
                case 6:
                    if (data.url) PlatformApiManager.getInstance().callPhone(data.url);
                    break;
                case 8:
                    // App.PopUpManager.addPopup('YD_Pro/prefab/yd_call_back', 'hall', null, true);
                    App.AlertManager.getCommonAlert().showWithoutCancel("NO PREFAB FOR CALL BACK!")
                    break;
            }
        });
    }
}
