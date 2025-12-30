import MySpine from "../../../scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import JungleDelightData from "./JungleDelightData";
import { _decorator, Component } from 'cc';

const {ccclass, property} = _decorator;

@ccclass('JungleDelightItem')
export default class JungleDelightItem extends Component {

    @property(Boolean)
    isSpecialIcon: boolean = false;

    changeItemIcon(isShow: boolean = false) {
        let icon = this.node.getChildByName("icon");
        let icon2 = this.node.getChildByName("icon2");

        if (isShow) {
            icon.active = true;
            icon2.active = false;
        } else {
            icon.active = false;
            icon2.active = true;
        }
    }

    /** 中线展示 */
    showAni() {
        let spineNode = this.node.getChildByName("spine");
        let kuangSpineNode = this.node.getChildByName("kuangSpine");
        let spine = spineNode.getComponent(MySpine);
        let kuangSpine = kuangSpineNode.getComponent(MySpine);
        if (!this.isSpecialIcon) {
            let boxSpineNode = this.node.getChildByName("boxSpine");
            let lightSpine = this.node.getChildByName("lightSpine");
            boxSpineNode.active = false;
            lightSpine.active = false;
        }
        spineNode.active = true;
        spine.playAni(0, true);
        kuangSpineNode.active = true;
        kuangSpine.playAni(0,false,()=>{
            kuangSpine.playAni(1,true);
        })
    }

    /** 展示盒子 */
    showBox() {
        let spineNode = this.node.getChildByName("spine");
        let kuangSpineNode = this.node.getChildByName("kuangSpine");
        let boxSpineNode = this.node.getChildByName("boxSpine");
        let boxSpine = boxSpineNode.getComponent(MySpine);
        kuangSpineNode.active = false;
        spineNode.active = false;
        boxSpineNode.active = true;
        boxSpine.playAni(0, true)
    }

    /** 盒子打开动画 */
    openBoxAni() {
        let spineNode = this.node.getChildByName("spine");
        let kuangSpineNode = this.node.getChildByName("kuangSpine");
        let boxSpineNode = this.node.getChildByName("boxSpine");
        let lightSpine = this.node.getChildByName("lightSpine");
        let spine = spineNode.getComponent(MySpine);
        let boxSpine = boxSpineNode.getComponent(MySpine);
        kuangSpineNode.active = false;
        spineNode.active = false;
        boxSpineNode.active = true;
        boxSpine.playAni(1, false, () => {
            lightSpine.active = true;
            Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'fsBoxExplosion');
            boxSpine.playAni(2, false, () => {
                spineNode.active = true;
                Utils.playEffect(JungleDelightData.BUNDLE_NAME, 'mgBoxExplosion');
                spine.playAni(0, true);
            })
        })
    }
}
