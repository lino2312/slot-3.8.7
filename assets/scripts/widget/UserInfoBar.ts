import { _decorator, Component, Label, Node, Sprite, tween } from 'cc';
import { App } from 'db://assets/scripts/App';
import { HeadComponent } from 'db://assets/scripts/component/HeadComponent';
const { ccclass, property } = _decorator;

@ccclass('UserInfoBar')
export class UserInfoBar extends Component {
    @property(Sprite)
    vipIcon: Sprite = null;

    @property(Node)
    headNode: Sprite = null;

    @property(Label)
    coinLabel: Label = null;

    @property(Node)
    refreshNode: Node = null;

    @property(Sprite)
    avatarFrame: Sprite = null;



    protected onLoad(): void {
        // 监听更新金币事件
        App.EventUtils.on(App.EventID.UPATE_COINS, this.updateCoin, this);
        // 更新用户信息成功
        App.EventUtils.on("USER_INFO_CHANGE", this.updateInfo, this);
        // 经验值变动
        // App.EventUtils.on("USER_EXP_CHANGE", this.updateExp);

        App.EventUtils.on("OpenCharge", this.onAddBtnClick, this)
        App.EventUtils.on("RefreshBalanceTOP", this.onRefreshBalanceTOP, this);
        this.updateAll();

        App.userData().svip = App.GameManager.getVipUserData().vipLevel;
        App.ComponentUtils.setVipFrame(this.vipIcon, App.userData().svip);
        App.EventUtils.on("vipData", this.vip, this);
    }

    start() {

    }

    update(deltaTime: number) {

    }
    vip() {
        App.ComponentUtils.setVipFrame(this.vipIcon, App.userData().svip);
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
        let headCpt = this.headNode.getComponent("HeadComponent") as HeadComponent;
        if (headCpt) {
            headCpt.setHead(uid, headIcon);
            headCpt.setAvatarFrame(avatarframe);
        }
    }

    // 金币 更新
    updateCoin() {
        this.coinLabel.string = App.FormatUtils.FormatNumToComma(App.TransactionData.amount);
    }

    async onClickRefresh() {
        // 创建旋转动画
        if (!this.refreshNode) return;
        tween(this.refreshNode)
            .by(1, { angle: -360 })
            .start();

        const pRecoverBalance = await App.ApiManager.recoverBalance();
        try {
            this.coinLabel.string = App.FormatUtils.FormatNumToComma(pRecoverBalance.amount);
            App.TransactionData.amount = pRecoverBalance.amount;
            App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS);
        } catch (e) {
            console.warn("刷新余额失败", e);
            return;
        }
    }

    async onRefreshBalanceTOP() {

        let withdrawModel = App.TransactionData.homeSettings.withdrawModel;
        if (withdrawModel == "1") {
            try {
                const pWithdrawalTypes = await App.ApiManager.getWithdrawalTypes();
                App.TransactionData.withdrawalTypes = pWithdrawalTypes;
                for (let i = 0; i < pWithdrawalTypes.withdrawlist.length; i++) {
                    const pWithdrawals = await App.ApiManager.getWithdrawals(pWithdrawalTypes.withdrawlist[i].withdrawID);
                    console.log("getWithdrawals: ", pWithdrawals);
                    if (pWithdrawals.withdrawalslist && pWithdrawals.withdrawalslist.length > 0) {
                        App.TransactionData.amount = pWithdrawals.withdrawalsrule.amount;
                        App.TransactionData.uRate = pWithdrawals.uRate;
                        App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS);
                    }
                }
            } catch (e) {
                console.warn("onRefreshBalanceTOP failed", e);
            }

        }
        if (withdrawModel == "2") {
            const pWallet = await App.ApiManager.getWallet();
            console.log("getWallet: ", pWallet);
            try {
                App.TransactionData.amount = pWallet.balance;
                App.TransactionData.balance = pWallet.balance;
                App.TransactionData.uRate = pWallet.uRate;
                App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS);
            } catch (e) {
                console.warn("GetWallet failed", e);
            }
        }
    }

    // updateExp() {
    //     //等级
    //     let lv = App.GameManager.getCurLv();
    //     if (this.levelNode) {
    //         this.levelNode.getComponent("LevelCpt").setLevel(lv);
    //     }
    //     let exp = cc.vv.UserManager.getCurExp()
    //     let upExp = cc.vv.UserConfig.getCmpLevelNeedExp(lv);
    //     let per = exp / upExp
    //     per = Math.min(per, 1)
    //     per = Math.max(per, 0)
    //     if (this.progressLevel) {
    //         this.progressLevel.progress = per
    //     }
    // }



    onAddBtnClick() {
        App.AudioManager.playBtnClick();
        let firstRecharge = App.userData().userInfo.firstRecharge;
        if (firstRecharge && firstRecharge > 0) {
            App.PopUpManager.addPopup("prefabs/popup/popupRecharge", "hall", null, false);
        } else {
            App.PopUpManager.addPopup("prefabs/popup/popupFirstRecharge", "hall", null, true);
        }
    }


    onSettingClick() {
        App.AudioManager.playBtnClick();
        App.PopUpManager.addPopup("prefabs/Setting/PopupSetting", "hall", null, true);
    }

    onClickFeature(event: Event, prefabPath: string) {
        App.AudioManager.playBtnClick();
        try {
            prefabPath = prefabPath.replace(/\\/g, '/');
            App.PopUpManager.addPopup(prefabPath, 'hall', null, true);
        } catch (err) {
            console.error(`❌ 弹窗调用出错 (${prefabPath}):`, err);
        }
    }

    protected onDestroy(): void {
        App.EventUtils.offTarget(this);
    }

}


