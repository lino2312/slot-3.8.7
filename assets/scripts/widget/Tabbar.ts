import { _decorator, Component, Node, Prefab, instantiate, Button, Enum, sys } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

declare const Global: any; // 若有全局 Global，声明以通过编译

export enum TabbarItemType {
    NODE = 1,
    PREFAB = 2,
}

@ccclass('TabbarItem')
export class TabbarItem {
    @property(Node)
    selectNode: Node | null = null;

    @property(Node)
    unSelectNode: Node | null = null;

    @property({ type: Enum(TabbarItemType) })
    pageType: TabbarItemType = TabbarItemType.NODE;

    @property({type:Node, visible() { return this.pageType === TabbarItemType.NODE }} )
    pageNode: Node | null = null;

    @property({type:Prefab, visible() { return this.pageType === TabbarItemType.PREFAB }} )
    pagePrefab: Prefab | null = null;

    @property({type:Node, visible() { return this.pageType === TabbarItemType.PREFAB }} )
    pageParent: Node | null = null;

    @property({visible() { return this.pageType === TabbarItemType.PREFAB }} )
    pageOnLoad: boolean = false;

    @property
    scale: number = 1;

    // 审核构建用的替换
    @property({type:Prefab, visible() { return this.pageType === TabbarItemType.PREFAB }} )
    pagePrefabReview: Prefab | null = null;

    @property({type:Node, visible() { return this.pageType === TabbarItemType.PREFAB }} )
    pageParentReview: Node | null = null;
}

@ccclass('Tabbar')
export class Tabbar extends Component {
    @property({ type: [TabbarItem] })
    tabs: TabbarItem[] = [];

    @property
    defaultIndex: number = -1;

    @property
    useSound: boolean = true;

    private selectedIndex: number = -1;
    private changeCallback?: (index: number, tab: TabbarItem, tabs: TabbarItem[]) => void;
    private preChangeCallback?: (index: number, tab: TabbarItem, tabs: TabbarItem[]) => boolean | void;

    get index() {
        return this.selectedIndex;
    }
    get indexItem(): TabbarItem | null {
        return this.tabs[this.selectedIndex] ?? null;
    }

    onLoad() {
        for (const tabItem of this.tabs) {
            // 选中/未选中初始态
            tabItem.selectNode && (tabItem.selectNode.active = false);
            tabItem.unSelectNode && (tabItem.unSelectNode.active = true);

            // 创建内容
            if (tabItem.pageType === TabbarItemType.PREFAB && tabItem.pagePrefab && tabItem.pageParent) {
                let prefab: Prefab | null = tabItem.pagePrefab;
                let parent: Node | null = tabItem.pageParent;

                const isReview = App.DeviceUtils.isIOSAndroidReview();
                if (isReview && tabItem.pagePrefabReview && tabItem.pageParentReview) {
                    prefab = tabItem.pagePrefabReview;
                    parent = tabItem.pageParentReview;
                }

                if (prefab && parent) {
                    tabItem.pageNode = instantiate(prefab);
                    tabItem.pageNode.active = !!tabItem.pageOnLoad;
                    parent.addChild(tabItem.pageNode);
                }
            }

            // 控制节点
            if (tabItem.pageNode) {
                tabItem.pageNode.active = false;
                tabItem.pageNode.setScale(tabItem.scale, tabItem.scale, tabItem.scale);
            }

            // 绑定未选中按钮点击
            if (tabItem.unSelectNode) {
                const btn = tabItem.unSelectNode.getComponent(Button) ?? tabItem.unSelectNode.addComponent(Button);
                // 去重绑定
                btn.node.off(Button.EventType.CLICK, this.onTabClick, this);
                btn.node.on(Button.EventType.CLICK, this.onTabClick, this);
            }
        }

        // 初始化默认页
        this.setPage(this.defaultIndex, true);
    }

    private onTabClick(event?: any) {
        const node = event?.target as Node;
        const tab = this.tabs.find(t => t.unSelectNode === node || t.selectNode === node);
        if (!tab) return;

        if (this.useSound) {
            App.AudioManager.playBtnClick();
        }
        this.onSelectPage(tab, false);
    }

    // 设置回调函数
    setChangeCallback(callback: (index: number, tab: TabbarItem, tabs: TabbarItem[]) => void) {
        this.changeCallback = callback;
    }

    // 设置Change前函数(在函数中return true 可以阻断切换tabbar)
    setPreChangeCallback(callback: (index: number, tab: TabbarItem, tabs: TabbarItem[]) => boolean | void) {
        this.preChangeCallback = callback;
    }

    // 页面选择
    onSelectPage(tabItem: TabbarItem, noPreCheck?: boolean) {
        const nextIndex = this.tabs.indexOf(tabItem);
        if (nextIndex < 0) return;

        if (!noPreCheck && this.preChangeCallback && this.preChangeCallback(nextIndex, tabItem, this.tabs)) {
            return;
        }

        this.selectedIndex = nextIndex;

        for (const item of this.tabs) {
            const isSel = (item === tabItem);
            item.selectNode && (item.selectNode.active = isSel);
            item.unSelectNode && (item.unSelectNode.active = !isSel);
            if (item.pageNode) item.pageNode.active = isSel;
        }

        // 回调
        this.changeCallback?.(this.selectedIndex, tabItem, this.tabs);
    }

    // 设置选择页面
    setPage(index: number, noPreCheck?: boolean) {
        if (index == null || index < 0 || index >= this.tabs.length) return;
        if (this.index === index) return;
        this.onSelectPage(this.tabs[index], noPreCheck);
    }
}