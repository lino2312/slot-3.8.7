import { _decorator, BlockInputEvents, Button, Component, find, instantiate, Label, Node, ParticleSystem, Sprite, SpriteFrame, Vec2, UIOpacity, UITransform, Vec3, tween, Tween, sp } from 'cc';
import { App } from '../../App';
import { Config } from '../../config/Config';
import { DropCoins } from './DropCoins';
import { SlotGameBottomBetTips } from './SlotGameBottomBetTips';
import { SlotGameBaseData } from './SlotGameBaseData';
const { ccclass, property } = _decorator;

@ccclass('SlotGameBottomBase')
export class SlotGameBottomBase extends Component {
    protected btnSpin: Node = null!;
    protected btnStop: Node = null!;
    protected btnStopAuto: Node = null!;
    protected btnAddBet: Node = null!;
    protected btnMinusBet: Node = null!;
    protected btnMaxBet: Node = null!;
    protected btnAuto: Node = null!;
    protected btnSpeed: Node = null!;
    protected lblTotalBet: Node = null!;
    protected btnSpinAni: Node = null!;
    public autoTotal: number = 0;
    protected currBottomCoin: number = 0;
    protected isAutoModel: boolean = false;
    protected isStartRound: boolean = false;
    protected isFreeModel: boolean = false;
    protected longTouchSpine: number = 1;
    protected touchSpinBtnTime: number = -1;
    protected isAllIn: boolean = false;
    protected playWinAudioHandle: any = null;
    protected needRefushFreeTime: boolean = null;
    protected spinFreeGame: boolean = false;
    protected slotGameDataScript: SlotGameBaseData = null;
    protected clickHandlers: Map<Node, (event?: any) => void> = new Map();

    protected speedNormalSprite1: SpriteFrame | null = null;
    protected speedNormalSprite2: SpriteFrame | null = null;
    protected speedPressedSprite1: SpriteFrame | null = null;
    protected speedPressedSprite2: SpriteFrame | null = null;
    protected speedHoverSprite1: SpriteFrame | null = null;
    protected speedHoverSprite2: SpriteFrame | null = null;
    protected speedDisabledSprite1: SpriteFrame | null = null;
    protected speedDisabledSprite2: SpriteFrame | null = null;

    protected onLoad(): void {
        App.SubGameManager.getSlotGameDataScript().setBottomScript(this);
        this.btnSpin = this.node.getChildByName("btn_spin")!;
        this.btnStop = this.node.getChildByName("btn_stop")!;
        this.btnStopAuto = this.node.getChildByName("btn_stopAuto")!;
        this.btnAddBet = this.node.getChildByName("totalBetBg")?.getChildByName("btn_add")!;
        this.btnMinusBet = this.node.getChildByName("totalBetBg")?.getChildByName("btn_minus")!;
        this.btnMaxBet = this.node.getChildByName("btn_max")!;
        this.lblTotalBet = this.node.getChildByName("totalBetBg")?.getChildByName("lbl_betNum")!;
        this.btnAuto = this.node.getChildByName("btn_auto")!;
        this.btnSpeed = this.node.getChildByName("btn_speed")!;
        this.btnSpinAni = this.node.getChildByName("node_ani")!;
        this.setButtonClickEvent(this.btnSpin, this.onClickSpin.bind(this));
        this.setButtonClickEvent(this.btnStop, this.onClickStop.bind(this));
        this.setButtonClickEvent(this.btnStopAuto, this.onClickStopAuto.bind(this));
        this.setButtonClickEvent(this.btnAddBet, this.onClickAddBet.bind(this));
        this.setButtonClickEvent(this.btnMinusBet, this.onClickMinusBet.bind(this));
        this.setButtonClickEvent(this.btnMaxBet, this.onClickMaxBet.bind(this));
        this.setButtonClickEvent(this.btnAuto, this.onClickAuto.bind(this));
        this.btnMaxBet.on(Node.EventType.TOUCH_START, this.onClickMaxBetStart, this);
        this.clickHandlers.set(this.btnMaxBet, this.onClickMaxBet.bind(this));
        this.btnSpeed.on(Node.EventType.TOUCH_END, this.onClickSpeedEnd, this);
        this.clickHandlers.set(this.btnSpeed, this.onClickSpeedEnd.bind(this));

        App.EventUtils.on(App.EventID.SLOT_SHOW_HEADFOOTER_MASK, this.onShowMask, this);
        App.EventUtils.on(App.EventID.NEWGUIDE_PRO_UI, this.onCompleteGuide, this);
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        this.initAutoPanl();
        this.initSpeedButton();
    }

    setButtonClickEvent(btnNode: Node, callback: (event?: any) => void) {
        if (!btnNode || !callback) return;
        // 直接使用传入的函数作为 handler（确保调用处传入的是 bind(this) 的函数）
        btnNode.on(Node.EventType.TOUCH_END, callback, this);
        this.clickHandlers.set(btnNode, callback);
    }

    start() {

    }

    update(deltaTime: number) {

    }

    protected onDestroy(): void {
        // 取消注册的触摸事件
        // this.clickHandlers.forEach((handler, node) => {
        //     if (node && handler) {
        //         node.off(Node.EventType.TOUCH_END, handler, this);
        //     }
        // });



        this.clickHandlers.clear();
        App.EventUtils.off(App.EventID.SLOT_SHOW_HEADFOOTER_MASK, this.onShowMask, this);
        App.EventUtils.off(App.EventID.NEWGUIDE_PRO_UI, this.onCompleteGuide, this);
    }

