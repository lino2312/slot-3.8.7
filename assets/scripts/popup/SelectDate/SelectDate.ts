import { _decorator, Animation, AnimationState, Component, instantiate, Label, Node, Prefab, UIOpacity } from "cc";
import { App } from "../../App";
const { ccclass, property } = _decorator;

export type SelectDateObj = {
    type: 0 | 1;   // 0 = date picker, 1 = status selector
    year?: number;
    month?: number;
    day?: number;
    index?: number;
    status?: string[];
};

@ccclass("SelectDate")
export default class SelectDate extends Component {

    @property(Node) yearNode: Node = null!;
    @property(Node) monthNode: Node = null!;
    @property(Node) dayNode: Node = null!;
    @property(Prefab) selectDateLab: Prefab = null!;
    @property(Node) animation: Node = null!;

    private cb: Function | null = null;
    private dateObj: SelectDateObj | any = null;

    onLoad() {

    }

    setParams(params: { cb: Function; dateObj?: SelectDateObj }) {
        const { cb, dateObj } = params;
        console.log("[SelectDate] setParams", params);
        this.cb = cb;
        this.dateObj = dateObj;
        if (this.dateObj && this.dateObj.type === 1) {
            if (this.monthNode.children.length === 0) this.onAddRadioBtnItem();
            this.animation.children[1].active = false;
            return;
        }

        const date = new Date();
        if (!this.dateObj) {
            this.dateObj = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            };
        }

