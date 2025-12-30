import { _decorator, Component, EventTouch, Node, tween, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import CarouselIndicatorCpt from "./CarouselIndicatorCpt";
import CarouselItemCpt from "./CarouselItemCpt";

@ccclass('CarouselCpt')
export default class CarouselCpt extends Component {
    showItemList: CarouselItemCpt[] = [];
    indexItem: CarouselItemCpt = null;
    nextItem: CarouselItemCpt = null;
    private isTouch = false;
    @property
    time: number = 3
    @property(CarouselIndicatorCpt)
    indicatorCpt: CarouselIndicatorCpt = null;
    _curIdx: number = 0;
    set curIdx(idx) {
        this._curIdx = idx;
        if (this.indicatorCpt) {
            this.indicatorCpt.showPage(idx);
        }
    }
    get curIdx() {
        return this._curIdx;
    }
    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.schedule(this.onToNext, this.time)
    }
    protected start(): void {
        //由于初始化需要一定的时间,所以写在这里
        this.updateView();
    }
    protected onEnable(): void {
        //防止touchEnd未触发导致轮播图不动了
        this.isTouch = false;
    }
    onTouchStart() {
        this.isTouch = true;
    }
    onTouchMove(event: EventTouch) {
        // 直接更新位置
        // 确认方向 TODO
        // log(event);
        // event.stopPropagation();
        // event.propagationStopped = true;
    }
    onTouchEnd() {
        this.isTouch = false;
    }
    initView() {
    }
    updateView() {
        // 获取需要显示的
        this.showItemList = [];
        for (const itemCpt of this.node.getComponentsInChildren(CarouselItemCpt)) {
            itemCpt.carouselCpt = this;
            if (itemCpt.isOpen) {
                itemCpt.node.active = true;
                this.showItemList.push(itemCpt);
            } else {
                itemCpt.node.active = false;
            }
        }

        this.showItemList.sort((a, b) => {
            return a.ord - b.ord;
        })

        if (this.indicatorCpt) {
            this.indicatorCpt.initPage(this.showItemList.length);
        }

        this.indexItem = this.showItemList[0];
        this.nextItem = this.showItemList[1];
        for (let i = 0; i < this.showItemList.length; i++) {
            const itemCpt = this.showItemList[i];
            if (i == 0) {
                itemCpt.node.x = 0;
            } else {
                itemCpt.node.x = this.node.getComponent(UITransform)!.getComponent(UITransform)!.width;
            }
        }
        this.curIdx = 0;
    }
    onToNext() {
        if (this.isTouch) return;
        if (!this.nextItem) return;
        if (!this.nextItem.node) return;
        this.indexItem.node.x = 0;
        this.nextItem.node.x = this.node.getComponent(UITransform)!.width;
        tween(this.indexItem.node).to(0.4, { x: -this.node.getComponent(UITransform)!.width }).start();
        tween(this.nextItem.node)
            .to(0.4, { x: 0 })
            .call(() => {
                this.curIdx = this.showItemList.indexOf(this.nextItem);
                this.indexItem = this.nextItem;
                let nextIndex = this.showItemList.indexOf(this.nextItem) + 1;
                if (this.showItemList[nextIndex]) {
                    this.nextItem = this.showItemList[nextIndex];
                } else {
                    this.nextItem = this.showItemList[0];
                }
            }).start();
    }
}

