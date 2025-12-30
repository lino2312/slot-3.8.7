import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

import CarouselCpt from "./CarouselCpt";

@ccclass('CarouselItemCpt')
export default class CarouselItemCpt extends Component {
    carouselCpt: CarouselCpt = null;
    @property
    reportKey: string = "";
    public _isOpen = true;
    public ord = 0;
    get isOpen() {
        return this._isOpen;
    }
    set isOpen(value) {
        this._isOpen = value;
        if (this.carouselCpt)
            this.carouselCpt.updateView();
    }

}


