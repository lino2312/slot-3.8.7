import { assetManager, JsonAsset, native } from 'cc';

type VersionManifest = {
    appVersion?: string;
    force?: boolean;
    bundles: Record<string, string>;
};

export class HotUpdate {
    /**
     * 日志输出（带时间戳和步骤标识）
     */
    private static log(step: string, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const prefix = `[HotUpdate:${step}]`;
        console.log(`${prefix} [${timestamp}] ${message}`, data || '');
    }

    // 拉取版本清单（原生/H5通用）
    static fetchManifest(url: string, noCache: boolean = true): Promise<VersionManifest> {
        this.log('fetchManifest', `开始获取版本清单`, { url, noCache });
        
        const cm: any = assetManager.cacheManager;
        let finalUrl = url;

        if (noCache) {
            // 删除本地缓存的旧清单
            try {
                cm?.removeCache?.(url);
                cm?.removeCache?.(url + '?'); // 兼容某些变体
                this.log('fetchManifest', '已清除本地缓存');
            } catch (err) {
                this.log('fetchManifest', '清除缓存失败', err);
            }
            // 追加时间戳，绕过 CDN/浏览器缓存
            finalUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
            this.log('fetchManifest', '添加时间戳绕过缓存', { finalUrl });
        }

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            this.log('fetchManifest', '开始下载版本清单', { finalUrl });
            
            assetManager.loadRemote(finalUrl, { ext: '.json' }, (err, asset: JsonAsset) => {
                const duration = Date.now() - startTime;
                
                if (err || !asset) {
                    this.log('fetchManifest', '获取版本清单失败', { 
                        error: err?.message || 'manifest null',
                        duration: `${duration}ms`
                    });
                    return reject(err || new Error('manifest null'));
                }
                
                const manifest = asset.json as VersionManifest;
                const bundleCount = manifest.bundles ? Object.keys(manifest.bundles).length : 0;
                
                this.log('fetchManifest', '版本清单获取成功', {
                    duration: `${duration}ms`,
                    bundleCount,
                    bundles: Object.keys(manifest.bundles || {}),
                    force: manifest.force,
                    appVersion: manifest.appVersion
                });
                
                resolve(manifest);
            });
        });
    }

    // 判断本地缓存里是否已有该版本（原生）
    static hasCachedVersionByPath(hallBase: string, ver: number | string): boolean {
        ver = String(ver);
        this.log('hasCachedVersion', `检查本地缓存版本`, { base: hallBase, version: ver });
        
        const cm: any = assetManager.cacheManager;
        if (!cm) {
            this.log('hasCachedVersion', '缓存管理器不可用', { base: hallBase, version: ver });
            return false;
        }
        
        const baseV = this.joinUrl(hallBase, ver); // e.g. .../hall/188
        const cfgUrl = this.joinUrl(baseV, 'cc.config.json');
        const localPath = cm.getCache?.(cfgUrl);
        
        this.log('hasCachedVersion', '获取缓存路径', { 
            base: hallBase, 
            version: ver, 
            configUrl: cfgUrl,
            localPath: localPath || '未找到'
        });
        
        if (!localPath) {
            this.log('hasCachedVersion', '缓存路径不存在', { base: hallBase, version: ver });
            return false;
        }
        
        const exists = typeof native !== 'undefined' && (native as any).fileUtils?.isFileExist(localPath);
        this.log('hasCachedVersion', exists ? '缓存文件存在' : '缓存文件不存在', { 
            base: hallBase, 
            version: ver,
            localPath 
        });
        
        return exists;
    }

    // 加载远程 bundle（带版本），返回是否来自缓存
    static loadBundleByPathVersion(base: string, bundleName: string, ver: number | string, onProgress?: (p: number) => void) {
        ver = String(ver);
        const baseV = this.joinUrl(base, ver); // e.g. .../hall/188
        
        this.log('loadBundle', `开始加载Bundle`, { 
            bundleName, 
            version: ver, 
            baseUrl: baseV 
        });
        
        return new Promise<{ fromCache: boolean }>((resolve, reject) => {
            const startTime = Date.now();
            
            // 同会话想切版本，先移除旧实例
            const mem = assetManager.getBundle(bundleName);
            if (mem) {
                this.log('loadBundle', `移除内存中的旧Bundle实例`, { bundleName });
                mem.releaseAll();
                assetManager.removeBundle(mem);
            }
            
            const fromCache = this.hasCachedVersionByPath(base, ver);
            this.log('loadBundle', fromCache ? '从缓存加载' : '从远程下载', { 
                bundleName, 
                version: ver 
            });
            
            let lastProgress = 0;
            // 注意：Cocos Creator 的 loadBundle 应该能够自动扫描目录找到配置文件
            // 即使文件名是 cc.config.<md5>.json，引擎也会自动处理
            // 如果遇到404错误，可能是服务器不支持目录扫描，需要在服务器端配置
            assetManager.loadBundle(baseV, {
                onFileProgress: (l: number, t: number) => {
                    const progress = t > 0 ? l / t : 0;
                    // 只在进度有明显变化时记录（避免日志过多）
                    if (Math.abs(progress - lastProgress) >= 0.1 || progress === 1) {
                        this.log('loadBundle', `下载进度`, { 
                            bundleName, 
                            version: ver,
                            progress: `${(progress * 100).toFixed(0)}%`,
                            loaded: l,
                            total: t
                        });
                        lastProgress = progress;
                    }
                    onProgress?.(progress);
                }
            }, (err, bundle) => {
                const duration = Date.now() - startTime;
                
                if (err || !bundle) {
                    this.log('loadBundle', 'Bundle加载失败', { 
                        bundleName, 
                        version: ver,
                        error: err?.message || 'bundle null',
                        duration: `${duration}ms`
                    });
                    return reject(err || new Error('bundle null'));
                }
                
                onProgress?.(1);
                this.log('loadBundle', 'Bundle加载成功', { 
                    bundleName, 
                    version: ver,
                    fromCache,
                    duration: `${duration}ms`
                });
                
                resolve({ fromCache });
            });
        });
    }

    // 回退到已缓存的历史版本（传入候选版本列表，按从高到低尝试）
    static async tryRollback(fullBundleBase: string, bundleName: string, candidateVersions: string[], onProgress?: (p: number) => void): Promise<boolean> {
        this.log('tryRollback', `开始尝试版本回退`, { 
            bundleName, 
            base: fullBundleBase,
            candidateVersions 
        });
        
        for (let i = 0; i < candidateVersions.length; i++) {
            const v = candidateVersions[i];
            this.log('tryRollback', `尝试版本 ${i + 1}/${candidateVersions.length}`, { 
                bundleName, 
                version: v 
            });
            
            if (this.hasCachedVersionByPath(fullBundleBase, v)) {
                try {
                    this.log('tryRollback', `版本 ${v} 有缓存，尝试加载`, { bundleName });
                    await this.loadBundleByPathVersion(fullBundleBase, bundleName, v, onProgress);
                    this.log('tryRollback', `版本回退成功`, { bundleName, version: v });
                    return true;
                } catch (err) {
                    this.log('tryRollback', `版本 ${v} 加载失败，尝试下一个`, { 
                        bundleName, 
                        version: v,
                        error: (err as Error)?.message 
                    });
                    // try next
                }
            } else {
                this.log('tryRollback', `版本 ${v} 无缓存，跳过`, { bundleName, version: v });
            }
        }
        
        this.log('tryRollback', `所有候选版本都失败`, { bundleName, candidateVersions });
        return false;
    }

    static withVersionParam(url: string, v: string) {
        return url.includes('?') ? `${url}&v=${encodeURIComponent(v)}` : `${url}?v=${encodeURIComponent(v)}`;
    }

    static joinUrl(base: string, path: string) {
        if (base.endsWith('/')) return base + path;
        return base + '/' + path;
    }
}