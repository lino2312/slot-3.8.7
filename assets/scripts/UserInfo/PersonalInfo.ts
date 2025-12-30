import {
    _decorator,
    Button,
    Component,
    instantiate,
    Label,
    Node,
    Prefab,
    Sprite,
    SpriteFrame,
} from 'cc';
import { HeadComponent } from 'db://assets/scripts/component/HeadComponent';
import { App } from '../App';
import { HeadPre } from './headpre';

const { ccclass, property } = _decorator;

@ccclass('PersonalInfo')
export class PersonalInfo extends Component {

    /** 头像 */
    @property(Node)
    userHead: Node = null!;

    /** 昵称（第一栏） */
    @property(Label)
    lbl_name: Label = null!;

    /** UID（第二栏 + 复制按钮） */
    @property(Label)
    lbl_uid: Label = null!;


    @property(Label)
    lbl_phone: Label = null!;

    @property(Label)
    lbl_coin: Label = null!;

    @property(Button)
    btnCopy: Button = null!;

    /** 性别（点击切换） */
    @property(Sprite)
    sp_gender: Sprite = null!;
    @property(SpriteFrame)
    genderMale: SpriteFrame = null!;
    @property(SpriteFrame)
    genderFemale: SpriteFrame = null!;
    @property(Button)
    btn_gender: Button = null!;

    /** 修改昵称按钮（铅笔按钮） */
    @property(Button)
    btn_name: Button = null!;

    @property(Node)
    vipIcon: Node = null!;

    /** VIP 图标（可点击） */
    @property(Button)
    btn_vip: Button = null!;

    /** 余额问号（可点击） */
    @property(Button)
    btn_balanceInfo: Button = null!;

    /** Logout 按钮 */
    @property(Button)
    btnLogout: Button = null!;

    /** 头像框区域（每个 item 都可点击） */
    @property(Node)
    frameListNode: Node = null!;

    @property(Prefab)
    framePrefab: Prefab = null!;


    onLoad() {
        this.initUI();
        this.initEvents();
        this.initAvatarFrames();

    }

    /** 初始化基本显示 */
    private initUI() {
        const user = App.userData();
        this.lbl_name.string = user.userInfo.nickName;
        this.lbl_uid.string = user.userInfo.userId.toString();
        if (user.userInfo.verifyMethods.mobile != "") this.lbl_phone.string = user.userInfo.verifyMethods.mobile;
        this.lbl_coin.string = user.userInfo.amount.toString();
        // 性别设置
        this.setGender(user.sex);

        // 头像
        // const headCmp = this.userHead.getComponent('HeadComponent');
        // if (headCmp) {
        //     headCmp.setHead(user.uid, user.avatar);
        //     headCmp.setAvatarFrame(user.avatarFrame);
        // }

        App.ApiManager.getVipUsers().then((ret => {
            console.log("ret =", ret);
            App.ComponentUtils.setVipFrame(this.vipIcon.getComponent(Sprite), ret.vipLevel);
            App.userData().svip = ret.vipLevel;
            App.EventUtils.dispatchEvent("vipData");
        }));
        // 更新用户信息成功
        App.EventUtils.on("USER_INFO_CHANGE", this._onUserInfoChange, this);


        this.updateAll();
    }

    updateAll() {
        this.updateInfo()
        // this.updateExp()
        this.updateCoin()
    }

    // 更新头像和头像框
    updateInfo() {

        let uid = App.userData().uid2 || App.userData().uid
        let headIcon = App.userData().userIcon;
        let avatarframe = App.userData().avatarframe;
        let headCpt = this.userHead.getComponent("HeadComponent") as HeadComponent;
        if (headCpt) {
            headCpt.setHead(uid, headIcon);
            headCpt.setAvatarFrame(avatarframe);
        }
    }

    // 金币 更新
    async updateCoin() {
        this.lbl_coin.string = App.FormatUtils.FormatNumToComma(App.TransactionData.amount);
        const pWithdrawalTypes = await App.ApiManager.getWithdrawalTypes();
        App.TransactionData.withdrawalTypes = pWithdrawalTypes;
    }


    private initEvents() {

        /** 点击复制 UID */
        this.btnCopy.node.on(Button.EventType.CLICK, () => {
            App.PlatformApiMgr?.Copy?.(this.lbl_uid.string);
            App.AlertManager.showFloatTip("Copied");
        });

        /** 修改昵称 */
        this.btn_name.node.on(Button.EventType.CLICK, () => {
            App.PopUpManager.addPopup(
                "prefabs/UserInfo/prefabs/PopupChangeName",
                "hall",
                null,
                true
            );
        });

        /** 性别点击切换 */
        this.btn_gender.node.on(Button.EventType.CLICK, () => {
            const user = App.userData();
            const newGender = user.sex === 1 ? 2 : 1;
            this.setGender(newGender);
            App.NetManager.send({ c: App.MessageID.UPDATE_USER_INFO, gender: newGender });
        });

        /** 点击头像 */
        this.userHead.on(Node.EventType.TOUCH_END, () => {
            App.PopUpManager.addPopup(
                "prefabs/UserInfo/prefabs/PopupChangeHead",
                "hall",
                null,
                true
            );
        });

        /** VIP 点击 */
        this.btn_vip.node.on(Button.EventType.CLICK, () => {
            App.PopUpManager.addPopup(
                "prefabs/popup/popupVIP",
                "hall",
                null,
                true
            );
        });

        /** 余额问号 */
        this.btn_balanceInfo.node.on(Button.EventType.CLICK, () => {
            App.PopUpManager.addPopup(
                "prefabs/UserInfo/prefabs/PopupBalanceRule",
                "hall",
                null,
                true
            );
        });

        /** Logout */
        this.btnLogout.node.on(Button.EventType.CLICK, () => {
            App.GameManager.goBackLoginScene();
        });

    }

    /** 切换性别本地 UI */
    private setGender(g: number) {
        this.sp_gender.spriteFrame = g === 1 ? this.genderMale : this.genderFemale;
        App.userData().sex = g;
    }

    private initAvatarFrames() {
        const frames = [
            "avatarframe_1000", "frame02", "frame03", "frame04", "frame05", "frame06",
            "frame07", "frame08", "frame09", "frame10", "frame11", "frame12"
        ];

        this.frameListNode.removeAllChildren();

        frames.forEach((frameName, index) => {
            const item = instantiate(this.framePrefab);
            const comp = item.getComponent(HeadPre);
            if (comp) {
                comp.init(index, frameName);
            }

            this.frameListNode.addChild(item);
        });
    }

    private _onUserInfoChange = () => {
        this.updateInfo();
        this.lbl_name.string = App.userData().userInfo.nickName;
    };

    onDestroy() {
        App.EventUtils.off("USER_INFO_CHANGE", this._onUserInfoChange, this);
    }
}
