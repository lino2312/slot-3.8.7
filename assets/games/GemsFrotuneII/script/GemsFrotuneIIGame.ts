import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import GemsFrotuneIIData from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIData";
import GemsFrotuneIISlots from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIISlots";

import { Label, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Vec3, _decorator, tween, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneIIGame')
export default class GemsFrotuneIIGame extends BaseComponent {

    @property(Node)
    startAni: Node = null;

    @property(Node)
    ndExtraBg: Node = null;

    @property(Node)
    ndExtraTips: Node = null;

    @property(Node)
    moveTipNode: Node = null;

    @property(Node)
    winLabelSpine: Node = null; 
    @property(Node)
    winLabelSpine2: Node = null;

    @property(Node)
    numSpine: Node = null;

    @property(Node)
    ndExtra_ani: Node = null;
    @property(Node)
    SpecialWinNode: Node = null;
    @property(Node)
    wheelNode: Node = null;

    @property(Node)
    monkeyNode: Node = null;
    @property(Node)
    monkeyNode2: Node = null;

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
    aniIndex = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.ndExtraTips.active = false;
        this.ndExtraBg.x = 0;
    }

    start () {
        this.startAni.active = true;
        this.startAni.getComponent(MySpine).playAni(0, false, () => {
            this.startAni.active = false;
        })
        this.tipMove(true);
        Utils.playMusic(SlotGameData.BUNDLE_NAME, "base_bgm");
        let monkeyAniSc = this.monkeyNode.getComponent(MySpine);
        this.monkeyNode.getComponent(UIOpacity).opacity = 255;
        this.monkeyNode2.getComponent(UIOpacity).opacity = 0;
        this.aniIndex = 0;
        monkeyAniSc.playAni(2, false, () => {
            monkeyAniSc.playAni(1, true);
        })
        this.schedule(this.monkeyAni,10);
    }

    // update (dt) {}

    onClickEvent (event, data: string) {
        let isShowExtraTips = this.ndExtraTips.active;
        if (isShowExtraTips) {
            this.hideExtraTips();
        }
        switch (data) {
            case 'extra':
                this.isExOpen = !this.isExOpen;
                Tween.stopAllByTarget(this.ndExtraBg);
                if (this.isExOpen) {
                    tween(this.ndExtraBg)
                        .to(0.2, { x: 0 })
                        .start();
                } else {
                    tween(this.ndExtraBg)
                        .to(0.2, { x: -388.267 })
                        .start();
                }
                break;
            case 'extra_bet':
                if (!isShowExtraTips) {
                    this.showExtraTips();
                }
                break;
            case 'ex_switch':
                if (SlotGameData.isSlotReady) {
                    this.changeDouble();
                }
                break;
            case 'ex_kai':
                break;
            default:
                break;
        }
    }

    onSlotStart() {
        this.showMegaWin = false;
        this.showsuperwin = false;
        this.isClickBigWin = false;
    }

    onSlotEnd () {
    }

    onStopSpin () {
        this.resetView();
    }

    resetView () {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
    }

    showExtraTips () {
        if (this.ndExtraTips.active) {
            return;
        }
        this.ndExtraTips.active = true;
        Tween.stopAllByTarget(this.ndExtraTips);
        this.ndExtraTips.scale = new Vec3(0, 0, 0);
        tween(this.ndExtraTips)
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    hideExtraTips () {
        if (!this.ndExtraTips.active) {
            return;
        }
        Tween.stopAllByTarget(this.ndExtraTips);
        tween(this.ndExtraTips)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.ndExtraTips.active = false;
            })
            .start();
    }

    changeDouble() {
        let guanNode = this.ndExtraBg.getChildByName("switch").getChildByName("guan");
        let kaiNode = this.ndExtraBg.getChildByName("switch").getChildByName("kai");
        if (this.isDouble) {
            this.isDouble = false;
            guanNode.active = true;
            kaiNode.active = false;
            SlotGameData.buyDouble = false;
            this.ndExtra_ani.getComponent(MySpine).playAni(1,false);
            SlotGameData.scriptBottom.updateNormlModeBetCoin();
        } else {
            this.isDouble = true;
            guanNode.active = false;
            kaiNode.active = true;
            this.ndExtra_ani.getComponent(MySpine).playAni(0, false);
            this.numSpine.active = true;
            this.numSpine.getComponent(MySpine).playAni(0, false, () => {
                this.numSpine.active = false;
            })
            let wheelSpine = this.wheelNode.getComponent(MySpine);
            wheelSpine.playAni(1, false, () => {
                wheelSpine.playAni(0, true)
            })
            SlotGameData.buyDouble = true;
            (SlotGameData.scriptSlots as GemsFrotuneIISlots).playExtraMultiplesAni();
            SlotGameData.scriptBottom.updateNormlModeBetCoin();
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'ewaibet');
        }
    }

    /**
     * 提示例文本提示
     * @param isMove 是否移动
     */
    tipMove(isMove: boolean = true) {
        let tipSprite = this.moveTipNode.getComponent(Sprite);
        tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 4)];
        let spriteSize = this.moveTipNode.getComponent(UITransform).contentSize;
        let startPos = this.moveTipNode.parent.getComponent(UITransform).contentSize.width / 2; //mask为680，取一半让它不出现在屏幕
        let endPos = v3(-(spriteSize.width + startPos), 0);
        this.moveTipNode.setPosition(v3(startPos, 0, 0));
        if (isMove) {
            let move = tween(this.moveTipNode)
                .to(8, { position: endPos })
                .call(() => {
                    tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 4)];
                    spriteSize = this.moveTipNode.getComponent(UITransform).contentSize;
                    endPos = v3(-(spriteSize.width + startPos), 0);
                    this.moveTipNode.setPosition(v3(startPos, 0, 0));
                })
                .start();
            tween(this.moveTipNode)
                .repeatForever(move)
                .start();
        } else {
            Tween.stopAllByTarget(this.moveTipNode);
            this.moveTipNode.setPosition(v3(startPos, 0, 0));
        }
    }

    /**
     * 展示赢钱分数
     * @param winCoin 赢得的钱
     * @param type 1表示动画第一段，2表示倍数飞过来的，3表示开始旋转的时候隐藏赢钱展示
     */
    showWinCoin(winCoin, type) {
        let winLabelNode = this.winLabelSpine.getChildByName("winLabel");
        let effectSp = this.winLabelSpine.getChildByName("spine");
        if (type == 1) {
            this.winLabelSpine.setScale(0.5,0.5);
            this.winLabelSpine.getComponent(UIOpacity).opacity = 255;
            winLabelNode.getComponent(UIOpacity).opacity = 0;
            effectSp.getComponent(UIOpacity).opacity = 0;
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showcion');
            this.winLabelSpine.getComponent(MySpine).playAni(0, false, () => {
                winLabelNode.getComponent(UIOpacity).opacity = 255;
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showkuang');
                winLabelNode.getComponent(RollNumber).scrollTo(winCoin, () => {
            //=============to do 播放倍数飞过来的动画
                    this.scheduleOnce(() => {
                        if (GemsFrotuneIIData.curRollServerData.betNum != 1) {
                            (SlotGameData.scriptSlots as GemsFrotuneIISlots).playMultiplesFlyAni();
                        } else {
                            //=============to do 回复按钮
                            SlotGameData.scriptBottom.updateWinNum(GemsFrotuneIIData.curRollServerData.winScore, () => {
                                this.showWinCoin(0, 3);
                                let winLevel = SlotGameData.getCurBetScore() * 5;
                                if (SlotGameData.buyDouble) {
                                    winLevel = winLevel * 1.5;
                                }
                                if (GemsFrotuneIIData.curRollServerData.winScore >= winLevel) {
                                    this.bigWinAni(GemsFrotuneIIData.curRollServerData.winScore, true)
                                } else {
                                    this.scheduleOnce(() => {
                                        SlotGameData.scriptBottom.canDoNextRound();
                                    }, 1)
                                }
                            });
                        }
                    }, 0.5)
                })
            })
        } else if (type == 2) {
            effectSp.getComponent(UIOpacity).opacity = 255;
            effectSp.getComponent(MySpine).playAni(0, false);
            winLabelNode.getComponent(RollNumber).reset(GemsFrotuneIIData.curRollServerData.winScore)
            //=============to do 回复按钮
            SlotGameData.scriptBottom.updateWinNum(GemsFrotuneIIData.curRollServerData.winScore, () => {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'betshow');
                this.showWinCoin(0, 3);
                let winLevel = SlotGameData.getCurBetScore() * 5;
                if (SlotGameData.buyDouble) {
                    winLevel = winLevel * 1.5;
                }
                if (GemsFrotuneIIData.curRollServerData.winScore >= winLevel) {
                    this.bigWinAni(GemsFrotuneIIData.curRollServerData.winScore, true)
                } else {
                    this.scheduleOnce(() => {
                        SlotGameData.scriptBottom.canDoNextRound();
                    }, 1)
                }
            });
        } else {
            let this_winLabelSpine_uiOpacity = this.winLabelSpine.getComponent(UIOpacity);
            let this_winLabelSpine_uiOpacity_uiOpacity = this_winLabelSpine_uiOpacity.getComponent(UIOpacity);
            tween(this_winLabelSpine_uiOpacity_uiOpacity)
                .delay(0.6)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    winLabelNode.getComponent(RollNumber).init();
                })
                .start();
            tween(this.winLabelSpine)
                .delay(0.6)
                .to(0.3, { scale: new Vec3(0, 0, 0) })
                .start();
        }
    }

    /**
     * 展示有中转盘的赢钱分数
     * @param winCoin 赢得的钱
     * @param type 1表示展示线赢，2表示转盘赢，3表示开始旋转的时候隐藏赢钱展示
     */
    showWinCoin2(winCoin, type) {
        let lineWinLabelNode = this.winLabelSpine2.getChildByName("lineWinLabel");
        let wheelWinLabelNode = this.winLabelSpine2.getChildByName("wheelWinLabel");
        let effectSp = this.winLabelSpine2.getChildByName("spine");
        if (type == 1) {
            this.winLabelSpine2.setScale(0.5,0.5);
            this.winLabelSpine2.getComponent(UIOpacity).opacity = 255;
            lineWinLabelNode.getComponent(UIOpacity).opacity = 0;
            wheelWinLabelNode.getComponent(UIOpacity).opacity = 0;
            effectSp.getComponent(UIOpacity).opacity = 0;
            this.winLabelSpine2.getComponent(MySpine).playAni(0, false, () => {
                lineWinLabelNode.getComponent(UIOpacity).opacity = 255;
                wheelWinLabelNode.getComponent(UIOpacity).opacity = 255;
                lineWinLabelNode.getComponent(RollNumber).scrollTo(winCoin, () => {
                    (SlotGameData.scriptSlots as GemsFrotuneIISlots).showWheel(true, GemsFrotuneIIData.curRollServerData.stopIndex);
                })
            })
        } else if (type == 2) {
            effectSp.getComponent(UIOpacity).opacity = 255;
            effectSp.getComponent(MySpine).playAni(0, false);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showcion');
            wheelWinLabelNode.getComponent(RollNumber).scrollTo(winCoin, () => {
                //=============to do 回复按钮
                SlotGameData.scriptBottom.updateWinNum(GemsFrotuneIIData.curRollServerData.winScore, () => {
                    this.showWinCoin2(0, 3);
                    this.scheduleOnce(() => {
                        let winLevel = SlotGameData.getCurBetScore() * 5;
                        if (SlotGameData.buyDouble) {
                            winLevel = winLevel * 1.5;
                        }
                        if (GemsFrotuneIIData.curRollServerData.winScore >= winLevel) {
                            this.bigWinAni(GemsFrotuneIIData.curRollServerData.winScore, true)
                        } else {
                            SlotGameData.scriptBottom.canDoNextRound();
                        }
                    }, 1.5)
                })
            })
        } else {
            let this_winLabelSpine2_uiOpacity = this.winLabelSpine2.getComponent(UIOpacity);
            let this_winLabelSpine2_uiOpacity_uiOpacity = this_winLabelSpine2_uiOpacity.getComponent(UIOpacity);
            tween(this_winLabelSpine2_uiOpacity_uiOpacity)
                .delay(1.1)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    lineWinLabelNode.getComponent(RollNumber).init();
                    wheelWinLabelNode.getComponent(RollNumber).init();
                    lineWinLabelNode.getComponent(Label).string = "0";
                    wheelWinLabelNode.getComponent(Label).string = "0";
                })
                .start();
            tween(this.winLabelSpine2)
                .delay(1.1)
                .to(0.3, { scale: new Vec3(0, 0, 0) })
                .start();
        }
    }

    /** 大奖展示 */
    bigWinAni(winCoin, isShow = true) {
        let winType = 0;
        this.winCoin = winCoin;
        this.SpecialWinNode.active = true;
        let winLab = this.SpecialWinNode.getChildByName("winLabel").getComponent(RollNumber);
        if (isShow) {
            //===========停止旋转
            for (let i = 0; i < this.bigWinSpineList.length; i++) {
                this.bigWinSpineList[i].active = false;
            }
            this.bigWinSpineList[winType].active = true;
            let bigWinSpine = this.bigWinSpineList[winType].getComponent(MySpine);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'bigwin', null, (stopId) => {
                this.bigWinStopId = stopId;
            }, true);

            let callback = () => {
                this.isClickBigWin = true;
                winLab.stop();
                this.SpecialWinNode.off(Node.EventType.TOUCH_START, callback, this);
                this.bigWinAni(GemsFrotuneIIData.curRollServerData.winScore, false);
            }
            this.SpecialWinNode.on(Node.EventType.TOUCH_START, callback, this);
            this.SpecialWinNode.getChildByName("winLabel").active = true;
            bigWinSpine.playAni(0, false, () => {
                bigWinSpine.playAni(1, true)
                winLab.setScrollTime(winCoin * 0.6);
                let winLevel = SlotGameData.getCurBetScore() * 10;
                let winLevel2 = SlotGameData.getCurBetScore() * 25;
                if (SlotGameData.buyDouble) {
                    winLevel = winLevel * 1.5;
                    winLevel2 = winLevel2 * 1.5;
                }
                winLab.scrollTo(winCoin, () => {
                    this.scheduleOnce(() => {
                        if (!this.isClickBigWin) {
                            this.bigWinAni(this.winCoin, false);
                        }
                    }, 0.5)
                }, (value) => {
                    if (value / 10 >= winLevel2 && !this.showsuperwin) {
                        this.showsuperwin = true;
                        for (let i = 0; i < this.bigWinSpineList.length; i++) {
                            this.bigWinSpineList[i].active = false;
                        }
                        winType = 2;
                        this.bigWinSpineList[winType].active = true;
                        this.bigWinSpineList[winType].getComponent(MySpine).playAni(0, false, () => {
                            this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true);
                        });
                    } else if (value / 10 >= winLevel && !this.showMegaWin) {
                        winType = 1;
                        this.showMegaWin = true;
                        for (let i = 0; i < this.bigWinSpineList.length; i++) {
                            this.bigWinSpineList[i].active = false;
                        }
                        winType = 1;
                        this.bigWinSpineList[winType].active = true;
                        this.bigWinSpineList[winType].getComponent(MySpine).playAni(0, false, () => {
                            this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true);
                        });
                    }
                });
            });
        } else {
            let winLevel = SlotGameData.getCurBetScore() * 10;
            let winLevel2 = SlotGameData.getCurBetScore() * 25;
            if (SlotGameData.buyDouble) {
                winLevel = winLevel * 1.5;
                winLevel2 = winLevel2 * 1.5;
            }
            if (winCoin > winLevel2) {
                winType = 2;
            } else if (winCoin > winLevel) {
                winType = 1;
            } else {
                winType = 0;
            }
            for (let i = 0; i < this.bigWinSpineList.length; i++) {
                this.bigWinSpineList[i].active = false;
            }
            this.bigWinSpineList[winType].active = true;
            let bigWinSpine = this.bigWinSpineList[winType].getComponent(MySpine);
            Utils.stopEffect(this.bigWinStopId);
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'bigwinEnd');
            bigWinSpine.playAni(2, false, () => {
                this.SpecialWinNode.active = false;
                winLab.init(0);
                SlotGameData.scriptBottom.canDoNextRound();
            });
        }
    }

    monkeyAni(){
        let monkeyAniSc = this.monkeyNode.getComponent(MySpine);
        let monkeyAniSc2 = this.monkeyNode2.getComponent(MySpine);
        if (this.aniIndex == 0) {
            this.aniIndex = 1;
            monkeyAniSc.playAni(0, false, () => {
                this.monkeyNode.getComponent(UIOpacity).opacity = 0;
                this.scheduleOnce(() => {
                    this.monkeyNode2.getComponent(UIOpacity).opacity = 255;
                    monkeyAniSc2.playAni(2, false, () => {
                        monkeyAniSc2.playAni(1, true);
                    })
                },1)
            })
        } else {
            this.aniIndex = 0;
            monkeyAniSc2.playAni(0, false, () => {
                this.monkeyNode2.getComponent(UIOpacity).opacity = 0;
                this.scheduleOnce(() => {
                    this.monkeyNode.getComponent(UIOpacity).opacity = 255;
                    monkeyAniSc.playAni(2, false, () => {
                        monkeyAniSc.playAni(1, true);
                    })
                },1)
            })
        }
    }

    onDestroy() {
        super.onDestroy();
        this.unschedule(this.monkeyAni);
    }
}
