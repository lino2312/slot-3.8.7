import { _decorator, Component, Node, Prefab, Vec2, tween, find, instantiate, Vec3 } from 'cc';
import { SlotGameBaseData } from './SlotGameBaseData';
import { App } from '../../App';
import { Config } from '../../config/Config';
const { ccclass, property } = _decorator;

@ccclass('SlotGameReelBase')
export class SlotGameReelBase extends Component {
    protected reelIdx: number = 0;
    protected nCount: number = 0;
    protected symbols: any[] = [];
    protected symbolTemplate: Prefab | null = null;
    protected holderNode: Node | null = null;
    protected bMoving: boolean = false;
    protected bStoping: boolean = false;
    protected holderOrigPosY: number = 0;
    protected curY: number = 0;
    protected stopTime: number = 0;
    protected bResizing: boolean = false;
    protected result: any = null;
    protected originResult: any = null;
    protected totalAddHeight: number = 0;
    protected deltaHeight: number = 0;
    protected curAddHeight: number = 0;
    protected reelState: any[] = [];
    protected topAniNode: Node | null = null;
    protected backupDatas: any = null;
    protected cfg: any = null;
    protected appendArray: any = null;
    protected appedDir: number = 0;
    protected offsetY: number = 0;
    protected speed: number = 0;
    protected offset: number = 0;
    protected bNotifyReadyStop: boolean = false;
    protected stopRightNow: boolean = false;
    protected addSpeed: number = 0;
    protected tryFixError: number = 0;
    protected sloteGameDataScript: SlotGameBaseData = null;

    onLoad() {
        this.holderNode = find("mask/holder", this.node);
        this.holderOrigPosY = this.holderNode!.position.y;
        this.sloteGameDataScript = App.SubGameManager.getSlotGameDataScript();
    }

    start() { }

    // 初始化卷轴
    init(idx: number, nCount: number, node: Node) {
        this.reelIdx = idx;
        this.nCount = nCount;
        this.symbols = [];
        this.topAniNode = node;
        this.cfg = this.sloteGameDataScript.getGameCfg();
        this.loadSymbols();
        this.showAntiEffect(false);
        this.tryFixError = 0;
    }

    getReelIdx() {
        return this.reelIdx;
    }

    protected loadSymbols() {
        const url = this.cfg.symbolPrefab;
        if (!this.symbolTemplate) {
            this.symbolTemplate = this.sloteGameDataScript.getPrefabByName(url);
            if (this.symbolTemplate) {
                this.symbolTemplate.optimizationPolicy = 1; // MULTI_INSTANCE
            }
        }
        for (let i = 0; i < this.nCount + 1; i++) {
            this.createOneSymbol();
        }
        this.reLayOut();
    }

    protected createOneSymbol() {
        const node = instantiate(this.symbolTemplate!);
        node.parent = this.holderNode!;
        const scp = node.addComponent(this.cfg.scripts.Symbols) as any;
        const idx = this.symbols.length;
        scp.setSymbolReelIdx(this.reelIdx);
        scp.init(idx, this.topAniNode);
        this.symbols.push(scp);
    }

    protected reLayOut() {
        for (let i = 0; i < this.symbols.length; i++) {
            const element = this.symbols[i];
            element.node.position = this.getSymbolPosByRow(i);
            element.setSymbolIdx(i);
        }
    }

    getSymbolByRow(row: number) {
        return this.symbols[row];
    }

    protected getSymbolPosByRow(row: number) {
        return new Vec3(0, (row + 0.5) * this.cfg.symbolSize.height, 0);
    }

    addCount(count: number, deltaTime = 0.5, offsetY = 0) {
        if (this.bResizing) return;
        this.bResizing = true;
        this.nCount += count;
        this.offsetY = offsetY;
        let nOffCount = this.offsetY;
        if (count < 0) nOffCount = this.offsetY * -1;
        if (this.symbols.length < this.nCount + 1) {
            let cnt = this.nCount + 1 - this.symbols.length;
            for (let i = 0; i < cnt; i++) {
                this.createOneSymbol();
            }
        }
        this.reLayOut();
        this.totalAddHeight = (count - nOffCount) * this.cfg.symbolSize.height;
        this.deltaHeight = this.totalAddHeight / deltaTime;
        this.curAddHeight = 0;
    }

