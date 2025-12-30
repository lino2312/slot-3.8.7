import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import { BezierCurveAnimation } from "db://assets/scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "db://assets/scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData, SlotStatus } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Diamond777Data from "db://assets/games/Diamond777/script/Diamond777Data";
import Diamond777Game from "db://assets/games/Diamond777/script/Diamond777Game";
import Diamond777Item from "db://assets/games/Diamond777/script/Diamond777Item";
import Diamond777NiceWin from "db://assets/games/Diamond777/script/Diamond777NiceWin";

import { Node, Tween, UIOpacity, _decorator, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777Slots')
export default class Diamond777Slots extends BaseComponent {

    @property([Node])
    ndSpecialBgList: Node[] = [];

    @property(Node)
    ndSlotBtnAni: Node = null;

    @property([Node])
    ndRollList: Node[] = [];

    @property(Node)
    ndRespin: Node = null;

    @property(Node)
    ndRespinBgAni: Node = null;

    @property(Node)
    ndRespinRewardAni: Node = null;

    @property(Node)
    ndNiceWinParticle: Node = null;

    @property(Node)
    ndBigWinParticle: Node = null;

    targetFirstIndexNList: number[] = [];
    targetIndexNList: number[] = [];
    targetIndexNListOld: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isWaitRoll = false;
    isWaitRollReady = false;
    isStopRoll = false;
    isSkipSpin = false;
    rollingNum = 0;
    rollEndList: boolean[] = [];
    rollItemList: Node[][] = [];
    // 滚动符号列表数据
    itemDataList: {[index:string]:{type:number,isLoaded:boolean}} = {};

    scrollEffectId = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        for (let i = 0; i < Diamond777Data.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME+'_item_'+(i+1), SlotGameData.BUNDLE_NAME, 'prefab/items/'+(i+1));
        }
        this.ndNiceWinParticle.active = true;
        this.ndNiceWinParticle.getComponent(UIOpacity).opacity = 0;
        this.ndBigWinParticle.active = true;
        this.ndBigWinParticle.getComponent(UIOpacity).opacity = 0;
        this.updateSpecialBg(false);
    }

    onDestroy () {

    }

    start () {

    }

    // update (dt) {}

    onClickEvent (event, data: string) {
        switch (data) {
            case 'slot':
                this.onClickSlotBtn();
                break;
            default:
                break;
        }
    }

    onClickSlotBtn () {
        SlotGameData.scriptBottom.onClickSpin();
    }

    onInitMapInfo (mapInfo: SlotMapInfo) {
        // 初始化列表数据
        for (const index in mapInfo) {
            if (Object.prototype.hasOwnProperty.call(mapInfo, index)) {
                const element = mapInfo[index];
                if (element) {
                    this.itemDataList[index] = {
                        type: element.type,
                        isLoaded: false,
                    }
                }
            }
        }
        this.initRollList();
    }

    onWaitSpinMsg () {
        Utils.stopAllEffect();
        this.resetView();
        this.isSkipSpin = false;
        this.isStopRoll = false;
        this.isWaitRoll = true;
        SlotGameData.curRollingIndex++;
        (SlotGameData.scriptGame as Diamond777Game).onSlotStart();
        this.playSlotAni(0);
        let audioName = 'reel_start';
        if (SlotGameData.isRespinMode) {
            audioName = 'respin';
        }
        Utils.playEffect(SlotGameData.BUNDLE_NAME, audioName, null, () => {
            for (let i = 0; i < this.ndRollList.length; i++) {
                if (i == 1 && SlotGameData.isRespinMode) {
                    continue;
                }
                let ndRollItem = this.ndRollList[i].children[0];
                if (ndRollItem) {
                    let scriptRoll = ndRollItem.getComponent(RollingLottery);
                    let gapTime = 0;
                    switch (SlotGameData.curSpeedIndex) {
                        case 0:
                            gapTime = 80;
                            break;
                        case 1:
                            gapTime = 0;
                            break;
                        default:
                            break;
                    }
                    this.setTimeout(() => {
                        scriptRoll.loop(2500);
                    }, gapTime*i);
                }
            }
        });
        if (!SlotGameData.isRespinMode) {
            if (SlotGameData.totalRespinTimes > 0) {
                this.updateSpecialBg(true);
            }  else if (this.ndRespin.active) {
                this.updateSpecialBg(false);
                let this_ndRespin_uiOpacity = this.ndRespin.getComponent(UIOpacity);
                if (!this_ndRespin_uiOpacity) {
                    this_ndRespin_uiOpacity = this.ndRespin.addComponent(UIOpacity);
                }
                tween(this_ndRespin_uiOpacity)
                    .to(0.1, {opacity: 0})
                    .call(() =>  {
                        this.ndRespin.active = false;
                        Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
                    })
                    .start();
            }
        }
        if (!SlotGameData.isRespinMode && SlotGameData.totalRespinTimes > 0) {
            (SlotGameData.scriptGame as Diamond777Game).playKuangAni(2);
        } else if (SlotGameData.totalRespinTimes > 0) {
            (SlotGameData.scriptGame as Diamond777Game).playKuangAni(1);
        } else {
            (SlotGameData.scriptGame as Diamond777Game).playKuangAni(0);
        }
    }

    onStartSpin (data: SlotSpinMsgData) {
        Diamond777Data.curRollServerData = data;
        if (SlotGameData.totalRespinTimes == 0 && !SlotGameData.isRespinMode) {
            SlotGameData.isSlotSpinBtnShowByWin = Diamond777Data.curRollServerData.winScore > 0 && Diamond777Data.curRollServerData.winScore < SlotGameData.getCurBetScore()*Diamond777Data.BIG_WIN_MIN_REWARD;
            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        } else {
            SlotGameData.isSlotSpinBtnShowByWin = false;
            if (SlotGameData.totalRespinTimes > 0) {
                SlotGameData.scriptBottom.showBtnsByState(SlotStatus.unstoped);
            } else {
                SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
            }
        }
        this.startRoll();
    }

    onStopSpin () {
        if (this.isStopRoll) {
            return;
        }
        if (SlotGameData.totalRespinTimes > 0 || SlotGameData.isRespinMode) {
            return;
        }
        let rollCount = this.ndRollList.length;
        if (SlotGameData.isRespinMode) {
            rollCount--;
        }
        if (this.rollingNum < rollCount) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        for (let i = 0; i < this.ndRollList.length; i++) {
            if (i == 1 && SlotGameData.isRespinMode) {
                continue;
            }
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.stop();
                scriptRoll.jump(this.targetIndexNList[i]);
                this.targetIndexNList[i] -= scriptRoll.getItemNum();
                let animationTime = 0.1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.1*i;
                        break;
                    case 1:
                        animationTime = 0.05*i;
                        break;
                    default:
                        break;
                }
                ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime);
                scriptRoll.move(this.targetIndexNList[i], {
                    tweenIndexNS: [0],
                });
            }
        }
    }

    onSkipSpin () {
        console.log('onSkipSpin');
        this.skipSlot();
    }

    initRollList () {
        let funLoadFinished = () => {
            if (this.rollListLoadedNum < Diamond777Data.COL_NUM*Diamond777Data.ROW_NUM) {
                this.rollListLoadedNum++;
                if (this.rollListLoadedNum == Diamond777Data.COL_NUM*Diamond777Data.ROW_NUM) {
                    if (!this.isRollListLoaded) {
                        this.setTimeout(() => {
                            this.isRollListLoaded = true;
                            if (this.isWaitRollReady) {
                                this.isWaitRollReady = false;
                                this.startRoll();
                            }
                        }, 500);
                    }
                }
            }
        };
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.eventItemUpdate = (node_: Node, indexN_: number) => {
                    let isToRespin = false;
                    if (!this.isWaitRoll && i == 1 && SlotGameData.totalRespinTimes > 0 && !SlotGameData.isRespinMode) {
                        isToRespin = true;
                    }
                    let targetIndexN = this.targetIndexNList[i];
                    if (!this.isWaitRoll && indexN_ >= targetIndexN-2 && indexN_ <= targetIndexN+2) {
                        let rowIndex = indexN_-(targetIndexN-2);
                        if (!isToRespin) {
                            this.updateRollItem(i, rowIndex, node_, () => {
                                funLoadFinished();
                            });
                        } else {
                            if (indexN_ == targetIndexN-2 || indexN_ == targetIndexN+2) {
                                let type = Math.floor(Math.random()*(Diamond777Data.ITEM_SPECIAL_NUM))+Diamond777Data.ITEM_NORMAL_NUM+1;
                                this.updateItem(node_, type, funLoadFinished);
                            } else {
                                this.updateRollItem(i, rowIndex, node_, () => {
                                    funLoadFinished();
                                });
                            }
                        }
                    } else {
                        let type = 0;
                        if (isToRespin) {
                            type = Math.floor(Math.random()*(Diamond777Data.ITEM_SPECIAL_NUM))+Diamond777Data.ITEM_NORMAL_NUM+1;
                        } else {
                            let isBlank = Math.random() > 0.5;
                            if (!isBlank) {
                                type = Math.floor(Math.random()*(Diamond777Data.ITEM_NORMAL_NUM+1));
                            }
                        }
                        this.updateItem(node_, type);
                    }
                }
                scriptRoll.eventScrollEnd = () => {
                    SlotGameData.scriptBottom.onSlotEnd();
                    this.rollEndList[i] = true;
                    this.updateRollEnd(i);
                }
                this.targetFirstIndexNList.push(scriptRoll.firstIndexN);
                this.targetIndexNList.push(scriptRoll.firstIndexN);
                this.targetIndexNListOld.push(scriptRoll.firstIndexN);
                this.rollEndList.push(false);
                let itemList = [];
                for (let j = 0; j < Diamond777Data.ROW_NUM; j++) {
                    let index = `${i}_${j}`;
                    itemList.push(this.itemDataList[index].type);
                }
                scriptRoll.initList(i, itemList, () => { // 列表加载完成
                    
                }, (row: number, node: Node) => { // 符号加载完成
                    if (this.rollItemList[i] == null) {
                        this.rollItemList[i] = [];
                    }
                    this.rollItemList[i][row] = node;
                }, (row: number) => { // 符号位置发生变动回调

                });
            }
        }
    }

    updateRollItem (col: number, row: number, node: Node, callback: Function) {
        let index = `${col}_${row}`;
        let itemData = this.itemDataList[index];
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        if (!itemData.isLoaded) {
            itemData.isLoaded = true;
            this.updateItem(node, itemData.type, funLoadFinished);
        } else {
            funLoadFinished();
        }
    }

    updateRollEnd (rollIndex: number, callback: Function = null) {
        this.rollingNum--;
        if (this.rollingNum == 0) {
            SlotGameData.isResetNextWinNum = SlotGameData.totalRespinTimes == 0 || SlotGameData.isRespinMode;
            if (this.isStopRoll && Diamond777Data.curRollServerData.winScore == 0) {
                SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                this.skipSlot();
            } else {
                (SlotGameData.scriptGame as Diamond777Game).onSlotEnd();
                if (SlotGameData.totalRespinTimes == 0) {
                    if (Diamond777Data.curRollServerData.winScore > 0) {
                        if (SlotGameData.isSlotSpinBtnShowByWin) {
                            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.skipSpin);
                        } else {
                            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                        }
                    } else {
                        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
                    }
                }
                let curRollingIndexTmp = SlotGameData.curRollingIndex;
                let timeout = 0;
                let cbDoNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                        return;
                    }
                    SlotGameData.scriptBottom.canDoNextRound();
                };
                let cbNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                        return;
                    }
                    this.setTimeout(() => {
                        if (SlotGameData.totalRespinTimes > 0 && !SlotGameData.isRespinMode) {
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, '10108_base_bigwin_bell');
                            this.ndRespinRewardAni.getComponent(MySpine).playAni(1, false, () => {
                                this.ndRespinRewardAni.getComponent(MySpine).playAni(2, false, () => {
                                    this.ndRespinRewardAni.getComponent(MySpine).playAni(3, true);
                                });
                            });
                            SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, null, true, 1);
                            this.setTimeout(() => {
                                cbDoNextRound();
                            }, 1000);
                        } else {
                            cbDoNextRound();
                        }
                    }, timeout)
                };
                if (SlotGameData.totalRespinTimes > 0) {
                    if (!SlotGameData.isRespinMode) {
                        (SlotGameData.scriptGame as Diamond777Game).pauseKuangAni();
                        for (let col = 0; col < Diamond777Data.COL_NUM; col++) {
                            if (col == 1) {
                                continue;
                            }
                            for (let row = 0; row < Diamond777Data.ROW_NUM; row++) {
                                let item = this.rollItemList[col][row].children[0];
                                if (item) {
                                    item.getComponent(Diamond777Item).updateIsIconGray(true);
                                }
                            }
                        }
                        this.ndRespin.active = true;
                        this.ndRespin.getComponent(UIOpacity).opacity = 0;
                        this.ndRespinRewardAni.getComponent(MySpine).setSkinIndex(this.itemDataList['1_2'].type-6);
                       (SlotGameData.scriptGame as Diamond777Game).playKuangAni(0);
                        this.ndRespin.active = true;
                        this.ndRespin.getComponent(UIOpacity).opacity = 255;
                        this.ndRespinBgAni.getComponent(MySpine).playAni();
                        this.ndRespinRewardAni.getComponent(MySpine).playAni(0, false);
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10108_base_2nd_stop");
                        this.setTimeout(() => {
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "10108_base_bigwin_bell");
                        }, 500);
                        timeout = 2500;
                    } else {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10108_respin_reel_stop");
                        (SlotGameData.scriptGame as Diamond777Game).playKuangAni(1, () => {
                            (SlotGameData.scriptGame as Diamond777Game).playKuangAni(0);
                        });
                        timeout = (SlotGameData.scriptGame as Diamond777Game).getKuangAniDuration(1)*1000;
                    }
                } else if (Diamond777Data.curRollServerData.winScore > 0) {
                    let num = 0;
                    let count = 0;
                    for (let col = 0; col < Diamond777Data.COL_NUM; col++) {
                        for (let row = 0; row < Diamond777Data.ROW_NUM; row++) {
                            let item = this.rollItemList[col][row].children[0];
                            if (item) {
                                count++;
                                tween(item)
                                    .delay(0.2)
                                    .call(() => {
                                        item.getComponent(Diamond777Item).updateIsIconGray(true);
                                        num++;
                                        if (num == count) {
                                            let rewardList = Diamond777Data.curRollServerData.rewardList;
                                            rewardList.forEach(pos => {
                                                let itemReward = this.rollItemList[pos.col][pos.row].children[0];
                                                if (itemReward) {
                                                    tween(itemReward)
                                                        .delay(0.6)
                                                        .call(() => {
                                                            itemReward.getComponent(Diamond777Item).updateIsIconGray(false);
                                                        })
                                                        .delay(0.6)
                                                        .call(() => {
                                                            itemReward.getComponent(Diamond777Item).updateIsIconGray(true);
                                                        })
                                                        .delay(0.6)
                                                        .call(() => {
                                                            itemReward.getComponent(Diamond777Item).updateIsIconGray(false);
                                                        })
                                                        .start();
                                                }
                                            });
                                        }
                                    })
                                    .start();
                            }
                        }
                    }
                    timeout = 2000;
                }
                if (Diamond777Data.curRollServerData.winScore > 0) {
                    (SlotGameData.scriptGame as Diamond777Game).playKuangAni(3);
                    let cbResult = () => {
                        let curBet = SlotGameData.getCurBetScore();
                        if (Diamond777Data.curRollServerData.winScore >= curBet*Diamond777Data.NICE_WIN_MIN_REWARD) {
                            let isBigWin = Diamond777Data.curRollServerData.winScore >= curBet*Diamond777Data.BIG_WIN_MIN_REWARD;
                            if (isBigWin) {
                                (SlotGameData.scriptGame as Diamond777Game).playZuanAni(1);
                                let cbShowBigWin = () => {
                                    SlotGameData.showDynamicLoadView(Diamond777Data.BIG_WIN_VIEW, null, () => {
                                        SlotGameData.hideDynamicLoadView(Diamond777Data.BIG_WIN_VIEW);
                                        (SlotGameData.scriptGame as Diamond777Game).playZuanAni(0);
                                        timeout = 0;
                                        cbNextRound();
                                    }, SlotGameData.curRollingIndex, Diamond777Data.curRollServerData.winScore, null, this.ndBigWinParticle);
                                };
                                if (SlotGameData.isRespinMode) {
                                    this.setTimeout(() => {
                                        cbShowBigWin();
                                    }, 1500);
                                } else {
                                    cbShowBigWin();
                                }
                            } else {
                                SlotGameData.showDynamicLoadView(Diamond777Data.NICE_WIN_VIEW, () => {
                                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                        let viewData = SlotGameData.getDynamicLoadViewData(Diamond777Data.NICE_WIN_VIEW);
                                        if (viewData && viewData.ndView) {
                                            viewData.ndView.getComponent(Diamond777NiceWin).onStop();
                                        }
                                    }
                                }, () => {
                                    SlotGameData.removeDynamicLoadView(Diamond777Data.NICE_WIN_VIEW);
                                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                        return;
                                    }
                                    if (SlotGameData.totalRespinTimes == 0) {
                                        SlotGameData.scriptBottom.readyNextRound();
                                    }
                                    SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, null, false);
                                    Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                                    cbNextRound();
                                }, SlotGameData.curRollingIndex, Diamond777Data.curRollServerData.winScore, null, this.ndNiceWinParticle);
                            }
                        } else {
                            if (Diamond777Data.curRollServerData.winScore >= 1) {
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1", () => {
                                    this.scrollEffectId = 0;
                                    cbNextRound();
                                }, (effectId: number) => {
                                    this.scrollEffectId = effectId;
                                    SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, () => {
                                        if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                            return;
                                        }
                                        Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                                        if (SlotGameData.totalRespinTimes == 0) {
                                            SlotGameData.scriptBottom.readyNextRound();
                                        }
                                    }, true, Utils.getAudioDuration(effectId));
                                });
                            } else {
                                if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                    return;
                                }
                                SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, null, false);
                                if (SlotGameData.totalRespinTimes == 0) {
                                    SlotGameData.scriptBottom.readyNextRound();
                                }
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                                cbNextRound();
                            }
                        }
                    };
                    if (SlotGameData.isRespinMode) {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, '10108_base_bigwin_bell');
                        (SlotGameData.scriptGame as Diamond777Game).playRespinWinAni();
                        SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, () => {
                            cbResult();
                        }, true, 0.5);
                    } else {
                        cbResult();
                    }
                } else {
                    if (SlotGameData.totalRespinTimes == 0) {
                        (SlotGameData.scriptGame as Diamond777Game).playKuangAni(0);
                        SlotGameData.scriptBottom.readyNextRound();
                    }
                    cbNextRound();
                }
            }
            if (callback) {
                callback();
            }
        }
    }

    updateItem (node: Node, type: number, callback: Function = null) {
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        let scriptRoll = node.parent.getComponent(RollingLottery);
        scriptRoll.initItem(node, type, () => {
            funLoadFinished();
        });
        node.getComponent(UIOpacity).opacity = 255;
    }

    startRoll () {
        this.isWaitRoll = false;
        this.itemDataList = {};
        this.rollListLoadedNum = 0;
        let mapInfo = Diamond777Data.curRollServerData.mapInfo;
        for (const index in mapInfo) {
            if (Object.prototype.hasOwnProperty.call(mapInfo, index)) {
                const element = mapInfo[index];
                if (element) {
                    this.itemDataList[index] = {
                        type: element.type,
                        isLoaded: false
                    }
                }
            }
        }
        for (let i = 0; i < this.ndRollList.length; i++) {
            if (i == 1 && SlotGameData.isRespinMode) {
                continue;
            }
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let animationTime = 1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.5+0.05*i;
                        break;
                    case 1:
                        animationTime = 0.2+0.03*i;
                        break;
                    default:
                        break;
                }
                let rollNum = 5;
                let tweenIndex = 0;
                let playSlotMove = () => {
                    this.targetIndexNListOld[i] = this.targetIndexNList[i];
                    let scriptRoll = ndRollItem.getComponent(RollingLottery);
                    scriptRoll.stop();
                    let targetLastIndexN = this.targetIndexNList[i];
                    let loopNum = Math.ceil((targetLastIndexN-scriptRoll.currIndexN)/scriptRoll.getItemNum());
                    this.targetIndexNList[i] = targetLastIndexN-scriptRoll.getItemNum()*loopNum-scriptRoll.getItemNum()*rollNum;
                    ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime, tweenIndex);
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [tweenIndex]
                    });
                };
                if (i == 1 && SlotGameData.totalRespinTimes > 0 && !SlotGameData.isRespinMode) {
                    rollNum = 1;
                    tweenIndex = 1;
                    Utils.playEffect(SlotGameData.BUNDLE_NAME, "10108_base_2nd_spin", null, (effectId: number) => {
                        animationTime = Utils.getAudioDuration(effectId);
                        playSlotMove();
                    });
                } else {
                    playSlotMove();
                }
            }
        }
    }

    skipSlot () {
        console.log('skipSpin');
        this.closeAllTimeout();
        this.isSkipSpin = true;
        (SlotGameData.scriptGame as Diamond777Game).closeAllTimeout();
        if (Diamond777Data.curRollServerData.winScore > 0) {
            if (Diamond777Data.curRollServerData.winScore < SlotGameData.getCurBetScore()*Diamond777Data.NICE_WIN_MIN_REWARD) {
                if (this.scrollEffectId) {
                    Utils.stopEffect(this.scrollEffectId);
                    this.scrollEffectId = 0;
                }
                if (SlotGameData.scriptBottom.getIsWinNumScrolling()) {
                    SlotGameData.scriptBottom.stopWinNum();
                } else {
                    SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, null, false);
                }
                Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
            } else {
                let viewData = SlotGameData.getDynamicLoadViewData(Diamond777Data.NICE_WIN_VIEW);
                if (viewData && viewData.ndView) {
                    viewData.ndView.getComponent(Diamond777NiceWin).onStop();
                }
                SlotGameData.scriptBottom.updateWinNum(Diamond777Data.curRollServerData.winScore, null, false);
            }
        }
        if (SlotGameData.totalAutoTimes != 0 || SlotGameData.totalRespinTimes > 0) {
            SlotGameData.scriptBottom.canDoNextRound();
        } else {
            SlotGameData.scriptBottom.readyNextRound();
        }
    }

    playSlotAni (index: number) {
        let spine = this.ndSlotBtnAni.getComponent(MySpine);
        spine.playAni(index, false);
    }

    resetView () {
        this.resetRollList();
        (SlotGameData.scriptGame as Diamond777Game).onStopSpin();
    }

    resetRollList () {
        for (let col = 0; col < Diamond777Data.COL_NUM; col++) {
            for (let row = 0; row < Diamond777Data.ROW_NUM; row++) {
                let item = this.rollItemList[col][row].children[0];
                if (item) {
                    Tween.stopAllByTarget(item);
                    item.getComponent(Diamond777Item).updateIsIconGray(false);
                }
            }
        }
    }

    updateSpecialBg (isShow: boolean) {
        for (let i = 0; i < this.ndSpecialBgList.length; i++) {
            let ndSpecialBg = this.ndSpecialBgList[i];
            if (ndSpecialBg) {
                if (isShow) {
                    if (!ndSpecialBg.active) {
                        ndSpecialBg.active = true;
                        ndSpecialBg.getComponent(UIOpacity).opacity = 0;
                        let ndSpecialBg_uiOpacity = ndSpecialBg.getComponent(UIOpacity);
                        if (!ndSpecialBg_uiOpacity) {
                            ndSpecialBg_uiOpacity = ndSpecialBg.addComponent(UIOpacity);
                        }
                        tween(ndSpecialBg_uiOpacity)
                            .to(0.3, {opacity: 255})
                            .start();
                    }
                } else {
                    if (ndSpecialBg.active) {
                        let ndSpecialBg_uiOpacity = ndSpecialBg.getComponent(UIOpacity);
                        if (!ndSpecialBg_uiOpacity) {
                            ndSpecialBg_uiOpacity = ndSpecialBg.addComponent(UIOpacity);
                        }
                        tween(ndSpecialBg_uiOpacity)
                            .to(0.3, {opacity: 0})
                            .call(() => {
                                ndSpecialBg.active = false;
                            })
                            .start();
                    }
                }
            }
        }
    }

}
