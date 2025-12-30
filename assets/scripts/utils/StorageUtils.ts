import { sys } from 'cc';
import { CommonUtils } from './CommonUtils';
export class StorageUtils {
    //保存String数据到本地
    static saveLocal(key: string, str: string) {
        key += '';
        str += '';
        sys.localStorage.setItem(CommonUtils.compile(key),CommonUtils. compile(str));
    }

    //从本地获取String数据
    static getLocal(key: string, defaultStr = ''): string {
        key += '';
        let str = sys.localStorage.getItem(CommonUtils.compile(key));
        if (str) str = CommonUtils.uncompile(str);
        if (!str || str.length <= 0) {
            str = defaultStr;
        }
        return str;
    }

    //删除本地数据
    static deleteLocal(key: string) {
        key += '';
        sys.localStorage.removeItem(CommonUtils.compile(key));
    }

    //清除所有本地数据
    static clearLocal() {
        sys.localStorage.clear();
    }
}