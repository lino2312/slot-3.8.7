import { native, path, sys } from "cc";
import { JSB } from "cc/env";
import { GGHotUpdateInstanceEnum, ProjectManifest } from "db://gg-hot-update/scripts/hotupdate/GGHotUpdateType";
import { Config } from "db://assets/scripts/config/Config";

/**
 * 压缩包热更新管理器配置
 */
export interface ZipHotUpdateManagerConfig {
    /** 是否打印调试日志 */
    enableLog?: boolean;
}

/**
 * 压缩包热更新管理器
 * 
 * 功能：
 * 1. 下载zip压缩包
 * 2. 解压到指定目录
 * 3. 更新搜索路径
 * 4. 支持进度回调
 */
class ZipHotUpdateManager {
    private _enableLog: boolean = false;
    private _localRootDirPath: string = "";
    private _downloader: native.Downloader | null = null;
    private _initialized: boolean = false;

    /**
     * 初始化压缩包热更新管理器
     */
    init(config: ZipHotUpdateManagerConfig): void {
        // 优先使用Config中的日志开关，如果没有配置则使用传入的enableLog
        // 如果Config存在且hotUpdateLogEnabled已设置，则使用Config的值；否则使用传入的enableLog
        if (typeof Config !== 'undefined' && Config.hotUpdateLogEnabled !== undefined) {
            this._enableLog = Config.hotUpdateLogEnabled;
        } else {
            this._enableLog = config.enableLog ?? false;
        }
        
        this._localRootDirPath = path.join(native.fileUtils.getWritablePath(), "gg-hot-update-zip");
        this._log("初始化压缩包热更新管理器", `localRootDirPath:${this._localRootDirPath}  enableLog:${this._enableLog}`);
    
        // 确保目录存在
        if (!native.fileUtils.isDirectoryExist(this._localRootDirPath)) {
            native.fileUtils.createDirectory(this._localRootDirPath);
        }

        // 恢复之前保存的搜索路径
        this._restoreSearchPaths();

        // 初始化下载器
        if (JSB) {
            this._downloader = new native.Downloader();
        }

        this._initialized = true;
        this._log("初始化完成", { 
            localRootDirPath: this._localRootDirPath,
            enableLog: this._enableLog
        });
    }

