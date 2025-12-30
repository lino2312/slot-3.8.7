import { _decorator, Asset, AssetManager, assetManager, Component, director, JsonAsset, Node, Scene } from 'cc';
import { App } from '../App';
import { SlotGameBaseData } from '../game/slotgame/SlotGameBaseData';
const { ccclass, property } = _decorator;

// 类型定义
interface GameMessageData {
    gameid: number;
    deskinfo: any;
    gameJackpot: any;
    [key: string]: any;
}

@ccclass('SubGameManager')
export class SubGameManager extends Component {

    private betValue: number = 0; // 进入游戏时选中的押注额
    private maxbetVal: number = 0; // 进入游戏时选中的最大押注额
    private slotGameDataScript: any = null; // 老虎机游戏数据脚本
    private slotGameConfigScript: any = null; // 老虎机游戏配置脚本
    private runningGameName: string = ""; // 当前运行的子游戏
    private gameBundle: AssetManager.Bundle = null; // 当前加载的游戏资源包
    private slotGameSpinFree: boolean = false; // 老虎机游戏是否处于免费旋转状态
    private slotGameFreeSpinData: any = null; // 老虎机游戏免费旋转数据
    private msgDic: any;
    private gameid: number = -1;

    protected onLoad(): void {
        App.SubGameManager = this;
    }

    start() {

    }

    update(deltaTime: number) {

    }


    entrySlotGameLoadingScene(sceneName: string, msgDic: GameMessageData): void {
        console.log('进入老虎机游戏加载场景:', sceneName);
        const subpackage = App.GameManager.getGameConfig(msgDic.gameid).subpackage;
        assetManager.loadBundle("hall", (err, bundle) => {
            if (err) {
                console.warn('加载子包失败:', subpackage, err);
                this.setMsgDic(null);
                return;
            }
            bundle.loadScene(sceneName, (sceneErr, scene) => {
                if (sceneErr) {
                    this.setMsgDic(null);
                    console.warn('加载并运行场景失败:', sceneName, sceneErr);
                    return;
                }
                this.setMsgDic(msgDic);
                this.gameid = msgDic.gameid;
                this.setGameBundle(bundle);
                director.runSceneImmediate(scene);
            });
        });
    }

    /**
     * 进入老虎机游戏
     * @param sceneName 场景名称
     * @param subpackage 子包名称
     * @param msgDic 游戏消息数据
     * @param callback 回调函数
     */
    entrySlotGame(
        sceneName: string,
        msgDic: GameMessageData
    ): void {
        const subpackage = App.GameManager.getGameConfig(msgDic.gameid).subpackage;
        assetManager.loadBundle(subpackage, (err, bundle) => {
            if (err) {
                console.warn('加载子包失败:', subpackage, err);
                return;
            }

            if (!bundle) {
                const error = new Error(`Bundle ${subpackage} loaded but is null`);
                console.warn('子包加载成功但为空:', subpackage);
                return;
            }

            console.log('加载子包成功:', subpackage);

            try {
                // 获取游戏配置
                const gameData = App.GameManager.getGameConfig(msgDic.gameid);
                App.EventUtils.dispatchEvent("HALL_TO_GAME"); director.loadScene(sceneName, (sceneErr) => {
                    if (sceneErr) {
                        console.warn('加载并运行场景失败:', sceneName, sceneErr);
                        return;
                    }

                    // const currentScene = director.getScene();
                    // if (currentScene) {
                    //     // 设置子游戏手动释放资源
                    //     currentScene.autoReleaseAssets = false;
                    // }
                    if (this.gameBundle) {
                        this.gameBundle.releaseAll();
                        assetManager.removeBundle(this.gameBundle);
                    }
                    // 设置当前运行的游戏名称
                    this.runningGameName = subpackage;
                    this.setGameBundle(bundle);
                    this.gameid = msgDic.gameid;
                    console.log('进入老虎机游戏:', sceneName, msgDic.gameid);
                    console.log('场景加载并运行完成:', sceneName);
                });
            } catch (configError) {
                console.warn('处理游戏配置时发生错误:', configError);
            }
        });
    }

    setMsgDic(msgDic: any): void {
        console.log("设置游戏消息数据:", msgDic);
        this.msgDic = msgDic;
    }

    getMsgDic() {
        return this.msgDic;
    }

    closeAllGame() {
        this.existSlotGame();
    }