    initAutoPanl() {
        let nodeSelectAutoTimes = find("PopSelectAutoTimes", this.node);
        if (nodeSelectAutoTimes) {
            nodeSelectAutoTimes.active = false;
            find("grayMask", nodeSelectAutoTimes).on("click", () => {
                this.touchSpinBtnTime = -1;
                nodeSelectAutoTimes.active = false;
            });
            for (let i = 1; i <= 5; i++) {
                this.setButtonClickEvent(nodeSelectAutoTimes.getChildByName("btn_" + i), this.onClickSelectAutoTimes.bind(this));
            }
        }

        this.showAutoFlag(false)
    }

    initSpeedButton() {
        // load common four sprites then try to apply other states if available
        const tasks = [
            this.loadSpeedSprite('image/slotgame/speed_normal_1/spriteFrame').then(s => this.speedNormalSprite1 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_normal_2/spriteFrame').then(s => this.speedNormalSprite2 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_pressed_1/spriteFrame').then(s => this.speedPressedSprite1 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_pressed_2/spriteFrame').then(s => this.speedPressedSprite2 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_normal_1/spriteFrame').then(s => this.speedHoverSprite1 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_normal_2/spriteFrame').then(s => this.speedHoverSprite2 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_normal_1/spriteFrame').then(s => this.speedDisabledSprite1 = s).catch(() => null),
            this.loadSpeedSprite('image/slotgame/speed_normal_2/spriteFrame').then(s => this.speedDisabledSprite2 = s).catch(() => null),
        ];

        Promise.all(tasks).then(() => {
            this.applySpeedSprites(Config.SLOT_GAME_SPEED === 1 ? 1 : 2);
        });
    }

    protected loadSpeedSprite(path: string): Promise<SpriteFrame> {
        return App.ResUtils.getRes(path, SpriteFrame);
    }

    protected applySpeedSprites(mode: 1 | 2) {
        const btnNode = this.btnSpeed;
        if (!btnNode) return;

        const button = btnNode.getComponent(Button);
        const bgSprite = btnNode.getChildByName('Background')?.getComponent(Sprite) ?? null;

        if (!button) return;

        if (mode === 1) {
            if (bgSprite && this.speedNormalSprite1) bgSprite.spriteFrame = this.speedNormalSprite1;
            if (this.speedNormalSprite1) button.normalSprite = this.speedNormalSprite1;
            if (this.speedPressedSprite1) button.pressedSprite = this.speedPressedSprite1;
            if (this.speedHoverSprite1) button.hoverSprite = this.speedHoverSprite1;
            if (this.speedDisabledSprite1) button.disabledSprite = this.speedDisabledSprite1;
        } else {
            if (bgSprite && this.speedNormalSprite2) bgSprite.spriteFrame = this.speedNormalSprite2;
            if (this.speedNormalSprite2) button.normalSprite = this.speedNormalSprite2;
            if (this.speedPressedSprite2) button.pressedSprite = this.speedPressedSprite2;
            if (this.speedHoverSprite2) button.hoverSprite = this.speedHoverSprite2;
            if (this.speedDisabledSprite2) button.disabledSprite = this.speedDisabledSprite2;
        }
    }

    showAutoFlag(bShow) {
        find("sel_flag", this.btnAuto).active = bShow
    }

    init() {
        this.showBetCoin(false)
    }

    //显示押注额
    showBetCoin(bShowMaxEff = true, bAllin = false) {
        if (!bAllin) {
            this.setAllFlag(false)
        }
        let nVal = this.slotGameDataScript.getTotalBet();
        if (bAllin) {

        }
        else {
            let bgTotalbet = find("totalBetBg/bet_bg", this.node)
            bgTotalbet.active = true
            let bgAllin = find("totalBetBg/allin_bg", this.node)
            bgAllin.active = false
        }
        this.lblTotalBet.getComponent(Label).string = App.FormatUtils.FormatNumToComma(nVal);

        let node_partile = find("totalBetBg/max_bet_particle", this.node);
        if (this.slotGameDataScript.isMaxBet() && !bAllin) {
            this.btnMaxBet.getComponent(Button).interactable = false
            this.setMaxBtnSpine(false)
            //是max
            if (bShowMaxEff) {
                node_partile.active = true
                const ps = node_partile.getComponent(ParticleSystem);
                if (ps) ps.play();
            }
            find("totalBetBg/bet_bg/title_TOTALBET", this.node).active = false;
            find("totalBetBg/bet_bg/title_MAXBET", this.node).active = true;
        }
        else {
            node_partile.active = false
            this.btnMaxBet.getComponent(Button).interactable = !bAllin;
            this.setMaxBtnSpine(!bAllin);
            find("totalBetBg/bet_bg/title_TOTALBET", this.node).active = true;
            find("totalBetBg/bet_bg/title_MAXBET", this.node).active = false;
        }
    }

    //是否有可以切换的押注档位
    checkBetsChange() {
        //只有一个档位就没必要切换了
        console.log("押注档位数量", this.slotGameDataScript.getBetMults());
        return this.slotGameDataScript.getBetMults().length > 1;
    }

