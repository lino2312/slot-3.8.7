export const UserData = {
    //=========首次登陆下发的数据=====
    gameServer: '',  //服务端下发的游服地址
    token: '',       //首次登陆的token
    serverId: '',    //服务器id
    subId: '',
    //==============================
    uid: 0,         //用户id
    uid2: 0,        //用户id2
    openid: 0,      //用户openid（第三方id）

    totalcoin: 0,
    dcoin: 0,
    cashbonus: 0,
    dcashbonus: 0,
    bankcoin: 0,
    coin: 0,        //金币
    level: 1,
    userIcon: '',   //头像地址
    sex: 1,         //1男2女
    agent: 0,        //代理等级
    nickName: '',    //昵称
    inviteCode: '', //自己的邀请码
    bindcode: '', //绑定的邀请码
    ip: '192.168.0.1', //玩家的ip
    memo: '', //备注
    onlinestate: 0,      // 在线奖励领取状态
    syotime: 0,          // 倒计时
    lrwardstate: 0,      // 每日奖励领取
    switch: null,        // 运营开关
    showActivity: true, // 弹出活动页面
    //GPS信息
    lat: 0, //纬度
    lng: 0, //经度
    unionid: '',     //微信才有的唯一id,用来微信冷登录

    banktoken: null, //银行token
    bankinfo: {}, //银行信息
    rememberPsw: false,
    gameList: null,  // 有些列表
    isAutoLogin: false,  // 自动登录
    // notice:"",      // 公告
    luckRedvelopesNum: 0,    //幸运红包的个数
    growup: null,    //成长星级
    redenvelop: 0,      // bigbang红包
    // localFavList:null,  //本地的喜爱列表
    areaCode: null,      //http服务器下发的区域代码
    evo: 0,      //是否在casino中

    stampInfo: null,   // 邮票信息

    svip: 0,    //vip等级
    svipexp: 28,    //vip经验
    svipup: 1,  //vip升级经验

    logonTime: 0,
    serverTime: 0,

    bonusList: null, //bonus页面的显示活动

    guides: null,    //已经完成的引导列表

    favoritegames: [], //喜爱列表

    slotsList: [],                 //老虎机游戏

    notEnoughCoinPopList: null, //金币不足的弹框

    activityTipsInGame: false, //游戏内活动提示
    questmaxcoin: 0,//QUEST奖励金币
    dailygift: null,//0:不可领取，1可以领取

    richpoint: 0,  //富豪点

    hallIconSpin: [],

    firstBuyGift: {},  //首充
    diamond: 0,
    noticerewards: 0,//召回奖励金币
    questroundid: 1,//当前第几轮quest
    bingoFrom: 1,// 从哪进入bingo
    popParams: null,//弹窗游戏id
    betData: {},//押注数据
    playedGameIds: [], //玩家玩过的游戏列表

    bonusTab: 0,
    hallRankData: {},//大厅排行数据

    pvpRank: '', //pvp排名
    pvpScore: '', //pvp积分
    pvpCC: '',//pvp战力
    pvpdefendteam: [],
    popupSign: true,
    bankToken: null, //银行token
    bankInfo: {}, //银行信息
    taskNum: 0, //任务红点


    gameNewerGuide: 0,              //游戏玩法需要新手引导

    avatarframe: "avatarframe_1000",     //头像框
    chatskin: "chat_000",          //聊天框
    tableskin: "desk_000",        //牌桌
    pokerskin: 'poker_free',        //牌背
    frontskin: 'font_color_0',       //字体颜色
    emojiskin: 'emoji_0',           //表情包
    faceskin: 'poker_face_000',       //牌花
    salonskin: null,                //沙龙道具
    salontesttime: 0,                //沙龙体验道具时间

    newbiedone: 0,                  //新手任务完成  
    charmpack: 0,                  //新手1000美金大礼包
    tmpvip: 0,                      //是否领取临时VIP
    signrewards: 0,                 //自动签到奖励


    voice: 0,                       //是否打开语聊按钮

    charm: 0,                       //魅力值
    leagueexp: 0,                    //最大排位分
    rp: 0,                          //rp
    country: 0,                      //国籍
    sess: {},                        //房间相关数据

    sharelink: "",                  //FB分享链接
    uploadlink: "",                  //上传头像地址
    rateios: "",                    //IOS的商城页面
    rateandroid: "",                  //Android的商城页面

    club: {} as any,                       //俱乐部信息
    whatapplink: "",                //whatsapp链接
    adtime: null,                   //广告信息
    emojilist: [],                  //所有表情
    verifyfriend: 0,                  //加好友是否需要验证

    contactus: "",                      //联系我们的地址
    feedback: "",                       //反馈的邮件地址

    charmList: [],                  //礼物配置
    charmDataList: [],                  //礼物免费次数

    pinlist: [],                    //好友房间菜单固定gameid
    fgamelist: [],                  //好友房间菜单可选gameid

    moneybag: 0,                    //当前金猪金币数
    // moneybagFull: 0,                //最大金猪金币数
    nextbag: 0,                //最大金猪金币数

    roomcnt: 0,                     //当前开房的数量
    viproomcnt: [],                 //VIP开房配置


    redem: 0,                       //是否开启兑换码功能
    sender: 0,                       //是否开启赠送金币功能
    report: 0,                       //是否开启简易举报功能

    shoptimeout: 0,                       //限时商店是否开启

    fbrewards: [],                   //FB绑定的奖励

    blockuids: [],                   //屏蔽UIDs

    // loginData: null,                // 签到数据

    offlineaward: 0,            //离线奖励金币
    offlinetime: 0,            //距离上次离线时间

    isbindapple: false,             //是否绑定了FB
    isbindfb: false,                //是否绑定了Apple
    isbindgoogle: false,                //是否绑定了google
    isbindhuawei: false,                //是否绑定了华为
    isbindphone: false,                //是否绑定了手机号

    getviplv: [],                //可以获取对应VIP的奖励

    leagueRmindTime: 0,         //联赛剩余时间

    novice: 0,                   //是否领取了改名字新手任务
    slotVoteCountry: 0,                   //老虎机选中的国家

    namerewards: 0,                   //新手改名字奖励

    adpics: 0,                   //广告位配置
    productids: [],                   //拉取本地价格配置

    pinmsg: [],                   //置顶聊天信息

    hasPopNotice: false,         // 是否弹弹窗
    hasPopRewardToday: false,    // 是否弹弹窗

    newapp: null,                   //新版本信息
    bonus_prom: null as any,                //bonus中的促销开关
    appdownloadurl: '',
    vipsign: null,
    rate: 0,
    guide: [],
    reg_bonus_coin: 0,    //注册送的金币数量
    sign_bonus_coin: 0,  //签到送的总金币数量
    bindfbcoin: 0,      //绑定FB送的金币数量
    bindfbdiamond: 0,  //绑定FB送的钻石数量
    newerpack: null as any,      //新手礼包
    upcoin: 0,      //修改昵称需要金币数量
    ispayer: 0, //是否付费用户
    account: '', //账号
    logincoin: 0, //登录奖励
    logintype: 0, //登录类型
    isbindghuawei: 0, //是否绑定huawei
    fbiconurl: '', //fb头像地址
    spread: 0,    //推广总代级别0，1，2，3
    _curExp: 0, //当前经验值
    _updateExp: 0, //更新的经验值
    _nextLvReward: 0, //下一级奖励
    initgift: 0, //是否领取新手大礼包
    nextvipexp: 0, //下一级vip经验
    leftdays: 0,
    activityList: [], //活动列表
    popLuckySpin: false, //是否弹出幸运转盘
    ecoin: 0, //不可提现金额
    todaybonus: 0, //今日奖励
    invit_uid: 0, //邀请人uid
    _levelGift: 0,
    _richpoint: 0,
    _diamond: 0,
    kycstatus: 0,
    payurl: '',
    kycUrl: '',
    drawUrl: '',
    transactionUrl: '',
    paymentUrl: '',
    addInvite: 0,
    emotionProplist: [],
    lepordgames: [],
    salonVip: 0,
    notice: '',
    rebatGames: [],
    todayrewards: 0, //今日返利
    invitationCode: '', //邀请人邀请码
    fbcId: '', //facebook的cookieid
    phoneNumber: '', //手机号
    countryCode: '', //国家区号
    countryName: '', //国家名称
    isLogin: false,
    isGuest: true,
    userInfo: {} as any,
    mailData: {} as any,
    rewardsDetailsOrBonusDetails: 'bonusDetails',
    bonusDetails: {} as any,
};