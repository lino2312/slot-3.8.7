import { _decorator, Component, find, instantiate, isValid, Label, Node, ProgressBar, sp, tween, UITransform, Vec3 } from 'cc';
import { App } from '../../App';
import { HeadComponent } from '../../component/HeadComponent';
import { SlotGameMenuComponent } from '../../component/SlotGameMenuComponent';
import VipExpCpt from '../../component/VipExpCpt';
const { ccclass, property } = _decorator;

@ccclass('SlotGameTopBase')
export class SlotGameTopBase extends Component {
    private coinNode: Node = null;

    private btnBackNode: Node = null;

    private btnMenu: Node = null;

    private isSendExist: boolean = false;

    private slotGameDataScript: any = null;

    protected onLoad(): void {
        this.coinNode = find("playerCoins/lbl_coinsNum", this.node);
        this.btnBackNode = find("btn_purchase", this.node);

        //菜单按钮
        this.btnMenu = find("btn_menu", this.node);
        this.btnMenu.on(Node.EventType.TOUCH_END, this.onBtnMenuClicked, this);

        App.EventUtils.on(App.EventID.SLOT_SHOW_HEADFOOTER_MASK, this.onShowMask, this);
        //设置了gamedata模块的金币，此消息刷新显示
        App.EventUtils.on(App.EventID.SLOT_UPDATE_BALANCE, this.onRefreshCoin, this);
        App.EventUtils.on(App.EventID.SLOT_TOTALBET_UPDATED, this.onBetChange, this)

        App.EventUtils.on("USER_INFO_CHANGE", this.showHeadInfo, this);
        App.EventUtils.on("USER_VIP_EXP_CHANGE", this.showVip, this);
        App.EventUtils.on("MENU_CLOSE", this.onMenuClosed, this);
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
    }
    start() {

    }

    update(deltaTime: number) {

    }

    protected onDestroy(): void {

        App.EventUtils.offTarget(this);
    }

    init() {
        this.showCoin();
        this.showDiamond();
        this.showHeadInfo();
        this.showVip();
        this.showMetal();
    }

    showDiamond() {
        let lblDiamond = find("playerDiamond/lbl_val", this.node)
        lblDiamond.getComponent(Label).string = App.FormatUtils.FormatNumToComma(App.userData().dcoin);
    }

    showHeadInfo() {
        let uid = App.userData().uid;
        let headIcon = App.userData().userIcon;
        let avatarframe = App.userData().avatarframe || '';
        let headNode = find("head", this.node)
        headNode.getComponent(HeadComponent).setHead(uid, headIcon)
        headNode.getComponent(HeadComponent).setAvatarFrame(avatarframe);

        let lvlabel = find("head/level", this.node)
        // lvlabel.getComponent(cc.Label).string = cc.vv.UserManager.level()
        // let lv = App.GameManager.getCurLv();
        // if (lvlabel) {
        //     lvlabel.getComponent("LevelCpt").setLevel(lv);
        // }
        this.showVip();
    }

    showVip() {
        find("playervip", this.node).getComponent(VipExpCpt).updateVipExp();
    }

    showMetal() {

        let dcashbonus = App.userData().dcashbonus;    //  可提现到现金余额的金额
        let cashbonus = App.userData().cashbonus;    // 优惠钱包金额

        if (cashbonus == 0) {
            find("playermetal/progress", this.node).getComponent(ProgressBar).progress = 0;
        } else {
            find("playermetal/progress", this.node).getComponent(ProgressBar).progress = dcashbonus / cashbonus;
        }

        find("playermetal/value", this.node).getComponent(Label).string = `${dcashbonus}/${cashbonus}`;
    }

    isClickBackLobby() {
        return this.isSendExist;
    }

