import { _decorator, Node, Component, find, Vec3, tween, Tween, UIOpacity, Sprite, UITransform, Vec2, sp, color } from 'cc';
import { App } from 'db://assets/scripts/App';
import { ImageSwithComponent } from 'db://assets/scripts/component/ImageSwithComponent';
import { SlotGameBaseData } from 'db://assets/scripts/game/slotgame/SlotGameBaseData';
const { ccclass } = _decorator;

@ccclass('ThePandaFreeGame')
export class ThePandaFreeGame extends Component {
    private nextStep: (() => void) | null = null;
    private maxBetEnterBonus = 13;
    private isReConnect = false;

    private startSpine: Node | null = null;
    private pressStartSpine: Node | null = null;
    private collectSpine: Node | null = null;
    private collectResultSp: Node | null = null;
    private pressNode: Node | null = null;
    private pressShow: boolean = false;

    private slotGameData: SlotGameBaseData = null;
    private symbolScript: any;

    onLoad() {
        this.slotGameData = App.SubGameManager.getSlotGameDataScript();
        if (this.slotGameData) {
            console.log("[ThePandaFreeGame] slotGameData initialized");
            this.slotGameData.getBetIdx();
            console.log("当前押注索引:", this.slotGameData.getBetIdx());
        }
        this.startSpine = find('safe_node/screenspine/startfree', this.node);
        this.pressStartSpine = find('safe_node/freeui/pressstart/sp', this.node);
        this.collectSpine = find('safe_node/freeui/collectsp', this.node);
        this.collectResultSp = find('safe_node/freeui/collectresultsp', this.node);
        this.pressNode = find('safe_node/freeui/pressstart', this.node)
        this.pressNode.on(Node.EventType.TOUCH_END, this.onPressStart, this);
        App.NetManager.on(App.MessageID.SLOT_SUBGAME_DATA, (msg) => {
            this.onRcvSubGameAction(msg);
        });
    }

    onEnable() {
        App.EventUtils.on(App.EventID.SLOT_TOTALBET_UPDATED, this.onChangeBetValue, this);
    }

    onDisable() {
        App.EventUtils.off(App.EventID.SLOT_TOTALBET_UPDATED, this.onChangeBetValue, this);
        App.NetManager.off(App.MessageID.SLOT_SUBGAME_DATA);
    }

    reConnectShowPressStart(delay = 1) {
        this.isReConnect = delay == 1 ? true : false;
        this.scheduleOnce(() => {
            this.pressNode.active = true;
            this.pressStartSpine.setScale(Vec3.ONE);
            this.playSfx('bonus_start');
            this.showFreeGameUI(true);
            if (this.pressStartSpine) {
                this.slotGameData.playSpine(this.pressStartSpine, 'animation1', false, () => {
                    this.pressShow = true;
                    this.slotGameData.playSpine(this.pressStartSpine, 'animation2', true, null);
                });
            }
            if (this.pressNode) {
                this.slotGameData.checkAutoPlay(this.pressNode, () => {
                    if (!this.pressShow)
                        return;
                    this.pressShow = false;
                    this.playSfx('button_start');
                    if (this.pressStartSpine && this.pressNode) {
                        // 停止可能存在的旧 tween，防止重复
                        Tween.stopAllByTarget(this.pressStartSpine);

                        tween(this.pressStartSpine)
                            .to(0.5, { scale: new Vec3(0, 0, 0) }, { easing: 'backInOut' })
                            .call(() => {
                                this.pressNode!.active = false;
                                this.scheduleOnce(() => {
                                    this.sendEnterFreeeGame();
                                }, 0.5);
                            })
                            .start();
                    }
                    else {
                        this.pressNode.active = false;
                        this.scheduleOnce(() => {
                            this.sendEnterFreeeGame();
                        }, 0.5);
                    }
                });
            }
        }, delay)
    }

    playSfx(name: string) {
        App.AudioManager.playSfx("audio/", name);
    }

