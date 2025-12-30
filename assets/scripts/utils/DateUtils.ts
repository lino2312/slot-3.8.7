import { Config } from "../config/Config";

export class DateUtils {
    //获取当前时间戳，单位秒
    static getTimeStamp(): number {
        return Math.floor(new Date().getTime() / 1000);
    }

    // 获取时间字符串 
    static getTimeStr(time: number, showTimeOnly = false, jointStr = ' ') {
        const date = new Date(time * 1000);
        const year = date.getFullYear();
        let month: string | number = date.getMonth() + 1;
        if (month < 10) month = '0' + month;
        let day: string | number = date.getDate();
        if (day < 10) day = '0' + day;
        let hour: string | number = date.getHours();
        if (hour < 10) hour = '0' + hour;
        let minutes: string | number = date.getMinutes();
        if (minutes < 10) minutes = '0' + minutes;
        let seconds: string | number = date.getSeconds();
        if (seconds < 10) seconds = '0' + seconds;

        if (showTimeOnly) {
            return `${hour}:${minutes}:${seconds}`;
        } else {
            if (Config.language === 'en') {
                return `${day}/${month}/${year}${jointStr}${hour}:${minutes}:${seconds}`;
            } else {
                return `${month}/${day}/${year}${jointStr}${hour}:${minutes}:${seconds}`;
            }
        }
    }

    // 09-26 14:50
    static getSimpleTimeStr(time: number) {
        var date = new Date(time * 1000)

        var month: string | number = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month
        }
        var day: string | number = date.getDate();
        if (day < 10) {
            day = '0' + day
        }

        var hour: string | number = date.getHours();
        if (hour < 10) {
            hour = '0' + hour
        }
        var minutes: string | number = date.getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes
        }
        return month + "-" + day + " " + hour + ":" + minutes
    }

    //2022-09-06
    static getFullDateStr(time: number) {
        var date = new Date(time * 1000)
        var year = date.getFullYear();
        var month: string | number = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month
        }
        var day: string | number = date.getDate();
        if (day < 10) {
            day = '0' + day
        }
        if (Config.language == 'en') {
            return day + "-" + month + '-' + year
        }
        else {
            return year + "-" + month + '-' + day
        }
    }

    // 06/09
    static getDateStrNoYear(time: number) {
        var date = new Date(time * 1000);
        var month: string | number = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month
        }
        var day: string | number = date.getDate();
        if (day < 10) {
            day = '0' + day
        }

        return month + "." + day;
    }

    // 获取日期 
    static getDateStr(time: number) {
        var date = new Date(time * 1000)
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day: string | number = date.getDate();
        if (day < 10) {
            day = '0' + day
        }

        return month + '-' + day
    }
}