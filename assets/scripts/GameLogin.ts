import { _decorator, Component, EditBox, Node } from 'cc';
import { App } from 'db://assets/scripts/App';
import { Config } from 'db://assets/scripts/config/Config';
const { ccclass, property } = _decorator;

@ccclass('GameLogin')
export class GameLogin extends Component {

    start() {

    }

    update(deltaTime: number) {

    }


    onClickLogin() {
        App.PopUpManager.addPopup("login/prefabs/phoneLogin");
    }


    async onClickGuest() {
        try {
            const pregisterSlots = await App.ApiManager.registerSlots();
            let localNickname = pregisterSlots.guestUserName;
            App.StorageUtils.saveLocal('nick_name', localNickname);

            var guestTokenCfg = App.StorageUtils.getLocal(App.StorageKey.SAVE_PLAYER_TOKEN, '');
            var guestTokenMap = guestTokenCfg.length > 0 ? JSON.parse(guestTokenCfg) : {};
            var playerData = guestTokenMap[localNickname];
            let token = playerData ? playerData.token : null;
            if (!token || token.length <= 0) {
                token = (new Date()).getTime() + '_' + App.MathUtils.random(1, 99999999);
                guestTokenMap[localNickname] = { token: token };
                App.StorageUtils.saveLocal(App.StorageKey.SAVE_PLAYER_TOKEN, JSON.stringify(guestTokenMap));
            }

            const pguestLogin = await App.ApiManager.guestLogin(localNickname);
            console.log('游客自动登陆')
            App.GameManager.login(localNickname, "5LYW2waQytc3mW5", Config.LoginType.PHONE, '', Config.LoginExData.loginAction, token);
        } catch (e) {
            console.warn(e);
        }
    }
}


