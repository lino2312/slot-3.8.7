import { _decorator, Component, instantiate, isValid, Label, Layout, Node, NodePool, Prefab, ScrollView } from 'cc';
import { App } from '../scripts/App';
import { GameItemComponent } from './component/GameItemComponent';
import { SlotGameItemComponent } from './component/SlotGameItemComponent';
import { ThirdGameItemComponent } from './component/ThirdGameItemComponent';
import { Config } from './config/Config';
import { GameTypeButton } from './widget/GameTypeButton';
import { Tabbar } from './widget/Tabbar';
import { GameItemData } from './data/GameItemData';
const { ccclass, property } = _decorator;

@ccclass('GameHall')
export class GameHall extends Component {

    @property(Tabbar)
    pageTabbar: Tabbar = null;

    @property(Node)
    gameNodes: Node[] = []; // 存放不同游戏类型的节点

    @property(Prefab)
    jackpotItemPrefab: Prefab = null;

    @property(Prefab)
    gameItemPrefab: Prefab = null;

    @property(Prefab)
    thirdGameItemPrefab: Prefab = null; // 经典游戏项预制体

    @property(Prefab)
    lotteryItemPrefab: Prefab = null; // 彩票游戏项预制体

    @property(Prefab)
    gameTypeButtonPrefab: Prefab = null; // 游戏类型按钮预制体

    @property(Node)
    gameTypeNode: Node = null; // 存放游戏类型按钮的节点

    @property(Label)
    gameTypeLabel: Label = null;

    @property(Node)
    nodeContent: Node = null;


    private gametypeIndex: number = 0; // 记录当前游戏类型索引 
    private gameItemNodePool: NodePool;
    private slotGameItemNodePool: NodePool;
    

    protected onLoad(): void {
        this.initGameNodePool();
        const tabbar = this.gameTypeNode?.getComponent(Tabbar);
        tabbar?.setChangeCallback((index, item, items) => this.onTabbarChangeGames(index, item, items));
        this.pageTabbar.setChangeCallback((index, item, items) => this.onPageChange(index, item, items));
        this.checkAndHideEmptyNodes();
        this.regsterEvents();
    }

    initGameNodePool() {
        this.gameItemNodePool = new NodePool();
        for (let i = 0; i < 50; i++) {
            const node = instantiate(this.gameItemPrefab);
            this.gameItemNodePool.put(node);
        }
        this.slotGameItemNodePool = new NodePool();
        for (let i = 0; i < 100; i++) {
            const node = instantiate(this.jackpotItemPrefab);
            this.slotGameItemNodePool.put(node);
        }
    }

    regsterEvents() {
        // App.EventUtils.on("GAME_LIST_UPDATE", this.GAME_LIST_UPDATE, this)
        // 金币不足弹出
        App.EventUtils.on(App.EventID.NOT_ENOUGH_COINS, this.onMoneyNotEnough, this);
        App.EventUtils.on("setupGameItem", this.setupGameItem, this);
    }

    start() {
        App.AudioManager.playBGM('audio/bgm_hall');
        App.RedHitManager.updateView();
        App.PopUpManager.allowMultiple = false;
        // 签到弹窗
        if (Config.gameChannel === "D105") {
            if (!App.userData().isLogin) return;
            App.ApiManager.getRechargeManageRewardList().then((ret => {
                App.userData().userInfo.firstRecharge = ret.rewardList.length;
                if (ret.rewardList.length > 0) {
                    App.PopUpManager.addPopup(
                        "prefabs/popup/popupFirstRecharge",
                        "hall",
                        null,
                        true
                    );
                }
            }));
        }
        App.PopUpManager.addPopup("prefabs/notice/main", "hall", null, true);
        App.PopUpManager.addPopup(
            "prefabs/PopupSign/PopupSign",
            'hall',
            null,
            true,
            () => {
                if (!App.userData().isGuest) {
                    App.PopUpManager.allowMultiple = true;
                }
            }
        );
        if (App.userData().isGuest) {
            App.PopUpManager.addPopup(
                "prefabs/popup/popupNewComerGift",
                "hall",
                null,
                false,
                () => {
                    App.PopUpManager.allowMultiple = true;
                }
            );
        }
    }

    update(deltaTime: number) {

    }

