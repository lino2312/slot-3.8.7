import { _decorator, Component, PageView, Sprite, Label, 
        Node, Toggle, instantiate, sys, SpriteFrame,
        EventHandler, Layout, ToggleContainer, ScrollView, Vec2, UITransform } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('Notice')
export class Notice extends Component {
    @property(PageView) pageList: PageView = null!;
    @property(Node) classList: Node = null!;      // Top list container
    @property(Node) classItem: Node = null!;      // Page item
    @property(Node) topList: Node = null!;
    @property(Toggle) tabItem: Toggle = null!;     // Top toggle
    @property(Toggle) dotItem: Toggle = null!;     // Dot toggle
    @property(Node) dotContainer: Node = null!;   // Dot container for page index

    private datasArray: any[] = [];
    private topItems: Node[] = [];
    private unReadCount: number = 0;
    private toggleComp: Toggle | null = null;

    onLoad() {
        this.getNoticeList();
    }

    async getNoticeList() {
        try {
            if (!App.userData().isLogin) return;
            const ret = await App.ApiManager.getCloudDataHandler('GetNoticeList', {});
            console.log("NoticeList:", ret);
            this.datasArray = ret?.filter((item: any) => item.status === true) || [];
            this.updateUI();
        } catch (err) {
            console.error("Failed to get NoticeList:", err);
        }
    }

    updateUI() {
        const list = this.datasArray || [];
        console.log("Updating Notice UI with list:", list);
        if (list.length === 0) return;
        
        // Get the content node where the toggle items should be added
        const contentNode = this.topList.getChildByName("view").getChildByName("content"); // The "content" node
        if (!contentNode) {
            console.error("Content node not found under topList!");
            return;
        }
        
        // Clear existing items from the correct nodes
        contentNode.removeAllChildren();
        this.pageList.removeAllPages();
        this.dotContainer.removeAllChildren();
        this.topItems = [];
        
        for (let i = 0; i < list.length; i++) {
            const btnTxt = list[i].btntxt;

            // top toggle instance
            const topItem = instantiate(this.tabItem.node);
            topItem.active = true;

            // set labels (adjust indices to match your prefab)
            topItem.children[1].children[0].getComponent(Label)!.string = btnTxt;
            topItem.children[0].children[1].getComponent(Label)!.string = btnTxt;

            // red dot
            const redNoticeKey = "notice" + btnTxt + "Clicked";
            const clicked = sys.localStorage.getItem(redNoticeKey) === 'true';
            topItem.children[0].children[2].active = !clicked;

            // add to content node (not topList directly)
            contentNode.addChild(topItem);
            this.topItems.push(topItem);
            if (!clicked) this.unReadCount++;

            // Use button click instead of toggle check event
            topItem.on(Node.EventType.TOUCH_END, () => {
                this.clickTopList(i);
            });

            // Remove toggle functionality from tab items
            const toggleComp = topItem.getComponent(Toggle);
            if (toggleComp) {
                toggleComp.enabled = false;
            }

            // page item
            const pageItem = instantiate(this.classItem);
            pageItem.name = i.toString();
            pageItem.children[0].name = i.toString();
            App.ResUtils.getRemoteSpriteFrame(list[i].img).then((sf: SpriteFrame) => {
                const n = pageItem.children[0];
                if (n) {
                    const sp = n.getComponent(Sprite);
                    if (sp) {
                        sp.spriteFrame = sf;
                        const ui = n.getComponent(UITransform);
                        if (ui) {
                            ui.setContentSize(782, 1104);
                        }
                    }
                }
            }).catch((err) => {
                console.warn('Failed to load sprite frame', err);
            });
            this.pageList.addPage(pageItem);
            pageItem.active = true;

            // dot - use button click for dots too
            const dot = instantiate(this.dotItem.node);
            dot.active = true;
            
            dot.on(Node.EventType.TOUCH_END, () => {
                this.clickDotItem(i);
            });

            // Remove toggle functionality from dot items
            const dotToggleComp = dot.getComponent(Toggle);
            if (dotToggleComp) {
                dotToggleComp.enabled = false;
            }
            
            this.dotContainer.addChild(dot);
        }
        
        // Update layout on the content node
        contentNode.getComponent(Layout)?.updateLayout();
        
        // Remove ToggleContainer completely
        const toggleContainer = contentNode.getComponent(ToggleContainer);
        if (toggleContainer) {
            contentNode.removeComponent(ToggleContainer);
        }
        
        // Set up page view events
        this.pageList.node.off('page-turning', this.onMovePageView, this);
        this.pageList.node.off('scroll-ended', this.onMovePageView, this);
        this.pageList.node.on('page-turning', this.onMovePageView, this);
        this.pageList.node.on('scroll-ended', this.onMovePageView, this);

        // Set initial state
        this.setInitialState();
        
        console.log("Total top items created:", this.topItems.length);
    }

    private setInitialState() {
        // Set first tab and dot as active using visual states
        this.updateVisualStates(0);
        
        // Scroll to first page with a small delay to ensure everything is ready
        this.scheduleOnce(() => {
            this.pageList.scrollToPage(0, 0.1);
        }, 0.1);
    }

