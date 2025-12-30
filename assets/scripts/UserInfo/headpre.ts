import { _decorator, Component, Node, Sprite,assetManager, SpriteFrame } from 'cc';
import { App } from '../App';   // 你的项目结构，改成实际路径

const { ccclass, property } = _decorator;

@ccclass('headpre')
export class HeadPre extends Component {


    @property(Node)
    lock: Node = null!;

    @property(Node)
    select: Node = null!;

    @property(Sprite)
    background: Sprite = null!;

    /** 当前头像框 key */
    private element: string = "";
    /** 排序 index */
    private index: number = 0;

    /** 初始化（外部调用） */
    public init(index: number, element: string) {
        this.index = index;
        this.element = element;
    }

    onLoad() {
        this.setBackground();
        // VIP 判断
        const level = App.userData().svip;
        this.lock.active = level < this.index;
    
        // 当前选中头像
        const current = App.userData().avatarFrame;
        this.select.active = (current === this.element);
    
        if (!this.lock.active) {
            this.node.on(Node.EventType.TOUCH_END, () => {
                this.onSelect();
            });
        }
    }
    

    /** 设置背景 */
    private setBackground() {
        const bundleName = "hall";
        const path = `image/personal/pics/head/${this.element}/spriteFrame`;  
    
        assetManager.loadBundle(bundleName, (err, bundle) => {
            if (err) {
                console.error("[头像框] 加载 bundle 失败:", err);
                return;
            }
    
            bundle.load(path, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error("[头像框] 加载 SpriteFrame 失败:", path, err);
                    return;
                }
    
                this.background.spriteFrame = spriteFrame;
            });
        });
    }
    

    /** 点击选择头像框 */
    private onSelect() {
        // 构造请求参数
        const reqData = {
            c: App.MessageID.UPDATE_USER_INFO,
            avatarframe: this.element,
        };

        // 发请求
        App.NetManager.send(reqData);

        // 清除所有头像框选中特效
        const parent = this.node.parent;
        if (parent) {
            for (const child of parent.children) {
                const useNode = child.getChildByName("use");
                if (useNode) {
                    useNode.active = false;
                }
            }
        }

        // 自己选中
        this.select.active = true;
        App.userData().avatarFrame = this.element;
    }
}
