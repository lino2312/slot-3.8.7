import { _decorator, Component, Node, Sprite, Button, Prefab, instantiate, tween, native, SpriteAtlas, SpriteFrame, assetManager, Texture2D, isValid, loader } from 'cc';
import { App } from 'db://assets/scripts/App';
import md5 from 'md5';
const { ccclass, property } = _decorator;

@ccclass('HeadComponent')
export class HeadComponent extends Component {
    @property(Sprite)
    headSprite: Sprite = null;
    @property(Sprite)
    avatarFrameSprite: Sprite = null;
    // @property(sp.Skeleton)
    // spine_headFrame: sp.Skeleton = null;
    @property({ tooltip: '是否按钮' })
    isButton: boolean = false;

    private uid: number = 0;
    private strIcon: string = '';

    onLoad() {
        App.EventUtils.on(App.EventID.REFRESH_PLAYER_HEAD, this.onRcvEventRefeshHead,this);
        if (this.isButton) {
            const button = this.node.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, this.onClickButton, this);
            }
        }
        // this.onRcvEventRefeshHead(App.userData())
    }

    onDestroy() {
        App.EventUtils.offTarget(this);
    }

    onRcvEventRefeshHead(user) {
        if (user && user.uid && user.usericon && this.uid == user.uid) {
            this.setHead(user.uid, user.usericon);
        }
    }

    setHead(uid: number, strIcon: string) {
        if (!strIcon) { this.reset(); return; }
        if (strIcon == this.strIcon) {
            return;
        }
        this.strIcon = strIcon;
        if (App.MathUtils.isRealNum(strIcon)) {
            App.ComponentUtils.setHeadFrame(this.headSprite, Number(strIcon));
        } else {
            this.loadHeadImageRemote(strIcon);
        }
    }

    setAvatarFrame(bgIdx: string) {
        if (this.avatarFrameSprite) {
            App.ComponentUtils.setAvatarFrame(this.avatarFrameSprite, bgIdx);
        }
    }

    reset(callback?: () => void) {
        App.ComponentUtils.setHeadFrame(this.headSprite, 1, callback);
    }

    setHeadGray() {
        App.ComponentUtils.showSpriteGray(this.headSprite, true);
    }

    onClickButton() {
        // let url = 'preafabs/popup/popupPersonalInfo';
        // App.PopUpManager.addPopup(url);
    }

    onClickButton2() {
        if (!this.isButton) {
            return;
        }
        let prefabPath = 'prefabs/UserInfo/PopupPersonalInfo';
        App.AudioManager.playBtnClick();
        try {
            App.PopUpManager.addPopup(prefabPath, 'hall', null, true);
        } catch (err) {
            console.error(`❌ 弹窗调用出错 (${prefabPath}):`, err);
        }
    }

    loadHeadImageRemote(pathfile, callback = null) {
        let fileUrl = pathfile;
        if (!fileUrl.includes('http')) {
            fileUrl = pathfile.startsWith('file://') ? pathfile : 'file://' + pathfile;
        }
        assetManager.loadRemote(fileUrl, { ext: '.jpg' }, (err, texture: Texture2D) => {
            if (err) {
                console.warn('图片加载失败:', err);
                if (callback) callback();
                return;
            }
            if (texture) {
                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                this.headSprite.spriteFrame = spriteFrame;
            }
            if (callback) callback();
        });
    }
}


