import { _decorator, AssetManager, assetManager, BlockInputEvents, Color, Component, director, find, instantiate, Label, Node, Prefab, resources, Sprite, SpriteFrame, tween, Tween, UIOpacity, UITransform, Vec3, Widget } from 'cc';
import { App } from '../App';
import { PopUpAnimType } from '../component/PopupComponent';
const { ccclass, property } = _decorator;

type PopupQueueItem = {
    prefabPath?: string;
    prefab?: Prefab;
    params?: any;
    closeOnMask?: boolean;
    onClose?: () => void;
    showAnim?: PopUpAnimType;
    closeAnim?: PopUpAnimType;
    bundle?: string | AssetManager.Bundle | null;
};

@ccclass('PopUpManager')
export class PopUpManager extends Component {

    @property(SpriteFrame)
    maskSpriteFrame: SpriteFrame = null;

    @property({ tooltip: 'Allow multiple popups displayed at the same time' })
    public allowMultiple = true;

    private popupStack: Node[] = [];
    private pairMap: Map<Node, Node> = new Map();

    private queue: PopupQueueItem[] = [];

    private isLoading = false;

    protected onLoad(): void {
        App.PopUpManager = this;
    }

    public popView(
        prefabOrPath: string | Prefab,
        bundle: string | AssetManager.Bundle = null,
        params?: any,
        closeOnMask: boolean = false,
        onClose?: () => void,
        showAnim = PopUpAnimType.scale,
        closeAnim = PopUpAnimType.scale
    ) {
        const item: PopupQueueItem = typeof prefabOrPath === 'string'
            ? { prefabPath: prefabOrPath, bundle, params, closeOnMask, onClose, showAnim, closeAnim }
            : { prefab: prefabOrPath, bundle: null, params, closeOnMask, onClose, showAnim, closeAnim };
        const { prefabPath, prefab } = item;

        const onPrefabLoaded = (err: any, loadedPrefab: Prefab) => {
            if (err || !loadedPrefab) {
                console.warn('加载弹窗预制体失败:', err);
                if (!this.allowMultiple) this.isLoading = false;
                // 尝试继续显示下一个
                this.showNext();
                return;
            }

            const node = instantiate(loadedPrefab);
            // const canvas = director.getScene()?.getChildByName('Canvas');
            const canvas = find("Global")
            if (!canvas) {
                console.warn('未找到 Canvas 节点');
                if (!this.allowMultiple) this.isLoading = false;
                this.showNext();
                return;
            }

            // 创建遮罩
            const maskNode = new Node('PopupMask');
            maskNode.layer = node.layer;
            canvas.addChild(maskNode);
            maskNode.setSiblingIndex(canvas.children.length);

            const uiTransform = maskNode.getComponent(UITransform) ?? maskNode.addComponent(UITransform);
            const widget = maskNode.getComponent(Widget) ?? maskNode.addComponent(Widget);
            widget.target = canvas;
            widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
            widget.left = widget.right = widget.top = widget.bottom = 0;
            widget.updateAlignment();

            // 拦截穿透
            maskNode.getComponent(BlockInputEvents) ?? maskNode.addComponent(BlockInputEvents);

            const sprite = maskNode.getComponent(Sprite) ?? maskNode.addComponent(Sprite);
            if (this.maskSpriteFrame) sprite.spriteFrame = this.maskSpriteFrame;
            sprite.color = Color.fromHEX(new Color(), '#000000C9');

            if (closeOnMask) {
                // 多弹窗：关闭本实例；单弹窗也可安全关闭
                maskNode.on(Node.EventType.TOUCH_END, () => this.closePopup(node, closeAnim));

                // 底部 “TAP TO CLOSE” 提示（可选）
                let tip = maskNode.getChildByName('TapToCloseTip');
                if (!tip) {
                    const canvasUI = canvas.getComponent(UITransform);
                    const canvasH = canvasUI ? canvasUI.contentSize.height : 720;
                    const baseY = -canvasH * 0.5 + 80;

                    tip = new Node('TapToCloseTip');
                    maskNode.addChild(tip);
                    tip.setPosition(new Vec3(0, baseY, 0));

                    const makeWord = (text: string) => {
                        const n = new Node(text);
                        const lab = n.addComponent(Label);
                        lab.string = text;
                        lab.fontSize = 50;
                        lab.lineHeight = 54;
                        lab.color = new Color(255, 255, 255, 255);
                        tip.addChild(n);
                        return n;
                    };

                    const wTap = makeWord('TAP');
                    const wTo = makeWord('TO');
                    const wClose = makeWord('CLOSE');
                    const padding = 14;

                    const getW = (n: Node) => n.getComponent(UITransform)?.contentSize.width ?? 0;
                    const widths = [getW(wTap), getW(wTo), getW(wClose)];
                    const totalW = widths[0] + widths[1] + widths[2] + padding * 2;
                    let x = -totalW / 2;
                    wTap.setPosition(new Vec3(x + widths[0] / 2 - 20, 0, 0)); x += widths[0] + padding;
                    wTo.setPosition(new Vec3(x + widths[1] / 2 - 20, 0, 0)); x += widths[1] + padding;
                    wClose.setPosition(new Vec3(x + widths[2] - 30, 0, 0));

                    const words = [wTap, wTo, wClose];
                    const jumpUp = 14;
                    const dur = 0.22;

                    let idx = 0;
                    const loop = () => {
                        const target = words[idx];
                        if (!tip?.isValid || !target?.isValid) return;
                        const pos = target.position.clone();
                        Tween.stopAllByTarget(target);
                        tween(target)
                            .to(dur, { position: new Vec3(pos.x, pos.y + jumpUp, pos.z) }, { easing: 'sineOut' })
                            .to(dur, { position: new Vec3(pos.x, pos.y, pos.z) }, { easing: 'sineIn' })
                            .call(() => {
                                idx = (idx + 1) % words.length;
                                loop();
                            })
                            .start();
                    };
                    loop();
                } else {
                    tip.active = true;
                }
            }

            // 显示当前弹窗
            canvas.addChild(node);
            node.setSiblingIndex(canvas.children.length);

            // 记录关系
            this.popupStack.push(node);
            this.popupStack.push(maskNode);
            this.pairMap.set(node, maskNode);
            // 弹框后回调
            if (params && params.onShow) {
                params.onShow(node);
            }
            // 传参
            if (params && node.getComponents) {
                const comps = node.getComponents(Component);
                for (const comp of comps) {
                    const anyComp = comp as any;
                    if (typeof anyComp.setParams === 'function') {
                        anyComp.setParams(params);
                        break;
                    }
                }
            }

            (node as any)['__popupOnClose'] = onClose;
            (node as any)['__popupCloseAnim'] = closeAnim;
            (node as any)['__popupShowAnim'] = showAnim;

            if (!this.allowMultiple) this.isLoading = false;
            this.playShowAnim(node, showAnim);

            // 允许多弹窗：继续拉起下一个（并发显示）
            if (this.allowMultiple) this.showNext();
        };

        // 直接传了 Prefab
        if (prefab) {
            onPrefabLoaded(null, prefab);
            return;
        }

        // 按路径加载（支持 bundle）
        if (bundle) {
            let bundleIns: AssetManager.Bundle | null = null;
            if (typeof bundle === 'string') {
                bundleIns = assetManager.getBundle(bundle);
                if (!bundleIns) {
                    assetManager.loadBundle(bundle, (err, loadedBundle) => {
                        if (err || !loadedBundle) {
                            console.warn('加载 bundle 失败:', err);
                            if (!this.allowMultiple) this.isLoading = false;
                            this.showNext();
                            return;
                        }
                        loadedBundle.load(prefabPath!, Prefab, onPrefabLoaded);
                    });
                    return;
                }
            } else {
                bundleIns = bundle;
            }
            bundleIns.load(prefabPath!, Prefab, onPrefabLoaded);
        } else {
            resources.load(prefabPath!, Prefab, onPrefabLoaded);
        }
        App.AudioManager.playBtnClick2();
    }

