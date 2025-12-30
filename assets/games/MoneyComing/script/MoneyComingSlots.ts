import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import { BezierCurveAnimation } from "db://assets/scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import PlayBezierCurveParticle from "db://assets/scripts/game/tsFrameCommon/Base/PlayBezierCurveParticle";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "db://assets/scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapInfo, SlotStatus } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import MoneyComingData, { MoneyComingMode, MoneyComingSpecialStatus, MoneyComingSpinMsgData } from "db://assets/games/MoneyComing/script/MoneyComingData";
import MoneyComingGame from "db://assets/games/MoneyComing/script/MoneyComingGame";
import MoneyComingItemAni from "db://assets/games/MoneyComing/script/MoneyComingItemAni";
import MoneyComingWheel from "db://assets/games/MoneyComing/script/MoneyComingWheel";

import { Node, Prefab, UIOpacity, UITransform, Vec2, _decorator, instantiate, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyComingSlots')
export default class MoneyComingSlots extends BaseComponent {

    @property([Node])
    ndRollList: Node[] = [];

    @property([Node])
    ndLightAniList: Node[] = [];

    @property(Node)
    ndThirdLockMask: Node = null;

    @property(Node)
    ndThirdLockAni: Node = null;

    @property(Node)
    ndLastLockAni: Node = null;

    @property(Node)
    ndTopAni: Node = null;

    targetIndexNList: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isWaitRoll = false;
    isWaitRollReady = false;
    isStopRoll = false;
    rollingNum = 0;
    rollEndList: boolean[] = [];
    rollItemList: Node[][] = [];
    // 滚动符号列表数据
    itemDataList: {[index:string]:{type:number,isLoaded:boolean,ndItemAni?:Node}} = {};

    isThirdLock = true;

    isRespinSlot = false;
    
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        for (let i = 0; i < MoneyComingData.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/items/' + (i + 1), 1);
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/ani/item_' + (i + 1), 1);
        }
        PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_streakParticle', SlotGameData.BUNDLE_NAME, 'prefab/streakParticle');
        this.playThirdLockAni(0);
        this.ndThirdLockMask.active = true;
        this.ndLightAniList.forEach(element => {
            if (element) {
                element.active = false;
            }
        });
        SlotGameData.clickSpinAudio = 'click_spin';
    }

    onDestroy () {

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
        // 测试粒子
        // let ndStart = this.rollItemList[3][2];
        // let posStart = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndStart.getComponent(UITransform).convertToWorldSpaceAR(v3()));
        // let funPlaySpecialModeParticle = (aniTime: number, posEnd: Vec2, posControl: Vec2, callback: Function) => {
        //     PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_streakParticle', (node: Node) => {
        //         node.parent = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle;
        //         node.getComponent(PlayBezierCurveParticle).playParticle(aniTime, 1000, v2(posStart.x, posStart.y), posEnd, posControl, () => {
        //             this.setTimeout(() => {
        //                 PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_streakParticle', node);
        //                 if (callback) {
        //                     callback();
        //                 }
        //             }, 500);
        //         });
        //     });
        // };
        // for (let i = 0; i < MoneyComingData.COL_NUM-1; i++) {
        //     if (i == 2 && this.isThirdLock) {
        //         continue;
        //     }
        //     let ndEnd = this.rollItemList[i][2];
        //     let posEnd = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndEnd.getComponent(UITransform).convertToWorldSpaceAR(v3()));
        //     funPlaySpecialModeParticle(2, v2(posEnd.x, posEnd.y), v2(100, 500), () => {

        //     });
        // }
        // {
        //     let ndEnd = (SlotGameData.scriptWheel as MoneyComingWheel).ndRotatingLottery;
        //     let posEnd = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndEnd.getComponent(UITransform).convertToWorldSpaceAR(v3()));
        //     funPlaySpecialModeParticle(2, v2(posEnd.x, posEnd.y), v2(-700, -300), () => {

        //     });
        // }
        // SlotGameData.scriptBottom.onClickSpin();
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

    onWaitSpinMsg () {
        this.resetView();
        this.isWaitRoll = true;
        SlotGameData.curRollingIndex++;
        for (let i = 0; i < this.ndRollList.length; i++) {
            if (i == 2 && this.isThirdLock) {
                continue;
            }
            if (this.isRespinSlot && i == MoneyComingData.COL_NUM-1) {
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
                }, gapTime * i);
            }
        }
    }

    onStartSpin(data: MoneyComingSpinMsgData) {
        MoneyComingData.curRollServerData = data;
        SlotGameData.isSlotSpinBtnShowByWin = MoneyComingData.curRollServerData.winScore > 0 && MoneyComingData.curRollServerData.winScore <= SlotGameData.getCurBetScore()*MoneyComingData.BIG_WIN_MIN_REWARD;
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        this.startRoll();
    }

    onStopSpin () {
        if (this.isStopRoll) {
            return;
        }
        if (!MoneyComingData.curRollServerData) {
            return;
        }
        let rollCount = this.ndRollList.length;
        if (this.isThirdLock) {
            rollCount--;
        }
        if (this.rollingNum < rollCount) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        for (let i = 0; i < this.ndRollList.length; i++) {
            if (i == 2 && this.isThirdLock) {
                continue;
            }
            if (this.isRespinSlot && i == MoneyComingData.COL_NUM-1) {
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
        if (!MoneyComingData.curRollServerData || MoneyComingData.curRollServerData.winScore > 0) {
            return;
        }
        console.log('onSkipSpin');
        this.skipSlot();
    }

    initRollList() {
        let funLoadFinished = () => {
            if (this.rollListLoadedNum < MoneyComingData.COL_NUM * MoneyComingData.ROW_NUM) {
                this.rollListLoadedNum++;
                if (this.rollListLoadedNum == MoneyComingData.COL_NUM * MoneyComingData.ROW_NUM) {
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
                            let startIndex = 1;
                            let itemCount = MoneyComingData.ITEM_NORMAL_NUM;
                            if (i == MoneyComingData.COL_NUM - 1) {
                                startIndex = MoneyComingData.ITEM_NORMAL_NUM + 1;
                                itemCount == MoneyComingData.SPECIAL_ITEM_NUM;
                            }
                            type = Math.floor(Math.random() * itemCount) + startIndex;
                        }
                        this.updateItem(node_, type);
                    }
                }
                scriptRoll.eventScrollEnd = () => {
                    SlotGameData.scriptBottom.onSlotEnd();
                    this.rollEndList[i] = true;
                    this.updateRollEnd(i);
                }
                this.targetIndexNList.push(scriptRoll.firstIndexN);
                this.rollEndList.push(false);
                let itemList = [];
                for (let j = 0; j < MoneyComingData.ROW_NUM; j++) {
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
                                let worldPos = item.getComponent(UITransform).convertToWorldSpaceAR(v3());
                                ndItemAni.position = ndItemAni.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
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
            // 移除上一轮符号动画
            if (itemData.ndItemAni) {
                let scriptItemAni = itemData.ndItemAni.getComponent(MoneyComingItemAni);
                PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                this.itemDataList[index].ndItemAni = null;
            }
            if (col == MoneyComingData.COL_NUM-1 && row == 2 && itemData.type > 0) {
                let audioName = '';
                switch (itemData.type) {
                    case 6:
                        audioName = 'sym_x2';
                        break;
                    case 7:
                        audioName = 'sym_x5';
                        break;
                    case 8:
                        audioName = 'sym_x10';
                        break;
                    case 9:
                        audioName = 'sym_free';
                        break;
                    case 10:
                    case 11:
                        audioName = 'sym_wheel';
                        break;
                    default:
                        break;
                }
                if (audioName) {
                    Utils.playEffect(SlotGameData.BUNDLE_NAME, audioName);
                }
            }
            this.updateItem(node, itemData.type, funLoadFinished);
        } else {
            funLoadFinished();
        }
    }

    updateRollEnd(rollIndex: number, callback: Function = null) {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "reef_stop");
        this.rollingNum--;
        if (this.ndLightAniList[rollIndex] && this.ndLightAniList[rollIndex].active) {
            this.ndLightAniList[rollIndex].active = false;
        }
        if (this.rollingNum == 0) {
            let isNeedRespin = MoneyComingData.gameMode == MoneyComingMode.Normal && (MoneyComingData.curRollServerData.respinMapInfo || MoneyComingData.curRollServerData.wheelRewardIndex != null);
            if (this.isStopRoll && !isNeedRespin) {
                this.skipSlot();
            } else {
                if (MoneyComingData.curRollServerData.winScore > 0) {
                    let starCol;
                    for (let col = 0; col < MoneyComingData.COL_NUM; col++) {
                        if (col == MoneyComingData.COL_NUM-2 && (SlotGameData.scriptSlots as MoneyComingSlots).isThirdLock) {
                            continue;
                        }
                        let type = this.itemDataList[`${col}_2`].type;
                        let isAni = false;
                        if (type > 0) {
                            if (col < MoneyComingData.COL_NUM-1) {
                                if (starCol == null) {
                                    switch (type) {
                                        case 2:
                                        case 3:
                                        case 5:
                                            starCol = col;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                if (starCol != null) {
                                    isAni = col >= starCol;
                                }
                            } else {
                                isAni = type > 1;
                            }
                        }
                        if (isAni) {
                            (SlotGameData.scriptSlots as MoneyComingSlots).createItemAni(col, 2);
                        }
                    }
                }
                if (isNeedRespin) {
                    SlotGameData.scriptBottom.showBtnsByState(SlotStatus.unstoped);
                    let col = MoneyComingData.COL_NUM-1;
                    let rewardRow = 2;
                    let index = `${col}_${rewardRow}`;
                    let type = this.itemDataList[index].type;
                    let isSpecialType = type >= 9;
                    switch (type) {
                        case 9:
                            MoneyComingData.specialStatus = MoneyComingSpecialStatus.Respin;
                            break;
                        case 10:
                            MoneyComingData.specialStatus = MoneyComingSpecialStatus.Scatter;
                            break;
                        case 11:
                            MoneyComingData.specialStatus = MoneyComingSpecialStatus.SuperScatter;
                            break;
                        default:
                            break;
                    }
                    if (isSpecialType) {
                        this.setTimeout(() => {
                            (SlotGameData.scriptGame as MoneyComingGame).updateTipsStatus(MoneyComingMode.Special);
                            this.setTimeout(() => {
                                (SlotGameData.scriptGame as MoneyComingGame).updateSpecialLeftNum(0, null, false);
                                if (MoneyComingData.curRollServerData.leftWinScore) {
                                    (SlotGameData.scriptGame as MoneyComingGame).updateSpecialLeftNum(MoneyComingData.curRollServerData.leftWinScore);
                                }
                                (SlotGameData.scriptGame as MoneyComingGame).updateSpecialRightNum(0, null, false);
                            }, 200);
                            if (MoneyComingData.specialStatus == MoneyComingSpecialStatus.Respin) {
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, "fly_free");
                            } else {
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, "fly_wheel");
                            }
                            let ndStart = this.rollItemList[col][rewardRow];
                            let posStart = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndStart.getComponent(UITransform).convertToWorldSpaceAR(v3()));
                            let funPlaySpecialModeParticle = (aniTime: number, posEnd: Vec2, posControl: Vec2, callback: Function) => {
                                PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_streakParticle', (node: Node) => {
                                    node.parent = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle;
                                    node.getComponent(PlayBezierCurveParticle).playParticle(aniTime, 1000, v2(posStart.x, posStart.y), posEnd, posControl, () => {
                                        this.setTimeout(() => {
                                            PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_streakParticle', node);
                                            if (callback) {
                                                callback();
                                            }
                                        }, 500);
                                    });
                                });
                            };
                            if (MoneyComingData.specialStatus == MoneyComingSpecialStatus.Respin) {
                                let particleNum = 0;
                                let particleFinished = 0;
                                for (let i = 0; i < MoneyComingData.COL_NUM-1; i++) {
                                    if (i == 2 && this.isThirdLock) {
                                        continue;
                                    }
                                    particleNum++;
                                    let ndEnd = this.rollItemList[i][rewardRow];
                                    let posEnd = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndEnd.getComponent(UITransform).convertToWorldSpaceAR(v3()));
                                    funPlaySpecialModeParticle(2, v2(posEnd.x, posEnd.y), v2(100, 500), () => {
                                        particleFinished++;
                                        if (particleFinished == particleNum) {
                                            for (let i = 0; i < MoneyComingData.COL_NUM-1; i++) {
                                                const element = this.ndLightAniList[i];
                                                if (element) {
                                                    element.active = true;
                                                    element.getComponent(MySpine).playAni(0, true);
                                                }
                                            }
                                            this.isRespinSlot = true;
                                            this.startSlotRoll();
                                        }
                                    });
                                }
                            } else {
                                let ndEnd = (SlotGameData.scriptWheel as MoneyComingWheel).ndRotatingLottery;
                                let posEnd = (SlotGameData.scriptGame as MoneyComingGame).ndSpecialModeParticle.getComponent(UITransform).convertToNodeSpaceAR(ndEnd.getComponent(UITransform).convertToWorldSpaceAR(v3()));
                                funPlaySpecialModeParticle(2, v2(posEnd.x, posEnd.y), v2(-700, -300), () => {
                                    (SlotGameData.scriptWheel as MoneyComingWheel).onStartWheel();
                                });
                            }
                        }, 1000);
                    } else {
                        console.error('special mode error');
                    }
                } else {
                    if (MoneyComingData.curRollServerData.winScore > 0) {
                        if (SlotGameData.isSlotSpinBtnShowByWin) {
                            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.skipSpin);
                        } else {
                            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                        }
                    } else {
                        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
                    }
                    (SlotGameData.scriptGame as MoneyComingGame).onSlotEnd();
                }
            }
            if (callback) {
                callback();
            }
        }
    }

    updateItem(node: Node, type: number, callback: Function = null) {
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

    createItemAni(col: number, row: number, callback: Function = null) {
        let cbFinished = () => {
            this.rollItemList[col][row].getComponent(UIOpacity).opacity = 0;
            if (callback) {
                callback();
            }
        };
        let index = `${col}_${row}`;
        let type = this.itemDataList[index].type;
        if (this.itemDataList[index].ndItemAni) {
            let scriptItemAni = this.itemDataList[index].ndItemAni.getComponent(MoneyComingItemAni);
            if (scriptItemAni.type != type) {
                PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, this.itemDataList[index].ndItemAni);
                this.itemDataList[index].ndItemAni = null;
            }
        }
        if (!this.itemDataList[index].ndItemAni) {
            PoolMng.getNodePool(SlotGameData.BUNDLE_NAME+'_item_ani_'+type, (prefab: Prefab) => {
                let ndParant = this.ndTopAni.getChildByName(type.toString());
                if (!ndParant) {
                    ndParant = new Node();
                    ndParant.name = type.toString();
                    ndParant.parent = this.ndTopAni;
                }
                let ndItemAni = instantiate(prefab);
                ndItemAni.parent = ndParant;
                let worldPos = this.rollItemList[col][row].getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                ndItemAni.getComponent(MoneyComingItemAni).playAni(0, true);
                this.itemDataList[index].ndItemAni = ndItemAni;
                cbFinished();
            });
        } else {
            cbFinished();
        }
    }

    startRoll() {
        this.isWaitRoll = false;
        this.isRespinSlot = false;
        this.startSlotRoll();
        (SlotGameData.scriptGame as MoneyComingGame).onSlotStart();
        if (MoneyComingData.gameMode == MoneyComingMode.Special) {
            (SlotGameData.scriptGame as MoneyComingGame).updateTipsStatus(MoneyComingMode.Normal);
        }
    }

    startSlotRoll () {
        this.isStopRoll = false;
        this.rollListLoadedNum = 0;
        let mapInfo = MoneyComingData.curRollServerData.mapInfo;
        if (this.isRespinSlot) {
            mapInfo = MoneyComingData.curRollServerData.respinMapInfo;
        }
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
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
        let funPlaySlot = (time: number = null) => {
            for (let i = 0; i < this.ndRollList.length; i++) {
                if (i == 2 && this.isThirdLock) {
                    continue;
                }
                if (this.isRespinSlot && i == MoneyComingData.COL_NUM-1) {
                    continue;
                }
                let ndRollItem = this.ndRollList[i].children[0];
                if (ndRollItem) {
                    let animationTime = 0;
                    if (time) {
                        animationTime = time-this.rollingNum*0.2;
                    } else {
                        switch (SlotGameData.curSpeedIndex) {
                            case 0:
                                animationTime = 1;
                                break;
                            case 1:
                                animationTime = 0.6;
                                break;
                            default:
                                break;
                        }
                    }
                    this.rollingNum++;
                    this.rollEndList[i] = false;
                    let scriptRoll = ndRollItem.getComponent(RollingLottery);
                    if (!this.isRespinSlot) {
                        scriptRoll.stop();
                        let targetLastIndexN = this.targetIndexNList[i];
                        let loopNum = Math.ceil((targetLastIndexN-scriptRoll.currIndexN)/scriptRoll.getItemNum());
                        this.targetIndexNList[i] = targetLastIndexN-scriptRoll.getItemNum()*loopNum-scriptRoll.getItemNum()*5;
                    } else {
                        this.targetIndexNList[i] -= scriptRoll.getItemNum()*5;
                    }
                    ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime);
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [0],
                    });
                }
            }
        };
        if (this.isRespinSlot) {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, "free_run", null, (effectId: number) => {
                funPlaySlot(Utils.getAudioDuration(effectId));
            });
        } else {
            funPlaySlot();
        }
    }

    skipSlot () {
        Utils.stopAllEffect();
        this.closeAllTimeout();
        (SlotGameData.scriptGame as MoneyComingGame).closeAllTimeout();
        this.resetView();
        this.setTimeout(() => {
            if (SlotGameData.totalAutoTimes != 0) {
                SlotGameData.scriptBottom.canDoNextRound();
            } else {
                SlotGameData.scriptBottom.readyNextRound();
            }
        }, 10);
    }

    playThirdLockAni (index: number, callback: Function = null) {
        this.ndThirdLockAni.getComponent(MySpine).playAni(index, false, callback);
    }

    startThirdLockAni () {
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "reef_lock");
        this.isThirdLock = true;
        this.ndThirdLockMask.active = true;
        this.playThirdLockAni(2, () => {
            this.playThirdLockAni(0);
        });
    }

    startThirdUnLockAni () {
        this.isThirdLock = false;
        this.playThirdLockAni(1, () => {
            this.ndThirdLockMask.active = false;
        });
    }

    getIsLock () {
        return this.isThirdLock;
    }

    resetView() {
        if (MoneyComingData.gameMode == MoneyComingMode.Special && MoneyComingData.specialStatus != MoneyComingSpecialStatus.Respin) {
            
        } else {
            (SlotGameData.scriptGame as MoneyComingGame).onStopSpin();
            this.ndLightAniList.forEach(element => {
                if (element && element.active) {
                    element.active = false;
                }
            });
        }
    }
}
