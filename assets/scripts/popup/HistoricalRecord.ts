import { _decorator, Component, find, instantiate, Label, Node, PageView } from 'cc';
import { App } from '../App';
import { PopUpAnimType } from '../component/PopupComponent';

const { ccclass, property } = _decorator;

@ccclass('HistoricalRecord')
export default class HistoricalRecord extends Component {
    @property(PageView) pageView: PageView | null = null;
    @property(Node) pageNode: Node | null = null;
    @property(Node) rankItem: Node | null = null;
    @property(Node) rankList: Node | null = null;
    @property(Node) classNode: Node | null = null;
    @property(Node) classList: Node | null = null;
    @property(Node) classItem: Node | null = null;
    @property(Label) classLbl: Label | null = null;
    @property(Label) dateLbl: Label | null = null;
    @property(Label) gameTypeLbl: Label | null = null;
    @property(Node) rankItem_2: Node | null = null;

    // state
    _curPage = 1;
    indexPage = 1;
    totalPage = 1;
    statuIndex = 0;
    className: any = null;

    classData = [];
    dateObj = { year: 0, month: 0, day: 0 };

    private sendPost(url: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest(url, params, (error: any, resp: any) => {
                if (error) return reject(error);
                resolve(resp);
            });
        });
    }

    onLoad() {
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle1", this.node), this.onClickToggle1, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle2", this.node), this.onClickToggle2, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle3", this.node), this.onClickToggle3, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle4", this.node), this.onClickToggle4, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle5", this.node), this.onClickToggle5, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle6", this.node), this.onClickToggle6, this);
        App.ComponentUtils.onClick(find("toggleContainer/view/tog_type/toggle7", this.node), this.onClickToggle7, this);
    }

    async start() {
        const today = new Date();
        this.dateObj = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };

        const d = `${this.dateObj.year}-${String(this.dateObj.month).padStart(2, '0')}-${String(this.dateObj.day).padStart(2, '0')}`;
        this.dateLbl.string = d;
        this.gameTypeLbl.string = "All";

        this.classData = [
            { name: 'Board Games', type: 5 },
            { name: 'Fishing', type: 3 },
            { name: 'Live Video', type: 1 },
            { name: 'Lottery', type: 0 },
            { name: 'Bingo', type: 7 },
            { name: 'Electronic Games', type: 2 },
            { name: 'Sports', type: 4 },
        ];

        this.className = this.classData[0].type;
        this.classLbl.string = this.classData[0].name;

        await this.fetchRecordList(1);
    }

    async fetchRecordList(page = 1) {
        const params = {
            startDate: `${this.dateLbl.string} 00:00:00`,
            endDate: `${this.dateLbl.string} 23:59:59`,
            type: parseInt(this.className),
            gameType: this.gameTypeLbl.string === "All" ? -1 : this.gameTypeLbl.string,
            pageNo: page,
            pageSize: 30,
        };

        try {
            const res = await this.sendPost("GetNewMyEmerdList", params);
            if (res.code !== 0) return App.AlertManager.showFloatTip(res.msg);

            this.indexPage = page;
            this.totalPage = res.data.totalPage;
            this.showData(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    async selectDate() {
        const params = {
            cb: (newDate: { year: number; month: number; day: number }) => {
                this.dateObj = newDate;
                this.dateLbl.string = `${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`;
                this.fetchRecordList(1);
            },
            dateObj: { type: 0, year: this.dateObj.year, month: this.dateObj.month, day: this.dateObj.day }
            // dateObj: this.dateObj as SelectDateObj
        };
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup("prefabs/popup/popupSelectDate", "hall", params, false,
            null, PopUpAnimType.fromBottom, PopUpAnimType.fromBottom);
    }

    async onClickSelecType() {
        let type = parseInt(this.className);
        let additionalParams, url;
        switch (type) {
            case 2:
                type = 0;
                break;
            case 4:
                type = 2;
                break;
            case 5:
                type = 4;
                break;
            case 7:
                type = 5;
                break;
            default:
                break;
        }

        if (type == 3 || type == 6) {
            additionalParams = {
                gameType: type
            };
            url = "GetSmallGameOrFishList";
        } else {
            additionalParams = {
                categoryType: type
            };
            url = "GetThirdGameCategory";
        }

        const res = await this.sendPost(url, additionalParams);
        if (res.code !== 0) return App.AlertManager.showFloatTip(res.msg);
        const list = ["All", ...res.data.map((x: any) => x.slotsName)];
        const dateObj = {
            type: 1,
            status: list
        };
        const params = {
            cb: (idx: number) => {
                this.gameTypeLbl.string = list[idx];
                this.fetchRecordList(1);
            },
            dateObj: dateObj
        };
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup("prefabs/popup/popupSelectDate", "hall", params, false,
            null, PopUpAnimType.fromBottom, PopUpAnimType.fromBottom);
    }

    onClickToggle1() { this.onClickToggle(0); }
    onClickToggle2() { this.onClickToggle(1); }
    onClickToggle3() { this.onClickToggle(2); }
    onClickToggle4() { this.onClickToggle(3); }
    onClickToggle5() { this.onClickToggle(4); }
    onClickToggle6() { this.onClickToggle(5); }
    onClickToggle7() { this.onClickToggle(6); }

    onClickToggle(index: number) {
        this.className = this.classData[index].type;
        this.classLbl.string = this.classData[index].name;
        this.gameTypeLbl.string = "All";
        this.fetchRecordList(1);
    }

    openClassList() {
        if (this.classNode.active) {
            this.classNode.active = false;
            return;
        }

        this.classNode.active = true;
        this.classList.removeAllChildren();

        this.classData.forEach(item => {
            const n = instantiate(this.classItem);
            n.active = true;
            n.name = String(item.type);
            n.getChildByName("Label").getComponent(Label).string = item.name;
            App.ComponentUtils.onClick(n, () => {
                this.className = n.name;
                this.classLbl.string = item.name;
                this.classNode.active = false;
                this.fetchRecordList(1);
            }, this);
            n.parent = this.classList;
        });
    }

    showData(data: any) {
        this.rankList.removeAllChildren();

        data.list.forEach((r: any) => {
            const row = instantiate(this.rankItem);
            row.active = true;
            row.children[4].getComponent(Label).string = r.gameName;
            row.children[5].getComponent(Label).string = r.orderNo;
            row.children[6].getComponent(Label).string = r.betTime;
            row.children[7].getComponent(Label).string = r.betAmount;
            row.children[8].getComponent(Label).string = r.validBetAmount;
            row.children[9].getComponent(Label).string = r.winAmount;
            row.children[10].getComponent(Label).string = r.serviceFeeAmount;
            row.children[11].getComponent(Label).string = r.winLossAmount;
            row.parent = this.rankList;
        });

        const footer = instantiate(this.rankItem_2);
        footer.active = true;
        footer.children[1].getComponent(Label).string = `${this.indexPage}/${this.totalPage}`;
        footer.parent = this.rankList;
    }

    async left(event: any, dir: string) {
        if (dir === "0" && this.indexPage > 1) this.fetchRecordList(this.indexPage - 1);
        if (dir !== "0" && this.indexPage < this.totalPage) this.fetchRecordList(this.indexPage + 1);
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }
}