    async enterFreeGame(symbols: any, isCollectGame: any): Promise<void> {
        return new Promise<void>((success: () => void) => {
            this.nextStep = success;
            this.symbolScript = symbols;
            let select = this.slotGameData.getSelectData();
            if (select.state || isCollectGame) {
                console.log("#####进入免费");
                this.playEnterFreeAni(() => {
                    this.updateFreeGame(true);
                });
                this.scheduleOnce(() => {
                    this.showFreeGameUI(true);
                    if (this.symbolScript) {
                        this.symbolScript.forEach(syb => {
                            syb.enterBonusGame();
                        });
                    }
                }, 0.3);
            } else {
                let bonusdata = this.slotGameData.getBounusData();
                if (bonusdata.state) {
                    let isadd = this.isAddCoin(bonusdata.data);
                    this.updateFreeGame(false, isadd);
                } else {
                    success();
                }
            }
        })
    }

    isAddCoin(data: any) {
        for (let key in data) {
            if (data[key].addpool > 0 || data[key].addcoin > 0) {
                return true;
            }
        }
        return false;
    }

    updateFreeGame(istigger: any, isadd = false) {
        this.scheduleOnce(() => {
            if (this.symbolScript) {
                this.symbolScript.forEach(syb => {
                    syb.moveCoinOrJackpot();
                });
            }
        }, 0.5);
        if (istigger) {
            this.reConnectShowPressStart(3);
        } else {
            let delay = isadd ? 3 : 0.5;
            this.scheduleOnce(() => {
                if (this.nextStep) {
                    this.nextStep();
                    this.nextStep = null
                }
            }, delay);
        }
    }

    freeGameOver(symbols: any) {
        const timesNode = find("safe_node/slots/descui/freetimes", this.node);
        if (timesNode) {
            // 使用 UIOpacity 组件作为 tween 目标，并停止可能存在的 tween，保证不会有冲突
            let uiOpacity = timesNode.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = timesNode.addComponent(UIOpacity);
                uiOpacity.opacity = 255;
            }
            // 停掉可能存在的 tween，保证不会有冲突（针对组件）
            Tween.stopAllByTarget(uiOpacity);

            // 使用 UIOpacity 组件作为 tween 的目标，以便对 opacity 做动画
            tween(uiOpacity)
                .to(1, { opacity: 0 })
                .call(() => {
                    // 恢复并隐藏节点
                    uiOpacity!.opacity = 255;
                    timesNode.active = false;
                    const puzzle = find("Canvas/safe_node/LMSlots_Collect_Puzzle");
                    if (puzzle) puzzle.active = true;
                })
                .start();
        }