    private updateVisualStates(activeIndex: number) {
        // Update tab visual states
        for (let i = 0; i < this.topItems.length; i++) {
            const isActive = (i === activeIndex);
            this.updateTabVisualState(this.topItems[i], isActive);
        }
        
        // Update dot visual states
        for (let i = 0; i < this.dotContainer.children.length; i++) {
            const isActive = (i === activeIndex);
            this.updateDotVisualState(this.dotContainer.children[i], isActive);
        }
    }

    private updateTabVisualState(tabNode: Node, isActive: boolean) {
        // Show/hide active/inactive states based on your prefab structure
        // Usually: children[0] is inactive state, children[1] is active state
        if (tabNode.children[0]) tabNode.children[0].active = !isActive; // Inactive background
        if (tabNode.children[1]) tabNode.children[1].active = isActive;  // Active background
    }

    private updateDotVisualState(dotNode: Node, isActive: boolean) {
        // Update dot visual state - adjust indices based on your dot prefab
        // Usually: children[0] is inactive dot, children[1] is active dot
        if (dotNode.children[0]) dotNode.children[0].active = !isActive; // Inactive dot
        if (dotNode.children[1]) dotNode.children[1].active = isActive;  // Active dot
    }

    clickTopList(index: number) {
        console.log("Tab clicked:", index);
        if (index < 0 || index >= this.topItems.length) return;
        this.clearRedDot(index);
        // Update visual states
        this.updateVisualStates(index);
        // Scroll to page
        this.pageList.scrollToPage(index, 0.3);
    }

    private clearRedDot(index: number) {
        const item = this.datasArray[index];
        if (!item) return;

        const btnTxt = item.btntxt;
        const key = "notice" + btnTxt + "Clicked";

        // Save "read" state
        sys.localStorage.setItem(key, "true");

        // Hide red dot visually
        const tab = this.topItems[index];
        if (tab && tab.children[0] && tab.children[0].children[2]) {
            tab.children[0].children[2].active = false;
        }
    }

    clickDotItem(index: number) {
        console.log("Dot clicked:", index);
        if (index < 0 || index >= this.dotContainer.children.length) return;
        this.clearRedDot(index);
        // Update visual states
        this.updateVisualStates(index);
        // Scroll to page
        this.pageList.scrollToPage(index, 0.3);
    }

    onMovePageView() {
        const index = this.pageList.getCurrentPageIndex();
        console.log("Page moved to:", index, "Total pages:", this.pageList.getPages().length);

        if (index < 0 || index >= this.topItems.length) {
            console.warn("Invalid page index:", index);
            return;
        }
        this.clearRedDot(index);
        // Update visual states when page changes
        this.updateVisualStates(index);
        console.log("Visual states updated for index:", index);

        // Scroll topList ScrollView
        const topScroll = this.topList.getComponent(ScrollView);
        if (topScroll && this.topItems.length > 0) {
            const a = 1 / this.topItems.length;
            const b = a * (index === 0 ? -1 : index === (this.topItems.length - 1) ? this.topItems.length : index);
            topScroll.scrollTo(new Vec2(b, 0), 0.2);
            console.log("Top scroll position updated");
        }

        // Scroll bottom toggle ScrollView
        const bottomScroll = this.dotContainer.parent?.parent?.getComponent(ScrollView);
        if (bottomScroll && this.dotContainer.children.length > 0) {
            const c = 1 / this.dotContainer.children.length;
            const d = c * (index === 0 ? -1 : index === (this.dotContainer.children.length - 1) ? this.dotContainer.children.length : index);
            bottomScroll.scrollTo(new Vec2(d, 0), 0.2);
            console.log("Bottom scroll position updated");
        }
    }

    clickContent(event: Event) {
        const node = event.currentTarget as unknown as Node;
        const index = parseInt(node.name);
        const data = this.datasArray[index];
        if (!data) return;

        let path = '';

        const jumpto = data.jumpto.toLowerCase();
        if (jumpto.includes('bank')) {
            // path = 'YD_Pro/withdraw/ui_withdraw';
        } else if (jumpto.includes('referearn')) {
            path = 'BalootClient/Invitation/InvitationView';
        } else if (jumpto.includes('firstdeposit')) {
            path = 'YD_Pro/prefab/yd_fist_recharge';
        } else if (jumpto.includes('freecash')) {
            path = 'BalootClient/Invitation/InvitationView';
        } else if (jumpto.includes('cards')) {
            path = 'BalootClient/ShopV2/prefabs/card/cardWeek';
        } else if (jumpto.includes('deposit')) {
            path = 'YD_Pro/recharge/ui_recharge';
        } else if (jumpto.includes('service')) {
            path = 'YD_Pro/prefab/yd_service';
        } else if (jumpto.includes('leaderboard')) {
            path = 'YD_Pro/rank/yd_rank';
        } else if (jumpto.includes('vip')) {
            path = 'YD_Pro/prefab/yd_vip';
        } else if (jumpto.includes('gift')) {
            path = 'BalootClient/GiftExchange/GiftExchangeView';
        } else if (jumpto.includes('www') || jumpto.includes('http')) {
            // Open external URL
            App.PlatformApiMgr.openURL(data.jumpto);
        }

        if (path) {
            App.PopUpManager.addPopup(path);
        }
        App.PopUpManager.closePopup(this.node);
    }

    onCloseNotice() {
        App.PopUpManager.closePopup(this.node);
    }
}