    onMoneyNotEnough() {
        App.AlertManager.getCommonAlert().show("Your balance is insufficient, please recharge!", () => {
            this.openShop();
        });
    }

    openShop() {

    }

    checkAndHideEmptyNodes() {
        let allGameList = App.GameManager.getGameCategoryList();
        if (!allGameList) return;

        const sortedList = allGameList.sort((a, b) => a.sort - b.sort);

        // 遍历排序后列表并设置节点显示和顺序
        sortedList.forEach((item, index) => {
            const name = item.categoryCode.toLowerCase();
            const node = this.nodeContent.getChildByName(name);
            if (node) {
                node.active = true;
                node.setSiblingIndex(index); // ✅ 重新排列顺序
            }
        });

        // 隐藏未出现在排序列表中的节点
        this.nodeContent.children.forEach(node => {
            const inList = sortedList.some(item => item.categoryCode.toLowerCase() === node.name);
            if (!inList) {
                node.active = false;
            }
        });
    }

    //切换游戏页面
    onTabbarChangeGames(index, item, items) {
        if (this.gametypeIndex === index) {
            return;
        }
        let allGameList = App.GameManager.getAllGameList();
        console.log("allGameList: ", allGameList);
        if (allGameList.length == 0) return;
        console.log("GameHall index: ", index);
        // App.AudioManager.playBtnClick();
        this.gameNodes.forEach(node => {
            node.active = false; // 隐藏节点
        });

        let gamePrefab = this.lotteryItemPrefab;
        let str = "lottery";
        this.gametypeIndex = index;
        switch (index) {
            case 0:
                gamePrefab = this.lotteryItemPrefab;
                str = "lottery";
                break;
            case 1:
                str = "flash";
                gamePrefab = this.jackpotItemPrefab;
                break;
            case 2:
                str = "popular";
                gamePrefab = this.jackpotItemPrefab;
                let arr = [];
                if (allGameList[str]["clicksTopList"]) {
                    allGameList[str]["clicksTopList"].forEach(item => {
                        arr.push(item);
                    });
                    allGameList[str] = arr;
                }
                if (allGameList[str]["clicksVideoTopList"]) {
                    allGameList[str]["clicksVideoTopList"].forEach(item => {
                        arr.push(item);
                    });
                    allGameList[str] = arr;
                }
                if (allGameList[str]["platformList"]) {
                    allGameList[str]["platformList"].forEach(item => {
                        arr.push(item);
                    });
                    allGameList[str] = arr;
                }
                break;
            case 3:
                str = "slot";
                gamePrefab = this.thirdGameItemPrefab;
                break;
            case 4:
                str = "fish";
                gamePrefab = this.jackpotItemPrefab;
                break;
            case 5:
                str = "sport";
                gamePrefab = this.thirdGameItemPrefab;
                break;
            case 6:
                str = "video";
                gamePrefab = this.thirdGameItemPrefab;
                break;
            case 7:
                str = "chess";
                gamePrefab = this.thirdGameItemPrefab;
                break;
            case 8:
                str = "bingo";
                gamePrefab = this.thirdGameItemPrefab;
                break;
            default:
                break;
        }

        if (index == 2) {
            this.showFavoriteGame();
            return
        }
        // let singleChessOrBingo = str == "chess" || str == "bingo" && allGameList[str].length == 1;

        this.gameNodes[index].active = true;

        const idx = [1, 4, 5, 6, 7, 8]; // 1 flash, 4 fish, 5 sport, 6 video, 7 chess
        let slotGameContainer;
        if (idx.includes(index)) {
            // For indexes 1, 4, 5, 6, 7: view -> content
            slotGameContainer = this.gameNodes[index].getChildByName('view')?.getChildByName("content");
        } else {
            // For other indexes: direct content
            slotGameContainer = this.gameNodes[index].getChildByName("content");
        }

        if (isValid(slotGameContainer)) {
            slotGameContainer.removeAllChildren();
        }
        // let slotGameContainer = this.gameNodes[index].getChildByName("content");
        // if (isValid(slotGameContainer)) {
        //     slotGameContainer.removeAllChildren();
        // }

        let itemNodeType = this.gameNodes[index].getChildByName("classification"); //分类按钮
        if (index == 3) {
            itemNodeType = this.gameNodes[index].getChildByName("node").getChildByName("classification"); //分类按钮
        }
        if (isValid(itemNodeType)) {
            itemNodeType.removeAllChildren();
        }
        this.gameTypeLabel.string = str;

        // 如果只有一个厂商，直接显示游戏列表
        const gameListData = allGameList[str] || [];
        if (gameListData.length === 1) {
            const element = gameListData[0];
            const slotsTypeID = element.slotsTypeID;
            const gameList = GameItemData.slotVendorGameMap.get(slotsTypeID) || [];
            if (itemNodeType) {
                itemNodeType.active = false;
            }
            this.setupGameItem(slotsTypeID, gameList);
            return;
        }

        let ops = [];
        // index 5(sport) 和 6(video) 强制使用横向厂商图片
        const useThirdGameItem = [0, 5, 6].includes(index);

        for (let i = 0; i < gameListData.length; i++) {
            const element = gameListData[i];
            let op;
            if (index == 3) {
                op = instantiate(this.gameTypeButtonPrefab);
                let script = op.getComponent(GameTypeButton) as GameTypeButton;
                script.init(element);
                ops.push(op)
                itemNodeType = this.gameNodes[index].getChildByName("node").getChildByName("classification"); //分类按钮
                itemNodeType.addChild(op);
            } else {
                // 有vendorImg 或者是 sport/video 分类，使用横向厂商图片
                if ((element.vendorImg && element.vendorImg.length > 0) || useThirdGameItem) {
                    op = instantiate(this.thirdGameItemPrefab);
                    let script = op.getComponent(ThirdGameItemComponent) as ThirdGameItemComponent;
                    script.init(index, element);
                    itemNodeType.addChild(op);
                    slotGameContainer.active = false;
                    if (itemNodeType) {
                        itemNodeType.active = true;
                    }
                } else {
                    op = instantiate(this.gameItemPrefab);
                    let script = op.getComponent(GameItemComponent) as GameItemComponent;
                    script.init(element.gamdID, element.vendorId, false, element.gameNameEn, element, index);
                    slotGameContainer.addChild(op);
                    slotGameContainer.active = true;
                    if (itemNodeType) {
                        itemNodeType.active = false;
                    }
                }
            }
        }
        if (index == 3 && ops.length > 0) {
            let scrollView = this.gameNodes[index].getComponent(ScrollView) as ScrollView;
            scrollView.vertical = false;
            scrollView.horizontal = true;
            scrollView.content = itemNodeType;
            let firstOpScript = ops[0].getComponent(GameTypeButton) as GameTypeButton;
            firstOpScript.onClick();
            scrollView.scrollToLeft(0.1);
        }
    }

