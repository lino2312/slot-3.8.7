import { sys } from "cc";

export class StringUtils {
    //整数补0   传入8，需要的字符长度为3，调用方法后字符串结果为：008
    static prefixInteger(num: number, length: number): string {
        return (Array(length).join('0') + num).slice(-length);
    }

    static uint8ArrayToString(array: string | any[]) {
        var out: string;
        var i: number;
        var len: number;
        var c: number;
        var char2: number;
        var char3: number;

        out = "";
        len = array.length;
        i = 0;
        while (i < len) {
            c = array[i++];
            switch (c >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12:
                case 13:
                    // 110x xxxx   10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
                    break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0));
                    break;
            }
        }

        return out;
    }

    // 函数padLeftZero的作用：如果月份为1位(如9),则在其左边补0(变为09)
    static padLeftZero(str: string) {
        return "0" + str.substr(str.length - 1)
    }

    /*
    ** string转化成Bytes
    */
    static stringToBytes(str: string) {
        var ch: number, re = [];
        for (var i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);  // get char
            var st = [];
            do {
                st.push(ch & 0xFF);  // push byte to stack  
                ch = ch >> 8;          // shift value down by 1 byte  
            }
            while (ch);
            // add stack contents to result  
            // done because chars have "wrong" endianness
            re = re.concat(st.reverse());
        }
        // return an array of bytes  
        return re;
    }

    static webCopyString(str: string) {
        if (sys.isNative) return;
        if (window["ClipboardJS"] && window["ClipboardJS"].copy) {
            window["ClipboardJS"].copy(str);
            return;
        }
        var input = str;
        const el = document.createElement('textarea');
        el.value = input;
        el.setAttribute('readonly', '');
        el.style.contain = 'strict';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.fontSize = '12pt'; // Prevent zooming on iOS
        const selection = getSelection();
        let originalRange: Range | null = null;
        if (selection.rangeCount > 0) {
            originalRange = selection.getRangeAt(0);
        }
        document.body.appendChild(el);
        el.select();
        el.selectionStart = 0;
        el.selectionEnd = input.length;
        var success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) { }
        document.body.removeChild(el);
        if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }
        // cc.log('复制', str, success);
        return success;
    }
    // 字符串打码
    static strConfuse(str) {
        if (str.length < 2) {
            return str;
        } if (str.length < 5) {
            let list = str.split("");
            list[1] = "*";
            return list.join("");
        } else {
            let list = str.split("")
            for (let i = 2; i < list.length - 2; i++) {
                list[i] = "*";
            }
            return list.join("");
        }
    }


    static isArabic(text: string) {
        let UNICODE = "ﺁﺁﺂﺂﺃﺃﺄﺄﺅﺅﺆﺆﺇﺇﺈﺈﺉﺋﺌﺊﺍﺍﺎﺎﺏﺑﺒﺐﺓﺓﺔﺔﺕﺗﺘﺖﺙﺛﺜﺚﺝﺟﺠﺞﺡﺣﺤﺢﺥﺧﺨﺦﺩﺩﺪﺪﺫﺫﺬﺬﺭﺭﺮﺮﺯﺯﺰﺰﺱﺳﺴﺲﺵﺷﺸﺶﺹﺻﺼﺺﺽﺿﻀﺾﻁﻃﻄﻂﻅﻇﻈﻆﻉﻋﻌﻊﻍﻏﻐﻎﻑﻓﻔﻒﻕﻗﻘﻖﻙﻛﻜﻚﻝﻟﻠﻞﻡﻣﻤﻢﻥﻧﻨﻦﻩﻫﻬﻪﻭﻭﻮﻮﻯﻯﻰﻰﻱﻳﻴﻲﻵﻵﻶﻶﻷﻷﻸﻸﻹﻹﻺﻺﻻﻻﻼﻼ";
        // All Arabic letters, harakat and symbols
        let ARABIC = "ًٌٍَُِّْْئءؤرلاىةوزظشسيبلاتنمكطضصثقفغعهخحجدذْلآآلأأـلإإ،؟";
        if (text.length === 1) {
            const char = text;
            if (
                UNICODE.indexOf(char) >= 0 ||
                ARABIC.indexOf(char) >= 0
            ) {
                return true;
            }

            return false;
        }
        const chars = text.split("");
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            if (
                UNICODE.indexOf(char) >= 0 ||
                ARABIC.indexOf(char) >= 0
            ) {
                return true;
            }
        }
        return false;
    }

    // 判断是否包含表情
    static isEmoji(substring: string) {
        for (var i = 0; i < substring.length; i++) {
            var hs = substring.charCodeAt(i)
            if (hs >= 0xd800 && hs <= 0xdbff) {
                if (substring.length > 1) {
                    var ls = substring.charCodeAt(i + 1)
                    var uc = ((hs - 0xd800) * 0x400) + (ls - 0xdc00) + 0x10000
                    if (uc >= 0x1d000 && uc <= 0x1f77f) {
                        return true
                    }
                }
            } else if (substring.length > 1) {
                var a = substring.charCodeAt(i + 1)
                if (a === 0x20e3) {
                    return true
                }
            } else {
                if (hs >= 0x2100 && hs <= 0x27ff) {
                    return true
                } else if (hs >= 0x2B05 && hs <= 0x2b07) {
                    return true
                } else if (hs >= 0x2934 && hs <= 0x2935) {
                    return true
                } else if (hs >= 0x3297 && hs <= 0x3299) {
                    return true
                } else if (hs === 0xa9 || hs === 0xae || hs === 0x303d || hs === 0x3030 ||
                    hs === 0x2b55 || hs === 0x2b1c || hs === 0x2b1b ||
                    hs === 0x2b50) {
                    return true
                }
            }
        }
    }
}