    //返回大厅
    onBtnBackLobbyClicked() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        if (this.slotGameDataScript) {
            if (this.isSendExist) return;
            this.isSendExist = true
            let delayCal = () => {
                this.isSendExist = false;
            }
            this.scheduleOnce(delayCal, 2)
            this.slotGameDataScript.reqBackLobby();
        }
    }

    //显示金币
    async showCoin() {
        const amount = App.TransactionData.amount
        this.coinNode.getComponent(Label).string = App.FormatUtils.FormatNumToComma(amount);
        //检查一下是否缺金币
        this.onBetChange()
    }

    //获取当前lblcoin的金币
    getShowCoin() {
        return App.FormatUtils.FormatCommaNumToNum(this.coinNode.getComponent(Label).string);
    }

    //金币滚动显示
    //nBegin:如果没有设置就取当前lbl的值
    //nEnd:如果没有设置就取gameData中最新的值
    showCoinByRoll(nBegin = null, nEnd = null, nDur = 1, endCall = null) {
        let self = this

        if (!Number(nBegin)) {
            nBegin = this.getShowCoin();

        }
        if (!Number(nEnd)) {
            nEnd = this.slotGameDataScript.getCoin();
        }
        if (!nDur) {
            nDur = 1
        }
        let finishCall = () => {
            //最后刷一下进步
            this.showCoin()
            if (endCall) {
                endCall()
            }
        }
        App.AnimationUtils.doRoallNumEff(this.coinNode, nBegin, nEnd, nDur, finishCall, null, 2, true);
    }

    //是否可以退出游戏
    setBackLobby(bEnable) {
        let menuScp = find("Canvas").getComponentInChildren(SlotGameMenuComponent);
        if (menuScp) {
            menuScp.setBackLobby(bEnable);
        }
    }

    //减去押注额
    minusTotalBet(bAllin) {
        let nTotal = this.slotGameDataScript.getTotalBet();
        if (bAllin) {
            nTotal = this.slotGameDataScript.getCoin();
        }
        this.slotGameDataScript.addCoin(-nTotal);
        this.showCoin();
    }

    //开始旋转
    startMove() {
        this.setBackLobby(false);
    }

    //停止旋转
    stopMove() {
        let bCanExit = true
        let restFree = this.slotGameDataScript.getFreeTime();
        let reSpinTime = this.slotGameDataScript.getRespinTime();
        if (restFree > 0 || reSpinTime > 0) {
            bCanExit = false
        }
        this.setBackLobby(bCanExit);

        this.onBetChange();
    }

    //屏蔽整个下部的点击
    showInputMask(bShow) {
        let node = find("mask_input", this.node)
        if (node) {
            node.active = bShow
        }

    }

    onShowMask(data) {
        let val = data.detail
        this.showInputMask(val);
    }

    onRefreshCoin() {
        this.showCoin();
    }

    onBtnPurchaseClicked(event, customEventData) {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        App.AlertManager.showFloatTip("Please go to the lobby to recharge");
    }
    getNodePath(node: Node) {
        const list: string[] = [];
        let cur: Node | null = node;
        while (cur) {
            list.unshift(cur.name);
            cur = cur.parent;
        }
        return "/" + list.join("/");
    }



    onBtnMenuClicked(event) {

        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        this.showMenuAni(true);

        App.ResUtils.getPrefab("prefabs/slotgame/LMSlots_MenuNode").then((prefab) => {
            if (!isValid(this.node)) return;

            const parent = this.node.parent;

            if (!parent) return console.error("父节点为 null");

            let old = parent.getChildByName('LMSlots_MenuNode');

            if (!old) {

                const node = instantiate(prefab);
                // App.ScreenUtils.FixDesignScale_V(node);
                node.name = 'LMSlots_MenuNode';

                node.parent = parent; // 加到父节点

                const lvNode = event.target as Node;

                if (lvNode) {

                    // --- 安全检查父节点 UITransform ---
                    const parentUI = parent.getComponent(UITransform);
                    if (!parentUI) {
                        console.error("父节点缺少 UITransform");
                        return;
                    }

                    // 获取 lvNode 世界坐标
                    const pos = lvNode.getWorldPosition();

                    // --- 转换到父坐标 ---
                    const tipPos = parentUI.convertToNodeSpaceAR(pos);

                    // --- lvNode 也必须有 UITransform ---
                    const lvUI = lvNode.getComponent(UITransform);
                    if (!lvUI) {
                        console.error("lvNode 缺少 UITransform");
                        return;
                    }

                    let oldScaleY = node.scale.y;

                    node.setPosition(
                        tipPos.x - 15,
                        tipPos.y - (lvUI.height / 2 - 5) * oldScaleY + 10
                    );

                    node.setScale(node.scale.x, 0, node.scale.z);

                    // 弹出动画
                    tween(node)
                        .to(0.1, { scale: new Vec3(node.scale.x, oldScaleY, node.scale.z) })
                        .start();
                }

                old = node;
            }
        });

    }

    showMenuAni(bshow) {
        let menuAni = find("btn_menu/ani", this.node)
        if (menuAni) {
            let aniName = bshow ? "animation_3" : "animation_4"
            menuAni.getComponent(sp.Skeleton).setAnimation(0, aniName, false);
        }
    }

    onBetChange() {
        let nTotal = this.slotGameDataScript.getTotalBet();
        let nCoin = this.slotGameDataScript.getCoin();
        let node_less = find('playerCoins/less_coin', this.node);
        node_less.active = nCoin < nTotal;
    }
    onMenuClosed() {
        console.log("菜单已关闭");
        this.showMenuAni(false); // 关闭按钮动画
    }
}


