import { _decorator, color, find, instantiate, Label, Node, sp, Sprite, tween, Vec3 } from 'cc';
import { App } from 'db://assets/scripts/App';
const { ccclass, property } = _decorator;
import { SlotGameSymbolBase } from 'db://assets/scripts/game/slotgame/SlotGameSymbolBase';

@ccclass('ThePandaSymbol')
export class ThePandaSymbol extends SlotGameSymbolBase {
    @property
    public totalCoin = 0;
    @property
    public pool = 0;
    @property
    public showtype = 0;

    private num: Node | null = null;
    private jackpot: Node | null = null;
    private bottom: Node | null = null;
    private top: Node | null = null;
    private kuangguang: Node | null = null;
    private kuang: Node | null = null;
    private numscalesp: Node | null = null;
    private nummovebtsp: Node | null = null;
    private freeSymbolName: string = '';

    onLoad() {
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        this.num = find('num', this.node);
        this.jackpot = find('getjackpot', this.node);
        this.bottom = find('bottombg', this.node);
        this.top = find('topbag', this.node);
        this.kuangguang = find('kuang_guang', this.node);
        this.kuang = find('kuang', this.node);
        this.numscalesp = find('numscalesp', this.node);
        this.nummovebtsp = find('nummovebtsp', this.node);
        this.freeSymbolName = this.slotGameDataScript.getGameCfg().shadowSymbolNode;
    }

    initShowSymbol(id: any, pool: any, coin: any, selectstate: any) {
        this.id = id;
        this.pool = pool;
        this.showNode = find(this.freeSymbolName, this.node)
        this.playSymbolAni(1);
        if (pool || coin) {
            this.kuang.active = true;
        }
        if (pool) {
            this.resetFrameColor(this.top);
            let jackimg = find('jackpotimg', this.top);
            this.updateJackpotImg(jackimg, 'base', 'theme132_s_top' + (28 + pool));
        }
        if (coin) {
            this.resetFrameColor(this.bottom);
            find('totalnum', this.bottom).getComponent(Label).string = App.MathUtils.convertNumToShort(coin, 1000, 0);
        }
    }

    showRandomSymbol() {
        let cfg = this.slotGameDataScript.getGameCfg();
        let randIdx = App.MathUtils.random(1, cfg.randomSymbols.length);
        this.id = cfg.randomSymbols[randIdx - 1];
        if (cfg.symbol[this.id] && cfg.symbol[this.id].node) {
            this.showNode = find(cfg.symbol[this.id].node, this.node)
            this.playSymbolAni(1);
        }
        else {
            console.log("未找到配置id:" + this.id)
        }
    }

    reverseSymbol(id: any, data: any) {
        this.id = id;
        this.playSymbolAni(3);
        if (this.id == 8) {
            this.showKuang();
            this.scheduleOnce(() => {
                this.showCoinNum(data.addcoin, data.addpool);
            }, 0.2)
        } else {
            this.showtype = 0;
        }
    }

    showCoinNum(addnum: any, pool: any, playsound = true) {
        if (addnum > 0) {
            this.showtype = 1;
            this.totalCoin += addnum;
            if (this.jackpot) this.jackpot.active = false;
            if (this.num) {
                this.num.active = true;
                const label = this.num.getComponent(Label);
                if (label) label.string = App.MathUtils.convertNumToShort(addnum, 1000, 0);
                this.num.setScale(this.num.scale.x, 0, this.num.scale.z ?? 1);
                tween(this.num)
                    .to(0.2, { scale: new Vec3(this.num.scale.x, 1, this.num.scale.z ?? 1) })
                    .start();
            }
        } else if (pool > 0) {
            this.showtype = 2;
            this.pool = pool;
            if (this.num) this.num.active = false;
            if (this.jackpot) {
                this.jackpot.active = true;
                this.updateJackpotImg(this.jackpot, 'symbol', 'theme132_s_' + (28 + pool));
                this.jackpot.setScale(this.jackpot.scale.x, 0, this.jackpot.scale.z ?? 1);
                tween(this.jackpot)
                    .to(0.2, { scale: new Vec3(this.jackpot.scale.x, 1, this.jackpot.scale.z ?? 1) })
                    .start();
            }
        } else {
            if (playsound && this.slotGameDataScript.isFreeGame()) {
                this.playSfx('audio/bonus_land_3');
            }
        }
    }

    playSymbolAni(type: any) {
        if (this.showNode && this.state != type) {
            this.showNode.active = true;
            let ske = this.showNode.getComponent(sp.Skeleton);
            let aniname = this.id == 8 ? 'animationj_' + type : 'animation' + this.id + '_' + type;
            ske.setAnimation(0, aniname, false);
            this.state = type;
        }
    }

    playScatterAnimation(isplay: any) {
        if (this.id != 1) {
            return
        }
        let cfg = this.slotGameDataScript.getGameCfg();
        let wnode = find(cfg.symbol[this.id].win_node, this.node);
        if (isplay) {
            wnode.active = true;
            wnode.getComponent(sp.Skeleton).setAnimation(0, "animation", true);
        } else {
            wnode.active = false;
        }
    }

    spineHideSymbol() {
        let bonusdata = this.slotGameDataScript.getBounusData();
        let selectdata = this.slotGameDataScript.getSelectData();
        if (bonusdata.state || selectdata.state) {
            find('s1', this.node).active = false;
        } else {
            this.hideOtherNode();
        }
        this.playSymbolAni(2);
    }