    //是否能显示自动选择
    isCanShowAutoSelect() {
        let btnEnable;
        let button = this.btnSpin.getComponent(Button);
        if (button) {
            btnEnable = button.interactable
        }
        let bFree = this.getIsFreeModel();
        if (btnEnable && !bFree) {
            return true
        }
        return false;
    }

    //显示选择自动面板
    showAutoSelect(bShow) {
        let node = find("PopSelectAutoTimes", this.node);
        if (node.active != bShow) {
            node.active = bShow
            if (bShow) {
                let fileName = "slot_show_autoselect";
                this.playAudio(fileName);
            }
        }
    }

    //点击自动次数
    onClickSelectAutoTimes(btn) {
        this.playAudio("slot_openBetSelector");
        let AutoSpinTimsList = [20, 50, 100, 500, 10000];
        let btnIdx = 4 //这里偷巧引导传过来的数据是空，所以默认给一个引导的数值
        if (btn && btn.node) {
            btnIdx = parseInt(btn.node.name.substr(-1, 1))
        }
        this.touchSpinBtnTime = -1
        let autoSpinTimes = AutoSpinTimsList[btnIdx - 1];
        this.slotGameDataScript.setAutoModelTime(autoSpinTimes);
        this.autoTotal = autoSpinTimes;
        this.showAutoSelect(false);
        this.showAutoModel(true)
        this.doAutoSpine();
    }

    getAutoModel() {
        return this.isAutoModel;
    }

    //点击旋转
    onClickSpin() {
        let bClickBack = this.slotGameDataScript.getTopScript().isClickBackLobby();
        if (bClickBack) {
            return
        }
        this.setBtnEnable(this.btnAuto, true)
        //已经开启了一轮
        let cfg = this.slotGameDataScript.getGameCfg()
        let fileName = "slot_reel_click";
        let filePath = '';
        if (cfg.commEffect && cfg.commEffect.clickSpin) {
            fileName = cfg.commEffect.clickSpin
            filePath = cfg.commEffect.path
        }
        this.playAudio(fileName, filePath)

        this.unschedule(this.doAutoSpine);
        this.unschedule(this.doFreeSpine);
        this.unschedule(this.sendSpinReq);

        //免费游戏不需要隐藏
        if (!this.slotGameDataScript.getFreeTime()) {
            this.doHideWinAction();
        }

        //是否需要押注
        let bNeedBet = this.checkNeedBet();
        if (bNeedBet) {
            //需要
            let res = this.checkCoinEnough();
            if (res) {
                let topScp = this.slotGameDataScript.getTopScript()
                topScp.minusTotalBet(this.isAllIn);
                //发送请求
                this.sendSpinReq()
            }
            else {
                //金币不足
                //停止自动模式
                this.onClickStopAuto();
                App.AlertManager.getCommonAlert().showWithoutCancel("Please go to the lobby to recharge");
            }
        }
        else {
            //不需要花费的
            //发送请求
            this.sendSpinReq();
        }
    }

    //点击停止
    onClickStop() {
        this.slotGameDataScript.getSlotsScript().stopMove();
    }

    //btn auto
    onClickAuto() {

        let bAuto = this.btnStopAuto.active;
        if (bAuto) {
            //cancel
            this.onClickStopAuto();
            this.showAutoFlag(false);
        }
        else {
            if (this.isCanShowAutoSelect()) {
                //select
                this.showAutoSelect(true)
            }
            else {
                App.AlertManager.showFloatTip("The Game is running!");
            }
        }
    }

    //点击停止自动
    onClickStopAuto() {
        this.slotGameDataScript.setAutoModelTime(0)
        this.slotGameDataScript.setAutoGame(false);
        this.showAutoModel(false);
    }

    //点击加注
    onClickAddBet() {

        let bMax = this.slotGameDataScript.isMaxBet();
        if (bMax) {
            //是否满足显示allin
            if (this.showAllInView(true)) {
                return;
            }

        }

        this.slotGameDataScript.changeBetIdx(true);
        this.showBetCoin();
        this.playBetAudio();

        //通知押注额修改
        let nTotal = this.slotGameDataScript.getTotalBet();
        App.EventUtils.dispatchEvent(App.EventID.SLOT_TOTALBET_UPDATED, nTotal);
        this.showBetProTip();
    }

    //点击减注
    onClickMinusBet() {

        let bMin = this.slotGameDataScript.isMinBet();
        if (bMin) {
            //是否满足显示allin
            if (this.showAllInView(true)) {
                return;
            }
        }
        if (!this.isAllIn) { //如果是all的话，减挡位就直接显示当前档位
            this.slotGameDataScript.changeBetIdx(false);
        }

        this.showBetCoin();
        this.playBetAudio();

        //通知押注额修改
        let nTotal = this.slotGameDataScript.getTotalBet();
        App.EventUtils.dispatchEvent(App.EventID.SLOT_TOTALBET_UPDATED, nTotal);
        this.showBetProTip();
    }

    //点击max
    onClickMaxBet() {

        let maxIdx = this.slotGameDataScript.getBetMaxIdx();
        this.slotGameDataScript.setBetIdx(maxIdx);
        this.slotGameDataScript.serverRawMult = maxIdx;
        App.SubGameManager.setEnterSelectBet(null);
        this.showBetCoin();
        this.playBetAudio();
        //通知押注额修改
        let nTotal = this.slotGameDataScript.getTotalBet();
        App.EventUtils.dispatchEvent(App.EventID.SLOT_TOTALBET_UPDATED, nTotal);
        this.showBetProTip();
    }

