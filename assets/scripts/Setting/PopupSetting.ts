import { _decorator, Component, Toggle, Label, Button, } from "cc";
import { App } from "../App";
import { Config } from "../config/Config";
import { EventId } from "../constants/EventId";
import { HotUpdateManager } from "../manager/HotUpdateManager";

const { ccclass, property } = _decorator;

@ccclass("SettingPanel")
export class SettingPanel extends Component {

    @property(Toggle)
    musicToggle: Toggle = null!;

    @property(Toggle)
    soundToggle: Toggle = null!;

    @property(Label)
    versionLabel: Label = null!;

    @property(Label)
    currentLanLabel: Label = null!;

    @property(Button)
    phoneBindBtn: Button = null!;

    private _isRefuseGift: boolean = false;

    onLoad() {
        // 初始化音乐、音效开关
        this.musicToggle.isChecked = App.AudioManager.getBgmVolume() > 0;
        this.soundToggle.isChecked = App.AudioManager.getEffVolume() > 0;

        // 初始化绑定按钮
        this.updateBindBtns();
    }

    onEnable() {
        this.updateVersionLabel();
    }

    /**
     * 更新版本号显示
     * 显示热更新Bundle版本号
     */
    private updateVersionLabel(): void {
        // 获取hall bundle的本地版本号
        const hallVersion = HotUpdateManager.getLocalVersion('hall');
        
        // 如果新格式没有，尝试旧格式（兼容）
        const localVersion = hallVersion || App.StorageUtils.getLocal('hall_version', '');
        
        // 构建版本字符串
        let versionStr = '';
        
        if (localVersion) {
            // 显示热更新版本
            versionStr = `Hall Bundle: ${localVersion}`;
            
            // 可选：同时显示原生应用版本
            if (App.DeviceUtils.isNative()) {
                const appVersion = App.PlatformApiMgr.getAppVersion();
                versionStr += ` (App: ${appVersion})`;
            }
        } else {
            // 如果没有热更新版本，显示资源版本作为后备
            const appVersion = App.DeviceUtils.isNative()
                ? `(${App.PlatformApiMgr.getAppVersion()})`
                : "";
            versionStr = `${Config.resVersion}${appVersion}`;
        }
        
        this.versionLabel.string = `Version ${versionStr}`;
    }

    /** 音乐开关 */
    onChangeMusic(toggle: Toggle) {
        App.AudioManager.playBtnClick2();
        App.AudioManager.setBgmVolume(toggle.isChecked ? 1 : 0);
    }

    /** 音效开关 */
    onChangeSounds(toggle: Toggle) {
        App.AudioManager.playBtnClick2();
        App.AudioManager.setEffVolume(toggle.isChecked ? 1 : 0);
    }

    /** 更新绑定状态按钮显示 */
    updateBindBtns() {
        let bBind = !App.userData().isGuest;
        this.phoneBindBtn.interactable = !bBind;
        const bindIndicator = this.phoneBindBtn.node.getChildByName("isbind");
        if (bindIndicator) bindIndicator.active = bBind;
    }

    onDestroy() {
    }

    onClickPre(event: Event, prefabPath: string) {
        try {
            prefabPath = prefabPath.replace(/\\/g, '/');
            App.PopUpManager.addPopup(prefabPath, 'hall', null, true);
        } catch (err) {
            console.error(`❌ 弹窗调用出错 (${prefabPath}):`, err);
        }
    }
}