    appendSymbol(symbolArray: any[], dir: number) {
        this.appendArray = symbolArray;
        this.appedDir = dir;
        for (let i = 0; i < symbolArray.length; i++) {
            const node = instantiate(this.symbolTemplate!);
            node.parent = this.holderNode!;
            const scp = node.addComponent(this.cfg.scripts.Symbols) as any;
            scp.setSymbolReelIdx(this.reelIdx);
            if (dir === 1) {
                const idx = -1 - i;
                node.setPosition(this.getSymbolPosByRow(idx));
                scp.init(idx, this.topAniNode);
                this.symbols.unshift(scp);
            } else if (dir === 2) {
                const idx = this.symbols.length - 1;
                scp.init(idx, this.topAniNode);
                this.symbols.splice(idx, 0, scp);
            }
            scp.showById(symbolArray[i]);
        }
        if (dir === 2) {
            this.reLayOut();
        }
    }

    delAppendSymbol() {
        if (this.appendArray) {
            for (let i = 0; i < this.appendArray.length; i++) {
                if (this.appedDir === 1) {
                    const item = this.symbols.pop();
                    this.destroySymbol(item);
                } else if (this.appedDir === 2) {
                    const item = this.symbols.shift();
                    this.destroySymbol(item);
                }
            }
            this.appendArray = null;
        }
    }

