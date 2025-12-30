import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SettingLangBoxCpt')
export class SettingLangBoxCpt extends Component {
    @property(Node)
    public arItem = null;
    @property(Node)
    public enItem = null;

    initView (closeFunc: any) {
        // this.closeFunc = closeFunc; 
        // this.arItem.on("click", () => { 
            // this.onChangeLang(cc.vv.i18nLangEnum.AR); 
        // }, this); 
        // this.enItem.on("click", () => { 
            // this.onChangeLang(cc.vv.i18nLangEnum.EN); 
        // }, this); 
    }

    onLoad () {
        // let lanConfig = cc.vv.i18nManager.getConfig(); 
        // cc.find("isSelect", this.arItem).active = lanConfig.lang == 'ar'; 
        // cc.find("isSelect", this.enItem).active = lanConfig.lang == 'en'; 
        // if (Global.isDurakApp()) { 
            // this.arItem.active = false 
        // } 
    }

    onChangeLang (lang: any) {
        // if (cc.vv.i18nManager.getConfig().enum == lang) return; 
        // cc.vv.i18nManager.setLanguage(lang); 
        // let lanConfig = cc.vv.i18nManager.getLanguageConfig(lang) 
        // cc.vv.NetManager.send({ c: MsgId.CHANGE_LANGUAGE, language: lanConfig.id }, true); 
        // cc.vv.SceneMgr.enterScene(Global.SCENE_NAME.CHANGE_LANGUAGE, null, Global.APP_ORIENTATION); 
        // cc.vv.PopupManager.removePopup(this.node); 
    }

    onDestroy () {
        // if (this.closeFunc) this.closeFunc(); 
    }

}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// // 登录语言选择框
// cc.Class({
//     extends: cc.Component,
//     properties: {
//         arItem: cc.Node,
//         enItem: cc.Node,
//     },
// 
// 
//     initView(closeFunc) {
//         this.closeFunc = closeFunc;
//         this.arItem.on("click", () => {
//             this.onChangeLang(cc.vv.i18nLangEnum.AR);
//         }, this);
//         this.enItem.on("click", () => {
//             this.onChangeLang(cc.vv.i18nLangEnum.EN);
//         }, this);
//     },
// 
//     onLoad() {
//         let lanConfig = cc.vv.i18nManager.getConfig();
//         cc.find("isSelect", this.arItem).active = lanConfig.lang == 'ar';
//         cc.find("isSelect", this.enItem).active = lanConfig.lang == 'en';
// 
//         if (Global.isDurakApp()) {
//             this.arItem.active = false
//         }
//     },
// 
// 
//     onChangeLang(lang) {
//         if (cc.vv.i18nManager.getConfig().enum == lang) return;
//         // 进行多语言的切换
//         cc.vv.i18nManager.setLanguage(lang);
//         let lanConfig = cc.vv.i18nManager.getLanguageConfig(lang)
//         // 请求更换语言
//         cc.vv.NetManager.send({ c: MsgId.CHANGE_LANGUAGE, language: lanConfig.id }, true);
//         // 调转到一个中间场景
//         cc.vv.SceneMgr.enterScene(Global.SCENE_NAME.CHANGE_LANGUAGE, null, Global.APP_ORIENTATION);
//         // 请求HTTP
//         cc.vv.PopupManager.removePopup(this.node);
//     },
// 
//     onDestroy() {
//         if (this.closeFunc) this.closeFunc();
//     },
// 
// });
