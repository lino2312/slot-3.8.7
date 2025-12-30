import { native, sys } from 'cc';
import md5 from 'md5';
import { App } from '../App';
import { Config } from '../config/Config';
export class HttpUtils {
    static reqUrl = Config.reqUrl;
    static hallUrl = this.reqUrl + "/api/webapi/";
    static async sendPostRequest(url: string, additionalParams: any, callback: (err: any, res?: any) => void) {
        url = this.hallUrl + url;
        const random = this.generateRandomString2(32);
        const timestamp = Math.floor(Date.now() / 1000);
        const visitorId = md5(sys.os + sys.platform + sys.browserType + sys.browserVersion);
        const signature = md5(JSON.stringify({ random, timestamp, visitorId, ...additionalParams }));

        let params: any = {
            language: 0,
            random,
            signature,
            timestamp,
            visitorId,
            ...additionalParams
        };

        if (url === this.hallUrl + "registerslots") {
            params.visitorVerfiyCode = "6" + btoa(visitorId + "------" + this.getIp());
        }
        if (url === this.hallUrl + "GetAllGameList" || url === this.hallUrl + "GetThirdGameList" || url === this.hallUrl + "GetBannerList") {
            url += "?cache=true";
        }
        
        let headers: any = { "Content-Type": "application/json;charset=UTF-8" };
        if (App.userData().isLogin) {
            let loginToken = App.StorageUtils.getLocal('loginToken', "");
            let tokenHeader = App.StorageUtils.getLocal('tokenHeader', "");
            headers["Authorization"] = tokenHeader + loginToken;
            if (url === this.hallUrl + "LoginOff") {
                App.StorageUtils.deleteLocal('loginToken');
                App.StorageUtils.deleteLocal('tokenHeader');
                App.StorageUtils.deleteLocal('refreshToken');
                App.userData().isLogin = false;
            }
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(params)
            });
            if (response.status === 200) {
                const text = await response.text();
                // console.log("RAW RESPONSE:", text);

                try {
                    const res = JSON.parse(text);
                    callback(null, res);
                } catch (e) {
                    // console.error("JSON PARSE FAILED:", e);
                    // console.error("BAD RESPONSE FROM SERVER:", text);
                    callback(e);
                }
            } else if (response.status === 401) {
                App.NetManager.close();
                App.AlertManager.getCommonAlert().showWithoutCancel("Please log in again", () => {
                    App.GameManager.goBackLoginScene();
                });

            } else {
                App.AlertManager.getCommonAlert().showWithoutCancel("The app is currently under maintenance and is expected to be completed within 3 hours. Please be patient.");
                callback(new Error("请求失败，状态码：" + response.status));
            }
        } catch (error) {
            App.status.networkConnect = true;
            console.warn("请求发送时出错:", error);
            callback(error);
        }
    }

    // 生成随机字符串的函数
    static generateRandomString() {
        return [...Array(32)].map(() => Math.random().toString(36)[2]).join(''); // 生成 32 位随机数
    }
    static generateRandomString2(length) {
        let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 获取 IP 地址的函数
    static getIp() {
        try {
            if (App.DeviceUtils.isNative()) {
                sys.localStorage.setItem('ARIP', "158.62.17.55");
                return "158.62.17.55"
            }
            return fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    sys.localStorage.setItem('ARIP', data.ip);
                    return data.ip
                })
                .catch(error => {
                    console.warn("获取 IP 地址时出错:", error);
                    return ""; // 返回空字符串以防出错
                });
        } catch (error) {
            sys.localStorage.setItem('ARIP', "158.62.17.55");
            return "158.62.17.55"
        }
    }

    /**
     * 发送 multipart/form-data 文件上传请求
     * @param url 接口路径
     * @param file 浏览器为 File/Blob，原生为文件路径
     * @param callback 回调 (err, res)
     */
    static sendMultipartRequest(url: string, file: any, callback: (err: any, res?: any) => void) {
        if (App.DeviceUtils.isNative()) {
            this.sendMultipartRequestNative(url, file, callback);
        } else {
            this.sendMultipartRequestBrowser(url, file, callback);
        }
    }

    private static sendMultipartRequestBrowser(url: string, file: File | Blob, callback: (err: any, res?: any) => void) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        xhr.open("POST", this.hallUrl + url, true);

        // 添加 token
        if (App.userData().isLogin) {
            let loginToken = App.StorageUtils.getLocal('loginToken', "");
            let tokenHeader = App.StorageUtils.getLocal('tokenHeader', "");
            xhr.setRequestHeader("Authorization", tokenHeader + loginToken);
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        callback(null, JSON.parse(xhr.responseText));
                    } catch (e) {
                        callback(new Error("Invalid JSON: " + xhr.responseText));
                    }
                } else {
                    callback(new Error("Upload failed, status: " + xhr.status));
                }
            }
        };
        xhr.send(formData);
    }

    private static sendMultipartRequestNative(url: string, filePath: string, callback: (err: any, res?: any) => void) {
        const xhr = new XMLHttpRequest();
        const boundary = "----WebKitFormBoundary" + Date.now().toString(16);
        xhr.open("POST", this.hallUrl + url, true);

        if (App.userData().isLogin) {
            let loginToken = App.StorageUtils.getLocal("loginToken", "");
            let tokenHeader = App.StorageUtils.getLocal("tokenHeader", "");
            xhr.setRequestHeader("Authorization", tokenHeader + loginToken);
        }
        xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        callback(null, JSON.parse(xhr.responseText));
                    } catch (e) {
                        callback(new Error("Invalid JSON: " + xhr.responseText));
                    }
                } else {
                    callback(new Error("Upload failed, status: " + xhr.status + ", response: " + xhr.responseText));
                }
            }
        };

        // 读取文件数据
        let fileData = native.fileUtils.getDataFromFile(filePath);
        if (!fileData) {
            callback(new Error("Failed to read file: " + filePath));
            return;
        }
        let filename = filePath.substring(filePath.lastIndexOf("/") + 1);
        if (!/\.(jpe?g|png)$/i.test(filename)) {
            callback(new Error("Invalid file type. Only .jpg, .jpeg, .png are allowed"));
            return;
        }
        function guessMimeType(name: string) {
            if (name.toLowerCase().endsWith(".png")) return "image/png";
            if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg")) return "image/jpeg";
            return "application/octet-stream";
        }
        let mimeType = guessMimeType(filename);
        let bodyHeader =
            "--" + boundary + "\r\n" +
            'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n' +
            "Content-Type: " + mimeType + "\r\n\r\n";
        let bodyFooter = "\r\n--" + boundary + "--\r\n";
        function strToUint8(str: string) {
            let buf = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                buf[i] = str.charCodeAt(i);
            }
            return buf;
        }
        let headerBytes = strToUint8(bodyHeader);
        let footerBytes = strToUint8(bodyFooter);
        let totalLength = headerBytes.length + fileData.byteLength + footerBytes.length;
        let body = new Uint8Array(totalLength);
        body.set(headerBytes, 0);
        body.set(new Uint8Array(fileData), headerBytes.length);
        body.set(footerBytes, headerBytes.length + new Uint8Array(fileData).length);

        try {
            xhr.send(body.buffer);
        } catch (e: any) {
            callback(new Error("Upload failed: " + e.message));
        }
    }
}