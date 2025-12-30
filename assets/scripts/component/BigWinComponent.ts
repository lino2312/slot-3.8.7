import { _decorator, Component, find, instantiate, isValid, Label, Node, ParticleSystem, sp, Tween, tween, Vec3 } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
import { DropCoins } from '../game/slotgame/DropCoins';
const { ccclass, property } = _decorator;

@ccclass('BigWinComponent')
export class BigWinComponent extends Component {

    private isShow: boolean = false;
    private isWaitCloseFreeBalance: boolean = false;    // 是否有免费游戏结算面板 如果有等结算面板关闭才显示
    private isDelay = false; // 是否延迟显示
    private isHideBigwin = false; // 是否正在隐藏bigwin
    private spEffect: number = 0; // bigwin特效等级
    private soundEffName: string = ""; // bigwin声音名称
    private bigWinNode: Node = null;
    private processStage: string = ""; // bigwin显示阶段
    private isInit: boolean = false; // 是否初始化过
    private winNum: number = 0; // 赢取的金币数
    private bigWinPlayEndCall: Function = null; // bigwin播放结束回调



    onLoad() {
        this.regsterEvent();
    }

    start() {

    }

    update(deltaTime: number) {

    }

    protected onDestroy(): void {
        App.EventUtils.offTarget(this);
    }

    regsterEvent() {
        App.EventUtils.on(App.EventID.SLOT_STOP_MOVE, this.stopMove, this);
        App.EventUtils.on(App.EventID.SLOT_GAME_START, this.recvGameStart, this);
        App.EventUtils.on(App.EventID.HIDE_BIG_WIN, this.hideBigWin, this);
        App.EventUtils.on(App.EventID.SLOT_DELAY_PLAY_WIN_EFFECT, this.recvDelayPlayWinEffect, this);
        App.EventUtils.on(App.EventID.SLOT_DELAY_PLAY_BIGWIN_EFFECT, this.recvDelayPlayWinEffect, this);
        App.EventUtils.on(App.EventID.CALL_BIGWIN_EFFECT, this.callPlayBigWinEffect, this);
        App.EventUtils.on(App.EventID.SLOT_CLOSE_FREE_BALANCE, this.onRecvCloseFreeBalance, this);
    }

    onRecvCloseFreeBalance() {
        this.isWaitCloseFreeBalance = false;
        if (this.isShow) {
            this.playEffect();
            this.isShow = false;
        }
    }

    recvDelayPlayWinEffect(data) {
        this.isDelay = data.detail;

        if (!this.isDelay && this.isShow && !this.isWaitCloseFreeBalance) {
            this.playEffect();
            this.isShow = false;
        }
    }

    stopMove() {
        this.isShow = true;
        if (!this.isDelay && !this.isWaitCloseFreeBalance) {

            this.playEffect(0.5);
            this.isShow = false;
        }
    }

    initAction() {
        if (this.isInit) return;
        App.EventUtils.dispatchEvent(App.EventID.SLOT_PAUSE_AUTO);
        App.ResUtils.getPrefab("prefabs/slotgame/widget/prefab_bigwin").then((prefab) => {
            this.loadPrefabFinish(prefab);
        }).catch((err) => {
            console.warn(err);
        });
        this.isInit = true;
    }

