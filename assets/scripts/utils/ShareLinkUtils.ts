import { Config } from '../config/Config';
import { App } from '../App';
import { resources, Prefab, instantiate, director, Vec3 } from 'cc';
export class ShareLinkUtils {
    //FB链接分享
    //linkUrl:点击跳转的url
    //strContent:文字内容即引文
    static ShareLink = function (linkUrl: string, strContent: string) {
        //fb
        if (Config.openFacebookLogin && App.playerData().logintype === Config.LoginType.FB) {
            var shareData: any = {}
            shareData.shareType = 1 //链接分享
            shareData.linkUrl = linkUrl
            shareData.content = strContent || ""
            App.PlatformApiMgr.SdkShare(JSON.stringify(shareData))
        } else {
            resources.load("prefab/UIShare", Prefab, function (err, prefab) {
                if (err) {
                    console.warn("Failed to load prefab/UIShare:", err);
                    return;
                }
                var newNode = instantiate(prefab);
                // Assuming UIGuestShare is a script/class with setQRCodeUrl method
                // Import or define the type if available
                // import { UIGuestShare } from 'path-to-uiguestshare';
                const script = newNode.getComponent('UIGuestShare') as any;
                if (script && typeof script.setQRCodeUrl === 'function') {
                    script.setQRCodeUrl(linkUrl)
                }
                // Convert Vec2 to Vec3 for position assignment
                newNode.position = new Vec3(Config.centerPos.x, Config.centerPos.y, 0);
                director.getScene().addChild(newNode);
            });
        }


    }
}