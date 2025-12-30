import { Vec2, Node, Canvas, screen, view, Vec3 } from "cc"
import { App } from "../App";

export class ScreenUtils {
    //竖屏设计的UI
    //共用节点都是按照1080*1920设计的，大小需要缩放到当前场景的分辨率
    static FixDesignScale_V(node: Node, forse = true) {
        let fixDesigin = new Vec2(1080, 1920)
        let doFix = function () {
            let designSize = view.getDesignResolutionSize();
            let scaleX = designSize.width / fixDesigin.x
            let scaleY = designSize.height / fixDesigin.y
            let min = (scaleX > scaleY ? scaleY : scaleX)
            if (node) {
                node.setScale(node.scale.x * min, node.scale.y * min, node.scale.z * min)
            }
            return min
        }
        if (forse) {
            return doFix()
        }
        let curGameId = App.SubGameManager.getGameid();
        if (curGameId && curGameId > 0) {
            let data = App.GameManager.getGameConfig(curGameId);
            if (data) {
                if (data.orientation == "portrait") {
                    return doFix()
                }
            }
        }
        return 1
    }

    static getScreenWidth(): number {
        let vec2 = screen.windowSize;
        return vec2.width
    }

    static getScreenHeight(): number {
        let vec2 = screen.windowSize;
        return vec2.height
    }

    static getCenterPos(): Vec3 {
        return new Vec3(this.getScreenWidth() / 2, this.getScreenHeight() / 2, 0);
    }
}