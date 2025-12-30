import { _decorator, Canvas, Component, Node } from 'cc';
import { App } from './App';
const { ccclass, property } = _decorator;

@ccclass('Global')
export class Global extends Component {

    protected onLoad(): void {
        App.ComponentUtils.addPersistNode(this.node);
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


