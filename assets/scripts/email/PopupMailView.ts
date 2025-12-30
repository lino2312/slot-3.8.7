import {
    _decorator,
    Component,
    Node,
    Button,
    Label,
    Prefab,
    Sprite,
    SpriteFrame,
    instantiate,
    assetManager,
    UITransform,
    find,
} from 'cc';
import { App } from '../App';
import { Tabbar, TabbarItem } from '../widget/Tabbar';

const { ccclass, property } = _decorator;

@ccclass('PopupMailView')
export class PopupMailView extends Component {

    @property(Tabbar)
    tabbar: Tabbar = null!;

    @property(Node)
    content: Node = null!; // ScrollView 下的 content

    @property(Node)
    mailItemTemplate: Node = null!; // mail_item 模板

    @property(Button)
    collectButton: Button = null!;

    @property(Button)
    deleteButton: Button = null!;

    @property(Node)
    noDataNode: Node = null!;

    private listData: any[] = [];
    private isLoading = false;

    onLoad() {
        this.deleteButton.node.on(Button.EventType.CLICK, this.onClickDeleteAll, this);
        this.collectButton.node.on(Button.EventType.CLICK, this.onClickCollectAll, this);

        this.tabbar.setChangeCallback((index, tab, tabs) => {
            this.onTabbarChange(index, tab, tabs);
        });
    }

    start() {
        this.API();
        App.EventUtils.on("refreshMail", this.API, this);
    }


    onDestroy() {
        App.EventUtils.off("refreshMail", this.API, this);
    }

    /** ✅ 获取邮件列表 */
    private API() {
        App.ApiManager.getMessageList().then((data: any) => {
            this.listData = data.list || [];
            const unreadCount = this.listData.filter(mail => mail.stateName === "unread").length;
            App.RedHitManager.setKeyVal("mail_notify_yacai", unreadCount);
            this.renderMailList();
        });
    }

    /** ✅ 渲染邮件列表 */
    private renderMailList() {
        this.content.removeAllChildren(); // 清空旧数据



        // ✅ 遍历邮件数据生成节点
        this.listData.forEach((mailData, index) => {
            const mailItem = instantiate(this.mailItemTemplate);
            mailItem.active = true;

            // --- 标题 ---
            const lblTitle = mailItem.getChildByPath('lbl_title')?.getComponent(Label);
            if (lblTitle) lblTitle.string = mailData.title || 'No Title';

            // --- 时间 ---
            const lblTime = mailItem.getChildByPath('lbl_time')?.getComponent(Label);
            if (lblTime) lblTime.string = mailData.addTime || '';

            // --- 红点 ---
            const redNode = mailItem.getChildByPath('red');
            if (redNode) redNode.active = mailData.stateName === 'unread';

            // --- 奖励邮件 ---
            const rewardNode = mailItem.getChildByPath('bg_email_info_3');
            if (rewardNode) rewardNode.active = mailData.type === 3 && mailData.mailReward;

            // --- 图标 ---
            // const iconSprite = mailItem.getChildByPath('icon')?.getComponent(Sprite);
            // if (iconSprite) {
            //     const iconPath = mailData.type === 3
            //         ? "BalootClient/NewEmail/gift box" 
            //         : "image/NewEmail/icon_email_gift";
            //     assetManager.loadAny({ url: iconPath, ext: '.png' }, (err, sf: SpriteFrame) => {
            //         if (!err) iconSprite.spriteFrame = sf;
            //     });
            // }

            if (mailData.mailReward && mailData.mailReward.amount) {
                const coinLbl = find("bg_email_info_3/coinLbl", mailItem)?.getComponent(Label);
                const claimedNode = find("bg_email_info_3/mask", mailItem); // 已领取图标节点
                console.log("mailData.claimStatus", mailData.claimStatus)
                // 判断是否金币已领取
                if (mailData.claimStatus === 1) {

                    // 已领取：隐藏金币数量，显示已领取图标
                    if (coinLbl) coinLbl.node.active = false;
                    if (claimedNode) claimedNode.active = true;
                } else {
                    // 未领取：显示金币数量，隐藏已领取图标
                    if (coinLbl) {
                        coinLbl.node.active = true;
                        coinLbl.string = mailData.mailReward.amount;
                    }
                    if (claimedNode) claimedNode.active = false;
                }
            }

            // --- 点击事件 ---
            mailItem.on(Node.EventType.TOUCH_END, () => {
                this.onClickMail(mailData);
            });

            // --- 添加到 Content ---
            this.content.addChild(mailItem);

            if (!this.listData || this.listData.length === 0) {
                this.noDataNode.active = true;
                return;
            }

            this.noDataNode.active = false;
        });
    }

    /** ✅ 点击单个邮件 */
    public onClickMail(mailData: any) {
        if (!mailData) {
            console.warn("[PopupMailView] 没有找到邮件数据");
            return;
        }

        // 如果是未读邮件 → 先标记为已读
        if (mailData.stateName === "unread") {
            App.HttpUtils.sendPostRequest("SetOneMessageState", { MessageId: mailData.messageID, State: 1 }, (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (res.code === 0) {
                    // 更新红点
                    App.EventUtils.dispatchEvent("refreshMail", mailData);
                } else {
                    App.AlertManager.showFloatTip(res?.msg || "Failed to set state");
                }
            });
        }

        App.PopUpManager.addPopup("prefabs/Email/PopupMailInfo", "hall", null, true);
        App.userData().mailData = mailData;
    }



    /** ✅ 一键领取所有 */
    private async onClickCollectAll() {
        if (this.isLoading) return;
        this.isLoading = true;

        const unreadMails = this.listData.filter(m => m.type === 3 && m.stateName === "unread" && m.claimStatus === 0);
        if (unreadMails.length === 0) {
            App.AlertManager.showFloatTip("No mails to collect");
            this.isLoading = false;
            return;
        }

        for (const mailData of unreadMails) {
            try {
                await App.ApiManager.claimMailReward(mailData.messageID);
                App.EventUtils.dispatchEvent("refreshMail", mailData);
            } catch {
                App.AlertManager.showFloatTip("Claimed Successfully");
            }
        }

        this.isLoading = false;
        this.API();
    }

    /** ✅ 一键删除所有 */
    private onClickDeleteAll() {
        if (this.isLoading) return;
        this.isLoading = true;

        App.HttpUtils.sendPostRequest("SetAllMessageState", { State: 2 }, (err, res) => {
            this.isLoading = false;
            if (err) {
                console.error(err);
                return;
            }
            if (res.code === 0) {
                this.listData = [];
                this.renderMailList();
                App.EventUtils.dispatchEvent("refreshMail");
            } else {
                App.AlertManager.showFloatTip(res.msg);
            }
        });
    }

    private onTabbarChange(index: number, tab: TabbarItem, tabs: TabbarItem[]) {
        if (index === 1 || index === 2) {
            this.noDataNode.active = true;
            this.content.active = false;
            return;
        }
        this.content.active = true;
        this.renderMailList();
    }
}