    hideOtherNode() {
        let children = this.node.children;
        for (let i = 0, count = children.length; i < count; i++) {
            if (children[i].name != 's1')
                children[i].active = false;
        }
        this.clearData();
    }

    enterBonusGame() {
        if (this.id == 8) {
            this.kuang.active = true;
        }
        this.showNode.active = false;
        this.showNode = find(this.freeSymbolName, this.node)
        this.playSymbolAni(1);
    }

    enterCollectGame() {
        this.kuang.active = false;
        this.totalCoin = 0;
        this.showNode = find(this.freeSymbolName, this.node)
        this.showNode.active = true;
    }

    moveCoinOrJackpot() {
        if (this.showtype == 1) {
            this.moveCoinToBottom();
        } else if (this.showtype == 2) {
            this.moveJackpotToTop();
        }
    }

    moveCoinToBottom() {
        if (!this.num || !this.bottom) return;
        const instNode = instantiate(this.num);
        instNode.parent = this.node;
        const label = this.num.getComponent(Label);
        if (label) label.string = '';
        const targetPos = this.bottom.position.clone();

        instNode.setScale(new Vec3(1, 1, 1));
        tween(instNode)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.slotGameDataScript.playSpine(this.numscalesp, 'animation', false, null);
                this.playSfx('audio/bonus_collect');
                this.resetFrameColor(this.bottom);
                tween(instNode)
                    .to(1, { scale: new Vec3(1, 1, 1) }, { easing: 'backInOut' })
                    .call(() => {
                        this.slotGameDataScript.playSpine(this.nummovebtsp, 'animation1', false, null);
                        tween(instNode)
                            .to(1, { position: targetPos, scale: new Vec3(0, 0, 0) }, { easing: 'backInOut' })
                            .call(() => {
                                instNode.destroy();
                                const totalNumNode = find('totalnum', this.bottom);
                                if (totalNumNode) {
                                    const totalLabel = totalNumNode.getComponent(Label);
                                    if (totalLabel) totalLabel.string = App.MathUtils.convertNumToShort(this.totalCoin, 1000, 0);
                                }
                            })
                            .start();
                    })
                    .start();
            })
            .start();
    }

    moveJackpotToTop() {
        if (!this.jackpot || !this.top) return;
        const instNode = instantiate(this.jackpot);
        instNode.parent = this.node;
        this.jackpot.active = false;
        const targetPos = this.top.position.clone();

        instNode.setScale(new Vec3(1, 1, 1));
        tween(instNode)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.slotGameDataScript.playSpine(this.numscalesp, 'animation', false, null);
                this.playSfx('bonus_collect');
                this.resetFrameColor(this.top);
                tween(instNode)
                    .to(1, { scale: new Vec3(1, 1, 1) }, { easing: 'backInOut' })
                    .call(() => {
                        this.slotGameDataScript.playSpine(this.nummovebtsp, 'animation2', false, null);
                        tween(instNode)
                            .to(1, { position: targetPos, scale: new Vec3(0, 0, 0) }, { easing: 'backInOut' })
                            .call(() => {
                                instNode.destroy();
                                const jackImg = find('jackpotimg', this.top);
                                if (jackImg) {
                                    jackImg.active = true;
                                    this.updateJackpotImg(jackImg, 'base', 'theme132_s_top' + (28 + this.pool));
                                }
                            })
                            .start();
                    })
                    .start();
            })
            .start();
    }

    updateJackpotImg(spimg: any, atlasname: any, spname: any) {
        let atlas = this.slotGameDataScript.GetAtlasByName(atlasname)
        spimg.getComponent(Sprite).spriteFrame = atlas.getSpriteFrame(spname);
    }

    coinSpeedLightShow(isshow: any) {
        let lightnode = find('speedlight', this.node);
        lightnode.active = isshow;
        if (isshow) {
            this.slotGameDataScript.playSpine(lightnode, 'animation', false, null);
            App.AnimationUtils.shakeNode(this.node, 3, 1, this.node.position);
            this.playSfx('bonus_notify');
        }
    }

    clearData() {
        find('totalnum', this.bottom).getComponent(Label).string = '';
        find('jackpotimg', this.top).active = false;
    }

    hideFreeObject() {
        this.bottom.active = false;
        this.top.active = false;
        this.num.active = true;
        if (this.showNode.name != 's1') {
            this.showNode.active = false;
            this.showNode = find('s1', this.node);
            this.playSymbolAni(1);
        }
    }

    showKuang() {
        let bonusdata = this.slotGameDataScript.getBounusData();
        if (!this.kuang.active && bonusdata.state) {
            this.kuang.active = true;
            this.kuangguang.active = true;
            this.slotGameDataScript.playSpine(this.kuangguang, 'animation1', true, null);
        }
    }

    newCoinShowKuang() {
        if (!this.kuangguang.active)
            return;
        this.slotGameDataScript.playSpine(this.kuangguang, 'animation2', false, () => {
            this.kuangguang.active = false;
        });
    }

    resetEnterFreeSymbol(id: any, data: any) {
        find('s2', this.node).active = false;
        this.id = id;
        this.showNode = find('s1', this.node)
        this.playSymbolAni(1);
        this.bottom.active = false;
        this.top.active = false;
        this.showCoinNum(data.coin, data.pool, false);
        this.totalCoin = 0;
        this.kuang.active = false;
    }

    resetFrameColor(bgnode: any) {
        bgnode.active = true;
        bgnode.color = color(255, 255, 255);
    }

}
