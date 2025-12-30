import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import { PosData } from "db://assets/scripts/game/tsFrameCommon/Base/GameGlobalDefine";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import SlotGameData, { SlotMapIndex } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Super777IData, { Super777IMode } from "db://assets/games/Super777I/script/Super777IData";
import Super777ISlots from "db://assets/games/Super777I/script/Super777ISlots";

import { Label, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Vec3, _decorator, js, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Super777IGame')
export default class Super777IGame extends BaseComponent {

    @property(Node)
    ndMain: Node = null;

    @property(Node)
    ndWelcome: Node = null;

    @property(Node)
    ndWelcomeAni: Node = null;

    @property(Node)
    ndKuangAni: Node = null;

    @property(Node)
    ndZuanAni: Node = null;
    
    @property([Node])
    ndScoreList: Node[] = [];

    @property(Node)
    ndNiceWin: Node = null;

    @property(Node)
    ndTopView: Node = null;

    @property(Node)
    ndTopViewMask: Node = null;

    @property([Node])
    ndRewardAniList: Node[] = [];

    @property([SpriteFrame])
    spfItemIconList: SpriteFrame[] = [];

    @property(Node)
    ndGameMode: Node = null;

    @property([Node])
    ndNormalRightTips: Node[] = [];

    @property(Node)
    ndFreeDoubleAni: Node = null;

    @property(Label)
    lbFreeTimes: Label = null;

    @property(Label)
    lbTotalFreeTimes: Label = null;

    @property(Node)
    ndFreeXinGuang: Node = null;

    @property(Node)
    ndNiceWinParticle: Node = null;

    @property(Node)
    ndBigWinParticle: Node = null;

    iconAniList: {rewardIndexs: {[index:number]:{cbReset: Function}}, aniList: {winScore: number, scoreIndex: number, rewardIndex: number, list: PosData[], cbReset: Function}[]} = {
        rewardIndexs: {},
        aniList: []
    };

    isResetView = false;

    rightTipIndex = 0;

    enterEfectId = 0;
    welcomeEffectId = 0;

    isChangeGameModeAni = false;

    curRewardAniIndex: number = null;
    curScoreAniIndex: number = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.ndWelcome.active = true;
        this.ndTopViewMask.active = false;
        this.ndFreeXinGuang.active = false;
        this.ndNiceWinParticle.active = true;
        this.ndNiceWinParticle.getComponent(UIOpacity).opacity = 0;
        this.ndBigWinParticle.active = true;
        this.ndBigWinParticle.getComponent(UIOpacity).opacity = 0;
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_enter", () => {
            this.enterEfectId = 0;
        }, (effectId: number) => {
            this.enterEfectId = effectId;
        });
        this.ndWelcomeAni.getComponent(MySpine).playAni(0, false, () => {
            if (!this.ndWelcome.active) {
                return;
            }
            this.ndWelcomeAni.getComponent(MySpine).playAni(1, true);
        });
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "welcome", () => {
            this.welcomeEffectId = 0;
            if (!this.ndWelcome.active) {
                return;
            }
            this.ndWelcomeAni.getComponent(MySpine).playAni(2, false, () => {
                if (!this.ndWelcome.active) {
                    return;
                }
                this.ndWelcome.active = false;
                this.afterWelcome();
            });
        }, (effectId: number) => {
            this.welcomeEffectId = effectId;
        });
        this.playKuangAni(0);
        this.playZuanAni(0);
        this.updateScoreList();
        this.ndNormalRightTips.forEach(item => {
            item.active = false;
        });
        this.playNormlRightTipsAni(this.rightTipIndex);
        SlotGameData.addDynamicLoadViewData(Super777IData.NICE_WIN_VIEW, {
            ndParent: this.ndNiceWin,
            viewScript: 'Super777INiceWin',
        });
        SlotGameData.addDynamicLoadViewData(Super777IData.BIG_WIN_VIEW, {
            ndParent: this.ndTopView,
            ndMask: this.ndTopViewMask,
            viewScript: 'Super777IBigWin',
        });
        SlotGameData.addDynamicLoadViewData(Super777IData.FREE_START_VIEW, {
            ndParent: this.ndTopView,
            ndMask: this.ndTopViewMask,
            viewScript: 'Super777IFreeStart',
        });
        SlotGameData.addDynamicLoadViewData(Super777IData.FREE_END_VIEW, {
            ndParent: this.ndTopView,
            ndMask: this.ndTopViewMask,
            viewScript: 'Super777IFreeEnd',
        });
    }

    start () {
        
    }

    // update (dt) {}

    onClickEvent (event, data: string) {
        switch (data) {
            case 'welcome':
                this.ndWelcome.active = false;
                if (this.enterEfectId) {
                    Utils.stopEffect(this.enterEfectId);
                }
                if (this.welcomeEffectId) {
                    Utils.stopEffect(this.welcomeEffectId);
                }
                this.afterWelcome();
                break;
            default:
                break;
        }
    }

    afterWelcome () {
        if (SlotGameData.totalFreeTimes > 0) {
            Super777IData.gameMode = Super777IMode.Special;
            (SlotGameData.scriptGame as Super777IGame).showFreeStartView(() => {
                (SlotGameData.scriptGame as Super777IGame).enterFreeMode(() => {
                    SlotGameData.scriptBottom.canDoNextRound();
                });
            });
        }
    }

    updateScoreList () {
        let curBetNum = SlotGameData.getCurBetScore();
        for (let i = 0; i < this.ndScoreList.length; i++) {
            let score = curBetNum * Super777IData.ITEM_REWARD_CONFIG[i];
            this.ndScoreList[i].getComponent(Label).string = Utils.floatToFormat(score, 1, true, true, false);
        }
    }

    hideKuangAni () {
        this.ndKuangAni.active = false;
    }

    playKuangAni (index: number, callback: Function = null) {
        this.ndKuangAni.active = true;
        this.ndKuangAni.getComponent(MySpine).playAni(index, callback ? false : true, callback);
    }

    pauseKuangAni () {
        this.ndKuangAni.getComponent(MySpine).pauseAni();
    }

    getKuangAniDuration (index: number) {
        return this.ndKuangAni.getComponent(MySpine).getAniDuration(index);
    }

    playZuanAni (index: number) {
        this.ndZuanAni.getComponent(MySpine).playAni(index, true);
    }

    playFreeDoubleStart (callback: Function = null) {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_fg_x2_show");
        this.ndFreeDoubleAni.getComponent(MySpine).playAni(0, false, () => {
            this.ndFreeDoubleAni.getComponent(MySpine).playAni(1, true);
            if (callback) {
                callback();
            }
        });
    }

    playFreeeDoubleEnd (callback: Function = null) {
        this.ndFreeDoubleAni.getComponent(MySpine).playAni(2, false, () => {
            this.ndFreeDoubleAni.getComponent(MySpine).playAni(1, true);
            if (callback) {
                callback();
            }
        });
    }

    playNormlRightTipsAni (index: number) {
        let cbPlayNext = () => {
            setTimeout(() => {
                this.playNormlRightTipsAni(this.rightTipIndex < this.ndNormalRightTips.length-1 ? this.rightTipIndex+1 : 0);
            }, 1);
        };
        let ndNew = this.ndNormalRightTips[index];
        ndNew.active = true;
        Tween.stopAllByTarget(ndNew);
        if (this.rightTipIndex == index) {
            ndNew.getComponent(UIOpacity).opacity = 255;
            this.setTimeout(() => {
                cbPlayNext();
            }, 30000);
            return;
        }
        let ndCur = this.ndNormalRightTips[this.rightTipIndex];
        ndCur.getComponent(UIOpacity).opacity = 255;
        ndNew.getComponent(UIOpacity).opacity = 0;
        Tween.stopAllByTarget(ndCur);
        let ndCur_uiOpacity = ndCur.getComponent(UIOpacity);
        tween(ndCur_uiOpacity.getComponent(UIOpacity))
            .to(0.5, {opacity: 0})
            .call(() => {
                ndCur.active = false;
                let ndNew_uiOpacity = ndNew.getComponent(UIOpacity);
                tween(ndNew_uiOpacity.getComponent(UIOpacity))
                    .to(0.5, {opacity: 255})
                    .delay(30)
                    .call(() => {
                        cbPlayNext();
                    })
                    .start();
            })
            .start();
        this.rightTipIndex = index;
    }

    enterFreeMode (callback: Function) {
        this.isChangeGameModeAni = true;
        Utils.playMusic(SlotGameData.BUNDLE_NAME, "free_bgm");
        this.ndFreeDoubleAni.active = false;
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_fg_reels_change", null, (effectId: number) => {
            this.ndFreeXinGuang.active = true;
            this.ndFreeXinGuang.getComponent(MySpine).playAni(0, false, () => {
                this.ndFreeXinGuang.active = false;
            });
            tween(this.ndGameMode)
                .to(this.ndFreeXinGuang.getComponent(MySpine).getAniDuration(0), {y: this.ndGameMode.parent.getComponent(UITransform).contentSize.height})
                .call(() => {
                    this.ndFreeDoubleAni.active = true;
                    this.playFreeDoubleStart(() => {
                        this.isChangeGameModeAni = false;
                        if (callback) {
                            callback();
                        }
                    });
                })
                .start();
        });
    }

    backNormalMode (callback: Function) {
        this.isChangeGameModeAni = true;
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_fg_reels_change", null, (effectId: number) => {
            this.ndFreeXinGuang.active = true;
            this.ndFreeXinGuang.getComponent(MySpine).playAni(0, false, () => {
                this.ndFreeXinGuang.active = false;
            });
            tween(this.ndGameMode)
                .to(this.ndFreeXinGuang.getComponent(MySpine).getAniDuration(0), {y: 0})
                .call(() => {
                    Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
                    this.isChangeGameModeAni = false;
                    if (callback) {
                        callback();
                    }
                })
                .start();
        });
    }

    showNiceWinView (cbClsoe: Function, cbLoad: Function) {
        SlotGameData.showDynamicLoadView(Super777IData.NICE_WIN_VIEW, cbLoad, cbClsoe, SlotGameData.curRollingIndex, Super777IData.curRollServerData.winScore, null, this.ndNiceWinParticle);
    }

    showBigWinView (cbClose: Function) {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, '10109_base_bigwin_bell', () => {
            SlotGameData.showDynamicLoadView(Super777IData.BIG_WIN_VIEW, null, () => {
                SlotGameData.hideDynamicLoadView(Super777IData.BIG_WIN_VIEW);
                if (cbClose) {
                    cbClose();
                }
            }, SlotGameData.curRollingIndex, Super777IData.curRollServerData.winScore, null, this.ndBigWinParticle);
        });
    }

    showFreeStartView (cbClose: Function) {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, '10109_base_bigwin_bell', () => {
            SlotGameData.showDynamicLoadView(Super777IData.FREE_START_VIEW, null, () => {
                SlotGameData.hideDynamicLoadView(Super777IData.FREE_START_VIEW);
                this.updateFreeTimes(SlotGameData.freeTimes);
                this.updateTotalFreeTimes(SlotGameData.totalFreeTimes);
                if (cbClose) {
                    cbClose();
                }
            });
        });
    }

    showFreeEndView (cbClose: Function, winScore: number) {
        SlotGameData.showDynamicLoadView(Super777IData.FREE_END_VIEW, null, () => {
            SlotGameData.hideDynamicLoadView(Super777IData.FREE_END_VIEW);
            if (cbClose) {
                cbClose();
            }
        }, winScore);
    }

    updateFreeTimes (times: number) {
        this.lbFreeTimes.string = times.toString();
    }

    updateTotalFreeTimes (count: number) {
        this.lbTotalFreeTimes.string = count.toString();
    }

    onSlotStart () {
        this.resetView();
    }

    onSlotEnd () {
        if (Super777IData.curRollServerData.winScore > 0) {
            let mapInfo = Super777IData.curRollServerData.mapInfo;
            let rewardLineList =  Super777IData.curRollServerData.rewardLineInfo;
            for (let lineIndex = 0; lineIndex < rewardLineList.length; lineIndex++) {
                let lineList = rewardLineList[lineIndex].list;
                let rewardList = [];
                for (let i = 0; i < lineList.length; i++) {
                    rewardList.push(mapInfo[`${lineList[i].col}_${lineList[i].row}`].type);
                }
                let scoreIndex: number = null;
                let winScore = rewardLineList[lineIndex].winScore;
                let rewardIndex: number = null;
                let cbReset: Function = null;
                let isSameThree = false;
                let isSameTwo = false;
                let isWildIcon = false;
                let exitRewardType = 0;
                for (let i = 1; i < rewardList.length; i++) {
                    let type = rewardList[i];
                    if (type > 1 && type <= 6) {
                        exitRewardType = type;
                        break;
                    }
                }
                if (exitRewardType > 0) {
                    let rewardNum = 0;
                    for (let i = 0; i < rewardList.length; i++) {
                        let type = rewardList[i];
                        if (type == exitRewardType) {
                            rewardNum++;
                        } else if (type >= 7 || type <= 8) {
                            isWildIcon = true;
                        }
                    }
                    if (rewardNum == 2) {
                        isSameTwo = true;
                    }
                    if (rewardNum == 3 || (rewardNum == 2 && isWildIcon)) {
                        isSameThree = true;
                    }
                }
                if (isSameThree) {
                    scoreIndex = exitRewardType-2;
                    rewardIndex = exitRewardType-2;
                    cbReset = () => {
                        let ndIconAni = this.ndRewardAniList[rewardIndex];
                        (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[exitRewardType-1];
                        (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[exitRewardType-1];
                        (ndIconAni.children[2].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[exitRewardType-1];
                    };
                } else if (exitRewardType > 0) {
                    if (rewardList[0] >= 5 && rewardList[0] <= 6 && rewardList[1] >= 5 && rewardList[1] <= 6 && rewardList[2] >= 5 && rewardList[2] <= 6 
                        || (isSameTwo && isWildIcon && exitRewardType >= 5 && exitRewardType <= 6)) {
                        scoreIndex = 5;
                        rewardIndex = 5;
                        cbReset = () => {
                            let ndIconAni = this.ndRewardAniList[rewardIndex];
                            (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[5];
                            (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[4];
                            ndIconAni.children[0].active = true;
                            ndIconAni.children[1].active = true;
                            ndIconAni.children[2].active = false;
                        };
                    } else if ((rewardList[0] >= 2 && rewardList[0] <= 4) || (rewardList[0] >= 7 && rewardList[0] <= 8)
                        && (rewardList[1] >= 2 && rewardList[1] <= 4) || (rewardList[1] >= 7 && rewardList[1] <= 8)
                        && (rewardList[2] >= 2 && rewardList[2] <= 4) || (rewardList[2] >= 7 && rewardList[2] <= 8)) {
                        scoreIndex = 6;
                        rewardIndex = 6;
                        cbReset = () => {
                            let ndIconAni = this.ndRewardAniList[rewardIndex];
                            (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[3];
                            (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[2];
                            (ndIconAni.children[2].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[1];
                        };
                    }
                }
                if (rewardIndex != null) {
                    if (!this.iconAniList.rewardIndexs[rewardIndex]) {
                        this.iconAniList.rewardIndexs[rewardIndex] = {
                            cbReset: cbReset
                        };
                    }
                    this.iconAniList.aniList.push({
                        winScore: winScore,
                        scoreIndex: scoreIndex,
                        rewardIndex: rewardIndex,
                        list: lineList,
                        cbReset: cbReset
                    });
                }
            }
            if (this.iconAniList.aniList.length > 0) {
                if (this.iconAniList.aniList.length > 1) {
                    let rewardAddList: string[] = [];
                    for (let col = 0; col < Super777IData.COL_NUM; col++) {
                        for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                            let index = `${col}_${row}`;
                            let type = mapInfo[index].type;
                            if (type == 1) {
                                rewardAddList.push(index);
                            }
                        }
                    }
                    let lastRewardIndex: number = null;
                    let lastScoreAni: Node = null;
                    let playRewardIndexAni = (aniIndex: number) => {
                        let aniData = this.iconAniList.aniList[aniIndex];
                        this.curRewardAniIndex = aniData.rewardIndex;
                        this.curScoreAniIndex = aniData.scoreIndex;
                        let rewardIndexList: SlotMapIndex = {};
                        let iconList = aniData.list;
                        for (let i = 0; i < iconList.length; i++) {
                            let index = `${iconList[i].col}_${iconList[i].row}`;
                            let type = mapInfo[index].type;
                            let ndIcon = this.ndRewardAniList[aniData.rewardIndex].children[i];
                            ndIcon.active = type > 0;
                            if (type > 0) {
                                (ndIcon.children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[type-1];
                                rewardIndexList[index] = {};
                            }
                        }
                        rewardAddList.forEach(index => {
                            rewardIndexList[index] = {};
                        });
                        let ndIconAni = this.ndRewardAniList[aniData.rewardIndex];
                        if (lastRewardIndex != null && lastRewardIndex != aniData.rewardIndex) {
                            let lastIconAni = this.ndRewardAniList[lastRewardIndex];
                            lastIconAni.children.forEach(element => {
                                Tween.stopAllByTarget(element);
                                element.scale = new Vec3(1, 1, 1);
                            });
                        }
                        lastRewardIndex = aniData.rewardIndex;
                        ndIconAni.children.forEach(element => {
                            Tween.stopAllByTarget(element.children[0]);
                            element.children[0].scale = new Vec3(1, 1, 1);
                            tween(element.children[0])
                                .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                                .to(0.4, { scale: new Vec3(1, 1, 1) })
                                .delay(0.3)
                                .union()
                                .repeat(3)
                                .start();
                        });
                        let ndScoreAni = this.ndScoreList[aniData.scoreIndex];
                        ndScoreAni.getComponent(Label).string = aniData.winScore.toString();
                        if (lastScoreAni && lastScoreAni != ndScoreAni) {
                            Tween.stopAllByTarget(lastScoreAni);
                            lastScoreAni.scale = new Vec3(1, 1, 1);
                        }
                        Tween.stopAllByTarget(ndScoreAni);
                        ndScoreAni.scale = new Vec3(1, 1, 1);
                        tween(ndScoreAni)
                            .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                            .to(0.4, { scale: new Vec3(1, 1, 1) })
                            .delay(0.3)
                            .union()
                            .repeat(3)
                            .start();
                        (SlotGameData.scriptSlots as Super777ISlots).playIconsAni(rewardIndexList, 0, 3, () => {
                            if (this.curRewardAniIndex == null) {
                                return;
                            }
                            let nextIndex = 0;
                            if (this.iconAniList.aniList.length > 1) {
                                if (aniIndex < this.iconAniList.aniList.length-1) {
                                    nextIndex = aniIndex+1;
                                }
                            }
                            playRewardIndexAni(nextIndex);
                        });
                    }
                    playRewardIndexAni(0);
                } else {
                    let aniData = this.iconAniList.aniList[0];
                    this.curRewardAniIndex = aniData.rewardIndex;
                    this.curScoreAniIndex = aniData.scoreIndex;
                    let iconList = aniData.list;
                    for (let i = 0; i < iconList.length; i++) {
                        let index = `${iconList[i].col}_${iconList[i].row}`;
                        let type = mapInfo[index].type;
                        let ndIcon = this.ndRewardAniList[aniData.rewardIndex].children[i];
                        ndIcon.active = type > 0;
                        if (type > 0) {
                            (ndIcon.children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[type-1];
                        }
                    }
                    let ndIconAni = this.ndRewardAniList[aniData.rewardIndex];
                    ndIconAni.children.forEach(element => {
                        Tween.stopAllByTarget(element.children[0]);
                        element.children[0].scale = new Vec3(1, 1, 1);
                        tween(element.children[0])
                            .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                            .to(0.4, { scale: new Vec3(1, 1, 1) })
                            .delay(0.3)
                            .union()
                            .repeatForever()
                            .start();
                    });
                    let ndScoreAni = this.ndScoreList[aniData.scoreIndex];
                    ndScoreAni.getComponent(Label).string = aniData.winScore.toString();
                    Tween.stopAllByTarget(ndScoreAni);
                    ndScoreAni.scale = new Vec3(1, 1, 1);
                    tween(ndScoreAni)
                        .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                        .to(0.4, { scale: new Vec3(1, 1, 1) })
                        .delay(0.3)
                        .union()
                        .repeatForever()
                        .start();
                    (SlotGameData.scriptSlots as Super777ISlots).playAllRewardIconsAni();
                }
            } else {
                (SlotGameData.scriptSlots as Super777ISlots).playAllRewardIconsAni();
            }
        }
    }

    onStopSpin () {
        this.resetView();
        this.isResetView = false;
    }

    resetView () {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
        if (this.curScoreAniIndex != null) {
            let ndScoreAni = this.ndScoreList[this.curScoreAniIndex];
            Tween.stopAllByTarget(ndScoreAni);
            ndScoreAni.scale = new Vec3(1, 1, 1);
            this.updateScoreList();
            this.curScoreAniIndex = null;
        }
        if (this.curRewardAniIndex != null) {
            let ndIconAni = this.ndRewardAniList[this.curRewardAniIndex];
            ndIconAni.children.forEach(element => {
                Tween.stopAllByTarget(element.children[0]);
                element.children[0].scale = new Vec3(1, 1, 1);
            });
            this.curRewardAniIndex = null;
        }
        if (Object.keys(this.iconAniList.rewardIndexs).length > 0) {
            for (const key in this.iconAniList.rewardIndexs) {
                if (Object.prototype.hasOwnProperty.call(this.iconAniList.rewardIndexs, key)) {
                    let iconAniData = this.iconAniList.rewardIndexs[key];
                    if (iconAniData.cbReset) {
                        iconAniData.cbReset();
                    }
                }
            }
        }
        this.iconAniList = {
            rewardIndexs: {},
            aniList: []
        };
    }

}
