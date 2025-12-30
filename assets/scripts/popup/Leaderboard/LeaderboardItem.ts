import { _decorator, Component, find, Label } from "cc";
import { App } from "../../App";
const { ccclass, property } = _decorator;

@ccclass("LeaderboardItem")
export class LeaderboardItem extends Component {
    private _datasource: any = null;

    // Type-safe datasource getter/setter
    get datasource(): any {
        return this._datasource;
    }

    set datasource(value: any) {
        this._datasource = value;
        this.onInitItem();
    }

    private onInitItem(): void {
        const datasource = this.datasource?.itemData;
        console.log("[LeaderboardItem] onInitItem:", datasource);

        if (datasource) {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();

            const todayMonthDay = `${today.getMonth() + 1}-${today.getDate()}`;
            const isLastDayOfMonth = today.getDate() === new Date(year, month + 1, 0).getDate();

            let tomorrowMonthDay: string;
            if (isLastDayOfMonth) {
                const tomorrow = new Date(year, month + 1, 1);
                tomorrowMonthDay = `${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(today.getDate() + 1);
                tomorrowMonthDay = `${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;
            }

            const formattedResult = `${todayMonthDay}—${tomorrowMonthDay}`;

            this.setLabel("titleplace/title", datasource.title);
            this.setLabel("time/date", formattedResult);
            this.setLabel("prize", datasource.totalPrize);
        }
    }

    private setLabel(path: string, text: string): void {
        const labNode = find(path, this.node);
        if (labNode) {
            const labelComp = labNode.getComponent(Label);
            if (labelComp) {
                labelComp.string = text || "";
            }
        }
    }

    private extractMonthDay(dateString: string): string {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${month}.${day}`;
    }

    public onClick(): void {
        var tt = this.datasource;
        App.PopUpManager.allowMultiple = true;
        console.log("tt");
        App.PopUpManager.addPopup(
            "prefabs/Leaderboard/popupLeaderBoardDailyView",
            "hall",
            { scriptName: "LeaderboardDailyView", datasource: this.datasource }
        );
    }
}
