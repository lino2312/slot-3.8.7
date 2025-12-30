import { add } from "../../../extensions/i18n/@types/editor/utils/source/math";

const win = window as any;

export const languages = {
    label_text: {
        hello: '你好！',
        bye: '再见！',
        tips: 'tips',
        cancel: '取消',
        confirm: 'confirm',
        login: '登录',
        resetLoginPwd: '重置登录密码',
        addCash: '充值',
        withdrawInstantly: '立即提现',
        transferNow: '立即转账',
        transferTips: '提示：可提现余额=中奖余额',
        cashTransfer: '现金转账',
    },
};

if (!win.languages) {
    win.languages = {};
}

win.languages.zh = languages;
