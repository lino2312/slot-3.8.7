import { PoolMng } from "../../../scripts/game/tsFrameCommon/Base/PoolMng";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import JungleDelightData, { GameMapInfo, ServerJungleDelightMsgData } from "./JungleDelightData";
import { RollingLottery } from "../../../scripts/game/tsFrameCommon/Base/RollingLottery";
import { BezierCurveAnimation } from "../../../scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import JungleDelightItem from "./JungleDelightItem";
import SlotGameData, { SlotMapInfo, SlotStatus } from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import JungleDelightGame from "./JungleDelightGame";
import MySpine from "../../../scripts/game/tsFrameCommon/Base/MySpine";
import { _decorator, Component, Node, instantiate, v3, tween, UITransform } from 'cc';

const { ccclass, property } = _decorator;
const turnNumber = [4, 2];
const baseTime = [1, 0.5];
@ccclass('JungleDelightSlots')
export default class JungleDelightSlots extends Component {

    @property(Node)
	spineAni: Node = null;
    @property([Node])
	ndRollList: Node[] = [];
    @property(Node)
	mask: Node = null;
    @property([Node])
	kuangNodes: Node[] = [];
    @property(Node)
	lineMask: Node = null;
    @property(Node)
	throwBoxSp: Node = null;
    @property(Node)
	lineWinSp: Node = null;

    targetIndexNList: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isRolling = false;
    rollingNum = 0;
    rollItemList: Node[][] = [];
    // 滚动符号列表数据
    itemDataList: {[index:string]:{type:number,isLoaded:boolean,ndItemAni?:Node}} = {};
    spineItemList: { index: string, type: number, item: Node}[] = [];
    data: ServerJungleDelightMsgData;
    specialStart: number = 0;

    isShowSpecial = false;
    isShowFirstKuang = false;
    showIndex = 0;
    specialIconCnt = 0;
    speedEffID = 0;
    isStopRoll = false;
    rollEndList: boolean[] = [];
    stopScRollId = 0;
    scEffID:any;

    onLoad() {    
        for (let i = 0; i < 9; i++) {
            PoolMng.newNodePool(JungleDelightData.BUNDLE_NAME + '_item_' + (i + 1), JungleDelightData.BUNDLE_NAME, 'prefab/items/' + (i + 1));
            PoolMng.newNodePool(JungleDelightData.BUNDLE_NAME + '_item_ani_' + (i + 1), JungleDelightData.BUNDLE_NAME, 'prefab/ani/item_' + (i + 1));
        }
    }

