import { Size, Vec3 } from 'cc';

interface AppVersion {
    app_version: {
        version: string,
        url: string,
        forceUpdate: boolean,
        forceUpdateUrl: string,
        forceUpdateVersion: string,
    },
};

export const Config = {
    registerAndLogin: "Login", //这什么东西？

    localVersion: true,
    publishMode: true,
    openUpdate: true,
    openAutoLogin: true,
    isReview: false,
    isAndroidReview: false,
    appId: 17,
    resVersion: '1.1.2.188',
    appVersion: '1.2.6', //app版本号
    designSize: new Size(1920, 1080),
    centerPos: new Vec3(960, 540, 0),
    poly99: true,
    language: "en",
    haoUrl: "",
    PID_CFG: null as any, //PID配置,各自项目配置
    isSingleVersion: false,
    // gameChannel: "D105", //游戏渠道号
    gameChannel: "test", //游戏渠道号

    otpurl: "https://api.fastpay11.com/sms/dosend",
    loginServerAddress: "login.fastpay10.com",
    domainurl: "fastpay01.com",
    reqUrl: "https://ycapi.fastpay10.com",
    nativeVersion: "1.0.0",
    hotupdateBaseUrl: "https://update.fastpay11.com/GameXVersion3",
    up_type: 1, // 1: 热更新 2: 强制更新
    hotupdate_version: '1.0.0', //app热更新版本
    openFacebookLogin: false,

    //游戏默认方向
    APP_ORIENTATION: 'portrait',
    //大厅金币节点路径
    HALL_TOPCOIN_PATH: 'Canvas/top/coin_bg', //金币节点
    HALL_COIN_NODE_PATH: 'Canvas/top/coin_bg/spr_coin', //金币精灵节点
    HALL_COIN_LABEL_NODE_PATH: 'Canvas/top/coin_bg/lbl_coin', //金币数字label
    INGAME_COIN_LABEL_NODE_PATH: 'Canvas/safe_node/LMSlots_Top/playerCoins/lbl_coinsNum', //游戏内金币数字
    INGAME_COIN_NODE_PATH: 'Canvas/safe_node/LMSlots_Top/playerCoins/icon_coin', //游戏内金币

    SLOT_GAME_SPEED: 1,


    QUEST_REWARD: 3500000,
    ChatType: {
        TXT: 0,
        EMOJI: 1,
        VOICE: 2,
        TXT_EFF: 3,
    },

    LoginType: {
        Guest: 1,
        WX: 2,
        ACCOUNT: 4,
        REGISTER: 5,
        TOKEN: 6,
        APILOGIN: 7,
        GOOGLE_LOGIN: 10,
        APPLE_LOGIN: 11,
        FB: 12,
        HUAWEI: 13,
        PHONE: 9,
    },

    APPID: {
        BigBang: 1,
        Poly: 4,
        SouthAmerica: 6,
        Indian: 7,
        HuaweiDRM: 8,
        Baloot: 9,
        Baloot_HW: 11,
        PokerHero: 12,
        PokerHero_HW: 13,
        PokerHero_Durak_HW: 14,
        PokerHero_HW_CardMaster: 18,
        YonoGames: 17,
        TestCashHero: 10,
        TestPokerHero: 100,
    },

    LANGUAGE: {
        EN: 'en',
        ZH: 'zh',
        IDA: 'ida',
        AR: 'ar',
    },

    LoginExData: {
        loginAction: 1,
        reloginAction: 2,
    },

    ERROR_CODE: {
        NORMAL: 200,
    },

    CONST_NUM: {
        HIGHT_ZORDER: 100,
    },

    PROP_ID: {
        COIN: 1,
        VIP_POINT: 2,
        DOUBLE_LEVEL_EXP: 3,
        DOUBLE_LEVEL_REWARD: 4,
        TURN_TABLE: 5,
        ACTIVITY: 6,
        MISSION: 7,
        HERO_CARD: 8,
        HERO_FRAGEMENT: 26,
        LUCKY_RESTART: 9,
        RICH_POINT: 10,
        ACTIVITY_DAILY: 11,
        ACTIVITY_WEEKLY: 12,
        GLOD_HUMER: 13,
        BINGO_BALL: 16,
        LUCKY_BOM: 20,
        FULL_CARD: 21,
        EXPLORE_DICE: 22,
        DIAMOND: 25,
        HEROCARD_EXP: 27,
        PVP_TICKET: 28,
        DOUBLE_LEVEL_EXP_AR: 29,
        EXPRESS_GIFT_CAR: 31,
        EXPRESS_GIFT_EVIL: 32,
        EXPRESS_GIFT_DRINK: 33,
        EXPRESS_GIFT_KISS: 34,
        EXPRESS_GIFT_MONEY: 35,
        EXPRESS_GIFT_CAKE: 36,
        EXPRESS_GIFT_RING: 37,
        EXPRESS_GIFT_TOWER: 38,
        LOCAL_FULL_CARD: 10021,
        LOCAL_HERO_CARD: 10008,
    },

    ITEMCFG: {
        1: { name: 'COIN' },
        2: { name: 'VIP POINTS' },
        3: { name: 'DOUBLE EXP' },
        8: { name: 'HERO PACKS' },
        9: { name: 'LUCKY CARDS' },
        10: { name: 'HERO PALACE' }
    },

    SOUNDS: {
        bgm_hall: { path: 'CashHero/', filename: 'hall/bgm_hall', common: true },
        bgm_hall_slots: { path: 'CashHero/', filename: 'hall/bgm_hall_slots', common: true },
        bgm_hall_club: { path: 'CashHero/', filename: 'hall/bgm_hall_club', common: true },
        bgm_herocard: { path: 'CashHero/', filename: 'hall/hero_bgm', common: true },
        bgm_quest: { path: 'CashHero/', filename: 'quest/bgm_quest', common: true },
        bgm_login: { path: 'CashHero/', filename: 'hall/LobbyMailBgm', common: true },
        game_loading: { path: 'CashHero/', filename: 'hall/game_loading', common: true },
        sound_fly_coins: { path: 'CashHero/', filename: 'CoinBalanceComplete', common: true },
        bgm_poker_2nd: { path: 'CashHero/', filename: 'hall/LobbyWheelBgm', common: true },
        bgm_luckycard: { path: 'CashHero/', filename: 'luckycard/bgm', common: true },
        bgm_battle: { path: 'CashHero/', filename: 'pvp/bgm_battle', common: true },
        sound_celebration: { path: 'CashHero/', filename: 'hall/celebration', common: true },
        sound_scratch: { path: 'CashHero/', filename: 'hall/scratch', common: true },
        sound_pick: { path: 'CashHero/', filename: 'hall/pick_open', common: true },
        sound_level_up: { path: 'CashHero/', filename: 'hall/levelup_collect', common: true },
        bgm_hall_wheel: { path: 'CashHero/', filename: 'hall/LobbyWheelBgm', common: true },
        sound_wheel_spin: { path: 'CashHero/', filename: 'hall/wheel_spin', common: true },
        sound_wheel_result: { path: 'CashHero/', filename: 'hall/wheel_result', common: true },
        sound_wheel_pointer: { path: 'CashHero/', filename: 'hall/wheel_pointer', common: true },
        sound_click: { path: 'CashHero/', filename: 'hall/TabClick', common: true },
    },

    //场景名称定义
    SCENE_NAME: {
        LAUNCH: 'Launch',						//启动场景
        LOGIN: 'Login',						    //登陆场景
        HALL_PRELOAD: 'HallPreload', 	            //大厅加载
        HALL: 'Hall',							//大厅场景
        CHANGE_LANGUAGE: 'ChangeLanguage',			//切换语言中间场景
    },

    //系统开放等级
    SYS_OPEN: {
        GUIDE_CHANGEBET: 3,	//3级引导修改押注额度
        QUEST_TASK: 4,
        PIG_BANK: 8,
        PIG_BANK_FREEBUY: 20, //金猪免费送
        FRIEND: 1500,	//好友
        HERO_CARD: 12,	//卡牌系统开放12
        LUCKY_SMASH: 16, //砸金蛋16级
        BINGO: 10,		//bingo10级
        DAILYTASK: 5,	//日常任务5
        LUCKY_CARD: 25,	//幸运抽卡25。需要在卡牌系统之后开
        HERO_PALACE: 1, //富豪厅1
    },

    //商品定义
    SHOP_POS_ID: {
        HALL: 1, //大厅
        GAME: 2, //游戏内
        PERSONALINFO: 2,     //个人信息
        NOENOUGHMONEY: 2,    //钱不够
        MULTIPLAYERS: 3,     //大厅二级大厅
    }
}

