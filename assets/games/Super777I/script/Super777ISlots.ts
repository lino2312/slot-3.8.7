import Super777IData, { Super777IMode } from "db://assets/games/Super777I/script/Super777IData";
import Super777IGame from "db://assets/games/Super777I/script/Super777IGame";
import Super777IItem from "db://assets/games/Super777I/script/Super777IItem";
import Super777IItemAni from "db://assets/games/Super777I/script/Super777IItemAni";
import Super777INiceWin from "db://assets/games/Super777I/script/Super777INiceWin";
import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import { BezierCurveAnimation } from "db://assets/scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "db://assets/scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapIndex, SlotMapInfo, SlotSpinMsgData, SlotStatus } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";

import { Node, Prefab, Tween, UIOpacity, UITransform, _decorator, instantiate, v3 } from 'cc';
import { App } from "db://assets/scripts/App";
const { ccclass, property } = _decorator;

@ccclass('Super777ISlots')
export default class Super777ISlots extends BaseComponent {

    @property(Node)
    ndSlotBtnAni: Node = null;

    @property([Node])
    ndRollList: Node[] = [];

    @property(Node)
    ndThirdScatterAni: Node = null;

    @property(Node)
    ndFreeBg: Node = null;

    @property(Node)
    ndFreeGuang: Node = null;

    @property(Node)
    ndTopAni: Node = null;

    targetIndexNFirstList: number[] = [];
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
    itemDataList: { [index: string]: { type: number, isLoaded: boolean, ndItemAni?: Node } } = {};

    scrollEffectId = 0;

    isThirdScatterAni = false;

    is3xWildIconShow = false;
    isScatterIconShow = false;

