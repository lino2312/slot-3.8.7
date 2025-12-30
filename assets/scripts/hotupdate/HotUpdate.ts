import { _decorator, Component, log, ProgressBar, sys } from "cc";
import { DEV, JSB } from "cc/env";
import { GGHotUpdateInstanceObserver, GGHotUpdateInstance } from "db://gg-hot-update/scripts/hotupdate/GGHotUpdateInstance";
import { ggHotUpdateManager } from "db://gg-hot-update/scripts/hotupdate/GGHotUpdateManager";
import { GGHotUpdateInstanceEnum, GGHotUpdateInstanceState } from "db://gg-hot-update/scripts/hotupdate/GGHotUpdateType";
import { App } from "../App";
import { Config } from "../config/Config";
import { zipHotUpdateManager } from "./ZipHotUpdateManager";

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
export default class HotUpdate extends Component implements GGHotUpdateInstanceObserver /*implements GGHotUpdateInstanceObserver*/ {
    @property(ProgressBar)
    progressBar: ProgressBar = null;
    @property(Node)
    progressNode: Node = null;
    @property(Node)
    coinNode: Node = null;

    public onProgressCallback: (progress: number, downloadedBytes: number, totalBytes: number) => void = null;
    // GG插件热更新相关属性
    private _ggHotUpdateInstance: GGHotUpdateInstance | null = null;
    private _ggHotUpdateInitialized = false;
    /** 本地版本存储Key前缀 */
    private readonly LOCAL_VERSION_KEY = 'currentVersion';

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

    /**
     * 日志输出（受日志开关控制）
     */
    private _log(message: string, data?: any): void {
        if (Config.hotUpdateLogEnabled || DEV) {
            log(`[HotUpdate] ${message}`, data || '');
        }
    }

    /**
     * 错误日志输出（始终输出）
     */
    private _error(message: string, error?: any): void {
        console.error(`[HotUpdate] ${message}`, error || '');
    }

    /**
     * 警告日志输出（受日志开关控制）
     */
    private _warn(message: string, data?: any): void {
        if (Config.hotUpdateLogEnabled || DEV) {
            console.warn(`[HotUpdate] ${message}`, data || '');
        }
    }

    initHotUpdate() {
        log('[GameLaunch] 开始初始化热更新系统', {
            isNative: JSB,
            isBrowser: sys.isBrowser,
            isDev: DEV,
            useZipHotUpdate: Config.useZipHotUpdate
        });

        // this._initVersion();
        if (JSB) {
            // 根据配置选择使用压缩包热更新还是传统文件下载
            if (Config.useZipHotUpdate) {
                this._initZipHotUpdate();
            } else {
                this._initGGHotUpdate();
            }
        } else {
            console.warn('[GameLaunch] 非原生平台，跳过热更新初始化');
        }
    }

    private _initVersion(): void {
        // if (this.versionLb) {
        //     this.versionLb.string = `版本号: ${}`;
        // }
    }

    start() { }

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
        log('[GameLaunch] 开始检查版本', {
            isDev: DEV,
            isBrowser: sys.isBrowser,
            isNative: JSB
        });

