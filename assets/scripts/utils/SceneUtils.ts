import { director, Node } from "cc";
import { App } from "../App";
import { Config } from "../config/Config";


export class SceneUtils {

    static enterLoginScene(callback = null) {
        App.SceneUtils.enterScene(Config.SCENE_NAME.LOGIN, callback, 'portrait');
    }

    static enterHallScene(callback = null) {
          console.log("退出大厅222")
        App.SceneUtils.enterScene(Config.SCENE_NAME.HALL, callback, 'portrait');
    }

    //这部分逻辑要放到对应的地方去处理，不要在这做统一处理
    static enterScene(sceneName, callback = null, orientation = 'portrait', subpackage = null, msgDic = null) {
        console.log("退出大厅")
        director.resume()
        App.AudioManager.stopAll();
        App.AlertManager.clearFloatTip();
        let curScene = director.getScene();
        if (curScene.name === sceneName) return;
        console.log("@@@@@@@@@@@@@@@@@@sceneName:" + sceneName);
        App.EventUtils.dispatchEvent(App.EventID.HIDE_SHOP)

        if (curScene.name == Config.SCENE_NAME.HALL) {
            App.EventUtils.dispatchEvent(App.EventID.HALL_RECYCLE_ITEM);
        }
        let enterSceneName = sceneName;
        if (sceneName === Config.SCENE_NAME.LOGIN) {
            App.AudioManager.stopAll();
            // cc.vv.AppData.clearGameId();
            orientation = 'portrait';
        }
        else if (sceneName === Config.SCENE_NAME.HOTUPDATE) {
            // cc.vv.AppData.clearGameId();
            orientation = 'portrait';
        }
        else if (sceneName === 'solt_loading') {

        }
        else if (sceneName === Config.SCENE_NAME.HALL) {
            // cc.vv.AppData.clearGameId();
            // if (cc.vv.gameData) cc.vv.gameData.onExit();
            orientation = 'portrait';
        }
        else if (sceneName === Config.SCENE_NAME.HALL_PRELOAD) {
            orientation = 'portrait';
        }
        if (orientation) {

        }
        else { //没有配置的就是就是横版

            orientation = "landscape"
        }
        App.PlatformApiMgr.setOrientation(orientation);
        App.BroadcastManager.stop()

        director.loadScene(sceneName, (err, targScene) => {
            App.PopUpManager.closeAllPopups();
            if (enterSceneName === Config.SCENE_NAME.HALL || enterSceneName === Config.SCENE_NAME.LOGIN) {

                // if (cc.vv.gameData) cc.vv.gameData.clear();
            }
            //大厅就不自动释放了
            if (!err && targScene) {
                targScene.autoReleaseAssets = true //自动释放资源
            }
            App.BroadcastManager.run()
            if (callback) callback(err, targScene);
        });
    }


    //获取当前场景的根节点
    static getCurrentSceneRootNode(): Node | null {
        return director.getScene()?.getChildByName('Canvas') as Node | null;
    }

    static getCurSceneName() {
        return director.getScene().name
    }

    //是否再大厅场景
    static isInHallScene() {
        return this.getCurSceneName() === Config.SCENE_NAME.HALL;
    }

    //是否在登录场景
    static isInLoginScene() {
        return this.getCurSceneName() === Config.SCENE_NAME.LOGIN;
    }

    //是否可以显示大厅预加载场景
    static canShowHallPreLoading() {
        return this.getCurSceneName() === Config.SCENE_NAME.HOTUPDATE
            || this.getCurSceneName() === Config.SCENE_NAME.LOGIN
            || this.getCurSceneName() === Config.SCENE_NAME.LAUNCH;
    }
}