import { _decorator, Component, Node, Prefab, instantiate, Label, Toggle, PageView, Sprite, SpriteFrame, resources, ScrollView, Layout, UITransform } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('bonusCashBack')
export class yd_bonus_cash_back extends Component {

    @property(PageView)
    pageList: PageView = null!;

    @property(Prefab)
    gameItem: Prefab = null!;

    @property(Prefab)
    CashBackItemPreb: Prefab = null!;

    @property(ScrollView)
    scrollView: ScrollView = null!;

    @property(Node)
    ContentNode: Node = null!;

    @property(Label)
    Receive: Label = null!;

    @property(Label)
    Unreceive: Label = null!;

    @property(Toggle)
    Toggle1: Toggle = null!;

    @property(Toggle)
    Toggle2: Toggle = null!;

    @property(Toggle)
    Toggle3: Toggle = null!;

    @property(Node)
    NoData: Node = null!;

    private currentFilter: string = 'recent';
    private itemsListCfg: any = (window as any).GameItemCfg || {};

    onLoad() {
        this.currentFilter = 'recent';
        
        // 确保 ScrollView 的 content 正确设置
        if (this.scrollView && this.ContentNode) {
            this.scrollView.content = this.ContentNode;
        }
        
        this.ReceiveAndUnclaimed();
        this.WalletRecords();
        this.ThirdGameList();

        this.Toggle1.node.on('toggle', () => {
            if (this.Toggle1.isChecked) {
                this.currentFilter = 'recent';
                console.log('Filter changed: recent');
                this.WalletRecords();
            }
        });

        this.Toggle2.node.on('toggle', () => {
            if (this.Toggle2.isChecked) {
                this.currentFilter = 'week';
                console.log('Filter changed: week');
                this.WalletRecords();
            }
        });

        this.Toggle3.node.on('toggle', () => {
            if (this.Toggle3.isChecked) {
                this.currentFilter = 'month';
                console.log('Filter changed: month');
                this.WalletRecords();
            }
        });

        // 监听事件
        // @ts-ignore
        App.EventUtils.on('UpdateReceived', () => {
            console.log('UPDATE: UpdateReceived');
            this.ReceiveAndUnclaimed();
        }, this);

        // @ts-ignore
        App.EventUtils.on('API', () => {
            console.log('UPDATE: API');
            this.ReceiveAndUnclaimed();
            this.WalletRecords();
            this.ThirdGameList();
        }, this);
    }

    onDestroy() {
        // @ts-ignore
        App.EventUtils.off('UpdateReceived', this.ReceiveAndUnclaimed, this);
        // @ts-ignore
        App.EventUtils.off('API', this.WalletRecords, this);
    }

    parseDate(str: string) {
        const [date, time] = str.split(' ');
        const [y, m, d] = date.split('-').map(Number);
        const [hh, mm, ss] = time.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm, ss);
    }

    filterRecords(records: any[]) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return records.filter(item => {
            const createDate = this.parseDate(item.createDateTime);
            if (isNaN(createDate.getTime())) {
                console.warn('Invalid date skipped:', item.createDateTime);
                return false;
            }
            const recordDate = new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate());
            const diffMs = todayStart.getTime() - recordDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            switch (this.currentFilter) {
                case 'recent':
                    return diffDays === 0;
                case 'week':
                    return diffDays >= 0 && diffDays <= 7;
                case 'month':
                    return diffDays >= 0 && diffDays <= 30;
                default:
                    return true;
            }
        });
    }

    ReceiveAndUnclaimed() {
        // @ts-ignore
        App.HttpUtils.sendPostRequest.getBonusWalletBalance((ret: any) => {
            console.log('getBonusWalletBalance:', ret);
            this.Receive.string = ret.totalClaimedRewards;
            this.Unreceive.string = ret.totalUnclaimRewards;
        });
    }

    WalletRecords() {
        // @ts-ignore
        App.HttpUtils.sendPostRequest.getBonusRecord((ret: any) => {
            this.ContentNode.removeAllChildren();
            console.log('GetBonusRecord:', ret);
            const filtered = this.filterRecords(ret.list || []);
            if (filtered.length === 0) {
                this.NoData.active = true;
            } else {
                this.NoData.active = false;
                for (let i = 0; i < filtered.length; i++) {
                    const element = filtered[i];
                    const item = instantiate(this.CashBackItemPreb);
                    const comp = item.getComponent('cashBackItem') as any;
                    if (comp) comp.init(element);
                    this.ContentNode.addChild(item);
                }
                // 更新 Layout 以重新计算 content 高度
                const layout = this.ContentNode.getComponent(Layout);
                if (layout) {
                    layout.updateLayout();
                }
                
                // 手动计算并设置 content 高度
                this.scheduleOnce(() => {
                    const contentTransform = this.ContentNode.getComponent(UITransform);
                    if (contentTransform && this.ContentNode.children.length > 0) {
                        let totalHeight = 0;
                        const spacing = layout?.spacingY || 0;
                        const paddingTop = layout?.paddingTop || 0;
                        const paddingBottom = layout?.paddingBottom || 0;
                        
                        for (const child of this.ContentNode.children) {
                            const childTransform = child.getComponent(UITransform);
                            if (childTransform) {
                                totalHeight += childTransform.height;
                            }
                        }
                        totalHeight += spacing * (this.ContentNode.children.length - 1);
                        totalHeight += paddingTop + paddingBottom;
                        
                        contentTransform.height = totalHeight;
                    }
                }, 0.1);
            }
        });
    }

    ThirdGameList() {
        // @ts-ignore
        App.HttpUtils.sendPostRequest.getThirdGameList(42, (data: any) => {
            console.log('getThirdGameList:', data);
            if (data && data.gameLists) {
                for (let i = 0; i < data.gameLists.length; i++) {
                    const element = data.gameLists[i];
                    const item = instantiate(this.gameItem);
                    const toggle = item.getComponent(Toggle)!;
                    toggle.isChecked = (i === 0);
                    toggle.node.on('toggle', () => {
                        this.pageList.getPages().forEach(page => {
                            const otherToggle = page.getComponent(Toggle);
                            if (otherToggle && otherToggle !== toggle) {
                                otherToggle.isChecked = false;
                            }
                        });
                        toggle.isChecked = true;
                    });

                    this.pageList.addPage(item);

                    const gameId = Number(element.gameID);
                    const cfg = this.itemsListCfg[gameId];
                    if (cfg && cfg.title) {
                        resources.load(`BalootClient/Slots/icon/${cfg.title}`, SpriteFrame, (err, data) => {
                            if (!err && data) {
                                item.children[0].children[0].getComponent(Sprite)!.spriteFrame = data;
                            } else {
                                console.warn('Failed to Load Icon:', err);
                            }
                        });
                    } else {
                        console.warn('%c %s %o', 'background: rgba(253,190,0,0.68);color:#fff;font-weight:bold;', 'No GameID Found:', gameId);
                    }
                }
            }
        });
    }

    onClickSelect(event: any, index: string) {
        if (event?.target) {
            const toggle = (event.target as Node).getComponent(Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        const total = this.pageList.content.children.length;
        let current = this.pageList.getCurrentPageIndex();
        let newIndex = current + Number(index);
        newIndex = Math.max(0, Math.min(newIndex, total - 1));
        console.log(`Moving from ${current} -> ${newIndex}, total: ${total}`);
        this.pageList.scrollToPage(newIndex, 0.3);
    }
}