        this.playCollectCoin(symbols);
    }

    playEnterFreeAni(callback: any) {
        this.playSfx('bonus_transiton');
        this.slotGameData.playSpine(this.startSpine, 'animation', false, () => {
            if (callback) {
                callback();
            }
        });
    }

    onPressStart() {
        if (!this.pressShow)
            return;
        this.pressShow = false;
        Tween.stopAllByTarget(this.pressStartSpine);
        this.playSfx('button_start');
        if (this.pressStartSpine && this.pressNode) {
            tween(this.pressStartSpine)
                .to(0.5, { scale: new Vec3(0, 0, 0) }, { easing: 'backInOut' })
                .call(() => {
                    this.pressNode!.active = false;
                    this.scheduleOnce(() => {
                        this.sendEnterFreeeGame();
                    }, 0.5);
                })
                .start();
        } else {
            if (this.pressNode) this.pressNode.active = false;
            this.scheduleOnce(() => this.sendEnterFreeeGame(), 0.5);
        }
    }

    showFreeGameUI(isshow: any, count = 3) {
        if (isshow) {
            App.AudioManager.playBGM('audio/bonus_bgm')
        } else {
            App.AudioManager.stopBGM();
        }
        this.changeBg(isshow);
        find("safe_node/slots/descui/desc1", this.node).active = !isshow;
        find("safe_node/slots/descui/freetimes", this.node).active = isshow;
        this.updateFreetimes(count, true);
    }
    updateFreetimes(count: any, isinit = false) {

    let atlas = this.slotGameData.getAtlasByName("base");
    console.log("atlas =", atlas);

    let spr = find("safe_node/slots/descui/freetimes/freecount", this.node);
    console.log("spr =", spr);

    if (!atlas) {
        console.error("图集 base 未找到！");
        return;
    }

    if (!spr) {
        console.error("freecount 节点未找到！");
        return;
    }

    let frameName = "theme132_cnt" + count;
    let frame = atlas.getSpriteFrame(frameName);
    console.log("frame =", frameName, frame);

    if (!frame) {
        console.error("帧未找到！请确认图集里是否存在：", frameName);
        return;
    }

    spr.getComponent(Sprite).spriteFrame = frame;

    if (count == 3 && !isinit) {
        let respin = find("safe_node/slots/descui/freetimes/respin", this.node);
        respin.active = true;
        this.slotGameData.playSpine(respin, 'animation', false, null);
    }
}


    // updateFreetimes(count: any, isinit = false) {
    //     let atlas = this.slotGameData.getAtlasByName("base");
    //     let spr = find("safe_node/slots/descui/freetimes/freecount", this.node);
    //     spr.getComponent(Sprite).spriteFrame = atlas.getSpriteFrame("theme132_cnt" + count);
    //     if (count == 3 && !isinit) {
    //         let respin = find("safe_node/slots/descui/freetimes/respin", this.node);
    //         respin.active = true;
    //         this.slotGameData.playSpine(respin, 'animation', false, null);
    //     }
    // }

    async playCollectCoin(symbols: any[]): Promise<void> {
        if (!symbols || symbols.length === 0) return;

        this.collectSpine!.active = true;
        let curtotal = 0;

        const safenode = find('safe_node', this.node)!;
        const winnode = this.slotGameData.getBottomScript().getWinLabelNor();
        const worldPos = winnode.getWorldPosition(new Vec3());
        const localPos = safenode.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
        this.collectResultSp!.setPosition(localPos);

        for (let i = 0; i < symbols.length; i++) {
            const symbolnode: Node = symbols[i].node;
            const symboldata = this.getBonusDataByindex(i + 1);
            if (!symboldata) {
                // 没数据，跳过
                await this.wait(0);
                continue;
            }

            // pool (jackpot)
            if (symboldata.pool > 0) {
                const topbag = find('topbag', symbolnode);
                if (topbag && topbag.active) {
                    const tobgnode = find('topbag/spine', symbolnode);
                    this.slotGameData.playSpine(tobgnode, 'animation', false, null);

                    const jackpotcoin = this.slotGameData.getPoolbyType(symboldata.pool);
                    curtotal += Number(jackpotcoin);

                    await this.wait(500);
                    this.collectChangeFrameColor(topbag);
                    this.showJackpotCollectUI(symboldata.pool, jackpotcoin);

                    await this.wait(6000);
                    const bottomScript = this.slotGameData.getBottomScript();
                    if (bottomScript.setWin) bottomScript.setWin(curtotal);
                    else if (bottomScript.setWin) bottomScript.setWin(curtotal);

                    this.slotGameData.clearBonusDataPool(i + 1);
                    continue;
                } else {
                    // not active, skip immediately
                    continue;
                }
            }

            // coin
            if (symboldata.coin > 0) {
                const bottombg = find('bottombg', symbolnode);
                if (bottombg?.active) {
                    const bbgnode = find('bottombg/spine', symbolnode)!;
                    this.slotGameData.playSpine(bbgnode, 'animation', false, null);

                    const startWorld = bbgnode.getWorldPosition(new Vec3());
                    const endWorld = winnode.getWorldPosition(new Vec3());
                    const startPos = safenode.getComponent(UITransform)!.convertToNodeSpaceAR(startWorld);
                    const endPos = safenode.getComponent(UITransform)!.convertToNodeSpaceAR(endWorld);

                    const collectSpineNode = this.collectSpine!;
                    const spineComp = collectSpineNode.getComponent(sp.Skeleton);
                    if (spineComp) spineComp.setAnimation(0, 'animation', false);

                    const v = new Vec2(endPos.x - startPos.x, endPos.y - startPos.y);
                    const length = v.length();

                    // scale, rotation, position
                    collectSpineNode.setScale(length / 460, length / 460);
                    const angleRad = v.signAngle(new Vec2(1, 0));
                    const angleDeg = -angleRad * (180 / Math.PI) + 90;
                    collectSpineNode.eulerAngles = new Vec3(0, 0, angleDeg);
                    collectSpineNode.setPosition(startPos);

                    curtotal += symboldata.coin;
                    this.playSfx('bonus_hit');
                    this.collectChangeFrameColor(bottombg);

                    await this.wait(500);
                    this.collectResultSp!.active = true;
                    const resultSpine = this.collectResultSp!.getComponent(sp.Skeleton);
                    if (resultSpine) resultSpine.setAnimation(0, 'animation', false);

                    const bottomScript = this.slotGameData.getBottomScript();
                    if (bottomScript.setWin) bottomScript.setWin(curtotal);
                    else if (bottomScript.setWin) bottomScript.setWin(curtotal);
                }

                // 等待一段时间再处理下一个符号，保持节奏
                await this.wait(1000);
                continue;
            }

            // 无 pool / coin 情况，直接继续
        }

        // 收集完成后的收尾逻辑（保留原有延迟）
        console.log('###退出收集');
        this.scheduleOnce(() => {
            this.playEnterFreeAni(() => {
                const bottomScript = this.slotGameData.getBottomScript();
                if (bottomScript.setWin) bottomScript.setWin(0);
                else if (bottomScript.setWin) bottomScript.setWin(0);
                this.collectOverHandle();
            });
            this.scheduleOnce(() => {
                this.slotGameData.getSlotsScript().resetEnterFreeCards();
                this.showFreeGameUI(false);
            }, 0.5);
        }, 1);
    }

    private wait(ms: number) {
        return new Promise(resolve => this.scheduleOnce(() => resolve(undefined), ms / 1000));
    }

    showJackpotCollectUI(pool: any, jackpotcoin: any) {
        const jackpotui = find('safe_node/freeui/jackpotui', this.node);
        if (!jackpotui) return;

        const mainnode = find('mainnode', jackpotui)!;
        const framenode = find('framebg', mainnode)!;
        const descnode = find('bottomdesc', mainnode)!;
        let headnode: Node | null = null;
        for (let i = 1; i < 5; i++) {
            const hn = find('head' + i, mainnode);
            if (pool == i) {
                headnode = hn;
                if (headnode) headnode.active = true;
            } else {
                if (hn) hn.active = false;
            }
        }

        const atlas = this.slotGameData.getAtlasByName('dialog1');
        const spr = find('bg', mainnode)!;
        const spname = this.getJackputUIBgSpritename(pool);
        spr.getComponent(Sprite).spriteFrame = atlas.getSpriteFrame(spname);

        jackpotui.active = true;

        // 初始缩放
        mainnode.setScale(Vec3.ZERO);
        if (descnode) descnode.setScale(Vec3.ZERO);
        if (headnode) headnode.setScale(Vec3.ZERO);
        if (framenode) framenode.setScale(Vec3.ZERO);

        this.playSfx('bonus_collect');

        Tween.stopAllByTarget(mainnode);
        tween(mainnode)
            .to(0.4, { scale: Vec3.ONE }, { easing: 'backInOut' })
            .call(() => {
                if (headnode) {
                    Tween.stopAllByTarget(headnode);
                    tween(headnode).to(0.3, { scale: Vec3.ONE }, { easing: 'backInOut' }).start();
                }
                if (framenode) {
                    tween(framenode)
                        .to(0.6, { scale: Vec3.ONE }, { easing: 'backInOut' })
                        .call(() => {
                            const lblcoin = find('mainnode/framebg/totalnum', jackpotui);
                            App.AnimationUtils.doRoallNumEff(lblcoin, 0, jackpotcoin, 1, () => {
                                this.playSfx('bonus_end');
                            }, null, 0, true);
                        })
                        .start();
                }
                if (descnode) {
                    tween(descnode).to(0.3, { scale: Vec3.ONE }, { easing: 'backInOut' }).start();
                }
            })
            .start();

        // 自动隐藏
        this.scheduleOnce(() => {
            Tween.stopAllByTarget(mainnode);
            tween(mainnode)
                .to(0.5, { scale: Vec3.ZERO })
                .call(() => {
                    jackpotui.active = false;
                })
                .start();
        }, 5);
    }

    getJackputUIBgSpritename(pool: any) {
        switch (pool) {
            case 1: return 'theme132_dialog_bg4';
            case 2: return 'theme132_dialog_bg3';
            case 3: return 'theme132_dialog_bg4';
            case 4: return 'theme132_dialog_bg1';
        }
    }

    collectChangeFrameColor(bgnode: any) {
        bgnode.color = color(64, 91, 255);
    }

    collectOverHandle() {
        this.slotGameData.getSlotsScript().freeOverHideObj();
        this.slotGameData.clearBonusState();
    }

    getBonusDataByindex(index: any) {
        let bonusdata = this.slotGameData.getBounusData().data;
        for (let key in bonusdata) {
            if (bonusdata[key].idx == index) {
                return bonusdata[key];
            }
        }
        return null;
    }

    getRotationAngle(pos: any) {
        switch (pos) {
            case 1: return -12;
            case 7: return -18;
            case 13: return -35;
            case 2: return -2;
            case 8: return -2;
            case 14: return -3;
            case 3: return -20;
            case 4: return -10;
            case 10: return -35;
            case 5: return 5;
            case 12: return 10;
            case 6: return -33;
            case 9: return 15;
            case 11: return -15;
        }
        return 0;
    }

    changeLightAngleAndScale(startNode: Node, endNode: Node, signAngleStandard: Vec2, dir: number, offsetAngle: number, size: number) {
        const startWorld = startNode.getWorldPosition(new Vec3());
        const endWorld = endNode.getWorldPosition(new Vec3());

        const dx = endWorld.x - startWorld.x;
        const dy = endWorld.y - startWorld.y;

        const dPos = new Vec2(dx, dy);
        const standard = signAngleStandard ?? new Vec2(0, 1); // 默认以 Y 轴为参照
        const angle = dPos.signAngle(standard);
        const degree = angle * 180 / Math.PI;

        startNode.angle = degree * dir + offsetAngle;

        const dis = dPos.length();
        startNode.setScale(dis / size, dis / size, 1);
    }


    onChangeBetValue(data: any) {
        let descnode = find("safe_node/slots/descui/desc1", this.node);

        if (!this.slotGameData) {
            console.warn('[ThePandaFreeGame] slotGameData not ready');
            return;
        }
        if (!descnode.active)
            return;
        let changespine = find("safe_node/slots/descui/desc1/changespine", this.node)
        let betIdx = this.slotGameData.getBetIdx();
        let atlas = this.slotGameData.getAtlasByName("base");
        let spr = find('num', descnode);
        if (betIdx < this.maxBetEnterBonus) {
            if (this.slotGameData.getNeedBonusIconNum() != 6) {
                this.playSfx('board_change');
                this.slotGameData.playSpine(changespine, 'animation', false, null);
                this.slotGameData.setBonusIconNum(6);
                spr.getComponent(Sprite).spriteFrame = atlas.getSpriteFrame("theme132_tip2");
            }
        } else {
            if (this.slotGameData.getNeedBonusIconNum() != 5) {
                this.playSfx('board_change');
                this.slotGameData.playSpine(changespine, 'animation', false, null);
                this.slotGameData.setBonusIconNum(5);
                spr.getComponent(Sprite).spriteFrame = atlas.getSpriteFrame("theme132_tip1");
            }
        }
    }

    changeBg(isfree: any) {
        let bgCmp = find('safe_node/bg', this.node).getComponent(ImageSwithComponent);
        if (isfree) {
            bgCmp.setIndex(1);
        } else {
            bgCmp.setIndex(0);
        }
    }

    sendEnterFreeeGame() {
        let req = { c: App.MessageID.SLOT_SUBGAME_DATA } as any;
        req.data = {} as any;
        req.data.rtype = 1
        req.gameid = this.slotGameData.getGameId()
        App.NetManager.send(req, true);
    }

    onRcvSubGameAction(msg: any) {
        if (msg.code == 200) {
            if (msg.data.rtype == 20) {
            } else if (msg.data.rtype == 1) {
                if (this.slotGameData.getCollectGame() as any && msg.data.chipGame == null) {
                    this.slotGameData.getBottomScript().sendSpinReq();
                    this.slotGameData.setCollectGame(false)
                    return
                }
                let selectdata = this.slotGameData.getSelectData();
                if (this.isReConnect && selectdata.state) {
                    this.slotGameData.getSlotsScript().autoStartSpin();
                    this.isReConnect = false;
                } else {
                    if (this.nextStep) {
                        this.nextStep();
                        this.nextStep = null
                    }
                }
            }
        }
    }

}
