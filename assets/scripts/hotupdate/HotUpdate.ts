import { _decorator, Asset, game, Label, Node, native, ProgressBar, sys, UITransform, tween, Tween, assetManager, Component, js } from 'cc';
import { DEV, JSB } from 'cc/env';
import { Config } from '../config/Config';
import { App } from 'db://assets/scripts/App';
import { ggHotUpdateManager } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateManager';
import { GGHotUpdateInstance, GGHotUpdateInstanceObserver } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateInstance';
import { GGHotUpdateInstanceEnum, GGHotUpdateInstanceState } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateType';
const { ccclass, property } = _decorator;

// 常量定义
const TWEEN_DURATION = 0.2;

export enum EventCode {
    /**版本太低(追加项) */
    VERSION_TOO_LOW = -2,
    /**程序正在执行(追加项) */
    ERROR_IS_UPDATING = -1,
    /**没有本地清单文件 */
    ERROR_NO_LOCAL_MANIFEST = 0,
    /**下载清单文件失败 */
    ERROR_DOWNLOAD_MANIFEST = 1,
    /**解析清单文件失败 */
    ERROR_PARSE_MANIFEST = 2,
    /**发现新版本 */
    NEW_VERSION_FOUND = 3,
    /**已经是最新版本 */
    ALREADY_UP_TO_DATE = 4,
    /**下载进度 */
    UPDATE_PROGRESSION = 5,
    /**更新本地资源成功 */
    ASSET_UPDATED = 6,
    /**下载时发生了，常见错误:404、解压失败、文件校验失败 */
    ERROR_UPDATING = 7,
    /**热更完成 */
    UPDATE_FINISHED = 8,
    /**热更失败 */
    UPDATE_FAILED = 9,
    /**解压失败 同时触发ERROR_UPDATING*/
    ERROR_DECOMPRESS = 10,
    
}

@ccclass
export default class HotUpdate extends Component implements GGHotUpdateInstanceObserver {
    @property(ProgressBar)
    progressBar: ProgressBar = null;
    @property(Node)
    progressNode: Node = null;
    @property(Node)
    coinNode: Node = null;

    public onProgressCallback: (progress: number,downloadedBytes: number,totalBytes: number) => void = null;
    // GG插件热更新相关属性
    private _ggHotUpdateInstance: GGHotUpdateInstance | null = null;
    private _ggHotUpdateInitialized = false;
    /** 本地版本存储Key前缀 */
    private readonly  LOCAL_VERSION_KEY = 'currentVersion';

    // 添加GG插件Promise回调保存属性
    private _checkUpdateResolve: ((value: EventCode) => void) | null = null;
    private _checkUpdateReject: ((reason?: any) => void) | null = null;

    /**
     * 检查更新失败后，最大重试次数
     */
    private _checkUpdateRetryMaxTimes = 3;
    /**
     * 检查更新失败后，累计重试次数
     */
    private _checkUpdateRetryCurTimes = 0;
    /**
     * 检查更新失败后，重试间隔(秒)
     */
    private _checkUpdateRetryIntervalInSecond = 5;
    /**
     * 热更新失败后，最大重试次数
     */
    private _hotUpdateRetryMaxTimes = 3;
    /**
     * 热更新失败后，累计重试次数
     */
    private _hotUpdateRetryCurTimes = 0;
    /**
     * 热更新失败后，重试间隔(秒)
     */
    private _hotUpdateRetryIntervalInSecond = 5;

    initHotUpdate() {
        console.log('[GameLaunch] 开始初始化热更新系统', {
            isNative: JSB,
            isBrowser: sys.isBrowser,
            isDev: DEV
        });
        
        // this._initVersion();
        if (JSB) {
            this._initGGHotUpdate();
        } else {
            console.warn('[GameLaunch] 非原生平台，跳过热更新初始化');
        }
    }

    private _initVersion(): void {
        // if (this.versionLb) {
        //     this.versionLb.string = `版本号: ${}`;
        // }
    }

    start() {}

    init() {
        if (this.progressBar) this.progressBar.progress = 0;
        // if (this.upTips) this.upTips.string = '';
        // if (this.progressLab) this.progressLab.string = '0%';
    }

