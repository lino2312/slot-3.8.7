import { _decorator, Component, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;

import { App } from '../App';
import CarouselCpt from "./CarouselCpt";
import CarouselItemCpt from "./CarouselItemCpt";
import HallAdItemCpt from "./HallAdItemCpt";

@ccclass('HallAdCpt')
export default class HallAdCpt extends Component {
        @property(Prefab)
        adPagePrefab: Prefab | null = null;
        async onLoad() {
                let adConfig = await App.ApiManager.getBannerList();
                this.updateView(adConfig)
        }
        updateView(adConfig) {
                if (!this.node) return;
                for (const itemCpt of this.node.getComponentsInChildren(CarouselItemCpt)) {
                        itemCpt._isOpen = false;
                }
                // 控制广告位
                for (const item of adConfig) {
                        // if (item.img && item.img.indexOf('http') > -1) { //网络头像
                        let adPageNode = instantiate(this.adPagePrefab)
                        adPageNode.parent = this.node.getComponent(CarouselCpt).node;
                        adPageNode.getComponent(HallAdItemCpt).img = item.bannerUrl;
                        adPageNode.getComponent(HallAdItemCpt).url = item.url;
                        // adPageNode.getComponent(CarouselItemCpt)._isOpen = item.url;
                        // adPageNode.getComponent(CarouselItemCpt).ord = adConfig.indexOf(item);
                        // } else {
                        //     let itemNode = cc.find(item.img, this.node)
                        //     if (itemNode && itemNode.getComponent(CarouselItemCpt)) {
                        //         itemNode.getComponent(CarouselItemCpt)._isOpen = true;
                        //         itemNode.getComponent(CarouselItemCpt).ord = adConfig.indexOf(item);
                        //     }
                        // }
                }
                this.node.getComponent(CarouselCpt).updateView();
        }
}

