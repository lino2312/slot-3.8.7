import { _decorator, Component, director, find, Label, Node, ProgressBar, Sprite, SpriteFrame } from 'cc';
import { App } from '../App';
import { UserData } from '../data/UserData';
const { ccclass, property } = _decorator;

const Global: any = (window as any).Global || (globalThis as any).Global;

@ccclass('PopupVIP')
export class PopupVIP extends Component {
    panel: Node | null = null;
    index: number = 0;
    datas: any = null;
    datas1: any = null;
    datas3: any = null;
    clickItem: Node | null = null;

    onLoad() {
        // try {
        //     Global?.FixDesignScale_V?.(this.node);
        // } catch (e) { /* ignore */ }

        this.panel = find('ui', this.node) as Node;
        App.ApiManager.getVipUsers().then((ret => {
            console.log("ret =", ret);
            this.index = ret.vipLevel
            App.userData().svip = ret.vipLevel;
            App.EventUtils.dispatchEvent("vipData");
        }));
        const btnLeft = find('btn_left', this.panel as Node);
        if (btnLeft) {
            btnLeft.active = true;
            App.ComponentUtils.onClick(btnLeft, () => {
                if (this.index === 0) {
                    this.index = (this.datas1?.data?.length) || 0;
                } else {
                    this.index--;
                }
                this.API1();
                this.API();
            }, this);
        }

        const btnRight = find('btn_right', this.panel as Node);
        if (btnRight) {
            btnRight.active = true;
            App.ComponentUtils.onClick(btnRight, () => {
                if (this.index === (this.datas1?.data?.length || 0)) {
                    this.index = 0;
                } else {
                    this.index++;
                }
                this.API1();
                this.API();
            }, this);
        }

        App.ComponentUtils.onClick(find('vip_info/btn1', this.panel as Node) as Node, () => this.clickRewards3(), this);
        App.ComponentUtils.onClick(find('vip_info/btn2', this.panel as Node) as Node, () => this.clickRewards2(), this);
        App.ComponentUtils.onClick(find('vip_info/btn3', this.panel as Node) as Node, () => this.clickRewards1(), this);

        App.ComponentUtils.onClick(find('btn_buy', this.panel as Node) as Node, () => {
            App.AlertManager.showFloatTip('Navigating to the lobby...');
            director.loadScene('Hall', () => {
                const lobbyNode = find('Hall/Canvas/bottom/tabbar/hall/select');
                if (lobbyNode) {
                    lobbyNode.active = true;
                } else {
                    App.AlertManager.getCommonAlert().showWithoutCancel("Hall scene Game Tab not found!");
                }
            });
        }, this);

        this.sendPost("GetVipUserLevelDetail", {})
            .then((response) => {
                if (response.code === 0 && response.msg === "Succeed") {
                    this.datas1 = response;
                    this.API1();
                    this.API();
                } else {
                    App.AlertManager.showFloatTip(response.msg || "Failed to load VIP detail");
                }
            })
            .catch((err) => {
                console.error("GetVipUserLevelDetail error", err);
            });
    }

    async API() {
        if (this.index === 0) return;

        try {
            const response = await this.sendPost("GetListVipUserRewards", { VipLevel: this.index });
            if (response.code === 0 && response.msg === "Succeed") {
                this.datas3 = response;
                this.updateViewWithAPI();
            } else {
                App.AlertManager.showFloatTip(response.msg || "Failed to load rewards");
            }
        } catch (err) {
            console.error("GetListVipUserRewards error", err);
        }
    }

    async API1() {
        App.AudioManager.playBtnClick();
        if (this.index === 0) {
            this.updateView();
            return;
        }

        try {
            const response = await this.sendPost("GetListVipLevel", { VipLevel: this.index });
            if (response.code === 0 && response.msg === "Succeed") {
                this.datas = response;
                this.updateView();
            } else {
                App.AlertManager.showFloatTip(response.msg || "Failed to load VIP level");
            }
        } catch (err) {
            console.error("GetListVipLevel error", err);
        }
    }

