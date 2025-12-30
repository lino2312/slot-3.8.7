import { assetManager, JsonAsset, native, AssetManager } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';

/**
 * Bundle版本信息
 */
export interface BundleInfo {
    version: string;
    force?: boolean;
    size?: number;
    md5?: string;
    url?: string;
}

/**
 * 远程版本清单
 * 兼容两种格式：
 * 1. 新格式：bundles.hall = { version: "188", url: "..." }
 * 2. 旧格式：bundles.hall = "188" (字符串版本号)
 */
export interface VersionManifest {
    appVersion?: string;
    force?: boolean;
    minAppVersion?: string;
    updateTime?: string;
    bundles: Record<string, BundleInfo | string>;
}

/**
 * 更新选项
 */
export interface UpdateOptions {
    force?: boolean;           // 强制更新
    skipCache?: boolean;       // 跳过缓存检查
    retries?: number;          // 重试次数
    onProgress?: (progress: number, bundleName: string) => void;
    allowRollback?: boolean;   // 允许回退
    stopOnError?: boolean;     // 遇到错误是否停止
}

/**
 * 更新结果
 */
export interface UpdateResult {
    bundleName: string;
    success: boolean;
    fromCache: boolean;
    version: string;
    error?: Error;
}

/**
 * Bundle优先级配置
 */
const BUNDLE_PRIORITY: Record<string, number> = {
    'hall': 0,        // P0: 最高优先级
    'common': 1,      // P1: 高优先级
};

/**
 * 统一的热更新管理器
 * 支持多Bundle版本管理、错误恢复、进度显示
 */
export class HotUpdateManager {
    /** 热更新基础URL */
    static baseUrl: string = '';
    
    /** 最大重试次数（可从Config覆盖） */
    static maxRetries: number = 3;
    
    /** 重试延迟（毫秒，可从Config覆盖） */
    static retryDelay: number = 1000;
    
    /** 是否启用详细日志 */
    static verboseLogging: boolean = true;
    
    /**
     * 初始化配置（从Config读取）
     */
    static initConfig() {
        this.log('log', 'initConfig', '开始初始化配置');
        
        if (Config.hotupdate) {
            this.maxRetries = Config.hotupdate.maxRetries || this.maxRetries;
            this.retryDelay = Config.hotupdate.retryDelay || this.retryDelay;
            this.log('log', 'initConfig', '配置已加载', {
                baseUrl: this.baseUrl,
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay,
                verboseLogging: this.verboseLogging
            });
        } else {
            this.log('warn', 'initConfig', 'Config.hotupdate未配置，使用默认值', {
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay
            });
        }
    }
    
    /**
     * 日志输出（统一管理，带时间戳和步骤标识）
     */
    private static log(level: 'log' | 'warn' | 'error', step: string, message: string, data?: any) {
        if (!this.verboseLogging && level === 'log') return;
        const timestamp = new Date().toISOString();
        const prefix = `[HotUpdateManager:${step}]`;
        const logMessage = `[${timestamp}] ${message}`;
        
        if (data !== undefined) {
            console[level](prefix, logMessage, data);
        } else {
            console[level](prefix, logMessage);
        }
    }
    
    /** 缓存的版本清单 */
    private static cachedManifest: VersionManifest | null = null;
    
    /** 本地版本存储Key前缀 */
    private static readonly LOCAL_VERSION_KEY_PREFIX = 'bundle_version_';
    
