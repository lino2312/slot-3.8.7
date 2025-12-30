import { assetManager, ImageAsset, resources, SpriteFrame } from "cc";
import { App } from "../App";

export class CacheUtils {
    private static _instance: CacheUtils = null;

    public static getInstance(): CacheUtils {
        if (!this._instance) {
            this._instance = new CacheUtils();
        }
        return this._instance;
    }

    private sfCache: Map<string, any> = new Map();

    public async getSlotSpriteFrameCached(url: string): Promise<any> {
        if (this.sfCache.has(url)) {
            return Promise.resolve(this.sfCache.get(url));
        } else {
            const sf = await App.ResUtils.getSpriteFrame(`image/game/icon/${url}/spriteFrame`);
            this.sfCache.set(url, sf);
            return sf;
        }
    }

    public async getThirdGameSpriteFrameCached(key: string, url: string): Promise<SpriteFrame> {
        if (this.sfCache.has(key)) {
            return this.sfCache.get(key) as SpriteFrame;
        }
        const sf = await new Promise<SpriteFrame>((resolve, reject) => {
            let ext = '';
            if (url.split('.').pop()?.toLowerCase() === 'jpg' || url.split('.').pop()?.toLowerCase() === 'jpeg') {
                ext = '.jpg';
            } else {
                ext = '.png';
            }
            assetManager.loadRemote<ImageAsset>(url, { ext: ext, cacheEnabled: true }, (err, image) => {
                if (err || !image) {
                    return resolve(null);
                }
                const spriteFrame = SpriteFrame.createWithImage(image);
                // console.log("缓存第三方游戏图标:", key, url);
                resolve(spriteFrame);
            });
        });
        this.sfCache.set(key, sf);
        return sf;
    }
}