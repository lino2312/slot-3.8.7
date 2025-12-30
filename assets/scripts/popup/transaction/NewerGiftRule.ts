import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewerGiftRule')
export class NewerGiftRule extends Component {

    @property(Label)
    label1: Label = null!;
    @property(Label)
    label2: Label = null!;

    start() {

    }

    update(deltaTime: number) {

    }

    setParams(cotent:string){
        this.label1.string = cotent;
        this.label2.string = cotent;
    }
}


