import MySpine from "../../../scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "../../../scripts/game/tsFrameCommon/Base/RollNumber";
import SlotGameData, { SlotStatus } from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import JungleDelightData from "./JungleDelightData";
import JungleDelightSlots from "./JungleDelightSlots";
import { _decorator, Component, Node, SpriteFrame, instantiate, tween, Tween, v2, v3, Label, EventHandler, Sprite, UITransform, UIOpacity, sp } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('JungleDelightGame')
export default class JungleDelightGame extends Component {

    @property(Node)
    speedBtn: Node = null;
    @property(Node)
    betLabelNode: Node = null;
    @property(Node)
    speedEct: Node = null;
    @property(Node)
    betEct: Node = null;
    @property(Node)
    lineNode: Node = null;
    @property(Node)
    winTipNode: Node = null;
    @property(Node)
    moveSpineNode: Node = null;
    @property(Node)
    moveBlueSpineNode: Node = null;
    @property(Node)
    freeNode: Node = null;
    @property(Node)
    freeNode2: Node = null;
    @property(Node)
    norNode: Node = null;
    @property(Node)
    SpecialWinNode: Node = null;
    @property(Node)
    freeModeStartNode: Node = null;
    @property(Node)
    freeWinNode: Node = null;
    @property(Node)
    ndWinLab: Node = null;
    

    @property(Node)
    moveTipNode: Node = null;

    @property([Node])
    bigWinSpineList: Node[] = [];
    @property([Node])
    freeSpineList: Node[] = [];
    @property([SpriteFrame])
    norTip: SpriteFrame[] = [];
    @property([SpriteFrame])
    freeTip: SpriteFrame[] = [];

    isWin = false;
    moveSpeed = 1;
    freeSelect = 0;
    winCoin = 0;
    isShowBigWin = false;
    bigWinStopId = 0;
    addCoinStopId = 0;
    endRollStopId = 0;
    freeLoadStopId = 0;
    totalWinStopId = 0;

    showMegaWin = false;
    showsuperwin = false;

    startFreeTimer:any = null;

    start() {
        this.spineMove();
        this.tipMove(true);//重连这块得优化
        // this.scheduleOnce(()=>{
        //     this.isShowBigWin = true;
        //     this.bigWinAni(500);
        //     // this.freeModeSelect(5)
        // },3)
        Utils.playMusic(JungleDelightData.BUNDLE_NAME, "bgm_mg");
    }

    update(dt: number) {
    }

