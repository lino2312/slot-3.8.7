import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BankItem')
export class BankItem extends Component {

    private callback: Function = null!;

    @property(Label)
    paymentName: Label = null!;

    start() {

    }

    update(deltaTime: number) {

    }

    init(data: any,callback: Function) {
        this.paymentName.string = data?.bankName || '';
        this.callback = callback;
    }

    onSelect() {
        this.callback && this.callback();
    }
}


