import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { BezierCurveAnimation } from "db://assets/scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "db://assets/scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapInfo, SlotStatus } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import GemsFrotuneIData, { GameMapInfo, ServerGemsFrotuneIMsgData } from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIData";
import GemsFrotuneIGame from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIGame";
import GemsFrotuneIItemAni from "db://assets/games/GemsFrotuneI/script/GemsFrotuneIItemAni";

import { Node, Prefab, UIOpacity, UITransform, _decorator, instantiate, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

const turnNumber = [6, 3];
const baseTime = [1.2, 0.6];

@ccclass('GemsFrotuneISlots')
export default class GemsFrotuneISlots extends BaseComponent {

    @property([Node])
    ndRollList: Node[] = [];

    @property(Node)
    ndTopAni: Node = null;

    @property(Node)
    ndExtraMultipleStart: Node = null;    

    @property(Node)
    ndMultipleKuangAni: Node = null;
    
    @property(Node)
    ndWinLabel: Node = null;   
    @property(Node)
    ndMask: Node = null;   
    @property(Node)
    ndSpicalKuanAni: Node = null;
    @property(Node)
    ndBetAni: Node = null;

    targetIndexNList: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isWaitRoll = false;
    isWaitRollReady = false;
    isResetView = false;
    rollingNum = 0;
    rollItemList: Node[][] = [];
    itemDataList: { [index: string]: { type: number, isLoaded: boolean, ndItemAni?: Node } } = {};

    spineItemList: { index: string, type: number, item: Node }[] = [];
    data: ServerGemsFrotuneIMsgData;

    speedEffID = 0;
    showWildEffect = false;
    isStopRoll = false;
    rollEndList: boolean[] = [];

    onLoad () {
        this.ndMultipleKuangAni.active = false;
        for (let i = 0; i < GemsFrotuneIData.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME+'_item_'+(i+1), SlotGameData.BUNDLE_NAME, 'prefab/items/'+(i+1));
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME+'_item_ani_'+(i+1), SlotGameData.BUNDLE_NAME, 'prefab/ani/item_'+(i+1));
        }
    }

    onDestroy () {}

    start () {}

    onClickEvent (_event: any, data: string) {
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

    onStartSpin (data: ServerGemsFrotuneIMsgData) {
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        GemsFrotuneIData.curRollServerData = data;
        this.data = data;
        this.startRoll();
    }
    initRollList() {
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.eventItemUpdate = (node_: Node, indexN_: number) => {
                    let targetIndexN = this.targetIndexNList[i];
                    if (indexN_ >= targetIndexN - 3 && indexN_ <= targetIndexN + 3) {
                        let rowIndex = indexN_ - (targetIndexN - 3);
                        let index = `${i}_${rowIndex}`;
                        let itemData = this.itemDataList[index];
                        if (itemData) {
                            scriptRoll.initItem(node_, itemData.type);
                        } else {
                            let randomIndex = this.getRandomType(i);
                            scriptRoll.initItem(node_, randomIndex);
                        }
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
                for (let j = 0; j < GemsFrotuneIData.ROW_NUM; j++) {
                    let index = `${i}_${j}`;
                    itemList.push(this.itemDataList[index].type);
                }
                scriptRoll.initList(i, itemList, () => {
                }, (_row: number, node: Node) => {
                    if (this.rollItemList[i] == null) {
                        this.rollItemList[i] = [];
                    }
                    this.rollItemList[i][_row] = node;
                }, (_row: number) => {
                });
            }
        }
    }

    updateRollEnd(_rollIndex: number, _callback: Function = null) {
        this.rollingNum--;
        if (this.rollingNum == 0) {
            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
            (SlotGameData.scriptGame as GemsFrotuneIGame).onSlotEnd();
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_stop');
            this.updateResultView();
        } else {
            if (SlotGameData.curSpeedIndex == 0) {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_stop');
            }
            let nextRow = GemsFrotuneIData.COL_NUM - this.rollingNum;
            this.showSpecialIcon(() => {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showwildcion');
            }, false, nextRow - 1);
        }
    }

    updateResultView() {
        if (!this.data || !this.data.dataList) {
            SlotGameData.scriptBottom.canDoNextRound();
            return;
        }
        if (this.data.dataList.length > 0) {
            this.ndMask.active = true;
            for (let i = 0; i < this.data.dataList.length; i++) {
                if (i == 0) {
                    this.showLine(false, this.data.dataList[i], true);
                } else {
                    this.showLine(false, this.data.dataList[i], false);
                }
            }
            (SlotGameData.scriptGame as GemsFrotuneIGame).showWinCoin(Utils.preciseRound(this.data.winScore / this.data.betNum), 1);
        } else {
            SlotGameData.scriptBottom.canDoNextRound();
        }
    }

    initGame() {
        this.spineItemList = [];
        this.ndMask.active = false;
        this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 0;
        this.initIcon();
        let count = this.ndTopAni.children.length;
        for (let i = 0; i < count; i++) {
            let node = this.ndTopAni.children[0];
            let name = node.name.replace(/[^\d]/g, "");
            PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + name, node);
        }
    }

    initIcon() {
        this.spineItemList.forEach((data) => {
            data.item.active = false;
        });
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (this.data && this.data.mapInfo[`${i}_${j}`].type != 0) {
                    let iconItem = this.rollItemList[i][j];
                    iconItem.active = true;
                }
            }
        }
    }
    onWaitSpinMsg() {
        this.initGame();
        this.resetView();
        this.isWaitRoll = true;
        SlotGameData.curRollingIndex++;
        let rollCount = GemsFrotuneIData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                let gapTime = 0;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        gapTime = 0;
                        break;
                    case 1:
                        gapTime = 0;
                        break;
                    default:
                        break;
                }
                this.scheduleOnce(() => {
                    scriptRoll.loop(2500);
                }, gapTime * i);
            }
        }
        (SlotGameData.scriptGame as GemsFrotuneIGame).onSlotStart();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'click');
    }

    startRoll() {
        this.setResultIcon();
        this.isStopRoll = false;
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
        this.rollListLoadedNum = 0;
        let mapInfo = this.data.mapInfo;
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
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndItem = this.ndRollList[i];
            if (ndItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let scriptRoll = ndItem.children[0].getComponent(RollingLottery);
                let scriptBezi = ndItem.children[0].getComponent(BezierCurveAnimation);
                scriptRoll.stop();
                scriptBezi.tweenUnitAS[0].controlPointV3S[1].y = 0.25;
                scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1.06;
                if (SlotGameData.curSpeedIndex == 0) {
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex] + i * 0.2);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum() * turnNumber[SlotGameData.curSpeedIndex];
                    scriptRoll.move(this.targetIndexNList[i], { tweenIndexNS: [0] });
                    scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1;
                } else {
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex]);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum() * turnNumber[SlotGameData.curSpeedIndex];
                    scriptRoll.move(this.targetIndexNList[i], { tweenIndexNS: [0] });
                }
            }
        }
        (SlotGameData.scriptGame as GemsFrotuneIGame).onSlotStart();
    }

    setResultIcon() {
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (j > 1 && j < 5) {
                    let type = this.data.mapInfo[`${i}_${j}`].type;
                    if (type != 0) {
                        PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (spineNode: Node) => {
                            let ndItemAni = instantiate(spineNode);
                            ndItemAni.parent = this.ndTopAni;
                            ndItemAni.active = false;
                            this.spineItemList.push({ index: `${i}_${j}`, type: type, item: ndItemAni });
                        });
                    }
                }
            }
        }
    }
    showLine(isCloseAll: boolean, lineData: GameMapInfo, isShowBet: boolean) {
        if (isCloseAll) this.initIcon();
        if (isShowBet) {
            lineData.lines.spIcon.push("3_3");
            this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 255;
        }
        for (let i = 0; i < lineData.lines.spIcon.length; i++) {
            let index = lineData.lines.spIcon[i];
            let spineData = this.spineItemList.find(a => a.index == index);
            let ndItemAni = spineData.item;
            if (ndItemAni) {
                let col = parseInt(index[0]);
                let row = parseInt(index[index.length - 1]);
                let iconItem = this.rollItemList[col][row];
                iconItem.active = false;
                let worldPos = this.rollItemList[col][row].getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                ndItemAni.active = true;
                let sc = ndItemAni.getComponent(GemsFrotuneIItemAni);
                if (sc) {
                    sc.playAni(0, true);
                }
            }
        }
    }

    showSpecialIcon(callback?: Function, isShowAll: boolean = true, row: number = 0) {
        let aniIconList;
        if (isShowAll) {
            aniIconList = this.spineItemList.filter(a => a.type == 8);
        } else {
            aniIconList = this.spineItemList.filter(a => a.type == 8 && parseInt(a.index[0]) == row);
        }
        if (aniIconList.length > 0) {
            if (callback) callback();
        }
    }

    playExtraMultiplesAni() {
        let isShowMultipleKuang = false;
        for (let i = 0; i < 3; i++) {
            let col = GemsFrotuneIData.COL_NUM - 1;
            let row = i + 2;
            let startType = GemsFrotuneIData.ITEM_WILD_TYPE + 1;
            let itemCount = GemsFrotuneIData.ITEM_MULTIPLE_NUM;
            let type = Math.floor(Math.random() * itemCount) + startType;
            PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (prefab: Prefab) => {
                let ndItemAni = instantiate(prefab);
                ndItemAni.parent = this.ndTopAni;
                let worldPos = this.ndExtraMultipleStart.getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                let firstPos = v3(newPos.x - 20, newPos.y + 30, 0);
                ndItemAni.getComponent(GemsFrotuneIItemAni).playAni(0, false, () => {
                    worldPos = this.rollItemList[col][row].getComponent(UITransform).convertToWorldSpaceAR(v3());
                    newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                    tween(ndItemAni)
                        .delay(0.4 - (0.2 * i))
                        .to(0.2, { position: firstPos })
                        .to(0.5, { position: newPos })
                        .call(() => {
                            PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, ndItemAni);
                        })
                        .start();
                });
                if (!isShowMultipleKuang) {
                    isShowMultipleKuang = true;
                    this.ndMultipleKuangAni.active = true;
                    this.ndMultipleKuangAni.getComponent(MySpine).playAni(0, false, () => {
                        this.ndMultipleKuangAni.active = false;
                    }, () => {
                        console.log('111');
                    });
                }
            });
        }
    }
    playMultiplesFlyAni() {
        let type = GemsFrotuneIData.curRollServerData.betType;
        PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (prefab: Prefab) => {
            let ndItemAni = instantiate(prefab);
            ndItemAni.parent = this.ndBetAni;
            let worldPos = this.rollItemList[3][3].getComponent(UITransform).convertToWorldSpaceAR(v3());
            let newPos = this.ndBetAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            ndItemAni.position = newPos;
            ndItemAni.getComponent(GemsFrotuneIItemAni).playAni(0, false, () => {
                worldPos = this.ndWinLabel.getComponent(UITransform).convertToWorldSpaceAR(v3());
                newPos = this.ndBetAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                tween(ndItemAni)
                    .to(0.2, { position: newPos })
                    .call(() => {
                        PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, ndItemAni);
                        (SlotGameData.scriptGame as GemsFrotuneIGame).showWinCoin(GemsFrotuneIData.curRollServerData.winScore, 2);
                    })
                    .start();
            });
        });
    }

    resetView() {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
        this.ndMask.active = false;
        this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 0;
        (SlotGameData.scriptGame as GemsFrotuneIGame).onStopSpin();
    }

    onStopSpin() {
        if (this.isStopRoll) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        let rollCount = SlotGameData.isRespinMode ? GemsFrotuneIData.COL_NUM - 1 : GemsFrotuneIData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                this.rollEndList[i] = false;
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.stop();
                scriptRoll.jump(this.targetIndexNList[i]);
                this.targetIndexNList[i] -= scriptRoll.getItemNum();
                let animationTime = 0.1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.1;
                        break;
                    case 1:
                        animationTime = 0.05;
                        break;
                    default:
                        break;
                }
                ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime);
                scriptRoll.move(this.targetIndexNList[i], { tweenIndexNS: [0] });
            }
        }
    }

    getRandomType(col: number) {
        let num = Utils.getRandNum(1, 8);
        if (col == 3) num = Utils.getRandNum(9, 14);
        return num;
    }
}