    isNeedShowFreeGuang = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.ndThirdScatterAni.active = false;
        this.ndFreeGuang.active = false;
        for (let i = 0; i < Super777IData.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/items/' + (i + 1));
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/ani/item_' + (i + 1), 1);
        }
        (SlotGameData.scriptGame as Super777IGame).hideKuangAni();
        SlotGameData.clickSpinAudio = '10109_base_bar';
    }

    onDestroy() {

    }

    start() {

    }

    // update (dt) {}

    onClickEvent(event, data: string) {
        switch (data) {
            case 'slot':
                this.onClickSlotBtn();
                break;
            default:
                break;
        }
    }

    onClickSlotBtn() {
        if ((SlotGameData.scriptGame as Super777IGame).isChangeGameModeAni) {
            return;
        }
        SlotGameData.scriptBottom.onClickSpin();
    }

    onInitMapInfo(mapInfo: SlotMapInfo) {
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

    onMidEnter() {
        (SlotGameData.scriptGame as Super777IGame).enterFreeMode(() => {
            (SlotGameData.scriptGame as Super777IGame).playZuanAni(0);
            this.ndFreeBg.active = true;
            SlotGameData.scriptBottom.canDoNextRound();
        });
    }

    onWaitSpinMsg() {
        Utils.stopAllEffect();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, ['10109_base_spin1', '10109_base_spin2', '10109_base_spin3']);
        this.resetView();
        //移除上一轮符号动画 
        for (const key in this.itemDataList) {
            const itemData = this.itemDataList[key];
            if (itemData.ndItemAni) {
                let scriptItemAni = itemData.ndItemAni.getComponent(Super777IItemAni);
                if (itemData.type != scriptItemAni.type) {
                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                    itemData.ndItemAni = null;
                }
            }
        }
        this.isSkipSpin = false;
        this.isStopRoll = false;
        this.isWaitRoll = true;
        this.isThirdScatterAni = false;
        this.is3xWildIconShow = false;
        this.isScatterIconShow = false;
        this.isNeedShowFreeGuang = false;
        SlotGameData.curRollingIndex++;
        (SlotGameData.scriptGame as Super777IGame).onSlotStart();
        this.playSlotAni(0);
        for (let i = 0; i < this.ndRollList.length; i++) {
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
                    scriptRoll.loop(3000);
                }, gapTime * i);
            }
        }
    }

    onStartSpin(data: SlotSpinMsgData) {
        Super777IData.curRollServerData = data;
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        if (SlotGameData.isFreeInFreeMode) {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_fg_retrigger");
            Utils.playEffect(SlotGameData.BUNDLE_NAME, "extra_free_games");
            (SlotGameData.scriptGame as Super777IGame).updateTotalFreeTimes(SlotGameData.totalFreeTimes);
        }
        if (SlotGameData.isFreeMode) {
            (SlotGameData.scriptGame as Super777IGame).updateFreeTimes(SlotGameData.freeTimes);
        }
        if (!SlotGameData.isFreeMode) {
            if (SlotGameData.totalFreeTimes > 0) {
                if (SlotGameData.freeTimes != SlotGameData.totalFreeTimes) {
                    this.isNeedShowFreeGuang = true;
                }
            }
        } else if (SlotGameData.isFreeInFreeMode) {
            this.isNeedShowFreeGuang = true;
        }
        this.startRoll();
        SlotGameData.isSlotSpinBtnShowByWin = !this.isThirdScatterAni && Super777IData.curRollServerData.winScore > 0 && Super777IData.curRollServerData.winScore < SlotGameData.getCurBetScore() * Super777IData.BIG_WIN_MIN_REWARD;
    }

    onStopSpin() {
        if (this.isStopRoll) {
            return;
        }
        if (this.rollingNum < this.ndRollList.length) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.stop();
                scriptRoll.jump(this.targetIndexNList[i]);
                this.targetIndexNList[i] -= scriptRoll.getItemNum();
                let animationTime = 0.1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.1 * i;
                        break;
                    case 1:
                        animationTime = 0.05 * i;
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

    onSkipSpin() {
        console.log('onSkipSpin');
        this.skipSlot();
    }

    initRollList() {
        let funLoadFinished = () => {
            if (this.rollListLoadedNum < Super777IData.COL_NUM * Super777IData.ROW_NUM) {
                this.rollListLoadedNum++;
                if (this.rollListLoadedNum == Super777IData.COL_NUM * Super777IData.ROW_NUM) {
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
                    // 移除上一轮符号动画
                    let targetIndexN = this.targetIndexNList[i];
                    if (!this.isWaitRoll && indexN_ >= targetIndexN - 2 && indexN_ <= targetIndexN + 2) {
                        let rowIndex = indexN_ - (targetIndexN - 2);
                        this.updateRollItem(i, rowIndex, node_, () => {
                            funLoadFinished();
                        });
                    } else {
                        let type = 0;
                        let isBlank = Math.random() > 0.5;
                        if (!isBlank) {
                            type = Math.floor(Math.random() * Super777IData.ITEM_NORMAL_NUM) + 1;
                        }
                        this.updateItem(node_, type, null);
                    }
                }
                scriptRoll.eventScrollEnd = () => {
                    SlotGameData.scriptBottom.onSlotEnd();
                    this.rollEndList[i] = true;
                    this.updateRollEnd(i);
                }
                this.targetIndexNFirstList.push(scriptRoll.firstIndexN);
                this.targetIndexNList.push(scriptRoll.firstIndexN);
                this.targetIndexNListOld.push(scriptRoll.firstIndexN);
                this.rollEndList.push(false);
                let itemList = [];
                for (let j = 0; j < Super777IData.ROW_NUM; j++) {
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
                    let index = `${i}_${row}`;
                    if (this.itemDataList[index] && this.rollItemList[i]) {
                        let item = this.rollItemList[i][row];
                        if (item) {
                            let ndItemAni = this.itemDataList[index].ndItemAni;
                            if (ndItemAni) {
                                ndItemAni.getComponent(UIOpacity).opacity = item.children[0] != null ? 255 : 0;
                                if (item.children[0]) {
                                    let worldPos = item.children[0].getComponent(UITransform).convertToWorldSpaceAR(v3());
                                    let newPos = ndItemAni.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                                    ndItemAni.position = newPos;
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    updateRollItem(col: number, row: number, node: Node, callback: Function) {
        let index = `${col}_${row}`;
        let itemData = this.itemDataList[index];
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        if (!itemData.isLoaded) {
            itemData.isLoaded = true;
            if (itemData && itemData.ndItemAni) {
                let scriptItemAni = itemData.ndItemAni.getComponent(Super777IItemAni);
                PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                this.itemDataList[index].ndItemAni = null;
            }
            let rowTmp = null;
            if (row > 0 && row < Super777IData.ROW_NUM - 1) {
                rowTmp = row;
            }
            this.updateItem(node, itemData.type, rowTmp, () => {
                if (this.isRollListLoaded) {
                    if (col == 0 && itemData.type >= 8) {
                        this.createItemAni(col, row, (ndAni: Node) => {
                            ndAni.getComponent(Super777IItemAni).playAni(1, false, () => {
                                if (!this.isNeedShowFreeGuang) {
                                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + itemData.type, this.itemDataList[index].ndItemAni);
                                    this.itemDataList[index].ndItemAni = null;
                                    node.getComponent(UIOpacity).opacity = 255;
                                }
                            });
                        });
                    }
                }
                funLoadFinished();
            }, this.itemDataList[`${col}_${2}`].type == 0);
            if (this.isRollListLoaded) {
                switch (itemData.type) {
                    case 7:
                        if (SlotGameData.isFreeMode) {
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_fg_x2_apply");
                        }
                        break;
                    case 8:
                        if (col == 0 && !this.is3xWildIconShow) {
                            this.is3xWildIconShow = true;
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_symbol_3xwild_drop");
                        }
                        break;
                    case 9:
                        if (col == 0 && !this.isScatterIconShow) {
                            this.isScatterIconShow = true;
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_symbol_scatter_drop");
                        }
                        break;
                    default:
                        break;
                }
            }
        } else {
            funLoadFinished();
        }
    }

    updateRollEnd(rollIndex: number, callback: Function = null) {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_reel_stop1");
        this.rollingNum--;
        if (this.rollingNum == 0) {
            if (this.ndThirdScatterAni.active) {
                this.ndThirdScatterAni.active = false;
            }
            if (this.isNeedShowFreeGuang && Super777IData.curRollServerData.winScore == 0) {
                this.onEnterFreeAni(() => {
                    this.readyNextRound();
                });
            }
            if (this.isStopRoll && Super777IData.curRollServerData.winScore == 0) {
                SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                this.skipSlot();
            } else {
                (SlotGameData.scriptGame as Super777IGame).onSlotEnd();
                if (Super777IData.curRollServerData.winScore > 0) {
                    if (SlotGameData.isSlotSpinBtnShowByWin) {
                        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.skipSpin);
                    } else {
                        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                    }
                } else {
                    SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
                }
                let curRollingIndexTmp = SlotGameData.curRollingIndex;
                let timeout = 0;
                let cbDoNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                        return;
                    }
                    this.onCanDoNextRound();
                };
                let cbNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                        return;
                    }
                    this.setTimeout(() => {
                        cbDoNextRound();
                    }, timeout)
                };
                if (Super777IData.curRollServerData.winScore > 0) {
                    let winScore = SlotGameData.isFreeMode ? SlotGameData.totalWinScore : Super777IData.curRollServerData.winScore;
                    timeout = 2000;
                    (SlotGameData.scriptGame as Super777IGame).playKuangAni(3);
                    (SlotGameData.scriptGame as Super777IGame).playFreeeDoubleEnd();
                    let curBet = SlotGameData.getCurBetScore();
                    if (Super777IData.curRollServerData.winScore >= curBet * Super777IData.NICE_WIN_MIN_REWARD) {
                        let isBigWin = Super777IData.curRollServerData.winScore >= curBet * Super777IData.BIG_WIN_MIN_REWARD;
                        if (isBigWin) {
                            if (SlotGameData.isFreeMode) {
                                SlotGameData.scriptBottom.updateWinNum(winScore, null, false);
                            }
                            (SlotGameData.scriptGame as Super777IGame).showBigWinView(() => {
                                timeout = 0;
                                cbNextRound();
                            });
                        } else {
                            (SlotGameData.scriptGame as Super777IGame).showNiceWinView(() => {
                                SlotGameData.removeDynamicLoadView(Super777IData.NICE_WIN_VIEW);
                                if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                    return;
                                }
                                this.readyNextRound();
                                SlotGameData.scriptBottom.updateWinNum(winScore, null, false);
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                                cbNextRound();
                            }, () => {
                                if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                    let viewData = SlotGameData.getDynamicLoadViewData(Super777IData.NICE_WIN_VIEW);
                                    if (viewData && viewData.ndView) {
                                        viewData.ndView.getComponent(Super777INiceWin).onStop();
                                    }
                                }
                            });
                        }
                    } else {
                        if (Super777IData.curRollServerData.winScore >= 1) {
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1", () => {
                                this.scrollEffectId = 0;
                                cbNextRound();
                            }, (effectId: number) => {
                                this.scrollEffectId = effectId;
                                SlotGameData.scriptBottom.updateWinNum(winScore, () => {
                                    if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                        return;
                                    }
                                    Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                                    this.readyNextRound();
                                }, true, Utils.getAudioDuration(effectId));
                            });
                        } else {
                            if (curRollingIndexTmp != SlotGameData.curRollingIndex || this.isSkipSpin) {
                                return;
                            }
                            SlotGameData.scriptBottom.updateWinNum(winScore, null, false);
                            this.readyNextRound();
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
                            cbNextRound();
                        }
                    }
                } else {
                    if (!this.isNeedShowFreeGuang) {
                        (SlotGameData.scriptGame as Super777IGame).playKuangAni(0);
                        this.readyNextRound();
                        cbNextRound();
                    }
                }
            }
            if (callback) {
                callback();
            }
        }
    }

    playSfx(name: string, callback?: Function) {
        App.AudioManager.playSfx("audio/", name, callback);
    }

    updateItem(node: Node, type: number, row: number, callback: Function = null, isMoveIconPos = false) {
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        if (row != null && row != 2 && type == 0) {
            type = Math.floor(Math.random() * Super777IData.ITEM_NORMAL_NUM) + 1;
        }
        node.getComponent(UIOpacity).opacity = 255;
        let scriptRoll = node.parent.getComponent(RollingLottery);
        scriptRoll.initItem(node, type, () => {
            if (node.children[0]) {
                if (isMoveIconPos && (row == 1 || row == 3)) {
                    node.children[0].getComponent(Super777IItem).moveIconPos(row);
                } else {
                    node.children[0].getComponent(Super777IItem).resetIconPos();
                }
            }
            funLoadFinished();
        });
    }

    createItemAni(col: number, row: number, callback: Function = null) {
        let index = `${col}_${row}`;
        let ndItem = this.rollItemList[col][row];
        let cbFinished = () => {
            ndItem.getComponent(UIOpacity).opacity = 0;
            let worldPos = ndItem.children[0].getComponent(UITransform).convertToWorldSpaceAR(v3());
            let newPos = this.itemDataList[index].ndItemAni.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            this.itemDataList[index].ndItemAni.position = newPos;
            if (callback) {
                callback(this.itemDataList[index].ndItemAni);
            }
        };
        let type = this.itemDataList[index].type;
        if (this.itemDataList[index].ndItemAni) {
            let scriptItemAni = this.itemDataList[index].ndItemAni.getComponent(Super777IItemAni);
            if (scriptItemAni.type != type) {
                PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, this.itemDataList[index].ndItemAni);
                this.itemDataList[index].ndItemAni = null;
            }
        }
        if (!this.itemDataList[index].ndItemAni) {
            PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (prefab: Prefab) => {
                let ndParant = this.ndTopAni.getChildByName(type.toString());
                if (!ndParant) {
                    ndParant = new Node();
                    ndParant.addComponent(UITransform);
                    ndParant.getComponent(UITransform)!.setContentSize(0, 0);
                    ndParant.name = type.toString();
                    ndParant.parent = this.ndTopAni;
                }
                let ndItemAni = instantiate(prefab);
                ndItemAni.parent = ndParant;
                let worldPos = ndItem.getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                this.itemDataList[index].ndItemAni = ndItemAni;
                cbFinished();
            });
        } else {
            cbFinished();
        }
    }

    startRoll() {
        this.isWaitRoll = false;
        this.rollListLoadedNum = 0;
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
        let mapInfo = Super777IData.curRollServerData.mapInfo;
        for (const index in mapInfo) {
            if (Object.prototype.hasOwnProperty.call(mapInfo, index)) {
                const element = mapInfo[index];
                if (element) {
                    this.itemDataList[index] = {
                        type: element.type,
                        isLoaded: false
                    }
                    if (itemDataListTemp[index]) {
                        this.itemDataList[index].ndItemAni = itemDataListTemp[index].ndItemAni;
                    }
                }
            }
        }
        let scatterNum = 0;
        for (let col = 0; col < Super777IData.COL_NUM - 1; col++) {
            for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                let itemData = this.itemDataList[`${col}_${row}`];
                if (itemData.type == Super777IData.SCATTER_ITEM) {
                    scatterNum++;
                }
            }
        }
        if (scatterNum >= 2) {
            this.isThirdScatterAni = true;
        }
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let animationTime = 1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.5 + 0.1 * i;
                        break;
                    case 1:
                        animationTime = 0.2 + 0.05 * i;
                        break;
                    default:
                        break;
                }

                let isScatterAni = false;
                if (i == Super777IData.COL_NUM - 1 && this.isThirdScatterAni) {
                    isScatterAni = true;
                }
                let cbRoll = () => {
                    this.targetIndexNListOld[i] = this.targetIndexNList[i];
                    let rollNum = 5;
                    let tweenIndex = 0;
                    let scriptRoll = ndRollItem.getComponent(RollingLottery);
                    scriptRoll.stop();
                    let targetLastIndexN = this.targetIndexNList[i];
                    let loopNum = Math.ceil((targetLastIndexN - scriptRoll.currIndexN) / scriptRoll.getItemNum());
                    this.targetIndexNList[i] = targetLastIndexN - scriptRoll.getItemNum() * loopNum - scriptRoll.getItemNum() * rollNum;
                    ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime, tweenIndex);
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [tweenIndex]
                    });
                };
                this.setTimeout(() => {
                    if (isScatterAni) {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10109_scatter_notify", null, (effectId: number) => {
                            this.ndThirdScatterAni.active = true;
                            this.ndThirdScatterAni.getComponent(MySpine).playAni(SlotGameData.isFreeMode ? 1 : 0, true);
                            animationTime = Utils.getAudioDuration(effectId);
                            cbRoll();
                        });
                    } else {
                        cbRoll();
                    }
                }, 50 * i);
            }
        }
        (SlotGameData.scriptGame as Super777IGame).playKuangAni(0);
    }

    skipSlot() {
        console.log('skipSpin');
        this.closeAllTimeout();
        this.isSkipSpin = true;
        (SlotGameData.scriptGame as Super777IGame).closeAllTimeout();
        if (Super777IData.curRollServerData.winScore > 0) {
            let winScore = SlotGameData.isFreeMode ? SlotGameData.totalWinScore : Super777IData.curRollServerData.winScore;
            if (Super777IData.curRollServerData.winScore < SlotGameData.getCurBetScore() * Super777IData.NICE_WIN_MIN_REWARD) {
                if (this.scrollEffectId) {
                    Utils.stopEffect(this.scrollEffectId);
                    this.scrollEffectId = 0;
                }
                if (SlotGameData.scriptBottom.getIsWinNumScrolling()) {
                    SlotGameData.scriptBottom.stopWinNum();
                } else {
                    SlotGameData.scriptBottom.updateWinNum(winScore, null, false);
                }
                Utils.playEffect(SlotGameData.BUNDLE_NAME, "normalwin1_end");
            } else {
                let viewData = SlotGameData.getDynamicLoadViewData(Super777IData.NICE_WIN_VIEW);
                if (viewData && viewData.ndView) {
                    viewData.ndView.getComponent(Super777INiceWin).onStop();
                }
                SlotGameData.scriptBottom.updateWinNum(winScore, null, false);
            }
        }
        this.onReadyNextRound();
    }

    playSlotAni(index: number) {
        let spine = this.ndSlotBtnAni.getComponent(MySpine);
        spine.playAni(index, false);
    }

    playAllRewardIconsAni() {
        let rewardIndexList: SlotMapIndex = {};
        Super777IData.curRollServerData.rewardList.forEach(pos => {
            let index = `${pos.col}_${pos.row}`;
            if (!rewardIndexList[index]) {
                let itemData = this.itemDataList[index];
                if (itemData.type > 0) {
                    rewardIndexList[index] = {};
                }
            }
        });
        this.playIconsAni(rewardIndexList, 0);
    }

    playIconsAni(iconList: SlotMapIndex, aniIndex: number, times: number = null, callback: Function = null) {
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                let index = `${col}_${row}`;
                let node = this.rollItemList[col][row];
                let item = node.children[0];
                if (item) {
                    let isGrey = false;
                    if (!iconList[index]) {
                        isGrey = true;
                    }
                    item.getComponent(Super777IItem).updateIsIconGray(isGrey);
                }
                let itemData = this.itemDataList[index];
                if (!iconList[index] && itemData.ndItemAni) {
                    let scriptItemAni = itemData.ndItemAni.getComponent(Super777IItemAni);
                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                    this.itemDataList[index].ndItemAni = null;
                    node.getComponent(UIOpacity).opacity = 255;
                }
            }
        }
        let iconNum = 0;
        let iconFinished = 0;
        for (const index in iconList) {
            let itemData = this.itemDataList[index];
            if (itemData.type > 0) {
                iconNum++;
                let posList = index.split('_');
                this.createItemAni(parseInt(posList[0]), parseInt(posList[1]), (ndAni: Node) => {
                    if (times != null) {
                        this.playIconAniByTimes(ndAni, aniIndex, 0, times, () => {
                            iconFinished++;
                            if (iconFinished == iconNum) {
                                if (callback) {
                                    callback();
                                }
                            }
                        });
                    } else {
                        ndAni.getComponent(Super777IItemAni).playAni(aniIndex, true);
                    }
                });
            }
        }
    }

    playIconAniByTimes(ndAni: Node, aniIndex: number, timeIndex: number, times: number, callback: Function) {
        if (timeIndex < times) {
            ndAni.getComponent(Super777IItemAni).playAni(aniIndex, false, () => {
                this.playIconAniByTimes(ndAni, aniIndex, timeIndex + 1, times, callback);
            });
        } else {
            if (callback) {
                callback();
            }
        }
    }

    resetView() {
        this.ndFreeGuang.active = false;
        this.resetRollList();
        (SlotGameData.scriptGame as Super777IGame).onStopSpin();
    }

    resetRollList() {
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                let item = this.rollItemList[col][row].children[0];
                if (item) {
                    Tween.stopAllByTarget(item);
                    item.getComponent(Super777IItem).updateIsIconGray(false);
                }
            }
        }
    }

    readyNextRound() {
        if (SlotGameData.isFreeMode && SlotGameData.totalFreeTimes == SlotGameData.freeTimes) {
            (SlotGameData.scriptGame as Super777IGame).showFreeEndView(() => {
                this.ndFreeBg.active = false;
                (SlotGameData.scriptGame as Super777IGame).backNormalMode(() => {
                    Super777IData.gameMode = Super777IMode.Normal;
                    if (SlotGameData.totalAutoTimes != 0 || SlotGameData.totalFreeTimes > 0) {
                        SlotGameData.scriptBottom.canDoNextRound();
                    } else {
                        SlotGameData.scriptBottom.readyNextRound();
                    }
                });
            }, SlotGameData.totalWinScore);
        } else if (SlotGameData.totalFreeTimes > 0 && Super777IData.gameMode == Super777IMode.Normal) {
            Super777IData.gameMode = Super777IMode.Special;
            (SlotGameData.scriptGame as Super777IGame).showFreeStartView(() => {
                (SlotGameData.scriptGame as Super777IGame).enterFreeMode(() => {
                    (SlotGameData.scriptGame as Super777IGame).playZuanAni(0);
                    this.ndFreeBg.active = true;
                    if (SlotGameData.totalAutoTimes != 0 || SlotGameData.totalFreeTimes > 0) {
                        SlotGameData.scriptBottom.canDoNextRound();
                    } else {
                        SlotGameData.scriptBottom.readyNextRound();
                    }
                });
            });
        } else {
            if (SlotGameData.totalAutoTimes != 0 || SlotGameData.totalFreeTimes > 0) {
                SlotGameData.scriptBottom.canDoNextRound();
            } else {
                SlotGameData.scriptBottom.readyNextRound();
            }
        }
    }

    canDoNextRound() {
        if (SlotGameData.isFreeMode && SlotGameData.totalFreeTimes == SlotGameData.freeTimes) {
            (SlotGameData.scriptGame as Super777IGame).showFreeEndView(() => {
                this.ndFreeBg.active = false;
                (SlotGameData.scriptGame as Super777IGame).backNormalMode(() => {
                    Super777IData.gameMode = Super777IMode.Normal;
                    SlotGameData.scriptBottom.canDoNextRound();
                });
            }, SlotGameData.totalWinScore);
        } else if (SlotGameData.totalFreeTimes > 0 && Super777IData.gameMode == Super777IMode.Normal) {
            Super777IData.gameMode = Super777IMode.Special;
            (SlotGameData.scriptGame as Super777IGame).showFreeStartView(() => {
                (SlotGameData.scriptGame as Super777IGame).enterFreeMode(() => {
                    (SlotGameData.scriptGame as Super777IGame).playZuanAni(0);
                    this.ndFreeBg.active = true;
                    SlotGameData.scriptBottom.canDoNextRound();
                });
            });
        } else {
            SlotGameData.scriptBottom.canDoNextRound();
        }
    }

    onEnterFreeAni(callback: Function) {
        this.ndFreeGuang.active = true;
        (SlotGameData.scriptGame as Super777IGame).playZuanAni(1);
        for (const index in this.itemDataList) {
            if (Object.prototype.hasOwnProperty.call(this.itemDataList, index)) {
                const itemData = this.itemDataList[index];
                if (itemData.ndItemAni) {
                    let scriptItemAni = itemData.ndItemAni.getComponent(Super777IItemAni);
                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                    this.itemDataList[index].ndItemAni = null;
                    let indexList = index.split('_');
                    this.rollItemList[parseInt(indexList[0])][parseInt(indexList[1])].getComponent(UIOpacity).opacity = 255;
                }
            }
        }
        let rewardIconList = {};
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                let index = `${col}_${row}`;
                let itemData = this.itemDataList[index];
                if (itemData.type == Super777IData.SCATTER_ITEM) {
                    rewardIconList[index] = {};
                    this.createItemAni(col, row, (ndAni: Node) => {
                        ndAni.getComponent(Super777IItemAni).playAni(0, true);
                    });
                }
            }
        }
        for (let col = 0; col < Super777IData.COL_NUM; col++) {
            for (let row = 0; row < Super777IData.ROW_NUM; row++) {
                let item = this.rollItemList[col][row].children[0];
                if (item) {
                    let isGrey = false;
                    if (!rewardIconList[`${col}_${row}`]) {
                        isGrey = true;
                    }
                    item.getComponent(Super777IItem).updateIsIconGray(isGrey);
                }
            }
        }
        this.setTimeout(() => {
            if (callback) {
                callback();
            }
        }, 1000);
    }

    onReadyNextRound() {
        if (this.isNeedShowFreeGuang && !this.ndFreeGuang.active) {
            this.onEnterFreeAni(() => {
                this.readyNextRound();
            });
        } else {
            this.readyNextRound();
        }
    }

    onCanDoNextRound() {
        if (this.isNeedShowFreeGuang && !this.ndFreeGuang.active) {
            this.onEnterFreeAni(() => {
                this.readyNextRound();
            });
        } else {
            this.canDoNextRound();
        }
    }

}
