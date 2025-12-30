export const MessageId = {
    HEARTBEAT: 11, //服务端主动检测心跳

    //大厅共用协议
    LOGIN: 1, //登录游戏
    LOGIN_USERID: 2, //ID登录
    RELOGIN_USERID: 3, //断线重登陆
    REGET_DESKINFO: 4, //重新刷新房间信息
    REGET_DESKINFO_2: 5, //主动获取房间信息
    LOGIN_OUT: 12, //登出
    SYNC_COIN: 29,//客户端主动同步金币
    ACCOUNT_DELETE: 1093, //删除注销账号
    UPDATE_FCMTOKEN: 390, //更新推送token


    //大厅UI弹框协议
    BIND_INVITE_CODE: 28, //绑定邀请码
    PURCHASE_AGENT_LIST: 50, //获取代理（银商）列表
    PURCHASE_GOODS_LIST: 51, //获取充值列表
    FEEDBACK_COMMIT: 52, //提交反馈(type类型, memo反馈内容)
    MESSAGE_SYSTEM: 53, //系统消息
    MODIFY_INFO: 54, //修改信息（nickname昵称 memo备注）
    IDENTITY_PERSONAL: 55, //个人认证(realname姓名 idcard身份证)
    TOTAL_RANK_LIST: 56, //总金币排行榜
    HALL_SPEAKER_LIST: 59, //获取喇叭跑马灯消息
    EMAIL_LIST: 60, //获取邮件列表
    EMAIL_READ: 61, //读取邮件
    PERSIONAL_INFO: 62, //获取个人信息
    EMAIL_RECEIVE: 63, //领取邮件
    COMMIT_REPORT: 64, //提交举报
    AC_RESERVE_COIN: 72, //获取备用金
    AC_RESERVE_TAKE_LIMIT: 73, //备用金提取额度
    BIND_ACCOUNT: 74, //绑定账号
    GET_BOUNS: 75, //领取在线奖励
    GET_ONLINE_BOUNS_STATUS: 76,       // 领取状态
    GET_TASK_LIST: 77, //获取任务列表
    RECEIVE_REWARD: 78, //领取奖励
    TODAY_RANK_LIST: 79, //今日金币排行榜
    ACTIVITY_LIST: 80, //活动列表
    ACTIVITY_GET_FIVE_STAR: 81, //获取五星好评信息
    ACT_COMMIT_FIVE_STAR: 82, //提交五星好评
    ACT_INVITE_GIFT_LIST: 83, //获取邀请有礼列表
    MODIFY_NICKNAME: 84,      // 修改昵称
    SEND_CHAT: 85, //发送聊天内容
    GET_CHAT_LIST: 86, //获取聊天内容
    BIND_ACCOUNT_WX: 87, //游客绑定微信
    BIG_CHARGE_ANGENT: 88, //代理大额充值信息
    BIG_CHARGE_BACKLIST: 89, //代理大额充值返利档位
    BIG_CHARGE_ORDER: 90, //代理大额充值下单
    BIG_CHARGE_REBACKWARD: 91, //代理大额充值提现
    BIG_CHARGE_REWARD_CORD: 92, //代理大额充值提现记录
    AGENT_REWARD_DATA: 93, //下级代理水费数据
    AGENT_REWARD_REBACKWARD: 94, //下级代理水费提现
    HALL_VERSOIN: 96,           //获取大厅最新的版本号
    AGENT_REWARD_STATIC: 97, //代理查询


    BANK_LOGIN: 100, //银行登录（进入）
    BANK_HALL_INFO: 101, //获取银行大厅信息
    BANK_SAVE_COIN: 102, //存入银行
    BANK_TAKE_COIN: 103, //取款从银行
    BANK_RECORD_LIST: 104, //银行记录
    BANK_MODIFY_PW: 105, //修改银行密码
    BANK_EXIT: 106, //退出银行
    BANK_TAKE_INGAME: 107, //游戏内银行取款

    NICKNAME_INCLUCE_ILLEGAL_CHARACTER: 1073, //您的昵称包含非法字，请重新修改
    NICKNAME_HAD_USED: 1074,                   //昵称已经被使用

    PURCHASE_GET_ORDER: 70, //获取充值订单号
    PURCHASE_CHECK_ORDER: 71, //充值成功，发送服务端是否有效的订单
    PURCHASE_RECHARGE_SUC: 1035, //充值成功推送
    REWARD_ONLINE: 1036,         //在线奖励通知
    TASK_FINISH_NOTICE: 1037,     //任务完成通知
    POP_FIVE_STAR_NOTICE: 1038,   //五星好评通知

    MONEY_CHANGED: 1010, //财产变化（主要是金币变化）


    GAME_REMOTE_LOGIN: 1017, //异地登录
    GAME_NEED_RESTART: 801, //必须重启app


    //游戏相关协议
    GAME_SESS_LIST: 30, //获取指定游戏的场次列表        
    GAME_ROOM_LIST: 34, //展示指定游戏的全部房间列表
    GAME_CREATEROOM: 31, //创建房间
    GAME_JOINROOM: 32, //加入房间
    GAME_LEVELROOM: 40, //离开房间
    GAME_ENTER_MATCH: 43, //加入匹配场
    RELIEF_FUND: 99,      // 救济金
    ENTER_CASINO: 120,    // 进入真人视讯
    EXIT_CASINO: 121,     // 退出真人视讯
    CHANGE_CASINO_COIN: 122,     // 兑换在线的钱

    NOTIFY_SYS_KICK_HALL: 100050, //房间解散，T回大厅
    NOTIFY_SYS_KICK_LOGIN: 100054, //系统T人，T回登录界面

    GLOBAL_MAIL_NOTIFY: 100053,  //邮件通知
    GLOBAL_SPEAKER_NOTIFY: 100055,  //全局喇叭通知
    GLOBAL_SYSTEM_NOTIFY: 100066,  //全局公告
    SEND_CHAT_NOTICE: 100056, //发送聊天通知
    PLAYER_LEAVE: 1016,        //有玩家离开
    SYNC_PLAYER_INFO: 100057, //同步玩家信息


    //客户端自定义网络消息ID从99000开始
    //游戏断线重连，桌子信息
    GAME_RECONNECT_DESKINFO: 99000,
    GAME_ENTER_BACKGROUND: 9900,

    SCORE_LOG: 27,                 // 上下分记录
    MODIFY_PSW: 26,                // 修改密码
    GAME_LIST: 100059,             // 游戏列表
    JACKTPOT_HALL: 121202,         // 大厅奖池
    JACKPOT_GAME: 121203,          // 游戏奖池
    NOTIFY_KICK: 100906,           //踢出房间
    REQ_REDPACK: 7100,           //请求幸运红包
    OPEN_REDPACK: 7101,           //拆开1个幸运红包
    REQ_LUCKRAIN: 7102,           //请求红包雨
    REQ_GROWUPDATA: 130,          //请求玩家成长值数据
    REQ_LUCKBOX: 131,             //请求玩家成长值奖励详情
    REQ_LUCKBOX_REWARD: 132,      //请求领取玩家成长值奖励
    REQ_AGENT_INFO: 135,          // 代理信息
    REQ_TRANSFER: 142,            // 转账
    REQ_MODIFY_CHARGE_PSW: 136,   // 修改支付密码
    REQ_WITHDRAWAL: 137,          // 提现
    REQ_WITHDRAWAL_RECORD: 138,   // 提现记录
    REQ_AGENTLIST: 139,           // 玩家列表
    REQ_TRANSFER_RECORD: 140,     // 转账记录
    REQ_FAV_CHANGE: 150,     // 收藏通知服务端
    RESET_PSW: 143,              // 重置下级默认密码

    CAME_REDPACK_ALLSCENE: 1039,     // 游戏内随机发的红包
    ACTIVE_LUNPAN: 1018,     // 随机发的轮盘


    REQ_SHOP: 201,                 //商城
    REQ_MAIL_LIST: 202,            //获取邮件列表
    REQ_READ_MAIL: 203,            //读取邮件
    REQ_GET_MAIL_ATTACH: 204,      //领取邮件附件
    REQ_CHANGE_USER_HEAD: 211,         //更改头像
    REQ_GET_LEVEL_GITFS: 214,      //等级礼包
    REQ_GET_ALL_MALL_ATTACH: 215,  //邮件一键领取
    REQ_GET_NEW_MAIL: 100053,      //收到新邮件
    REQ_GET_ONLINE_COIN: 205,      //领取在线奖励
    REQ_ONLINE_REWARDS: 206,       //在线奖励
    REQ_GET_SPINE_CONF: 208,       //幸运大转盘配置
    REQ_GET_SPINE_RESULT: 209,     //幸运大转盘结果
    REQ_GET_TURNTABLE_STATE: 210,  //获取转盘状态
    REQ_GET_VIP_INFO: 212,         //获取vip信息
    REQ_OPEN_GIFT: 213,             //领取礼盒
    REQ_GET_DAILY_MISSION_LIST: 216,  //获取每日任务信息
    REQ_GET_MISSION_REWARD: 217,      //获取任务奖励
    REQ_DAILY_MISSION_REMAIN_REWARD: 280, //领取累计奖励
    // NEW_NOTICE_MISSION_CUR_PROCESS : 1053, //玩家当前任务进度通知
    REQ_GET_SIGNIN_LIST: 218,      //获取签到详情
    REQ_GET_SIGIN_ACTION: 219,      //签到
    REQ_SHOP_EX: 263,              //商城同时请求多类商品信息

    REQ_SKIN_SHOP: 421,
    REQ_BUY_SKIN_SHOP_ITEM: 422,

    REQ_GET_FBInfo: 240,           //FB分享邀请信息
    REQ_SHARE_SUCC: 241,           //FB分享成功
    REQ_RANK: 242,      //排行榜
    REQ_RANK_GET_WIN_COIN: 247,      //竞标赛领奖
    REQ_MAIL_ADDZBMATCHINFO: 248,  //邮件争霸赛前三名填信息
    REQ_GET_MONEYBANK: 249,        //moneybank获取数据

    REQ_BIND_FACEBOOK: 244,    //绑定facebook
    REQ_REPORT_STATISTICS: 245,    //数据上报统计Report statistics
    REQ_COLLECT_NEWERGIFT: 246,    //领取新手礼包

    REQ_LEVEL_UP_PARTY_INFO: 252,    //等级升级任务
    REQ_LEVEL_UP_PARTY_AWARD: 253,    //领取等级升级任务奖励
    LEVEL_UP_PARTY_UPDATE_NOTICE: 100063,    //升级任务信息更新通知

    REQ_FRIENDS_LIST: 270,    //好友列表
    // REQ_FRIEND_INFO : 62,    //获取单个好友信息

    REQ_ADD_FRIENDS: 273,    //添加好友
    REQ_DELETE_FRIENDS: 274,    //删除好友
    RET_ADD_FRIENDS_NOTICE: 1059, //添加好友通知

    FRIEND_PRESENT: 271,    //赠送
    FRIEND_PRESENTALL: 272,    //一键赠送

    // REQ_GETCOINLIST : 273,    //可领取好友金币列表
    // FRIEND_GETCOIN : 274,    //领取
    // FRIEND_GETCOINALL : 275,    //一键领取
    //
    // REQ_JACKPOTLIST : 275,    //幸运领取列表
    GET_JACKPOT: 276,    //领取jackpot
    GET_JACKPOTALL: 277,    //一键领取jackpot
    REQ_RECOMMENDLIST: 278,    //获取推荐好友

    // REQ_GET_STAMP_INFO : 254,       // 获取邮票册信息
    // PULL_OPEN_STAMP_PACKAGE : 1056,   // 打开邮票包
    // REQ_BUY_STAMP_PACKAGE : 255,    // 购买邮票包

    REQ_COLLECT_BREAKGRANT_COIN: 151, //领取破产补助
    REQ_HUMMER_PRODUCT_LIST: 152,  //锤子商品列表

    COLLECT_BREAKGRANT_COIN_NOTICE: 1057, //领取破产补助通知

    REQ_MISSION_PASS_INFO: 257, //获取主线等级任务信息
    REQ_PURCHASE_LIST_INFO: 258, //获取充值列表
    REQ_COLLECT_MISSION_PASS_REWARD: 259, //领取主线等级任务奖励
    REQ_COLLECT_MISSION_PASS_ALL_REWARD: 260, //领取主线等级全部任务奖励
    REQ_REDEEM: 264,   //礼包码兑换

    SPORT_LIST: 160,
    SPORT_JOIN: 161,
    SPORT_RANKING: 162,
    SPORT_CANCEL: 163,

    PULL_LEVEL_UP_EXP: 1050,       //经验等级提升
    PULL_CHANGE_EXP: 1052,       //经验变化
    PULL_RED_NOTICE: 1019,       //小红点推送  
    PULL_ADD_OL_MULTILE: 100064,          //在线奖励倍率变化


    PULL_RANK_RESULT: 1054,       //锦标赛推送
    PULL_JACKPOT_OTHER: 1055,     //其他玩家大奖推送
    PULL_ONETIMEONLY_DEL: 10056,     //关闭限时的one time only
    REQ_DOUBLE_XP: 250,          //请求双倍经验信息
    REQ_EVENT_OFFER_REWARD: 251,          //请求事件引导的操作

    //CashHero
    REQ_PIGBANK_FREEOPEN: 256,         //CashHero 金猪免费开一次

    REQ_CH_MAILREWARD: 268,          //CashHero 邮件领取奖励
    REQ_CH_MAILREWARDALL: 269,          //CashHero 邮件领取所有奖励
    PULL_CH_MAILS_REDDOT: 1058,               //邮件红点推送
    PULL_CH_LESSCOIN_ACTIVELIST: 1060,               //金币不足的活动弹框


    REQ_COLLECT_OFFLINE_REWARD: 220,            //领取离线收益
    REQ_COLLECT_GROWTH_FUND: 279,               //领取基金
    REQ_SUCCESS_GROWTH_FUND: 1061,              //基金购买成功
    REQ_REFRESH_VIP: 1051,                      //刷新vip
    REQ_QUEST_INFO_LOGINPOP: 319,              //登陆弹窗请求Quest信息
    REQ_QUEST_INFO: 320,                       //请求Quest信息
    REQ_QUEST_REWARD: 321,                     //请求Quest奖励
    REQ_WORLD_CHAT: 322,                       //世界聊天
    REQ_CARDSHARE_CHAT: 323,                   //卡牌分享到世界聊天
    REQ_CARDSHARE_GIFT: 324,                   //打开卡牌分享礼包

    REQ_HALL_TAB_BONUS: 281,                   //获取bonus信息
    REQ_COLLECT_WEEK_MONTH_CARD: 282,          //周卡月卡，收集金币
    NOTICE_BUY_WEEK_MONTH_CARD_SUCCESS: 1062,  //周卡月卡购买成功
    NOTIFY_BUY_HUMMER: 1063,                   //购买锤子成功
    SAVE_GUIDE_ID: 284,                        //保存引导id

    REQ_LUCKYSMASH_INFO: 285,          //砸金蛋：信息
    REQ_LUCKYSMASH_RECORD: 286,        //砸金蛋：记录
    REQ_LUCKYSMASH_CRUSH: 287,         //砸金蛋：砸

    REQ_OPEN_TRIAL_CARD: 288,          //开启月卡试用
    REQ_GET_TRIAL_CARD: 289,           //领取试用月卡奖励

    //俱乐部
    REQ_CLUB_LIST: 290,                   //俱乐部列表
    REQ_CLUB_DETAILS: 291,                   //俱乐部详情
    REQ_CLUB_CREATE: 292,                   //创建俱乐部

    REQ_DISSOLVE_CLUB: 293,             //解散俱乐部

    REQ_CHANGE_CLUB_INFO: 294,             //修改俱乐部信息
    REQ_APPLY_CLUB: 295,                   //申请加入
    REQ_DEAL_APPLY: 296,                   //申请回复 --管理者处理俱乐部申请
    REQ_DEAL_INVITE: 297,                   //邀请回复 --普通人处理俱乐部邀请

    REQ_EXIT_CLUB: 298,                   //退出俱乐部
    REQ_DEL_CLUB_USER: 299,                   //俱乐部踢人


    REQ_CLUB_APPLY_LIST: 300,                   //俱乐部申请列表 --给俱乐部管理员看
    REQ_CLUB_USER_INFO_LIST: 301,                   //成员列表
    REQ_CLUB_CHAT: 302,                   //成员列表

    REQ_CLUB_REWARDS: 303,                   //奖励信息
    REQ_CLUB_GET_REWARD: 304,                   //奖励领取


    REQ_CLUB_TASK: 305,                   //任务信息
    REQ_CLUB_TASK_GET_REWARD: 306,                   //任务奖励领取,无id领取所有


    REQ_CAN_APPLY_CLUB_LIST: 307,                   //可申请俱乐部列表
    REQ_CLUB_INVITE_OTHER: 308,                   //管理员邀请别人进俱乐部
    REQ_CLUB_INVITE_LIST: 309,                   //俱乐部邀请列表 --给普通人看 

    REQ_HEROCARD_LIST: 325,            //英雄卡牌列表
    REQ_HEROCARD_INFO: 326,            //英雄卡牌信息
    REQ_HEROCARD_UNLOCK: 327,          //英雄卡牌解锁
    REQ_HEROCARD_ADD_STAR: 328,        //英雄卡牌升星
    REQ_HEROCARD_LEVEL_UP: 329,        //英雄卡牌升级
    REQ_HEROCARD_SUMMON: 362,        //英雄卡牌10抽基本信息
    REQ_HEROCARD_SUMMON_DIAMOND: 364,        //英雄卡牌抽卡钻石
    NOTIFY_HEROCARD_DROP: 1064,        //英雄卡牌碎片掉落通知
    REQ_HEROCARD_RANK: 374,     //英雄卡牌排行榜

    REQ_PVP_FIGHT: 375,   //卡牌对战
    REQ_PVP_RANK: 376, //获取排行榜
    REQ_PVP_MATCH: 377,    //匹配战斗用户
    REQ_PVP_SET_FORMATION: 378,  //设置防守队伍
    REQ_PVP_BUY_TICKET: 379,   //购买pvp门票
    REQ_PVP_RECORD: 383,   //被挑战记录
    REQ_PVP_DETAIL: 384,   //战斗详情
    REQ_PVP_TEAM: 385,     //查询玩家队伍

    REQ_BINGO_INFO: 330,       //bingo 信息
    REQ_BINGO_SPIN: 331,       //bingo 转动
    REQ_BINGO_RANK: 332,       //bingo 排行榜
    NOTIFY_BINGO_BUFF_BUYED: 1066,     //bingo buff 购买
    NOTIFY_BINGO_GIFT_BUYED: 1067,     //bingo point 购买

    REQ_EXPLORE_INFO: 366,     // 骑士的探索-信息
    REQ_EXPLORE_SPIN: 367,     // 骑士的探索-摇色子
    REQ_EXPLORE_OPENBOX: 368,  // 骑士的探索-开箱子
    JOURNEY_CNT_GIFT_BUYED: 1072,  // 骑士的探索 cnt 礼包 购买
    JOURNEY_COIN_GIFT_BUYED: 1073, // 骑士的探索 coin 礼包 购买
    JOURNEY_STEP_GIFT_BUYED: 1074, // 骑士的探索 step 礼包 购买

    REQ_FRIEND_CHATRANK_BETINFO: 265,        //好友聊天中rank的下注信息
    REQ_FRIEND_CHATRANK_DOBET: 266,   //好友聊天中rank的下注确认
    FRIEND_COLLECTALL_DOUBLE: 360,    //好友一键领取分享翻倍
    DOUBLE_WIN_COINS: 361,
    PULL_MODIFY_LOCALVAL: 1021,    //推送修改本地的一些变量

    REQ_GIFT_SEND: 661,           //赠送魅力值道具
    REQ_GIFT_SENDLIST: 662,       //赠送出去的列表
    REQ_GIFT_RECEIVELIST: 663,    //收到的列表
    PULL_GIFT_INFO: 1042,         //全服广播送礼信息

    //luckcard
    REQ_LUCKYCARD_INFO: 350,       //luckycard详情
    REQ_LUCKYCARD_ACTION: 351,        //luckycard 翻卡
    REQ_LUCKYCARD_TAKE: 352,       //luckycard 领取奖励
    REQ_LUCKYCARD_RELIFE: 353,      //luckycard 复活卡使用
    REQ_LUCKYCARD_BUYLIST: 354,     //luckycard 复活卡购买列表
    PULL_LUCKYCARD_BUYSUCCESS: 1065,       //luckycard 复活卡购买成功推送
    PULL_LUCKYCARD_RESET: 1069,     //luckycard 重置，花钱再玩一次

    //guidetask
    REQ_GUIDETASK_REWARD: 341,    //引导任务 领取奖励
    PULL_GUIDETASK_UPDATEINFO: 1068,    //引导任务更新进度信息
    REQ_GUIDETASK_ADD_HEROCARD: 333,  //引导获取卡片
    REQ_SERVICES_INFO: 514,  // 客服

    //facebook share span
    REQ_GET_SHARE_WHEEL: 342,       //获取分享转盘信息
    REQ_SPIN_WHEEL: 343,     //开始转动转盘

    //大厅选择押注
    // REQ_HALLBETS_SELECT : 357          //档位信息获取
    REQ_HEROPALACE: 358,    //富豪厅信息
    REQ_HEROPALACE_COLLECT: 359,    //富豪厅领取奖励
    REQ_HEROPALACE_TICKET: 372,   //富豪庭体验券
    REQ_BONUS_LISTINFO: 373,  //请求bonus信息
    //dailyBonus
    REQ_GET_SIGN_INFO: 418,     //获得签到信息（不再使用）
    REQ_GET_SIGN_ACTION: 419,        //签到操作（不再使用）
    REQ_GET_SIGN_GIFT: 420,    //获得累计签到礼包（不再使用）

    REQ_SEND_FIRSTGIFT_COLLECT: 425,     //发送首充的礼物选择

    //集卡成就
    REQ_SET_CARD_ACHIEVE: 335,    //集卡成就列表
    REQ_SET_CARD_REWARD: 337,   //获得集卡奖励
    // REQ_CARD_ACHIEVE_STATUS : 339   //获得集卡成就状态
    REQ_CARD_TASK_INFO: 334,     //获取单卡牌成就
    REQ_CARD_TASK_STATUS: 336, //获取单卡任务状态
    REQ_CARD_TASK_REWARD: 338,   //获取单卡成就奖励

    //卡牌转盘
    REQ_CARD_GET_WHEEL_INFO: 370,     //获取碎片转盘信息
    REQ_CARD_PLAY_WHEEL: 371,   //使用碎片转动转盘

    //回大厅请求
    REQ_SYNC_HALLINFO: 349,   //同步大厅信息

    //每日任务
    REQ_GET_MISSION_INFO: 344,  //获得每日任务信息列表
    REQ_GET_MISSION_REWARDS: 345, //获得任务奖励
    REQ_USE_MISSION_DIAMOND: 346, //钻石完成
    REQ_GET_MISSION_LIVE: 347,   //活跃度
    REQ_SET_MISSION_PROCESS: 1071, //游戏界面进度条

    REQ_NOTICE_REWARD_COLLECT: 348, //领取召回奖励

    //现金返现领取奖励
    REQ_GET_CASHBACK_REWARDS: 365,//现金返现领取奖励

    //游戏内转盘
    REQ_GET_TURNTABLE_TYPE: 207, //获得需要弹免费还是付费

    //私聊
    REQ_PRIVATE_GETCARD: 455, //获得好友卡牌
    REQ_PRIVATE_SENDCARD: 454, //同意赠送好友卡牌
    REQ_PRIVATE_CHAT: 453,  //获得与特定好友的私聊信息
    REQ_PRIVATE_LIST: 452, //获得私聊列表
    REQ_PRIVATE_SEND: 451,//发送给特定好友的私聊信息
    REQ_PRIVATE_GET: 100203,//获得好友私聊信息
    REQ_PRIVATE_RECCARD: 100204,//获得好友赠送卡牌信息

    //兑换码
    REQ_CDKEY: 664,

    //bonus主线任务
    REQ_BONUS_MAINLISTINFO: 380,   //请求bonus主线任务
    REQ_BONUS_MAINLISTREWARD: 381,    //请求bonus主线任务奖励

    //bonus红点收集
    REQ_BONUS_REDDOT_REWARDS: 382,   //获得红点奖励

    //大厅排行榜前三数据
    REQ_HALL_RANKTOP3: 369,  //获得红点奖励

    //保险箱
    REQ_ENTER_SAFE: 100,   // 进入银行
    REQ_SAFE_INFO: 101,   // 银行大厅信息
    REQ_SAFE_SAVE: 102,   // 存款
    REQ_SAFE_TAKE: 103,   // 取款
    REQ_SAFE_RECORD: 104,   // 银行记录


    // ------------------------ 桌游 -------------------------------
    PULL_FREE_STATUE: 128000,//进入空闲阶段
    PULL_BETTING_STATUE: 128001,//进入下注阶段
    PULL_RESULT_STATUE: 128002,//进入结算阶段
    PULL_OTHER_BET: 128003, //其它玩家下注
    PULL_OBSERVERS_NUM: 128004,  //观众人数变化
    PULL_CRASH_TAKEREWARD: 128005,   //Crash 自动提现。不通用
    PULL_CRASH_FLY: 128006,   //Crash 飞机起飞。不通用
    MSG_Cash_Out: 81,//Crash 领取奖励
    PLACE_BET: 44,

    REQ_LABAGAME_TOTAL_RANK: 1122,   //排行榜
    REQ_LABAGAME_LIST: 1120,       //游戏记录

    PULL_TABLE_PLAYER: 126001, //桌上玩家的加入
    LEFT_TABLE_PLAYER: 126011,//桌上玩家离开
    TABLE_BET_REQ: 37, //玩家下注
    REQ_OBSER_LIST: 1121, //获取观众列表
    GAME_SWITCH_TABLE: 52,//游戏内换桌
    PULL_SWITCH_TABLE: 1083, //推送游戏内换桌
    // 请求所有排行榜的简要数据
    ALL_RANK_LIST: 243,
    // 更新用户信息
    UPDATE_USER_INFO: 211,
    // 购买头像框
    BUY_USER_FRAME: 63,
    // 请求领取VIP的奖励
    REQU_GET_VIP_REWARD: 282,
    // 充值VIP成功
    REQU_CHARGE_VIP: 1062,
    //玩家当前任务进度通知 
    NEW_NOTICE_MISSION_CUR_PROCESS: 1053,
    // 修改当前语言
    CHANGE_LANGUAGE: 199,
    // Bouns发生了改变
    CHANGE_BONUS_LIST: 1070,
    // 聊天室用户信息更新
    CHAT_USER_INFO_UPDATE: 1091,
    // 收到一条新的聊天信息
    CHAT_NEW_MSG: 1092,
    // 离开聊天室
    CHAT_LEAVE_ROOM: 424,
    // 发送一条消息
    CHAT_SEND_MSG: 334,
    // 删除一条世界聊天信息
    CHAT_DEL_MSG: 1094,
    // 清空聊天室
    CHAT_DELALL_MSG: 1095,
    // 钻石兑换金币
    DIAMOND_TO_COIN: 429,
    // 通知服务器玩家是否去点赞
    LIKE_OPR: 357,
    // 获取单个排行榜的前三数据
    RANK_THREE_DATA: 258,
    // 背包协议
    REQ_SKIN_BAG: 415,
    // 获取在线人数
    REQ_ROOM_PALYER_NUM: 311,
    // 通知服务器 拉取了排行榜
    REQ_RANK_MAIN_VIEW: 460,
    // 领取商城免费奖励
    REQ_SHOP_FREE_REWARD: 264,
    // 通知服务器 退出私聊
    REQ_CHAT_FRIEND_EXIT: 271,
    // 一键删除所有邮件
    MAIL_REMOVE_ALL: 201,
    // 读取邮件
    MAIL_READ: 203,
    // VIP每日奖励数据
    VIP_DAILY_VIEW: 283,
    // 举报
    REPORT_USER: 222,
    // 领取离线奖励
    GET_OFFLINE_REWARDS: 220,
    // 购买全服礼物
    WORLD_GIFT_BUY: 660,
    // 用户反馈
    USER_FEEDBAKC: 169,
    // 举报聊天内容
    USER_REPORT_CHAT: 223,
    // 新手改名奖励
    USER_NEW_GIFT: 168,
    // 一键领取VIP奖励
    GET_ALL_VIP_REAWRDS: 152,
    // 通知服务器进行排位赛数据更新
    REQ_UPDATE_LEAGUE_EXP: 150,
    // 历史战绩
    GAME_RECORD: 700,
    // 经验值道具使用
    USE_PROP: 420,
    // 私聊协议
    PRIVATE_CHAT_LIST: 463,
    // 分享whatsapp上报
    SHARE_WHATSAPP_REPORT: 430,
    // 任务完成通知
    TASK_COMPLETE_NOTIFY: 1070,

    // 沙龙收益记录
    SALON_INCOME_RECORD: 505,
    // 联赛变更通知
    LEAGUE_CHANGE_NOTIFY: 1043,

    TASK_SALON_CONFIG: 290,
    TASK_SALON_REWARD: 291,

    GAME_CONFIG: 333,

    SALON_INVITE_CHAT: 335,
    // 投票有变动
    COUNTRY_TOP_CHANGE: 10355,
    // 删除对应好友聊天记录
    DELETE_FRIEND_RECORD: 469,
    // 获取新手1000美金大礼包
    GET_NEWER_GIFT_REWARDS: 665,


    // 获取破产补助信息
    GET_BANKRUPTCY_INFO: 149,
    // 领取破产补助
    GET_BANKRUPTCY_REWARD: 151,

    // 手机号验证码与绑定
    GET_PHONE_CODE: 135,

    BIND_PHONE: 134,

    //绑定邮箱
    BIND_EMAIL: 234,

    // ------------------------ 补充 协议 end ---------------------------



    // ------------------------ 金猪 start  ---------------------------
    // 金猪的信息
    PIGGY_BANK_VIEW: 249,
    // 金猪满了推送
    PIGGY_BANK_NOTIFY: 100065,

    // ------------------------ 联赛 start  ---------------------------
    // 联赛的配置
    LEAGUE_VIEW: 188,
    // 联赛报名协议
    LEAGUE_APPLY: 187,
    // 联赛往届冠军
    LEAGUE_RECORD: 189,
    // 领取联赛奖励
    LEAGUE_REWARD: 190,
    //游戏内联赛积分变化
    LEAGUE_EXP_CHANGE: 100067,
    // 排位赛最高等级提升
    LEAGUE_LEVEL_UP: 100068,
    // ------------------------ RP start  ---------------------------
    RP_VIEW: 312,
    RP_REWARD: 313,
    RP_VIEW_RULE: 314,
    // ------------------------ RP start  ---------------------------
    // 国家投票信息
    COUNTRY_RANK: 354,
    // 给国家投票
    COUNTRY_VOTE: 355,
    // 领取沙龙体验卡
    SALON_GET_TEST: 336,
    // 领取沙龙收益
    SALON_GET_INCOME: 506,
    // 回应沙龙邀请
    SALON_INVITE_APPLY: 192,





    // ------------------------ 好友房 start ---------------------------
    FRIEND_ROOM_CREATE: 500,             // 创建好友房间
    FRIEND_ROOM_JOIN: 501,               // 加入好友房间
    FRIEND_ROOM_INVITE: 503,             // 邀请好友
    FRIEND_ROOM_BE_INVITE: 126201,       // 被好友邀请
    FRIEND_ROOM_INVITE_FEEDBACK: 126202,       // 邀请人反馈
    FRIEND_ROOM_LIST: 175,               // 请求房间列表
    FRIEND_ROOM_LIST_CHANGE: 125620,     // 房间列表更新
    FRIEND_ROOM_LEAVE: 176,              // 退出模块
    FRIEND_ROOM_DISSOLVE: 504,          // 解散房间
    CHECK_DESK_INFO: 502,       //查询沙龙房间信息


    // 房间匹配排位VIP相关
    // ############### online ##################
    ONLINE_ENTER_LONLINE: 185,       // 进入online 界面
    ONLINE_START_MATCH_ROOM: 170,      // 请求匹配 匹配房
    ONLINE_REC_MATCH_ROOM: 125618,   // 服务器广播匹配数据
    ONLINE_REQ_CANCLE_MATCH: 171,    // 取消匹配
    // ############### vip ##################
    VIP_ROOM_LIST: 175,          // 请求房间列表
    VIP_ROOM_LIST_CHANGE: 125620,// 列表更新
    VIP_CREATE_ROOM: 172,        // 创建房间
    VIP_JOIN_ROOM: 173,          // 加入房间
    VIP_ROOM_MATCH_CHANGE: 125619,// 匹配过程中人数变化
    VIP_EXIT_VIP_MATCH: 174,      // vip 匹配过程中退出
    VIP_DISMISS_ROOM: 125621,   // 匹配过程中解散房间
    VIP_FAST_JOIN: 177,         // 快速开始
    // ############### league ##################
    LEAGUE_ENTER_LEAGUE: 178, // 进入排位赛界面
    LEAGUE_RECEIVE_AN_INVITATION: 125622, // 收到一个排位邀请
    LEAGUE_KICK_FRIEND: 180,       // 踢出好友
    LEAGUE_GOT_KICKED: 125625,  // 被好友踢了
    LEAGUE_START_MATCH: 181,    // 开始排位
    LEAGUE_REC_MATCH_ROOM: 125618, // 匹配过程中数据变化
    LEAGUE_REQ_CANCLE_MATCH: 171,   // 取消匹配
    LEAGUE_RANKING_LIST: 242,   //  排行榜
    LEAGUE_TASK_LIST: 216,       // 任务列表
    LEAGUE_TASK_GET_REWARD: 217, // 领取奖励
    // other
    EXIT_MODULE: 176,                // 退出模块
    INVITE_FRIEND_JOIN_TEAM: 179,    // 邀请好友进行排位
    KICK_TEAM_MEMBER: 180,           // 踢掉队员
    INVITATION_RESULT: 182,          // 回复邀请
    QUIT_TEAM: 184,                  // 玩家退出队伍
    TEAM_CHANGE_ENTER: 186,          // 房主修改进房条件
    FRIEND_LIST: 270,                // 请求好友列表

    // ------------------------ 社交 协议 start ---------------------------
    // 好友列表
    SOCIAL_FRIEND_LIST: 270,
    // 最近的聊天记录
    SOCIAL_FRIEND_MESSAGE_LIST: 452,
    // 添加好友请求列表
    SOCIAL_FRIEND_REQUEST_LIST: 449,
    // 处理好友请求(同意/拒绝)
    SOCIAL_FRIEND_REQUEST_HANDLE: 448,
    // 添加好友
    SOCIAL_FRIEND_HANDLE_ADD: 273,
    // 删除好友
    SOCIAL_FRIEND_HANDLE_REMOVE: 274,
    // 推荐好友
    SOCIAL_FRIEND_HANDLE_RECOMMEND: 278,
    // 获取指定UID的聊天记录
    SOCIAL_FRIEND_MSG_LIST: 453,
    // 发送一条好友的聊天信息
    SOCIAL_FRIEND_MSG_SEND: 451,
    // 接受到一条好友的聊天信息
    SOCIAL_FRIEND_MSG_REV: 100203,
    // 最近一起玩游戏的玩家列表
    SOCIAL_RECENT_PLAYER_LIST: 450,
    // 模糊查找好友
    SOCIAL_SEARCH_USER: 468,
    // 系统消息
    SOCIAL_SYSTEM_MESSAGE_LIST: 426,
    // 删除一条系统消息
    SOCIAL_SYSTEM_MESSAGE_DELETE: 427,
    // 清空系统消息
    SOCIAL_SYSTEM_MESSAGE_DELETE_ALL: 428,
    // 获取额外奖励
    GAME_SHARE_REWARD: 191,
    // ------------------------ 社交 协议 end ---------------------------


    // ------------------------ 活动和任务 协议 start ---------------------------
    // 登录奖励
    EVENT_SIGN_CONFIG: 418,
    EVENT_SIGN_REWARD: 419,
    // VIP登录奖励
    EVENT_VIP_SIGN_CONFIG: 416,
    EVENT_VIP_SIGN_REWARD: 417,
    // 任务协议 -- type:1每日任务 2：活跃任务 3:升级任务 5:VIP等级奖励 8:新手任务
    EVENT_TASK_CONFIG: 216,
    EVENT_TASK_REWARD: 217,
    // 主线任务
    EVENT_TASK_MAIN_CONFIG: 342,
    EVENT_TASK_MAIN_REWARD: 343,
    EVENT_VIP_MAIN_CONFIG: 345,
    EVENT_VIP_MAIN_REWARD: 346,
    EVENT_BONUS_RECORD: 315,
    // login
    EVENT_LOGIN_BONUS_CONFIG: 344,
    // 获取新手任务奖励
    EVENT_GET_NEW_PLAYER_CONFIG: 218,
    EVENT_GET_NEW_PLAYER_REWARD: 219,

    EVENT_GET_DAILYTASK_MAIN_REWARD: 221,
    //返水信息
    EVENT_RETURN_WATER_CONFIG: 194,
    EVENT_RETURN_WATER_REWARD: 195,

    //排行榜
    EVENT_GET_RANK_INFO: 197,    // 获取排行榜信息
    EVENT_REGISTER_RANK_INFO: 198,   // 注册排行榜信息
    EVENT_GET_RANK_CONFIG: 200,  // 获取排行榜配置
    EVENT_GET_RANK_REWARDS_CFG: 207, // 获取排行榜奖励配置

    // 在线奖励
    EVENT_ONLINE_WHEEL_CONF: 208,  //转盘配置
    EVENT_ONLINE_WHEEL_RESULT: 209,  //转盘结果
    EVENT_ONLINE_GET_STATE: 210,  //获取转盘状态

    // ------------------------ 活动和任务 协议 end ---------------------------


    // FB分享奖励
    EVENT_FB_SHARE_CONFIG: 240,              //FB分享配置
    EVENT_FB_SHARE_SUCCESS: 241,          //分享成功
    EVENT_FB_SHARE_REWARD: 247,         //分享转盘转盘结果
    // FB反馈
    EVENT_FEEDBACK: 169,
    // FB邀请
    EVENT_FB_INVITE_CONFIG: 254,              //FB邀请配置
    EVENT_FB_INVITE_REWARD: 255,              //FB邀请单个奖励领取 (已废弃)
    EVENT_FB_INVITE_REWARD_ALL: 256,          //FB邀请全部奖励领取 (已废弃)
    EVENT_FB_INVITE_BIND_CODE: 257,          //FB绑定邀请码
    REQ_REFFERS_LIST: 255,   //获取代理列表
    REQ_REFFERS_REWARDS: 256,//我的收益列表
    REQ_REFFERS_DETAILS: 259,//收益详情列表

    REQ_REFFERS_LIST_DETAILS: 261, //代理列表
    REQ_REFFERS_REWARDS_DETAILS: 262, //收益列表


    // ------------------------ 俱乐部 协议 start ---------------------------

    CLUB_LIST_RECOMMEND: 471,            //获取推荐俱乐部
    CLUB_LIST_RANK: 472,                 //俱乐部排行榜
    CLUB_CREATE: 473,                    //创建俱乐部
    CLUB_INFO: 474,                      //俱乐部详情
    CLUB_APPLY: 475,                     //申请加入俱乐部
    CLUB_LIST_APPLY: 476,                     //获取申请列表
    CLUB_HANDLE_APPLY: 477,                     //审核申请
    CLUB_HANDLE_REMOVE: 478,                     //剔除一个用户
    CLUB_LIST_USER: 479,                     //获取俱乐部成员列表
    CLUB_SIGN: 480,                          //俱乐部签到
    CLUB_EXIT: 481,                          //主动退出俱乐部
    CLUB_UPDATE_INFO: 482,                   //俱乐部信息更新
    CLUB_ROOM_LIST: 483,                   //获取俱乐部房间
    CLUB_ROOMT_CREATE: 484,                   //创建俱乐部房间
    CLUB_ROOMT_JOIN: 485,                   //加入俱乐部房间
    CLUB_ROOMT_INVITE: 486,                   //邀请加入俱乐部房间

    CLUB_ROOMT_BE_INVITE: 126102,                   //通知被邀请
    NOTIFY_CLUB_JOIN: 1080,                     //通知被 俱乐部加入
    NOTIFY_CLUB_REMOVE: 1081,                     //通知被 俱乐部移除

    // ------------------------ 俱乐部 协议 end ---------------------------

    // ------------------------ 通行证 start ---------------------------
    EVENT_MENSA_CARD_INFO: 461, // 获取通行证信息
    EVENT_MENSA_CARD_TAKE_REWRAD: 462, // 领取通行证奖励
    EVENT_MENSA_CARD_TASK_INFO: 463, // 获取通行证任务信息
    EVENT_MENSA_CARD_REFRESH_TASK: 464, // 使用钻石刷新任务
    EVENT_MENSA_CARD_CMP_TASK: 465, // 使用钻石完成任务
    EVENT_MENSA_CARD_TAKE_ALL_REWRAD: 467, // 一键领取奖励
    // ------------------------ 通行证 end ---------------------------

    // ------------------------ 送礼系统 start ---------------------------
    USER_GIFT_SEND: 661,         // 赠送礼物
    USER_GIFT_SEND_LIST: 662,         // 赠送礼物
    USER_GIFT_GET_LIST: 663,         // 赠送礼物
    USER_GIFT_BROADCAST: 1042,         // 赠送礼物广播

    // ------------------------ 兑换码 start ---------------------------
    USER_EXCHANGE_CODE: 664,         // 赠送礼物广播

    // --------------------- 比赛场 --------------------
    GET_MATCH_CONFIG: 510,       // 获取比赛配置
    ENTER_MATCH: 511,            // 进入比赛
    GET_MATCH_INFO: 512,         // 获取比赛信息
    PUll_MATCH_INFO: 100069,     // 主动推送比赛信息
    END_MATCH: 100070,           // 比赛结束

    // --------------------- 淘汰赛 --------------------
    GET_KNOCKOUT_CONFIG: 294,       // 获取配置
    GET_KNOCKOUT_INFO: 295,       // 获取某一场详细信息
    REQ_KNOCKOUT_REGISTER: 296,       // 报名某一场
    REQ_KNOCKOUT_JOIN: 297,       // 进入比赛
    REQ_KNOCKOUT_READY: 1084,       // 比赛准备提示
    REQ_KNOCKOUT_UPDATE: 1085,       // 排名更新提示
    REQ_KNOCKOUT_CHANGE: 1087,      // 中途换桌提示
    REQ_KNOCKOUT_COUNT: 1088,      // 开始统计
    REQ_KNOCKOUT_OVER: 1089,       // 最终结算
    REQ_KNOCKOUT_LOSE: 1086,      // 被淘汰通知
    REQ_KNOCKOUT_EXIT: 1090,      // 退赛退钱






    // ------------------------ 好友房 end ---------------------------

    // ------------------------ 通用start ---------------------------
    GET_RAND_USERS: 310,
    // ------------------------ 通用end ---------------------------


    //提现获取基本信息
    YD_WITHDRAW_GET: 130,
    YD_WITHDRAW_SAVE: 131,
    YD_WITHDRAW_DRAW: 132,
    YD_WITHDRAW_RECORD: 133,
    YD_WITHDRAW_BANK_SUPPORT: 136,

    //优惠余额
    BONUS_COIN_PRPPORTION: 260, //优惠余额提取比例
    BONUS_COIN_INFO: 418,    //优惠余额信息
    BONUS_COIN_TRANSFER: 419,  //优惠余额转现金余额


    //推广相关
    REFER_INFO: 254,
    REFER_BROADCAST_INFO: 267,

    UPDATE_PINMSG: 100072,

    //luckyspin
    LUCKYSPIN_RECORDS: 345,
    //促销详情
    BONUS_PROM_LIST: 362,

    //充值完成回调
    NOTIFY_RECHANGE_OVER: 22222,
    SLOT_START : 44,             // 游戏开始
    SLOT_RANK : 242,             // 锦标赛时榜
    SLOT_RATE : 45,               // 倍率
    SLOT_CHOOSE_TIMES : 50,       // 选择免费次数
    SLOT_ADJUST_LINE : 108,       //调整游戏线路
    SLOT_ENTER_GREAT_BULE_FREEGAME : 1031,   // 进入伟大蓝色免费游戏
    SLOT_TK_FREE_GAME : 1091,     // 三国免费游戏
    SLOT_CHOOSE_LOTUS_FLOWER : 1111,    //金莲花游戏特有的选金莲花
    SLOT_ENTER_SUBGAME : 46,      // 进入子游戏
    SLOT_EXIT_SUBGAME : 47,       // 退出子游戏
    SLOT_SUBGAME_DATA : 51,       // 子游戏内部消息 （所有子游戏通用）
    SLOT_SUBGAME_ACTION : 1112,   // 子游戏动作
    SLOT_MAX_BET : 1201,
    ALLIN : 1113,                 // ALL IN
    SLOT_SELECT_DRAGONS : 1114,    //龙5选择免费类型
    SLOT_ENTER_SELECT_DRAGONS : 11130, //推送进入免费游戏

    // ------------------------ 牌桌游戏消息ID start ---------------------------
    // Rummy 游戏相关
    YD_RUMMY_DISCARD: 29204,        // 有人丢弃牌
    YD_RUMMY_DEAL: 126003,          // 游戏开始
    YD_RUMMY_DROP: 29201,           // 有人投降
    YD_RUMMY_COLLECT_CARD: 29202,   // 摸牌
    YD_RUMMY_GROUP_CARD: 29205,     // 理牌
    YD_RUMMY_ROUND_OVER: 126005,    // 回合结束
    YD_RUMMY_ROUND_SETTLE: 126006,   // 回合结算 (PokerHero项目使用)
    YD_RUMMY_SHOW_RESULT: 29203,    // 回合Show
    YD_RUMMY_CONFIRM_RESULT: 29206, // 回合Confirm
    YD_RUMMY_AUTO_CHANGE: 126004,   // 托管
    YD_RUMMY_AUTO_CANCEL: 25707,    // 托管取消
    YD_RUMMY_CHAT_MSG: 100202,      // 收到聊天信息
    YD_RUMMY_RECOUNT: 100071,       // 进入倒计时

    // 游戏记录相关
    GAME_BET_RECORDS: 193,          // 查看投注记录
    GAME_RESULT_HISTORY: 196,       // 查看游戏历史结果

    // 好友房相关
    GAME_SEND_READY: 25708,         // 好友房准备
    GAME_PULL_READY_STATUE: 126002, // 玩家ready改变
    GAME_DISMISS_ROOM: 126012,      // 房间解散
    // ------------------------ 牌桌游戏消息ID end ---------------------------

}