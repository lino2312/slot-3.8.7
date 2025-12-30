
const win = window as any;

export const languages = {
    label_text: {
        hello: 'hello',
        bye: 'bye!',
        tips: 'tips',
        cancel: 'cancel',
        confirm: 'confirm',
        login: 'Login',
        resetLoginPwd: 'Reset Login Password',
        addCash: 'Add Cash',
        withdrawInstantly: 'Withdraw Instantly',
        transferNow: 'Transfer Now',
        transferTips: 'Tips: Withdrawable Balance = Winning Balance',
        cashTransfer: 'Cash Transfer',
    },
};

if (!win.languages) {
    win.languages = {};
}

win.languages.en = languages;
