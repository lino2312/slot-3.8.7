import { _decorator, Component, Node, find, director, SpriteFrame, Sprite, Label, ProgressBar, UITransform } from 'cc';
import { UserData } from '../data/UserData';
import { App } from '../App';
const { ccclass, property } = _decorator;

const Global: any = (window as any).Global || (globalThis as any).Global;

@ccclass('Vip')
export class Vip extends Component {
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
        // 优先使用 UserData.svip，其次使用 Global.getVipUsers.vipLevel
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
            // firstRecharge > 0 → 首充已用完 → 直接跳转充值页面
            // firstRecharge = 0 → 首充还有 → 显示首充活动页面
            const firstRecharge = App.userData().userInfo?.firstRecharge;
            if (firstRecharge && firstRecharge > 0) {
                App.PopUpManager.addPopup('prefabs/popup/popupRecharge', 'hall', null, false);
            } else {
                App.PopUpManager.addPopup('prefabs/popup/popupFirstRecharge', 'hall', null, true);
            }
        }, this);

        this.sendPost("GetVipUserLevelDetail", {})
            .then((response) => {
                if (response.code === 0 && response.msg === "Succeed") {
                    this.datas1 = response;
                    // 确保 index 设置为用户当前 VIP 等级
                    const userLevel = UserData.svip ?? Global?.getVipUsers?.vipLevel ?? 0;
                    this.index = userLevel;
                    console.log('VIP API response - setting index to userLevel:', userLevel);
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
        if (this.index === 0) {
            // VIP0 没有奖励数据，清空 datas3
            this.datas3 = null;
            return;
        }

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
        App.PopUpManager.addPopup('prefabs/popup/popupContactUs', 'hall', null, true);
    }

    Tip() {
        App.PopUpManager.addPopup('prefabs/popup/popupVIPhelp', 'hall', null, true);
    }

    updateViewWithAPI() {
        // keep behaviour similar to original; use defensive checks
        if (!this.panel) return;

        // VIP0 没有奖励可领取，隐藏所有 claim 相关按钮
        if (this.index === 0) {
            for (let i = 0; i < 3; i++) {
                const basePath = `vip_info/btn${3 - i}`;
                const claimNode = find(`${basePath}/claim`, this.panel);
                const redNode = find(`${basePath}/red`, this.panel);
                const weilinqu = find(`${basePath}/weilinqu`, this.panel);
                const okIcon = find(`${basePath}/icon_ok_3`, this.panel);
                const endTNode = find(`${basePath}/endT`, this.panel);
                const iconNode = find(`${basePath}/jinli_icon01`, this.panel);
                if (claimNode) claimNode.active = false;
                if (redNode) redNode.active = false;
                if (weilinqu) weilinqu.active = false;
                if (okIcon) okIcon.active = false;
                if (endTNode) endTNode.active = false;
                if (iconNode) iconNode.active = true;
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

                        if (this.index === userVipLevel) { // CURRENT VIP LEVEL
                            const btnInd = 3 - i;
                            if (status !== 1) {
                                if (claimNode) claimNode.active = false;
                                if (redNode) redNode.active = false;
                                if (weilinqu) weilinqu.active = false;
                            }
                        }

                        if (iconNode) {
                            iconNode.active = status != 2;
                            if (okIcon) {
                                okIcon.active = status === 2;
                            }
                        }

                        if (claimNode) claimNode.active = status === 1;
                        if (redNode) redNode.active = status === 1;
                        if (weilinqu) weilinqu.active = status === 1;
                        if (okIcon) okIcon.active = status === 2;

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

        // VIP0 隐藏所有 claim 相关按钮
        if (this.index === 0) {
            for (let i = 0; i < 3; i++) {
                const basePath = `vip_info/btn${3 - i}`;
                const claimNode = find(`${basePath}/claim`, this.panel);
                const redNode = find(`${basePath}/red`, this.panel);
                const weilinqu = find(`${basePath}/weilinqu`, this.panel);
                const okIcon = find(`${basePath}/icon_ok_3`, this.panel);
                const endTNode = find(`${basePath}/endT`, this.panel);
                const iconNode = find(`${basePath}/jinli_icon01`, this.panel);
                if (claimNode) claimNode.active = false;
                if (redNode) redNode.active = false;
                if (weilinqu) weilinqu.active = false;
                if (okIcon) okIcon.active = false;
                if (endTNode) endTNode.active = false;
                if (iconNode) iconNode.active = true;
            }
        }

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
                const pExp = Math.min(currentExp / upgradeExp, 1);
                const pNode = find('layout/progress', this.panel);
                if (pNode) {
                    pNode.active = true;
                    const progressBar = pNode.getComponent(ProgressBar);
                    if (progressBar) {
                        // 获取进度条背景的实际宽度，修复 totalLength 不匹配问题
                        const bgTransform = pNode.getComponent(UITransform);
                        const bgWidth = bgTransform?.width || progressBar.totalLength;
                        progressBar.totalLength = bgWidth;
                        progressBar.progress = pExp;
                    }
                }
                const pLabel = find('layout/progress/label', this.panel)?.getComponent(Label);
                if (pLabel) pLabel.string = `${this.datas1?.data?.[config]?.currentExp ?? 0}/${this.datas1?.data?.[config]?.upgrade ?? 0}`;

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

    clickRewards1() {
        if (this.index === 0) return
        const cr = this.datas3
        if (cr.data[0]?.rewardType === 1) {
            if (cr.data[0]?.status === 1) {
                this.clickItem = find("vip_info/btn3", this.panel)
                // log("data.type: ===================================================", data.type)
                // vv.NetManager.send({ c: MsgId.REQ_OPEN_GIFT, type:data.type, vip:this.index});//type-1:签到 2:weeklybonus 3:monthlybonus 4:levelbonus
                let url4 = "AddReceiveAward"
                var self = this;

                App.HttpUtils.sendPostRequest(url4, { VipLevel: this.index, ReceiveId: this.datas3.data[0].id, RewardType: 1 }, (error: any, response: any) => {
                    if (error) {
                        console.error(error);
                    } else {
                        if (response.code == 0 && response.msg == "Succeed") {
                            App.AlertManager.showFloatTip("Claimed!");
                            cr.data[0].status = 2
                            this.API1();
                            this.API();
                            this.updateViewWithAPI();
                        } else {
                            App.AlertManager.showFloatTip(response.msg)
                        }
                    }
                });
            } else if (cr.data[1].status === 2) {
                App.AlertManager.showFloatTip("Already Claimed!");
            } else {
                App.AlertManager.showFloatTip("No Rewards to be claimed!");
            }
        }
    }
    clickRewards2() {
        if (this.index === 0) return
        const cr = this.datas3;
        if (cr.data[1].rewardType === 2) {
            if (cr.data[1].status === 1) {
                this.clickItem = find("vip_info/btn2", this.panel)
                // log("data.type: ===================================================", data.type)
                // vv.NetManager.send({ c: MsgId.REQ_OPEN_GIFT, type:data.type, vip:this.index});//type-1:签到 2:weeklybonus 3:monthlybonus 4:levelbonus
                let url4 = "AddReceiveAward"
                App.HttpUtils.sendPostRequest(url4, { VipLevel: this.index, ReceiveId: this.datas3.data[1].id, RewardType: 2 }, (error: any, response: any) => {
                    if (error) {
                        console.error(error);
                    } else {
                        if (response.code == 0 && response.msg == "Succeed") {
                            App.AlertManager.showFloatTip("Claimed!");
                            cr.data[1].status = 2
                            this.API1();
                            this.API();
                            this.updateViewWithAPI();
                        } else {
                            App.AlertManager.showFloatTip(response.msg);
                        }
                    }
                });
            } else if (cr.data[1].status === 2) {
                App.AlertManager.showFloatTip("Already Claimed!");
            } else {
                App.AlertManager.showFloatTip("No Rewards to be claimed!");
            }
        }
    }
    clickRewards3() {
        if (this.index === 0) return
        const cr = this.datas3;
        if (cr.data[2].rewardType === 3) {
            if (cr.data[2].status === 1) {
                this.clickItem = find("vip_info/btn1", this.panel)
                // log("data.type: ===================================================", data.type)
                // vv.NetManager.send({ c: MsgId.REQ_OPEN_GIFT, type:data.type, vip:this.index});//type-1:签到 2:weeklybonus 3:monthlybonus 4:levelbonus
                let url4 = "AddReceiveAward"
                App.HttpUtils.sendPostRequest(url4, { VipLevel: this.index, ReceiveId: this.datas3.data[2].id, RewardType: 3 }, (error: any, response: any) => {
                    if (error) {
                        console.error(error);
                    } else {
                        if (response.code == 0 && response.msg == "Succeed") {
                            App.AlertManager.showFloatTip("Claimed!");
                            cr.data[2].status = 2
                            this.API1();
                            this.API();
                            this.updateViewWithAPI();
                        } else {
                            App.AlertManager.showFloatTip(response.msg);
                        }
                    }
                });
            } else if (cr.data[2].status === 2) {
                App.AlertManager.showFloatTip("Already Claimed!");
                // vv.AlertView.showTips("Already Claimed!");
            } else {
                App.AlertManager.showFloatTip("No Rewards to be claimed!");
                // vv.AlertView.showTips("No Rewards to be claimed!");
            }
        }
    }
}