    onClickSpeedEnd() {
        let fileName = "slot_show_autoselect";
        this.playAudio(fileName);
        Config.SLOT_GAME_SPEED = (Config.SLOT_GAME_SPEED === 1 ? 2 : 1);
        this.applySpeedSprites(Config.SLOT_GAME_SPEED === 1 ? 1 : 2);
    }

    showAllInView(bShow) {
        bShow = false   // 去掉allin
        if (bShow) {
            //是否满足显示allin
            let myCoin = this.slotGameDataScript.getCoin();
            let nMaxBet = this.slotGameDataScript.getMaxBetVal()

            if (myCoin > nMaxBet && !this.isAllIn) {
                //可以显示
                this.setAllFlag(true);
                let bgAllin = find("totalBetBg/allin_bg", this.node);
                bgAllin.active = true;
                let bgTotalbet = find("totalBetBg/bet_bg", this.node);
                bgTotalbet.active = false;
                this.showBetCoin(false, true);
                App.EventUtils.dispatchEvent(App.EventID.SLOT_TOTALBET_UPDATED, nMaxBet);
                this.showBetProTip(true, true)

                this.playAudio("win1end");
            } else {
                this.setAllFlag(false);
            }

            return this.isAllIn;
        }
        else {
            let bgAllin = find("totalBetBg/allin_bg", this.node);
            bgAllin.active = false
            let bgTotalbet = find("totalBetBg/bet_bg", this.node);
            bgTotalbet.active = true
            this.showBetCoin(false)
        }
    }

    isCanShowAllIn() {
        let myCoin = this.slotGameDataScript.getCoin();
        let nMaxBet = this.slotGameDataScript.getMaxBetVal();
        return myCoin > nMaxBet;
    }

    //重制allin显示
    resetAllin() {
        this.setAllFlag(false);
        this.showAllInView(false);
    }

    //按下不释放 取消动画
    onClickMaxBetStart() {
        let _btn_max_btn_enable = this.btnMaxBet.getComponent(Button).interactable;
        if (!_btn_max_btn_enable) {
            return
        }
        this.setMaxBtnSpine(false);
    }

    //设置当前押注档位，idx:1开始，和服务端同步
    setBetIdx(idx) {
        this.slotGameDataScript.setBetIdx(idx);
        this.slotGameDataScript.serverRawMult = idx;
        App.SubGameManager.setEnterSelectBet(null);
        this.showBetCoin(false, this.isAllIn);
        this.playBetAudio();

        //通知押注额修改
        let nTotal = this.slotGameDataScript.getTotalBet();
        App.EventUtils.dispatchEvent(App.EventID.SLOT_TOTALBET_UPDATED, nTotal);
    }

    //发送旋转请求，并转轴转起来
    sendSpinReq() {
        this.showBtnsByState("moveing_1")
        let betIdx = this.slotGameDataScript.getBetIdx();
        let autoVal = null
        let autoTime = this.slotGameDataScript.getAutoModelTime();
        if (autoTime) {
            autoVal = {} as any;
            autoVal.all = this.autoTotal;
            autoVal.rmd = autoTime;
        }
        this.slotGameDataScript.reqSpin(betIdx, autoVal, this.isAllIn);

        if (this.needRefushFreeTime) {
            //更新免费次数显示
            this.needRefushFreeTime = false;
            // 更新免费次数
            let restFree = this.slotGameDataScript.getFreeTime();
            this.slotGameDataScript.setFreeTime(restFree - 1);
            let total = this.slotGameDataScript.getTotalFree();
            let rest = this.slotGameDataScript.getFreeTime();
            this.showFreeModel(true, total - rest, total);
        }

        let slots = this.slotGameDataScript.getSlotsScript();
        slots.startMove();
        this.showBetProTip(false);

        this.showAutoSelect(false);
    }

    //显示自动模式
    showAutoModel(bShow) {
        this.btnStopAuto.active = bShow;
        this.showAutoFlag(bShow);
        if (!bShow) {
            this.autoTotal = null;
        }
        this.updateAutoTimeLabel();

        let copy_add = find("copy_add", this.btnStopAuto);
        let copy_minus = find("copy_minus", this.btnStopAuto);
        let copy_max = find("copy_max", this.btnStopAuto);
        if (bShow) {
            const copyNode = (fromNode: Node, parentNode: Node, copyName: string) => {
                const copy_node = instantiate(fromNode);
                copy_node.name = copyName;
                parentNode.addChild(copy_node);

                // 禁用复制按钮交互
                const btn = copy_node.getComponent(Button);
                if (btn) btn.interactable = false;

                // 使用 UITransform 进行坐标转换（3.x）
                const fromUI = fromNode.getComponent(UITransform);
                const toUI = parentNode.getComponent(UITransform);
                if (fromUI && toUI) {
                    const worldPos = fromUI.convertToWorldSpaceAR(new Vec3(0, 0, 0));
                    const localPos = toUI.convertToNodeSpaceAR(worldPos);
                    copy_node.setPosition(localPos);
                } else {
                    // 兜底：用世界坐标对齐
                    copy_node.setWorldPosition(fromNode.worldPosition);
                }

                // 屏蔽点击穿透
                if (!copy_node.getComponent(BlockInputEvents)) {
                    copy_node.addComponent(BlockInputEvents);
                }
                return copy_node;
            };

            if (!copy_add) {
                copy_add = copyNode(this.btnAddBet, this.btnStopAuto, "copy_add");
            }
            if (!copy_minus) {
                copy_minus = copyNode(this.btnMinusBet, this.btnStopAuto, "copy_minus");
            }
            if (!copy_max) {
                copy_max = copyNode(this.btnMaxBet, this.btnStopAuto, "copy_max");
                const maxBtnSpine = find('Background/maxSpine', copy_max);
                if (maxBtnSpine) maxBtnSpine.active = false;
            }
        }
    }