    startMove() {
        this.result = null;
        this.stopRightNow = false;
        this.bNotifyReadyStop = false;
        this.originResult = null;
        this.addSpeed = 0;
        this.curY = 0;
        this.bMoving = true;
        this.bStoping = false;
        this.offsetY = 0;
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].startMove();
        }
        this.speed = this.cfg.speed * Config.SLOT_GAME_SPEED;
        this.offset = this.cfg.symbolSize.height;
    }

    startRecycleSymbol(nTime: number) {
        const cfg = this.sloteGameDataScript.getGameCfg();
        if (this.symbols.length > (cfg.row + 1)) {
            const nCount = -(this.symbols.length - (cfg.row + 1));
            this.addCount(nCount, nTime);
        }
    }

    stopMove(delayTime: number) {
        if (this.bResizing) return;
        if (!this.bMoving) return;
        this.bStoping = true;
        this.stopTime = delayTime;
    }

    protected updataSymbol() {
        const symbol = this.symbols.shift();
        let symbolData = null;
        if (this.stopTime <= 0 && this.bStoping && this.result && !this.bResizing) {
            if (Array.isArray(this.result)) {
                this.readyToStop();
                symbolData = this.result.shift();
                if (!symbolData) {
                    this.bMoving = false;
                    this.tryFixError = 0;
                }
            } else {
                console.warn('SlotGameReelBase.updataSymbol设置的结果不是数组!');
            }
        } else if (this.stopTime <= 0 && !this.bStoping && this.result && !this.bResizing) {
            this.tryFixError += 1;
            if (this.tryFixError > 120) {
                this.bStoping = !this.bStoping;
                this.tryFixError = 0;
            }
        }
        if (symbolData) {
            symbol.showById(symbolData.sid, symbolData.data);
        } else {
            symbol.showRandomSymbol();
        }
        this.symbols.push(symbol);
        this.reLayOut();
        this.curY = 0;
        this.holderNode!.y = this.holderOrigPosY;
        if (!this.bMoving) {
            this.onReelBounsAction();
        }
    }

    stopMoveRightNow() {
        this.stopRightNow = true;
        if (this.bMoving && this.originResult) {
            this.result = App.SystemUtils.copy(this.originResult);
            for (let i = 0; i < this.symbols.length; i++) {
                this.updataSymbol();
            }
        }
    }

    addDelayTime(nVal: number) {
        if (this.bMoving) {
            this.stopTime += nVal;
            this.result = App.SystemUtils.copy(this.originResult);
        } else {
            console.log(this.reelIdx + '列已经停止了还加速！！！');
        }
    }

    setSpeed(speed: number) {
        this.speed = speed * Config.SLOT_GAME_SPEED;
    }

    onReelSpinEnd() {
        this.reelState = [];
        const slots = this.sloteGameDataScript.getSlotsScript();
        slots.onReelSpinEnd(this.reelIdx);
        const lastReelStopIdx = slots.getLastStopReelIdx();
        if (this.reelIdx === lastReelStopIdx) {
            slots.onSpinEnd();
        }
    }

    readyToStop() {
        if (!this.bNotifyReadyStop) {
            this.bNotifyReadyStop = true;
            const slots = this.sloteGameDataScript.getSlotsScript();
            slots.onReelReadyToStop(this.reelIdx);
        }
    }

    onReelBounsActionBefore() {
        const slots = this.sloteGameDataScript.getSlotsScript();
        slots.onReelBounsActionBefore(this.reelIdx);
        if (this.originResult) {
            for (let i = 0; i < this.originResult.length; i++) {
                this.symbols[i] && this.symbols[i].stopMoveBefore();
            }
        }
    }

    onReelBounsActionDeep() {
        this.showAntiEffect(false);
        this.playReelStop();
        const slots = this.sloteGameDataScript.getSlotsScript();
        slots.onReelBounsActionDeep(this.reelIdx);
        if (this.originResult) {
            for (let i = 0; i < this.originResult.length; i++) {
                this.symbols[i].stopMoveDeep();
            }
        }
    }

    onReelBounsActionEnd() {
        const slots = this.sloteGameDataScript.getSlotsScript();
        slots.onReelBounsActionEnd(this.reelIdx);
        if (this.originResult) {
            for (let i = 0; i < this.originResult.length; i++) {
                this.symbols[i].stopMoveEnd();
            }
        } else {
            console.log('回弹结束，数据已经被清空了');
        }
        this.onReelSpinEnd();
    }

    onReelBounsAction(isStop = false) {
        const distance = this.cfg.bounceInfo ? this.cfg.bounceInfo.distance : 30;
        let time = this.cfg.bounceInfo ? this.cfg.bounceInfo.time : 0.3;
        const deepTime = isStop ? 0 : distance / this.speed;
        time = time / this.getTimeScale();
        tween(this.holderNode)
            .call(this.onReelBounsActionBefore.bind(this))
            .to(deepTime, { position: new Vec3(this.holderNode!.x, this.holderOrigPosY - distance, 0) })
            .call(this.onReelBounsActionDeep.bind(this))
            .to(time, { position: new Vec3(this.holderNode!.x, this.holderOrigPosY, 0) })
            .call(this.onReelBounsActionEnd.bind(this))
            .start();
    }

    setResult(val: any) {
        this.originResult = App.SystemUtils.copy(val);
        this.result = val;
    }

    addReelStateInfo(info: any) {
        this.reelState.push(info);
    }

    playReelStop() {
        if (this.originResult) {
            for (let i = 0; i < this.originResult.length; i++) {
                const item = this.symbols[i];
                for (const info of this.reelState) {
                    if (info.isStop && info.id.includes(item.getShowId())) {
                        item.playStopAnimation();
                    }
                }
            }
        }
        if (this.cfg.reelStateInfo && this.cfg.reelStateInfo[0]) {
            let reelStopEffect = '';
            let symbolEffect = '';
            let hasSymbol = false;
            for (const info of this.reelState) {
                if (info.isStop) {
                    symbolEffect = info.symbolStopSound ? info.symbolStopSound : '';
                    hasSymbol = true;
                } else {
                    reelStopEffect = info.reelStopSound ? info.reelStopSound : '';
                }
            }
            if (hasSymbol) {
                reelStopEffect = symbolEffect;
            }
            let soundPath = this.cfg.reelStateInfo[0].path;
            if (!soundPath) {
                soundPath = "audio/";
            }
            App.AudioManager.playSfx(soundPath, reelStopEffect);
        }
    }

    playAntiAnimation() {
        let isPlayAniti = false;
        if (this.cfg.reelStateInfo && this.cfg.reelStateInfo[0]) {
            for (const info of this.reelState) {
                if (info.isAnt && info.antiNode) {
                    this.showAntiEffect(true, info.antiNode);
                    let soundPath = info.path;
                    if (!soundPath) {
                        soundPath = "audio/";
                    }
                    App.AudioManager.playSfx(soundPath, info.antSound);
                    let cfgAntSpeed = info.antSpeed;
                    if (cfgAntSpeed) {
                        cfgAntSpeed = cfgAntSpeed * Config.SLOT_GAME_SPEED;
                    }
                    this.speed = cfgAntSpeed ? cfgAntSpeed : this.speed;
                    isPlayAniti = true;
                }
            }
        }
        return isPlayAniti;
    }

    showAntiEffect(bShow: boolean, name?: string) {
        if (bShow === false) {
            if (this.cfg.reelStateInfo) {
                for (const info of this.cfg.reelStateInfo) {
                    const node = find("mask/" + info.antiNode, this.node);
                    if (node && node.active) {
                        node.active = false;
                        if (this.stopRightNow) {
                            App.AudioManager.stopSfxByName(info.antSound);
                        }
                    }
                }
            }
        } else {
            const node = find("mask/" + name, this.node);
            if (node) {
                node.active = bShow;
            } else {
                console.log("未找到加速节点：mask/node_anti");
            }
        }
    }

    onReelHeigtChange(nAddHeight: number) { }

    onReelHeightChangeEnd(bUp: boolean) { }

    protected updatePosition(dt: number) {
        this.stopTime = this.stopTime - dt;
        this.curY += dt * this.speed;
        if (this.curY > this.offset) {
            this.updataSymbol();
        } else {
            this.holderNode!.y = this.holderOrigPosY - this.curY;
        }
    }

    protected updateSize(dt: number) {
        let height = this.deltaHeight * dt;
        this.curAddHeight += height;
        if (
            (this.totalAddHeight > 0 && this.curAddHeight >= this.totalAddHeight) ||
            (this.totalAddHeight < 0 && this.curAddHeight <= this.totalAddHeight)
        ) {
            this.curAddHeight -= height;
            height = this.totalAddHeight - this.curAddHeight;
            this.bResizing = false;
            this.onReelHeightChangeEnd(height > 0);
        }
        const reHeight = this.getResizeHeightObjs();
        for (let i = 0; i < reHeight.length; i++) {
            reHeight[i].height += height;
        }
        const movingObjs = this.getResizeMoveingObjs();
        for (let i = 0; i < movingObjs.length; i++) {
            movingObjs[i].y += height;
        }
        this.onReelHeigtChange(height);
        if (!this.bResizing) {
            if (this.symbols.length > this.nCount + 1) {
                const delCnt = this.symbols.length - (this.nCount + 1);
                for (let i = 0; i < delCnt; i++) {
                    const item = this.symbols.pop();
                    this.destroySymbol(item);
                }
            }
        }
    }

    protected getResizeHeightObjs() {
        const objs: any[] = [];
        const mask = find("mask", this.node);
        if (mask) objs.push(mask);
        const bg = find("reels_bg/reel_bg" + (this.reelIdx + 1), this.node.parent.parent);
        if (bg) objs.push(bg);
        return objs;
    }

    protected getResizeMoveingObjs() {
        const objs: any[] = [];
        const frameTop = find(`reels_frame/reel${this.reelIdx + 1}/frame1`, this.node.parent.parent);
        if (frameTop) objs.push(frameTop);
        return objs;
    }

    backup() {
        this.backupDatas = [];
        for (let i = 0; i < this.symbols.length; i++) {
            const tData = this.symbols[i].backup();
            this.backupDatas.push(tData);
        }
    }

    resume() {
        if (!this.backupDatas) return;
        for (let i = 0; i < this.symbols.length; i++) {
            const tData = this.backupDatas[i];
            this.symbols[i].resume(tData);
        }
        this.backupDatas = null;
    }

    getTimeScale() {
        const slots = this.sloteGameDataScript.getSlotsScript();
        return slots.getTimeScale();
    }

    protected destroySymbol(item: any) {
        item.setAnimationToTop(false);
        item.showKuang(false);
        item.node.destroy();
    }

    update(dt: number) {
        if (this.bMoving) {
            this.updatePosition(dt);
        }
        if (this.bResizing) {
            this.updateSize(dt);
        }
    }
}