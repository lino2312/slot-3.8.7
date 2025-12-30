import { _decorator, Component, Label, Node, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BankCardItem')
export class BankCardItem extends Component {
    @property(Label) payment: Label = null!;
    @property(Label) payment2: Label = null!;

    private data: any = null;
    private callback: (() => void) | null = null;

    onLoad() {

    }

    start() { }

    public init(data: any, callback?: () => void) {
        this.data = data;
        this.callback = callback || null;

        // default unselected state
        const mark = find('isSelect', this.node);
        if (mark) mark.active = false;

        this.applyData();
    }

    public onSelect() {
        const parent = this.node.parent;
        if (parent) {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const mark = find('isSelect', child);
                if (mark) mark.active = false;
            }
        }
        const selfMark = find('isSelect', this.node);
        if (selfMark) selfMark.active = true;

        if (this.callback) this.callback();
    }

    private applyData() {
        if (!this.data) return;
        const text = this.data.name || '';
        if (this.payment) this.payment.string = text;
        if (this.payment2) this.payment2.string = text;
    }
}