const ENV_CONFIG = {
    test: {
        loginServerAddress: "login.fastpay10.com",
        domainurl: "fastpay11.com",
        reqUrl: "https://ycapi.fastpay10.com",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXVersion3",
        currency: "",
        phoneNumber: "91",
    },

    D101: {
        loginServerAddress: "login.fastpay20.com",
        domainurl: "fastpay20.com",
        reqUrl: "https://d101lotteryapi.fastpay20.com",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXdemo1V3",
        currency: "",
        phoneNumber: "63",
    },

    D102: {
        loginServerAddress: "login.fastpay21.com",
        domainurl: "fastpay21.com",
        reqUrl: "https://demo2api.fastpay21.com",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXdemo2V3",
        currency: "",
        phoneNumber: "91",
    },

    D105: {
        loginServerAddress: "login.migame66.com",
        domainurl: "migame.win",
        reqUrl: "https://lotteryapi.migame66.com",
        hotupdateBaseUrl: "https://updateaws.fastpay11.com/GameXd105V3",
        currency: "",
        phoneNumber: "91",
    },

    D106: {
        loginServerAddress: "login.swerteplay0001.com",
        domainurl: "swerteplay0001.com",
        reqUrl: "https://lotteryapi.swerteplay0001.com",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXd106V3",
        currency: "",
        phoneNumber: "91",
    },

    D107: {
        loginServerAddress: "login.jgoab0yjq8.com",
        domainurl: "jgoab0yjq8.com",
        reqUrl: "https://lotteryapi.jgoab0yjq8.com",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXd107V3",
        currency: "",
        phoneNumber: "91",
    },

    D108: {
        loginServerAddress: "login.yonohot.vip",
        domainurl: "yonohot.com",
        reqUrl: "https://lotteryapi.yonohot.top",
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXd108V3",
        currency: "",
        phoneNumber: "91",
    },
};

const env = ENV_CONFIG[Config.gameChannel];
if (env) {
    Object.assign(Config, env);
}