    //可以进行下一轮
    canDoNextRound() {
        this.isStartRound = false
        this.showBtnsByState("idle");

        //是否有强制弹窗
        this.checkForsePoptips();

        //是否有免费游戏
        let restFree = this.slotGameDataScript.getFreeTime();
        let cfg = this.slotGameDataScript.getGameCfg();
        if (restFree > 0) {
            if (this.slotGameDataScript.getTotalFree() === restFree) {
                this.showBtnsByState("moveing_1");
            }
            // 这里只是打标记，需要更新免费次数。在SendSpinReq才刷新
            this.needRefushFreeTime = true
            this.scheduleOnce(this.doFreeSpine, cfg.autoModelDelay)
            return
        }

        //自定义旋转次数。不花费金币
        let respinTime = this.slotGameDataScript.getRespinTime();
        if (respinTime > 0) {
            this.scheduleOnce(this.sendSpinReq, cfg.autoModelDelay);
            this.slotGameDataScript.setRespinTime(respinTime - 1);
            return
        }

        let autoTime = this.slotGameDataScript.getAutoModelTime();
        if (autoTime > 0) {
            this.scheduleOnce(this.doAutoSpine, cfg.autoModelDelay)
            return
        }

        this.resetAllin();
    }

    //自动
    doAutoSpine() {
        let autoTime = this.slotGameDataScript.getAutoModelTime();

        this.slotGameDataScript.setAutoGame(autoTime > 0);
        if (autoTime > 0) {
            this.slotGameDataScript.setAutoModelTime(autoTime - 1 > 500 ? 10000 : autoTime - 1);
            if (autoTime - 1 == 0) {
                this.showAutoModel(false)
            }
            this.updateAutoTimeLabel();
            this.onClickSpin();
        }
    }

    //免费模式请求
    doFreeSpine() {
        let total = this.slotGameDataScript.getTotalFree();
        let rest = this.slotGameDataScript.getFreeTime();
        if (rest > 0) {
            this.showFreeModel(true, total - rest, total);
            //发起旋转请求
            this.sendSpinReq();
        }
    }

    //显示免费模式
    //bShow:true的时候，需要设置used,total, false的时候不需要
    //used:已经使用的免费次数，服务端就是记录已经使用过的
    //total:总的免费次数
    showFreeModel(bShow, used = null, total = null) {
        //设置免费模式状态
        this.isFreeModel = bShow;
        if (!bShow) {
            this.slotGameDataScript.setIsPuzzleModel(bShow);
        }


        let freeTime = find("free_time", this.node)
        freeTime.active = bShow;

        if (bShow) { //显示免费的时候才需要
            let old = freeTime.getChildByName("copy_max");
            if (old) {
                old.getComponent(Button).interactable = false;
            }

            let showTimesStr = `${used} / ${total}`;
            freeTime.getChildByName("lbl_free_time").getComponent(Label).string = showTimesStr;
        }

        //是否包含puzzle游戏，免费模式不显示puzzle collect
        let puzzleCollect = find('Canvas/safe_node/LMSlots_Collect_Puzzle')
        if (puzzleCollect) {
            puzzleCollect.active = !bShow

            let bPuzzle = this.slotGameDataScript.getIsPuzzleModel();
            this.setBetNodeVisible(!bPuzzle)
        }
    }

    updateFreeTime(total, used) {

        let showTimesStr = `${used} / ${total}`;
        let freeTime = find("free_time", this.node);
        freeTime.getChildByName("lbl_free_time").getComponent(Label).string = showTimesStr;
    }

    //是否是免费模式
    getIsFreeModel() {
        return this.isFreeModel;
    }

    //spin按钮是否可用状态
    getSpinBtnState() {
        return (this.btnSpin.active && this.btnSpin.getComponent(Button).interactable);
    }

    //设置bet节点是否显示
    setBetNodeVisible(bShow) {
        let betNode = find('totalBetBg', this.node);
        if (betNode) {
            {
                betNode.active = bShow
            }
        }
    }