    /**
     * 检验版本
     * @returns EventCode
     */
    async checkVersion() {
        console.log('[GameLaunch] 开始检查版本', {
            isDev: DEV,
            isBrowser: sys.isBrowser,
            isNative: JSB
        });
        
        return new Promise<EventCode>((resolve, reject) => {
            if (DEV || sys.isBrowser) {
                console.log('[GameLaunch] 开发环境或浏览器环境，跳过版本检查');
                resolve(0);
                return;
            }
            this.initHotUpdate();
            this._checkUpdateWithGG()
                .then((code) => {
                    console.log('[GameLaunch] 版本检查完成', { code });
                    resolve(code);
                })
                .catch((error) => {
                    console.error('[GameLaunch] 版本检查失败', { error });
                    reject(error);
                });
            return;
        });
    }
    /**
     * 强更 (未完善)
     */
    toForceUpdate() {
        console.warn('[GameLaunch] 触发强制更新', {
            forceUpdateUrl: Config.hotupdateBaseUrl,
            forceUpdateVersion: Config.hotupdate_version
        });
        // TODO: 实现强制更新逻辑
        // 可以跳转到应用商店或下载页面
    }

    /**
     * 初始化GG插件热更新
     */
    private _initGGHotUpdate(): void {
        try {
            // 设置默认包地址
            let packageUrl = Config.hotupdateBaseUrl;
            console.log('[GameLaunch] 初始化GG插件热更新管理器', {
                packageUrl: packageUrl,
                enableLog: DEV,
                hotupdateVersion: Config.hotupdate_version,
                upType: Config.up_type
            });
            
            // 初始化GG插件热更新管理器
            ggHotUpdateManager.init({
                enableLog: DEV,
                packageUrl: packageUrl,
            });

            this._ggHotUpdateInitialized = true;
            console.log('[GameLaunch] GG插件热更新初始化完成', {
                packageUrl: packageUrl,
                initialized: this._ggHotUpdateInitialized
            });
        } catch (error) {
            console.error('[GameLaunch] GG插件热更新初始化失败', {
                error: error,
                message: error?.message || '未知错误',
                stack: error?.stack
            });
        }
    }

    /**
     * 使用GG插件检查更新
     */
    private _checkUpdateWithGG(): Promise<EventCode> {
        return new Promise((resolve, reject) => {
            console.log('[GameLaunch] 使用GG插件检查更新');
            
            if (!this._ggHotUpdateInitialized) {
                const error = new Error('GG插件热更新未初始化');
                console.error('[GameLaunch] 检查更新失败：热更新未初始化');
                reject(error);
                return;
            }

            // 保存Promise回调
            this._checkUpdateResolve = resolve;
            this._checkUpdateReject = reject;

            try {
                const localVersion = this.getLocalVersion();
                console.log('[GameLaunch] 获取热更新实例', {
                    instanceType: GGHotUpdateInstanceEnum.BuildIn,
                    localVersion: localVersion || '无',
                    configVersion: Config.hotupdate_version
                });
                
                this._ggHotUpdateInstance = ggHotUpdateManager.getInstance(GGHotUpdateInstanceEnum.BuildIn);
                this._ggHotUpdateInstance.register(this);
                this._ggHotUpdateInstance.checkUpdate();
                
                console.log('[GameLaunch] 已发起检查更新请求，等待回调');
            } catch (error) {
                console.error('[GameLaunch] 检查更新异常', {
                    error: error,
                    message: error?.message || '未知错误',
                    stack: error?.stack
                });
                reject(error);
            }
        });
    }