    onSlotStart() {
        this.showLine(true, -1);
        this.showWinSpine(2, 0);
        if (this.isWin) {
            this.isWin = false;
            this.tipMove(true);
        }
        this.winCoin = 0;
        this.isShowBigWin = false;
        if (JungleDelightData.isFreeGame) {
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsSymSwitch', null, (stopId) => {
                this.endRollStopId = stopId;
            });
        } else {
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'spinReelActiveLoop', null, (stopId) => {
                this.endRollStopId = stopId;
            });
        }
    }

    onSlotEnd() {
        Utils.stopEffect(this.endRollStopId);
        if (JungleDelightData.curRollServerData.winScore > 0) {
            if (JungleDelightData.isFreeGame) {
                SlotGameData.scriptBottom.updateWinNum(JungleDelightData.freeTotalWin);
            } else {
                SlotGameData.scriptBottom.updateWinNum(JungleDelightData.curRollServerData.winScore);
            }
            this.isWin = true;
            this.tipMove(false);
        }
    }

    /** 切换速度 */
    speedBtnEfect() {
        let eft = instantiate(this.speedEct);
        eft.parent = this.speedBtn;
        eft.active = true;
    }
    /** 修改下注 */
    changeBetEfect(por) {
        if (por == 1) {
            let eft = instantiate(this.betEct);
            eft.parent = this.betLabelNode;
            eft.active = true;
        }
    }

    /**
     * 展示线spine
     * @param isCloseAll 是否隐藏全部
     * @param index 传入0-19展示对应的线；-1不展示
     */
    showLine(isCloseAll: boolean, index: number) {
        if (isCloseAll) {
            for (let i = 0; i < this.lineNode.children.length; i++) {
                this.lineNode.children[i].active = false;
            }
        }
        if (index >= 0) {
            this.lineNode.children[index].active = true;
        }
    }
    
    /**
     * 赢钱展示
     * @param type 0代表正常模式，1代表免费模式赢钱展示,2表示关闭所有界面
     * @param winCoin 赢得的钱
     */
    showWinSpine(type: number, winCoin: number, isShowAni = true, callback?: Function) {
        if (type == 0) {
            this.winTipNode.children[0].active = true;
            this.winTipNode.children[1].active = false;
            if (isShowAni) {
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_main', null, (stopId) => {
                    this.addCoinStopId = stopId;
                });
                (this.winTipNode.children[0].getComponent(sp.Skeleton) as any).setAnimation(0, "animation", false);
                this.winTipNode.children[0].getComponentInChildren(RollNumber).scrollTo(winCoin, () => {
                    if (callback && winCoin < SlotGameData.getCurBetScore() * 5 && !JungleDelightData.curRollServerData.isWinFreeGame) {
                        callback();
                        if (isShowAni) {
                            Utils.stopEffect(this.addCoinStopId);
                            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_end');
                        }
                    } else if (JungleDelightData.curRollServerData.isWinFreeGame && winCoin < SlotGameData.getCurBetScore() * 10) {
                        this.freeModeSelect(SlotGameData.totalFreeTimes);
                    }
                });
            } else {
                this.winTipNode.children[0].getComponentInChildren(RollNumber).reset(winCoin);
            }

        } else if (type == 1) {
            this.winTipNode.children[0].active = false;
            this.winTipNode.children[1].active = true;
            if (isShowAni) {
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_main', null, (stopId) => {
                    this.addCoinStopId = stopId;
                });
                (this.winTipNode.children[1].getComponent(sp.Skeleton) as any).setAnimation(0, "animation", false);
                this.winTipNode.children[1].getComponentInChildren(RollNumber).scrollTo(winCoin, () => {
                    if (callback && winCoin < SlotGameData.getCurBetScore() * 5) {
                        callback();
                        if (isShowAni) {
                            Utils.stopEffect(this.addCoinStopId);
                            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_end');
                        }
                    }
                });
            } else {
                this.winTipNode.children[0].getComponentInChildren(RollNumber).reset(winCoin);
            }
        } else {
            for (let i = 0; i < this.winTipNode.children.length; i++) {
                this.winTipNode.children[i].active = false;
            }
        }
        //===================添加赢钱展示label然后判断是否是要播bigwin
        if (winCoin >= SlotGameData.getCurBetScore() * 5 && !this.isShowBigWin) {//只显示一次大奖动画
            this.isShowBigWin = true;
            this.bigWinAni(winCoin);
        }
    }

    /** 大奖展示 */
    bigWinAni(winCoin, isShow = true) {
        this.winCoin = winCoin;
        this.SpecialWinNode.active = true;
        for (let i = 0; i < this.bigWinSpineList.length; i++) {
            this.bigWinSpineList[i].active = false;
        }
        let shuSpine = this.SpecialWinNode.getChildByName("shu").getComponent(MySpine);
        let monkeySpine = this.SpecialWinNode.getChildByName("monkey").getComponent(MySpine);
        let startWinSpine = this.bigWinSpineList[0].getComponent(MySpine);
        let winLab = this.SpecialWinNode.getChildByName("winLabel").getComponent(Label);
        let aniLab = this.SpecialWinNode.getChildByName("aniLabel");
        let curPos = aniLab.getPosition();
        if (isShow) {
            //===========停止旋转
            let aniLabOpacity = aniLab.getComponent(UIOpacity);
            if (!aniLabOpacity) {
                aniLabOpacity = aniLab.addComponent(UIOpacity);
            }
            aniLabOpacity.opacity = 0;
            startWinSpine.node.active = true;
            let addNum = true;
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_bigwin_main', null, (stopId) => {
                this.bigWinStopId = stopId;
                this.SpecialWinNode.on(Node.EventType.TOUCH_START, ()=>{
                    addNum = false;
                }, this);
            },true);
            this.SpecialWinNode.getChildByName("winLabel").active = true;
            shuSpine.playAni(0, false, () => {
                shuSpine.playAni(1, true);
            });
            monkeySpine.playAni(0, false, () => {
                monkeySpine.playAni(1, true);
            });
            startWinSpine.playAni(0, false, () => {
                startWinSpine.playAni(1, true)
                let time = winCoin * 0.6;

                this.showMegaWin = false;
                this.showsuperwin = false;
                let winLevel = SlotGameData.getCurBetScore() * 10;
                let winLevel2 = SlotGameData.getCurBetScore() * 25;

                let callback = () => {
                    tween(aniLab)
                        .call(() => {
                            aniLab.getComponent(Label).string = winLab.string;
                            let uiOpacity = aniLab.getComponent(UIOpacity);
                            if (!uiOpacity) {
                                uiOpacity = aniLab.addComponent(UIOpacity);
                            }
                            uiOpacity.opacity = 255;
                            Utils.stopEffect(this.bigWinStopId);
                            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_bigwin_end');
                        })
                        .to(0.5, { position: v3(curPos.x, curPos.y + 10, 0), scale: v3(1.3, 1.3, 1) }, {
                            onUpdate: (target, ratio) => {
                                target.setPosition(v3(curPos.x, curPos.y + 10 * ratio, 0));
                                target.setScale(v3(1 + 0.3 * ratio, 1 + 0.3 * ratio, 1));
                                let uiOpacity = target.getComponent(UIOpacity);
                                if (!uiOpacity) {
                                    uiOpacity = target.addComponent(UIOpacity);
                                }
                                uiOpacity.opacity = Math.floor(255 * (1 - ratio));
                            }
                        })
                        .call(() => {
                            let uiOpacity = aniLab.getComponent(UIOpacity);
                            if (uiOpacity) {
                                uiOpacity.opacity = 0;
                            }
                            aniLab.setPosition(curPos);
                        })
                        .delay(1)
                        .call(() => {
                            this.bigWinAni(this.winCoin, false);
                        })
                        .start();
                }
                
                let obj = { n: 0 }
                tween(obj)
                    .tag(2)
                    .to(time, { n: winCoin }, {
                        easing: "expoOut",
                        onUpdate: () => {
                            if (winLab) {
                                winLab.string = obj.n.toFixed(2);
                            }
                            if (this.isShowBigWin) {
                                let curvalue = obj.n;
                                let winType = 0
                                if (curvalue >= winLevel2 && !this.showsuperwin) {
                                    this.showsuperwin = true;
                                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_bigwin_title_change');
                                    for (let i = 0; i < this.bigWinSpineList.length; i++) {
                                        this.bigWinSpineList[i].active = false;
                                    }
                                    winType = 2;
                                    this.bigWinSpineList[winType].active = true;
                                    this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true);
                                } else if (curvalue >= winLevel && !this.showMegaWin) {
                                    winType = 1;
                                    this.showMegaWin = true;
                                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_bigwin_title_change');
                                    for (let i = 0; i < this.bigWinSpineList.length; i++) {
                                        this.bigWinSpineList[i].active = false;
                                    }
                                    winType = 1;
                                    this.bigWinSpineList[winType].active = true;
                                    this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true);
                                }
                            }
                            if (!addNum) {
                                Tween.stopAllByTag(2);
                                this.SpecialWinNode.off(Node.EventType.TOUCH_START, () => {
                                    addNum = false;
                                }, this);
                                for (let i = 0; i < this.bigWinSpineList.length; i++) {
                                    this.bigWinSpineList[i].active = false;
                                }
                                let winType = 0;
                                if (JungleDelightData.curRollServerData.winScore >= winLevel2) {
                                    winType = 2;
                                } else if (JungleDelightData.curRollServerData.winScore >= winLevel) {
                                    winType = 1;
                                }
                                this.bigWinSpineList[winType].active = true;
                                this.bigWinSpineList[winType].getComponent(MySpine).playAni(1, true);
                                winLab.string = winCoin.toFixed(2);
                                callback();
                            }
                        }
                    })
                    .call(() => {
                        callback();
                    })
                    .start();
            });
        } else {
            this.SpecialWinNode.getChildByName("winLabel").active = false;
            shuSpine.playAni(2, false);
            monkeySpine.playAni(2, false, () => {
                this.SpecialWinNode.active = false;
                winLab.string = "";
                if (SlotGameData.freeTimes == SlotGameData.totalFreeTimes && SlotGameData.totalFreeTimes > 0) {
                    (SlotGameData.scriptGame as JungleDelightGame).freeWinAni(JungleDelightData.freeTotalWin);
                } else {
                    if (!JungleDelightData.curRollServerData.isWinFreeGame) {//不是进入免费模式时
                        SlotGameData.scriptBottom.canDoNextRound();
                    } else {
                        this.freeModeSelect(SlotGameData.totalFreeTimes);
                    }
                }
            });
        }
    }

    /** 弹出免费模式开始游戏弹窗 */
    freeModeSelect(count: number) {
        this.freeModeStartNode.active = true;
        Utils.playEffect(JungleDelightData.BUNDLE_NAME, "bgm_fs_loading", null, (stopID) => {
            this.freeLoadStopId = stopID;
        }, true);
        (SlotGameData.scriptSlots as JungleDelightSlots).showKuang(true);
        let freeTipNode = this.freeModeStartNode.getChildByName("freeTip");
        let freeTipNode2 = this.freeModeStartNode.getChildByName("freeTip2");
        let shuSpine = this.freeModeStartNode.getChildByName("shu").getComponent(MySpine);
        let monkeySpine = this.freeModeStartNode.getChildByName("monkey").getComponent(MySpine);
        let btnSpine = this.freeModeStartNode.getChildByName("start").getChildByName("spine").getComponent(MySpine);
        let countLab = this.freeModeStartNode.getChildByName("count").getComponent(Label);
        freeTipNode.active = false;
        freeTipNode2.active = false;
        countLab.node.active = false;
        shuSpine.playAni(0, false, () => {
            shuSpine.playAni(1, true);
        });
        monkeySpine.playAni(0, false, () => {
            monkeySpine.playAni(1, true);
        });
        btnSpine.playAni(0, false, () => {
            this.changeFreeBg(true);
            btnSpine.playAni(1, true);
            countLab.string = count.toString();
            freeTipNode.active = true;
            freeTipNode2.active = true;
            countLab.node.active = true;
            this.startFreeTimer = this.scheduleOnce(this.freeModeStart, 5);
        });
        Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsLoadingTransTree');
    }

    /** 开始免费游戏 */
    freeModeStart() {
        Utils.stopEffect(this.freeLoadStopId);
        this.unschedule(this.startFreeTimer);
        let freeTipNode = this.freeModeStartNode.getChildByName("freeTip");
        let freeTipNode2 = this.freeModeStartNode.getChildByName("freeTip2");
        let shuSpine = this.freeModeStartNode.getChildByName("shu").getComponent(MySpine);
        let monkeySpine = this.freeModeStartNode.getChildByName("monkey").getComponent(MySpine);
        let btnSpine = this.freeModeStartNode.getChildByName("start").getChildByName("spine").getComponent(MySpine);
        let countLab = this.freeModeStartNode.getChildByName("count");
        freeTipNode.active = false;
        freeTipNode2.active = false;
        countLab.active = false;
        shuSpine.playAni(2, false);
        monkeySpine.playAni(2, false);
        btnSpine.playAni(2, false, () => {
            btnSpine.playAni(3, false);
            Utils.playMusic(JungleDelightData.BUNDLE_NAME, "bgm_fs");
            this.freeModeStartNode.active = false;
            //===========开始旋转
            JungleDelightData.freeTotalWin = 0;
            SlotGameData.scriptBottom.canDoNextRound();
        });
        JungleDelightData.isFreeGame = true;
        Utils.playSlotsCommonEffect('slot_reel_click');
    }

    freeWinAni(winCoin, isShow = true) {
        this.freeWinNode.active = true;
        let bgSpine = this.freeWinNode.getChildByName("bgSpine").getComponent(MySpine);
        let spine = this.freeWinNode.getChildByName("spine").getComponent(MySpine);
        let winLab = this.freeWinNode.getChildByName("winLabel").getComponent(Label);
        if (isShow) {
            //===========停止旋转
            JungleDelightData.isFreeGame = false;
            let winLabelNode = this.freeWinNode.getChildByName("winLabel");
            let winLabelOpacity = winLabelNode.getComponent(UIOpacity);
            if (!winLabelOpacity) {
                winLabelOpacity = winLabelNode.addComponent(UIOpacity);
            }
            winLabelOpacity.opacity = 255;
            bgSpine.playAni(0, false, () => {
                bgSpine.playAni(1, true);
            });
            spine.playAni(0, false, () => {
                spine.playAni(1, true)
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_main',null,(stopID)=>{
                    this.totalWinStopId = stopID;
                });
                 let obj = { n: 0 }
                tween(obj)
                    .to(1.5, { n: winCoin }, {
                        easing: "expoOut",
                        onUpdate: () => {
                            if (winLab) {
                                winLab.string = obj.n.toFixed(2);
                            }
                        }
                    })
                    .call(() => {
                        Utils.stopEffect(this.totalWinStopId);
                        Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'bgm_totalwin_end');
                        this.scheduleOnce(() => {
                            this.freeWinAni(0, false);
                            this.changeFreeBg(false);
                        }, 1);
                    })
                    .start();
            });
        } else {
            let winLabelNode = this.freeWinNode.getChildByName("winLabel");
            let winLabelOpacity = winLabelNode.getComponent(UIOpacity);
            if (!winLabelOpacity) {
                winLabelOpacity = winLabelNode.addComponent(UIOpacity);
            }
            winLabelOpacity.opacity = 0;
            bgSpine.playAni(2, false);
            spine.playAni(2, false, () => {
                this.freeWinNode.active = false;
                winLab.string = "";
                (SlotGameData.scriptSlots as JungleDelightSlots).showKuang(true);
                JungleDelightData.curRollServerData.isWinFreeGame = false;
                Utils.playMusic(JungleDelightData.BUNDLE_NAME, "bgm_mg");
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsTotalwinTransExit');
                SlotGameData.scriptBottom.canDoNextRound();
            });
        }
    }

    /**
     * 提示例文本提示
     * @param isMove 是否移动
     */
    tipMove(isMove: boolean = true) {
        let tipSprite = this.moveTipNode.getComponent(Sprite);
        if (SlotGameData.isFreeMode) {
            tipSprite.spriteFrame = this.freeTip[Utils.getRandNum(0, 3)];
        } else {
            tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 3)];
        }
        const uiTransform = this.moveTipNode.getComponent(UITransform);
        const parentTransform = this.moveTipNode.parent.getComponent(UITransform);
        let spriteSize = { width: uiTransform.width, height: uiTransform.height };
        let startPos = parentTransform.width / 2; //mask为680，取一半让它不出现在屏幕
        let endPos = v3(-(spriteSize.width + startPos), 0, 0);
        this.moveTipNode.setPosition(v3(startPos, 0, 0));
        if (isMove) {
            let move = tween(this.moveTipNode)
                .to(8, { position: endPos })
                .call(() => {
                    if (SlotGameData.isFreeMode) {
                        tipSprite.spriteFrame = this.freeTip[Utils.getRandNum(0, 3)];
                    } else {
                        tipSprite.spriteFrame = this.norTip[Utils.getRandNum(0, 3)];
                    }
                    spriteSize = { width: uiTransform.width, height: uiTransform.height };
                    endPos = v3(-(spriteSize.width + startPos), 0, 0);
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

    /** 狐狸动画往反移动 */
    spineMove(isMove = true) {
        let startPos1 = 600;
        let startPos2 = 550;
        if (isMove) {
            if (this.moveSpeed == 1) {
                this.moveSpineNode.getComponent(MySpine).playAni(Utils.getRandNum(0, 2), true);
                this.moveBlueSpineNode.getComponent(MySpine).playAni(1, true)
            } else {
                this.moveSpineNode.getComponent(MySpine).playAni(Utils.getRandNum(3, 5), true);
                this.moveBlueSpineNode.getComponent(MySpine).playAni(0, true)
            }
            this.moveSpineNode.setPosition(v3(startPos1 * this.moveSpeed, -230, 0));
            let endPos = v3(-startPos1 * this.moveSpeed, -230, 0);
            tween(this.moveSpineNode)
                .to(10, { position: endPos })
                .delay(2)
                .call(() => {
                    this.moveSpeed = this.moveSpeed * -1;
                    this.spineMove();
                })
                .start();
            this.moveBlueSpineNode.setPosition(v3(startPos2 * this.moveSpeed, -440, 0));
            let endPos2 = v3(-startPos2 * this.moveSpeed, -440, 0);
            tween(this.moveBlueSpineNode)
                .to(7, { position: endPos2 })
                .start();
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, `voxInactive0${Utils.getRandNum(1, 2)}`);
        } else {
            Tween.stopAllByTarget(this.moveSpineNode);
            Tween.stopAllByTarget(this.moveBlueSpineNode);
            this.moveSpeed = 1;
            this.moveSpineNode.setPosition(v3(startPos1 * this.moveSpeed, -230, 0));
            this.moveBlueSpineNode.setPosition(v3(startPos2 * this.moveSpeed, -440, 0));
        }
    }

    /** 免费模式狐狸动画往反移动 */
    freeSpineMove(isMove = true) {
        let startPos1 = 700;
        for (let i = 0; i < this.freeSpineList.length; i++) {
            this.freeSpineList[i].active = false;
        }
        if (isMove) {
            this.freeSelect = Utils.getRandNum(0, 2);
            let aniNode = this.freeSpineList[this.freeSelect];
            aniNode.active = true;
            aniNode.setPosition(v3(startPos1 * this.moveSpeed, -300, 0));
            aniNode.setScale(v3(0.8 * this.moveSpeed, 0.8, 1));
            let endPos = v3(-startPos1 * this.moveSpeed, -300, 0);
            tween(aniNode)
                .tag(0)
                .to(10, { position: endPos })
                .delay(2)
                .call(() => {
                    this.moveSpeed = this.moveSpeed * -1;
                    this.freeSpineMove();
                })
                .start();
        } else {
            Tween.stopAllByTag(0);
            this.moveSpeed = 1;
            this.freeSpineList[this.freeSelect].setPosition(v3(startPos1 * this.moveSpeed, -300, 0));
        }
    }

    changeFreeBg(isShow) {
        if (isShow) {
            this.freeNode.active = true;
            this.freeNode2.active = true;
            this.norNode.active = false;
            this.freeSpineMove(true);
            this.spineMove(false);
        } else {
            this.freeNode.active = false;
            this.freeNode2.active = false;
            this.norNode.active = true;
            this.spineMove(true);
            this.freeSpineMove(false);
        }
    }
}
