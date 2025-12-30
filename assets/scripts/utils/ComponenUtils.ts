import { assetManager, Button, director, find, Label, Material, Node, ProgressBar, resources, RichText, Sprite, SpriteAtlas, SpriteFrame, Tween, tween, UIOpacity, Vec3 } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
export class ComponentUtils {

    static setLabelString(route: string, node: Node, str: string) {
        let label = find(route, node)
        if (label) {
            label.getComponent(Label).string = str
        }
    }

    static setRichTextString(route: string, node: Node, str: string) {
        let label = find(route, node)
        if (label) {
            label.getComponent(RichText).string = str
        }
    }

    static setSpriteFrame(routeOrSprite: string | Sprite, nodeOrPath: Node | string, sprOrName: string | SpriteFrame) {
        let sprite: Sprite | null = null;
        let texturePath = '';
        let frameName = '';
        let spriteFrame: SpriteFrame | null = null;

        // ✅ 兼容两种传参形式
        // 形式1: (route: string, node: Node, spr: SpriteFrame)
        if (typeof routeOrSprite === 'string' && nodeOrPath instanceof Node) {
            const spriteNode = find(routeOrSprite, nodeOrPath);
            if (!spriteNode) return;
            sprite = spriteNode.getComponent(Sprite);
            if (!sprite) return;
            if (sprOrName instanceof SpriteFrame) {
                sprite.spriteFrame = sprOrName;
                return;
            }
            // 不支持字符串时直接返回
            return;
        }

        // 形式2: (spriteCmp: Sprite, texture: string, frameName: string)
        if (routeOrSprite instanceof Sprite && typeof nodeOrPath === 'string' && typeof sprOrName === 'string') {
            sprite = routeOrSprite;
            texturePath = nodeOrPath;
            frameName = sprOrName;
        } else {
            console.error('❌ setSpriteFrame 参数不正确');
            return;
        }

        // ✅ 从 hall bundle 加载图集
        assetManager.loadBundle('hall', (err, bundle) => {
            if (err) {
                console.error('❌ 加载 hall bundle 失败:', err);
                return;
            }

            // 去掉 hall/ 前缀
            const assetPath = texturePath.replace(/^hall\//, '');

            bundle.load(assetPath, SpriteAtlas, (err, atlas) => {
                if (err) {
                    console.error('❌ 加载图集失败:', assetPath, err);
                    return;
                }

                const frame = atlas.getSpriteFrame(frameName);
                if (!frame) {
                    console.warn(`⚠️ 图集中未找到 ${frameName}`);
                    return;
                }

                sprite!.spriteFrame = frame;
            });
        });
    }

    static setProgress(route: string, node: Node, progress: number) {
        let progressBar = find(route, node)
        if (progressBar) {
            progressBar.getComponent(ProgressBar).progress = progress
        }
    }

    static onClick(node: Node | Button, callback: Function, target: unknown) {
        if (!node || !callback) return;

        let btn: Button | null = null;
        let n: Node | null = null;

        if (node instanceof Button) {
            btn = node;
            n = node.node;
        } else {
            n = node;
            btn = n.getComponent(Button);
        }

        if (!n) return;

        if (btn) {
            n.off(Button.EventType.CLICK, callback as any, target);
            n.on(Button.EventType.CLICK, callback as any, target);
        } else {
            n.off(Node.EventType.TOUCH_END, callback as any, target);
            n.on(Node.EventType.TOUCH_END, callback as any, target);
        }
    }

    static offClick(node: Node | Button, callback: Function, target?: unknown) {
        if (!node || !callback) return;
        const btn = node instanceof Button ? node : node.getComponent(Button);
        const n = node instanceof Button ? node.node : node;
        if (btn) n.off(Button.EventType.CLICK, callback as any, target);
        n.off(Node.EventType.TOUCH_END, callback as any, target);
    }

    static delayInteractable(node: Node, dt = 0.5) {
        let button = node.getComponent(Button)
        if (button) {
            button.interactable = false
            tween(node)
                .delay(dt)
                .call(() => {
                    button.interactable = true
                })
                .start()
        }
    }

    //设置常驻节点
    static addPersistNode(node: Node) {
        director.addPersistRootNode(node)
    }

    //移除常驻节点
    static removePersistNode(node: Node) {
        director.removePersistRootNode(node);
    }

    // 弹出动画显示
    static showAlertAction(
        node: Node,
        isShow: boolean,
        callback: () => void
    ) {

        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = node.addComponent(UIOpacity);
        }
        Tween.stopAllByTarget(node);
        Tween.stopAllByTarget(uiOpacity);
        if (isShow) {
            uiOpacity.opacity = 0.3 * 255;
            tween(node)
                .parallel(
                    tween(node).to(0.35, { scale: Vec3.ONE }, { easing: 'backOut' }),
                    tween(uiOpacity).to(0.35, { opacity: 255 })
                )
                .call(() => { if (callback) callback(); })
                .start();
        } else {
            tween(node)
                .parallel(
                    tween(node).to(0.3, { scale: Vec3.ZERO }, { easing: 'sineIn' }),
                    tween(uiOpacity).to(0.3, { opacity: 0.3 * 255 })
                )
                .call(() => { if (callback) callback(); })
                .start();
        }
    }