    /**
     * 获取压缩包URL
     * 
     * @param bundleName Bundle名称，主包使用 'build-in' 或 GGHotUpdateInstanceEnum.BuildIn
     * @param version 版本号
     * @param baseUrl 基础URL
     * @returns 压缩包完整URL
     */
    getZipUrl(bundleName: string | GGHotUpdateInstanceEnum, version: string, baseUrl: string): string {
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            return `${baseUrl}/${version}/update.zip`;
        } else {
            return `${baseUrl}/${version}/assets/${bundleName}/${bundleName}.zip`;
        }
    }

    /**
     * 获取Bundle的解压路径
     * 
     * @param bundleName Bundle名称
     * @returns 解压目录路径
     */
    getBundleExtractPath(bundleName: string | GGHotUpdateInstanceEnum): string {
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            return path.join(this._localRootDirPath, "build-in");
        } else {
            return path.join(this._localRootDirPath, "assets", bundleName as string);
        }
    }

    /**
     * 获取压缩包本地存储路径
     * 
     * @param bundleName Bundle名称
     * @returns 压缩包本地路径
     */
    getZipLocalPath(bundleName: string | GGHotUpdateInstanceEnum): string {
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            return path.join(this._localRootDirPath, "build-in.zip");
        } else {
            return path.join(this._localRootDirPath, `${bundleName}.zip`);
        }
    }

    /**
     * 获取本地manifest路径
     */
    private _getLocalManifestPath(bundleName: string | GGHotUpdateInstanceEnum): string {
        const extractPath = this.getBundleExtractPath(bundleName);
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            return path.join(extractPath, "project.manifest");
        } else {
            return path.join(extractPath, "project.manifest");
        }
    }

    /**
     * 获取远程manifest URL
     */
    private _getRemoteManifestUrl(bundleName: string | GGHotUpdateInstanceEnum, version: string, baseUrl: string): string {
        let manifestUrl: string;
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            manifestUrl = `${baseUrl}/${version}/project.manifest`;
        } else {
            manifestUrl = `${baseUrl}/${version}/assets/${bundleName}/project.manifest`;
        }
        this._log("生成manifest URL", { 
            bundleName, 
            version, 
            baseUrl, 
            manifestUrl,
            urlPattern: bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in' 
                ? `${baseUrl}/${version}/project.manifest` 
                : `${baseUrl}/${version}/assets/${bundleName}/project.manifest`
        });
        return manifestUrl;
    }

    /**
     * 检查本地是否有该bundle的manifest
     * 用于判断该bundle是否首次更新
     */
    hasLocalManifest(bundleName: string | GGHotUpdateInstanceEnum): boolean {
        const manifestPath = this._getLocalManifestPath(bundleName);
        const exists = native.fileUtils.isFileExist(manifestPath);
        this._log("检查bundle manifest", { 
            bundleName, 
            manifestPath, 
            exists,
            isFirstUpdate: !exists 
        });
        return exists;
    }

    /**
     * 判断该bundle是否首次更新
     * 
     * @param bundleName Bundle名称
     * @returns true表示首次更新（需要下载完整zip），false表示已有manifest（使用散文件更新）
     */
    isFirstUpdate(bundleName: string | GGHotUpdateInstanceEnum): boolean {
        const isFirst = !this.hasLocalManifest(bundleName);
        this._log("判断bundle是否首次更新", { 
            bundleName, 
            isFirst,
            updateType: isFirst ? "完整zip" : "散文件更新"
        });
        return isFirst;
    }

    /**
     * 读取本地manifest
     */
    getLocalManifest(bundleName: string | GGHotUpdateInstanceEnum): ProjectManifest | null {
        const manifestPath = this._getLocalManifestPath(bundleName);
        if (!native.fileUtils.isFileExist(manifestPath)) {
            return null;
        }

        try {
            const manifestText = native.fileUtils.getStringFromFile(manifestPath);
            if (manifestText) {
                return JSON.parse(manifestText) as ProjectManifest;
            }
        } catch (error) {
            this._error("读取本地manifest失败", error instanceof Error ? `error:${error.message}  stack:${error.stack || ''}` : String(error));
        }
        return null;
    }

    /**
     * 下载并解析远程manifest
     */
    private _fetchRemoteManifest(bundleName: string | GGHotUpdateInstanceEnum, version: string, baseUrl: string): Promise<ProjectManifest | null> {
        return new Promise((resolve) => {
            const manifestUrl = this._getRemoteManifestUrl(bundleName, version, baseUrl);
            this._log("下载远程manifest", { 
                manifestUrl,
                bundleName,
                version,
                baseUrl,
                urlDetails: {
                    fullUrl: manifestUrl,
                    protocol: manifestUrl.startsWith('http://') ? 'http' : manifestUrl.startsWith('https://') ? 'https' : 'unknown',
                    host: manifestUrl.match(/https?:\/\/([^\/]+)/)?.[1] || 'unknown',
                    path: manifestUrl.replace(/https?:\/\/[^\/]+/, '')
                }
            });

            fetch(manifestUrl)
                .then((resp: Response) => {
                    this._log("manifest下载响应", { 
                        status: resp.status, 
                        statusText: resp.statusText,
                        ok: resp.ok,
                        url: manifestUrl
                    });
                    if (!resp.ok) {
                        this._error("下载manifest失败", `status:${resp.status}  statusText:${resp.statusText}  url:${manifestUrl}  bundleName:${bundleName}  version:${version}  baseUrl:${baseUrl}`);
                        resolve(null);
                        return;
                    }
                    return resp.text();
                })
                .then((manifestText: string | null) => {
                    if (!manifestText) {
                        this._error("manifest内容为空", `url:${manifestUrl}`);
                        resolve(null);
                        return;
                    }

                    this._log("manifest下载成功，开始解析", { 
                        url: manifestUrl,
                        contentLength: manifestText.length,
                        preview: manifestText.substring(0, 200)
                    });

                    try {
                        const manifest = JSON.parse(manifestText) as ProjectManifest;
                        this._log("解析远程manifest成功", { 
                            version: manifest.version,
                            assetCount: Object.keys(manifest.assets || {}).length,
                            url: manifestUrl
                        });
                        resolve(manifest);
                    } catch (error) {
                        this._error("解析远程manifest失败", `error:${error instanceof Error ? error.message : String(error)}  errorMessage:${error?.message || ''}  url:${manifestUrl}  contentPreview:${manifestText.substring(0, 500)}`);
                        resolve(null);
                    }
                })
                .catch((error) => {
                    this._error("获取远程manifest异常", `error:${error instanceof Error ? error.message : String(error)}  errorMessage:${error?.message || ''}  errorStack:${error?.stack || ''}  url:${manifestUrl}  bundleName:${bundleName}  version:${version}  baseUrl:${baseUrl}`);
                    resolve(null);
                });
        });
    }

    /**
     * 比较manifest，获取需要更新的文件列表
     */
    compareManifests(localManifest: ProjectManifest, remoteManifest: ProjectManifest): string[] {
        const needUpdateFiles: string[] = [];

        // 遍历远程manifest，找出需要更新的文件
        Object.keys(remoteManifest.assets).forEach((filePath) => {
            const remoteAsset = remoteManifest.assets[filePath];
            const localAsset = localManifest.assets[filePath];

            // 如果本地没有该文件，或者文件大小或md5不同，则需要更新
            if (!localAsset || 
                localAsset.size !== remoteAsset.size || 
                localAsset.md5 !== remoteAsset.md5) {
                needUpdateFiles.push(filePath);
            }
        });

        return needUpdateFiles;
    }

    /**
     * 判断是否为子游戏bundle
     */
    private _isSubGame(bundleName: string | GGHotUpdateInstanceEnum): boolean {
        if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
            return false;
        }
        const subGames = ['JungleDelight', 'ThePanda', 'Diamond777', 'Crazy777I', 'GemsFrotuneI', 'GemsFrotuneII', 'Super777I', 'MoneyComing'];
        return subGames.includes(bundleName as string);
    }

    /**
     * 智能更新：根据bundle类型决定使用完整zip还是散文件更新
     * 
     * 策略：
     * - 子游戏：只使用散文件更新（不生成zip）
     * - 其他bundle：首次更新使用完整zip，后续使用散文件更新
     * 
     * @param bundleName Bundle名称（主包：'build-in'，子包：'hall'、'Diamond777'等）
     * @param version 版本号
     * @param baseUrl 基础URL
     * @param onProgress 进度回调
     * @param onFileProgress 文件下载进度回调（用于散文件更新）
     * @returns Promise<boolean> 是否成功
     */
    async smartUpdate(
        bundleName: string | GGHotUpdateInstanceEnum,
        version: string,
        baseUrl: string,
        onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void,
        onFileProgress?: (filePath: string, progress: number) => void
    ): Promise<boolean> {
        const isSubGameBundle = this._isSubGame(bundleName);
        const isFirst = this.isFirstUpdate(bundleName);
        
        // 子游戏只使用散文件更新（不生成zip）
        if (isSubGameBundle) {
            this._log("子游戏更新策略", { 
                bundleName, 
                version,
                isFirst,
                updateType: "散文件更新（子游戏不生成zip）"
            });
            
            // 子游戏：即使首次更新也使用散文件
            // 先下载远程manifest
            const remoteManifest = await this._fetchRemoteManifest(bundleName, version, baseUrl);
            if (!remoteManifest) {
                this._error("获取远程manifest失败", `bundleName:${bundleName}  version:${version}  baseUrl:${baseUrl}`);
                return false;
            }
            
            // 获取需要下载的文件列表
            let needUpdateFiles: string[] = [];
            if (isFirst) {
                // 首次更新：下载所有文件
                needUpdateFiles = Object.keys(remoteManifest.assets);
                this._log("子游戏首次更新，将下载所有文件", { 
                    bundleName,
                    totalFiles: needUpdateFiles.length
                });
            } else {
                // 后续更新：比较manifest获取差异文件
                const localManifest = this.getLocalManifest(bundleName);
                if (!localManifest) {
                    this._log("读取本地manifest失败，将下载所有文件", { bundleName });
                    needUpdateFiles = Object.keys(remoteManifest.assets);
                } else {
                    needUpdateFiles = this.compareManifests(localManifest, remoteManifest);
                }
            }
            
            if (needUpdateFiles.length === 0) {
                this._log("无需更新，已是最新版本", { bundleName });
                // 确保manifest已保存
                const manifestPath = this._getLocalManifestPath(bundleName);
                const manifestDir = path.dirname(manifestPath);
                if (!native.fileUtils.isDirectoryExist(manifestDir)) {
                    native.fileUtils.createDirectory(manifestDir);
                }
                native.fileUtils.writeStringToFile(JSON.stringify(remoteManifest, null, 2), manifestPath);
                return true;
            }
            
            // 计算需要更新的文件总大小
            let totalBytes = 0;
            needUpdateFiles.forEach((filePath) => {
                const asset = remoteManifest.assets[filePath];
                if (asset) {
                    totalBytes += asset.size;
                }
            });
            
            // 散文件更新：逐个下载差异文件
            this._log("开始子游戏散文件更新", { 
                bundleName, 
                diffFiles: needUpdateFiles.length,
                totalDiffSize: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
            });
            
            return await this._downloadDiffFiles(bundleName, version, baseUrl, needUpdateFiles, remoteManifest, onProgress, onFileProgress);
        }
        
        // 其他bundle：首次zip，后续散文件
        this._log("智能更新策略", { 
            bundleName, 
            version,
            isFirst,
            updateType: isFirst ? "首次更新（完整zip）" : "后续更新（散文件）"
        });
        
        if (isFirst) {
            // 首次更新：下载完整zip
            const zipUrl = this.getZipUrl(bundleName, version, baseUrl);
            const success = await this.downloadAndExtract(zipUrl, bundleName, onProgress);
            
            // 解压完成后，确保manifest文件存在
            if (success) {
                const manifestPath = this._getLocalManifestPath(bundleName);
                if (!native.fileUtils.isFileExist(manifestPath)) {
                    // 如果zip解压后manifest不存在，从远程下载manifest并保存
                    const remoteManifest = await this._fetchRemoteManifest(bundleName, version, baseUrl);
                    if (remoteManifest) {
                        // 确保目录存在
                        const manifestDir = path.dirname(manifestPath);
                        if (!native.fileUtils.isDirectoryExist(manifestDir)) {
                            native.fileUtils.createDirectory(manifestDir);
                        }
                        native.fileUtils.writeStringToFile(JSON.stringify(remoteManifest, null, 2), manifestPath);
                        this._log("已从远程下载并保存manifest", { manifestPath, version: remoteManifest.version });
                    } else {
                        this._error("无法从远程获取manifest", `bundleName:${bundleName}  version:${version}  baseUrl:${baseUrl}`);
                    }
                } else {
                    this._log("manifest文件已存在（zip解压后）", { manifestPath });
                }
            }
            
            return success;
        }

        // 其他情况：使用散文件更新（该bundle已有manifest）
        const localManifest = this.getLocalManifest(bundleName);
        if (!localManifest) {
            this._error("读取本地manifest失败，回退到完整zip下载", { bundleName });
            const zipUrl = this.getZipUrl(bundleName, version, baseUrl);
            const success = await this.downloadAndExtract(zipUrl, bundleName, onProgress);
            
            // 解压完成后，确保manifest文件存在（与首次更新逻辑一致）
            if (success) {
                const manifestPath = this._getLocalManifestPath(bundleName);
                if (!native.fileUtils.isFileExist(manifestPath)) {
                    // 如果zip解压后manifest不存在，从远程下载manifest并保存
                    const remoteManifest = await this._fetchRemoteManifest(bundleName, version, baseUrl);
                    if (remoteManifest) {
                        // 确保目录存在
                        const manifestDir = path.dirname(manifestPath);
                        if (!native.fileUtils.isDirectoryExist(manifestDir)) {
                            native.fileUtils.createDirectory(manifestDir);
                        }
                        native.fileUtils.writeStringToFile(JSON.stringify(remoteManifest, null, 2), manifestPath);
                        this._log("已从远程下载并保存manifest", { manifestPath, version: remoteManifest.version });
                    } else {
                        this._error("无法从远程获取manifest", `bundleName:${bundleName}  version:${version}  baseUrl:${baseUrl}`);
                    }
                } else {
                    this._log("manifest文件已存在（zip解压后）", { manifestPath });
                }
            }
            
            return success;
        }

        // 下载远程manifest
        const remoteManifest = await this._fetchRemoteManifest(bundleName, version, baseUrl);
        if (!remoteManifest) {
            this._error("获取远程manifest失败，回退到完整zip下载");
            const zipUrl = this.getZipUrl(bundleName, version, baseUrl);
            const success = await this.downloadAndExtract(zipUrl, bundleName, onProgress);
            
            // 解压完成后，检查manifest文件是否存在
            // zip文件中应该已包含manifest，如果不存在说明zip文件有问题
            if (success) {
                const manifestPath = this._getLocalManifestPath(bundleName);
                if (!native.fileUtils.isFileExist(manifestPath)) {
                    this._error("zip解压后manifest不存在，zip文件可能不完整", { manifestPath, bundleName });
                    // 注意：这里不再尝试从远程获取，因为已经失败过一次
                } else {
                    this._log("manifest文件已存在（zip解压后）", { manifestPath });
                }
            }
            
            return success;
        }

        // 比较manifest，获取需要更新的文件
        const needUpdateFiles = this.compareManifests(localManifest, remoteManifest);
        
        if (needUpdateFiles.length === 0) {
            this._log("无需更新，已是最新版本", { bundleName });
            return true;
        }

        // 计算需要更新的文件总大小
        let totalBytes = 0;
        needUpdateFiles.forEach((filePath) => {
            const asset = remoteManifest.assets[filePath];
            if (asset) {
                totalBytes += asset.size;
            }
        });

        // 散文件更新：逐个下载差异文件
        this._log("开始散文件更新", { 
            bundleName, 
            diffFiles: needUpdateFiles.length,
            totalDiffSize: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
        });

        return await this._downloadDiffFiles(bundleName, version, baseUrl, needUpdateFiles, remoteManifest, onProgress, onFileProgress);
    }

    /**
     * 下载差异文件（散文件更新）
     */
    private _downloadDiffFiles(
        bundleName: string | GGHotUpdateInstanceEnum,
        version: string,
        baseUrl: string,
        fileList: string[],
        remoteManifest: ProjectManifest,
        onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void,
        onFileProgress?: (filePath: string, progress: number) => void
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const extractPath = this.getBundleExtractPath(bundleName);
            let totalBytes = 0;
            let downloadedBytes = 0;
            let completedFiles = 0;
            const downloadTasks: native.DownloadTask[] = [];

            // 计算总大小
            fileList.forEach((filePath) => {
                const asset = remoteManifest.assets[filePath];
                if (asset) {
                    totalBytes += asset.size;
                }
            });

            // 创建下载任务
            fileList.forEach((filePath) => {
                // 构建散文件下载URL
                // 主包: {baseUrl}/{version}/files/{filePath}
                // 子包（包括子游戏）: {baseUrl}/{version}/assets/{bundleName}/files/{filePath}
                let remoteUrl: string;
                if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
                    remoteUrl = `${baseUrl}/${version}/files/${filePath}`;
                } else {
                    // 所有子包都使用 files/ 目录
                    remoteUrl = `${baseUrl}/${version}/assets/${bundleName}/files/${filePath}`;
                }
                const localPath = path.join(extractPath, filePath);
                
                // 确保父目录存在
                const parentDir = path.dirname(localPath);
                if (!native.fileUtils.isDirectoryExist(parentDir)) {
                    native.fileUtils.createDirectory(parentDir);
                }

                const task: native.DownloadTask = {
                    identifier: filePath,
                    requestURL: remoteUrl,
                    storagePath: localPath,
                };
                downloadTasks.push(task);
            });

            if (downloadTasks.length === 0) {
                resolve(true);
                return;
            }

            // 设置下载回调
            this._downloader!.onProgress = (task: native.DownloadTask, bytesReceived: number, totalBytesReceived: number, totalBytesExpected: number) => {
                // 更新单个文件的下载进度
                if (onFileProgress) {
                    const fileProgress = totalBytesExpected > 0 ? totalBytesReceived / totalBytesExpected : 0;
                    onFileProgress(task.identifier, fileProgress);
                }

                // 更新总体进度
                downloadedBytes += bytesReceived;
                const overallProgress = totalBytes > 0 ? downloadedBytes / totalBytes : 0;
                if (onProgress) {
                    onProgress(overallProgress, downloadedBytes, totalBytes);
                }
            };

            this._downloader!.onSuccess = (task: native.DownloadTask) => {
                completedFiles++;
                this._log("文件下载成功", { file: task.identifier, completed: `${completedFiles}/${downloadTasks.length}` });

                if (completedFiles >= downloadTasks.length) {
                    this._log("增量更新完成", { 
                        totalFiles: downloadTasks.length,
                        totalSize: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
                    });
                    
                    // 保存新的manifest
                    const manifestPath = this._getLocalManifestPath(bundleName);
                    const manifestDir = path.dirname(manifestPath);
                    if (!native.fileUtils.isDirectoryExist(manifestDir)) {
                        native.fileUtils.createDirectory(manifestDir);
                    }
                    native.fileUtils.writeStringToFile(JSON.stringify(remoteManifest, null, 2), manifestPath);
                    this._log("已保存manifest", { manifestPath, bundleName });
                    
                    // 验证关键文件是否存在（cc.config.json）
                    const extractPath = this.getBundleExtractPath(bundleName);
                    let hasConfigFile = false;
                    try {
                        const files = native.fileUtils.listFiles(extractPath);
                        for (const file of files) {
                            if (file.includes("cc.config") && file.endsWith(".json")) {
                                hasConfigFile = true;
                                this._log("配置文件已存在", { file, bundleName });
                                break;
                            }
                        }
                    } catch (error) {
                        this._log("无法列出目录内容", { extractPath, error });
                    }
                    
                    if (!hasConfigFile) {
                        this._log("警告：bundle配置文件（cc.config.json）不存在，可能导致bundle加载失败", { 
                            bundleName, 
                            extractPath,
                            suggestion: "请确保 cc.config.json 在文件列表中并被下载"
                        });
                    }
                    
                    // 更新搜索路径（确保下载的文件可以被找到）
                    this.updateSearchPath(bundleName);
                    
                    resolve(true);
                }
            };

            this._downloader!.onError = (task: native.DownloadTask, errorCode: number, errorCodeInternal: number, errorStr: string) => {
                this._error("文件下载失败", `file:${task.identifier}  error:${errorStr}  code:${errorCode}  internalCode:${errorCodeInternal}`);
                
                // 单个文件失败不影响整体，继续下载其他文件
                completedFiles++;
                if (completedFiles >= downloadTasks.length) {
                    // 即使有失败，也认为更新完成（部分成功）
                    this._log("增量更新完成（部分文件可能失败）", { 
                        totalFiles: downloadTasks.length,
                        completedFiles: completedFiles
                    });
                    
                    // 保存新的manifest（即使部分文件失败）
                    const manifestPath = this._getLocalManifestPath(bundleName);
                    const manifestDir = path.dirname(manifestPath);
                    if (!native.fileUtils.isDirectoryExist(manifestDir)) {
                        native.fileUtils.createDirectory(manifestDir);
                    }
                    native.fileUtils.writeStringToFile(JSON.stringify(remoteManifest, null, 2), manifestPath);
                    this._log("已保存manifest（部分文件可能失败）", { manifestPath, bundleName });
                    
                    // 更新搜索路径（确保已下载的文件可以被找到）
                    this.updateSearchPath(bundleName);
                    
                    resolve(true);
                }
            };

            // 开始下载所有文件（可以并发）
            downloadTasks.forEach((task) => {
                this._downloader!.createDownloadTask(task.requestURL, task.storagePath, task.identifier);
            });
        });
    }

    /**
     * 下载并解压压缩包
     * 
     * @param zipUrl 压缩包URL
     * @param bundleName Bundle名称
     * @param onProgress 进度回调 (progress: number, downloadedBytes: number, totalBytes: number) => void
     * @returns Promise<boolean> 是否成功
     */
    downloadAndExtract(
        zipUrl: string,
        bundleName: string | GGHotUpdateInstanceEnum,
        onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._initialized) {
                const error = new Error("ZipHotUpdateManager 未初始化");
                this._error("下载失败", `error:${error.message}  stack:${error.stack || ''}`);
                reject(error);
                return;
            }

            if (!JSB) {
                const error = new Error("压缩包热更新仅支持原生平台");
                this._error("下载失败", `error:${error.message}  stack:${error.stack || ''}`);
                reject(error);
                return;
            }

            const zipLocalPath = this.getZipLocalPath(bundleName);
            const extractPath = this.getBundleExtractPath(bundleName);
            
            // 用于保存实际下载的文件路径（可能在 onSuccess 中被修改）
            let actualFilePath = zipLocalPath;

            this._log("开始下载压缩包", { 
                zipUrl, 
                zipLocalPath, 
                extractPath,
                urlDetails: {
                    fullUrl: zipUrl,
                    protocol: zipUrl.startsWith('http://') ? 'http' : zipUrl.startsWith('https://') ? 'https' : 'unknown',
                    host: zipUrl.match(/https?:\/\/([^\/]+)/)?.[1] || 'unknown',
                    path: zipUrl.replace(/https?:\/\/[^\/]+/, ''),
                    bundleName: bundleName
                }
            });

            // 确保目录存在
            const zipDir = path.dirname(zipLocalPath);
            if (!native.fileUtils.isDirectoryExist(zipDir)) {
                native.fileUtils.createDirectory(zipDir);
            }

            // 创建下载任务
            let totalBytes = 0;
            let downloadedBytes = 0;
            let isSuccessHandled = false; // 防重复触发标志

            this._downloader!.onProgress = (task: native.DownloadTask, bytesReceived: number, totalBytesReceived: number, totalBytesExpected: number) => {
                // 如果已经处理完成，忽略后续的进度更新
                // 可能是延迟的进度回调，或其他下载任务的进度（散文件更新等）
                if (isSuccessHandled) {
                    // 检查是否是当前任务的进度（通过URL或存储路径匹配）
                    const isCurrentTask = task.requestURL === zipUrl || 
                                         task.storagePath === zipLocalPath ||
                                         (task.storagePath && task.storagePath.includes(bundleName as string));
                    
                    if (isCurrentTask) {
                        // 这是当前任务的延迟进度回调，忽略
                        this._log("下载已完成，忽略延迟的进度更新", {
                            taskURL: task.requestURL,
                            taskStoragePath: task.storagePath,
                            currentProgress: totalBytes > 0 ? `${((totalBytesReceived / totalBytesExpected) * 100).toFixed(2)}%` : "未知",
                            note: "当前zip下载任务已完成，忽略后续进度更新"
                        });
                    }
                    // 无论是当前任务还是其他任务，都已处理完成，直接返回
                    return;
                }
                
                totalBytes = totalBytesExpected;
                downloadedBytes = totalBytesReceived;
                
                const progress = totalBytes > 0 ? downloadedBytes / totalBytes : 0;
                if (onProgress) {
                    onProgress(progress, downloadedBytes, totalBytes);
                }

                this._log("下载进度", {
                    progress: `${(progress * 100).toFixed(2)}%`,
                    downloaded: `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
                    taskURL: task.requestURL,
                    taskStoragePath: task.storagePath
                });
            };

            this._downloader!.onSuccess = (task: native.DownloadTask) => {
                // 防重复触发：如果已经处理过，直接返回
                if (isSuccessHandled) {
                    this._log("下载成功回调已处理，忽略重复触发", {
                        currentProgress: totalBytes > 0 ? `${((downloadedBytes / totalBytes) * 100).toFixed(2)}%` : "未知",
                        downloadedBytes,
                        totalBytes,
                        taskURL: task.requestURL,
                        taskStoragePath: task.storagePath
                    });
                    return;
                }

                // 立即设置标志，防止重复触发（在异步操作之前）
                isSuccessHandled = true;

                this._log("下载成功回调触发", {
                    currentProgress: totalBytes > 0 ? `${((downloadedBytes / totalBytes) * 100).toFixed(2)}%` : "未知",
                    downloadedBytes,
                    totalBytes,
                    taskURL: task.requestURL,
                    taskStoragePath: task.storagePath,
                    note: "将验证文件完整性"
                });
                
                // 检查多个可能的路径
                const possiblePaths = [
                    task.storagePath,
                    zipLocalPath,
                    task.storagePath ? task.storagePath + '.tmp' : null,
                    zipLocalPath + '.tmp',
                    // 检查临时目录
                    path.join(native.fileUtils.getWritablePath(), 'temp', path.basename(zipLocalPath)),
                    path.join(native.fileUtils.getWritablePath(), 'temp', path.basename(zipLocalPath) + '.tmp'),
                ].filter(p => p !== null && p !== undefined) as string[];
                
                this._log("检查可能的文件路径", { possiblePaths });
                
                // 验证文件完整性（文件大小是否匹配）
                const verifyFileIntegrity = (filePath: string): boolean => {
                    if (!native.fileUtils.isFileExist(filePath)) {
                        return false;
                    }
                    
                    try {
                        const fileSize = native.fileUtils.getFileSize(filePath);
                        // 允许1KB的误差（可能是文件系统或下载器的误差）
                        const sizeDifference = Math.abs(fileSize - totalBytes);
                        const isValid = sizeDifference <= 1024 || (totalBytes > 0 && fileSize >= totalBytes * 0.99);
                        
                        this._log("文件完整性验证", {
                            filePath,
                            fileSize,
                            expectedSize: totalBytes,
                            difference: sizeDifference,
                            isValid,
                            fileSizeMB: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
                            expectedSizeMB: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
                        });
                        
                        return isValid;
                    } catch (error) {
                        this._log("无法验证文件完整性", { filePath, error });
                        return false;
                    }
                };

                // 处理下载完成的文件
                const processDownloadedFile = () => {
                    // 如果实际文件路径与预期不同，记录日志
                    if (actualFilePath !== zipLocalPath) {
                        this._log("文件路径与预期不同", { 
                            expected: zipLocalPath,
                            actual: actualFilePath,
                            willUse: actualFilePath
                        });
                    }
                    
                    // 验证文件完整性
                    if (!verifyFileIntegrity(actualFilePath)) {
                        let actualSize = 0;
                        try {
                            actualSize = native.fileUtils.getFileSize(actualFilePath);
                        } catch (e) {
                            // 忽略错误
                        }
                        const error = new Error(`文件完整性验证失败：文件大小不匹配（期望: ${totalBytes} 字节，实际: ${actualSize} 字节）`);
                        this._error("文件完整性验证失败", `filePath:${actualFilePath}  expectedSize:${totalBytes}  actualSize:${actualSize}  error:${error.message}`);
                        reject(error);
                        return;
                    }
                    
                    // 获取文件大小（已验证）
                    try {
                        const fileSize = native.fileUtils.getFileSize(actualFilePath);
                        this._log("压缩包文件信息（已验证）", { 
                            filePath: actualFilePath, 
                            fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
                            fileSizeBytes: fileSize,
                            expectedSize: totalBytes,
                            match: fileSize === totalBytes
                        });
                    } catch (error) {
                        this._log("无法获取文件大小", { actualFilePath, error });
                    }
                    
                    // 如果文件路径不同，可能需要重命名或移动
                    if (actualFilePath !== zipLocalPath) {
                        try {
                            // 确保目标目录存在
                            const targetDir = path.dirname(zipLocalPath);
                            if (!native.fileUtils.isDirectoryExist(targetDir)) {
                                native.fileUtils.createDirectory(targetDir);
                            }
                            // 如果目标文件已存在，先删除
                            if (native.fileUtils.isFileExist(zipLocalPath)) {
                                native.fileUtils.removeFile(zipLocalPath);
                            }
                            // 移动或复制文件到预期位置
                            native.fileUtils.renameFile(actualFilePath, zipLocalPath);
                            this._log("文件已移动到预期位置", { from: actualFilePath, to: zipLocalPath });
                            actualFilePath = zipLocalPath;
                        } catch (error) {
                            this._log("警告：无法移动文件到预期位置，使用实际路径", { 
                                actualFilePath, 
                                zipLocalPath, 
                                error 
                            });
                        }
                    }
                    
                    // 开始解压
                    this._extractZip(actualFilePath, extractPath)
                    .then((success) => {
                        if (success) {
                            this._log("解压成功", { extractPath });
                            
                            // 打印解压后的目录详细信息
                            this._logDirectoryContents(extractPath, bundleName);
                            
                            // 删除压缩包以节省空间（删除实际使用的文件路径）
                            if (native.fileUtils.isFileExist(actualFilePath)) {
                                native.fileUtils.removeFile(actualFilePath);
                                this._log("已删除压缩包", { filePath: actualFilePath });
                            }
                            // 如果 zipLocalPath 不同且存在，也删除
                            if (actualFilePath !== zipLocalPath && native.fileUtils.isFileExist(zipLocalPath)) {
                                native.fileUtils.removeFile(zipLocalPath);
                                this._log("已删除额外的压缩包文件", { filePath: zipLocalPath });
                            }
                            
                            // 验证manifest文件是否存在（zip文件中应该已包含）
                            const manifestPath = this._getLocalManifestPath(bundleName);
                            if (!native.fileUtils.isFileExist(manifestPath)) {
                                // 如果解压后manifest不存在，记录警告
                                this._log("警告：解压后manifest不存在", { manifestPath, bundleName });
                                // 注意：manifest应该在smartUpdate中处理，这里只记录日志
                            } else {
                                this._log("manifest文件已存在（zip解压后）", { manifestPath });
                            }
                            
                            // 如果主包zip中包含其他bundle（如hall），需要提取它们
                            if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
                                this._extractBundlesFromMainZip(extractPath);
                            }
                            
                            // 解压完成后，立即更新搜索路径（确保资源可以被找到）
                            this.updateSearchPath(bundleName);
                            this._log("zip解压后已更新搜索路径", { bundleName });
                            
                            resolve(true);
                        } else {
                            const error = new Error("解压失败");
                            this._error("解压失败", `error:${error.message}  stack:${error.stack || ''}`);
                            reject(error);
                        }
                    })
                    .catch((error) => {
                        this._error("解压异常", error instanceof Error ? `error:${error.message}  stack:${error.stack || ''}` : String(error));
                        reject(error);
                    });
                };
                
                // 依次检查每个路径（先直接检查，再轮询验证完整性）
                const findFile = async (): Promise<string | null> => {
                    const maxRetries = 10; // 最大重试次数
                    const retryInterval = 500; // 重试间隔（毫秒）
                    
                    // 首先直接检查所有路径
                    for (const filePath of possiblePaths) {
                        if (native.fileUtils.isFileExist(filePath)) {
                            // 验证文件完整性
                            if (verifyFileIntegrity(filePath)) {
                                this._log("文件已存在且完整性验证通过（直接检查）", { filePath });
                                return filePath;
                            } else {
                                this._log("文件存在但完整性验证失败，等待下载完成", { 
                                    filePath,
                                    currentProgress: totalBytes > 0 ? `${((downloadedBytes / totalBytes) * 100).toFixed(2)}%` : "未知"
                                });
                            }
                        }
                    }
                    
                    // 如果文件不存在或完整性验证失败，轮询等待
                    for (let retry = 0; retry < maxRetries; retry++) {
                        await new Promise(resolve => setTimeout(resolve, retryInterval));
                        
                        // 更新下载进度（可能还在下载中）
                        this._log("等待文件下载完成", {
                            retry: `${retry + 1}/${maxRetries}`,
                            currentProgress: totalBytes > 0 ? `${((downloadedBytes / totalBytes) * 100).toFixed(2)}%` : "未知",
                            downloadedBytes,
                            totalBytes
                        });
                        
                        // 再次检查所有路径
                        for (const filePath of possiblePaths) {
                            if (native.fileUtils.isFileExist(filePath)) {
                                // 验证文件完整性
                                if (verifyFileIntegrity(filePath)) {
                                    this._log("文件已存在且完整性验证通过（轮询检查）", { 
                                        filePath,
                                        retry: retry + 1,
                                        totalRetries: maxRetries
                                    });
                                    return filePath;
                                }
                            }
                        }
                    }
                    
                    // 如果所有路径都不存在，尝试在目录中查找
                    const zipDir = path.dirname(zipLocalPath);
                    const zipFileName = path.basename(zipLocalPath);
                    const zipFileNameWithoutExt = zipFileName.replace(/\.zip$/, '');
                    
                    try {
                        if (native.fileUtils.isDirectoryExist(zipDir)) {
                            const files = native.fileUtils.listFiles(zipDir);
                            this._log("目录中的文件列表", { 
                                zipDir:zipDir, 
                                files:files, 
                                zipFileName:zipFileName,
                                zipFileNameWithoutExt:zipFileNameWithoutExt,
                                expectedFile: zipFileName
                            });
                            
                            // 查找可能的文件（直接检查，不轮询）
                            // 匹配规则：文件名包含zip文件名，或者以.zip结尾
                            for (const file of files) {
                                const fullPath = path.join(zipDir, file);
                                const isZipFile = file.endsWith('.zip') || file.endsWith('.tmp');
                                const matchesName = file.includes(zipFileName) || 
                                                   file.includes(zipFileNameWithoutExt) ||
                                                   file === zipFileName ||
                                                   file === zipFileNameWithoutExt;
                                
                                if (isZipFile || matchesName) {
                                    if (native.fileUtils.isFileExist(fullPath)) {
                                        this._log("在目录中找到文件", { 
                                            fullPath, 
                                            file,
                                            matchesName,
                                            isZipFile,
                                            reason: matchesName ? '文件名匹配' : 'zip文件'
                                        });
                                        return fullPath;
                                    } else {
                                        this._log("文件路径存在但文件不存在", { fullPath, file });
                                    }
                                }
                            }
                            
                            // 如果还是没找到，列出所有zip文件
                            const allZipFiles = files.filter(f => f.endsWith('.zip') || f.endsWith('.tmp'));
                            if (allZipFiles.length > 0) {
                                this._log("目录中的所有zip文件", { 
                                    zipDir, 
                                    allZipFiles,
                                    suggestion: '尝试使用第一个zip文件'
                                });
                                // 尝试使用第一个zip文件
                                const firstZipPath = path.join(zipDir, allZipFiles[0]);
                                if (native.fileUtils.isFileExist(firstZipPath)) {
                                    this._log("使用目录中的第一个zip文件", { 
                                        filePath: firstZipPath, 
                                        fileName: allZipFiles[0] 
                                    });
                                    return firstZipPath;
                                }
                            }
                        } else {
                            this._log("目录不存在", { zipDir });
                        }
                        
                        // 检查临时目录
                        const tempDir = path.join(native.fileUtils.getWritablePath(), 'temp');
                        if (native.fileUtils.isDirectoryExist(tempDir)) {
                            const tempFiles = native.fileUtils.listFiles(tempDir);
                            this._log("临时目录中的文件列表", { 
                                tempDir:tempDir, 
                                tempFiles:tempFiles, 
                                zipFileName:zipFileName,
                                zipFileNameWithoutExt:zipFileNameWithoutExt
                            });
                            
                            for (const file of tempFiles) {
                                const isZipFile = file.endsWith('.zip') || file.endsWith('.tmp');
                                const matchesName = file.includes(zipFileName) || 
                                                   file.includes(zipFileNameWithoutExt) ||
                                                   file === zipFileName ||
                                                   file === zipFileNameWithoutExt;
                                
                                if (isZipFile || matchesName) {
                                    const fullPath = path.join(tempDir, file);
                                    if (native.fileUtils.isFileExist(fullPath)) {
                                        this._log("在临时目录中找到文件", { 
                                            fullPath, 
                                            file,
                                            matchesName,
                                            isZipFile
                                        });
                                        return fullPath;
                                    }
                                }
                            }
                            
                            // 列出临时目录中的所有zip文件
                            const allTempZipFiles = tempFiles.filter(f => f.endsWith('.zip') || f.endsWith('.tmp'));
                            if (allTempZipFiles.length > 0) {
                                this._log("临时目录中的所有zip文件", { 
                                    tempDir, 
                                    allTempZipFiles 
                                });
                            }
                        } else {
                            this._log("临时目录不存在", { tempDir });
                        }
                        
                        // 检查下载器可能使用的其他位置
                        const writablePath = native.fileUtils.getWritablePath();
                        const downloadDirs = [
                            path.join(writablePath, 'downloads'),
                            path.join(writablePath, 'cache'),
                            path.join(writablePath, 'files'),
                        ];
                        
                        for (const downloadDir of downloadDirs) {
                            if (native.fileUtils.isDirectoryExist(downloadDir)) {
                                try {
                                    const dirFiles = native.fileUtils.listFiles(downloadDir);
                                    const zipFiles = dirFiles.filter(f => f.endsWith('.zip') || f.endsWith('.tmp'));
                                    if (zipFiles.length > 0) {
                                        this._log("在其他目录中找到zip文件", { 
                                            downloadDir, 
                                            zipFiles 
                                        });
                                        // 尝试匹配文件名
                                        for (const zipFile of zipFiles) {
                                            if (zipFile.includes(zipFileNameWithoutExt) || zipFile.includes(bundleName as string)) {
                                                const foundPath = path.join(downloadDir, zipFile);
                                                if (native.fileUtils.isFileExist(foundPath)) {
                                                    this._log("在其他目录中找到匹配的文件", { 
                                                        foundPath, 
                                                        zipFile 
                                                    });
                                                    return foundPath;
                                                }
                                            }
                                        }
                                    }
                                } catch (error) {
                                    // 忽略错误，继续查找
                                }
                            }
                        }
                    } catch (error) {
                        this._error("查找文件时出错", `error:${error instanceof Error ? error.message : String(error)}  zipLocalPath:${zipLocalPath}  taskStoragePath:${task.storagePath}`);
                    }
                    
                    // 如果所有方法都找不到，记录警告
                    this._log("警告：无法找到下载的文件", { 
                        zipLocalPath: zipLocalPath,
                        possiblePaths: possiblePaths,
                        taskStoragePath: task.storagePath
                    });
                    
                    return null;
                };
                
                // 异步查找文件并验证完整性
                // 注意：isSuccessHandled 已在 onSuccess 回调开始时设置，这里不需要再次设置
                findFile().then((foundPath) => {
                    if (foundPath) {
                        actualFilePath = foundPath;
                        this._log("找到下载的文件（已验证完整性）", { 
                            actualFilePath,
                            fileSize: native.fileUtils.getFileSize(actualFilePath),
                            expectedSize: totalBytes
                        });
                        
                        // 继续处理文件
                        processDownloadedFile();
                    } else {
                        // 检查是否是因为文件不完整导致的
                        const errorMsg = totalBytes > 0 && downloadedBytes < totalBytes
                            ? `下载未完成：当前进度 ${((downloadedBytes / totalBytes) * 100).toFixed(2)}%，文件可能还在下载中`
                            : "下载成功但文件不存在或文件不完整";
                        const error = new Error(errorMsg);
                        this._error("下载失败", `zipLocalPath:${zipLocalPath}  taskStoragePath:${task.storagePath}  taskIdentifier:${task.identifier}  requestURL:${task.requestURL}  possiblePaths:${possiblePaths.join(',')}  zipDir:${path.dirname(zipLocalPath)}  zipFileName:${path.basename(zipLocalPath)}  downloadedBytes:${downloadedBytes}  totalBytes:${totalBytes}  progress:${totalBytes > 0 ? ((downloadedBytes / totalBytes) * 100).toFixed(2) : '未知'}%`);
                        reject(error);
                    }
                });
            };

            // 确保下载目录存在
            const downloadDir = path.dirname(zipLocalPath);
            if (!native.fileUtils.isDirectoryExist(downloadDir)) {
                native.fileUtils.createDirectory(downloadDir);
            }
            
            // 如果目标文件已存在，先删除（避免使用旧文件）
            if (native.fileUtils.isFileExist(zipLocalPath)) {
                native.fileUtils.removeFile(zipLocalPath);
            }
            
            // 开始下载
            this._downloader!.createDownloadTask(zipUrl, zipLocalPath);
        });
    }

    /**
     * 解压zip文件
     * 
     * @param zipPath zip文件路径
     * @param extractDir 解压目标目录
     * @returns Promise<boolean> 是否成功
     */
    private _extractZip(zipPath: string, extractDir: string): Promise<boolean> {
        return new Promise((resolve) => {
            this._log("开始解压", { zipPath, extractDir, platform: sys.platform });
            
            // 详细检查文件是否存在
            const fileExists = native.fileUtils.isFileExist(zipPath);
            this._log("压缩包文件检查", { 
                zipPath, 
                exists: fileExists,
                extractDir,
                platform: sys.platform
            });
            
            if (!fileExists) {
                // 尝试列出目录内容，看看是否有其他文件
                try {
                    const zipDir = path.dirname(zipPath);
                    const dirExists = native.fileUtils.isDirectoryExist(zipDir);
                    const files = dirExists ? native.fileUtils.listFiles(zipDir) : [];
                    const filesList = Array.isArray(files) ? files.join(',') : String(files);
                    this._error("压缩包不存在", `zipPath:${zipPath}  zipDir:${zipDir}  zipDirExists:${dirExists}  filesInDir:${filesList}  expectedFileName:${path.basename(zipPath)}`);
                } catch (error) {
                    this._error("压缩包不存在", `zipPath:${zipPath}  error:${error instanceof Error ? error.message : String(error)}`);
                }
                resolve(false);
                return;
            }
            
            // 获取文件大小
            try {
                const fileSize = native.fileUtils.getFileSize(zipPath);
                this._log("压缩包文件信息", { 
                    zipPath, 
                    fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
                    fileSizeBytes: fileSize
                });
            } catch (error) {
                this._log("无法获取压缩包文件大小", { zipPath, error });
            }

            this._log("压缩包文件存在，开始解压", { zipPath, fileSize: "检查中" });

            // 确保解压目录存在
            if (!native.fileUtils.isDirectoryExist(extractDir)) {
                native.fileUtils.createDirectory(extractDir);
                this._log("创建解压目录", { extractDir });
            } else {
                this._log("解压目录已存在", { extractDir });
            }

            // 调用原生解压方法
            // 注意：需要在原生端实现 unzipFile 方法
            // Android: PlatformAndroidApi.unzipFile(zipPath, extractDir)
            // iOS: NativeHelper.unzipFile(zipPath, extractDir)
            
            if (sys.platform === sys.Platform.ANDROID) {
                // Android 平台 - 使用 PlatformAndroidApi.unzipFile
                this._log("检测到Android平台，准备调用原生解压方法", { zipPath, extractDir });
                const jsb = (window as any).jsb;
                if (!jsb) {
                    this._error("jsb对象不存在");
                    resolve(false);
                    return;
                }
                if (!jsb.reflection) {
                    this._error("jsb.reflection不存在");
                    resolve(false);
                    return;
                }
                if (!jsb.reflection.callStaticMethod) {
                    this._error("jsb.reflection.callStaticMethod不存在");
                    resolve(false);
                    return;
                }
                
                this._log("JSB反射可用，开始调用原生方法", { 
                    className: "com/cocos/game/PlatformAndroidApi",
                    methodName: "unzipFile",
                    signature: "(Ljava/lang/String;Ljava/lang/String;)Z"
                });
                
                try {
                    const result = jsb.reflection.callStaticMethod(
                        "com/cocos/game/PlatformAndroidApi",
                        "unzipFile",
                        "(Ljava/lang/String;Ljava/lang/String;)Z",
                        zipPath,
                        extractDir
                    );
                    this._log("Android解压结果", { 
                        result, 
                        resultType: typeof result,
                        resultValue: result === true ? "true" : result === 1 ? "1" : String(result),
                        zipPath, 
                        extractDir 
                    });
                    resolve(result === true || result === 1);
                } catch (error) {
                    this._error("Android解压异常", `error:${error instanceof Error ? error.message : String(error)}  errorMessage:${error?.message || ''}  errorStack:${error?.stack || ''}`);
                    resolve(false);
                }
            } else if (sys.platform === sys.Platform.IOS) {
                // iOS 平台
                this._log("检测到iOS平台，准备调用原生解压方法", { zipPath, extractDir });
                const jsb = (window as any).jsb;
                if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
                    try {
                        const result = jsb.reflection.callStaticMethod(
                            "NativeHelper",
                            "unzipFile:toPath:",
                            zipPath,
                            extractDir
                        );
                        this._log("iOS解压结果", { result, zipPath, extractDir });
                        resolve(result === true || result === 1);
                    } catch (error) {
                        this._error("iOS解压异常", error instanceof Error ? `error:${error.message}  stack:${error.stack || ''}` : String(error));
                        resolve(false);
                    }
                } else {
                    this._error("iOS JSB反射不可用");
                    resolve(false);
                }
            } else {
                this._error("不支持的平台", `platform:${sys.platform}`);
                resolve(false);
            }
        });
    }

    /**
     * 更新搜索路径
     * 
     * @param bundleName Bundle名称
     */
    updateSearchPath(bundleName: string | GGHotUpdateInstanceEnum): void {
        const extractPath = this.getBundleExtractPath(bundleName);
        const searchPath = extractPath + "/";

        // 检查解压目录是否存在
        if (!native.fileUtils.isDirectoryExist(extractPath)) {
            this._error("解压目录不存在，无法更新搜索路径", `bundleName:${bundleName}  extractPath:${extractPath}  searchPath:${searchPath}`);
            return;
        }

        // 检查关键文件是否存在（用于验证）
        const manifestPath = this._getLocalManifestPath(bundleName);
        const hasManifest = native.fileUtils.isFileExist(manifestPath);
        
        // 检查 bundle 配置文件（cc.config.json 或 cc.config.*.json）
        let hasConfigFile = false;
        let configFilePath = "";
        try {
            const files = native.fileUtils.listFiles(extractPath);
            for (const file of files) {
                if (file.includes("cc.config") && file.endsWith(".json")) {
                    hasConfigFile = true;
                    configFilePath = file;
                    break;
                }
            }
        } catch (error) {
            this._log("无法列出解压目录文件", { extractPath, error });
        }
        
        this._log("检查解压目录", { 
            bundleName,
            extractPath,
            exists: native.fileUtils.isDirectoryExist(extractPath),
            hasManifest,
            manifestPath,
            hasConfigFile,
            configFilePath
        });

        const searchPaths: string[] = native.fileUtils.getSearchPaths();
        
        // 检查是否已存在
        let isNewPathExist = false;
        for (let j = searchPaths.length - 1; j >= 0; --j) {
            if (searchPaths[j] === searchPath) {
                // 如果已存在，移除它（稍后会添加到最前面）
                searchPaths.splice(j, 1);
                isNewPathExist = true;
                break;
            }
        }

        // 无论是否存在，都添加到最前面（确保优先级最高）
        searchPaths.unshift(searchPath);

        native.fileUtils.setSearchPaths(searchPaths);
        
        // 保存到本地存储
        sys.localStorage.setItem("ZipHotUpdateSearchPaths", JSON.stringify(searchPaths));
        
        // 验证搜索路径设置后的效果
        const finalSearchPaths = native.fileUtils.getSearchPaths();
        const isPathInSearchPaths = finalSearchPaths.includes(searchPath);
        
        // 打印目录内容用于对比
        this._logDirectoryContents(extractPath, bundleName);
        
        this._log("搜索路径已更新", { 
            bundleName,
            searchPath, 
            searchPaths: finalSearchPaths,
            extractPath,
            directoryExists: native.fileUtils.isDirectoryExist(extractPath),
            hasConfigFile,
            configFilePath,
            isPathInSearchPaths,
            pathIndex: finalSearchPaths.indexOf(searchPath),
            warning: !hasConfigFile ? "警告：未找到 bundle 配置文件（cc.config.json），可能导致 bundle 加载失败" : undefined,
            warning2: !isPathInSearchPaths ? "警告：搜索路径未正确添加到搜索路径列表" : undefined
        });
        
        // 特别针对 hall bundle 打印对比信息
        const isHall = bundleName === 'hall' || bundleName === 'Hall';
        
        if (isHall) {
            this._log(`=== Hall Bundle 路径对比 ===`, {
                "Bundle名称": bundleName,
                "解压目录 (extractPath)": extractPath,
                "搜索路径 (searchPath)": searchPath,
                "搜索路径是否匹配": searchPath === extractPath + "/",
                "目录是否存在": native.fileUtils.isDirectoryExist(extractPath),
                "配置文件路径": configFilePath,
                "配置文件是否存在": hasConfigFile,
                "manifest路径": manifestPath,
                "manifest是否存在": hasManifest,
                "当前所有搜索路径": finalSearchPaths,
                "搜索路径在列表中的位置": finalSearchPaths.indexOf(searchPath),
                "搜索路径是否在列表中": isPathInSearchPaths
            });
        }
    }

    /**
     * 恢复之前保存的搜索路径
     */
    private _restoreSearchPaths(): void {
        try {
            const savedSearchPaths = sys.localStorage.getItem("ZipHotUpdateSearchPaths");
            if (savedSearchPaths) {
                const searchPaths = JSON.parse(savedSearchPaths);
                if (Array.isArray(searchPaths) && searchPaths.length > 0) {
                    // 验证路径是否仍然存在
                    const validSearchPaths: string[] = [];
                    const defaultSearchPaths = native.fileUtils.getSearchPaths();
                    
                    // 保留默认搜索路径
                    validSearchPaths.push(...defaultSearchPaths);
                    
                    // 添加有效的热更新搜索路径
                    for (const searchPath of searchPaths) {
                        // 移除末尾的斜杠进行比较
                        const normalizedPath = searchPath.endsWith('/') ? searchPath.slice(0, -1) : searchPath;
                        if (native.fileUtils.isDirectoryExist(normalizedPath)) {
                            // 如果不在默认路径中，则添加
                            if (!defaultSearchPaths.includes(searchPath)) {
                                validSearchPaths.unshift(searchPath); // 添加到最前面
                            }
                        } else {
                            this._log("搜索路径已失效，跳过", { searchPath, normalizedPath });
                        }
                    }
                    
                    if (validSearchPaths.length > defaultSearchPaths.length) {
                        native.fileUtils.setSearchPaths(validSearchPaths);
                        this._log("已恢复搜索路径", { 
                            restoredCount: validSearchPaths.length - defaultSearchPaths.length,
                            totalPaths: validSearchPaths.length,
                            searchPaths: validSearchPaths
                        });
                    } else {
                        this._log("没有有效的热更新搜索路径需要恢复");
                    }
                }
            }
        } catch (error) {
            this._error("恢复搜索路径失败", `error:${error instanceof Error ? error.message : String(error)}  stack:${error instanceof Error ? error.stack || '' : ''}`);
        }
    }

    /**
     * 从主包zip中提取其他bundle（如hall）
     * 主包zip可能包含其他bundle的内容，需要将它们提取到独立的目录
     * 
     * 注意：只在首次更新（主包zip解压）时提取，如果bundle已经存在manifest，说明已经更新过，不需要从主包提取
     */
    private _extractBundlesFromMainZip(mainExtractPath: string): void {
        // 需要从主包中提取的bundle列表
        const bundlesToExtract = ['hall', 'resources'];
        
        for (const bundleName of bundlesToExtract) {
            // 主包zip中bundle的路径（例如：build-in/assets/hall/）
            const bundleInMainPath = path.join(mainExtractPath, 'assets', bundleName);
            // bundle的目标路径（例如：assets/hall/）
            const bundleTargetPath = this.getBundleExtractPath(bundleName);
            
            // 检查主包zip中是否包含该bundle
            if (native.fileUtils.isDirectoryExist(bundleInMainPath)) {
                // 检查目标bundle是否已经有manifest（说明已经更新过，不需要从主包提取）
                const targetManifestPath = this._getLocalManifestPath(bundleName);
                const hasExistingManifest = native.fileUtils.isFileExist(targetManifestPath);
                
                if (hasExistingManifest) {
                    this._log("bundle已有manifest，跳过从主包提取（可能已单独更新）", { 
                        bundleName, 
                        sourcePath: bundleInMainPath,
                        targetPath: bundleTargetPath,
                        manifestPath: targetManifestPath
                    });
                    continue;
                }
                
                this._log("发现主包zip中包含bundle，准备提取", { 
                    bundleName, 
                    sourcePath: bundleInMainPath,
                    targetPath: bundleTargetPath,
                    isFirstExtract: !hasExistingManifest
                });
                
                try {
                    // 确保目标目录的父目录存在
                    const targetParentDir = path.dirname(bundleTargetPath);
                    if (!native.fileUtils.isDirectoryExist(targetParentDir)) {
                        native.fileUtils.createDirectory(targetParentDir);
                    }
                    
                    // 如果目标目录已存在，先删除（确保是全新提取）
                    if (native.fileUtils.isDirectoryExist(bundleTargetPath)) {
                        this._log("目标目录已存在，先删除", { bundleTargetPath });
                        native.fileUtils.removeDirectory(bundleTargetPath);
                    }
                    
                    // 复制bundle目录到目标位置
                    this._copyDirectory(bundleInMainPath, bundleTargetPath);
                    
                    // 检查复制后的关键文件
                    const copiedConfigPath = path.join(bundleTargetPath, 'cc.config.json');
                    const hasCopiedConfig = native.fileUtils.isFileExist(copiedConfigPath);
                    const copiedManifestPath = path.join(bundleTargetPath, 'project.manifest');
                    const hasCopiedManifest = native.fileUtils.isFileExist(copiedManifestPath);
                    
                    this._log("已从主包zip中提取bundle", { 
                        bundleName, 
                        sourcePath: bundleInMainPath,
                        targetPath: bundleTargetPath,
                        hasConfig: hasCopiedConfig,
                        hasManifest: hasCopiedManifest,
                        configPath: copiedConfigPath,
                        manifestPath: copiedManifestPath
                    });
                    
                    // 提取后，更新该bundle的搜索路径（确保优先级最高）
                    this.updateSearchPath(bundleName);
                } catch (error) {
                    this._error("从主包zip中提取bundle失败", `bundleName:${bundleName}  sourcePath:${bundleInMainPath}  targetPath:${bundleTargetPath}  error:${error instanceof Error ? error.message : String(error)}  stack:${error instanceof Error ? error.stack || '' : ''}`);
                }
            } else {
                this._log("主包zip中不包含bundle，跳过提取", { 
                    bundleName, 
                    checkedPath: bundleInMainPath
                });
            }
        }
    }
    
    /**
     * 递归复制目录
     */
    private _copyDirectory(sourceDir: string, targetDir: string): void {
        if (!native.fileUtils.isDirectoryExist(sourceDir)) {
            return;
        }
        
        // 确保目标目录存在
        if (!native.fileUtils.isDirectoryExist(targetDir)) {
            native.fileUtils.createDirectory(targetDir);
        }
        
        // 列出源目录中的所有文件
        const files: string[] = [];
        native.fileUtils.listFilesRecursively(sourceDir, files);
        
        for (const file of files) {
            // 计算相对路径
            const relativePath = file.replace(sourceDir + '/', '').replace(sourceDir + '\\', '');
            const targetFile = path.join(targetDir, relativePath);
            const targetFileDir = path.dirname(targetFile);
            
            // 确保目标文件的目录存在
            if (!native.fileUtils.isDirectoryExist(targetFileDir)) {
                native.fileUtils.createDirectory(targetFileDir);
            }
            
            // 读取源文件内容并写入目标文件
            if (native.fileUtils.isFileExist(file)) {
                const fileData = native.fileUtils.getDataFromFile(file);
                if (fileData) {
                    native.fileUtils.writeDataToFile(fileData, targetFile);
                }
            }
        }
        
        this._log("目录复制完成", { 
            sourceDir, 
            targetDir, 
            fileCount: files.length 
        });
    }

    /**
     * 清除下载缓存
     */
    clearCache(): void {
        if (native.fileUtils.isDirectoryExist(this._localRootDirPath)) {
            const success = native.fileUtils.removeDirectory(this._localRootDirPath);
            this._log("清除缓存", { success, path: this._localRootDirPath });
        }
        
        // 清除保存的搜索路径
        sys.localStorage.removeItem("ZipHotUpdateSearchPaths");
    }

    private _log(message: string, data?: any): void {
        if (this._enableLog) {
            if (data && typeof data === 'object') {
                try {
                    console.log(`[ZipHotUpdateManager] ${message} ${JSON.stringify(data)}`);
                } catch (e) {
                    console.log(`[ZipHotUpdateManager] ${message}`, data);
                }
            } else {
                console.log(`[ZipHotUpdateManager] ${message}`, data || "");
            }
        }
    }

    private _error(message: string, error?: any): void {
        if (this._enableLog) {
            if (error && typeof error === 'object') {
                try {
                    console.error(`[ZipHotUpdateManager] ${message} ${JSON.stringify(error)}`);
                } catch (e) {
                    console.error(`[ZipHotUpdateManager] ${message}`, error);
                }
            } else {
                console.error(`[ZipHotUpdateManager] ${message}`, error || "");
            }
        }
    }

    /**
     * 打印目录内容（用于调试）
     */
    private _logDirectoryContents(dirPath: string, bundleName: string): void {
        try {
            if (!native.fileUtils.isDirectoryExist(dirPath)) {
                this._log("目录不存在，无法列出内容", { dirPath, bundleName });
                return;
            }

            const files: string[] = [];
            native.fileUtils.listFilesRecursively(dirPath, files);
            
            // 查找关键文件
            const keyFiles: string[] = [];
            const configFiles: string[] = [];
            const manifestFiles: string[] = [];
            
            files.forEach(file => {
                const fileName = file.substring(file.lastIndexOf('/') + 1);
                if (fileName.includes('cc.config') && fileName.endsWith('.json')) {
                    configFiles.push(file);
                } else if (fileName === 'project.manifest' || fileName === 'version.manifest') {
                    manifestFiles.push(file);
                } else if (fileName.endsWith('.json') || fileName.endsWith('.js') || fileName.endsWith('.ts')) {
                    keyFiles.push(file);
                }
            });

            this._log("目录内容详情", {
                bundleName,
                dirPath,
                totalFiles: files.length,
                configFiles: configFiles.length > 0 ? configFiles : "未找到",
                manifestFiles: manifestFiles.length > 0 ? manifestFiles : "未找到",
                keyFilesCount: keyFiles.length,
                sampleFiles: files.slice(0, 10), // 显示前10个文件作为示例
                allFiles: files.length <= 20 ? files : `${files.length} 个文件（仅显示前20个）: ${files.slice(0, 20).join(', ')}`
            });
        } catch (error) {
            this._error("列出目录内容失败", `dirPath:${dirPath}  bundleName:${bundleName}  error:${error instanceof Error ? error.message : String(error)}  stack:${error instanceof Error ? error.stack || '' : ''}`);
        }
    }
}

/**
 * 压缩包热更新管理器单例
 */
export const zipHotUpdateManager = new ZipHotUpdateManager();

