import { AnimationClip, AssetManager, assetManager, AudioClip, Font, ImageAsset, native, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, Texture2D ,sp, JsonAsset, ParticleAsset} from "cc";
import { App } from '../App';

export class ResUtils {

    static getDefaultTransparentSpriteFrame() {
        const sf = new SpriteFrame();
        const tex = new Texture2D();
        tex.reset({
            width: 1,
            height: 1,
            format: Texture2D.PixelFormat.RGBA8888,
        });
        sf.texture = tex;
        return sf;
    }

    static getRes(url: string, type: any, iscommon?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            // 优先用 subGameBundle
            const subGameBundle = App.SubGameManager.getGameBundle();
            const hallBundle = App.GameManager.getHallBundle();
            if (iscommon) {
                hallBundle.load(url, type, (err, res: any) => {
                    if (!err && res) {
                        resolve(res);
                    } else {
                        reject('资源加载失败: ' + (err));
                    }
                });
            }
            if (subGameBundle) {
                subGameBundle.load(url, type, (err, res: any) => {
                    if (!err && res) {
                        resolve(res);
                    } else if (hallBundle) {
                        hallBundle.load(url, type, (err2, res2: any) => {
                            if (!err2 && res2) {
                                resolve(res2);
                            } else {
                                resources.load(url, type, (err3, res3: any) => {
                                    if (!err3 && res3) {
                                        resolve(res3);
                                    } else {
                                        reject('资源加载失败: ' + (err3 || err2 || err));
                                    }
                                });
                            }
                        });
                    } else {
                        resources.load(url, type, (err3, res3: any) => {
                            if (!err3 && res3) {
                                resolve(res3);
                            } else {
                                reject('资源加载失败: ' + (err3 || err));
                            }
                        });
                    }
                });
            } else if (hallBundle) {
                hallBundle.load(url, type, (err, res: any) => {
                    if (!err && res) {
                        resolve(res);
                    } else {
                        resources.load(url, type, (err2, res2: any) => {
                            if (!err2 && res2) {
                                resolve(res2);
                            } else {
                                reject('资源加载失败: ' + (err2 || err));
                            }
                        });
                    }
                });
            } else {
                resources.load(url, type, (err, res: any) => {
                    if (!err && res) {
                        resolve(res);
                    } else {
                        reject('资源加载失败: ' + err);
                    }
                });
            }
        });
    }

    static getRemoteSpriteFrame(url: string): Promise<SpriteFrame> {
        return new Promise<SpriteFrame>((resolve, reject) => {
            let ext = '';
            if (url.split('.').pop()?.toLowerCase() === 'jpg' || url.split('.').pop()?.toLowerCase() === 'jpeg') {
                ext = '.jpg';
            } else {
                ext = '.png';
            }
            assetManager.loadRemote<ImageAsset>(url, { ext: ext, cacheEnabled: true }, (err, image) => {
                if (err || !image) {
                    return reject(err);
                }
                const spriteFrame = SpriteFrame.createWithImage(image);
                // console.log("缓存第三方游戏图标:", key, url);
                resolve(spriteFrame);
            });
        });
    }

    //获取预制体
    static getPrefab(url: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            const subGameBundle = App.SubGameManager.getGameBundle();
            const hallBundle = App.GameManager.getHallBundle();
            if (subGameBundle) {
                subGameBundle.load(url, Prefab, (err, prefab: Prefab) => {
                    if (!err && prefab) {
                        resolve(prefab);
                    } else if (hallBundle) {
                        hallBundle.load(url, Prefab, (err2, prefab2: Prefab) => {
                            if (!err2 && prefab2) {
                                resolve(prefab2);
                            } else {
                                resources.load(url, Prefab, (err3, prefab3: Prefab) => {
                                    if (!err3 && prefab3) {
                                        resolve(prefab3);
                                    } else {
                                        reject('Prefab加载失败: ' + (err3 || err2 || err));
                                    }
                                });
                            }
                        });
                    } else {
                        resources.load(url, Prefab, (err3, prefab3: Prefab) => {
                            if (!err3 && prefab3) {
                                resolve(prefab3);
                            } else {
                                reject('Prefab加载失败: ' + (err3 || err));
                            }
                        });
                    }
                });
            } else if (hallBundle) {
                hallBundle.load(url, Prefab, (err, prefab: Prefab) => {
                    if (!err && prefab) {
                        resolve(prefab);
                    } else {
                        resources.load(url, Prefab, (err2, prefab2: Prefab) => {
                            if (!err2 && prefab2) {
                                resolve(prefab2);
                            } else {
                                reject('Prefab加载失败: ' + (err2 || err));
                            }
                        });
                    }
                });
            } else {
                resources.load(url, Prefab, (err, prefab: Prefab) => {
                    if (!err && prefab) {
                        resolve(prefab);
                    } else {
                        reject('Prefab加载失败: ' + err);
                    }
                });
            }
        });
    }

    static getSpriteFrameAsync(url: string): Promise<SpriteFrame> {
        return new Promise(async (resolve, reject) => {
            try {
                const spriteFrame = await ResUtils.getSpriteFrame(url);
                resolve(spriteFrame);
            } catch (err) {
                reject(err);
            }
        });
    }

    static getSpriteFrame(url: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const subGameBundle = App.SubGameManager.getGameBundle();
            const hallBundle = App.GameManager.getHallBundle();
            if (subGameBundle) {
                subGameBundle.load(url, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (!err && spriteFrame) {
                        resolve(spriteFrame);
                    } else if (hallBundle) {
                        hallBundle.load(url, SpriteFrame, (err2, spriteFrame2: SpriteFrame) => {
                            if (!err2 && spriteFrame2) {
                                resolve(spriteFrame2);
                            } else {
                                resources.load(url, SpriteFrame, (err3, spriteFrame3: SpriteFrame) => {
                                    if (!err3 && spriteFrame3) {
                                        resolve(spriteFrame3);
                                    } else {
                                        reject('SpriteFrame加载失败: ' + (err3 || err2 || err));
                                    }
                                });
                            }
                        });
                    } else {
                        resources.load(url, SpriteFrame, (err3, spriteFrame3: SpriteFrame) => {
                            if (!err3 && spriteFrame3) {
                                resolve(spriteFrame3);
                            } else {
                                reject('SpriteFrame加载失败: ' + (err3 || err));
                            }
                        });
                    }
                });
            } else if (hallBundle) {
                hallBundle.load(url, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (!err && spriteFrame) {
                        resolve(spriteFrame);
                    } else {
                        resources.load(url, SpriteFrame, (err2, spriteFrame2: SpriteFrame) => {
                            if (!err2 && spriteFrame2) {
                                resolve(spriteFrame2);
                            } else {
                                reject('SpriteFrame加载失败: ' + (err2 || err));
                            }
                        });
                    }
                });
            } else {
                resources.load(url, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (!err && spriteFrame) {
                        resolve(spriteFrame);
                    } else {
                        reject('SpriteFrame加载失败: ' + err);
                    }
                });
            }
        });
    }

    /**
     * 从图集获取SpriteFrame，优先从subGameBundle，其次hall bundle，最后resources
     * url格式: 'plist/texture_usercommon/vip_1'，即 图集路径/帧名
     */
    static getSpriteFrameFormAtlas(url: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const lastSlash = url.lastIndexOf('/');
            if (lastSlash === -1) {
                reject('url格式错误');
                return;
            }
            const atlasPath = url.substring(0, lastSlash);
            const frameName = url.substring(lastSlash + 1);

            const subGameBundle = App.SubGameManager.getGameBundle();
            const hallBundle = App.GameManager.getHallBundle();

            const tryLoadFromAtlas = (bundle: any, cb: (err: any, atlas: SpriteAtlas) => void) => {
                if (bundle) {
                    bundle.load(atlasPath, SpriteAtlas, cb);
                } else {
                    cb('no bundle', null);
                }
            };

            tryLoadFromAtlas(subGameBundle, (err, atlas: SpriteAtlas) => {
                if (!err && atlas) {
                    const spriteFrame = atlas.getSpriteFrame(frameName);
                    if (spriteFrame) {
                        resolve(spriteFrame);
                        return;
                    } else {
                        reject('未找到SpriteFrame: ' + frameName);
                        return;
                    }
                }
                tryLoadFromAtlas(hallBundle, (err2, atlas2: SpriteAtlas) => {
                    if (!err2 && atlas2) {
                        const spriteFrame2 = atlas2.getSpriteFrame(frameName);
                        if (spriteFrame2) {
                            resolve(spriteFrame2);
                            return;
                        } else {
                            reject('未找到SpriteFrame: ' + frameName);
                            return;
                        }
                    }
                    resources.load(atlasPath, SpriteAtlas, (err3, atlas3: SpriteAtlas) => {
                        if (!err3 && atlas3) {
                            const spriteFrame3 = atlas3.getSpriteFrame(frameName);
                            if (spriteFrame3) {
                                resolve(spriteFrame3);
                            } else {
                                reject('未找到SpriteFrame: ' + frameName);
                            }
                        } else {
                            reject('图集加载失败: ' + (err3 || err2 || err));
                        }
                    });
                });
            });
        });
    }

    static loadbundle(bundlename: string, onComplete?: Function | null, onErr?: Function | null, onProgress?: Function | null) {
        // 用数字参数计算进度：progress = loaded / total
        const option = {
            onFileProgress: (loaded: number, total: number) => {
                if (onProgress) {
                    const p = total > 0 ? loaded / total : 0;
                    try { onProgress(p); } catch { }
                }
            }
        };

        assetManager.loadBundle(bundlename, option, (err, bundle) => {
            if (err) {
                console.warn('加载 bundlename 失败:', bundlename, err);
                onErr && onErr(err);
                return;
            }
            if (!bundle) {
                console.warn('加载 bundlename 失败(空 bundle):', bundlename);
                onErr && onErr(new Error('bundle is null'));
                return;
            }

            // 有些环境 onFileProgress 不会触发（本地/缓存），这里补一次 100%
            try { onProgress && onProgress(1); } catch { }

            onComplete && onComplete(bundle);
        });
    }

    static loadBundle1(bundleName: string, callback: (progress: number, path: string, asset: any, bundleAA: AssetManager.Bundle) => void) {
        assetManager.loadBundle(bundleName, (err: Error, bundle: AssetManager.Bundle) => {
            if (err) { console.error(`loadBundle加载bundle失败！(${bundleName})`); return; }
            let files = bundle.getDirWithPath('');
            let cur = 0, total = files.length;
            for (let i = 0; i < total; ++i) {
                let name = files[i].path;
                let type = files[i].ctor.prototype.constructor;
                if (type !== AudioClip && type !== SpriteFrame && type !== JsonAsset
                    && type !== ParticleAsset && type !== Prefab && type !== sp.SkeletonData) {
                    callback(++cur / total, null, null, bundle);
                    continue;
                }
                bundle.load(name, type, (err: Error, asset: any) => {
                    let key = `${bundleName}/${type === SpriteFrame && name.endsWith('spriteFrame') ? name.substring(0, name.lastIndexOf('/')) : name}`;
                    if (err) { console.error(`loadBundle加载资源失败！(${key})`); callback(++cur / total, null, null, bundle); return; }
                    resources[key] = asset;
                    callback(++cur / total, key, type === JsonAsset ? asset.json : asset, bundle);
                });
            }
        });
    }

    /**
     * 预加载 bundle 根目录下的所有常用资源类型（Prefab/Atlas/SpriteFrame/Texture2D/Audio/Json/Font 等）
     * 注意：可能占用较大内存，请按需使用或限定子目录
     */
    static async preloadBundleAll(bundleName: string, onProgress?: (p: number) => void, onComplete?: () => void): Promise<void> {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) throw new Error('bundle not loaded: ' + bundleName);

        // 枚举想要纳入的类型
        const TYPES: any[] = [Prefab, SpriteAtlas, SpriteFrame, AudioClip, Font, AnimationClip];

        // 收集所有路径（去重）
        let paths: string[] = [];
        for (const T of TYPES) {
            const infos = bundle.getDirWithPath?.('', T) as any[] || [];
            const arr = infos.map((info: any) => info.path);
            if (arr?.length) paths.push(...arr);
        }
        // 去重
        paths = Array.from(new Set(paths));

        if (paths.length === 0) {
            onProgress && onProgress(1);
            return;
        }

        let loaded = 0;
        const total = paths.length;
        const tick = () => { onProgress && onProgress(loaded / total); };

        // 逐个加载（更稳，降低峰值内存；如需更快可分批并行）
        for (const p of paths) {
            // 不指定 type 让引擎根据路径自动推断
            // 如你更确定类型，也可按类型分类后分别 load
            await new Promise<void>((resolve, reject) => {
                bundle.load(p, (err: any) => {
                    loaded++;
                    tick();
                    err ? reject(err) : resolve();
                });
            });
        }
        onProgress && onProgress(1);
    }

    /**
     * 预加载（真正把资源文件读入并反序列化），progress 回调范围 0~1
     * items: [{ url:'ui/prefabs/PanelMain', type: Prefab }, { url:'ui/atlas/common', type: SpriteAtlas }]
     */
    static async preloadAssets(bundleName: string, items: { url: string; type: any }[], onProgress?: (p: number) => void): Promise<void> {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) throw new Error('bundle not loaded: ' + bundleName);
        let loaded = 0;
        const total = items.length;
        const next = () => {
            loaded++;
            onProgress && onProgress(loaded / total);
        };
        for (const it of items) {
            await new Promise<void>((resolve, reject) => {
                bundle.load(it.url, it.type, (err: any) => {
                    if (err) return reject(err);
                    next();
                    resolve();
                });
            });
        }
        onProgress && onProgress(1);
    }

    /**
     * 纹理/图集预热：将帧挂到一个隐藏节点触发上传 GPU
     */
    static warmupSpriteFrames(frames: SpriteFrame[]) {
        const tempNode = new Node('__warmup__');
        const sprite = tempNode.addComponent(Sprite);
        frames.forEach(f => {
            sprite.spriteFrame = f;
            // 强制访问纹理以确保已创建底层 GFX 资源
            (f.texture as any)?._getGFXTexture?.();
        });
        tempNode.destroy();
    }

    /**
     * 判断远程 bundle 是否已存在磁盘缓存（原生）
     * remoteUrlBase 示例: https://update.fastpay11.com/GameXVersion3/hall
     */
    static hasRemoteBundleCache(remoteUrlBase: string): boolean {
        if (!remoteUrlBase) return false;
        // 标准 config.json 路径
        const configUrl = remoteUrlBase.endsWith('/')
            ? remoteUrlBase + 'config.json'
            : remoteUrlBase + '/config.json';

        const cm: any = assetManager.cacheManager;
        if (!cm) return false; // H5 没必要判断
        const cachePath = cm.getCache(configUrl); // 可能返回本地文件路径或空
        if (!cachePath) return false;

        if (typeof native !== 'undefined' && native.fileUtils) {
            return native.fileUtils.isFileExist(cachePath);
        }
        return false;
    }
}