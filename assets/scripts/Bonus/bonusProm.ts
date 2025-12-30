/**
 * Bonus-促销 (Cocos Creator 3.8.7 版本)
 */
import { _decorator, assetManager, Component, find, ImageAsset, instantiate, Layout, Node, Prefab, RichText, ScrollView, Sprite, SpriteFrame, sys, Texture2D, UITransform, Widget } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
import { yd_bonus_model } from './bonusModel';
const { ccclass, property } = _decorator;

@ccclass('bonusProm')
export class yd_bonus_prom extends Component {

    @property(Node)
    listView: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property(Prefab)
    promo_sample: Prefab = null!;

    private _model: yd_bonus_model | null = null;
    private datasource: any[] = [];
    private promoSample: Node | null = null;

    onLoad() {
        this._model = yd_bonus_model.getInstance();
    }

    onEnable() {
        if (this.datasource.length === 0 && this._model) {
            this._model.getActivityList()
                .then((response: any) => {
                    console.log('获取到的数据:', response);
                    this.listView.removeAllChildren();
                    this.datasource = response.data.list;
                    this.loadImagesSequentially();
                })
                .catch((error: any) => {
                    console.error('发生错误:', error);
                });
        }
    }

    async loadImagesSequentially() {
        for (let i = 0; i < this.datasource.length; i++) {
            const element = this.datasource[i];
            const prefab = instantiate(this.item);
            if (!prefab) continue;

            // 加载 banner 图片
            this.loadRemoteImage(element.bannerUrl, (spriteFrame) => {
                const sprite = prefab.getComponent(Sprite);
                if (sprite && spriteFrame) {
                    sprite.spriteFrame = spriteFrame;
                }
            });

            this.listView.addChild(prefab);
            prefab.on(Node.EventType.TOUCH_END, () => {
                if (element.contents) {
                    sys.openURL(element.contents);
                } else {
                    App.LoadMaskManager.waitOpen();
                    // @ts-ignore
                    App.HttpUtils.sendPostRequest('GetActivityDetails', { bannerId: element.bannerID }, (error: any, response: any) => {
                        App.LoadMaskManager.waitClose();
                        if (error) {
                            console.error(error);
                            return;
                        }
                        if (response.code === 0 && response.msg === 'Succeed') {
                            this.promoSample = instantiate(this.promo_sample);
                            const node = this.promoSample.getChildByPath('New ScrollView/view/content');
                            if (!node) return;

                            if (Config.gameChannel === 'D106') {
                                node.children[0].active = false;
                                const layout = node.getComponent(Layout);
                                layout && layout.updateLayout();
                            }

                            // 设置封面图
                            this.loadRemoteImage(response.data.coverUrl, (spriteFrame, texture) => {
                                const spNode = find('Canvas/promSample/New ScrollView/view/content').children[0];
                                const spUITrans = spNode.getComponent(UITransform);
                                if (spriteFrame && spNode) {
                                    const sprite = spNode.getComponent(Sprite);
                                    if (sprite) sprite.spriteFrame = spriteFrame;

                                    if (Config.gameChannel === 'D105') {
                                        spUITrans.width = 1080;
                                        spUITrans.height = (texture.height / texture.width) * 1080;
                                        const layout = node.getComponent(Layout);
                                        layout && layout.updateLayout();
                                    }
                                }
                            });

                            // 文字区域
                            node.children[1].active = false;

                            const content = response.data.img;
                            try {
                                const parsed = JSON.parse(content);
                                if (Array.isArray(parsed)) {
                                    for (const imgData of parsed) {
                                        if (imgData.Url) {
                                            const imageNode = new Node('PromoImage');
                                            const sprite = imageNode.addComponent(Sprite);

                                            let ui = imageNode.getComponent(UITransform) || imageNode.addComponent(UITransform);
                                            ui.setAnchorPoint(0.5, 1);
                                            imageNode.setPosition(0, 0);
                                            assetManager.loadRemote(imgData.Url, (err, imageAsset) => {
                                                if (err) {
                                                    console.error('Failed to load image:', err);
                                                    return;
                                                }

                                                const spriteFrame = new SpriteFrame();
                                                const texture = new Texture2D();
                                                texture.image = imageAsset;
                                                spriteFrame.texture = texture;
                                                sprite.spriteFrame = spriteFrame;
                                                console.log("parsed========>", imageAsset);

                                                ui.width = imageAsset.width;
                                                if (Config.gameChannel === "D105") ui.width = 1080
                                                ui.height = imageAsset.height;

                                                find('Canvas/promSample/New ScrollView/view/content').addChild(imageNode);
                                            });
                                        }
                                    }
                                } else {
                                    throw new Error('不是数组');
                                }
                            } catch (e) {
                                node.children[1].active = true;
                                const richText = node.children[1].getComponent(RichText);
                                if (richText) richText.string = content;
                            }
                            this.scheduleOnce(() => {
                                const scrollNode = find('Canvas/promSample/New ScrollView')
                                scrollNode.getComponent(Widget).updateAlignment();
                                find('Canvas/promSample/New ScrollView/view').getComponent(Widget).updateAlignment();
                                scrollNode.getComponent(ScrollView).scrollToTop(0, false);
                            }, 0.1)
                            // @ts-ignore
                            App.PopUpManager.addPopup(this.promoSample);
                        } else {
                            // @ts-ignore
                            App.AlertManager.showFloatTip(response.msg);
                        }
                    });
                }
            });

            // this.listView.addChild(prefab);
        }
    }

    private loadRemoteImage(url: string, callback: (spriteFrame?: SpriteFrame, texture?: Texture2D) => void) {
        if (!url) return;
        assetManager.loadRemote<ImageAsset>(url, (err, imageAsset) => {
            if (err) {
                console.error('Failed to load image:', err);
                return;
            }
            const texture = new Texture2D();
            texture.image = imageAsset;
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            callback(spriteFrame, texture);
        });
    }
}
