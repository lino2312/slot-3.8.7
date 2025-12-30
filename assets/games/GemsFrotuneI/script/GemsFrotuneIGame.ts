import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import GemsFrotuneIData from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIData";
import GemsFrotuneISlots from "db://assets/games/GemsFrotuneI/script/GemsFrotuneISlots";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";

import { Node, Sprite, SpriteFrame, Tween, Widget, _decorator, screen, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIGame')
export default class GemsFrotuneIGame extends BaseComponent {

    @property(Node)
    ndWelcome: Node = null;
    @property(Node)
    ndWelcomeAni: Node = null;
    @property(Node)
    ndWelcomeMonkey: Node = null;
    @property(Node)
    ndTopContent: Node = null;
    @property(Node)
    ndBottomContent: Node = null;
    @property(Node)
    ndLogo: Node = null;
    @property(Node)
    ndMonkey: Node = null;
    @property(Node)
    ndSlots: Node = null;
    @property(Node)
    ndExtra: Node = null;
    @property(Node)
    ndExtraBg: Node = null;
    @property(Node)
    ndExtraTips: Node = null;
    @property(Node)
    moveTipNode: Node = null;
    @property(Node)
    winLabelSpine: Node = null;
    @property(Node)
    ndExtra_ani: Node = null;
    @property(Node)
    SpecialWinNode: Node = null;
    @property([SpriteFrame])
    norTip: SpriteFrame[] = [];
    @property([Node])
    bigWinSpineList: Node[] = [];

    isResetView = false;
    showMegaWin = false;
    showsuperwin = false;
    isClickBigWin = false;
    isDouble = false;
    isExOpen = true;
    winCoin = 0;
    bigWinStopId = 0;
    moveSpeed = 1;

    onLoad () {
        this.ndExtraTips.active = false;
        this.ndExtraBg.setPosition(v3(0, this.ndExtraBg.position.y, 0));
    }
    start () {
        let topContentPosY = this.ndTopContent.position.y;
        let bottomContentPosY = this.ndBottomContent.position.y;
        let logoPosY = this.ndLogo.position.y;
        let slotsPosY = this.ndSlots.position.y;
        let monkeyPosY = this.ndMonkey.position.y;
        
        let topWidget = this.ndTopContent.getComponent(Widget);
        if (topWidget) topWidget.enabled = false;
        this.ndTopContent.setPosition(v3(this.ndTopContent.position.x, this.ndTopContent.position.y + 500, 0));
        this.ndBottomContent.setPosition(v3(this.ndBottomContent.position.x, this.ndBottomContent.position.y - 500, 0));
        
        let logoWidget = this.ndLogo.getComponent(Widget);
        if (logoWidget) logoWidget.enabled = false;
        this.ndLogo.setPosition(v3(this.ndLogo.position.x, screen.windowSize.height/2 + 200, 0));
        
        let slotsWidget = this.ndSlots.getComponent(Widget);
        if (slotsWidget) slotsWidget.enabled = false;
        this.ndSlots.setPosition(v3(this.ndSlots.position.x, -screen.windowSize.height/2 - 200, 0));
        
        let monkeyWidget = this.ndMonkey.getComponent(Widget);
        if (monkeyWidget) monkeyWidget.enabled = false;
        this.ndMonkey.setPosition(v3(this.ndMonkey.position.x, this.ndMonkey.position.y + screen.windowSize.height/2, 0));
        
        this.ndWelcome.active = true;
        this.ndWelcomeMonkey.getComponent(MySpine).playAni(0, false);
        this.ndWelcomeAni.getComponent(MySpine).playAni(1, false);
        
        tween(this.ndTopContent).delay(2.5).to(0.1, { position: v3(this.ndTopContent.position.x, topContentPosY, 0) }).call(() => {
            let widget = this.ndTopContent.getComponent(Widget);
            if (widget) widget.enabled = true;
        }).start();
        tween(this.ndBottomContent).delay(3).to(0.1, { position: v3(this.ndBottomContent.position.x, bottomContentPosY, 0) }).start();
        tween(this.ndLogo).delay(2.5).to(0.3, { position: v3(this.ndLogo.position.x, logoPosY, 0) }).call(() => {
            let widget = this.ndLogo.getComponent(Widget);
            if (widget) widget.enabled = true;
        }).start();
        tween(this.ndSlots).delay(2.5).to(0.3, { position: v3(this.ndSlots.position.x, slotsPosY, 0) }).call(() => {
            let widget = this.ndSlots.getComponent(Widget);
            if (widget) widget.enabled = true;
        }).start();
        tween(this.ndMonkey).delay(2).call(() => {
            this.ndMonkey.active = true;
            this.playMonkeyAni(0, false, () => {
                this.ndWelcome.active = false;
                this.playMonkeyAni(1, true);
            });
        }).to(0.5, { position: v3(this.ndMonkey.position.x, monkeyPosY, 0) }).call(() => {
            let widget = this.ndMonkey.getComponent(Widget);
            if (widget) widget.enabled = true;
        }).delay(4).call(() => {
            this.ndMonkey.getComponent(MySpine).playAni(2, true);
            this.spineMove(5);
        }).start();
        this.tipMove(true);
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'animation_welcome');
        Utils.playMusic(SlotGameData.BUNDLE_NAME, "base_bgm");
    }

    onClickEvent (_event: any, data: string) {
        let isShowExtraTips = this.ndExtraTips.active;
        if (isShowExtraTips) this.hideExtraTips();
        switch (data) {
            case 'extra':
                this.isExOpen = !this.isExOpen;
                Tween.stopAllByTarget(this.ndExtraBg);
                if (this.isExOpen) {
                    tween(this.ndExtraBg).to(0.2, { position: v3(0, this.ndExtraBg.position.y, 0) }).start();
                } else {
                    tween(this.ndExtraBg).to(0.2, { position: v3(-388.267, this.ndExtraBg.position.y, 0) }).start();
                }
                break;
            case 'extra_bet':
                if (!isShowExtraTips) this.showExtraTips();
                break;
            case 'ex_switch':
                if (SlotGameData.isSlotReady) this.changeDouble();
                break;
            default:
                break;
        }
    }

    onSlotStart() { this.showMegaWin = false; this.showsuperwin = false; this.isClickBigWin = false; }
    onSlotEnd () {}
    onStopSpin () { this.resetView(); }
    resetView () { if (this.isResetView) return; this.isResetView = true; }
    playMonkeyAni (index: number, isLoop: boolean, cbEnd: Function = null) { this.ndMonkey.getComponent(MySpine).playAni(index, isLoop, cbEnd); }
    showExtraTips () {
        if (this.ndExtraTips.active) return;
        this.ndExtraTips.active = true;
        Tween.stopAllByTarget(this.ndExtraTips);
        this.ndExtraTips.setScale(v3(0, 0, 1));
        tween(this.ndExtraTips).to(0.3, { scale: v3(1, 1, 1) }).start();
    }

    hideExtraTips () {
        if (!this.ndExtraTips.active) return;
        Tween.stopAllByTarget(this.ndExtraTips);
        tween(this.ndExtraTips).to(0.3, { scale: v3(0, 0, 1) }).call(() => { this.ndExtraTips.active = false; }).start();
    }

    changeDouble() {
        let guanNode = this.ndExtraBg.getChildByName("switch").getChildByName("guan");
        let kaiNode = this.ndExtraBg.getChildByName("switch").getChildByName("kai");
        if (this.isDouble) {
            this.isDouble = false;
            guanNode.active = true;
            kaiNode.active = false;
            SlotGameData.buyDouble = false;
            this.ndExtra_ani.getComponent(MySpine).playAni(1, false);
            SlotGameData.scriptBottom.updateNormlModeBetCoin();
        } else {
            this.isDouble = true;
            guanNode.active = false;
            kaiNode.active = true;
            this.ndExtra_ani.getComponent(MySpine).playAni(0, false);
            SlotGameData.buyDouble = true;
            (SlotGameData.scriptSlots as GemsFrotuneISlots).playExtraMultiplesAni();
            SlotGameData.scriptBottom.updateNormlModeBetCoin();
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'ewaibet');
        }
    }

    tipMove(isMove: boolean = true) {
        let tipSprite = this.moveTipNode.getComponent(Sprite);
        tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 4)];
        let startPos = 400;
        let endPos = v3(-startPos - 200, 0, 0);
        this.moveTipNode.setPosition(v3(startPos, 0, 0));
        if (isMove) {
            let move = tween(this.moveTipNode).to(8, { position: endPos }).call(() => {
                tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 4)];
                this.moveTipNode.setPosition(v3(startPos, 0, 0));
            }).start();
            tween(this.moveTipNode).repeatForever(move).start();
        } else {
            Tween.stopAllByTarget(this.moveTipNode);
            this.moveTipNode.setPosition(v3(startPos, 0, 0));
        }
    }
    showWinCoin(winCoin: number, type: number) {
        let winLabelNode = this.winLabelSpine.getChildByName("winLabel");
        let effectSp = this.winLabelSpine.getChildByName("spine");
        if (type == 1) {
            this.winLabelSpine.setScale(v3(0.5, 0.5, 1));
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showcion');
            this.winLabelSpine.getComponent(MySpine).playAni(0, false, () => {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showkuang');
                winLabelNode.getComponent(RollNumber).scrollTo(winCoin, () => {
                    this.scheduleOnce(() => {
                        if (GemsFrotuneIData.curRollServerData.betNum != 1) {
                            (SlotGameData.scriptSlots as GemsFrotuneISlots).playMultiplesFlyAni();
                        } else {
                            SlotGameData.scriptBottom.updateWinNum(GemsFrotuneIData.curRollServerData.winScore, () => {
                                this.showWinCoin(0, 3);
                                let winLevel = SlotGameData.getCurBetScore() * 5;
                                if (SlotGameData.buyDouble) winLevel = winLevel * 1.5;
                                if (GemsFrotuneIData.curRollServerData.winScore >= winLevel) {
                                    this.bigWinAni(GemsFrotuneIData.curRollServerData.winScore, true);
                                } else {
                                    this.scheduleOnce(() => { SlotGameData.scriptBottom.canDoNextRound(); }, 1);
                                }
                            });
                        }
                    }, 0.5);
                });
            });
        } else if (type == 2) {
            effectSp.getComponent(MySpine).playAni(0, false);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'bettowin');
            winLabelNode.getComponent(RollNumber).reset(GemsFrotuneIData.curRollServerData.winScore);
            SlotGameData.scriptBottom.updateWinNum(GemsFrotuneIData.curRollServerData.winScore, () => {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'betuse');
                this.showWinCoin(0, 3);
                let winLevel = SlotGameData.getCurBetScore() * 5;
                if (SlotGameData.buyDouble) winLevel = winLevel * 1.5;
                if (GemsFrotuneIData.curRollServerData.winScore >= winLevel) {
                    this.bigWinAni(GemsFrotuneIData.curRollServerData.winScore, true);
                } else {
                    this.scheduleOnce(() => { SlotGameData.scriptBottom.canDoNextRound(); }, 1);
                }
            });
        } else {
            tween(this.winLabelSpine).delay(0.6).to(0.3, { scale: v3(0, 0, 1) }).call(() => {
                winLabelNode.getComponent(RollNumber).init();
            }).start();
        }
    }
    bigWinAni(winCoin: number, isShow = true) {
        let winType = 0;
        this.winCoin = winCoin;
        this.SpecialWinNode.active = true;
        let winLab = this.SpecialWinNode.getChildByName("winLabel").getComponent(RollNumber);
        if (isShow) {
            for (let i = 0; i < this.bigWinSpineList.length; i++) this.bigWinSpineList[i].active = false;
            this.bigWinSpineList[winType].active = true;
            let bigWinSpine = this.bigWinSpineList[winType].getComponent(MySpine);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'bigwin', null, (stopId) => { this.bigWinStopId = stopId; }, true);
            let callback = () => { winLab.reset(winCoin); this.SpecialWinNode.off(Node.EventType.TOUCH_START, callback, this); };
            this.SpecialWinNode.on(Node.EventType.TOUCH_START, callback, this);
            this.SpecialWinNode.getChildByName("winLabel").active = true;
            bigWinSpine.playAni(0, false, () => {
                bigWinSpine.playAni(1, true);
                winLab.setScrollTime(winCoin * 0.6);
                let winLevel = SlotGameData.getCurBetScore() * 10;
                let winLevel2 = SlotGameData.getCurBetScore() * 25;
                if (SlotGameData.buyDouble) { winLevel = winLevel * 1.5; winLevel2 = winLevel2 * 1.5; }
                winLab.scrollTo(winCoin, () => { this.bigWinAni(GemsFrotuneIData.curRollServerData.winScore, false); }, (value) => {
                    if (value / 10 >= winLevel2 && !this.showsuperwin) {
                        this.showsuperwin = true; this.showMegaWin = true;
                        for (let i = 0; i < this.bigWinSpineList.length; i++) this.bigWinSpineList[i].active = false;
                        winType = 2; this.bigWinSpineList[winType].active = true;
                        this.bigWinSpineList[winType].getComponent(MySpine).playAni(0, false, () => { this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true); });
                    } else if (value / 10 >= winLevel && !this.showMegaWin) {
                        this.showMegaWin = true;
                        for (let i = 0; i < this.bigWinSpineList.length; i++) this.bigWinSpineList[i].active = false;
                        winType = 1; this.bigWinSpineList[winType].active = true;
                        this.bigWinSpineList[winType].getComponent(MySpine).playAni(0, false, () => { this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true); });
                    }
                });
            });
        } else {
            let winLevel = SlotGameData.getCurBetScore() * 10;
            let winLevel2 = SlotGameData.getCurBetScore() * 25;
            if (SlotGameData.buyDouble) { winLevel = winLevel * 1.5; winLevel2 = winLevel2 * 1.5; }
            if (winCoin > winLevel2) winType = 2; else if (winCoin > winLevel) winType = 1; else winType = 0;
            for (let i = 0; i < this.bigWinSpineList.length; i++) this.bigWinSpineList[i].active = false;
            this.bigWinSpineList[winType].active = true;
            let bigWinSpine = this.bigWinSpineList[winType].getComponent(MySpine);
            Utils.stopEffect(this.bigWinStopId);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'bigwinEnd');
            bigWinSpine.playAni(2, false, () => { winLab.init(0); this.SpecialWinNode.active = false; SlotGameData.scriptBottom.canDoNextRound(); });
        }
    }

    spineMove(moveTime = 10) {
        let startPos = 600;
        let time = moveTime;
        let isStop = Utils.getRandNum(0, 1);
        this.ndMonkey.setScale(v3(this.moveSpeed, 1, 1));
        let musicName = this.moveSpeed == -1 ? "monkey_movein2" : "monkey_movein1";
        let endPos = v3(-startPos * this.moveSpeed, -240, 0);
        if (isStop == 1 && this.ndMonkey.position.x != 0) { endPos = v3(0, -240, 0); time = 5; }
        tween(this.ndMonkey).call(() => { this.ndMonkey.getComponent(MySpine).playAni(2, true); })
            .to(time, { position: endPos }).call(() => { this.ndMonkey.getComponent(MySpine).playAni(1, true); })
            .delay(Utils.getRandNum(2, 15)).call(() => {
                if (endPos.x == 600 || endPos.x == -600) { this.moveSpeed = this.moveSpeed * -1; Utils.playEffect(SlotGameData.BUNDLE_NAME, musicName); }
                this.spineMove(10);
            }).start();
    }
}