    loadPrefabFinish(prefab) {
        let self = this;
        let old = this.node.getChildByName("BigWinNode");
        if (old) return; //已经在显示了，就不显示多个了


        this.isHideBigwin = false;

        let index = this.spEffect > 5 ? 5 : this.spEffect;
        let nameSpin = ['bigwin', 'hugewin', 'Massivewin', 'Apocslypticwin', 'Apocslypticwin']
        let nameEff = ['win_bigwin_HD', 'win_hugewin_HD', 'win_massivewin_HD', 'win_apocalypticwin_HD', 'win_apocalypticwin_HD']
        this.soundEffName = nameEff[index - 1];
        if (!this.soundEffName || this.soundEffName == "") {
            //没有对应的bigwin
            console.log('===not found bigwin:' + index);
            return
        }

        //播放bigwin的背景音乐
        this.playEffStartCall();

        this.bigWinNode = instantiate(prefab);
        App.ScreenUtils.FixDesignScale_V(this.bigWinNode);
        this.bigWinNode.name = "BigWinNode";
        this.bigWinNode.parent = this.node;

        let urlSpin = 'spin/slotgame/bigwin/' + nameSpin[index - 1];
        let EffSpine = find('ui/node_spin', this.bigWinNode).getComponent(sp.Skeleton);
        App.ResUtils.getRes(urlSpin, sp.SkeletonData).then((skeletonData) => {
            if (isValid(self.bigWinNode) && isValid(EffSpine)) {
                EffSpine.skeletonData = skeletonData;
                EffSpine.setAnimation(0, "Animation1", false);
                EffSpine.addAnimation(0, "Animation2", true)
                self.showDropCoins();
                self.processStage = 'startShow';

                //开始显示金币数量
                let delayCall = function () {
                    // //播放对应win声音
                    // self._playEffect(self._soundEffName)
                    self.showCoins();
                }

                EffSpine.scheduleOnce(delayCall, 0.3 / Config.SLOT_GAME_SPEED);
            }
        });

        tween(this.bigWinNode)
            .delay(0.6 / Config.SLOT_GAME_SPEED)
            .call(() => {
                // 播放对应win声音
                self.playSfxSound(self.soundEffName);
            })
            .start();

        //背景光圈
        App.ResUtils.getRes('spin/slotgame/bigwin/reward_g_01', sp.SkeletonData).then((skeletonData) => {
            if (isValid(self.bigWinNode)) {
                let bgSpineNode = self.bigWinNode.getChildByName('node_spin_bg')
                if (isValid(bgSpineNode)) {
                    let bgSpine = bgSpineNode.getComponent(sp.Skeleton);
                    bgSpine.skeletonData = skeletonData;
                    bgSpine.setAnimation(0, "animation1", false);
                    bgSpine.addAnimation(1, "animation2", true)
                }
            }
        });
        this.isInit = false;
    }

    //显示掉落金币的效果
    showDropCoins() {
        let bgParticle = find('ui/bgParticle', this.bigWinNode);
        if (bgParticle) {
            const ps = bgParticle.getComponent(ParticleSystem);
            if (ps) {
                ps.clear();
                ps.play();
            }
        }
        let dropnode = find('ui/node_coin', this.bigWinNode);
        if (dropnode) {
            let script = dropnode.getComponent(DropCoins);
            if (script && script.setPlay) {
                script.setPlay();
            }
        }
    }

    playEffStartCall() {
        let self = this
        //降低音量
        App.AudioManager.setMusicVolume(0.3);
        this.playSfxSound('common_win3_HD', () => {
            self.hideBigWin();
        })
    }

    //显示金币
    showCoins() {
        if (!this.bigWinNode) return;

        this.bigWinNode.once(Node.EventType.TOUCH_END, this.onBtnSkip, this);
        this.showCoinsRoll(0, this.winNum);
        // let double_coins = find("ui/double_coins", this._bigWinNode)
        // double_coins.getComponent("DoubleWinCoins").show(this._winNum, this)
        this.isInit = false;
    }

    showCoinsRoll(startCoin, endCoin) {
        let self = this
        this.processStage = 'roallbegin'
        let sp_coin = find('ui/spr_coin_bg', this.bigWinNode);
        sp_coin.active = true;
        let lbl_coin = sp_coin.getChildByName('lbl_coin');
        let finishCall = function () {
            self.processStage = 'roallfinish'
            self.playSfxSound('common_win3end_HD')
        }
        let perCall = function () {
            let scale = sp_coin.getScale();
            sp_coin.setScale(scale.x + 0.003, scale.y + 0.003);
        }
        App.AnimationUtils.doRoallNumEff(lbl_coin, startCoin, endCoin, 2.5, finishCall, perCall, 2, true);
    }