    /**
     * 退出老虎机游戏
     */
    existSlotGame(cb?): void {
        if (this.slotGameDataScript != null) {
            this.slotGameDataScript.destroy();
            this.slotGameDataScript = null;
        }
        this.slotGameConfigScript = null;
        this.msgDic = null;
        this.runningGameName = "";
        this.oldBundle = this.gameBundle;
        // if (this.gameBundle) {
        //     this.gameBundle.releaseAll();
        //     assetManager.removeBundle(this.gameBundle);
        //     this.gameBundle = null;
        // }
        this.gameid = -1;
        console.log("退出老虎机游戏");
    }
    oldBundle = null;
    test() {
        // App.PopUpManager.closeAllPopups();

        if (this.oldBundle) {
            this.oldBundle.releaseAll();
            assetManager.removeBundle(this.oldBundle);
            this.oldBundle = null;
        }
    }
    // generateSlotGameDataScript(msgDic): any {
    //     // 移除现有的游戏数据脚本
    //     if (this.slotGameDataScript != null) {
    //         this.slotGameDataScript.destroy();
    //     }
    //     const scriptName = App.GameManager.getGameConfig(msgDic.gameid).dataCmp;
    //     this.slotGameDataScript = this.node.addComponent(scriptName);
    //     this.slotGameDataScript.init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
    // }

    /**
     * 设置老虎机游戏数据脚本
     * @param script 游戏数据脚本
     */
    setSlotGameDataScript(script: SlotGameBaseData) {
        this.slotGameDataScript = script;
    }

    /**
     * 获取老虎机游戏数据脚本
     */
    getSlotGameDataScript(): SlotGameBaseData {
        return this.slotGameDataScript;
    }

    // setSlotGameConfigScript(gameid: number): void {
    //     const cfgCmp = App.GameManager.getGameConfig(gameid).cfgCmp;
    //     this.slotGameConfigScript = import(`../config/slotGameConfig/${cfgCmp}`);
    //     // const bundle = this.getGameBundle();

    //     // App.ResUtils.getPrefab
    //     // if (!bundle) {
    //     //     console.warn('Bundle未加载');
    //     //     return;
    //     // }
    //     // bundle.load(cfgCmp, JsonAsset ,(err, asset) => {
    //     //     if (err || !asset) {
    //     //         console.warn('加载配置失败:', err);
    //     //         this.slotGameConfigScript = null;
    //     //         return;
    //     //     }

    //     //     this.slotGameConfigScript = asset.json;
    //     //     console.log('加载配置成功:', this.slotGameConfigScript);
    //     // });

    // }

    /**
     * 设置进入游戏时选择的押注额
     * @param betValue 押注额
     */
    setEnterSelectBet(betValue: number): void {
        this.betValue = betValue;
    }

    /**
     * 获取进入游戏时选择的押注额
     */
    getEnterSelectBet(): number {
        return this.betValue;
    }

    /**
     * 设置最大押注额
     * @param betVal 最大押注额
     */
    setEnterMaxBet(betVal: number): void {
        this.maxbetVal = betVal;
    }

    /**
     * 获取最大押注额
     */
    getEnterMaxBet(): number {
        return this.maxbetVal;
    }

    isInGame(): boolean {
        return this.runningGameName !== "";
    }

    /**
     * 获取当前运行的游戏名称
     */
    getRunningGameName(): string {
        return this.runningGameName;
    }

    setGameBundle(bundle: AssetManager.Bundle) {
        this.gameBundle = bundle;
    }

    getGameBundle(): AssetManager.Bundle {
        return this.gameBundle;
    }

    isInSubGame(): boolean {
        return this.runningGameName !== "";
    }

    setSlotGameSpinFree(isFree: boolean) {
        this.slotGameSpinFree = isFree;
    }

    getSlotGameSpinFree(): boolean {
        return this.slotGameSpinFree;
    }

    setSlotGameFreeSpinData(data: any) {
        this.slotGameFreeSpinData = data;
    }

    getSlotGameFreeSpinData(): any {
        return this.slotGameFreeSpinData;
    }

    getGameBundleName(): string {
        return App.GameManager.getGameConfig(this.getMsgDic().gameid).subpackage;
    }

    getGameMainSceneName(): string {
        return App.GameManager.getGameConfig(this.getMsgDic().gameid).gameScene;
    }

    getGameid(): number {
        return this.gameid;
    }
}


