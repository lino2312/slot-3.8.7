import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween, find, BlockInputEvents, UITransform, assetManager, UIOpacity, view } from 'cc';
import { App } from '../../App';
import { PopUpAnimType } from '../../component/PopupComponent';
const { ccclass, property } = _decorator;

@ccclass('SlotGameHelpBase')
export class SlotGameHelpBase extends Component {

    private _items_r: Node[] = [];
    private _items_l: Node[] = [];
    private _loadPrefabs: Prefab[] = [];
    private _laycontent: Node = null!;
    private _itemWidth: number = 0;

    private addIdx: number = 0;       //加载完成计数
    private _bMoveing: boolean = false;

    onLoad() {
        this._laycontent = find("mask_content/lay_content", this.node)!;

        const uiTrans = this._laycontent.getComponent(UITransform)!;
        this._itemWidth = uiTrans.width;

        this.InitItems();

        let btn_back = find("btn_backgame", this.node)!;
        App.ComponentUtils.onClick(btn_back, this.OnClickBackGame, this);
        btn_back.active = false;

        let btn_left = find("btn_backgame/btn_left", this.node)!;
        App.ComponentUtils.onClick(btn_left, this.OnClickLeft, this);

        let btn_right = find("btn_backgame/btn_right", this.node)!;
        App.ComponentUtils.onClick(btn_right, this.OnClickRight, this);

        let lay_bg = find("lay_bg", this.node)!;
        lay_bg.addComponent(BlockInputEvents);
        this.ensureUIOpacity(lay_bg).opacity = 0;

        const winSize = view.getVisibleSize();
        this.node.setPosition(0, -winSize.height, 0);
    }

    onEnable() {
        const slotGameDataScript = App.SubGameManager?.getSlotGameDataScript();
        // slotGameDataScript?.pauseSlot();
        this.ShowUIAction();
    }

    // 确保节点有 UIOpacity 组件
    private ensureUIOpacity(node: Node): UIOpacity {
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = node.addComponent(UIOpacity);
        }
        return uiOpacity;
    }


    // 初始化所有 helpItem 预制体
    InitItems() {
        const slotGameDataScript = App.SubGameManager?.getSlotGameDataScript();
        const cfg = slotGameDataScript?.getGameCfg?.();
        if (!cfg || !cfg.helpItems) return;

        this.addIdx = 0;

        for (let i = 0; i < cfg.helpItems.length; i++) {
            const url = cfg.helpItems[i];   // 如：subgameA/bundle/prefabs/help1

            // 解析 bundle 名称
            let parts = url.split("/");
            let bundleName = `${parts[0]}/${parts[1]}`;   // 子游戏的 bundle
            let resourcePath = url.substring(bundleName.length + 1); // 资源路径

            const index = i; // 闭包保存索引
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.error("加载 bundle 失败:", err);
                    return;
                }

                bundle.load(resourcePath, Prefab, (err2, prefab) => {
                    if (err2) {
                        console.error("加载预制体失败:", err2);
                        return;
                    }

                    this._loadPrefabs.push(prefab);

                    let node = instantiate(prefab);
                    node.name = "item" + index;

                    node.setParent(this._laycontent);
                    node.setPosition(this._itemWidth * index, 0, 0);

                    this._items_r[index] = node;

                    this.addIdx++;
                });
            });
        }
    }

    // UI 进入动画
    ShowUIAction() {
        const layBg = find("lay_bg", this.node)!;
        const layBgOpacity = this.ensureUIOpacity(layBg);

        App.AudioManager?.playSfx("audio/info_page_open");

        const winSize = view.getVisibleSize();
        this.node.setPosition(0, -winSize.height, 0);
        layBgOpacity.opacity = 0;

        tween(this.node)
            .to(0.5, { position: new Vec3(0, 0, 0) })
            .call(() => {
                let btn = find("btn_backgame", this.node)!;
                btn.active = true;
            })
            .call(() => {
                tween(layBgOpacity)
                    .to(0.3, { opacity: 150 })
                    .start();
            })
            .start();
    }

    // 关闭界面
    OnClickBackGame() {
        const layBg = find("lay_bg", this.node)!;
        const layBgOpacity = this.ensureUIOpacity(layBg);

        const slotGameDataScript = App.SubGameManager?.getSlotGameDataScript();
        // slotGameDataScript?.resumeSlot?.();
        App.AudioManager?.playSfx("audio/info_page_close");

        tween(layBgOpacity)
            .to(0.1, { opacity: 0 })
            .start();

        const winSize = view.getVisibleSize();
        tween(this.node)
            .to(0.5, { position: new Vec3(0, -winSize.height, 0) })
            .call(() => {
                // this.node.active = false;
                App.PopUpManager.closePopup(this.node, PopUpAnimType.normal);
            })
            .start();
    }


    // 下一页（右按钮）
    OnClickRight() {
        if (!this._isLoadFinish()) return;
        if (this._bMoveing) return;
        this._bMoveing = true;

        App.AudioManager?.playSfx("audio/info_page_scroll");

        if (this._items_r.length == 1) {
            let lNode = this._items_l.shift()!;
            lNode.setPosition(this._itemWidth * 1, 0, 0);
            this._items_r.push(lNode);
        }

        let item = this._items_r.shift()!;
        this._items_l.push(item);

        this._updateMove(true);
    }

    // 上一页（左按钮）
    OnClickLeft() {
        if (!this._isLoadFinish()) return;
        if (this._bMoveing) return;
        this._bMoveing = true;

        App.AudioManager?.playSfx("audio/info_page_scroll");

        if (this._items_l.length == 0) {
            let rNode = this._items_r.pop()!;
            rNode.setPosition(this._itemWidth * -1, 0, 0);
            this._items_l.push(rNode);
        }

        let item = this._items_l.pop()!;
        this._items_r.unshift(item);

        this._updateMove(false);
    }

    private _updateMove(bLeft: boolean) {
        for (let node of this._items_l) {
            this._moveNode(node, bLeft);
        }
        for (let node of this._items_r) {
            this._moveNode(node, bLeft);
        }
    }

    // 是否全部加载完
    private _isLoadFinish() {
        const slotGameDataScript = App.SubGameManager?.getSlotGameDataScript();
        const cfg = slotGameDataScript?.getGameCfg?.();
        if (!cfg?.helpItems) return false;
        return cfg.helpItems.length === this.addIdx;
    }

    // 移动动画
    private _moveNode(node: Node, bLeft: boolean) {
        let dir = bLeft ? -1 : 1;

        tween(node)
            .by(0.2, { position: new Vec3(this._itemWidth * dir, 0, 0) })
            .call(() => {
                this._bMoveing = false;
            })
            .start();
    }
}