    /**
     * 显示弹窗（队列 + bundle/Prefab 两种来源）
     */
    public addPopup(
        prefabOrPath: string | Prefab,
        bundle: string | AssetManager.Bundle = null,
        params?: any,
        closeOnMask: boolean = false,
        onClose?: () => void,
        showAnim = PopUpAnimType.scale,
        closeAnim = PopUpAnimType.scale
    ) {
        const item: PopupQueueItem = typeof prefabOrPath === 'string'
            ? { prefabPath: prefabOrPath, bundle, params, closeOnMask, onClose, showAnim, closeAnim }
            : { prefab: prefabOrPath, bundle: null, params, closeOnMask, onClose, showAnim, closeAnim };
        this.queue.push(item);
        this.showNext();
        App.AudioManager.playBtnClick2();
    }

    // 拉取队列显示。allowMultiple=false 时维持“队列单实例”；true 时并发显示。
    private showNext() {
        if (!this.allowMultiple) {
            if (this.isLoading) return;
            if (this.popupStack.length >= 2) return; // 正在显示中
        }
        if (this.queue.length === 0) return;

        if (!this.allowMultiple) this.isLoading = true;

        const item = this.queue.shift()!;
        const { prefabPath, prefab, bundle, params, closeOnMask, onClose, showAnim, closeAnim } = item;
        App.LoadMaskManager.waitOpen();
        const onPrefabLoaded = (err: any, loadedPrefab: Prefab) => {
            if (err || !loadedPrefab) {
                console.warn('加载弹窗预制体失败:', err);
                if (!this.allowMultiple) this.isLoading = false;
                // 尝试继续显示下一个
                this.showNext();
                return;
            }
            App.LoadMaskManager.waitClose();
            const node = instantiate(loadedPrefab);
            const canvas = director.getScene()?.getChildByName('Canvas');
            if (!canvas) {
                console.warn('未找到 Canvas 节点');
                if (!this.allowMultiple) this.isLoading = false;
                this.showNext();
                return;
            }

            // 创建遮罩
            const maskNode = new Node('PopupMask');
            maskNode.layer = node.layer;
            canvas.addChild(maskNode);
            maskNode.setSiblingIndex(canvas.children.length);

            const uiTransform = maskNode.getComponent(UITransform) ?? maskNode.addComponent(UITransform);
            const widget = maskNode.getComponent(Widget) ?? maskNode.addComponent(Widget);
            widget.target = canvas;
            widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
            widget.left = widget.right = widget.top = widget.bottom = 0;
            widget.updateAlignment();

            // 拦截穿透
            maskNode.getComponent(BlockInputEvents) ?? maskNode.addComponent(BlockInputEvents);

            const sprite = maskNode.getComponent(Sprite) ?? maskNode.addComponent(Sprite);
            if (this.maskSpriteFrame) sprite.spriteFrame = this.maskSpriteFrame;
            sprite.color = Color.fromHEX(new Color(), '#000000C9');

            if (closeOnMask) {
                // 多弹窗：关闭本实例；单弹窗也可安全关闭
                maskNode.on(Node.EventType.TOUCH_END, () => this.closePopup(node, closeAnim));

                // 底部 “TAP TO CLOSE” 提示（可选）
                let tip = maskNode.getChildByName('TapToCloseTip');
                if (!tip) {
                    const canvasUI = canvas.getComponent(UITransform);
                    const canvasH = canvasUI ? canvasUI.contentSize.height : 720;
                    const baseY = -canvasH * 0.5 + 80;

                    tip = new Node('TapToCloseTip');
                    maskNode.addChild(tip);
                    tip.setPosition(new Vec3(0, baseY, 0));

                    const makeWord = (text: string) => {
                        const n = new Node(text);
                        const lab = n.addComponent(Label);
                        lab.string = text;
                        lab.fontSize = 50;
                        lab.lineHeight = 54;
                        lab.color = new Color(255, 255, 255, 255);
                        tip.addChild(n);
                        return n;
                    };

                    const wTap = makeWord('TAP');
                    const wTo = makeWord('TO');
                    const wClose = makeWord('CLOSE');
                    const padding = 14;

                    const getW = (n: Node) => n.getComponent(UITransform)?.contentSize.width ?? 0;
                    const widths = [getW(wTap), getW(wTo), getW(wClose)];
                    const totalW = widths[0] + widths[1] + widths[2] + padding * 2;
                    let x = -totalW / 2;
                    wTap.setPosition(new Vec3(x + widths[0] / 2 - 20, 0, 0)); x += widths[0] + padding;
                    wTo.setPosition(new Vec3(x + widths[1] / 2 - 20, 0, 0)); x += widths[1] + padding;
                    wClose.setPosition(new Vec3(x + widths[2] - 30, 0, 0));

                    const words = [wTap, wTo, wClose];
                    const jumpUp = 14;
                    const dur = 0.22;

                    let idx = 0;
                    const loop = () => {
                        const target = words[idx];
                        if (!tip?.isValid || !target?.isValid) return;
                        const pos = target.position.clone();
                        Tween.stopAllByTarget(target);
                        tween(target)
                            .to(dur, { position: new Vec3(pos.x, pos.y + jumpUp, pos.z) }, { easing: 'sineOut' })
                            .to(dur, { position: new Vec3(pos.x, pos.y, pos.z) }, { easing: 'sineIn' })
                            .call(() => {
                                idx = (idx + 1) % words.length;
                                loop();
                            })
                            .start();
                    };
                    loop();
                } else {
                    tip.active = true;
                }
            }

            // 传参
            if (params && node.getComponents) {
                const comps = node.getComponents(Component);
                for (const comp of comps) {
                    const anyComp = comp as any;
                    if (typeof anyComp.setParams === 'function') {
                        anyComp.setParams(params);
                        break;
                    }
                }
            }
            // 显示当前弹窗
            canvas.addChild(node);
            node.setSiblingIndex(canvas.children.length);

            // 记录关系
            this.popupStack.push(node);
            this.popupStack.push(maskNode);
            this.pairMap.set(node, maskNode);
            // 弹框后回调
            if (params && params.onShow) {
                params.onShow(node);
            }


            (node as any)['__popupOnClose'] = onClose;
            (node as any)['__popupCloseAnim'] = closeAnim;
            (node as any)['__popupShowAnim'] = showAnim;

            if (!this.allowMultiple) this.isLoading = false;
            this.playShowAnim(node, showAnim);

            // 允许多弹窗：继续拉起下一个（并发显示）
            if (this.allowMultiple) this.showNext();
        };

        // 直接传了 Prefab
        if (prefab) {
            onPrefabLoaded(null, prefab);
            return;
        }

        // 按路径加载（支持 bundle）
        if (bundle) {
            let bundleIns: AssetManager.Bundle | null = null;
            if (typeof bundle === 'string') {
                bundleIns = assetManager.getBundle(bundle);
                if (!bundleIns) {
                    assetManager.loadBundle(bundle, (err, loadedBundle) => {
                        if (err || !loadedBundle) {
                            console.warn('加载 bundle 失败:', err);
                            if (!this.allowMultiple) this.isLoading = false;
                            this.showNext();
                            return;
                        }
                        loadedBundle.load(prefabPath!, Prefab, onPrefabLoaded);
                    });
                    return;
                }
            } else {
                bundleIns = bundle;
            }
            bundleIns.load(prefabPath!, Prefab, onPrefabLoaded);
        } else {
            resources.load(prefabPath!, Prefab, onPrefabLoaded);
        }
    }

