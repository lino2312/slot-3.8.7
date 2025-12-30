import { _decorator, Component, Node, EditBox, Sprite, SpriteFrame, ImageAsset, Texture2D, native } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('RecordFeedback')
export class RecordFeedback extends Component {
    @property(EditBox) UTRnum: EditBox = null!;
    @property(Sprite) UserProof: Sprite = null!;
    @property(EditBox) MobileNum: EditBox = null!;

    private uploadedProofUrl: string = '';
    private rechargeNumber: string = '';

    public setParams(rechargeNumber: string) {
        if (!rechargeNumber) return;
        this.rechargeNumber = rechargeNumber;
    }

    onLoad() {
        App.PlatformApiMgr.onImagePicked = (filePath: string) => {
            console.log('Image picked:', filePath);
            this.processImageData(filePath);
        };
        App.PlatformApiMgr.onImageCancel = () => {
            console.log('User cancelled image selection');
            App.AlertManager.showFloatTip('Image selection cancelled');
        };
    }

    onDestroy() {
        App.PlatformApiMgr.onImagePicked = null;
        App.PlatformApiMgr.onImageCancel = null;
    }

    private init() {

    }

    async upLoadImageFile() {
        if (App.DeviceUtils.isBrowser()) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.onchange = (e: any) => {
                const file: File | undefined = e?.target?.files?.[0];
                this.processImageFile(file as File);
            };
            document.body.appendChild(input);
            input.click();
            // 移除 input 节点
            setTimeout(() => {
                document.body.removeChild(input);
            }, 0);
        } else if (App.DeviceUtils.isNative()) {
            App.PlatformApiMgr.pickImageFromGallery((err: any, filePath: string) => {
                if (err || !filePath) {
                    App.AlertManager.showFloatTip('Image selection cancelled');
                    return;
                }
                console.log('Image picked (filePath):', filePath);
                this.processImageData(filePath);
            });
        }
    }

    private processImageFile(file?: File) {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            App.AlertManager.getCommonAlert().showWithoutCancel('Image size should be less than 5MB');
            return;
        }

        // 预览
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const base64 = event?.target?.result as string;
            if (base64) this.createTextureFromBase64(base64);
        };
        reader.readAsDataURL(file);

        // 上传
        App.ApiManager.getUploadImage(file).then((data: any) => {
            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                this.uploadedProofUrl = item.ossHttp + '/' + item.src;
                console.log('Final image URL:', this.uploadedProofUrl);
            } else {
                App.AlertManager.showFloatTip('Upload failed. Invalid server response.')
            }
        });
    }

    private async processImageData(filePath: string) {
        const vv = (globalThis as any).cc?.vv;
        if (!filePath) {
            console.error('No valid image path provided.');
            return;
        }

        // 大小校验（native）
        try {
            const fileSize = native.fileUtils?.getFileSize?.(filePath);
            console.log('File size:', fileSize, 'bytes');
            if (fileSize && fileSize > 5 * 1024 * 1024) {
                App.AlertManager.getCommonAlert().showWithoutCancel('Image size should be less than 5MB');
                return;
            }
        } catch {
            // 忽略无法获取大小的情况
        }

        try {
            App.ApiManager.getUploadImage(filePath).then((data: any) => {
                if (Array.isArray(data) && data.length > 0) {
                    const item = data[0];
                    this.uploadedProofUrl = item.ossHttp + '/' + item.src;
                    console.log('Final image URL:', this.uploadedProofUrl);
                }
                const url = this.uploadedProofUrl;
                App.ResUtils.getRemoteSpriteFrame(url).then((sf: SpriteFrame | null) => {
                    if (sf) {
                        this.setUserProofFromRes(sf);
                    }
                });
            });
            return;
        } catch (err) {
            console.error('Failed to load preview:', err);
            vv?.AlertView?.showTips?.('Failed to load image');
        }
    }

    private setUserProofFromRes(res: any) {
        if (!this.UserProof) return;

        try {
            if (res instanceof SpriteFrame) {
                this.UserProof.spriteFrame = res;
                return;
            }

            // 如果是 Texture2D
            if (res instanceof Texture2D) {
                const sf = new SpriteFrame();
                sf.texture = res;
                this.UserProof.spriteFrame = sf;
                return;
            }

            // 如果是 ImageAsset 或 HTMLImageElement
            if (res instanceof ImageAsset) {
                const tex = new Texture2D();
                tex.image = res;
                const sf = new SpriteFrame();
                sf.texture = tex;
                this.UserProof.spriteFrame = sf;
                return;
            }

            // 兜底：尝试使用 ImageAsset 构造
            const imgAsset = new ImageAsset(res);
            const tex = new Texture2D();
            tex.image = imgAsset;
            const sf = new SpriteFrame();
            sf.texture = tex;
            this.UserProof.spriteFrame = sf;
        } catch (e) {
            console.warn('setUserProofFromRes failed:', e);
        }
    }

    private createTextureFromBase64(base64String: string) {
        if (!base64String) return;

        const img = new Image();
        img.src = base64String;
        img.onload = () => {
            const imageAsset = new ImageAsset(img);
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            if (this.UserProof) {
                this.UserProof.spriteFrame = spriteFrame;
                console.log('Image successfully set to UserProof.');
            } else {
                console.error('UserProof sprite is not assigned!');
            }
        };
        img.onerror = () => {
            console.error('Failed to load image');
        };
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    onClickHelp() {
        App.PopUpManager.addPopup('prefabs/popup/popupContactUs');
    }

    Submit() {

        const UTR = this.UTRnum?.string?.trim?.() || '';
        const Mobile = this.MobileNum?.string?.trim?.() || '';
        const OrderNo = this.rechargeNumber;
        const ScreenshotUrl = this.uploadedProofUrl;

        if (!UTR) {
            App.AlertManager.showFloatTip('Please enter UTR number');
            return;
        }
        if (!Mobile) {
            App.AlertManager.showFloatTip('Please enter mobile number');
            return;
        }
        if (!ScreenshotUrl) {
            App.AlertManager.showFloatTip('Please upload proof image');
            return;
        }

        App.ApiManager.getCommitRechargeFeedback(UTR, Mobile, OrderNo, ScreenshotUrl).then((ret: any) => {
            if (ret && ret.msg === 'Succeed') {
                App.EventUtils.dispatchEvent('RECHARGE_RECORD_REFRESH')
                App.AlertManager.showFloatTip('Submitted successfully!');
                App.PopUpManager.closePopup(this.node);
            } else {
                App.AlertManager.showFloatTip('Submission failed. Please try again.');
            }
        });
    }
}