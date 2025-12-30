import {
    _decorator,
    Component,
    Button,
    Sprite,
    Label,
    builtinResMgr,
    Material,
} from 'cc';

const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

@ccclass('ButtonGrayCmp')
@menu('通用/ButtonGrayCmp')
@requireComponent(Button)
@executeInEditMode(true)
export class ButtonGrayCmp extends Component {

    @property
    private _interactable: boolean = true;

    @property({ tooltip: '是否可交互' })
    get interactable() {
        return this._interactable;
    }

    set interactable(value: boolean) {
        this._interactable = value;

        const btn = this.getComponent(Button)!;
        btn.interactable = value;
        btn.enableAutoGrayEffect = true;

        // 灰度材质
        const grayMat = builtinResMgr.get<Material>('ui-sprite-gray-material');

        // --- ① Button 的 transition 背景 ---
        // Button.target 是背景节点
        if (btn.target) {
            const bgSprite = btn.target.getComponent(Sprite);
            if (bgSprite) {
                bgSprite.customMaterial = value ? null : grayMat;
                bgSprite.grayscale = !value;  // 优先使用 grayscale
            }
        }

        // --- ② 子节点 Sprite ---
        const sprites = this.getComponentsInChildren(Sprite);
        sprites.forEach(sp => {
            sp.grayscale = !value;
            // sp.customMaterial = value ? null : grayMat; // 如需强制统一材质可打开
        });

        // --- ③ 子节点 Label ---
        const labels = this.getComponentsInChildren(Label);
        labels.forEach(lb => {
            lb.customMaterial = value ? null : grayMat;
        });
    }

    onLoad() {
        this.interactable = this._interactable;
    }
}