    /**
     * 播放弹出动画
     */
    private playShowAnim(node: Node, anim: PopUpAnimType) {
        const uiOpacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        const duration = 0.25;
        switch (anim) {
            case PopUpAnimType.normal:
                break;
            case PopUpAnimType.scale:
                node.setScale(0.4, 0.4, 0.4);
                uiOpacity.opacity = 0;
                tween(node).to(duration, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
                tween(uiOpacity).to(duration, { opacity: 255 }).start();
                break;
            case PopUpAnimType.fadeIn:
                uiOpacity.opacity = 0;
                tween(uiOpacity).to(duration, { opacity: 255 }).start();
                break;
            case PopUpAnimType.fromTop: {
                const startPos = node.position.clone();
                node.setPosition(startPos.x, startPos.y + 600, startPos.z);
                tween(node).to(duration, { position: startPos }, { easing: 'quadOut' }).start();
                break;
            }
            case PopUpAnimType.fromBottom: {
                const startPos = node.position.clone();
                node.setPosition(startPos.x, startPos.y - 600, startPos.z);
                tween(node).to(duration, { position: startPos }, { easing: 'quadOut' }).start();
                break;
            }
            case PopUpAnimType.fromRight: {
                const startPos = node.position.clone();
                node.setPosition(startPos.x + 600, startPos.y, startPos.z);
                tween(node).to(duration, { position: startPos }, { easing: 'quadOut' }).start();
                break;
            }
            case PopUpAnimType.fromLeft: {
                const startPos = node.position.clone();
                node.setPosition(startPos.x - 600, startPos.y, startPos.z);
                tween(node).to(duration, { position: startPos }, { easing: 'quadOut' }).start();
                break;
            }
            default:
                break;
        }
    }

    /**
     * 播放关闭动画
     */
    private playCloseAnim(node: Node, anim: PopUpAnimType, onFinish: () => void) {
        if (!node || !node.isValid) {
            onFinish();
            return;
        }
        const uiOpacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        const duration = 0.2;
        switch (anim) {
            case PopUpAnimType.normal:
                onFinish();
                break;
            case PopUpAnimType.scale:
                tween(node).to(duration, { scale: new Vec3(0.4, 0.4, 0.4) }, { easing: 'backIn' }).call(onFinish).start();
                tween(uiOpacity).to(duration, { opacity: 0 }).start();
                break;
            case PopUpAnimType.fadeIn:
                tween(uiOpacity).to(duration, { opacity: 0 }).call(onFinish).start();
                break;
            case PopUpAnimType.fromTop: {
                const endPos = node.position.clone();
                const target = endPos.clone(); target.y += 600;
                tween(node).to(duration, { position: target }, { easing: 'quadIn' }).call(onFinish).start();
                break;
            }
            case PopUpAnimType.fromBottom: {
                const endPos = node.position.clone();
                const target = endPos.clone(); target.y -= 600;
                tween(node).to(duration, { position: target }, { easing: 'quadIn' }).call(onFinish).start();
                break;
            }
            case PopUpAnimType.fromRight: {
                const endPos = node.position.clone();
                const target = endPos.clone(); target.x += 600;
                tween(node).to(duration, { position: target }, { easing: 'quadIn' }).call(onFinish).start();
                break;
            }
            case PopUpAnimType.fromLeft: {
                const endPos = node.position.clone();
                const target = endPos.clone(); target.x -= 600;
                tween(node).to(duration, { position: target }, { easing: 'quadIn' }).call(onFinish).start();
                break;
            }
            default:
                onFinish();
                break;
        }
    }

    /** 按节点关闭指定弹窗（多弹窗友好） */
    public closePopup(popupNode: Node, closeAnim = PopUpAnimType.scale) {
        App.AudioManager.playBtnClick();
        if (!popupNode?.isValid) return;
        const maskNode = this.pairMap.get(popupNode);

        // 从栈中移除该对
        if (maskNode) {
            const mi = this.popupStack.indexOf(maskNode);
            if (mi >= 0) this.popupStack.splice(mi, 1);
        }
        const pi = this.popupStack.indexOf(popupNode);
        if (pi >= 0) this.popupStack.splice(pi, 1);
        this.pairMap.delete(popupNode);

        const onFinish = () => {
            popupNode.destroy();
            maskNode?.destroy();
            if ((popupNode as any)['__popupOnClose']) {
                (popupNode as any)['__popupOnClose']();
            }
            // 关闭后尝试继续处理队列
            this.showNext();
        };

        this.playCloseAnim(popupNode, closeAnim, onFinish);
    }

    /**
     * 关闭顶部弹窗（关闭后展示队列下一个）
     */
    public closeTopPopup(closeAnim = PopUpAnimType.scale) {
        App.AudioManager.playBtnClick();
        if (this.popupStack.length >= 2) {
            const maskNode = this.popupStack.pop();
            const popupNode = this.popupStack.pop();
            const anim = closeAnim;
            if (popupNode) {
                this.pairMap.delete(popupNode);
                this.playCloseAnim(popupNode, anim, () => {
                    popupNode.destroy();
                    maskNode?.destroy();
                    if ((popupNode as any)['__popupOnClose']) {
                        (popupNode as any)['__popupOnClose']();
                    }
                    this.showNext();
                });
            } else {
                maskNode?.destroy();
                this.showNext();
            }
        } else {
            this.showNext();
        }
    }

    /**
     * 关闭所有弹窗并清空队列
     */
    public closeAllPopups() {
        App.AudioManager.playBtnClick();
        while (this.popupStack.length >= 2) {
            const maskNode = this.popupStack.pop();
            const popupNode = this.popupStack.pop();
            const anim = (popupNode && (popupNode as any)['__popupCloseAnim']) || PopUpAnimType.scale;
            if (popupNode) {
                this.pairMap.delete(popupNode);
                this.playCloseAnim(popupNode, anim, () => {
                    popupNode.destroy();
                    maskNode?.destroy();
                    if ((popupNode as any)['__popupOnClose']) {
                        (popupNode as any)['__popupOnClose']();
                    }
                });
            } else {
                maskNode?.destroy();
            }
        }
        this.pairMap.clear();
        this.queue = [];
        this.isLoading = false;
    }
}