        this.onAddDateItem(this.yearNode, this.getYears());
        this.onAddDateItem(this.monthNode, this.getAvailableMonths(this.dateObj.year));
        this.onAddDateItem(this.dayNode, this.getAvailableDays(this.dateObj.year, this.dateObj.month));
        this.yearNode.y = 170 - (68 * (2 - ((this.dateObj.year - new Date().getFullYear() + 2))));
        this.monthNode.y = 170 - (68 * (2 - (this.dateObj.month - 1)));
        this.dayNode.y = 170 - (68 * (2 - (this.dateObj.day - 1)));
        if (!this.dateObj.day) {
            this.yearNode.x = -250;
            this.monthNode.x = 250;
        }

    }

    private onAddRadioBtnItem() {
        this.monthNode.removeAllChildren();
        const self = this;
        this.dateObj.status.forEach((t: string, i: number) => {
            const textNode = this.onCreateBtn(t, () => {
                self.dateObj.index = i;
                self.highlight(i, this.monthNode);
                self.monthNode.y = 170 - (68 * (2 - i));
            });
            self.monthNode.addChild(textNode);
        });

        this.highlight(this.dateObj.index ?? 0, this.monthNode);
    }

    private onCreateBtn(text: any, cb: Function) {
        const node = instantiate(this.selectDateLab);
        const label = node.getComponent(Label);
        label.string = text;
        node.on(Node.EventType.TOUCH_END, () => cb());
        return node;
    }

    private onAddDateItemEx(node: Node, arr: any[]) {
        node.removeAllChildren();

        arr.forEach((value, i) => {
            const textNode = this.onCreateBtn(value, () => {
                this.dateObj[node.name] = value;
                this.highlight(i, node);

                if (node === this.yearNode) {
                    this.onAddDateItem(this.monthNode, this.getAvailableMonths(value));
                    this.onAddDateItem(this.dayNode, this.getAvailableDays(value, this.dateObj.month));
                } else if (node === this.monthNode) {
                    this.onAddDateItem(this.dayNode, this.getAvailableDays(this.dateObj.year, value));
                }
            });

            node.addChild(textNode);
        });
    }

    private onAddDateItem(node: Node, arr: any[]) {
        const self = this;
        let children = node.children.slice();
        children.forEach(child => {
            node.removeChild(child);
            child.destroy();
        });

        for (let i = 0; i < arr.length; i++) {
            const text = arr[i];

            const textNode = this.onCreateBtn(text, () => {
                node.y = 170 - (68 * (2 - i));
                self.dateObj[node.name] = text;
                const month = self.getAvailableMonths(text);
                // textNode.opacity = 255;
                let uiOpacity = textNode.getComponent(UIOpacity);
                if (!uiOpacity) {
                    uiOpacity = textNode.addComponent(UIOpacity);
                }
                uiOpacity.opacity = 255;
                self.onUpdataLabOpacity(i, node);
                const date = new Date();
                if (node.name == "year") {
                    if (self.dateObj.month > (date.getMonth() + 1)) {
                        self.dateObj.month = date.getMonth() + 1;
                    }
                    const day = self.getDaysPassed(self.dateObj.year, self.dateObj.month)
                    if (self.dateObj.day > day) {
                        self.dateObj.day = day;
                    }
                    self.onAddDateItem(self.monthNode, self.getAvailableMonths(text));
                    self.onAddDateItem(self.dayNode, self.getAvailableDays(text, month[month.length - 1]));
                    self.monthNode.y = 170 - (68 * (2 - (self.dateObj.month - 1)));
                    self.dayNode.y = 170 - (68 * (2 - (self.dateObj.day - 1)));
                } else if (node.name == "month") {
                    const day = self.getDaysPassed(self.dateObj.year, self.dateObj.month)
                    if (self.dateObj.day > day) {
                        self.dateObj.day = day;
                    }
                    self.onAddDateItem(self.dayNode, self.getAvailableDays(self.dateObj.year, text));
                    self.dayNode.y = 170 - (68 * (2 - (self.dateObj.day - 1)));
                }
            });
            node.addChild(textNode);
            let index = i;
            if (node.name == "year") {
                const date = new Date();
                index = self.dateObj.year - date.getFullYear() + 2;
            } else if (node.name == "month") {
                index = self.dateObj.month - 1;
                const month = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December"
                ];
                textNode.getComponent(Label).string = month[text - 1]
            } else {
                index = self.dateObj.day - 1;
            }
            self.onUpdataLabOpacity(index, node);
        }
    }

    private onUpdataLabOpacity(index, textNode) {
        if (textNode.children[index - 1]) {
            let textnode = textNode.children[index - 1];
            let ui = textnode.getComponent(UIOpacity) || textnode.addComponent(UIOpacity);
            ui.opacity = 127.5;
        }
        if (textNode.children[index - 2]) {
            let textnode = textNode.children[index - 2];
            let ui = textnode.getComponent(UIOpacity) || textnode.addComponent(UIOpacity);
            ui.opacity = 76.5;
        }
        if (textNode.children[index + 1]) {
            let textnode = textNode.children[index + 1];
            let ui = textnode.getComponent(UIOpacity) || textnode.addComponent(UIOpacity);
            ui.opacity = 127.5;
        }
        if (textNode.children[index + 2]) {
            let textnode = textNode.children[index + 2];
            let ui = textnode.getComponent(UIOpacity) || textnode.addComponent(UIOpacity);
            ui.opacity = 76.5;
        }

        // textNode.children[index - 1] && (textNode.children[index - 1].opacity = 127.5);
        // textNode.children[index - 2] && (textNode.children[index - 2].opacity = 76.5);
        // textNode.children[index + 1] && (textNode.children[index + 1].opacity = 127.5);
        // textNode.children[index + 2] && (textNode.children[index + 2].opacity = 76.5);
    }


    private getDaysPassed(year, month) {
        const date = new Date();
        if (date.getFullYear() === year && date.getMonth() + 1 === month) {
            return date.getDate();
        }
        if (date.getFullYear() < year || (date.getFullYear() === year && date.getMonth() + 1 < month)) {
            return 0;
        }
        return new Date(year, month, 0).getDate();
    }

    private highlight(i: number, node: Node) {
        node.children.forEach((child, idx) => {
            let ui = child.getComponent(UIOpacity) || child.addComponent(UIOpacity);
            if (idx === i) ui.opacity = 255;
            else if (idx === i - 1 || idx === i + 1) ui.opacity = 127;
            else if (idx === i - 2 || idx === i + 2) ui.opacity = 76;
            else ui.opacity = 30;
        });
    }

    onConfirm() {
        if (this.cb) {
            if (this.dateObj.type === 0) {
                this.cb({
                    year: this.dateObj.year,
                    month: this.dateObj.month,
                    day: this.dateObj.day
                });
            } else {
                this.cb(this.dateObj.index ?? 0);
            }
        }
        this.close();
    }




    private close() {
        const anim = this.animation.getComponent(Animation);
        if (!anim) {
            this.node.destroy();
            return;
        }

        // Force the return type as AnimationState
        const state = anim.getState("onSelectDateClip") as AnimationState;

        if (state) {
            // Play in reverse
            state.time = 0;
            state.speed = 1;
            anim.play("onSelectDateClip");
        } else {
            // Clip not found, just destroy
            this.node.destroy();
            return;
        }

        anim.once(Animation.EventType.FINISHED, () => {
            this.node.destroy();
        });
        App.PopUpManager.closePopup(this.node);
    }

    onCancel() {
        this.close();
    }

    private getYears() {
        const y = new Date().getFullYear();
        return [y - 2, y - 1, y];
    }


    //获取可用月份
    private getAvailableMonths(year) {
        const thisYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        if (year === thisYear) {
            return Array.from({ length: currentMonth }, (v, i) => i + 1);
        } else if (year < thisYear) {
            return Array.from({ length: 12 }, (v, i) => i + 1);
        } else {
            return [];
        }
    }

    //获取可用天数
    private getAvailableDays(year, month) {
        const today = new Date();
        const thisYear = today.getFullYear();
        const thisMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        let totalDays = new Date(year, month, 0).getDate();
        if (year === thisYear && month === thisMonth) {
            return Array.from({ length: currentDay }, (v, i) => i + 1);
        } else if (year < thisYear || (year === thisYear && month < thisMonth)) {
            return Array.from({ length: totalDays }, (v, i) => i + 1);
        } else {
            return [];
        }
    }


}