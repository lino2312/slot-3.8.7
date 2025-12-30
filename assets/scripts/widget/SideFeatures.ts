import { _decorator, Component, instantiate, isValid, Node, Prefab, tween, UIOpacity, Vec2, Vec3 } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('SideFeatures')
export default class SideFeatures extends Component {
    @property(Vec2)
    public hidePos: Vec2 = new Vec2(-174, 0); // Default for clarity
    @property(Vec2)
    public showPos: Vec2 = new Vec2(172, 0);
    @property(Node)
    public floatNode: Node = null!;
    @property(Node)
    public maskNode: Node = null!;
    @property(Node)
    public openNode: Node = null!;
    @property(Node)
    public closeNode: Node = null!;
    @property(Prefab)
    public floatNodeChild: Prefab | null = null;

    @property(Node)
    public WelBonus: Node = null!;

    private isShow = false;
    private childInstance: Node | null = null;
    private initialized = false;

    onLoad() {
        if (!this.floatNode) {
            console.warn('[SideFeatures] floatNode not assigned.');
            return;
        }
        // 初始化位置与状态
        this.floatNode.setPosition(this.hidePos.x, this.hidePos.y, this.floatNode.position.z);
        this.isShow = false;
        this.updateButtons();
        this.applyImmediateState();
        this.initialized = true;
    }

    start() {
        // this.WelBonus.active = !App.userData().isGuest;
        if (!this.WelBonus) return;
        if (App.userData().isGuest == false) {
            this.WelBonus.active = false;
        } else {
            this.WelBonus.active = true;
        }
    }

    onEnable() {
        if (!this.initialized) return;
        this.maskNode?.on(Node.EventType.TOUCH_END, this.onClickMask, this);
        this.openNode?.on(Node.EventType.TOUCH_END, this.onClickMenu, this);
        this.closeNode?.on(Node.EventType.TOUCH_END, this.onClickMask, this);
    }

    onDisable() {
        if (isValid(this.maskNode, true)) this.maskNode.off(Node.EventType.TOUCH_END, this.onClickMask, this);
        if (isValid(this.openNode, true)) this.openNode.off(Node.EventType.TOUCH_END, this.onClickMenu, this);
        if (isValid(this.closeNode, true)) this.closeNode.off(Node.EventType.TOUCH_END, this.onClickMask, this);
    }

    onDestroy() {

    }

    private updateButtons() {
        if (this.openNode) this.openNode.active = !this.isShow;
        if (this.closeNode) this.closeNode.active = this.isShow;
    }

    public onClickMenu() {
        if (!this.initialized) return;
        this.isShow = true;
        this.updateButtons();
        this.runAnim();
    }

    public onClickMask() {
        if (!this.initialized) return;
        this.isShow = false;
        this.updateButtons();
        this.runAnim();
    }

    private applyImmediateState() {
        if (this.maskNode) {
            let maskOpacity = this.maskNode.getComponent(UIOpacity);
            if (!maskOpacity) maskOpacity = this.maskNode.addComponent(UIOpacity);
            maskOpacity.opacity = this.isShow ? 150 : 0;
            this.maskNode.active = this.isShow;
        }

        const pos = this.isShow ? this.showPos : this.hidePos;
        this.floatNode.setPosition(pos.x, pos.y, this.floatNode.position.z);
    }

    private runAnim() {
        const animTime = 0.3;
        if (!this.floatNode) return;

        const startPos = this.floatNode.position.clone();
        const targetVec2 = this.isShow ? this.showPos : this.hidePos;
        const targetPos = new Vec3(targetVec2.x, targetVec2.y, startPos.z);

        console.log(
            `[SideFeatures] runAnim from (${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)}) → (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)})`
        );

        // Mask animation
        let maskOpacity = this.maskNode?.getComponent(UIOpacity);
        if (this.maskNode && !maskOpacity) maskOpacity = this.maskNode.addComponent(UIOpacity);

        if (this.isShow) {
            this.maskNode.active = true;
            maskOpacity!.opacity = 0;
            tween(maskOpacity!).to(animTime, { opacity: 150 }).start();
            if (!this.childInstance && this.floatNodeChild) {
                this.childInstance = instantiate(this.floatNodeChild);
                this.floatNode.addChild(this.childInstance);
            }
        } else {
            tween(maskOpacity!)
                .to(animTime, { opacity: 0 })
                .call(() => (this.maskNode.active = false))
                .start();
        }

        // Position animation (safe tween)
        const posWrapper = { value: startPos.clone() };
        tween(posWrapper)
            .to(animTime, { value: targetPos.clone() }, {
                easing: this.isShow ? 'quadOut' : 'quadIn',
                onUpdate: () => {
                    this.floatNode.setPosition(posWrapper.value);
                },
            })
            .call(() => {
                if (!this.isShow && this.childInstance) {
                    this.childInstance.removeFromParent();
                    this.childInstance.destroy();
                    this.childInstance = null;
                }
            })
            .start();
    }

    onClickFeature(event: Event, prefabPath: string) {
        try {
            prefabPath = prefabPath.replace(/\\/g, '/');
            App.PopUpManager.addPopup(prefabPath, 'hall', null, true);
        } catch (err) {
            console.error(`❌ 弹窗调用出错 (${prefabPath}):`, err);
        }
    }
}