    start() {
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

    onStartSpin(data: ServerJungleDelightMsgData) {
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        JungleDelightData.curRollServerData = data;
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
                    if (indexN_ >= targetIndexN - 2 && indexN_ <= targetIndexN + 2) {
                        let rowIndex = indexN_ - (targetIndexN - 2)
                        let index = `${i}_${rowIndex}`;
                        let itemData = this.itemDataList[index];
                        scriptRoll.initItem(node_, itemData.type);
                    } else {
                        let randomIndex = this.getRandomType();
                        scriptRoll.initItem(node_, randomIndex);
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
                for (let j = 0; j < JungleDelightData.ROW_NUM; j++) {
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

    updateRollEnd(rollIndex: number, callback: Function = null) {
        this.rollingNum--;
        let nextRow = JungleDelightData.COL_NUM - this.rollingNum; //准备结束旋转的列

        this.showSpecialIcon(() => {//特殊图标音效
            this.specialIconCnt++;
            if (this.specialIconCnt < 3) {
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgSymScatter');
            }
            else if (this.specialIconCnt >= 3) {
                if (this.rollingNum == 0) {
                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgAllScattersMatch');
                } else {
                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgSymScatter');
                }
            }
        }, false, nextRow - 1);

        if (this.rollingNum == 0) {
            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
            (SlotGameData.scriptGame as JungleDelightGame).onSlotEnd();
            if (SlotGameData.curSpeedIndex == 0) {
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgReelStopNormal');
            }
            this.updateResultView();
        } else {
            if (this.data.isSpecial) {
                if (nextRow > this.specialStart) {
                    if(this.scEffID){
                        Utils.stopEffect(this.scEffID);
                    }
                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgFastspinResponsive',null,(stopID)=>{
                        this.scEffID = stopID;
                    });
                    this.showScMask(true, nextRow);
                }
            }
        }
        if (SlotGameData.curSpeedIndex == 0) {
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgReelStopNormal');
        }
        if(this.rollingNum == 4){
            if (SlotGameData.curSpeedIndex == 1) {
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgReelStopQuick');
            }
        }
    }

    updateResultView() {
        Utils.stopAllEffect();
        if (SlotGameData.curSpeedIndex == 1) {
            Utils.stopEffect(this.speedEffID);
        }
        this.showScMask(false,-1);//关闭sc遮罩
        let time = 0;
        if (this.data.idxs.length > 0 && SlotGameData.totalFreeTimes > 0) {
            time = 0.8;
            this.showKuang(false, this.data.idxs);
        }
        let isShowTotalWin = false;
        if(SlotGameData.freeTimes == SlotGameData.totalFreeTimes && JungleDelightData.isFreeGame){
            isShowTotalWin = true;
        }
        this.scheduleOnce(() => {//跳动后播放中奖线动画
            if (this.data.isThrowBox) {
                this.data.idxs.forEach((data) => {//先关闭所有spine动画
                let index = data - 1;
                let posIndex = JungleDelightData.indexMap[index];
                    let ainNodeData = this.spineItemList.find(a => a.index == posIndex);
                    if (ainNodeData) {
                        ainNodeData.item.active = false;
                    }
                });
            }
            if (this.data.dataList.length > 0) {
                this.lineMask.active = true;
                for (let i = 0; i < this.data.dataList.length; i++) {
                    this.showLine(false, this.data.dataList[i]);
                }
                this.showLineWinSpAin();
                if (JungleDelightData.isFreeGame) {
                    (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(1, this.data.winScore, true, () => {
                        if (!isShowTotalWin) {
                            this.scheduleOnce(() => {
                                SlotGameData.scriptBottom.canDoNextRound();
                            }, 1);
                        } else {
                            (SlotGameData.scriptGame as JungleDelightGame).freeWinAni(JungleDelightData.freeTotalWin);
                        }
                    });
                } else {
                    (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(0, this.data.winScore, true, () => {
                        if (!isShowTotalWin) {
                            this.scheduleOnce(() => {
                                SlotGameData.scriptBottom.canDoNextRound();
                            }, 1);
                        }
                    });
                }
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'prizeMedWin');//播放中奖线音效
                if (this.data.dataList.length > 1) {
                    this.schedule(this.resultAin, 2);
                }
            }
            else {
                if (!this.data.isWinFreeGame) {
                    if (!isShowTotalWin) {
                        SlotGameData.scriptBottom.canDoNextRound();
                    }else{
                        (SlotGameData.scriptGame as JungleDelightGame).freeWinAni(JungleDelightData.freeTotalWin);
                    }
                } else {
                    (SlotGameData.scriptGame as JungleDelightGame).freeModeSelect(SlotGameData.totalFreeTimes);
                }
            }
        }, time)
    }

    initGame() {
        this.showIndex = 0;
        this.spineItemList = [];
        this.specialStart = 0;
        this.specialIconCnt = 0;
        this.isShowSpecial = true;
        this.lineMask.active = false;
        this.initIcon();
        this.unschedule(this.resultAin);
        let count = this.spineAni.children.length;
        for (let i = 0; i < count; i++) {
            let node = this.spineAni.children[0];
            let name = node.name.replace(/[^\d]/g, " ");
            PoolMng.putNodePool(JungleDelightData.BUNDLE_NAME + '_item_ani_' + name, node);
        }
        this.setResultIcon();
    }

    initIcon() {
        this.spineItemList.forEach((data)=>{
            data.item.active = false;
        });
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (this.data.mapInfo[`${i}_${j}`].type != 0) {
                    let iconItem = this.rollItemList[i][j];
                    iconItem.active = true; //显示所有图标
                };
            }
        }
    }

    startRoll() {
        this.initGame();
        this.isStopRoll = false;
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
        this.rollListLoadedNum = 0;
        this.isRolling = true;
        let addTime = 0;
        let addturnNumber = 0;
        let startIndex = 0;
        let throwSpeed = 1;//丢宝箱模式
        this.rollingNum = 0;
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
                let row = parseInt(index[index.length - 1]);
                if (this.data.isSpecial && row > 0 && row < 4) {//是特殊模式，且图标在屏幕内
                    if (element.type == this.data.specialIconIndex && startIndex < 2) {
                        startIndex++;
                        this.specialStart = parseInt(index[0]);
                    }
                }
            }
        }
        if (this.data.isThrowBox) {
            throwSpeed = 3;
           this.showThrowBox(this.data.idxs);
        }
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndItem = this.ndRollList[i];
            if (ndItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let scriptRoll = ndItem.children[0].getComponent(RollingLottery);  
                let scriptBezi = ndItem.children[0].getComponent(BezierCurveAnimation);
                scriptBezi.tweenUnitAS[0].controlPointV3S[1].y = 0.25;
                scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1.06;
                if (SlotGameData.curSpeedIndex == 0 || this.data.isSpecial || this.data.isThrowBox) {
                    if (i > this.specialStart && this.data.isSpecial){
                        addTime = (1 + i * 0.3) * (i - this.specialStart);
                        addturnNumber = (scriptRoll.getItemNum() * 8) * (i - this.specialStart);
                    }
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex] * throwSpeed + i * 0.1 + addTime);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum() * turnNumber[SlotGameData.curSpeedIndex] * throwSpeed + addturnNumber;
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [0],
                    });
                    scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1;
                } else {
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex] + addTime);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum()*turnNumber[SlotGameData.curSpeedIndex] + addturnNumber;
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [0],
                    });
                }
            }        
        }
        if (this.rollingNum == 0) {
            this.isRolling = false;
        }
        SlotGameData.scriptGame.onSlotStart();
    }


    /** 
     * 展示清晰图标
     * @param index 展示界面的列
     * @param isShowIcon 是否展示清晰图标，默认展示
     **/
    showIcon(index:number = 0,isShowIcon:boolean = true){
        for (let i = 0; i < 3; i++){
            let node = this.rollItemList[index][i].children[0]
            if (node) {
                let sc = node.getComponent(JungleDelightItem);
                sc.changeItemIcon(isShowIcon);
            }
        }
    }

    /** 设置结果图标 */
    setResultIcon() {
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (j > 0 && j < 4) {
                    let iconItem = this.rollItemList[i][j];
                    let scriptRoll = iconItem.parent.getComponent(RollingLottery);
                    let type = this.data.mapInfo[`${i}_${j}`].type;
                    if (type != 0) {
                        PoolMng.getNodePool(JungleDelightData.BUNDLE_NAME + '_item_ani_' + type, (spineNode: Node) => {//生成对应的spine
                            let ndItemAni = instantiate(spineNode);
                            ndItemAni.parent = this.spineAni;
                            ndItemAni.active = false;
                            this.spineItemList.push({ index: `${i}_${j}`, type: type, item: ndItemAni });
                        });
                        scriptRoll.initItem(iconItem, type);//设置对应的icon图标
                    }
                }
            }
        }
    }

    /**展示特别图标 */
    showSpecialIcon(callback?: Function,isShowAll: boolean = true, row: number = 0) {
        if (!this.isShowSpecial) return;//当不是特殊模式时，只进入一次显示
        let aniIconList;
        if (isShowAll) {
            aniIconList = this.spineItemList.filter(a => a.type == 9);
        } else {
            aniIconList = this.spineItemList.filter(a => a.type == 9 && parseInt(a.index[0]) == row);
        }
        if (aniIconList.length > 0) {//有特殊图标就先让图标动
            if (callback) callback();
            for (let i = 0; i < aniIconList.length; i++) {
                let aniData = aniIconList[i];
                let col = parseInt(aniData.index[0]);
                let row = parseInt(aniData.index[aniData.index.length - 1]);
                let iconItem = this.rollItemList[col][row];
                aniData.item.active = true;
                iconItem.active = false;
                const iconTransform = iconItem.getComponent(UITransform);
                const spineTransform = this.spineAni.getComponent(UITransform);
                let worldPos = iconTransform.convertToWorldSpaceAR(v3(0, 0, 0));
                let newPos = spineTransform.convertToNodeSpaceAR(worldPos);
                aniData.item.setPosition(newPos);
            }
        }
    }

    /** 展示结果线 */
    showLine(isCloseAll: boolean, lineData: GameMapInfo) {
        if (isCloseAll) this.initIcon();
        for (let i = 0; i < lineData.lines.spIcon.length; i++) {//隐藏图标
            let index = lineData.lines.spIcon[i];
            let spineData = this.spineItemList.find(a=>a.index == index)
            let ndItemAni = spineData.item;
            if (ndItemAni) {
                let col = parseInt(index[0]);
                let row = parseInt(index[index.length - 1]);
                let iconItem = this.rollItemList[col][row]
                iconItem.active = false;
                const itemTransform = this.rollItemList[col][row].getComponent(UITransform);
                const spineTransform = this.spineAni.getComponent(UITransform);
                let worldPos = itemTransform.convertToWorldSpaceAR(v3(0, 0, 0));
                let newPos = spineTransform.convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                ndItemAni.active = true
                let sc = ndItemAni.getComponent(JungleDelightItem);
                if (sc) {
                    sc.showAni();
                }
            }
        }
        (SlotGameData.scriptGame as JungleDelightGame).showLine(isCloseAll, lineData.lines.lineIndex);
    }

    /** 结果线轮流展示 */
    resultAin() {
        if (this.data.dataList.length > 0) {
            let count = this.data.dataList.length;
            if (count > 1 && SlotGameData.autoTimes == 0) {
                if (this.showIndex > count - 1) {
                    this.showIndex = 0;
                    for (let j = 0; j < this.data.dataList.length; j++) {
                        this.showLine(false, this.data.dataList[j]);
                    }
                    if (JungleDelightData.isFreeGame) {
                        (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(1, this.data.winScore, false);
                    } else {
                        (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(0, this.data.winScore, false);
                    }
                } else {
                    this.showLine(true, this.data.dataList[this.showIndex]);
                    if (JungleDelightData.isFreeGame) {
                        (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(1, this.data.dataList[this.showIndex].lines.win,false);
                    } else {
                        (SlotGameData.scriptGame as JungleDelightGame).showWinSpine(0, this.data.dataList[this.showIndex].lines.win,false);
                    }
                    this.showIndex++;
                }
            }
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'prizePaypoutLineIdle');
        }
    }

    /**
     * 展示sc遮罩
     * @param isShow 是否展示
     * @param index 位置信息
     */
    showScMask(isShow: boolean, index: number) {
        this.mask.active = isShow;
        if(index >= 0){
            this.mask.setPosition(this.ndRollList[index].getPosition());
        }
    }

    /**
     * 展示感染框
     * @param isCloseAll 是否关闭全部
     * @param showList 传入一维数组
     */
    showKuang(isCloseAll = false, showList = []) {
        if (isCloseAll) {
            for (let i = 0; i < this.kuangNodes.length; i++) {
                this.kuangNodes[i].active = false;
            }
            this.isShowFirstKuang = false;
        }
        for (let i = 0; i < showList.length; i++) {
            let index = showList[i] -1;
            let node = this.kuangNodes[index];
            node.active = true;
            let nodeSpine = node.getComponent(MySpine);
            if (index == 7 && !this.isShowFirstKuang) {//7号框特殊处理
                this.isShowFirstKuang = true;
                nodeSpine.playAni(0, false, () => {
                    nodeSpine.playAni(1, true)
                })
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsSymSwitchMatch01');
            } else if (index == 7 && this.isShowFirstKuang) {
                nodeSpine.playAni(2, false, () => {
                    nodeSpine.playAni(1, true)
                })
            } else {
                this.scheduleOnce(() => {//7号框之外动画得延迟一会
                    nodeSpine.playAni(0, false, () => {
                        nodeSpine.playAni(1, true)
                    })
                    Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsSymSwitchMatch02');
                }, 0.5)
            }
        }
    }

    /**
     * 中线狐狸探头
     */
    showLineWinSpAin() {
        this.lineWinSp.active = true;
        this.lineWinSp.getComponent(MySpine).playAni(0, false, () => {
            this.lineWinSp.active = false;
        });
    }

    /** 狐狸扔盒子 */
    showThrowBox(showList = []) {
        this.throwBoxSp.active = true;
        this.throwBoxSp.getComponent(MySpine).playAni(0, false, () => {
            this.throwBoxSp.active = false;
        });
        let delayTime = 0.2;
        if (SlotGameData.curSpeedIndex == 1) delayTime = 0.08;
        this.scheduleOnce(() => {
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgBoxComingOutResponsive');
            for (let k = 0; k < showList.length; k++) {
                let index = showList[k] - 1;
                let posIndex = JungleDelightData.indexMap[index]
                let ainNodeData = this.spineItemList.find(a => a.index == posIndex);
                if (ainNodeData) {
                    let sc = ainNodeData.item.getComponent(JungleDelightItem);
                    sc.showBox();
                    let startPos = v3(0, 450, 0);
                    let node = this.kuangNodes[index];
                    const nodeTransform = node.getComponent(UITransform);
                    const spineTransform = this.spineAni.getComponent(UITransform);
                    let worldPos = nodeTransform.convertToWorldSpaceAR(v3(0, 0, 0));
                    let newPos = spineTransform.convertToNodeSpaceAR(worldPos);
                    ainNodeData.item.setPosition(startPos);
                    tween(ainNodeData.item)
                        .delay(delayTime * k)
                        .call(() => {
                            ainNodeData.item.active = true;
                        })
                        .to(0.3, { position: newPos })
                        .delay(delayTime * (showList.length - k - 1))
                        .call(() => {
                            sc.openBoxAni();
                            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsBoxExplosion');
                        })
                        .start();
                }
            }
        }, 0.8);
    }

    onStopSpin() {
        if (this.isStopRoll) {
            return;
        }
        if (this.data.isThrowBox) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        let rollNum = 0;
        let rollCount = SlotGameData.isRespinMode ? JungleDelightData.COL_NUM - 1 : JungleDelightData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                rollNum++;
                this.rollEndList[i] = false;
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
        // if (rollNum == 0) {
        //     Utils.stopAllEffect();
        // }
    }

    getRandomType() {
        let num = Math.floor(Math.random() * 8) + 1;//sc符号不随机所以只到九
        return num;
    }

}

