import { _decorator, AssetManager, Component, director, Label, ProgressBar } from 'cc';
import { GGHotUpdateInstance, GGHotUpdateInstanceObserver } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateInstance';
import { ggHotUpdateManager } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateManager';
import { GGHotUpdateInstanceState } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateType';
import { App } from '../../App';
const { ccclass, property } = _decorator;
@ccclass
export class SlotGameLoding extends Component implements GGHotUpdateInstanceObserver {
    @property(ProgressBar)
    progressBar: ProgressBar | null = null;


    @property(Label)
    progreeLabel: Label | null = null;
    private slotGameDataScript: any = null;

    onLoad() {
        App.AudioManager.stopAll();
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        // this.setProgress(0.5);
        App.AudioManager.playSfx("audio/slotGame/game_loading", null, null);

        if (App.DeviceUtils.isNative()) {
            console.log('[SlotGameLoding] 开始检查热更新');
            const subGameBundleName = App.SubGameManager.getGameBundleName();
            let instance = ggHotUpdateManager.getInstance(subGameBundleName);
            instance.register(this);
            instance.checkUpdate();
        } else {
            this.loadBundle();
        }
    }

    onDestroy() {
        // 添加原生判断
        if (App.DeviceUtils.isNative()) {
            const subGameBundleName = App.SubGameManager.getGameBundleName();
            let instance = ggHotUpdateManager.getInstance(subGameBundleName);
            if (instance) {
                try {
                    instance.unregister(this);
                    instance = null;
                    console.log('[SlotGameLoding] 已取消注册观察者');
                } catch (e) {
                    console.warn('[SlotGameLoding] 取消注册观察者失败', { error: e });
                }
            }
            return;
        }
        this.unscheduleAllCallbacks();
    }



    start() {

        // this.loadBundle();
    }

    protected onDisable(): void {

    }

    //返回大厅
    onMenuExit() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click", null, null, true);
        if (this.slotGameDataScript) {
            console.log("onMenuExit")
            this.slotGameDataScript.reqBackLobby()
        }
    }

    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 热更新回调

    onGGHotUpdateInstanceCallBack(instance: GGHotUpdateInstance): void {
        // 添加热更新日志
        const stateName = GGHotUpdateInstanceState[instance.state] || `Unknown(${instance.state})`;
        console.log('[SlotGameLoding] GGHotUpdate 回调', {
            state: instance.state,
            stateName: stateName,
            totalBytes: instance.totalBytes || 0,
            downloadedBytes: instance.downloadedBytes || 0,
            downloadSpeed: instance.downloadSpeedInSecond || 0,
            remainTime: instance.downloadRemainTimeInSecond || 0
        });
        // this.hpProgressComp.updateState(instance.state);
        switch (instance.state) {

            case GGHotUpdateInstanceState.Idle:
                console.log('[SlotGameLoding] 状态: Idle - 空闲状态，等待操作');
                break;
            case GGHotUpdateInstanceState.CheckUpdateInProgress:
                console.log('[SlotGameLoding] 状态: CheckUpdateInProgress - 正在检查更新中');
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseLocalProjectManifestError:
                console.log('[SlotGameLoding] 状态: CheckUpdateFailedParseLocalProjectManifestError - 检查更新失败：解析本地项目清单错误，2秒后返回大厅');
                // 检查更新失败：返回大厅
                this.scheduleOnce(() => {
                    this.onMenuExit();
                }, 2);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteVersionManifestError:
                console.log('[SlotGameLoding] 状态: CheckUpdateFailedParseRemoteVersionManifestError - 检查更新失败：解析远程版本清单错误，2秒后返回大厅');
                // 检查更新失败：返回大厅
                this.scheduleOnce(() => {
                    this.onMenuExit();
                }, 2);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedDownloadRemoteProjectManifestError:
                console.log('[SlotGameLoding] 状态: CheckUpdateFailedDownloadRemoteProjectManifestError - 检查更新失败：下载远程项目清单错误，2秒后返回大厅');
                // 检查更新失败：返回大厅
                this.scheduleOnce(() => {
                    this.onMenuExit();
                }, 2);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteProjectManifestError:
                console.log('[SlotGameLoding] 状态: CheckUpdateFailedParseRemoteProjectManifestError - 检查更新失败：解析远程项目清单错误，2秒后返回大厅');
                // 检查更新失败：返回大厅
                this.scheduleOnce(() => {
                    this.onMenuExit();
                }, 2);
                break;
            case GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound:
                console.log('[SlotGameLoding] 状态: CheckUpdateSucNewVersionFound - 检查更新成功：发现新版本，开始热更新');
                // 检查更新成功：发现新版本，进行热更新
                instance.hotUpdate();
                break;
            case GGHotUpdateInstanceState.CheckUpdateSucAlreadyUpToDate:
                console.log('[SlotGameLoding] 状态: CheckUpdateSucAlreadyUpToDate - 检查更新成功：当前已是最新版本，直接加载游戏包');
                // 检查更新成功：当前已经是最新版本，直接进入游戏场景
                this.loadBundle();
                break;
            case GGHotUpdateInstanceState.HotUpdateInProgress:
                console.log('[SlotGameLoding] 状态: HotUpdateInProgress - 热更新进行中', {
                    downloadedBytes: instance.downloadedBytes,
                    totalBytes: instance.totalBytes,
                    progress: (instance.downloadedBytes / instance.totalBytes * 100).toFixed(2) + '%'
                });
                // 热更新：进行中 
                this.setProgress(instance.downloadedBytes / instance.totalBytes * 0.5);
                this.setProgress(instance.downloadedBytes / instance.totalBytes);
                // this.hpProgressComp.updateProgress(instance.totalBytes, instance.downloadedBytes, instance.downloadSpeedInSecond, instance.downloadRemainTimeInSecond);
                break;
            case GGHotUpdateInstanceState.HotUpdateSuc:
                console.log('[SlotGameLoding] 状态: HotUpdateSuc - 热更新成功，开始加载游戏包');
                // 热更新：成功，进入游戏
                this.loadBundle();
                break;
            case GGHotUpdateInstanceState.HotUpdateFailed:
                console.log('[SlotGameLoding] 状态: HotUpdateFailed - 热更新失败，2秒后返回大厅');
                // 热更新：失败，返回大厅
                this.scheduleOnce(() => {
                    this.onMenuExit();
                }, 2);
                break;
        }
    }

    loadBundle() {
        App.ResUtils.loadBundle1(App.SubGameManager.getGameBundleName(), (progress: number, path: string, asset: any, bundle: AssetManager.Bundle) => {
            this.setProgress(progress);
            console.log('[SlotGameLoding] 进度:', progress);
            if (progress === 1) {
                console.log('[SlotGameLoding] 进度: 100%，进入游戏');
                bundle.loadScene(App.SubGameManager.getGameMainSceneName(), (err, scene) => {
                    if (err) {
                        console.warn('加载并运行场景失败:', App.SubGameManager.getGameMainSceneName(), err);
                        return;
                    }
                    App.SubGameManager.setGameBundle(bundle);
                    director.runSceneImmediate(scene);
                });
            }
        });
    }

    private setProgress(percent: number) {
        if (this.progressBar) {
            this.progressBar.progress = percent;
        }
        if (this.progreeLabel) {
            this.progreeLabel.string = Math.floor(percent * 100) + "%";
        }
    }
}