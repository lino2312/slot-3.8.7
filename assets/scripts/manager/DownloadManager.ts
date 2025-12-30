import { native } from "cc";
import { App } from "../App";
import md5 from 'md5';

export class DownloadManager {
    private static _instance: DownloadManager = null;
    public static getInstance(): DownloadManager {
        if (!this._instance) {
            this._instance = new DownloadManager();
        }
        return this._instance;
    }

    private downloadedList = []; // 已下载列表
    private downloadingList = []; // 下载中列表
    private downloadFailList = []; // 下载失败列表


    // 移除监听
    removeObserver(observer: any, url?: string) {
        if (url) {
            for (let i = this.downloadingList.length - 1; i >= 0; i--) {
                let item = this.downloadingList[i];
                if (item.url == url) {
                    let observers = item.observers;
                    let index = observers.indexOf(observer);
                    if (index > -1) {
                        observers.splice(index, 1);
                        if (observers.length <= 0) {
                            this.downloadingList.splice(i, 1);
                        }
                    }
                    break;
                }
            }
        } else {
            for (let i = this.downloadingList.length - 1; i >= 0; i--) {
                let observers = this.downloadingList[i].observers;
                let index = observers.indexOf(observer);
                if (index > -1) {
                    observers.splice(index, 1);
                    if (observers.length <= 0) {
                        this.downloadingList.splice(i, 1);
                    }
                }
            }
        }
    }

    // 是否已经下载过
    checkDownloaded(url: string) {
        url = url.trim();
        return (this.downloadedList.indexOf(url) > -1 || this.downloadFailList.indexOf(url) > -1);
    }

    // 下载
    download(observer: any, uid: number, url: string) {
        url = url.trim();
        let exist = false;
        for (let item of this.downloadingList) {
            if (item.url == url) {
                exist = true;
                if (item.observers.indexOf(observer) < 0) {
                    item.observers.push(observer);
                }
            }
        }
        if (!exist) {
            let item = { uid, url, observers: [observer] };
            this.downloadingList.push(item);
            this.downloadImage(uid, url);
        }
    }

    downloadImmediate(uid: number, url: string) {
        this.downloadImage(uid, url);
    }

    private onDownloadSucc(url: string) {
        for (let i = this.downloadingList.length - 1; i >= 0; i--) {
            let item = this.downloadingList[i];
            if (item.url == url) {
                for (let observer of item.observers) {
                    observer.onDownloaded(true, item.uid, item.url);
                }
                this.downloadingList.splice(i, 1);
                break;
            }
        }
        console.log("download succ: " + url);
    }

    private onDownloadFail(url: string) {
        for (let i = this.downloadingList.length - 1; i >= 0; i--) {
            let item = this.downloadingList[i];
            if (item.url == url) {
                for (let observer of item.observers) {
                    observer.onDownloaded(false, item.uid, item.url);
                }
                this.downloadingList.splice(i, 1);
                if (this.downloadFailList.indexOf(url) < 0) {
                    this.downloadFailList.push(url);
                }
                break;
            }
        }
        console.log("download fail: " + url);
    }

    private downloadImage(uid: number, url: string, redircturl?: string) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", redircturl || url, true);
        xhr.timeout = 15000;
        xhr.responseType = 'arraybuffer';
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if ((xhr.status >= 200 && xhr.status < 300)) {
                    if (typeof xhr.response !== 'undefined') {
                        if (this.saveFile(uid, url, xhr.response)) {
                            if (this.downloadedList.indexOf(url) < 0) {
                                this.downloadedList.push(url);
                            }
                            this.onDownloadSucc(url);
                        } else {
                            console.log("save image file fail:" + url);
                            this.onDownloadFail(url);
                        }
                    } else {
                        console.log("download image is null:" + url);
                        this.onDownloadFail(url);
                    }
                } else if ((xhr.status >= 300 && xhr.status <= 303) || xhr.status == 307) {
                    let location = xhr.getResponseHeader("Location");
                    if (location) {
                        console.log("redirect location: " + location);
                        this.downloadImage(uid, url, location);
                    } else {
                        console.log("download image fail:" + url);
                        this.onDownloadFail(url);
                    }
                } else {
                    console.log("download image fail:" + url);
                    this.onDownloadFail(url);
                }
            }
        };
        xhr.ontimeout = () => {
            this.onDownloadFail(url);
            console.log("download image timeout:" + url);
        };
        xhr.onerror = () => {
            this.onDownloadFail(url);
            console.log("download image error:" + url);
        };
        xhr.send();
    }

    private saveFile(uid: number, url: string, data: ArrayBuffer): boolean {
        if (App.DeviceUtils.isNative() && native && native.fileUtils) {
            let path = native.fileUtils.getWritablePath() + 'headimgs/';
            let pathfile = path + md5(url) + ".jpg";
            console.log("save file", pathfile);
            if (!native.fileUtils.isDirectoryExist(path)) {
                native.fileUtils.createDirectory(path);
            }
            if (typeof data !== 'undefined') {
                if (native.fileUtils.writeDataToFile(new Uint8Array(data), pathfile)) {
                    return true;
                }
            }
        }
        return false;
    }
}