    //显示按钮状态strState
    //"idle":空闲。 (所有按钮可以点击)
    //"moveing_1":旋转，结果还未返回。(所有按钮不可点击,spin按钮灰态)
    //"moveing_2":旋转，结果已经返回。(其它按钮不可点击,stop按钮可以点击)
    //"stoped":停止，但是还在播放加钱。(此时spin亮起来，其他按钮是灰态)
    //”unstoped“: 不能停止的操作。（stop按钮是灰态，其他按钮是灰态）
    // ...existing code...
    showBtnsByState(strState: string) {
        console.log("strState", strState);
        this.slotGameDataScript.setSlotState(strState);

        switch (strState) {
            case "idle": {
                this.btnSpin.active = true;
                this.btnSpinAni.active = true;
                this.setBtnEnable(this.btnSpin, true);

                this.btnStop.active = false;

                const hasChange = this.checkBetsChange();
                this.setBtnEnable(this.btnAddBet, hasChange);
                this.setBtnEnable(this.btnMinusBet, hasChange);

                const maxBet = !this.slotGameDataScript.isMaxBet();
                this.setBtnEnable(this.btnMaxBet, maxBet);
                this.setMaxBtnSpine(maxBet);
                break;
            }

            case "moveing_1": {
                this.btnSpin.active = true;
                this.btnSpinAni.active = false;
                this.setBtnEnable(this.btnSpin, false);
                this.setMaxBtnSpine(false);
                this.btnStop.active = false;

                this.setBtnEnable(this.btnAddBet, false);
                this.setBtnEnable(this.btnMinusBet, false);
                this.setBtnEnable(this.btnMaxBet, false);
                break;
            }

            case "moveing_2": {
                this.btnSpin.active = false;
                this.btnSpinAni.active = false;
                this.btnStop.active = true;
                this.setBtnEnable(this.btnStop, true);

                this.setBtnEnable(this.btnAddBet, false);
                this.setBtnEnable(this.btnMinusBet, false);
                this.setBtnEnable(this.btnMaxBet, false);
                this.setMaxBtnSpine(false);
                break;
            }

            case "stoped": {
                this.btnSpin.active = true;
                this.btnSpinAni.active = false;
                this.btnStop.active = false;
                this.setBtnEnable(this.btnSpin, true);

                this.setBtnEnable(this.btnAddBet, false);
                this.setBtnEnable(this.btnMinusBet, false);
                this.setBtnEnable(this.btnMaxBet, false);
                this.setMaxBtnSpine(false);
                break;
            }

            case "unstoped": {
                this.btnSpin.active = false;
                this.btnSpinAni.active = false;
                this.btnStop.active = true;
                this.setBtnEnable(this.btnStop, false);

                this.setBtnEnable(this.btnAddBet, false);
                this.setBtnEnable(this.btnMinusBet, false);
                this.setBtnEnable(this.btnMaxBet, false);
                this.setMaxBtnSpine(false);
                break;
            }

            default:
                console.warn("showBtnsByState: unknown state", strState);
        }
    }