    showFavoriteGame() {
        const itemNodeType = this.gameNodes[2]?.getChildByName("content"); // 分类游戏
        if (!itemNodeType) {
            console.warn('favorite container not found');
            return;
        }
        itemNodeType.removeAllChildren();
        this.gameNodes[2].active = true;
        const favoriteGames = App.GameManager.getFavoriteGames() || [];
        if (favoriteGames.length === 0) {
            console.log("没有收藏的游戏");
            return;
        }

        for (let i = 0; i < favoriteGames.length; i++) {
            const gameCode = Number(favoriteGames[i].gameCode);
            const vendorCode = App.GameManager.getCategory(gameCode);

            if (vendorCode === 42 || vendorCode === 44 || vendorCode === 45) {
                let node: Node | null = null;

                if (vendorCode !== 42) {
                    node = instantiate(this.gameItemPrefab);
                    const script = node.getComponent(GameItemComponent) as GameItemComponent;
                    script?.init(gameCode);
                    // script.isHot = favoriteGames[i].isHot;
                    // script.isNew = favoriteGames[i].isNew;
                } else {
                    node = instantiate(this.jackpotItemPrefab);
                    const script = node.getComponent(SlotGameItemComponent) as SlotGameItemComponent;
                    script?.init(gameCode);
                }

                if (node) {
                    node.name = String(gameCode);
                    itemNodeType.addChild(node);
                }
            }
        }
    }

