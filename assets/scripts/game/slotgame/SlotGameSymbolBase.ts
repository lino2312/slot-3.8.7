import { _decorator, Component, find, instantiate, isValid, Node, sp, Tween, tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('SlotGameSymbolBase')
export class SlotGameSymbolBase extends Component {

    protected topAniNode: Node = null;
    protected reelIdx: number = 0; //记录当前符号所在的列索引
    protected slotGameDataScript: any = null;
    protected id: number = 0; //显示的符号
    protected showNode: Node = null; //当前显示的节点
    protected state: string = ""; //符号状态 
    protected data: any = null; //额外数据
    protected isKuang: boolean = false;
    protected symbolIdx: number = 0; //所在reel的行号
    protected showNodeOrgScale = Vec3.ZERO; //记录显示节点的原始缩放比例

    onLoad() {

    }


    start() {

    }

    update(deltaTime: number) {

    }

    init(idx, node) {
        this.topAniNode = node
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        this.setSymbolIdx(idx);
        this.showRandomSymbol();
    }

    //显示随机符号                 
    showRandomSymbol() {
        let randVal
        let randomcfg = this.getRandomCfg();
        if (randomcfg) {
            let reelrandomCfg = randomcfg[this.reelIdx + 1];
            if (reelrandomCfg) {
                //gamedata中记录了当前列随机到符号表的序号了，只需要一个个往下随机就好
                let randIdx = this.slotGameDataScript.getReelRandomIdx(this.reelIdx);
                if (!App.MathUtils.isNumber(randIdx)) {
                    //如果没有就随机一个开始值，如果每次都从0开始，就每次进去游戏都是那几个图标
                    randIdx = App.MathUtils.random(1, reelrandomCfg.length) - 1;
                }
                randVal = reelrandomCfg[randIdx]
                if (!randVal) { //如果取到最后了就从头开始取
                    randIdx = 0;
                    randVal = reelrandomCfg[randIdx];
                }

                this.slotGameDataScript.setReelRandomIdx(this.reelIdx, ++randIdx);
            }
        }
        else {//兼容旧的配置数据
            let cfg = this.slotGameDataScript.getGameCfg();
            let randIdx = App.MathUtils.random(1, cfg.randomSymbols.length);
            randVal = cfg.randomSymbols[randIdx - 1];
        }
        this.showById(randVal);
    }

    /**
     * 获取随机的符号表，可重写次函数根据需要配置免费游戏的符号表
     * 
     */
    getRandomCfg() {
        let cfg = this.slotGameDataScript.getGameCfg();
        let isFree = this.slotGameDataScript.getTotalFree() > 0 && this.slotGameDataScript.getTotalFree() !== this.slotGameDataScript.gameData.getFreeTime();
        if (isFree && cfg.cardmapfree) {
            return cfg.cardmapfree
        }
        return cfg.cardmap
    }



    //显示symbole
    //id:物品id
    //data:额外传递的数据
    showById(id, data = null) {
        this.id = id
        this.data = data
        this.state = "normal";

        if (this.showNode) {
            this.showNode.active = false
        }
        let cfg = this.slotGameDataScript().getGameCfg();
        let itemCfg = cfg.symbol[id]
        if (itemCfg && itemCfg.node) {
            this.showNode = find(itemCfg.node, this.node)
            this.showNode.active = true

            if (itemCfg.zIndex !== undefined) {
                this.node.setSiblingIndex(itemCfg.zIndex);
            }
        }
        else {
            console.log("未找到配置id:" + id);
        }
    }


    getShowId() {
        return this.id;
    }

    getData() {
        return this.data;
    }

    // //显示中奖框
    // bShow :true/false
    showKuang(bShow = true) {
        this.isKuang = bShow;
        const cfg = this.slotGameDataScript.getGameCfg();
        if (!cfg.kuang) return;

        const assetScp = this.slotGameDataScript.getAssetScript();
        const parentObj = this.getKuangShowParent();
        if (!assetScp || !parentObj) return;

        const kuangName = `kuang${this.symbolIdx}_${this.reelIdx}`;
        let kuangNode = parentObj.getChildByName(kuangName);

        if (bShow) {
            if (!kuangNode || !isValid(kuangNode, true)) {
                const kuangPrefab = assetScp.GetPrefabByName(cfg.kuang);
                if (kuangPrefab) {
                    kuangNode = instantiate(kuangPrefab);
                    kuangNode.name = kuangName;
                    kuangNode.parent = parentObj;
                }
            }
            if (kuangNode) {
                const symbolWorldPos = this.node.getWorldPosition();
                const parentTransform = parentObj.getComponent(UITransform);
                if (parentTransform) {
                    kuangNode.position = parentTransform.convertToNodeSpaceAR(symbolWorldPos);
                } else {
                    kuangNode.position = parentObj.position; // fallback if UITransform is missing
                }
                kuangNode.active = true;
                const winAni = cfg.symbol[this.id]?.win_ani;
                if (winAni && winAni.zIndex !== undefined) {
                    kuangNode.setSiblingIndex(winAni.zIndex - this.symbolIdx + this.reelIdx * 10 + 10);
                }
            }
        } else {
            if (kuangNode) {
                kuangNode.active = false;
            }
        }
    }


    //设置_symbolIdx 行序号
    setSymbolIdx(idx) {
        this.symbolIdx = idx;
        let zVal = 50 - idx;
        if (this.id) {
            let cfg = this.slotGameDataScript.getGameCfg()
            let itemCfg = cfg.symbol[this.id]
            if (itemCfg && itemCfg.zIndex) {
                zVal = itemCfg.zIndex
            }
        }
        this.node.setSiblingIndex(zVal)
    }

    //获取symbol的列序号：0开始
    getSymbolReelIdx() {
        return this.reelIdx;
    }

    //设置行号
    setSymbolReelIdx(val) {
        this.reelIdx = val;
    }

    //设置框体的父节点
    //根据层级可能需要重写
    getKuangShowParent() {
        return this.topAniNode;
    }


    //显示正常的结果图标
    showNormal() {
        this.showById(this.id, this.data);
        this.setAnimationToTop(false);
    }

    //开始旋转时刻
    startMove() {
        this.setAnimationToTop(false);
        this.showKuang(false);
        this.stopWinTweenAction();
        this.node.setSiblingIndex(50 - this.symbolIdx + this.reelIdx * 10);
    }

    //开始回弹动作之前
    stopMoveBefore() {
    }

    //停止最低点之后
    stopMoveDeep() {
    }

    //停止回弹之后
    stopMoveEnd() {
    }

    protected playSymbolAnimation(state: 'win' | 'stop' | 'idle', loop: boolean = false) {
        const id = this.id;
        const cfg = this.slotGameDataScript.getGameCfg();
        const symbolCfg = cfg.symbol[id];
        if (!symbolCfg || !symbolCfg.win_node) return false;

        this.state = state;
        if (this.showNode) this.showNode.active = false;

        // 动画节点查找
        this.showNode = find(symbolCfg.win_node, this.node);
        if (!this.showNode) return false;
        this.showNode.active = true;

        // 动画配置
        let aniCfg: any;
        let zIndex: number;
        let aniName: string;
        let isLoop: boolean;

        switch (state) {
            case 'win':
                aniCfg = symbolCfg.win_ani;
                break;
            case 'stop':
                aniCfg = symbolCfg.stop_ani;
                break;
            case 'idle':
                aniCfg = symbolCfg.idle_ani;
                break;
        }

        if (aniCfg && aniCfg.name) {
            zIndex = aniCfg.zIndex !== undefined
                ? aniCfg.zIndex - this.symbolIdx + this.reelIdx * 10
                : this.node.getSiblingIndex();
            aniName = aniCfg.name;
            isLoop = state === 'win' || state === 'idle' ? true : false;
            this.node.setSiblingIndex(zIndex);

            const nodeSp = this.showNode.getComponent(sp.Skeleton);
            if (nodeSp) {
                nodeSp.setAnimation(0, aniName, isLoop);
            }
            return true;
        } else if (state === 'win') {
            // 没有中奖动画时，显示节点并播放Tween
            this.showNode.active = true;
            this.playWinTweenAction();
            return true;
        }
        return false;
    }

    // 中奖动画
    playWinAnimation() {
        this.playSymbolAnimation('win', true);
    }

    // 停止动画
    playStopAnimation() {
        this.playSymbolAnimation('stop', false);
    }

    // 待机动画
    playidleAnimation(): boolean {
        return this.playSymbolAnimation('idle', true);
    }

    //触发动画
    //触发了才播放的。比如已经3个scatter已经触发了免费。这个和中奖的还不一样
    playTriggerAnimation(): boolean {
        const id = this.id;
        const cfg = this.slotGameDataScript.getGameCfg();
        const symbolCfg = cfg.symbol[id];
        const aniCfg = symbolCfg?.trigger_ani;

        if (!symbolCfg || !symbolCfg.win_node || !aniCfg || !aniCfg.name) return false;

        this.state = "trigger";
        if (this.showNode) this.showNode.active = false;

        // 动画节点查找
        const aniNode = this.setAnimationToTop(true);
        aniNode.active = true;
        const topShowNode = find(symbolCfg.win_node, aniNode);
        if (!topShowNode) return false;
        topShowNode.active = true;

        // 设置层级
        aniNode.setSiblingIndex(
            aniCfg.zIndex !== undefined
                ? aniCfg.zIndex - this.symbolIdx + this.reelIdx * 10
                : aniNode.getSiblingIndex()
        );

        // 播放 Spine 动画
        const nodeSp = topShowNode.getComponent(sp.Skeleton);
        if (nodeSp) {
            nodeSp.setAnimation(0, aniCfg.name, false);
            return true;
        }
        return false;
    }

    //在顶层播放动画；能覆盖左右两列
    setAnimationToTop(isTop: boolean): Node {
        if (!this.topAniNode) return this.node;

        const aniName = `symbol_ani_${this.symbolIdx}_${this.reelIdx}`;
        if (isTop) {
            let cloneNode = find(aniName, this.topAniNode);
            if (!cloneNode) {
                cloneNode = instantiate(this.node);
            }

            // 世界坐标转换
            const worldPos = this.node.getWorldPosition();
            cloneNode.parent = this.topAniNode;
            cloneNode.name = aniName;
            const uiTransform = this.topAniNode.getComponent(UITransform);
            if (uiTransform) {
                // Convert world position to local position using UITransform
                cloneNode.position = uiTransform.convertToNodeSpaceAR(worldPos);
            } else {
                cloneNode.position = worldPos; // fallback if UITransform is missing
            }
            this.node.active = false;
            return cloneNode;
        } else {
            const showNode = find(aniName, this.topAniNode);
            if (showNode) {
                showNode.removeFromParent();
                showNode.destroy();
            }
            this.node.active = true;
            if (this.showNode) {
                this.showNode.active = true;
            }
        }
        return this.node;
    }

    //备份当前状态
    backup() {
        let backup = {} as any;
        backup.symbolIdx = this.symbolIdx;
        backup.id = this.id;
        if (this.data) {
            backup.data = App.SystemUtils.copy(this.data);
        }
        backup.isKuang = this.isKuang;
        backup.state = this.state;
        return backup
    }

    //恢复到保存的状态
    resume(backup) {
        if (!backup) return;
        this.symbolIdx = backup.symbolIdx;
        this.id = backup.id;
        this.data = App.SystemUtils.copy(backup.data);
        this.showKuang(backup.isKuang);
        this.showNormal();
        let state = backup.state;
        if (state == "win") {
            this.playWinAnimation();
        } else if (state == "stop") {
            this.playStopAnimation();
        } else if (state == "idle") {
            this.playidleAnimation();
        } else if (state == "trigger") {
            this.playTriggerAnimation();
        }

    }

    //播放win效果但又没有spin动画。自己写一个tween的action
    //先填写个默认的。
    playWinTweenAction() {
        Tween.stopAllByTarget(this.node);
        //记录原始缩放
        let nScale = this.showNode.scale
        this.showNodeOrgScale = nScale

        tween(this.showNode)
            .repeatForever(
                tween()
                    .to(0.35, { scale: new Vec3(nScale.x + 0.2, nScale.y + 0.2, nScale.z) })
                    .to(0.35, { scale: nScale })
                    .delay(1)
            )
            .start();
    }

    //停止tween类型的action动画
    stopWinTweenAction() {
        if (this.showNode) {
            this.showNode.active = true;
            Tween.stopAllByTarget(this.showNode);
            //恢复
            if (this.showNodeOrgScale) {
                this.showNode.scale = this.showNodeOrgScale
                this.showNodeOrgScale = null
            }

            const uiOpacity = this.showNode.getComponent(UIOpacity);
            if (!uiOpacity) {
                const newUiOpacity = this.showNode.addComponent(UIOpacity);
                newUiOpacity.opacity = 255;
            } else {
                uiOpacity.opacity = 255;
            }
        }
    }

    playSfx(name: string) {
        console.log("音效：：："+name)
        App.AudioManager.playSfx(name);
    }
}