    static _grayMaterial: Material = null;
    static _grayLoading: boolean = false;
    static _grayWaitList: Array<{ spr: Sprite, bGray: boolean }> = [];

    static showSpriteGray(spr: Sprite, bGray = true) {
        if (!spr) return;
        if (!bGray) {
            spr.customMaterial = null;
            return;
        }
        if (this._grayMaterial) {
            spr.customMaterial = this._grayMaterial;
            return;
        }
        // 正在加载，加入等待队列
        if (this._grayLoading) {
            this._grayWaitList.push({ spr, bGray });
            return;
        }
        this._grayLoading = true;
        this._grayWaitList.push({ spr, bGray });
        resources.load('ui-sprite-gray-material', Material, (err, mat) => {
            this._grayLoading = false;
            if (!err && mat) {
                this._grayMaterial = mat;
                // 批量设置等待队列
                this._grayWaitList.forEach(item => {
                    if (item.bGray) item.spr.customMaterial = mat;
                    else item.spr.customMaterial = null;
                });
            } else {
                // 加载失败，全部恢复默认
                this._grayWaitList.forEach(item => item.spr.customMaterial = null);
            }
            this._grayWaitList.length = 0;
        });
    }


    static setVipFrame(sprite: Sprite, id: number, callback = null) {
        id = Math.min(20, id);
        App.GameManager.getHallBundle().load('plist/texture_usercommon', SpriteAtlas, (err, atlas) => {
            if (err) {
                console.warn('加载图集失败:', err);
                return;
            }
            const spriteFrame = atlas.getSpriteFrame(`vip_${id}`);
            sprite.spriteFrame = spriteFrame;
            if (callback) callback();
        });
    }

    static setRankFrame(sprite: Sprite, id: number, callback = null) {
        id = Math.min(20, id);
        App.GameManager.getHallBundle().load('plist/texture_usercommon', SpriteAtlas, (err, atlas) => {
            if (err) {
                console.warn('加载图集失败:', err);
                return;
            }
            const spriteFrame = atlas.getSpriteFrame(`rank_${id}`);
            sprite.spriteFrame = spriteFrame;
            if (callback) callback();
        });
    }

    static setHeadFrame(sprite: Sprite, id: number, callback = null) {
        App.GameManager.getHallBundle().load('plist/texture_usercommon', SpriteAtlas, (err, atlas) => {
            if (err) {
                console.warn('加载图集失败:', err);
                return;
            }
            const spriteFrame = atlas.getSpriteFrame(`head_${id}`);
            sprite.spriteFrame = spriteFrame;
            if (callback) callback();
        });
    }

    static setAvatarFrame(sprite: Sprite, id: string, callback = null) {
        App.GameManager.getHallBundle().load(`image/userInfoBar/headFrame/${id}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn('加载图片失败:', err);
                return;
            }
            sprite.spriteFrame = spriteFrame;
            if (callback) callback();
        });
    }

    static openCustomerService() {
        App.ComponentUtils.offClick
        let contactus = App.userData().contactus || "";

        if (contactus.length === 0) {
            contactus = App.StorageUtils.getLocal('contacturl', "");
        }

        if (contactus.length === 0) {
            if (Config.appId === Config.APPID.YonoGames) {
                contactus = App.StorageUtils.getLocal('contacturl', "");
            }
        }

        if (contactus.length > 0) {
            App.PlatformApiMgr.openURL(contactus);
        }
    }
}