    setupGameItem(slotsTypeID, slotGameRes) {
        let data = slotGameRes.gameLists;
        console.log("slotGameRes: ", slotGameRes);
        if (!slotGameRes || !slotGameRes.gameLists) {
            App.AlertManager.showFloatTip("There is no SlotGameRes.gameLists in BINGO!");
            return;
        }
        const gameNode = this.gameNodes[this.gametypeIndex];
        const viewNode = gameNode.getChildByName('view');
        const container = viewNode?.getChildByName('content') ?? gameNode.getChildByName('content');
        const classificationContainer = gameNode.getChildByName('classification');
        container.active = true;

        // 回收旧节点到对应对象池
        for (let i = container.children.length - 1; i >= 0; i--) {
            const child = container.children[i];
            child.removeFromParent();
            if (child.getComponent(SlotGameItemComponent)) {
                this.slotGameItemNodePool?.put(child);
            } else {
                this.gameItemNodePool?.put(child);
            }
        }

        const isInHouse = Number(slotsTypeID) === 42;

        if (isInHouse) {
            for (let i = 0; i < data.length; i++) {
                const gid = parseInt(String(data[i].gameID));
                let node: Node;
                if (this.slotGameItemNodePool && this.slotGameItemNodePool.size() > 0) {
                    node = this.slotGameItemNodePool.get();
                } else {
                    node = instantiate(this.jackpotItemPrefab);
                }
                const script = node.getComponent(SlotGameItemComponent) as SlotGameItemComponent;
                script?.init(gid);
                container.getComponent(Layout).spacingY = 75;
                container.getComponent(Layout).paddingTop = 100;
                container.addChild(node);
            }
        } else {
            if (this.gametypeIndex !== 3 && classificationContainer) {
                classificationContainer.active = false;
            }
            for (let i = 0; i < data.length; i++) {
                const gid = (String(data[i].gameID));
                const vendorId = (String(data[i].vendorId));
                let node: Node;
                if (this.gameItemNodePool && this.gameItemNodePool.size() > 0) {
                    node = this.gameItemNodePool.get();
                } else {
                    node = instantiate(this.gameItemPrefab);
                }
                const showFavorite = !!slotGameRes?.yonoChessOrBingo;
                const script = node.getComponent(GameItemComponent) as GameItemComponent;
                script?.init(gid, vendorId, showFavorite, data[i].gameNameEn, data[i], this.gametypeIndex);
                container.getComponent(Layout).spacingY = 30;
                container.getComponent(Layout).paddingTop = 50;
                container.addChild(node);
            }
        };

        // if (viewNode) {
        //     const scrollView = viewNode.getComponent(ScrollView);
        //     scrollView?.scrollToTop(0.1);
        // }
        // if (container.active) {
        //     const scrollView = gameNode.getComponent(ScrollView);
        //     scrollView?.scrollToTop(0.1);
        // }
        // if (classificationContainer) {
        //     classificationContainer.getComponent(ScrollView)?.scrollToLeft(0.1);
        // }
    }

    // if (classificationContainer) {
    //     classificationContainer.getComponent(ScrollView)?.scrollToLeft(0.1);
    // }

    splitGameData(data) {
        const resultGroup = [];

        // 1. 先找出 541 和 622
        const game541 = data.find(g => Number(g.gameID) === 541);
        const game622 = data.find(g => Number(g.gameID) === 622);

        if (!game541 || !game622) return { selected: [], rest: data }; // 缺一个就不处理

        resultGroup.push(game541); // 开头是 541

        // 2. 补两个中间（排除 541 和 622）
        const middle = [];
        for (let i = 0; i < data.length && middle.length < 2; i++) {
            const g = data[i];
            const id = Number(g.gameID);
            if (id !== 541 && id !== 622 && !middle.find(m => m.gameID === g.gameID)) {
                middle.push(g);
            }
        }

        if (middle.length < 2) return { selected: [], rest: data }; // 不够中间两个也返回全部原始

        resultGroup.push(...middle); // 中间两个
        resultGroup.push(game622);   // 最后是 622

        // 3. 剩下的：过滤掉刚刚这四个
        const idsToRemove = resultGroup.map(g => g.gameID);
        const remaining = data.filter(g => !idsToRemove.includes(g.gameID));

        return {
            selected: resultGroup,
            rest: remaining
        };
    }

    onPageChange(index, item, items) {

    }
}