    /**
     * 实现GGHotUpdateInstanceObserver接口
     */
    onGGHotUpdateInstanceCallBack(instance: GGHotUpdateInstance): void {
        const stateName = GGHotUpdateInstanceState[instance.state] || `Unknown(${instance.state})`;
        console.log('[GameLaunch] 收到热更新回调', {
            state: instance.state,
            stateName: stateName,
            totalBytes: instance.totalBytes || 0,
            downloadedBytes: instance.downloadedBytes || 0,
            downloadSpeed: instance.downloadSpeedInSecond || 0,
            remainTime: instance.downloadRemainTimeInSecond || 0
        });
        
        switch (instance.state) {
            case GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound:
                console.log('[GameLaunch] 发现新版本，准备开始热更新', {
                    upType: Config.up_type,
                    isForceUpdate: Config.up_type === 2
                });
                if (Config.up_type === 2) {
                    console.warn('[GameLaunch] 检测到强制更新模式，调用强制更新');
                    this.toForceUpdate();
                }
                console.log('[GameLaunch] 开始执行热更新');
                instance.hotUpdate();
                break;
            case GGHotUpdateInstanceState.CheckUpdateSucAlreadyUpToDate:
                console.log('[GameLaunch] 已是最新版本，无需更新');
                this._onGGHotUpdateComplete(EventCode.ALREADY_UP_TO_DATE, '已是最新版本');
                break;

            case GGHotUpdateInstanceState.HotUpdateInProgress:
                // 更新进度显示
                const progress = instance.totalBytes > 0 
                    ? instance.downloadedBytes / instance.totalBytes * 100
                    : 0;
                if (this.onProgressCallback) {
                    this.onProgressCallback(Number(progress),instance.downloadedBytes,instance.totalBytes);
                }
                console.log('[GameLaunch] 热更新进行中', {
                    progress: `${progress}%`,
                    downloaded: `${(instance.downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(instance.totalBytes / 1024 / 1024).toFixed(2)} MB`,
                    speed: `${(instance.downloadSpeedInSecond / 1024 / 1024).toFixed(2)} MB/s`,
                    remainTime: `${instance.downloadRemainTimeInSecond || 0} 秒`
                });
                
                // 更新进度条
                if (this.progressBar) {
                    this.progressBar.progress = instance.totalBytes > 0 
                        ? instance.downloadedBytes / instance.totalBytes 
                        : 0;
                }
                break;

            case GGHotUpdateInstanceState.HotUpdateSuc:
                console.log('[GameLaunch] 热更新成功完成', {
                    totalBytes: instance.totalBytes,
                    downloadedBytes: instance.downloadedBytes
                });
                this._onGGHotUpdateComplete(EventCode.UPDATE_FINISHED);
                break;

            case GGHotUpdateInstanceState.HotUpdateFailed:
                console.error('[GameLaunch] 热更新失败', {
                    state: instance.state,
                    stateName: stateName
                });
                this._handleHotUpdateRetry(instance);
                break;

            case GGHotUpdateInstanceState.CheckUpdateFailedParseLocalProjectManifestError:
                console.error('[GameLaunch] 检查更新失败：解析本地清单文件错误', {
                    state: instance.state,
                    stateName: stateName
                });
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteVersionManifestError:
                console.error('[GameLaunch] 检查更新失败：解析远程版本清单错误', {
                    state: instance.state,
                    stateName: stateName
                });
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedDownloadRemoteProjectManifestError:
                console.error('[GameLaunch] 检查更新失败：下载远程清单文件错误', {
                    state: instance.state,
                    stateName: stateName
                });
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteProjectManifestError:
                console.error('[GameLaunch] 检查更新失败：解析远程清单文件错误', {
                    state: instance.state,
                    stateName: stateName
                });
                this._handleCheckUpdateRetry(instance);
                break;
            default:
                console.warn('[GameLaunch] 未知状态: ' + stateName, {
                    state: instance.state
                });
                break;
        }
    }

    /**
     * GG插件热更新完成处理
     */
    private _onGGHotUpdateComplete(code: EventCode, error?: string): void {
        const codeName = EventCode[code] || `Unknown(${code})`;
        console.log('[GameLaunch] 热更新流程完成', {
            code: code,
            codeName: codeName,
            error: error || null
        });
        
        if (this._ggHotUpdateInstance) {
            try {
                this._ggHotUpdateInstance.unregister(this);
                this._ggHotUpdateInstance = null;
                console.log('[GameLaunch] 已取消注册观察者');
            } catch (e) {
                console.warn('[GameLaunch] 取消注册观察者失败', { error: e });
            }
        }

        if (code === EventCode.UPDATE_FINISHED) {
            // 热更新成功，重启游戏
            console.log('[GameLaunch] 热更新成功，准备重启游戏');
            this._restartGameWithGG();
        } else {
            if (code === EventCode.ALREADY_UP_TO_DATE) {
                const version = Config.hotupdate_version;
                console.log('[GameLaunch] 已是最新版本，保存版本号', { version });
                this.saveLocalVersion(version);
                if (this._checkUpdateResolve) {
                    this._checkUpdateResolve(code);
                    this._checkUpdateResolve = null;
                    this._checkUpdateReject = null;
                }
            } else {
                console.error('[GameLaunch] 热更新流程失败', {
                    code: code,
                    codeName: codeName,
                    error: error
                });
                if (this._checkUpdateReject) {
                    this._checkUpdateReject(error);
                    this._checkUpdateResolve = null;
                    this._checkUpdateReject = null;
                }
            }
        }
    }