        return new Promise<EventCode>((resolve, reject) => {
            if (DEV || sys.isBrowser) {
                log('[GameLaunch] 开发环境或浏览器环境，跳过版本检查');
                resolve(0);
                return;
            }
            this.initHotUpdate();

            // 根据配置选择使用压缩包热更新还是传统文件下载
            const checkUpdatePromise = Config.useZipHotUpdate
                ? this._checkUpdateWithZip()
                : this._checkUpdateWithGG();

            checkUpdatePromise
                .then((code) => {
                    log('[GameLaunch] 版本检查完成', { code });
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
        this._warn('触发强制更新', {
            forceUpdateUrl: Config.hotupdateBaseUrl,
            forceUpdateVersion: Config.hotupdate_version
        });
        // TODO: 实现强制更新逻辑
        // 可以跳转到应用商店或下载页面
    }

    /**
     * 初始化压缩包热更新
     */
    private _initZipHotUpdate(): void {
        try {
            this._log('初始化压缩包热更新管理器', {
                enableLog: Config.hotUpdateLogEnabled || DEV,
                hotupdateVersion: Config.hotupdate_version,
                upType: Config.up_type,
                hotupdateBaseUrl: Config.hotupdateBaseUrl
            });

            // 初始化压缩包热更新管理器
            zipHotUpdateManager.init({
                enableLog: Config.hotUpdateLogEnabled || DEV,
            });

            this._ggHotUpdateInitialized = true;
            this._log('压缩包热更新初始化完成', {
                initialized: this._ggHotUpdateInitialized
            });
        } catch (error) {
            this._error('压缩包热更新初始化失败', `error:${error instanceof Error ? error.message : String(error)}  message:${error?.message || '未知错误'}  stack:${error?.stack}`);
        }
    }

    /**
     * 初始化GG插件热更新
     */
    private _initGGHotUpdate(): void {
        try {
            // 设置默认包地址，确保包含版本号
            // packageUrl 格式: http://10.103.6.180:3000/1.0.0
            let packageUrl = Config.hotupdateBaseUrl;
            if (packageUrl && Config.hotupdate_version) {
                // 确保 baseUrl 以 / 结尾，版本号不以 / 开头
                const baseUrl = packageUrl.endsWith('/') ? packageUrl.slice(0, -1) : packageUrl;
                const version = Config.hotupdate_version.startsWith('/') ? Config.hotupdate_version.slice(1) : Config.hotupdate_version;
                packageUrl = `${baseUrl}/${version}`;
            }
            this._log('初始化GG插件热更新管理器', {
                packageUrl: packageUrl,
                enableLog: Config.hotUpdateLogEnabled || DEV,
                hotupdateVersion: Config.hotupdate_version,
                upType: Config.up_type
            });

            // 初始化GG插件热更新管理器
            ggHotUpdateManager.init({
                enableLog: Config.hotUpdateLogEnabled || DEV,
                packageUrl: packageUrl,
            });

            this._ggHotUpdateInitialized = true;
            this._log('GG插件热更新初始化完成', {
                packageUrl: packageUrl,
                initialized: this._ggHotUpdateInitialized
            });
        } catch (error) {
            this._error('GG插件热更新初始化失败', `error:${error instanceof Error ? error.message : String(error)}  message:${error?.message || '未知错误'}  stack:${error?.stack}`);
        }
    }

    /**
     * 使用压缩包热更新检查更新（基于GGHotUpdateInstanceObserver）
     */
    private _checkUpdateWithZip(): Promise<EventCode> {
        return new Promise((resolve, reject) => {
            this._log('使用压缩包热更新检查更新（基于GGHotUpdateInstanceObserver）', {
                version: Config.hotupdate_version,
                baseUrl: Config.hotupdateBaseUrl
            });

            if (!this._ggHotUpdateInitialized) {
                const error = new Error('压缩包热更新未初始化');
                this._error('检查更新失败：热更新未初始化', `error:${error instanceof Error ? error.message : String(error)}  message:${error?.message || '未知错误'}  stack:${error?.stack}`);
                reject(error);
                return;
            }

            // 保存Promise回调
            this._checkUpdateResolve = resolve;
            this._checkUpdateReject = reject;

            try {
                // 获取GG热更新实例（用于状态回调）
                this._ggHotUpdateInstance = ggHotUpdateManager.getInstance(GGHotUpdateInstanceEnum.BuildIn);
                this._ggHotUpdateInstance.register(this);
                this._log('已注册GGHotUpdateInstanceObserver', {
                    bundleName: GGHotUpdateInstanceEnum.BuildIn
                });

                // 触发 CheckUpdateInProgress 状态回调
                this._log('触发状态回调: CheckUpdateInProgress');
                this._notifyState(GGHotUpdateInstanceState.CheckUpdateInProgress);

                // 检查版本（使用压缩包热更新逻辑）
                this._checkVersionWithZip();
            } catch (error) {
                this._error('检查更新异常', `error:${error instanceof Error ? error.message : String(error)}  message:${error?.message || '未知错误'}  stack:${error?.stack}`);
                reject(error);
            }
        });
    }

    /**
     * 使用压缩包热更新检查版本
     */
    private _checkVersionWithZip(): void {
        const bundleName = GGHotUpdateInstanceEnum.BuildIn;
        const version = Config.hotupdate_version;
        const baseUrl = Config.hotupdateBaseUrl;

        this._log('开始检查版本', { bundleName, version, baseUrl });

        // 检查本地是否有manifest
        const hasLocal = zipHotUpdateManager.hasLocalManifest(bundleName);
        this._log('检查本地manifest', { bundleName, hasLocal });

        if (!hasLocal) {
            // 首次更新，直接开始下载
            this._log('首次更新，无需比较版本，直接开始下载', { bundleName });
            this._notifyState(GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound);
            return; // 状态回调会触发下载
        }

        // 非首次，需要比较版本
        const localManifest = zipHotUpdateManager.getLocalManifest(bundleName);
        if (!localManifest) {
            // 本地manifest读取失败，当作首次更新
            this._warn('本地manifest读取失败，当作首次更新处理', { bundleName });
            this._notifyState(GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound);
            return;
        }

        this._log('读取本地manifest成功', {
            bundleName,
            localVersion: localManifest.version,
            localAssetCount: Object.keys(localManifest.assets || {}).length
        });

        const localVersion = localManifest.version;

        // 先检查根目录的 version.manifest（推荐方式，始终指向最新版本）
        // 如果根目录的 version.manifest 不存在，再检查版本文件夹里的 version.manifest
        // 根目录：{baseUrl}/version.manifest
        // 版本文件夹：{baseUrl}/{version}/version.manifest
        const rootVersionManifestUrl = baseUrl + '/version.manifest';
        const versionFolderManifestUrl = baseUrl + '/' + version + '/version.manifest';

        this._log('检查version.manifest（优先根目录）', {
            bundleName,
            rootVersionManifestUrl,
            versionFolderManifestUrl,
            localVersion,
            targetVersion: version
        });

        // 先尝试根目录的 version.manifest（推荐方式）
        fetch(rootVersionManifestUrl)
            .then((resp: Response) => {
                if (resp.ok) {
                    return resp.text().then((text: string) => {
                        try {
                            const versionManifest = JSON.parse(text);
                            const latestVersion = versionManifest.version;
                            this._log('从根目录version.manifest获取到最新版本', {
                                latestVersion,
                                localVersion,
                                targetVersion: version,
                                source: 'root'
                            });

                            // 使用最新版本号检查更新
                            const versionToCheck = latestVersion;

                            if (latestVersion !== localVersion) {
                                this._log('发现新版本', {
                                    localVersion,
                                    latestVersion,
                                    willCheckVersion: versionToCheck
                                });
                            }

                            // 使用确定的版本号检查更新
                            const remoteManifestUrl = baseUrl + '/' + versionToCheck + '/project.manifest';
                            this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
                        } catch (error) {
                            this._log('解析根目录version.manifest失败，尝试版本文件夹', { error });
                            // 回退到检查版本文件夹里的 version.manifest
                            this._tryVersionFolderManifest(versionFolderManifestUrl, localManifest, bundleName, version, baseUrl);
                        }
                    });
                } else {
                    // 根目录 version.manifest 不存在，尝试版本文件夹里的
                    this._log('根目录version.manifest不存在，尝试版本文件夹', {
                        status: resp.status,
                        willTry: versionFolderManifestUrl
                    });
                    this._tryVersionFolderManifest(versionFolderManifestUrl, localManifest, bundleName, version, baseUrl);
                }
            })
            .catch((error) => {
                // 根目录 version.manifest 获取失败，尝试版本文件夹里的
                this._log('获取根目录version.manifest失败，尝试版本文件夹', { error });
                this._tryVersionFolderManifest(versionFolderManifestUrl, localManifest, bundleName, version, baseUrl);
            });
    }

    /**
     * 尝试从版本文件夹获取 version.manifest（兼容旧逻辑，但主包不再需要）
     * 注意：主包的 version.manifest 现在只放在根目录，不再在版本文件夹里生成
     * 如果根目录的 version.manifest 不存在，直接使用配置版本号
     */
    private _tryVersionFolderManifest(
        versionFolderManifestUrl: string,
        localManifest: any,
        bundleName: string,
        version: string,
        baseUrl: string
    ): void {
        // 主包的 version.manifest 不再在版本文件夹里，直接使用配置版本
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn) {
            this._log('主包version.manifest不在版本文件夹里，使用配置版本检查', {
                targetVersion: version
            });
            const remoteManifestUrl = baseUrl + '/' + version + '/project.manifest';
            this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
            return;
        }

        // 子包的 version.manifest 仍在版本文件夹里（GGHotUpdateInstance 需要使用）
        fetch(versionFolderManifestUrl)
            .then((resp: Response) => {
                if (resp.ok) {
                    return resp.text().then((text: string) => {
                        try {
                            const versionManifest = JSON.parse(text);
                            const latestVersion = versionManifest.version;
                            this._log('从版本文件夹version.manifest获取到版本信息', {
                                latestVersion,
                                localVersion: localManifest.version,
                                targetVersion: version,
                                source: 'version-folder'
                            });

                            // 如果version.manifest中的版本号比本地版本号新，使用新版本号检查更新
                            // 否则使用配置中的目标版本号
                            const versionToCheck = latestVersion !== localManifest.version ? latestVersion : version;

                            if (latestVersion !== localManifest.version) {
                                this._log('发现新版本', {
                                    localVersion: localManifest.version,
                                    latestVersion,
                                    willCheckVersion: versionToCheck
                                });
                            }

                            // 使用确定的版本号检查更新
                            const remoteManifestUrl = baseUrl + '/' + versionToCheck + '/project.manifest';
                            this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
                        } catch (error) {
                            this._log('解析版本文件夹version.manifest失败，使用配置版本检查', { error });
                            // 回退到使用配置版本
                            const remoteManifestUrl = baseUrl + '/' + version + '/project.manifest';
                            this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
                        }
                    });
                } else {
                    // version.manifest 不存在，使用配置版本
                    this._log('版本文件夹version.manifest不存在，使用配置版本检查', {
                        status: resp.status,
                        targetVersion: version
                    });
                    const remoteManifestUrl = baseUrl + '/' + version + '/project.manifest';
                    this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
                }
            })
            .catch((error) => {
                // version.manifest 获取失败，使用配置版本
                this._log('获取版本文件夹version.manifest失败，使用配置版本检查', { error });
                const remoteManifestUrl = baseUrl + '/' + version + '/project.manifest';
                this._checkRemoteManifest(remoteManifestUrl, localManifest, bundleName);
            });
    }

    /**
     * 检查远程manifest并比较版本
     */
    private _checkRemoteManifest(
        remoteManifestUrl: string,
        localManifest: any,
        bundleName: string
    ): void {
        this._log('开始下载远程manifest', { bundleName, remoteManifestUrl });

        fetch(remoteManifestUrl)
            .then((resp: Response) => {
                this._log('远程manifest下载响应', {
                    bundleName,
                    status: resp.status,
                    statusText: resp.statusText,
                    ok: resp.ok
                });

                if (!resp.ok) {
                    throw new Error(`下载manifest失败: ${resp.status} ${resp.statusText}`);
                }
                return resp.text();
            })
            .then((manifestText: string) => {
                this._log('远程manifest下载成功', {
                    bundleName,
                    manifestLength: manifestText.length
                });

                try {
                    const remoteManifest = JSON.parse(manifestText);
                    const localVersion = localManifest.version;
                    const remoteVersion = remoteManifest.version;

                    this._log('版本比较', {
                        bundleName,
                        localVersion,
                        remoteVersion,
                        versionMatch: localVersion === remoteVersion
                    });

                    // 即使版本号相同，也检查文件是否有差异
                    const needUpdateFiles = zipHotUpdateManager.compareManifests(localManifest, remoteManifest);
                    const hasFileChanges = needUpdateFiles.length > 0;

                    this._log('文件差异检查', {
                        bundleName,
                        localVersion,
                        remoteVersion,
                        versionMatch: localVersion === remoteVersion,
                        hasFileChanges,
                        changedFilesCount: needUpdateFiles.length
                    });

                    if (localVersion === remoteVersion && !hasFileChanges) {
                        // 版本号相同且文件无差异，已是最新版本
                        this._log('已是最新版本，无需更新', {
                            bundleName,
                            version: localVersion,
                            reason: '版本号相同且文件无差异'
                        });
                        this._notifyState(GGHotUpdateInstanceState.CheckUpdateSucAlreadyUpToDate);
                    } else {
                        // 版本号不同或文件有差异，需要更新
                        const updateReason = localVersion !== remoteVersion
                            ? `版本号不同 (${localVersion} -> ${remoteVersion})`
                            : `版本号相同但文件有差异 (${needUpdateFiles.length} 个文件)`;

                        this._log('发现需要更新', {
                            bundleName,
                            localVersion,
                            remoteVersion,
                            updateReason,
                            changedFilesCount: needUpdateFiles.length,
                            updateType: '将根据manifest判断使用完整zip或散文件更新'
                        });
                        this._notifyState(GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound);
                    }
                } catch (error) {
                    this._error('解析远程manifest失败', `bundleName:${bundleName}  error:${error instanceof Error ? error.message : String(error)} `);
                    this._notifyState(GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteProjectManifestError);
                }
            })
            .catch((error) => {
                this._error('获取远程manifest失败', `bundleName:${bundleName}  error:${error instanceof Error ? error.message : String(error)}  remoteManifestUrl:${remoteManifestUrl}`);
                this._notifyState(GGHotUpdateInstanceState.CheckUpdateFailedDownloadRemoteProjectManifestError);
            });
    }

    /**
     * 通知状态变化（通过GGHotUpdateInstanceObserver回调）
     */
    private _notifyState(state: GGHotUpdateInstanceState): void {
        if (this._ggHotUpdateInstance) {
            const stateName = GGHotUpdateInstanceState[state] || `Unknown(${state})`;
            this._log('通知状态变化', `state:${state}  stateName:${stateName}  bundleName:${this._ggHotUpdateInstance.name}`);

            // 使用类型断言访问私有属性来更新状态
            (this._ggHotUpdateInstance as any)._state = state;
            this.onGGHotUpdateInstanceCallBack(this._ggHotUpdateInstance);
        } else {
            this._warn('无法通知状态变化：_ggHotUpdateInstance为null', { state });
        }
    }

    /**
     * 通知下载进度（通过GGHotUpdateInstanceObserver回调）
     */
    private _notifyProgress(downloadedBytes: number, totalBytes: number): void {
        if (this._ggHotUpdateInstance) {
            // 使用类型断言访问私有属性来更新状态和进度
            (this._ggHotUpdateInstance as any)._state = GGHotUpdateInstanceState.HotUpdateInProgress;
            (this._ggHotUpdateInstance as any)._totalBytes = totalBytes;
            (this._ggHotUpdateInstance as any)._downloadedBytes = downloadedBytes;

            // 详细进度日志（受开关控制，避免日志过多）
            if (Config.hotUpdateLogEnabled) {
                const progress = totalBytes > 0 ? (downloadedBytes / totalBytes * 100).toFixed(2) : '0.00';
                this._log('通知下载进度', {
                    bundleName: this._ggHotUpdateInstance.name,
                    progress: `${progress}%`,
                    downloaded: `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
                });
            }

            this.onGGHotUpdateInstanceCallBack(this._ggHotUpdateInstance);
        } else {
            this._warn('无法通知下载进度：_ggHotUpdateInstance为null', { downloadedBytes, totalBytes });
        }
    }

    /**
     * 使用压缩包热更新下载（基于GGHotUpdateInstanceObserver回调）
     */
    private _downloadZipUpdateWithObserver(
        bundleName: string | GGHotUpdateInstanceEnum,
        version: string,
        baseUrl: string,
        instance: GGHotUpdateInstance
    ): void {
        this._log('开始压缩包热更新（基于Observer）', {
            bundleName,
            version,
            baseUrl,
            updateStrategy: '智能更新（首次完整zip，其他散文件更新）'
        });

        // 开始智能更新
        zipHotUpdateManager.smartUpdate(
            bundleName,
            version,
            baseUrl,
            (progress, downloadedBytes, totalBytes) => {
                // 更新进度
                if (this.onProgressCallback) {
                    this.onProgressCallback(progress * 100, downloadedBytes, totalBytes);
                }

                if (this.progressBar) {
                    this.progressBar.progress = progress;
                }

                // 更新GGHotUpdateInstance状态，触发回调
                this._notifyProgress(downloadedBytes, totalBytes);

                // 详细进度日志（受开关控制）
                if (Config.hotUpdateLogEnabled) {
                    this._log('更新进度', {
                        bundleName,
                        progress: `${(progress * 100).toFixed(2)}%`,
                        downloaded: `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                        total: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
                        remaining: `${((totalBytes - downloadedBytes) / 1024 / 1024).toFixed(2)} MB`
                    });
                }
            }
        ).then((success) => {
            if (success) {
                this._log('压缩包热更新成功', {
                    bundleName,
                    version,
                    nextStep: '更新搜索路径并更新其他bundle'
                });

                // 更新搜索路径
                zipHotUpdateManager.updateSearchPath(bundleName);
                this._log('搜索路径已更新', { bundleName });

                // 保存版本号
                this.saveLocalVersion(version);
                this._log('版本号已保存', { version });

                // 更新其他bundle
                this._updateOtherBundles(version).then(() => {
                    this._log('所有bundle更新完成', { bundleName, version });
                    // 所有更新完成，触发成功回调
                    this._notifyState(GGHotUpdateInstanceState.HotUpdateSuc);
                }).catch((error) => {
                    this._warn('其他bundle更新失败，但主包已成功', { error });
                    // 即使其他bundle更新失败，主包已成功，也认为更新完成
                    this._notifyState(GGHotUpdateInstanceState.HotUpdateSuc);
                });
            } else {
                this._error('压缩包热更新失败', `bundleName:${bundleName}  version:${version}`);
                this._notifyState(GGHotUpdateInstanceState.HotUpdateFailed);
            }
        }).catch((error) => {
            this._error('压缩包热更新异常', `bundleName:${bundleName}  version:${version}  error:${error instanceof Error ? error.message : String(error)}`);
            this._notifyState(GGHotUpdateInstanceState.HotUpdateFailed);
        });
    }

    /**
     * 下载压缩包更新（智能更新：首次完整zip，其他情况散文件更新）
     * 包括主包和其他bundle（如hall等）
     * 注意：此方法保留用于非Observer模式，如果使用Observer模式，请使用_downloadZipUpdateWithObserver
     */
    private _downloadZipUpdate(): void {
        const mainBundleName = GGHotUpdateInstanceEnum.BuildIn;
        const version = Config.hotupdate_version;

        log('[GameLaunch] 开始智能更新主包', { bundleName: mainBundleName, version });

        // 1. 先更新主包
        zipHotUpdateManager.smartUpdate(
            mainBundleName,
            version,
            Config.hotupdateBaseUrl,
            (progress, downloadedBytes, totalBytes) => {
                // 更新进度（主包占80%）
                const mainProgress = progress * 0.8;
                if (this.onProgressCallback) {
                    this.onProgressCallback(mainProgress * 100, downloadedBytes, totalBytes);
                }

                if (this.progressBar) {
                    this.progressBar.progress = mainProgress;
                }
                log('[GameLaunch] 主包更新进度', {
                    progress: `${(progress * 100).toFixed(2)}%`,
                    downloaded: `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
                });
            }
        ).then((success) => {
            if (success) {
                log('[GameLaunch] 主包更新成功');

                // 更新主包搜索路径
                zipHotUpdateManager.updateSearchPath(mainBundleName);

                // 保存版本号
                this.saveLocalVersion(version);

                // 2. 更新其他bundle（如hall等）
                this._updateOtherBundles(version).then(() => {
                    // 所有更新完成
                    this._onZipHotUpdateComplete(EventCode.UPDATE_FINISHED);
                }).catch((error) => {
                    console.error('[GameLaunch] 其他bundle更新失败', error);
                    // 即使其他bundle更新失败，主包已成功，也认为更新完成
                    this._onZipHotUpdateComplete(EventCode.UPDATE_FINISHED);
                });
            } else {
                console.error('[GameLaunch] 主包更新失败');
                this._onZipHotUpdateComplete(EventCode.ERROR_UPDATING, '主包更新失败');
            }
        }).catch((error) => {
            console.error('[GameLaunch] 主包更新异常', error);
            this._onZipHotUpdateComplete(EventCode.ERROR_UPDATING, error?.message || '主包更新失败');
        });
    }

    /**
     * 更新其他bundle（如hall等）
     */
    private _updateOtherBundles(version: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 定义需要更新的其他bundle列表
            // 其他bundle：hall、resources等
            // 注意：resources 是 Cocos Creator 的内置 bundle，通常包含在 build-in 中
            // 如果 resources 是独立的 bundle，需要在这里添加
            const otherBundles = ['hall']; // 可以根据需要添加其他bundle，如 'resources'

            if (otherBundles.length === 0) {
                this._log('没有其他bundle需要更新');
                resolve();
                return;
            }

            // 先获取服务器上的最新版本（从根目录的version.manifest）
            const baseUrl = Config.hotupdateBaseUrl;
            const rootVersionManifestUrl = baseUrl + '/version.manifest';

            this._log('获取最新版本信息（用于更新子包）', {
                rootVersionManifestUrl,
                configVersion: version
            });

            fetch(rootVersionManifestUrl)
                .then((resp: Response) => {
                    if (resp.ok) {
                        return resp.text().then((text: string) => {
                            try {
                                const versionManifest = JSON.parse(text);
                                const latestVersion = versionManifest.version;
                                this._log('获取到最新版本', {
                                    latestVersion,
                                    configVersion: version,
                                    willUse: latestVersion
                                });

                                // 使用最新版本更新子包
                                this._updateBundlesWithVersion(otherBundles, latestVersion, resolve, reject);
                            } catch (error) {
                                this._log('解析version.manifest失败，使用配置版本', { error });
                                // 回退到使用配置版本
                                this._updateBundlesWithVersion(otherBundles, version, resolve, reject);
                            }
                        });
                    } else {
                        // version.manifest 不存在，使用配置版本
                        this._log('version.manifest不存在，使用配置版本', {
                            status: resp.status,
                            configVersion: version
                        });
                        this._updateBundlesWithVersion(otherBundles, version, resolve, reject);
                    }
                })
                .catch((error) => {
                    // version.manifest 获取失败，使用配置版本
                    this._log('获取version.manifest失败，使用配置版本', { error });
                    this._updateBundlesWithVersion(otherBundles, version, resolve, reject);
                });
        });
    }

    /**
     * 使用指定版本更新bundle列表
     */
    private _updateBundlesWithVersion(
        otherBundles: string[],
        version: string,
        resolve: () => void,
        reject: (error: any) => void
    ): void {
        this._log('开始更新其他bundle', {
            bundles: otherBundles,
            version,
            count: otherBundles.length
        });

        let completedCount = 0;
        let hasError = false;

        // 并行更新所有其他bundle
        otherBundles.forEach((bundleName) => {
            this._log('开始更新bundle', { bundleName, version });

            zipHotUpdateManager.smartUpdate(
                bundleName,
                version,
                Config.hotupdateBaseUrl,
                (progress, downloadedBytes, totalBytes) => {
                    // 更新进度（其他bundle占20%，平均分配）
                    const bundleProgress = 0.8 + (progress * 0.2 / otherBundles.length) +
                        (completedCount * 0.2 / otherBundles.length);

                    if (this.progressBar) {
                        this.progressBar.progress = bundleProgress;
                    }

                    if (Config.hotUpdateLogEnabled) {
                        this._log('bundle更新进度', {
                            bundleName,
                            progress: `${(progress * 100).toFixed(2)}%`,
                            overallProgress: `${(bundleProgress * 100).toFixed(2)}%`,
                            downloaded: `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                            total: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
                        });
                    }
                }
            )
                .then((success) => {
                    completedCount++;

                    if (success) {
                        this._log('bundle更新成功', {
                            bundleName,
                            completed: `${completedCount}/${otherBundles.length}`
                        });
                        // 更新搜索路径
                        zipHotUpdateManager.updateSearchPath(bundleName);
                        this._log('bundle搜索路径已更新', { bundleName });
                    } else {
                        this._warn('bundle更新失败', {
                            bundleName,
                            completed: `${completedCount}/${otherBundles.length}`
                        });
                        hasError = true;
                    }

                    // 所有bundle更新完成
                    if (completedCount >= otherBundles.length) {
                        if (hasError) {
                            this._warn('部分bundle更新失败，但继续执行', {
                                totalBundles: otherBundles.length,
                                completedCount
                            });
                        } else {
                            this._log('所有bundle更新成功', {
                                totalBundles: otherBundles.length
                            });
                        }
                        resolve();
                    }
                }).catch((error) => {
                    completedCount++;
                    this._error('bundle更新异常', `bundleName:${bundleName}  error:${error instanceof Error ? error.message : String(error)}  completed:${completedCount}/${otherBundles.length}`);
                    hasError = true;

                    // 所有bundle更新完成（包括失败的）
                    if (completedCount >= otherBundles.length) {
                        if (hasError) {
                            this._warn('部分bundle更新失败，但继续执行', {
                                totalBundles: otherBundles.length,
                                completedCount
                            });
                        }
                        resolve(); // 即使有错误也resolve，不影响主流程
                    }
                });
        });
    }

    /**
     * 压缩包热更新完成处理
     */
    private _onZipHotUpdateComplete(code: EventCode, error?: string): void {
        const codeName = EventCode[code] || `Unknown(${code})`;
        this._log('压缩包热更新流程完成', {
            code: code,
            codeName: codeName,
            error: error || null,
            success: code === EventCode.UPDATE_FINISHED || code === EventCode.ALREADY_UP_TO_DATE
        });

        if (code === EventCode.UPDATE_FINISHED) {
            // 热更新成功，重启游戏
            this._log('压缩包热更新成功，准备重启游戏', { code, codeName });
            this._restartGameWithGG();
        } else {
            if (code === EventCode.ALREADY_UP_TO_DATE) {
                this._log('已是最新版本，无需更新', { code, codeName });
                if (this._checkUpdateResolve) {
                    this._checkUpdateResolve(code);
                    this._checkUpdateResolve = null;
                    this._checkUpdateReject = null;
                }
            } else {
                this._log('压缩包热更新流程失败',
                    `code:${code}  codeName:${codeName}  errorString:${error ? String(error) : '无'}`);
                if (this._checkUpdateReject) {
                    this._checkUpdateReject(error);
                    this._checkUpdateResolve = null;
                    this._checkUpdateReject = null;
                }
            }
        }
    }

    /**
     * 使用GG插件检查更新
     */
    private _checkUpdateWithGG(): Promise<EventCode> {
        return new Promise((resolve, reject) => {
            this._log('使用GG插件检查更新（传统模式）');

            if (!this._ggHotUpdateInitialized) {
                const error = new Error('GG插件热更新未初始化');

                reject(error);
                return;
            }

            // 保存Promise回调
            this._checkUpdateResolve = resolve;
            this._checkUpdateReject = reject;

            try {
                const localVersion = this.getLocalVersion();
                this._log('获取热更新实例', {
                    instanceType: GGHotUpdateInstanceEnum.BuildIn,
                    localVersion: localVersion || '无',
                    configVersion: Config.hotupdate_version
                });

                this._ggHotUpdateInstance = ggHotUpdateManager.getInstance(GGHotUpdateInstanceEnum.BuildIn);
                this._ggHotUpdateInstance.register(this);
                this._log('已注册GGHotUpdateInstanceObserver，发起检查更新请求');
                this._ggHotUpdateInstance.checkUpdate();

                this._log('已发起检查更新请求，等待回调');
            } catch (error) {
                this._error('检查更新异常', `error:${error instanceof Error ? error.message : String(error)}  message:${error?.message || '未知错误'}  stack:${error?.stack}`);
                reject(error);
            }
        });
    }

    /**
     * 实现GGHotUpdateInstanceObserver接口
     */
    onGGHotUpdateInstanceCallBack(instance: GGHotUpdateInstance): void {
        const stateName = instance.state || `Unknown(${instance.state})`;
        this._log('收到热更新回调', {
            bundleName: instance.name,
            state: instance.state,
            stateName: stateName,
            totalBytes: instance.totalBytes || 0,
            downloadedBytes: instance.downloadedBytes || 0,
            downloadSpeed: instance.downloadSpeedInSecond || 0,
            remainTime: instance.downloadRemainTimeInSecond || 0,
            useZipHotUpdate: Config.useZipHotUpdate
        });

        switch (instance.state) {
            case GGHotUpdateInstanceState.CheckUpdateSucNewVersionFound:
                this._log('发现新版本，准备开始热更新', {
                    bundleName: instance.name,
                    upType: Config.up_type,
                    isForceUpdate: Config.up_type === 2,
                    useZipHotUpdate: Config.useZipHotUpdate
                });
                if (Config.up_type === 2) {
                    this._warn('检测到强制更新模式，调用强制更新');
                    this.toForceUpdate();
                }
                this._log('开始执行热更新', {
                    bundleName: instance.name,
                    updateMode: Config.useZipHotUpdate ? '压缩包热更新' : '传统热更新'
                });

                // 如果使用压缩包热更新，使用压缩包逻辑
                if (Config.useZipHotUpdate) {
                    const bundleName = GGHotUpdateInstanceEnum.BuildIn;
                    const version = Config.hotupdate_version;
                    const baseUrl = Config.hotupdateBaseUrl;
                    this._downloadZipUpdateWithObserver(bundleName, version, baseUrl, instance);
                } else {
                    // 使用传统热更新
                    this._log('使用传统热更新，调用instance.hotUpdate()');
                    instance.hotUpdate();
                }
                break;
            case GGHotUpdateInstanceState.CheckUpdateSucAlreadyUpToDate:
                this._log('已是最新版本，无需更新', { bundleName: instance.name });
                this._onGGHotUpdateComplete(EventCode.ALREADY_UP_TO_DATE, '已是最新版本');
                break;

            case GGHotUpdateInstanceState.HotUpdateInProgress:
                // 更新进度显示
                const progress = instance.totalBytes > 0
                    ? instance.downloadedBytes / instance.totalBytes * 100
                    : 0;
                if (this.onProgressCallback) {
                    this.onProgressCallback(Number(progress), instance.downloadedBytes, instance.totalBytes);
                }

                // 详细进度日志（受开关控制）
                if (Config.hotUpdateLogEnabled) {
                    this._log('热更新进行中', {
                        bundleName: instance.name,
                        progress: `${progress.toFixed(2)}%`,
                        downloaded: `${(instance.downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                        total: `${(instance.totalBytes / 1024 / 1024).toFixed(2)} MB`,
                        speed: `${(instance.downloadSpeedInSecond / 1024 / 1024).toFixed(2)} MB/s`,
                        remainTime: `${instance.downloadRemainTimeInSecond || 0} 秒`
                    });
                }

                // 更新进度条
                if (this.progressBar) {
                    this.progressBar.progress = instance.totalBytes > 0
                        ? instance.downloadedBytes / instance.totalBytes
                        : 0;
                }
                break;

            case GGHotUpdateInstanceState.HotUpdateSuc:
                this._log('热更新成功完成', {
                    bundleName: instance.name,
                    totalBytes: instance.totalBytes,
                    downloadedBytes: instance.downloadedBytes,
                    totalMB: `${(instance.totalBytes / 1024 / 1024).toFixed(2)} MB`
                });
                this._onGGHotUpdateComplete(EventCode.UPDATE_FINISHED);
                break;

            case GGHotUpdateInstanceState.HotUpdateFailed:
                this._error('热更新失败', `bundleName:${instance.name}  state:${instance.state}  stateName:${stateName}`);
                this._handleHotUpdateRetry(instance);
                break;

            case GGHotUpdateInstanceState.CheckUpdateFailedParseLocalProjectManifestError:
                this._error('检查更新失败：解析本地清单文件错误', `bundleName:${instance.name}  state:${instance.state}  stateName:${stateName}`);
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteVersionManifestError:
                this._error('检查更新失败：解析远程版本清单错误', `bundleName:${instance.name}  state:${instance.state}  stateName:${stateName}`);
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedDownloadRemoteProjectManifestError:
                this._error('检查更新失败：下载远程清单文件错误', `bundleName:${instance.name}  state:${instance.state}  stateName:${stateName}`);
                this._handleCheckUpdateRetry(instance);
                break;
            case GGHotUpdateInstanceState.CheckUpdateFailedParseRemoteProjectManifestError:
                this._error('检查更新失败：解析远程清单文件错误', `bundleName:${instance.name}  state:${instance.state}  stateName:${stateName}`);
                this._handleCheckUpdateRetry(instance);
                break;
            default:
                this._warn('未知状态', {
                    bundleName: instance.name,
                    state: instance.state,
                    stateName: stateName
                });
                break;
        }
    }

    /**
     * GG插件热更新完成处理
     */
    private _onGGHotUpdateComplete(code: EventCode, error?: string): void {
        const codeName = EventCode[code] || `Unknown(${code})`;
        this._log('热更新流程完成', {
            code: code,
            codeName: codeName,
            error: error || null,
            success: code === EventCode.UPDATE_FINISHED || code === EventCode.ALREADY_UP_TO_DATE
        });

        if (this._ggHotUpdateInstance) {
            try {
                this._ggHotUpdateInstance.unregister(this);
                const bundleName = this._ggHotUpdateInstance.name;
                this._ggHotUpdateInstance = null;
                this._log('已取消注册观察者', { bundleName });
            } catch (e) {
                this._warn('取消注册观察者失败', { error: e });
            }
        }

        if (code === EventCode.UPDATE_FINISHED) {
            // 热更新成功，重启游戏
            this._log('热更新成功，准备重启游戏', { code, codeName });
            this._restartGameWithGG();
        } else {
            if (code === EventCode.ALREADY_UP_TO_DATE) {
                const version = Config.hotupdate_version;
                this._log('已是最新版本，保存版本号', { version });
                this.saveLocalVersion(version);
                if (this._checkUpdateResolve) {
                    this._checkUpdateResolve(code);
                    this._checkUpdateResolve = null;
                    this._checkUpdateReject = null;
                }
            } else {
                this._log('热更新流程失败', {
                    code: code,
                    codeName: codeName,
                    errorString: error ? String(error) : '无'
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
        const key = this.LOCAL_VERSION_KEY;
        const version = App.StorageUtils.getLocal(key, '');
        this._log('获取本地版本号', { key, version: version || '无' });
        return version;
    }

    /**
     * 保存本地版本号
     */
    saveLocalVersion(version: string): void {
        const key = this.LOCAL_VERSION_KEY;
        const oldVersion = App.StorageUtils.getLocal(key, '');
        App.StorageUtils.saveLocal(key, version);
        this._log('保存本地版本号', {
            key,
            oldVersion: oldVersion || '无',
            newVersion: version
        });
    }

    /**
     * 使用GG插件重启游戏
     */
    private _restartGameWithGG(): void {
        try {
            // ggHotUpdateManager.restartGame();
            App.PlatformApiMgr.restartApp();
            this._log('已调用重启游戏方法');
        } catch (error) {
            this._error('重启游戏失败，使用备用方法', {
                error: error,
                message: error?.message
            });
            // 回退到原有重启方法
            this._log('使用备用方法重启游戏');
            App.PlatformApiMgr.restartApp();
        }
    }


    /**
     * 处理检查更新重试逻辑
     */
    private _handleCheckUpdateRetry(instance: GGHotUpdateInstance): void {
        const stateName = GGHotUpdateInstanceState[instance.state] || `Unknown(${instance.state})`;

        if (this._checkUpdateRetryCurTimes >= this._checkUpdateRetryMaxTimes) {
            this._error('检查更新失败，已达到最大重试次数', {
                bundleName: instance.name,
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._checkUpdateRetryCurTimes,
                maxRetryTimes: this._checkUpdateRetryMaxTimes
            });

            // 如果是解析本地信息失败导致的检查更新失败，那么可以考虑清除本地的下载缓存目录，以清空所有缓存，提高下次能正确更新的概率
            if (instance.state == GGHotUpdateInstanceState.CheckUpdateFailedParseLocalProjectManifestError) {
                this._warn('检测到本地清单解析失败，清除下载缓存', { bundleName: instance.name });
                try {
                    instance.clearDownloadCache();
                    this._log('已清除下载缓存', { bundleName: instance.name });
                } catch (e) {
                    this._error('清除下载缓存失败', { bundleName: instance.name, error: e });
                }
            }
            this._onGGHotUpdateComplete(EventCode.ERROR_UPDATING, '检查更新失败');
        } else {
            this._checkUpdateRetryCurTimes++;
            this._warn('检查更新失败，准备重试', {
                bundleName: instance.name,
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._checkUpdateRetryCurTimes,
                maxRetryTimes: this._checkUpdateRetryMaxTimes,
                retryInterval: this._checkUpdateRetryIntervalInSecond
            });

            this.scheduleOnce(() => {
                this._log('开始重试检查更新', {
                    bundleName: instance.name,
                    retryTimes: this._checkUpdateRetryCurTimes,
                    maxRetryTimes: this._checkUpdateRetryMaxTimes
                });
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
            this._error('热更新失败，已达到最大重试次数', {
                bundleName: instance.name,
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._hotUpdateRetryCurTimes,
                maxRetryTimes: this._hotUpdateRetryMaxTimes
            });
            this._onGGHotUpdateComplete(EventCode.UPDATE_FAILED, '热更新失败');
        } else {
            this._hotUpdateRetryCurTimes++;
            this._warn('热更新失败，准备重试', {
                bundleName: instance.name,
                state: instance.state,
                stateName: stateName,
                currentRetryTimes: this._hotUpdateRetryCurTimes,
                maxRetryTimes: this._hotUpdateRetryMaxTimes,
                retryInterval: this._hotUpdateRetryIntervalInSecond
            });

            this.scheduleOnce(() => {
                this._log('开始重试热更新', {
                    bundleName: instance.name,
                    retryTimes: this._hotUpdateRetryCurTimes,
                    maxRetryTimes: this._hotUpdateRetryMaxTimes
                });
                instance.hotUpdate();
            }, this._hotUpdateRetryIntervalInSecond);
        }
    }
}