    private sendPost(url: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                App.HttpUtils.sendPostRequest(url, params, (error: any, response: any) => {
                    if (error) {
                        console.error(`[HTTP ERROR] ${url}:`, error);
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    Service() {
        App.PopUpManager.addPopup('prefabs/popupContactUs', 'hall', null, true);
    }

    Tip() {
        App.PopUpManager.addPopup('prefabs/popupVIPhelp', 'hall', null, true);
    }

    updateViewWithAPI() {
        // keep behaviour similar to original; use defensive checks
        if (!this.panel) return;

        if (this.index === 0 && this.index === 0) {
            for (let i = 0; i < 3; i++) {
                const basePath = `vip_info/btn${3 - i}`;
                const nodeNames = ['weilinqu', 'red', 'claim', 'endT', 'jinli_icon01', 'icon_ok_3'];
                for (const name of nodeNames) {
                    const n = find(`${basePath}/${name}`, this.panel);
                    if (n) n.active = false;
                }
            }
            return;
        }

        const config = this.index;
        const nexconfig = this.index + 1;
        const userVipLevel = UserData.svip ?? 0;

        if (nexconfig) {
            if (config !== (this.datas1?.data?.length ?? 0)) {
                if (this.index !== 0) {
                    for (let i = 0; i < Math.min(3, (this.datas3?.data?.length) || 0); i++) {
                        const basePath = `vip_info/btn${3 - i}`;
                        const claimNode = find(`${basePath}/claim`, this.panel);
                        const redNode = find(`${basePath}/red`, this.panel);
                        const weilinqu = find(`${basePath}/weilinqu`, this.panel);
                        const okIcon = find(`${basePath}/icon_ok_3`, this.panel);
                        const endTNode = find(`${basePath}/endT`, this.panel);
                        const timeLabel = find(`${basePath}/endT/time`, this.panel);
                        const IconTime = find(`${basePath}/endT/daojishi`, this.panel);
                        const iconNode = find(`${basePath}/jinli_icon01`, this.panel);

                        const status = this.datas3?.data?.[i]?.status;

                        if (this.index < userVipLevel) {
                            if (claimNode) claimNode.active = false;
                            if (redNode) redNode.active = false;
                            if (weilinqu) weilinqu.active = false;
                            if (endTNode) endTNode.active = false;
                            if (IconTime) IconTime.active = false;
                            if (iconNode) iconNode.active = true;
                            if (okIcon) okIcon.active = false;
                            const btnInd = 3 - i;
                            if (btnInd === 3) {
                                if (status === 1) {
                                    if (iconNode) iconNode.active = true;
                                    if (okIcon) okIcon.active = false;
                                    if (claimNode) claimNode.active = true;
                                    if (redNode) redNode.active = true;
                                    if (weilinqu) weilinqu.active = true;
                                } else if (status === 2) {
                                    if (iconNode) iconNode.active = false;
                                    if (okIcon) okIcon.active = true;
                                    if (claimNode) claimNode.active = false;
                                    if (redNode) redNode.active = false;
                                    if (weilinqu) weilinqu.active = false;
                                }
                            } else if (btnInd === 2 || btnInd === 1) {
                                if (iconNode) iconNode.active = true;
                                if (okIcon) okIcon.active = false;
                                if (claimNode) claimNode.active = false;
                                if (redNode) redNode.active = false;
                                if (weilinqu) weilinqu.active = false;
                            }
                            continue;
                        }

                        if (this.index > userVipLevel) {
                            if (claimNode) claimNode.active = false;
                            if (redNode) redNode.active = false;
                            if (weilinqu) weilinqu.active = false;
                            if (endTNode) endTNode.active = false;
                            if (IconTime) IconTime.active = false;
                            if (iconNode) iconNode.active = true;
                            if (okIcon) okIcon.active = false;
                            continue;
                        }

                        if (this.index === userVipLevel) {
                            const btnInd = 3 - i;
                            if (status !== 1) {
                                if (claimNode) claimNode.active = false;
                                if (redNode) redNode.active = false;
                                if (weilinqu) weilinqu.active = false;
                            }
                        }

                        if (iconNode) iconNode.active = status !== 2;
                        if (okIcon) okIcon.active = status === 2;

                        if (claimNode) claimNode.active = status === 1;
                        if (redNode) redNode.active = status === 1;
                        if (weilinqu) weilinqu.active = status === 1;

                        if (endTNode) {
                            const showEnd = status === 2 && this.index === userVipLevel;
                            endTNode.active = showEnd;
                            if (showEnd && timeLabel && IconTime) {
                                const btnIndex = 3 - i;
                                if (btnIndex === 3) {
                                    timeLabel.active = false;
                                    IconTime.active = false;
                                } else {
                                    timeLabel.active = true;
                                    let displayTime = '';
                                    if (btnIndex === 1) {
                                        const now = new Date();
                                        const day = now.getDay();
                                        const daysToNextMonday = (8 - day) % 7 || 7;
                                        const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToNextMonday);
                                        nextMonday.setHours(0, 0, 0, 0);
                                        displayTime = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')} 00:00:00`;
                                    } else if (btnIndex === 2) {
                                        const now = new Date();
                                        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                                        nextMonth.setHours(0, 0, 0, 0);
                                        displayTime = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
                                    }
                                    const lbl = timeLabel.getComponent(Label);
                                    if (lbl) lbl.string = displayTime;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    updateView() {
        if (!this.panel) return;
        const config = this.index;
        const nexconfig = this.index + 1;
        if (nexconfig) {
            if (config !== (this.datas1?.data?.length ?? 0)) {
                const icon = find('layout/icon', this.panel);
                if (icon) icon.setPosition(-330, icon.position?.y || 0);
                const icon2 = find('layout/icon2', this.panel);
                if (icon2) icon2.active = true;
                const amountBar = find('layout/amount_bar', this.panel);
                if (amountBar) amountBar.active = true;

                const vipFramePath1 = `image/VIP/level/${config}/spriteFrame`;
                App.ResUtils.getSpriteFrame(vipFramePath1).then((sf: SpriteFrame) => {
                    const n = find('layout/icon', this.panel);
                    if (n) {
                        const sp = n.getComponent(Sprite);
                        if (sp) sp.spriteFrame = sf;
                    }
                }).catch((err) => {
                    console.warn(`[VIP] Failed to load VIP level icon ${config}`, err);
                });

                const vipFramePath2 = `image/VIP/level/${nexconfig}/spriteFrame`;
                App.ResUtils.getSpriteFrame(vipFramePath2).then((sf: SpriteFrame) => {
                    const n = find('layout/icon2', this.panel);
                    if (n) {
                        const sp = n.getComponent(Sprite);
                        if (sp) sp.spriteFrame = sf;
                    }
                }).catch((err) => {
                    console.warn(`[VIP] Failed to load VIP level icon ${nexconfig}`, err);
                });

                const currentExp = this.datas1?.data?.[config]?.currentExp ?? 0;
                const upgradeExp = this.datas1?.data?.[config]?.upgrade ?? 1;
                // 计算进度，当 currentExp >= upgradeExp 时进度为满
                const pExp = Math.min(currentExp / upgradeExp, 1);
                console.log('PopupVIP Progress - currentExp:', currentExp, 'upgradeExp:', upgradeExp, 'pExp:', pExp);
                const pNode = find('layout/progress', this.panel);
                if (pNode) {
                    pNode.active = true;
                    pNode.getComponent(ProgressBar)!.progress = pExp;
                }
                const pLabel = find('layout/progress/label', this.panel)?.getComponent(Label);
                if (pLabel) pLabel.string = `${currentExp}/${upgradeExp}`;

                let result = (this.datas1?.data?.[config]?.upgrade ?? 0) - (this.datas1?.data?.[config]?.currentExp ?? 0);
                const newLabelNode = find('layout/New Label', this.panel);
                if (newLabelNode) newLabelNode.active = true;
                const levelUpMethod = this.datas1?.data?.[config]?.levelUpMethod;
                const newLabel = newLabelNode?.getComponent(Label);
                if (newLabel) {
                    if (levelUpMethod === 1) newLabel.string = 'You can enjoy VIP privileges with total deposit';
                    else if (levelUpMethod === 2) newLabel.string = 'You can enjoy VIP privileges with total bet';
                    else newLabel.string = 'You can enjoy VIP privileges with total deposit';
                }

                const lbl = find('layout/lbl', this.panel)?.getComponent(Label);
                if (lbl) lbl.string = `${result}`;
                if ((this.datas1?.data?.[config]?.upgrade ?? 0) - (this.datas1?.data?.[config]?.currentExp ?? 0) < 0) {
                    if (lbl) lbl.string = '0';
                }

                // short-form: set some vip info fields
                const safeNum = find('vip_info/Safe/num', this.panel)?.getComponent(Label);
                if (safeNum) safeNum.string = this.index !== 0 ? `${this.datas?.data?.[3]?.rate ?? 0}%` : '0%';
                const rebateNum = find('vip_info/Rebate/num', this.panel)?.getComponent(Label);
                if (rebateNum) rebateNum.string = this.index !== 0 ? `${this.datas?.data?.[4]?.rate ?? 0}%` : '0%';
                const depositNum = find('vip_info/Deposit/num', this.panel)?.getComponent(Label);
                if (depositNum) depositNum.string = this.index !== 0 ? `${this.datas?.data?.[2]?.rate ?? 0}%` : '0%';

                const b1 = find('vip_info/btn1/coin/lbl', this.panel)?.getComponent(Label);
                if (b1) b1.string = this.index !== 0 ? `${this.datas?.data?.[2]?.balance ?? 0}` : '0';
                const b2 = find('vip_info/btn2/coin/lbl', this.panel)?.getComponent(Label);
                if (b2) b2.string = this.index !== 0 ? `${this.datas?.data?.[1]?.balance ?? 0}` : '0';
                const b3 = find('vip_info/btn3/coin/lbl', this.panel)?.getComponent(Label);
                if (b3) b3.string = this.index !== 0 ? `${this.datas?.data?.[0]?.balance ?? 0}` : '0';
            } else {
                const icon = find('layout/icon', this.panel);
                if (icon) icon.setPosition(0, icon.position?.y || 0);
                const icon2 = find('layout/icon2', this.panel);
                if (icon2) icon2.active = false;

                const vipFramePath1 = `image/VIP/level/${config}/spriteFrame`;
                App.ResUtils.getSpriteFrame(vipFramePath1).then((sf: SpriteFrame) => {
                    const n = find('layout/icon', this.panel);
                    if (n) {
                        const sp = n.getComponent(Sprite);
                        if (sp) sp.spriteFrame = sf;
                    }
                }).catch((err) => {
                    console.warn(`[VIP] Failed to load VIP Last level icon ${config}`, err);
                });

                const pNode = find('layout/progress', this.panel);
                if (pNode) pNode.active = false;
                const newLabelNode = find('layout/New Label', this.panel);
                if (newLabelNode) newLabelNode.active = false;
                const lblNode = find('layout/lbl', this.panel);
                if (lblNode) lblNode.active = false;
                const amountBar = find('layout/amount_bar', this.panel);
                if (amountBar) amountBar.active = false;

                const b1 = find('vip_info/btn1/coin/lbl', this.panel)?.getComponent(Label);
                if (b1) b1.string = `${this.datas?.data?.[2]?.balance ?? 0}`;
                const b2 = find('vip_info/btn2/coin/lbl', this.panel)?.getComponent(Label);
                if (b2) b2.string = `${this.datas?.data?.[1]?.balance ?? 0}`;
                const b3 = find('vip_info/btn3/coin/lbl', this.panel)?.getComponent(Label);
                if (b3) b3.string = `${this.datas?.data?.[0]?.balance ?? 0}`;

                const safeNum = find('vip_info/Safe/num', this.panel)?.getComponent(Label);
                if (safeNum) safeNum.string = this.index !== 0 ? `${this.datas?.data?.[3]?.rate ?? 0}%` : '0%';
                const rebateNum = find('vip_info/Rebate/num', this.panel)?.getComponent(Label);
                if (rebateNum) rebateNum.string = this.index !== 0 ? `${this.datas?.data?.[4]?.rate ?? 0}%` : '0%';
                const depositNum = find('vip_info/Deposit/num', this.panel)?.getComponent(Label);
                if (depositNum) depositNum.string = this.index !== 0 ? `${this.datas?.data?.[2]?.rate ?? 0}%` : '0%';

                for (let i = 0; i < Math.min(3, (this.datas3?.data?.length) || 0); i++) {
                    const basePath = `vip_info/btn${3 - i}`;
                    const claimNode = find(`${basePath}/claim`, this.panel);
                    const redNode = find(`${basePath}/red`, this.panel);
                    const weilinqu = find(`${basePath}/weilinqu`, this.panel);
                    const okIcon = find(`${basePath}/icon_ok_3`, this.panel);
                    const endTNode = find(`${basePath}/endT`, this.panel);
                    const timeLabel = find(`${basePath}/endT/time`, this.panel);
                    const IconTime = find(`${basePath}/endT/daojishi`, this.panel);
                    const iconNode = find(`${basePath}/jinli_icon01`, this.panel);
                    if (claimNode) claimNode.active = false;
                    if (redNode) redNode.active = false;
                    if (weilinqu) weilinqu.active = false;
                    if (okIcon) okIcon.active = false;
                    if (endTNode) endTNode.active = false;
                    if (timeLabel) timeLabel.active = false;
                    if (IconTime) IconTime.active = false;
                    if (iconNode) iconNode.active = true;
                }
            }
        }

        this.showBtnState(find('vip_info/btn1', this.panel) as Node);
        this.showBtnState(find('vip_info/btn2', this.panel) as Node);
        this.showBtnState(find('vip_info/btn3', this.panel) as Node);
    }

    showBtnState(btn: Node | null) {
        if (!btn) return;
        const lock = find('lock', btn);
        if (lock) lock.active = ((UserData.svip ?? 0) < this.index);
    }

    async claimReward(idx: number, rewardType: number) {
        if (this.index === 0) return;
        const cr = this.datas3;
        if (!cr || !cr.data || !cr.data[idx]) return;
        const item = cr.data[idx];
        if (item.rewardType !== rewardType) return;
        if (item.status !== 1) {
            App.AlertManager.showFloatTip(item.status === 2 ? 'Already Claimed!' : 'No Rewards to be claimed!');
            return;
        }

        try {
            const res = await this.sendPost('AddReceiveAward', { VipLevel: this.index, ReceiveId: item.id, RewardType: rewardType });
            if (res && res.code === 0) {
                App.AlertManager.showFloatTip('Claimed!');
                item.status = 2;
                await this.API1();
                await this.API();
                this.updateViewWithAPI();
            } else {
                App.AlertManager.showFloatTip(res?.msg || 'Claim failed');
            }
        } catch (e) {
            console.error('claimReward error', e);
        }
    }

    clickRewards1() { this.claimReward(2, 1); }
    clickRewards2() { this.claimReward(1, 2); }
    clickRewards3() { this.claimReward(0, 3); }
}