    /**
     * 获取本地存储的版本号
     */
    getLocalVersion(): string {
        const key = this.LOCAL_VERSION_KEY ;
        const version = App.StorageUtils.getLocal(key, '');
        console.log('[GameLaunch] 获取本地版本号', { key, version: version || '无' });
        return version;
    }
    
    /**
     * 保存本地版本号
     */
    saveLocalVersion(version: string): void {
        const key = this.LOCAL_VERSION_KEY ;
        const oldVersion = App.StorageUtils.getLocal(key, '');
        App.StorageUtils.saveLocal(key, version);
        console.log('[GameLaunch] 保存本地版本号');
    }

    /**
     * 使用GG插件重启游戏
     */
    private _restartGameWithGG(): void {
        console.log('[GameLaunch] 准备重启游戏');
        try {
            // ggHotUpdateManager.restartGame();
            App.PlatformApiMgr.restartApp()
            console.log('[GameLaunch] 已调用GG插件重启游戏');
        } catch (error) {
            console.error('[GameLaunch] GG插件重启游戏失败，使用备用方法', {
                error: error,
                message: error?.message
            });
            // 回退到原有重启方法
            console.log('[GameLaunch] 使用 game.restart() 重启游戏');
            App.PlatformApiMgr.restartApp()
        }
    }


    /**
     * 处理检查更新重试逻辑
     */
    private _handleCheckUpdateRetry(instance: GGHotUpdateInstance): void {
        const stateName = GGHotUpdateInstanceState[instance.state] || `Unknown(${instance.state})`;
        
        if (this._checkUpdateRetryCurTimes >= this._checkUpdateRetryMaxTimes) {
            console.error('[GameLaunch] 检查更新失败，已达到最大重试次数', {
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._checkUpdateRetryCurTimes,
                maxRetryTimes: this._checkUpdateRetryMaxTimes
            });
            
            // 如果是解析本地信息失败导致的检查更新失败，那么可以考虑清除本地的下载缓存目录，以清空所有缓存，提高下次能正确更新的概率
            if (instance.state == GGHotUpdateInstanceState.CheckUpdateFailedParseLocalProjectManifestError) {
                console.warn('[GameLaunch] 检测到本地清单解析失败，清除下载缓存');
                try {
                    instance.clearDownloadCache();
                    console.log('[GameLaunch] 已清除下载缓存');
                } catch (e) {
                    console.error('[GameLaunch] 清除下载缓存失败', { error: e });
                }
            }
            this._onGGHotUpdateComplete(EventCode.ERROR_UPDATING, '检查更新失败');
        } else {
            this._checkUpdateRetryCurTimes++;
            console.warn('[GameLaunch] 检查更新失败，准备重试', {
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._checkUpdateRetryCurTimes,
                maxRetryTimes: this._checkUpdateRetryMaxTimes,
                retryInterval: this._checkUpdateRetryIntervalInSecond
            });
            
            this.scheduleOnce(() => {
                console.log('[GameLaunch] 开始第 ' + this._checkUpdateRetryCurTimes + ' 次重试');
                instance.checkUpdate();
            }, this._checkUpdateRetryIntervalInSecond);
        }
    }


    /**
     * 处理热更新重试逻辑
     */
    private _handleHotUpdateRetry(instance: GGHotUpdateInstance): void {
        const stateName = GGHotUpdateInstanceState[instance.state] || `Unknown(${instance.state})`;
        
        if (this._hotUpdateRetryCurTimes >= this._hotUpdateRetryMaxTimes) {
            console.error('[GameLaunch] 热更新失败，已达到最大重试次数', {
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._hotUpdateRetryCurTimes,
                maxRetryTimes: this._hotUpdateRetryMaxTimes
            });
            this._onGGHotUpdateComplete(EventCode.UPDATE_FAILED, '热更新失败');
        } else {
            this._hotUpdateRetryCurTimes++;
            console.warn('[GameLaunch] 热更新失败，准备重试', {
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._hotUpdateRetryCurTimes,
                maxRetryTimes: this._hotUpdateRetryMaxTimes,
                retryInterval: this._hotUpdateRetryIntervalInSecond
            });
            
            this.scheduleOnce(() => {
                console.log('[GameLaunch] 开始第 ' + this._hotUpdateRetryCurTimes + ' 次热更新重试');
                instance.hotUpdate();
            }, this._hotUpdateRetryIntervalInSecond);
        }
    }

}