    hideBigWin() {
        let self = this
        if (this.bigWinNode) {
            if (this.isHideBigwin) {
                console.log("BigWin已经在关闭了！")
                return
            }
            this.isHideBigwin = true
            //恢复音量
            App.AudioManager.setMusicVolume(1);

            let actionEndCall = function () {
                self.isHideBigwin = false;

                if (self.bigWinPlayEndCall) {
                    self.bigWinPlayEndCall()
                }
                self.bigWinPlayEndCall = null

                App.AudioManager.stopAll();
                self.bigWinNode.destroy()

                self.bigWinNode = null
            }

            let nodeUI = find('ui', this.bigWinNode)
            let curScale = nodeUI.getScale();
            tween(nodeUI)
                .to(0.15, { scale: new Vec3(curScale.x + 0.1, curScale.y + 0.1, curScale.z) }, { easing: 'backOut' })
                .to(0.35, { scale: new Vec3(0, 0, 0) })
                .call(() => {
                    actionEndCall();
                })
                .start();
        }
    }

    playSfxSound(fileName, endCall = null) {
        let soundPath = "audio/bigwin/";
        App.AudioManager.playSfx(soundPath, fileName, endCall);
    }

    recvGameStart(data) {
        let detail = data.detail;
        this.hideBigWin();

        if (detail && detail.spEffect) {
            this.spEffect = data.spEffect.kind;
            this.winNum = data.spEffect.wincoin;
        }
        this.isWaitCloseFreeBalance = (detail.freeCnt === 0 && detail.allFreeCnt > 0 && !!this.getComponent("SlotMachine_FreeBalance"));
    }

    playEffect(nDelay = 0) {
        if (this.spEffect > 0 && this.isShow) {
            if (nDelay) {
                //需要延迟。主要是在stopmove的时候中大奖，需要延迟让玩家看清楚
                this.scheduleOnce(() => {
                    this.initAction();
                }, nDelay / Config.SLOT_GAME_SPEED)
            }
        }
    }

    // 其它模块调用显示bigwin，如奖金熊的小游戏退出后显示一下
    // 参数 = {spEffect:0或 1或2, winNum: xxx}
    callPlayBigWinEffect(data) {
        // cc.warn(data.detail);
        let params = data.detail;
        this.spEffect = params.spEffect;
        if (this.spEffect > 0) {
            this.winNum = params.winNum;
            this.isShow = true;

            this.playEffect();
            this.isShow = false;
        }
    }

    //点击跳过
    onBtnSkip() {
        let self = this
        if (this.processStage == 'roallbegin') {
            //停止滚动
            let sp_coin = find('ui/spr_coin_bg', this.bigWinNode);
            let lbl_coin = sp_coin.getChildByName('lbl_coin');
            Tween.stopAllByTarget(lbl_coin);
            lbl_coin.getComponent(Label).string = App.FormatUtils.FormatNumToComma(this.winNum)

            let delayCall = function () {
                self.processStage = 'roallfinish'
            }
            this.scheduleOnce(delayCall, 0.5)
        }
        else if (this.processStage == 'roallfinish') {
            //关闭
            App.AudioManager.stopSfxByName('common_win3_HD');
            App.AudioManager.playBGM('audio/bgm_hall');
            this.hideBigWin();
        }
    }

    //直接调用显示
    //0 无 1 ：20倍 2:40倍 3：60倍 4：80倍 5 100倍
    showBigWin(nType, nCoin, endCall) {
        this.spEffect = nType
        this.winNum = nCoin
        this.bigWinPlayEndCall = endCall
        if (this.isInit) return;
        App.ResUtils.getPrefab("prefabs/slotgame/widget/prefab_bigwin").then((prefab) => {
            this.loadPrefabFinish(prefab);
        }).catch((err) => {
            console.warn(err);
        });
        this.isInit = true;
    }  
}