    /**
     * 获取远程版本清单（带重试和缓存）
     */
    static async fetchRemoteManifest(noCache: boolean = true): Promise<VersionManifest> {
        const url = `${this.baseUrl}/version.json`;
        this.log('log', 'fetchRemoteManifest', '开始获取远程版本清单', { 
            url, 
            noCache,
            hasCached: !!this.cachedManifest
        });
        
        // 使用缓存（如果可用且不需要刷新）
        if (!noCache && this.cachedManifest) {
            this.log('log', 'fetchRemoteManifest', '使用缓存的版本清单', {
                bundleCount: Object.keys(this.cachedManifest.bundles || {}).length
            });
            return this.cachedManifest;
        }
        
        // 重试机制
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const attemptStartTime = Date.now();
                this.log('log', 'fetchRemoteManifest', `尝试获取版本清单 (${attempt + 1}/${this.maxRetries})`, { url });
                
                const cm: any = assetManager.cacheManager;
                let finalUrl = url;
                
                if (noCache || attempt > 0) {
                    // 删除本地缓存的旧清单
                    try {
                        cm?.removeCache?.(url);
                        cm?.removeCache?.(url + '?');
                        this.log('log', 'fetchRemoteManifest', '已清除本地缓存');
                    } catch (err) {
                        this.log('warn', 'fetchRemoteManifest', '清除缓存失败', err);
                    }
                    // 追加时间戳，绕过缓存
                    finalUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    this.log('log', 'fetchRemoteManifest', '添加时间戳绕过缓存', { finalUrl });
                }
                
                const asset = await this.loadRemoteJson(finalUrl);
                const manifest = this.validateManifest(asset);
                
                // 缓存清单
                this.cachedManifest = manifest;
                
                const duration = Date.now() - attemptStartTime;
                const bundleCount = Object.keys(manifest.bundles || {}).length;
                this.log('log', 'fetchRemoteManifest', '版本清单获取成功', {
                    duration: `${duration}ms`,
                    bundleCount,
                    bundles: Object.keys(manifest.bundles || {}),
                    force: manifest.force,
                    appVersion: manifest.appVersion
                });
                
                return manifest;
            } catch (err) {
                lastError = err as Error;
                const delay = attempt < this.maxRetries - 1 
                    ? this.retryDelay * Math.pow(2, attempt) 
                    : 0;
                
                this.log('warn', 'fetchRemoteManifest', `获取版本清单失败 (尝试 ${attempt + 1}/${this.maxRetries})`, {
                    error: (err as Error)?.message,
                    nextRetryDelay: delay > 0 ? `${delay}ms` : '无'
                });
                
                if (attempt < this.maxRetries - 1) {
                    // 指数退避
                    this.log('log', 'fetchRemoteManifest', `等待 ${delay}ms 后重试`);
                    await this.delay(delay);
                }
            }
        }
        
        this.log('error', 'fetchRemoteManifest', '所有重试都失败', {
            attempts: this.maxRetries,
            lastError: lastError?.message
        });
        throw lastError || new Error('获取版本清单失败');
    }
    
    /**
     * 验证版本清单格式
     */
    private static validateManifest(data: any): VersionManifest {
        this.log('log', 'validateManifest', '开始验证版本清单格式');
        
        if (!data || typeof data !== 'object') {
            this.log('error', 'validateManifest', '版本清单格式错误: 不是有效的JSON对象');
            throw new Error('版本清单格式错误: 不是有效的JSON对象');
        }
        
        if (!data.bundles || typeof data.bundles !== 'object') {
            this.log('error', 'validateManifest', '版本清单格式错误: bundles字段缺失或格式错误');
            throw new Error('版本清单格式错误: bundles字段缺失或格式错误');
        }
        
        // 验证每个Bundle信息
        const bundleNames = Object.keys(data.bundles);
        this.log('log', 'validateManifest', `验证 ${bundleNames.length} 个Bundle`, { bundleNames });
        
        for (const [bundleName, bundleInfo] of Object.entries(data.bundles)) {
            const info = bundleInfo as any;
            // 兼容旧格式（字符串版本号）
            if (typeof info === 'string') {
                this.log('log', 'validateManifest', `Bundle ${bundleName} 使用旧格式（字符串版本号）`, { version: info });
            } else if (!info.version || typeof info.version !== 'string') {
                this.log('warn', 'validateManifest', `Bundle ${bundleName} 版本信息不完整`, { bundleInfo: info });
            } else {
                this.log('log', 'validateManifest', `Bundle ${bundleName} 验证通过`, { 
                    version: info.version,
                    hasUrl: !!info.url,
                    hasSize: info.size !== undefined,
                    hasMd5: !!info.md5
                });
            }
        }
        
        this.log('log', 'validateManifest', '版本清单验证完成');
        return data as VersionManifest;
    }
    
    /**
     * 加载远程JSON文件
     */
    private static loadRemoteJson(url: string): Promise<any> {
        this.log('log', 'loadRemoteJson', `开始加载远程JSON`, { url });
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            assetManager.loadRemote(url, { ext: '.json' }, (err, asset: JsonAsset) => {
                const duration = Date.now() - startTime;
                
                if (err || !asset) {
                    this.log('error', 'loadRemoteJson', '加载JSON失败', { 
                        url,
                        error: err?.message || '加载JSON失败',
                        duration: `${duration}ms`
                    });
                    return reject(err || new Error('加载JSON失败'));
                }
                
                this.log('log', 'loadRemoteJson', 'JSON加载成功', { url, duration: `${duration}ms` });
                resolve(asset.json);
            });
        });
    }
    
    /**
     * 获取本地存储的版本号
     */
    static getLocalVersion(bundleName: string): string {
        const key = this.LOCAL_VERSION_KEY_PREFIX + bundleName;
        const version = App.StorageUtils.getLocal(key, '');
        this.log('log', 'getLocalVersion', `获取本地版本号`, { bundleName, version: version || '无' });
        return version;
    }
    
    /**
     * 保存本地版本号
     */
    static saveLocalVersion(bundleName: string, version: string): void {
        const key = this.LOCAL_VERSION_KEY_PREFIX + bundleName;
        const oldVersion = App.StorageUtils.getLocal(key, '');
        App.StorageUtils.saveLocal(key, version);
        this.log('log', 'saveLocalVersion', `保存本地版本号`, { 
            bundleName, 
            oldVersion: oldVersion || '无',
            newVersion: version
        });
    }
    
    /**
     * 获取远程Bundle信息
     */
    static async getRemoteBundleInfo(bundleName: string): Promise<BundleInfo> {
        this.log('log', 'getRemoteBundleInfo', `获取远程Bundle信息`, { bundleName });
        
        const manifest = await this.fetchRemoteManifest(false);
        let bundleInfo = manifest.bundles[bundleName];
        
        // 兼容旧版本清单格式：bundles.hall 可能是字符串版本号
        if (!bundleInfo) {
            this.log('error', 'getRemoteBundleInfo', `Bundle不在版本清单中`, { 
                bundleName,
                availableBundles: Object.keys(manifest.bundles || {})
            });
            throw new Error(`Bundle ${bundleName} 不在版本清单中`);
        }
        
        // 如果bundleInfo是字符串（旧格式），转换为BundleInfo对象
        if (typeof bundleInfo === 'string') {
            this.log('log', 'getRemoteBundleInfo', `使用旧格式（字符串版本号）`, { bundleName, version: bundleInfo });
            bundleInfo = {
                version: bundleInfo
            };
        }
        
        // 如果没有URL，构造默认URL
        if (!bundleInfo.url) {
            bundleInfo.url = `${this.baseUrl}/${bundleName}/${bundleInfo.version}`;
            this.log('log', 'getRemoteBundleInfo', `构造默认URL`, { bundleName, url: bundleInfo.url });
        }
        
        this.log('log', 'getRemoteBundleInfo', `Bundle信息获取成功`, { 
            bundleName,
            version: bundleInfo.version,
            url: bundleInfo.url,
            size: bundleInfo.size,
            hasMd5: !!bundleInfo.md5
        });
        
        return bundleInfo;
    }
    
    /**
     * 检查Bundle是否需要更新
     */
    static async checkBundleNeedsUpdate(bundleName: string): Promise<BundleInfo | null> {
        this.log('log', 'checkBundleNeedsUpdate', `检查Bundle是否需要更新`, { bundleName });
        
        try {
            const remoteInfo = await this.getRemoteBundleInfo(bundleName);
            const localVer = this.getLocalVersion(bundleName);
            
            this.log('log', 'checkBundleNeedsUpdate', `版本对比`, { 
                bundleName,
                localVersion: localVer || '无',
                remoteVersion: remoteInfo.version
            });
            
            if (localVer === remoteInfo.version) {
                // 版本相同，检查缓存
                this.log('log', 'checkBundleNeedsUpdate', `版本相同，检查缓存`, { bundleName, version: remoteInfo.version });
                const hasCache = this.hasCachedVersion(bundleName, remoteInfo.version);
                
                if (hasCache) {
                    this.log('log', 'checkBundleNeedsUpdate', `版本相同且有缓存，无需更新`, { bundleName, version: remoteInfo.version });
                    return null;
                } else {
                    this.log('log', 'checkBundleNeedsUpdate', `版本相同但无缓存，需要下载`, { bundleName, version: remoteInfo.version });
                    return remoteInfo;
                }
            }
            
            this.log('log', 'checkBundleNeedsUpdate', `版本不同，需要更新`, { 
                bundleName,
                localVersion: localVer || '无',
                remoteVersion: remoteInfo.version
            });
            return remoteInfo;
        } catch (err) {
            this.log('error', 'checkBundleNeedsUpdate', `检查Bundle更新失败`, { 
                bundleName,
                error: (err as Error)?.message
            });
            return null;
        }
    }
    
    /**
     * 检查本地是否有缓存版本
     */
    static hasCachedVersion(bundleName: string, version: string): boolean {
        this.log('log', 'hasCachedVersion', `检查本地缓存`, { bundleName, version });
        
        const bundleInfo: BundleInfo = { version };
        // 构造默认URL
        if (!bundleInfo.url) {
            bundleInfo.url = `${this.baseUrl}/${bundleName}/${version}`;
        }
        
        const baseV = this.joinUrl(this.baseUrl, `${bundleName}/${version}`);
        const cfgUrl = this.joinUrl(baseV, 'cc.config.json');
        
        const cm: any = assetManager.cacheManager;
        if (!cm) {
            this.log('warn', 'hasCachedVersion', '缓存管理器不可用', { bundleName, version });
            return false;
        }
        
        const localPath = cm.getCache?.(cfgUrl);
        if (!localPath) {
            this.log('log', 'hasCachedVersion', '缓存路径不存在', { bundleName, version, configUrl: cfgUrl });
            return false;
        }
        
        // 原生平台检查文件是否存在
        if (typeof native !== 'undefined' && (native as any).fileUtils) {
            const exists = (native as any).fileUtils.isFileExist(localPath);
            this.log('log', 'hasCachedVersion', exists ? '缓存文件存在' : '缓存文件不存在', { 
                bundleName, 
                version,
                localPath 
            });
            return exists;
        }
        
        // Web平台：假设缓存管理器已经处理
        this.log('log', 'hasCachedVersion', 'Web平台，假设缓存已处理', { bundleName, version, localPath });
        return true;
    }
    
    /**
     * 下载并加载Bundle
     */
    static async checkAndUpdateBundle(
        bundleName: string,
        options: UpdateOptions = {}
    ): Promise<UpdateResult> {
        const retries = options.retries ?? this.maxRetries;
        const startTime = Date.now();
        
        this.log('log', 'checkAndUpdateBundle', `开始检查并更新Bundle`, { 
            bundleName, 
            retries,
            force: options.force,
            allowRollback: options.allowRollback
        });
        
        try {
            // 1. 获取远程版本信息
            this.log('log', 'checkAndUpdateBundle', `步骤1: 获取远程版本信息`, { bundleName });
            const remoteInfo = await this.getRemoteBundleInfo(bundleName);
            const localVer = this.getLocalVersion(bundleName);
            
            this.log('log', 'checkAndUpdateBundle', `版本对比`, { 
                bundleName,
                localVersion: localVer || '无',
                remoteVersion: remoteInfo.version,
                needsUpdate: localVer !== remoteInfo.version || options.force
            });
            
            // 2. 检查是否需要更新
            if (!options.force && localVer === remoteInfo.version) {
                this.log('log', 'checkAndUpdateBundle', `版本相同，检查缓存`, { bundleName, version: remoteInfo.version });
                const hasCache = this.hasCachedVersion(bundleName, remoteInfo.version);
                if (hasCache) {
                    // 直接加载缓存版本
                    this.log('log', 'checkAndUpdateBundle', `使用缓存版本`, { bundleName, version: remoteInfo.version });
                    await this.loadBundle(bundleName, remoteInfo.version);
                    options.onProgress?.(1, bundleName);
                    
                    const duration = Date.now() - startTime;
                    this.log('log', 'checkAndUpdateBundle', `Bundle更新完成（使用缓存）`, { 
                        bundleName,
                        version: remoteInfo.version,
                        duration: `${duration}ms`
                    });
                    
                    return {
                        bundleName,
                        success: true,
                        fromCache: true,
                        version: remoteInfo.version
                    };
                } else {
                    this.log('log', 'checkAndUpdateBundle', `版本相同但无缓存，需要下载`, { bundleName, version: remoteInfo.version });
                }
            }
            
            // 3. 下载并加载新版本（带重试）
            this.log('log', 'checkAndUpdateBundle', `步骤2: 下载并加载新版本`, { 
                bundleName, 
                targetVersion: remoteInfo.version,
                retries 
            });
            
            let lastError: Error | null = null;
            for (let attempt = 0; attempt < retries; attempt++) {
                const attemptStartTime = Date.now();
                try {
                    this.log('log', 'checkAndUpdateBundle', `尝试 ${attempt + 1}/${retries}`, { bundleName, version: remoteInfo.version });
                    
                    await this.downloadBundle(remoteInfo, (progress) => {
                        // 只在关键进度点记录日志
                        if (progress === 0 || progress >= 0.25 && progress < 1 && progress % 0.25 < 0.01 || progress === 1) {
                            this.log('log', 'checkAndUpdateBundle', `下载进度`, { 
                                bundleName, 
                                progress: `${(progress * 100).toFixed(0)}%` 
                            });
                        }
                        options.onProgress?.(progress, bundleName);
                    });
                    
                    this.log('log', 'checkAndUpdateBundle', `下载完成，开始加载`, { bundleName, version: remoteInfo.version });
                    await this.loadBundle(bundleName, remoteInfo.version);
                    
                    this.log('log', 'checkAndUpdateBundle', `保存版本号`, { bundleName, version: remoteInfo.version });
                    this.saveLocalVersion(bundleName, remoteInfo.version);
                    
                    const duration = Date.now() - startTime;
                    this.log('log', 'checkAndUpdateBundle', `Bundle更新成功`, { 
                        bundleName,
                        version: remoteInfo.version,
                        fromCache: false,
                        duration: `${duration}ms`,
                        attempts: attempt + 1
                    });
                    
                    return {
                        bundleName,
                        success: true,
                        fromCache: false,
                        version: remoteInfo.version
                    };
                } catch (err) {
                    lastError = err as Error;
                    const attemptDuration = Date.now() - attemptStartTime;
                    const delay = attempt < retries - 1 ? this.retryDelay * (attempt + 1) : 0;
                    
                    this.log('warn', 'checkAndUpdateBundle', `更新失败 (尝试 ${attempt + 1}/${retries})`, {
                        bundleName,
                        version: remoteInfo.version,
                        error: (err as Error)?.message,
                        duration: `${attemptDuration}ms`,
                        nextRetryDelay: delay > 0 ? `${delay}ms` : '无'
                    });
                    
                    if (attempt < retries - 1) {
                        this.log('log', 'checkAndUpdateBundle', `等待 ${delay}ms 后重试`);
                        await this.delay(delay);
                    }
                }
            }
            
            // 4. 所有重试失败，尝试回退
            if (options.allowRollback && localVer) {
                this.log('log', 'checkAndUpdateBundle', `步骤3: 所有重试失败，尝试版本回退`, { 
                    bundleName, 
                    targetVersion: remoteInfo.version,
                    rollbackVersion: localVer
                });
                const rolledBack = await this.tryRollback(bundleName, [localVer]);
                if (rolledBack) {
                    const duration = Date.now() - startTime;
                    this.log('log', 'checkAndUpdateBundle', `版本回退成功`, { 
                        bundleName,
                        version: localVer,
                        duration: `${duration}ms`
                    });
                    return {
                        bundleName,
                        success: true,
                        fromCache: true,
                        version: localVer
                    };
                } else {
                    this.log('warn', 'checkAndUpdateBundle', `版本回退失败`, { bundleName, rollbackVersion: localVer });
                }
            }
            
            const duration = Date.now() - startTime;
            this.log('error', 'checkAndUpdateBundle', `Bundle更新失败`, { 
                bundleName,
                targetVersion: remoteInfo.version,
                duration: `${duration}ms`,
                attempts: retries,
                lastError: lastError?.message
            });
            
            return {
                bundleName,
                success: false,
                fromCache: false,
                version: remoteInfo.version,
                error: lastError || new Error('Bundle更新失败')
            };
            
        } catch (err) {
            const duration = Date.now() - startTime;
            this.log('error', 'checkAndUpdateBundle', `Bundle更新异常`, { 
                bundleName,
                error: (err as Error)?.message,
                duration: `${duration}ms`
            });
            
            return {
                bundleName,
                success: false,
                fromCache: false,
                version: '',
                error: err as Error
            };
        }
    }
    
    /**
     * 下载Bundle（通过loadBundle实现，Cocos会自动下载）
     */
    private static async downloadBundle(
        bundleInfo: BundleInfo,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        if (!bundleInfo.url) {
            this.log('error', 'downloadBundle', 'Bundle URL未指定', { bundleInfo });
            throw new Error('Bundle URL未指定');
        }
        
        this.log('log', 'downloadBundle', `开始下载Bundle`, { 
            url: bundleInfo.url,
            version: bundleInfo.version,
            size: bundleInfo.size ? `${(bundleInfo.size / 1024 / 1024).toFixed(2)}MB` : '未知'
        });
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let lastProgress = 0;
            
            assetManager.loadBundle(bundleInfo.url!, {
                onFileProgress: (loaded: number, total: number) => {
                    const progress = total > 0 ? loaded / total : 0;
                    // 只在进度有明显变化时记录（避免日志过多）
                    if (Math.abs(progress - lastProgress) >= 0.1 || progress === 1) {
                        this.log('log', 'downloadBundle', `下载进度`, { 
                            url: bundleInfo.url,
                            progress: `${(progress * 100).toFixed(0)}%`,
                            loaded: `${(loaded / 1024 / 1024).toFixed(2)}MB`,
                            total: `${(total / 1024 / 1024).toFixed(2)}MB`
                        });
                        lastProgress = progress;
                    }
                    onProgress?.(progress);
                }
            }, (err, bundle) => {
                const duration = Date.now() - startTime;
                
                if (err || !bundle) {
                    this.log('error', 'downloadBundle', 'Bundle下载失败', { 
                        url: bundleInfo.url,
                        error: err?.message || 'bundle null',
                        duration: `${duration}ms`
                    });
                    return reject(err || new Error('Bundle下载失败'));
                }
                
                onProgress?.(1);
                this.log('log', 'downloadBundle', 'Bundle下载成功', { 
                    url: bundleInfo.url,
                    duration: `${duration}ms`
                });
                resolve();
            });
        });
    }
    
    /**
     * 加载Bundle到内存
     */
    static async loadBundle(bundleName: string, version: string): Promise<AssetManager.Bundle> {
        this.log('log', 'loadBundle', `开始加载Bundle到内存`, { bundleName, version });
        
        // 移除内存中的旧Bundle实例
        const existingBundle = assetManager.getBundle(bundleName);
        if (existingBundle) {
            this.log('log', 'loadBundle', `移除内存中的旧Bundle实例`, { bundleName });
            existingBundle.releaseAll();
            assetManager.removeBundle(existingBundle);
        }
        
        const bundleUrl = `${this.baseUrl}/${bundleName}/${version}`;
        this.log('log', 'loadBundle', `Bundle URL`, { bundleName, version, bundleUrl });
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            assetManager.loadBundle(bundleUrl, (err, bundle) => {
                const duration = Date.now() - startTime;
                
                if (err || !bundle) {
                    this.log('error', 'loadBundle', 'Bundle加载失败', { 
                        bundleName, 
                        version,
                        bundleUrl,
                        error: err?.message || `Bundle ${bundleName} 加载失败`,
                        duration: `${duration}ms`
                    });
                    return reject(err || new Error(`Bundle ${bundleName} 加载失败`));
                }
                
                this.log('log', 'loadBundle', 'Bundle加载成功', { 
                    bundleName, 
                    version,
                    duration: `${duration}ms`
                });
                resolve(bundle);
            });
        });
    }
    
    /**
     * 尝试回退到已缓存的版本
     */
    static async tryRollback(
        bundleName: string,
        candidateVersions: string[]
    ): Promise<boolean> {
        this.log('log', 'tryRollback', `开始尝试版本回退`, { 
            bundleName, 
            candidateVersions,
            count: candidateVersions.length
        });
        
        for (let i = 0; i < candidateVersions.length; i++) {
            const version = candidateVersions[i];
            this.log('log', 'tryRollback', `尝试版本 ${i + 1}/${candidateVersions.length}`, { 
                bundleName, 
                version 
            });
            
            if (this.hasCachedVersion(bundleName, version)) {
                try {
                    this.log('log', 'tryRollback', `版本 ${version} 有缓存，尝试加载`, { bundleName });
                    await this.loadBundle(bundleName, version);
                    this.log('log', 'tryRollback', `版本回退成功`, { bundleName, version });
                    return true;
                } catch (err) {
                    this.log('warn', 'tryRollback', `版本 ${version} 加载失败，尝试下一个`, { 
                        bundleName, 
                        version,
                        error: (err as Error)?.message
                    });
                    // 继续尝试下一个版本
                }
            } else {
                this.log('log', 'tryRollback', `版本 ${version} 无缓存，跳过`, { bundleName, version });
            }
        }
        
        this.log('warn', 'tryRollback', `所有候选版本都失败`, { bundleName, candidateVersions });
        return false;
    }
    
    /**
     * 更新多个Bundle（按优先级分组）
     */
    static async updateAllBundles(
        bundleNames: string[],
        options: UpdateOptions = {}
    ): Promise<UpdateResult[]> {
        const startTime = Date.now();
        this.log('log', 'updateAllBundles', `开始更新多个Bundle`, { 
            bundleNames, 
            count: bundleNames.length,
            stopOnError: options.stopOnError
        });
        
        // 按优先级分组
        const priorityGroups: { [priority: number]: string[] } = {};
        for (const bundleName of bundleNames) {
            const priority = BUNDLE_PRIORITY[bundleName] ?? 1;
            if (!priorityGroups[priority]) {
                priorityGroups[priority] = [];
            }
            priorityGroups[priority].push(bundleName);
        }
        
        this.log('log', 'updateAllBundles', `按优先级分组`, { 
            groups: Object.keys(priorityGroups).map(p => ({
                priority: parseInt(p),
                bundles: priorityGroups[parseInt(p)]
            }))
        });
        
        const results: UpdateResult[] = [];
        
        // 按优先级从低到高处理（P0优先）
        const sortedPriorities = Object.keys(priorityGroups)
            .map(p => parseInt(p))
            .sort((a, b) => a - b);
        
        for (const priority of sortedPriorities) {
            const bundles = priorityGroups[priority];
            this.log('log', 'updateAllBundles', `处理优先级 ${priority} 的Bundle`, { bundles });
            
            if (priority === 0) {
                // P0 Bundle串行更新（保证顺序）
                this.log('log', 'updateAllBundles', `P0 Bundle串行更新`, { bundles });
                for (const bundleName of bundles) {
                    this.log('log', 'updateAllBundles', `更新P0 Bundle`, { bundleName });
                    const result = await this.checkAndUpdateBundle(bundleName, options);
                    results.push(result);
                    
                    this.log('log', 'updateAllBundles', `P0 Bundle更新结果`, { 
                        bundleName,
                        success: result.success,
                        fromCache: result.fromCache,
                        version: result.version,
                        error: result.error?.message
                    });
                    
                    if (!result.success && options.stopOnError) {
                        this.log('error', 'updateAllBundles', `P0 Bundle ${bundleName} 更新失败，停止更新`);
                        return results;
                    }
                }
            } else {
                // P1 Bundle并行更新（提高速度）
                this.log('log', 'updateAllBundles', `P1 Bundle并行更新`, { bundles });
                const promises = bundles.map(bundleName =>
                    this.checkAndUpdateBundle(bundleName, options)
                );
                const p1Results = await Promise.allSettled(promises);
                
                for (let i = 0; i < p1Results.length; i++) {
                    const settled = p1Results[i];
                    if (settled.status === 'fulfilled') {
                        const result = settled.value;
                        results.push(result);
                        
                        this.log('log', 'updateAllBundles', `P1 Bundle更新结果`, { 
                            bundleName: bundles[i],
                            success: result.success,
                            fromCache: result.fromCache,
                            version: result.version,
                            error: result.error?.message
                        });
                        
                        if (!result.success && options.stopOnError) {
                            this.log('error', 'updateAllBundles', `P1 Bundle ${bundles[i]} 更新失败，停止更新`);
                            return results;
                        }
                    } else {
                        const errorResult = {
                            bundleName: bundles[i],
                            success: false,
                            fromCache: false,
                            version: '',
                            error: settled.reason
                        };
                        results.push(errorResult);
                        this.log('error', 'updateAllBundles', `P1 Bundle更新异常`, { 
                            bundleName: bundles[i],
                            error: (settled.reason as Error)?.message
                        });
                    }
                }
            }
        }
        
        const duration = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        this.log('log', 'updateAllBundles', `所有Bundle更新完成`, { 
            total: results.length,
            success: successCount,
            failed: failCount,
            duration: `${duration}ms`
        });
        
        return results;
    }
    
    /**
     * 清理缓存（可指定Bundle或清理所有）
     */
    static clearCache(bundleName?: string): void {
        const cm: any = assetManager.cacheManager;
        if (!cm || !cm.clearCache) {
            this.log('warn', 'clearCache', '缓存管理器不可用');
            return;
        }
        
        if (bundleName) {
            // 清理特定Bundle的缓存（需要遍历缓存项）
            // 注意：Cocos的缓存管理器可能不支持按Bundle清理
            this.log('warn', 'clearCache', '按Bundle清理缓存功能未完全实现', { bundleName });
        } else {
            // 清理所有缓存
            cm.clearCache();
            this.log('log', 'clearCache', '已清理所有缓存');
        }
    }
    
    /**
     * 生成版本候选列表（用于回退）
     */
    static generateVersionCandidates(targetVersion: string, localVersion?: string): string[] {
        const candidates: string[] = [];
        const target = parseInt(targetVersion);
        
        if (isNaN(target)) {
            // 如果不是数字版本，直接返回目标版本和本地版本
            if (localVersion) candidates.push(localVersion);
            candidates.push(targetVersion);
            return candidates;
        }
        
        // 从目标版本向下，最多尝试5个版本
        for (let i = 1; i <= 5; i++) {
            const version = String(target - i);
            if (!candidates.includes(version)) {
                candidates.push(version);
            }
        }
        
        // 添加本地版本（如果不同）
        if (localVersion && !candidates.includes(localVersion)) {
            candidates.push(localVersion);
        }
        
        return candidates;
    }
    
    /**
     * 工具方法：拼接URL
     */
    private static joinUrl(base: string, path: string): string {
        if (base.endsWith('/')) {
            return base + path;
        }
        return base + '/' + path;
    }
    
    /**
     * 工具方法：延迟
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