    /**
    * 显示赢钱
    * @param nWin 目标金币
    * @param nType 1: 小赢（普通滚动） 2: 中赢（粒子 + 掉金币） 3: 自定义时间滚动
    * @param begin 开始值（不传则从界面当前值读取）
    * @param pRollEndCall 滚动完成回调
    * @param rollTime 滚动时长（优先使用）
    */
    showWin(nWin: number, nType: number, begin?: number, pRollEndCall?: () => void, rollTime?: number) {
        return new Promise<void>((resolve) => {
            const nodeOutCoin = find('winBg/node_pen_coin', this.node);
            const particleWin = find('winBg/particle_bigwin', this.node);
            const lblWinNor = find('winBg/lbl_winNum_nor', this.node);
            const lblWinOut = find('winBg/lbl_winNum_up', this.node);

            // 计算 begin
            if (begin === undefined || begin === null) {
                begin = 0;
                if (lblWinNor) {
                    const str = lblWinNor.getComponent(Label).string || '0';
                    const tempBegin = parseFloat(str.replace(/,/g, ''));
                    if (!Number.isNaN(tempBegin)) begin = tempBegin;
                }
            }

            this.currBottomCoin = nWin;

            if (begin === nWin) {
                console.warn('Bottom底部增长金币：begin==end');
                if (pRollEndCall) pRollEndCall();
                resolve();
                return;
            }

            const addCoinBgmVol = 0.3;
            const skipParObj = find('node_skip_win', this.node);
            let skipBtn: Node | null = skipParObj ? skipParObj.getChildByName('skipWin') : null;

            if (!skipBtn && skipParObj && this.btnSpin) {
                skipBtn = instantiate(this.btnSpin);
                skipBtn.name = 'skipWin';
                // 放在父节点并设置位置
                skipBtn.parent = skipParObj;
                if (this.btnSpin.getWorldPosition) {
                    const worldPos = this.btnSpin.getWorldPosition();
                    const uiTrans = skipParObj.getComponent(UITransform);
                    if (uiTrans && uiTrans.convertToNodeSpaceAR) {
                        const localPos = uiTrans.convertToNodeSpaceAR(worldPos);
                        skipBtn.setPosition(localPos);
                    } else {
                        // fallback: use zero position if conversion not available
                        skipBtn.setPosition(new Vec3(0, 0, 0));
                    }
                }
                skipBtn.active = false;
            }

            const cfg = this.slotGameDataScript ? this.slotGameDataScript.getGameCfg() : null;


            if (nType === 2) {
                // 中赢：粒子 + 掉金币
                if (skipBtn) {
                    // 不一定需要设置全屏尺寸，保留默认即可
                    skipBtn.active = false;
                }

                const dropScript = nodeOutCoin.getComponent(DropCoins);
                dropScript.setPlay(10, 50, 300, App.ScreenUtils.getScreenHeight());

                if (particleWin) {
                    particleWin.active = true;
                    const ps = particleWin.getComponent(ParticleSystem);
                    if (ps) ps.play();
                }

                if (lblWinNor) lblWinNor.active = false;
                if (lblWinOut) {
                    lblWinOut.active = true;
                    lblWinOut.setScale(1, 1, 1);
                }

                let fileName = 'win2';
                let fileEnd = 'win2end';
                let filePath = '';
                if (cfg && cfg.commEffect && cfg.commEffect.win2) {
                    fileName = cfg.commEffect.win2[0];
                    fileEnd = cfg.commEffect.win2[1];
                    filePath = cfg.commEffect.path || '';
                }

                const endCall = () => {
                    App.AudioManager.stopAllSfx();
                    App.AudioManager.setMusicVolume(1.0);
                    if (skipBtn) skipBtn.active = false;

                    if (particleWin) particleWin.active = false;
                    dropScript.stopPlay();
                    if (lblWinOut) {
                        tween(lblWinOut)
                            .to(0.1, { scale: new Vec3(0.5, 0.5, 1) })
                            .call(() => {
                                if (lblWinNor && lblWinNor.isValid) lblWinNor.active = true;
                                if (lblWinOut && lblWinOut.isValid) lblWinOut.active = false;
                            })
                            .start();
                    }

                    if (lblWinNor) {
                        lblWinNor.getComponent(Label).string = App.FormatUtils.FormatNumToComma(nWin);
                    }
                    if (pRollEndCall) pRollEndCall();
                    // 播放结束音
                    this.playAudio(fileEnd, filePath);
                    resolve();
                };

                const loadFinishCall = (audioId?: any) => {
                    this.playWinAudioHandle = audioId;
                    // 获取时长优先使用 rollTime，否则使用音频时长（播放接口需回传 audioId -> 能得时长）
                    let time = rollTime;
                    if (!time || time <= 1 || time > 5) {
                        time = 5;
                    }

                    App.AnimationUtils.doRoallNumEff(lblWinOut, begin!, nWin, time, endCall, null, 2, true);

                    // 显示跳过按钮并绑定一次性回调
                    if (skipBtn) {
                        skipBtn.active = true;
                        const btnComp = skipBtn.getComponent(Button);
                        if (btnComp) btnComp.interactable = true;
                        skipBtn.off('click'); // 移除以前可能的监听
                        skipBtn.once('click', endCall);
                    }

                    App.AudioManager.setBgmVolume(addCoinBgmVol);
                };

                this.playAudio(fileName, filePath, loadFinishCall);
            }
            else if (nType === 1) {
                // 小赢：普通滚动

                if (particleWin) particleWin.active = false;
                if (lblWinOut) lblWinOut.active = false;
                if (lblWinNor) lblWinNor.active = true;

                let fileName = 'win1';
                let fileEnd = 'win1end';
                let filePath = '';
                if (cfg && cfg.commEffect && cfg.commEffect.win1) {
                    fileName = cfg.commEffect.win1[0];
                    fileEnd = cfg.commEffect.win1[1];
                    filePath = cfg.commEffect.path || '';
                }

                const endCall = () => {
                    if (skipBtn) {
                        skipBtn.off('click');
                        skipBtn.active = false;
                    }
                    App.AudioManager.stopAllSfx();
                    App.AudioManager.setMusicVolume(1.0);
                    lblWinNor.getComponent(Label).string = App.FormatUtils.FormatNumToComma(nWin);
                    if (pRollEndCall) pRollEndCall();
                    this.playAudio(fileEnd, filePath);
                    resolve();
                };

                const loadFinishCall = (audioId?: any) => {
                    this.playWinAudioHandle = audioId;
                    let time = rollTime;
                    if (!time || time <= 0 || time > 2) time = 2; // 小赢默认 2s
                    if (skipBtn) {
                        skipBtn.active = true;
                        const btnComp = skipBtn.getComponent(Button);
                        if (btnComp) btnComp.interactable = true;
                        skipBtn.off('click');
                        skipBtn.once('click', endCall);
                    }
                    App.AudioManager.setBgmVolume(addCoinBgmVol);
                    App.AnimationUtils.doRoallNumEff(lblWinNor, begin!, nWin, time, endCall, null, 2, true);
                };

                this.playAudio(fileName, filePath, loadFinishCall);
            }
            else {
                // 其他：直接滚动完毕
                if (particleWin) particleWin.active = false;
                if (lblWinOut) lblWinOut.active = false;
                if (lblWinNor) lblWinNor.active = true;

                const endCall = () => {
                    if (pRollEndCall) pRollEndCall();
                    resolve();
                };

                App.AnimationUtils.doRoallNumEff(lblWinNor, begin!, nWin, rollTime, endCall, null, 2, true);
            }
        });
    }

    //获取当前赢得的金币
    getCurrentWin() {
        return this.currBottomCoin;
    }

    //获取stop按钮的实例
    getStopBtnObj() {
        return this.btnStop;
    }

    //直接设置赢钱的值
    setWin(nWin) {
        let lbl_win_nor = find('winBg/lbl_winNum_nor', this.node)
        if (nWin > 0) {
            lbl_win_nor.active = true
            lbl_win_nor.getComponent(Label).string = App.FormatUtils.FormatNumToComma(nWin)
            this.currBottomCoin = nWin
        } else {
            lbl_win_nor.active = false
            this.currBottomCoin = 0
        }
    }


