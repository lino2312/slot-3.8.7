import { _decorator, Component, Prefab, SpriteAtlas, SpriteFrame, Font, assetManager } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 需要动态获取的资源存放
 */
@ccclass('SlotGameAssetBase')
export class SlotGameAssetBase extends Component {
    @property({ type: [Prefab] })
    prefabs: Prefab[] = [];

    @property({ type: [SpriteAtlas] })
    atlas: SpriteAtlas[] = [];

    @property({ type: [SpriteFrame] })
    sprites: SpriteFrame[] = [];

    @property({ type: [Font] })
    fonts: Font[] = [];

    start() {
        // ...
    }

    onDestroy() {
        for (let i = 0; i < this.prefabs.length; i++) {
            if (this.prefabs[i]) {
                assetManager.releaseAsset(this.prefabs[i]);
            }
        }
        for (let i = 0; i < this.atlas.length; i++) {
            if (this.atlas[i]) {
                assetManager.releaseAsset(this.atlas[i]);
            }
        }
        for (let i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i]) {
                assetManager.releaseAsset(this.sprites[i]);
            }
        }
        for (let i = 0; i < this.fonts.length; i++) {
            if (this.fonts[i]) {
                assetManager.releaseAsset(this.fonts[i]);
            }
        }
    }

    // 根据名字获取预制
    public getPrefabByName(name: string): Prefab | undefined {
        return this.prefabs.find(item => item && item.name === name);
    }

    // 根据名字获取图集
    public getAtlasByName(name: string): SpriteAtlas | undefined {
        return this.atlas.find(item => item && (name + ".plist") === item.name);
    }

    // 根据名字获取图片
    public getSpriteByName(name: string): SpriteFrame | undefined {
        return this.sprites.find(item => item && item.name === name);
    }

    // 根据名字获取字体
    public getFontByName(name: string): Font | undefined {
        return this.fonts.find(item => item && item.name === name);
    }
}