import {
    _decorator, Component,
    director,
    Node, ProgressBar,
    tween,
    UITransform
} from 'cc';
import { App } from 'db://assets/scripts/App';
import { Config } from 'db://assets/scripts/config/Config';
import { GameItemData } from './data/GameItemData';

const { ccclass, property } = _decorator;

type ProgressTask = {
    value: number,
    duration: number,
    onComplete?: () => void,
    resolve?: () => void
};

@ccclass('HallPreload')
export class HallPreload extends Component {

    @property(ProgressBar)
    public progressBar: ProgressBar = null;

    @property(Node)
    public coinAnimationNode: Node = null;

    private maxCoinX: number = 0;
    private coinStartX: number = 0;
    private coinWidth: number = 30;

    private currentTween: any = null;
    private progressQueue: ProgressTask[] = [];
    private isAnimating: boolean = false;

    onLoad() {
        App.StorageUtils.deleteLocal('current_GameType');
        App.StorageUtils.deleteLocal('extfromgame');

        this.coinStartX = this.coinAnimationNode?.position.x ?? 0;

        if (this.progressBar) {
            const ui = this.progressBar.node.getComponent(UITransform)!;
            this.maxCoinX = this.progressBar.node.position.x + ui.width / 2 - this.coinWidth;
        }

        if (this.coinAnimationNode) {
            this.coinAnimationNode.setPosition(
                this.coinAnimationNode.position.x + 1,
                this.coinAnimationNode.position.y,
                this.coinAnimationNode.position.z
            );
        }

    }




    // --------------------------
    //   进度条队列系统（保持丝滑）
    // --------------------------

    setProgressQueuedAsync(value: number, duration: number = 0.3, onComplete?: () => void): Promise<void> {
        return new Promise(res => {
            this.progressQueue.push({ value, duration, onComplete, resolve: res });
            this.processProgressQueue();
        });
    }

    setProgressPercentQueuedAsync(percent: number, duration: number = 0.3, onComplete?: () => void) {
        return this.setProgressQueuedAsync(percent / 100, duration, onComplete);
    }

    private processProgressQueue() {
        if (!this.progressBar || !this.coinAnimationNode) {
            console.warn('progressBar 或 coinAnimationNode 未赋值');
            this.progressQueue = [];
            this.isAnimating = false;
            return;
        }
        if (this.isAnimating || this.progressQueue.length === 0) return;

        this.isAnimating = true;
        const task = this.progressQueue.shift()!;
        const { value, duration, onComplete } = task;

        const normalizedValue = Math.min(1, Math.max(0, value));
        const targetX = this.coinStartX + (this.maxCoinX - this.coinStartX) * normalizedValue;
        const clampedX = Math.min(Math.max(targetX, this.coinStartX), this.maxCoinX) - this.coinWidth;

        const animData = {
            progress: this.progressBar.progress,
            coinX: this.coinAnimationNode.position.x
        };

        this.currentTween = tween(animData)
            .to(duration, { progress: normalizedValue, coinX: clampedX }, {
                onUpdate: () => {
                    this.progressBar.progress = animData.progress;
                    this.coinAnimationNode.setPosition(
                        animData.coinX,
                        this.coinAnimationNode.position.y,
                        this.coinAnimationNode.position.z
                    );
                },
                onComplete: () => {
                    this.currentTween = null;
                    this.isAnimating = false;
                    onComplete?.();
                    task.resolve?.();
                    this.processProgressQueue();
                },
                easing: "smooth"
            })
            .start();
    }

    clearProgressQueue() {
        this.progressQueue = [];
        this.isAnimating = false;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }

    // --------------------------
    //   主加载流程（全部并行）
    // --------------------------

    async start() {

        await this.setProgressPercentQueuedAsync(10, 0.2);

        // 开始并行加载所有任务（最快方式）
        const preloadTask = this.preloadSceneAsync(Config.SCENE_NAME.HALL);
        const httpTasks = this.doHttpQuestParallel();

        // 视觉进度条（不阻塞逻辑）
        await this.setProgressPercentQueuedAsync(25, 0.3);
        await this.setProgressPercentQueuedAsync(40, 0.3);

        // 等待所有 HTTP 完成
        await httpTasks;
        await this.setProgressPercentQueuedAsync(75, 0.3);

        // 等待场景预加载完成
        await preloadTask;
        await this.setProgressPercentQueuedAsync(100, 0.4);

        App.SceneUtils.enterHallScene();
    }

    preloadSceneAsync(name: string): Promise<void> {
        return new Promise(res => {
            director.preloadScene(name, () => res());
        });
    }

    // --------------------------
    //   并行 HTTP + 图标加载
    // --------------------------

    async doHttpQuestParallel() {

        const httpList: Promise<any>[] = [];

        // 这些可以并行
        httpList.push(App.ApiManager.recoverBalance());
        httpList.push(App.ApiManager.getMessageList());
        httpList.push(App.ApiManager.getUserInfo());

        // 游戏列表全部并行请求
        for (let vendorID of GameItemData.slotVendorID) {
            httpList.push(App.ApiManager.getThirdGameList(vendorID));
        }

        const result = await Promise.all(httpList);

        // 解析数据
        const pRecoverBalance = result[0];
        const pMessageList = result[1];
        const pUserInfo = result[2];
        const thirdGameListResults = result.slice(3);

        // 设置余额
        App.TransactionData.amount = pRecoverBalance.amount;

        // 邮件红点
        const unread = pMessageList.list.filter(v => v.stateName === 'unread').length;
        App.RedHitManager.setKeyVal("mail_notify_yacai", unread);
        App.StorageUtils.saveLocal('mail_notify_yacai', unread);
        App.StorageUtils.saveLocal("redHitData", JSON.stringify({ mail_notify: unread }));

        // 设置用户信息
        App.userData().userInfo = pUserInfo;
        App.userData().isGuest = pUserInfo.verifyMethods.mobile === '';
        App.TransactionData.uRate = pUserInfo.uRate;
        App.status.isOpenOfficialRechargeInputDialog = pUserInfo.isOpenOfficialRechargeInputDialog;

        // 缓存各 Vendor 游戏图标（不 await，完全后台执行）
        GameItemData.slotVendorGameMap.clear();
        for (let i = 0; i < GameItemData.slotVendorID.length; i++) {
            const vendorID = GameItemData.slotVendorID[i];
            const resp = thirdGameListResults[i];
            GameItemData.slotVendorGameMap.set(vendorID, resp);

            if (vendorID !== 42) {
                // this.cacheThirdSpriteFrame(resp?.gameLists ?? []);
            }
        }
    }

    // --------------------------
    //   图标异步预缓存（不阻塞）
    // --------------------------

    cacheThirdSpriteFrame(list: any[]) {
        if (!Array.isArray(list)) return;
        for (const gameData of list) {
            const name = (gameData.gameNameEn ?? "").trim();
            const url = (gameData.img ?? "").trim();
            if (!name || !url) continue;

            // 不 await → 后台加载 → 极快
            App.CacheUtils.getThirdGameSpriteFrameCached(name, url);
        }
    }

    update(deltaTime: number) { }
}