    //新的一局清理win显示
    doHideWinAction() {
        const lblWinNor = find('winBg/lbl_winNum_nor', this.node);
        if (!lblWinNor) return;

        // 获取或添加 UIOpacity 组件，用于控制透明度并 tween 该组件
        let uiOpacity = lblWinNor.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = lblWinNor.addComponent(UIOpacity);
            uiOpacity.opacity = 255;
        }

        // 停掉已有 tween，避免冲突（针对组件）
        Tween.stopAllByTarget(uiOpacity);

        const labelComp = lblWinNor.getComponent(Label);
        tween(uiOpacity)
            .to(0.2, { opacity: 0 })
            .call(() => {
                // 恢复并隐藏
                uiOpacity!.opacity = 255;
                lblWinNor.active = false;
                if (labelComp) labelComp.string = '0';
                this.currBottomCoin = 0;
            })
            .start();
    }

    //显示自动模式
    showAuto(bShow) {
        this.isAutoModel = bShow
        this.btnStopAuto.active = bShow
        if (bShow) {
            this.showBtnsByState("moveing_1")
        }
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

    //收到引导完成消息
    onCompleteGuide(data) {
        let val = data.detail
        if (val == 161) {
            this.showAutoSelect(true);
        }
    }

    setBtnEnable(node, bEnable) {
        let btn = node.getComponent(Button);
        if (btn) {
            btn.interactable = bEnable;
        }
    }

    setMaxBtnSpine(flag) {
        let maxBtnSpine = find('Background/maxSpine', this.btnMaxBet);
        maxBtnSpine.active = flag
        if (flag) {
            maxBtnSpine.getComponent(sp.Skeleton).setAnimation(0, "animation2", true)
        }
    }

    //是否需要扣押注
    //1 免费游戏也是不需要花费的
    //2 自定义的旋转模式也是不花费的
    checkNeedBet() {
        let bNeed = true
        //是否是自定义旋转模式
        let respinTime = this.slotGameDataScript.getRespinTime();
        if (respinTime) {
            bNeed = false
        }
        //是否是免费模式
        if (this.getIsFreeModel()) {
            bNeed = false
        }

        return bNeed
    }

    //检查押注额是否足够
    checkCoinEnough() {

        let nTotalCoin = this.slotGameDataScript.getCoin();
        let nTotalBet = this.slotGameDataScript.getTotalBet();
        if (nTotalBet <= nTotalCoin) {
            return true //足够
        }
        else {
            return false //不够
        }
    }

    //更新自动模式的次数
    updateAutoTimeLabel() {
        let nVal = this.slotGameDataScript.getAutoModelTime();
        let lbl_time = this.btnStopAuto.getChildByName('lbl_auto_times');
        let lbl_nMax = this.btnStopAuto.getChildByName('nMaxA');
        let bShowInfinity = nVal > 500 ? true : false
        lbl_time.active = !bShowInfinity
        lbl_nMax.active = bShowInfinity
        lbl_time.getComponent(Label).string = String(nVal);
    }

    playBetAudio() {
        let idx = this.slotGameDataScript.getBetIdx();
        let maxLen = this.slotGameDataScript.getBetMults().length;
        let filename = "bet" + idx;
        if (idx == maxLen) {
            filename = "global_max_bet";
        }
        this.playAudio('bet/' + filename)
    }

    /**
     * 
     * @param {*} fileName 
     * @param {*} path 音效路径
     * @param {*} endCall 播放结束回调
     * @param {*} loadFinishCall 加载完回调，会带audioid出来
     */
    playAudio(fileName, path = null, loadFinishCall = null) {
        if (!path) {
            path = "audio/slotGame/";
        }

        App.AudioManager.playSfx(path, fileName, loadFinishCall);
    }

    showBetProTip(bShow = true, bAllin = false) {
        let node_bettips = find('node_bettips', this.node);
        if (node_bettips) {


            let scp = node_bettips.getComponent(SlotGameBottomBetTips);
            if (scp) {
                if (bShow) {
                    node_bettips.active = true
                    let bCanShowAllIn = false; //this._isCanShowAllIn()
                    let text_allin = find("pro_bet/txt_allin", node_bettips)
                    text_allin.active = bCanShowAllIn;
                    let text_more = find("pro_bet/txt_more", node_bettips)
                    text_more.active = !bCanShowAllIn;

                    let nMinIdx = this.slotGameDataScript.getBetMinIdx();
                    let nMaxIdx = this.slotGameDataScript.getBetMaxIdx();
                    let curIdx = this.slotGameDataScript.getBetIdx();
                    if (bAllin) {
                        curIdx = nMaxIdx;
                    }
                    let nPer = (curIdx - nMinIdx) / (nMaxIdx - nMinIdx);
                    scp.setBetPercent(nPer);
                }
                else {
                    scp.hideTips();
                }

            }
        }
    }

    checkForsePoptips() {
        let serverData = App.GameManager.getNotEncoughCoinPoplist();
        if (serverData && serverData.bforse) {
            //强制弹出
            App.EventUtils.dispatchEvent(App.EventID.NOT_ENOUGH_COIN_POP_UI);
            App.GameManager.setNotEncoughPopForceFlag(0);
        }
    }

    setAllFlag(val) {
        this.isAllIn = val
        let coin = this.slotGameDataScript.getCoin();
        if (!val) {
            coin = 0
        }
        this.slotGameDataScript.setAllInVal(val, coin);
    }


    getWinLabelNor() {
        return this.node;
    }
}

