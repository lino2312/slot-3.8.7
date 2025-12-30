export const EventId = {
    LOGIN_POP_UI: "NEXT_LOGIN_POP_UI", //登录弹框
    NOT_ENOUGH_COIN_POP_UI: "NOT_ENOUGH_COIN_POP_UI", //登录弹框
    NEXT_POP_UI: "NEXT_POP_UI", //弹框
    NOT_ENOUGH_COINS: "not_enough_coins",
    REFRESH_PLAYER_HEAD: "REFRESH_PLAYER_HEAD",
    UPDATE_TASK_REDPOINT: "UPDATE_TASK_REDPOINT",
    REFUSH_CH_MAIL_STATE: "REFUSH_CH_MAIL_STATE", //刷新cashhero的邮件状态
    REMOVE_CH_MAIL_ITEM: "REMOVE_CH_MAIL_ITEM", //删除cashhero的邮件
    CHANGE_USER_HEAD: "CHANGE_USER_HEAD",// 修改玩家头像
    REFRESH_SHOP_COIN: "REFRESH_SHOP_COIN",// 商品页面刷新金币
    SYS_CHANGE_LANGUAGE: "SYS_CHANGE_LANGUAGE",//切换UI语言
    SHOW_SCORE_LOG: "show_score_log",          // 显示上下分记录
    SHOW_MODIFY_PSW: "show_modify_psw",        // 显示修改密码
    ENTER_HALL: "enter_hall",
    ENTER_GAME_EVENT: 'enter_game_event',        // 进入某个游戏
    ENTER_LOGIN_SUCCESS: 'enter_login_success',  // 成功登录
    ENTER_LOGIN_FAILE: 'ENTER_LOGIN_FAILE',      // 登录失败
    STOP_ACTION: "stop_action",                  // 停止动画
    LOGOUT: "logout",                            // 登出
    UPDATE_GAME_LIST: "update_game_list",        // 更新列表
    UPATE_COINS: "upate_coins",                  // 更新金币
    EXIT_GAME: "exit_game",                      // 退出游戏
    SHOW_BIGBANG: "show_bigbang",                // 显示Bigbang动画
    HIDE_BIGBANG: "hide_bigbang",                // 隐藏Bigbang动画
    RECHARGE_SUCC: "recharge_succ",              // 上下分成功
    SPECIAL_ACTION_FINISH: "special_action_finish",   // 特殊动画，主要指停止后，结算前播放动画
    LOAD_ITEM_FINISH: "load_Items_finish",       // 加载item完成
    SHOW_ALL_GAMEITEM: "show_all_gameitem",       // 显示所有游戏图标
    SHOW_RANDJACKPOT: "show_randjackpot",         // 显示randjackpot动画
    HIDE_RANDJACKPOT: "hide_randjackpot",          // 隐藏randjackpot动画
    RELOGIN: "game_relogin",                       // 重新登录
    PAUSE_PLAY_BIGWIN: "pause_play_bigwin",        // 暂停播放bigwin
    PLAY_BIGWIN: "play_bigwin",                    // 播放bigwin
    SET_SHAKE: "set_shake",                        // 开关震动
    UPDATE_REDPACK: "UPDATE_REDPACK",               // 更新红包
    HALL_EFF_SHOWCOINS: "HALL_EFF_SHOWCOINS",       // 开红包金币显示
    HALL_EFF_SHOWLUCKPACK: "HALL_EFF_SHOWLUCKPACK",       // 显示幸运红包动画节点
    HALL_EFF_OPENLUCKBOX: "HALL_EFF_OPENLUCKBOX",       // 显示开宝箱界面
    HALL_EFF_SHOWLUCKRAIN: "HALL_EFF_SHOWLUCKRAIN", //显示红包雨
    HALL_FAV_GAME_CHANGE: "HALL_FAV_GAME_CHANGE",   //喜爱的gameid发生变化
    SHOW_RED_HEART_ANI: "SHOW_RED_HEART_ANI",               //播放喜爱动画
    SHOW_SETTING: "show_setting",                    // 显示设置页面
    REGISTER_ACCOUNT: "register_account",            // 注册事件
    HALL_RECYCLE_ITEM: "HALL_RECYCLE_ITEM",            // hall回收item
    HALL_SHOW_RIBBON: "HALL_SHOW_RIBBON",            // hall显示彩带
    HALL_SHOW_WINJP: "HALL_SHOW_WINJP",            // hall 显示jp中奖
    RESUME_HALL_BGM: "RESUME_HALL_BGM",    //恢复大厅的BGM
    HALL_SHOW_JP_NODE: "HALL_SHOW_JP_NODE",    //是否显示大厅的JP节点
    HALL_SHOW_CASINO: "HALL_SHOW_CASINO",            // hall 显示Casino
    SHOW_LOCK_TIP: "SHOW_LOCK_TIP",                 // 显示游戏未解锁提示
    REFUSH_LV_EXP: "REFUSH_LV_EXP",                //游戏里面刷新等级经验
    PULL_LV_UP: "PULL_LV_UP",                //游戏经验等级提升
    REFUSH_GAME_JP: "REFUSH_GAME_JP",              //同步奖池了，需要刷新奖池的值
    REFUSH_RED_TIPS: "REFUSH_RED_TIPS",             //同步小红点
    GET_JACKPOT_OTHER: "GET_JACKPOT_OTHER",        //其他玩家大奖通知
    HALL_ONETIMEONLY_TIME: "HALL_ONETIMEONLY_TIME",//one time only时间
    SHOW_LEVEL_UP_GIFT: "SHOW_LEVEL_UP_GIFT",      //等级提示获得等级礼包
    HIDE_SHOP: "HIDE_SHOP",      //隐藏Shop
    START_GAME_ID: "START_GAME_ID",        //跳转游戏
    UPDATE_STAMP: "UPDATE_STAMP",      // 更新邮票界面
    HIDE_HALL_MENU: "HIDE_HALL_MENU",  // 隐藏大厅菜单
    FB_BIND_SUCCESS: "FB_BIND_SUCCESS", //FB绑定成功
    GO_HALL_TAB: "GO_HALL_TAB",//跳转大厅的制定页面0开始
    REFUSH_PIG_BANK: "REFUSH_PIG_BANK",//刷新金猪
    CLOSE_POP_SHOP: "CLOSE_POP_SHOP", //关闭弹窗的shop
    REFUSH_HALL_BONUS_LIST: "REFUSH_HALL_BONUS_LIST",//刷新bonus列表
    UPTATE_HALL_TOP_POSITION: "UPTATE_HALL_TOP_POSITION", //刷新Top节点的位置
    RESET_HALL_TOP_POSITION: "RESET_HALL_TOP_POSITION", //恢复Top节点的默认位置
    CHANGE_HALLTAB: 'CHANGE_HALLTAB', //大厅切换Tab
    PAY_RESULT: 'PAY_RESULT',       //支付结果通知 0 失败 1 成功
    REFUSH_QUEST_PRO: 'REFUSH_QUEST_PRO',      //刷新Quest在游戏中的进度
    CLOSE_BIG_LV_UP: 'CLOSE_BIG_LV_UP',      //关闭每5级的大的升级弹窗
    HEROCARD_CHANGE_CAMP: 'HEROCARD_CHANGE_CAMP', //Herocard切换势力
    SCROLL_HALL_GAME: 'SCROLL_HALL_GAME',   //大厅滚动到某个游戏
    HEROCARD_CHANGE_CARD: 'HEROCARD_CHANGE_CARD', //Herocard切换卡牌
    COMM_ITEM_ADD: 'COMM_ITEM_ADD', //物品数量变化
    GET_GUIDETASK_REFUSH: 'GET_GUIDETASK_REFUSH', //刷新引导任务
    OPEN_BINGO: 'OPEN_BINGO', //打开bingo
    OPEN_EXPLORATION: 'OPEN_EXPLORATION', //打开骑士的探索
    SLIVERICON_SHOW: 'SLIVERICON_SHOW', //银锤子的入口显示
    HEROPALACE_SHOW: 'HEROPALACE_SHOW', //打开富豪厅
    HEROPALACE_CLOSE: 'HEROPALACE_CLOSE', //关闭富豪厅
    HEROPALACE_REFUSH: 'HEROPALACE_REFUSH', //刷新富豪厅
    REFUSH_BONUS_ONLINE_TIME: 'REFUSH_BONUS_ONLINE_TIME', //刷新BOUNSE-online的剩余时间
    RECORD_HALL_SCROLL: 'RECORD_HALL_SCROLL', //记录大厅滚动位置
    UPATE_DIAMOND: 'UPATE_DIAMOND',     //更新钻石数量
    SET_RED: 'SET_RED',                         //显示首充小红点
    CLOSE_FIRST_ICON: 'CLOSE_FIRST_ICON',      //关闭首充大厅按钮
    CLEAN_LOCAL_RED: 'CLEAN_LOCAL_RED',   //清除本地红点
    CLEAN_ACHIEVE_RED: 'CLEAN_ACHIEVE_RED',     //清除成就红点
    REFUSH_SPINE100_DATA: 'REFUSH_SPINE100_DATA',//100次选择送卡包的活动
    CHANGE_PROCESSLEN: 'CHANGE_PROCESSLEN',//选择碎片对应的进度条更改
    FILL_HERO_PIECES: 'FILL_HERO_PIECES',  //点击fill按钮填充
    HAS_REWARDS: 'HAS_REWARDS',//奖励已经领取完
    CHAT_RANK_BET: 'CHAT_RANK_BET', //聊天排行押注
    CHECK_HALL_USERACTION: 'CHECK_HALL_USERACTION',  //大厅的用户注册消息
    CHAT_RANK_BET_CONFIRM: 'CHAT_RANK_BET_CONFIRM', //聊天押注成功
    STOP_SCROLL: 'STOP_SCROLL',   //碎片转盘停止滚动
    NEWGUIDE_PRO_UI: 'NEWGUIDE_PRO_UI',  //引导结束处理UI逻辑，带引导id参数
    CLICK_SKIP: 'CLICK_SKIP',   //点击了跳过碎片按钮
    MISSION_CLOSE: 'MISSION_CLOSE',//关闭任务界面
    MISSION_REWARDS: 'MISSION_REWARDS',//领取奖励
    MISSION_RED_TIPS: 'MISSION_RED_TIPS',//任务小红点
    MISSION_REFUSH: 'MISSION_REFUSH', //刷新任务列表
    CLOSE_CASHBACK: 'CLOSE_CASHBACK',//显示小钱袋弹窗
    UPDATE_USER_HEAD_PICID: 'UPDATE_USER_HEAD_PICID',//更新头像勾选
    CLOSE_USER_HEAD: 'CLOSE_USER_HEAD',//关闭选择头像界面
    SHOW_USER_HEAD_TIP: 'SHOW_USER_HEAD_TIP',  //展示未解锁头像选择提示
    REFUSH_HEROCARD_RED_TIPS: 'REFUSH_HEROCARD_RED_TIPS', //显示卡牌小红点数量
    HIDE_ALREADY_ACCOUNT: 'HIDE_ALREADY_ACCOUNT',  //隐藏已有账号按钮
    UPATE_SAFE: 'UPATE_SAFE', //更新保险箱

    SLOT_MOVE: "slot_move",                          // 移动
    SLOT_STOP: "slot_stop",                          // 停止
    SLOT_AUTO_PLAY: "slot_auto_play",                // 自动播放
    SLOT_STOP_AUTO: "slot_stop_auto",                // 停止自动播放
    SLOT_STOP_MOVE: "slot_stop_move",                // 停止旋转
    SLOT_STOP_SELECT_MOVE: "slot_stop_select_move",  // 停止选中的旋转
    SLOT_START_MOVE: "slot_start_move",              // 开始移动
    SLOT_RANK: "slot_rank",                          // 锦标赛时榜
    SLOT_RANK_RESULT: "slot_rank_result",            // 锦标赛时榜结果
    SLOT_START_SELECT_MOVE: "slot_start_select_move",// 选中的开始移动
    SLOT_PLAY_LINE_FINISH: "slot_playline_finish",    // 播放线型完成
    SLOT_PLAY_LINE: "slot_playline",                  // 正在播放线型
    SLOT_BEANS_EVENT: "slot_beans_event",            // 金豆事件
    SLOT_PLAY_BG: "slot_play_bg",                    // 播放背景
    SLOT_PLAY_LINE_INDEX: "slot_play_line_index",    // 播放线路
    SLOT_PLAY_ITEM: "slot_play_item",                // 播放中奖item
    SLOT_PLAY_ALLITEM: "slot_play_allitem",          // 播放全屏中奖
    SLOT_GAME_RATE: "slot_game_rate",                // 倍率选择
    SLOT_GAME_START: "slot_game_start",              // 游戏开始
    SLOT_NEED_CHANG_YAZHU: "slot_need_chang_yazhu",  // 需要调整押注
    SLOT_PLAY_STOP_SOUND: "slot_play_stop_sound",    // 播放停止音效
    SLOT_DRAW_LINE: "slot_draw_line",                // 画线
    SLOT_ADJUST_LINE: "slot_adjust_line",            // 调整压线
    SLOT_SHOW_LINE: "slot_show_line",                // 显示线路
    SLOT_SPIN_LINE_STOP: "slot_spin_line_stop",      // 一列停止
    SLOT_LINE_STOP_SOUND: "slot_line_stop_sound",    // 一列音效
    SLOT_PAUSE_DRAW_LINE: "slot_pause_draw_line",    // 暂停画线
    SLOT_UPDATE_COIN: "slot_update_coin",            // 更新金币
    SLOT_PLAY_WIN_SOUND: "slot_play_win_sound",      // 播放赢取金币音效
    SLOT_SHOW_SPEED_FRAME: "slot_show_speed_frame",  // 显示高亮提醒框
    SLOT_HIDE_SPEED_FRAME: "slot_hide_speed_frame",  // 隐藏高亮提醒框
    SLOT_ENTER_FREE_GAME: "slot_enter_free_game",    // 进入免费游戏
    SLOT_EXIT_FREE_GAME: "slot_exit_free_game",      // 退出免费游戏
    SLOT_PLAY_SCATTER_BOUNS: "slot_play_scatter_bouns",    // 播放scatter牌音效
    SLOT_PLAY_SCATTER_ITEM: "slot_play_scatter_item",// 播放scatter牌音效
    SLOT_PLAY_FREEGAME_BGMUSIC: "slot_play_freegame_bgmusic",    // 播放免费游戏音效
    SLOT_STOP_FREEGAME_BGMUSIC: "slot_stop_freegame_bgmusic",    // 停止免费游戏音效
    SLOT_PLAY_HELP_BGMUSIC: "slot_play_help_bgmusic",    // 播放帮助页面音效
    SLOT_STOP_HELP_BGMUSIC: "slot_stop_help_bgmusic",    // 停止帮助页面音效播放
    SLOT_PLAY_WILD_SOUND: "slot_play_wild_sound",        // 播放wild音效
    SLOT_PLAY_LINE_SOUND: "slot_play_line_sound",  // 播放线路音效
    SLOT_PLAY_ADJUST_LINE_SOUND: "slot_play_adjust_sound",  // 播放线路调整音效
    SLOT_SHOW_SUBGAME_SOUND: "slot_show_subgame_sound",  // 播放出现子游戏音效
    SLOT_MANUAL_CLICK_LINE: "SLOT_MANUAL_CLICK_LINE",    //手动点击某一列(会带手动旋转那列的参数)
    SLOT_PLAY_LINE_CLICK: "SLOT_PLAY_LINE_CLICK",    //线路加减点击
    SLOT_PLAY_5SAME_LINE_SOUND: "SLOT_PLAY_5SAME_LINE_SOUND",  // 播放五同线路
    SLOT_MANUAL_STOP_MOVE_DELAY_TIME: "slot_manual_stop_move_delay_time",    //手动停止之后，才开始线路中奖播放
    SLOT_PLAY_UNLOOP_BGM: "SLOT_PLAY_UNLOOP_BGM",    //播放不循环的bgm
    SLOT_UPDATE_TOTALBET: "SLOT_UPDATE_TOTALBET",    //更新押注额
    SLOT_CHANGE_BET_IDX: "SLOT_CHANGE_BET_IDX", //切换押注档位
    SLOT_REFUSH_ENERGY: "SLOT_REFUSH_ENERGY", //刷新能量
    SLOT_TOTALBET_UPDATED: "SLOT_TOTALBET_UPDATED",    //押注额已更新
    SLOT_JACKPOOL_LOCK_CHANGE: "SLOT_JACKPOOL_LOCK_CHANGE",//奖池锁定状态变化通知
    SLOT_SHOW_HEADFOOTER_MASK: "SLOT_SHOW_HEADFOOTER_MASK",//通知显示上下的mask


    SLOT_CLEAR_ALLITEMS_ANI: "SLOT_CLEAR_ALLITEMS_ANI",  //隐藏缩放的items的动画，只是接口需要的调用，上层不会统一调用
    SLOT_SET_TOUCH_ITEMNODE: "SLOT_SET_TOUCH_ITEMNODE", //是否可以点击itemnode：单列选择
    SLOT_CLOSE_SPIN_DELAY: "SLOT_CLOSE_SPIN_DELAY",      //单局关闭按钮延迟开启
    SLOT_PLAY_FREE_SOUND_MUMAL: "SLOT_PLAY_FREE_SOUND_MUMAL", //主动调用播放中免费的声音

    SLOT_PLAY_FREE_ACTION_FINISH: "slot_play_free_spine_finish",    // 播放免费游戏动画完成
    SLOT_PLAY_LINE_ONE_ROUND: "slot_play_line_one_round",    // 播放线型完成一圈
    SLOT_PLAY_FREE_ACTION: "slot_play_free_spine",    // 播放免费游戏动画

    SLOT_CLEAR_LINE_LIST: "slot_clear_line_list",  // 清空线条
    SLOT_START_OTHER_MOVE: "slot_start_other_move",  // 剩余的开始滚动
    SLOT_START_ALL_MOVE: "slot_start_all_move",      // 全部开始滚动
    SLOT_CAN_TOUCH: "slot_can_touch",                // 是否能点击单列

    SLOT_PLAY_SCATTER: "slot_play_scatter",         //播放scatter
    SLOT_SECRETBOX_OPEN: "slot_secretbox_open",      //随机盒打开
    SLOT_SECRETBOX_FINISH: "slot_secretbox_finish",   //随机盒关闭

    SLOT_GREAT_BULE_FREE_TIMES: "slot_great_bule_free_times",     // 伟大蓝色免费次数选择
    SLOT_BEANS_PLAY_FINISH: "slot_beans_play_finish",             // 财神到金豆播放完成
    SLOT_PLAY_FREEGAME_WINCOINS: "slot_play_free_game_wincoins",    // 免费游戏赢钱动画
    SLOT_PLAY_FREEGAME_WINCOINS_FINISH: "slot_play_freegame_wincoins_finish", // 免费游戏赢钱动画播放完成
    SLOT_TK_FREE_GAME: "slot_tk_free_game",          // 三国免费游戏

    SLOT_CHOOSE_LOTUS_FLOWER: "slot_choose_Lotus_Flower",    // 金莲花，选择莲花
    SLOT_CHOOSE_LOTUS_FLOWER_FINISH: "slot_choose_Lotus_Flower_finish",  //金莲花，选择莲花结束

    SLOT_ENTER_SUBGAME: "slot_enter_subgame",        // 进入子游戏
    SLOT_EXIT_SUBGAME: "slot_exit_subgame",          // 离开子游戏
    SLOT_SUBGAME_ACTION: "slot_subgame_action",      //子游戏动作
    SLOT_SUBGAME_DATA: "slot_subgame_data",         //子游戏内通信
    SLOT_SUBGAME_WIN: "slot_subgame_action",      //子游戏胜利
    SLOT_SUBGAME_LOSE: "slot_subgame_action_finish",    //子游戏失败

    // 封神榜
    SLOT_ALLSCREENGAME_ACTION_SHOW: "slot_allscreengame_action_show",          //显示封神榜全屏动画
    SLOT_ALLSCREENGAME_ACTION_HIDE: "slot_allscreengame_action_hide",          //隐藏封神榜全屏动画
    SLOT_ALLSCREENGAME_MOVE: "slot_allscreengame_move",                          //封神榜全屏滚动
    SLOT_ALLSCREENGAME_STOP: "slot_allscreengame_stop",                          //封神榜全屏滚动停止
    SLOT_ALLSCREENGAME_NEXT_ROUND: "slot_allscreengame_next_round",              //封神榜全屏游戏 请求下一次旋转
    SLOT_FIVE_ELEMENTS_SIMPLE_ANIMATION: "SLOT_FIVE_ELEMENTS_SIMPLE_ANIMATION",   //金木水火土 小动画的音效
    SLOT_FIVE_ELEMENTS_SPEED_UP: "SLOT_FIVE_ELEMENTS_SPEED_UP",      //五元素加速
    SLOT_ALLGODLISTEN_ENTER: "slot_allgodlisten_enter",           //进入正神听令
    SLOT_ALLGODLISTEN_PLAY: "slot_allgodlisten_play",             //播放正神听令

    SLOT_HELP_ENTER: "slot_help_enter",       //进入帮助
    SLOT_HELP_CLOSE: "slot_help_close",       //关闭帮助

    SLOT_PLAY_ALLGODLISTEN_BG: "slot_play_allgodlisten_bg",            // 播放正神听令背景
    SLOT_PLAY_ALLGODLISTEN_RUN: "slot_play_allgodlisten_run",          // 播放正神听令运行
    SLOT_PLAY_ALLGODLISTEN_STOP: "slot_play_allgodlisten_stop",          // 播放正神听令停止
    SLOT_PLAY_ALLGODLISTEN_ELE: "slot_play_allgodlisten_ele",            // 播放正神听令中奖
    SLOT_PAUSE_AUTO: "slot_pause_auto",                                // 暂停自动
    SLOT_RESUME_AUTO: "slot_resume_auto",                               // 恢复自动

    SLOT_ADD_SPEED: "slot_add_speed",                                // 加速
    SLOT_RESTORE_SPEED: "slot_restore_speed",                       // 恢复默认速度

    SLOT_SHZ_BIBEI_DIAN: "slot_shz_bibei_dian",                     //水浒传比倍点数
    PLAY_SOUND_BT_XIAZHU: "play_sound_bt_xiazhu",                   //水浒传押注
    PLAY_SOUND_BT_DICE: "play_sound_bt_dice",                       //水浒传摇骰子
    PLAY_SOUND_BT_RESULT: "play_sound_bt_result",                   //水浒传输赢
    PLAY_SOUND_BT_CUICU: "play_sound_bt_cuicu",                   //水浒传催促
    // PLAY_SOUND_SHZ_FULL:'play_sound_shz_full',                      //水浒传全屏奖励音效
    PLAY_SOUND_MARY_OUT: "play_sound_mary_out",                     // 玛丽游戏移动音效
    HIDE_BIG_WIN: "hide_big_win",                                   // 隐藏bigwin
    CLICK_HIDE_BIG_WIN: "click_hide_big_win",                       // 点击后隐藏bigwin
    PLAY_FINISHED_BIG_WIN: "play_finished_big_win",                 // bigwin动画正常播放一轮后
    CALL_BIGWIN_EFFECT: "call_bigwin_effect",                    // 其它模块调用bigwin效果，如奖金熊小游戏之后

    PLAY_BONUS_EAT: "play_bonus_Eat",                        //奖金熊吃
    PLAY_BONUS_FALL: "play_bonus_Fall",                      //奖金熊失败
    PLAY_BONUS_LUODI: "play_bonus_LuoDi",                    //奖金熊落地
    PLAY_BONUS_PA: "play_bonus_Pa",                          //奖金熊爬树 
    PLAY_BONUS_ZHE: "play_bonus_Zhe",                        //奖金熊蜜蜂哲 
    PLAY_BONUS_AMBIENT: "play_bonus_ambient",                //奖金熊开始
    PLAY_BONUS_FINISH: "play_bonus_finish",                  //奖金熊完成 
    PLAY_BONUS_GAMEOVER: "play_bonus_gameover",              //奖金熊结束

    PLAY_BONUS_GAME_BG: "play_bonus_game_bg",                //玉女心经小游戏背景音乐
    PLAY_WINCOIN_FINISH: "play_wincoin_finish",              // 播放结算动画完成
    SLOT_MAX_RATE: "slot_max_rate",


    PLAY_ROBIN_DISPPERA_FINISH: "play_robin_disppera_finish",    // 罗宾消失动画
    PLAY_ROBIN_LINE: "play_robin_line",                       // 播放罗宾中奖线路
    PLAY_SHOW_ROBIN: "play_show_robin",                       // 显示罗宾汉
    PLAY_ROBIN_FREE_WIN: "play_robin_free_win",               // 罗宾免费游戏赢钱
    FINISH_ROBIN_SUB_FREE: "finish_robin_sub_free",           // 罗宾免费游戏多次消除完成
    START_ROBIN_FREE_GAME: "start_robin_free_game",           // 开始罗宾免费游戏
    START_ROBIN_CLEAR_UP: "start_robin_clear_up",             // 开始消除
    PLAY_FREEGAME_BG: "play_freegame_bg",                     // 播放免费游戏音效
    PLAY_SHOOT_SOUND: "play_shoot_sound",                     // 射箭音效
    SHOW_ROBIN_WILD: "show_robin_wild",                       // 罗宾射箭显示wild动画完成.
    PLAY_ROBIN_WILD_SOUND: "play_robin_wild_sound",           // 罗宾汉wild音效
    PLAY_ROBIN_CLEAR_ELE: "play_robin_clear_ele",             // 罗宾汉消除音效
    PLAY_SHOW_ARROW_SOUND: "play_show_arrow_sound",           // 箭头出现音效
    ROBIN_UPDATE_COIN: "robin_update_coin",                   // 罗宾汉连续消除结算
    ROBIN_PLAY_WIN_LINE: "WITSH_PLAY_WIN_LINE",               // 中线播音效
    ROBIN_FREEGAME_COME: "ROBIN_FREEGAME_COME",               // 免费游戏出现
    ROBIN_FREE_GAME_WINEFF: "ROBIN_FREE_GAME_WINEFF",         // 免费游戏结束出现撒金币是播放音效
    ROBIN_SHOW_FREEBLANCE: "ROBIN_SHOW_FREEBLANCE",           // 通知显示freebalance
    PLAY_ROBIN_ROUND_FINNAL_COIN: "PLAY_ROBIN_ROUND_FINNAL_COIN",//通知金币同步到最新    

    PLAY_BIBEI_RESULT: "play_bibei_result",                   // 比倍结果
    PLAY_DOLPHIN_JUMP: "play_dolphin_jump",                   // 海豚跳跃音效
    PLAY_TK_BOUNSGAME_MOVE: "play_tk_bounsgame_move",         // 播放三国小玛丽旋转音效
    PLAY_TK_GUANYU_SHOW: "play_tk_guanyu_show",               // 播放三国小玛丽关羽出现音效

    PLAY_GB_SHELL_BG_MUSIC: "play_gb_shell_bg_music",         // 播放选伟大蓝色选贝壳背景音乐,
    STOP_GB_SHELL_BG_MUSIC: "stop_gb_shell_bg_music",         // 播放选伟大蓝色选贝壳背景音乐,
    PLAY_OPEN_SHELL: "play_open_shell",                       // 打开贝壳
    PLAY_SELECT_SHELL_OVER: "play_select_shell_over",         // 选择贝壳结束
    SET_OPEARATE_ENABLE: "set_opearate_enable",               //
    SLOT_LINE_MULT_SOUND: "slot_line_mult_sound",             // 播放线路倍率的声音
    PLAY_ALL_LINE: "play_all_line",                           // 播放所有线路

    PLAY_SHOW_JINLIAN_SOUND: "play_show_jinlian_sound",              // 出现潘金莲
    PLAY_SHOW_JINLIAN_SHOUT_SOUND: "play_show_jinlian_shout_sound",  // 潘金莲叫声
    PLAY_SPECIL_BOUNS_SOUND: "play_specil_bouns_sound",              // 免费游戏特殊奖励
    PLAY_SPECIL_BOUNS_END_SOUND: "play_specil_bouns_end_sound",      // 免费游戏特殊奖励框结束显示
    STOP_SPECIL_BOUNS_END_SOUND: "stop_specil_bouns_end_sound",      // 停止播放 “免费游戏特殊奖励框结束显示”
    SLOT_ALLIN: "slot_allin",

    PLAY_SHOW_BOXER_SOUND: "play_show_boxer_sound",             // 泰国神游拳手显示
    SHOW_SHOOT_ACTION: "show_shoot_action",                     // 显示踢球动画
    FINISH_SHOOT_ACTION: "finish_shoot_action",                 // 踢球动画完成

    PLAY_SHOW_GUANYU_WILD1_SOUND: "play_show_guanyu_wild1_sound",         // 出现关羽
    PLAY_SHOW_GUANYU_WILD2_SOUND: "play_show_guanyu_wild2_sound",         // 关羽砍刀动画

    //slots 西部牧场
    PLAY_BONUS_PLAY_BGM: "bonus_play_bgm",                   // 播放特殊背景音乐
    PLAY_BONUS_STOP_BGM: "bonus_stop_bgm",                   // 播放特殊背景音乐
    PLAY_BONUS_DOOR_OPEN_SOUND: "bonus_door_open",           // 开门
    PLAY_BONUS_DOOR_CLOSE_SOUND: "bonus_door_close",         // 关门
    PLAY_BONUS_BOOM_BURST_SOUND: "bonus_boom_burst",         // 炸弹爆炸声
    PLAY_BONUS_BOOM_THROW_SOUND: "bonus_boom_throw",         // 扔炸弹声音
    PLAY_BONUS_SHOOT_SOUND: "bonus_shoot",                   // 开枪声音
    PLAY_BONUS_SHOOT_FAIL_SOUND: "bonus_shoot_fail_ting",    // 开枪未打中目标声音
    PLAY_BONUS_SHOOT_SUCC_SOUND: "bonus_shoot_succ_clash",   // 开枪打中目标声音

    //slots 魔术师
    PLAY_BONUS_RESULT_SHOW_SOUND: "bonus_result_show",               //  中奖结果显示
    PLAY_FREE_GAME_GET_MUL_SOUND: "free_game_get_mul",               //  免费游戏中获得倍数奖励时的音效（烟花爆炸后）
    PLAY_FREE_GAME_FIREWORK_SOUND: "free_game_firework",             //  免费游戏中烟花爆炸的音效
    PLAY_MAGICIAN_BGM: "magician_play_bgm",                          //  选择帽子时的界面背景音效 40.bonus1_bgm
    PLAY_MAGICIAN_HATGAME_FIRE_BOBM: "magician_hatgame_fire_bomb",   //  帽子游戏爆炸一次就播放一次音效 41.bonus_hit
    PLAY_MAGICIAN_HATGAME_COME: "magician_hatgame_come",             //  爆出帽子动画时播放一次（每出现一个播放一次） 42.bonus_come
    PLAY_MAGICIAN_HATGAME_SELECT: "magician_hatgame_select",         //  选择完一个帽子后播放一次  44.bonus_sel
    PLAY_MAGICIAN_BUFFOON_BOX_JUMP: "PLAY_MAGICIAN_BUFFOON_BOX_JUMP",      //  小丑跳出的音效
    PLAY_MAGICIAN_BUFFOON_BOX_UP1: "PLAY_MAGICIAN_BUFFOON_BOX_UP1",        //  数字变化的阶段音效
    PLAY_MAGICIAN_BUFFOON_BOX_UP2: "PLAY_MAGICIAN_BUFFOON_BOX_UP2",        //  数字变化的阶段音效
    PLAY_MAGICIAN_BUFFOON_BOX_UP3: "PLAY_MAGICIAN_BUFFOON_BOX_UP3",        //  数字变化的阶段音效
    PLAY_MAGICIAN_BUFFOON_BOX_UP4: "PLAY_MAGICIAN_BUFFOON_BOX_UP4",        //  数字变化的阶段音效

    //slots 农场故事
    PLAY_COW_SHOUT_SOUND: "play_cow_shout_sound",                    //  牛叫声, 出现羊群时播放一次（变万能牌玩法）
    PLAY_SHEEP_SHOUT_SOUND: "play_sheep_shout_sound",                //  羊叫声, 出现羊群时播放一次（变万能牌玩法）
    PLAY_WOLF_BLUSTER_SOUND: "play_wolf_bluster_sound",              //  狼的咆哮声（每一列变成WILD时也播放一次）
    PLAY_ANIMAL_RUN_SOUND: "play_animal_run_sound",                  //  跑步的音效（变万能牌玩法）
    PLAY_SUSLIKS_SOUND: "play_susliks_sound",                        //  地鼠出现音效
    PLAY_SUSLIKS_OUT_SOUND: "play_susliks_out_sound",                //  地鼠消失音效
    PLAY_WOLF_COME_SOUND: "play_wolf_come_sound",                    //  狼出场时播放一次（变万能牌玩法）
    PLAY_WOLF_BACK_SOUND: "play_wolf_back_sound",                    //  狼离场时播放一次（变万能牌玩法）

    //slots 石器时代
    PLAY_FREE_GAME_EGG_BREAK_SOUND: "free_game_egg_break_firework",   //  免费游戏中蛋碎了的音效
    PLAY_EGG_BIRD_FLY_SOUND: "play_egg_bird_fly_sound",               //  小鸟叫声（一次）飞入屏幕时播放一次 和 砸蛋游戏开场恐龙飞翔的音效
    PLAY_EGG_GAMEOVER_SOUND: "play_egg_gameover_sound",               //  砸蛋游戏结束时播放
    PLAY_EGG_HITS_SOUND: "play_egg_hits_sound",                       //  蛋被砸的音效（砸一次播一次）
    PLAY_STONE_VOLCANIC_FIRE_SOUND: "play_stone_volcanic_fire_sound", //  火山喷火
    PLAY_STONE_HITS_SOUND: "play_stone_hits_sound",                   //  敲击矿石的音效    七次
    PLAY_STONE_GET_GOLD_SOUND: "play_stone_get_gold_sound",           //  获得金矿石的音效
    PLAY_STONE_FAIL_SOUND: "play_stone_fail_sound",                   //  未获金矿石播放一次
    SLOT_FREEGAME_SHOW_RATE_FINISHED: "SLOT_FREEGAME_SHOW_RATE_FINISHED", // 免费游戏倍率显示完之后才开始播放线路

    //slots 精灵花园
    PLAY_FREE_GAME_FAIRY_GARDEN_RAND_SOUND: "freegame_fairy_garden_rand",   //  免费一下中rand特效音效
    PLAY_FLOWER_OPEN_SOUND: "subgame_flower_open",                          //  鲜花打开时的音效
    PLAY_FLOWER_JUMUP_SOUND: "subgame_flower_jumup",                        //  数字增加一次就播放一次
    PLAY_FLOWER_CLOSE_SOUND: "subgame_flower_close",                        //  关闭鲜花时播放
    PLAY_FLOWER_END_SOUND: "subgame_flower_end",                            //  鲜花游戏结束时播放
    PLAY_WHEEL_COME_SOUND: "subgame_wheel_come",                            //  出现转盘时播放一次
    PLAY_WHEEL_START_SOUND: "subgame_wheel_start",                          //  转盘开始转动时播放一次
    PLAY_WHEEL_WIN_SOUND: "subgame_wheel_win",                              //  转盘中的倍数时播放一次

    //slots 海洋世界
    PLAY_BONUS1_GET_COIN_JUMSU_SOUND: "play_bonus1_get_coin_jumsu",         //  采珠小游戏珍珠打开后展示分数时播放一次
    PLAY_BONUS1_SEASHELL_OPEN_SOUND: "play_bonus1_seashell_open",           //  采珠小游戏选择珍珠和打开的音效
    PLAY_BONUS_BOX_OPEN_SOUND: "play_bonus_box_open",                       //  开宝箱小游戏开箱时的音效
    PLAY_BONUS_BOX_STOP_SOUND: "play_bonus_box_stop",                       //  开宝箱小游戏每一列宝箱掉下来的停止音效
    PLAY_BONUS_GOLD_GATES_OPEN_SOUND: "play_bonus_gold_gates_open",         //  金门宝藏小游戏选中门之后打开的音效

    //slots 皇帝来了
    PLAY_DOUPENG_SOUND: "play_doupeng_sound",                               //  人物甩动斗篷伸展的音效
    PLAY_KING_ENTER_SOUND: "play_king_enter_sound",                         //  第一次进游戏时点旋转时播放一次，就算再点旋转也会播完
    PLAY_ITEMS_DOWN_SOUND: "play_items_down_sound",                         //  消除图标后新图标下落时播放一次，出现新图标开始下落就播 叮
    PLAY_ITEMS_ELIMINATE_SOUND: "play_items_eliminate_sound",               //  消除图标时播放一次
    PLAY_SPECIAL_REWARD_APPLAUD_SOUND: "play_special_reward_applaud_sound", //  触发额外奖励时播放一次，免费游戏内触发不播

    //slots 发大财
    PLAY_EGG_GAME_HAMMER_SOUND: "play_egg_game_hammer_sound",               //  财神特别游戏敲蛋破碎音效
    PLAY_EGG_GAME_EGG_BROKEN_SOUND: "play_egg_game_egg_broken_sound",       //  财神特别游戏敲破蛋后展示结果哗的音效
    SLOT_AUTO_MODULE_IMMEDIATELY_STARG_GAME: "SLOT_AUTO_MODULE_IMMEDIATELY_STARG_GAME",  // 自动模式部分游戏闪3次后，立即进入下一

    //slots 樱桃的爱
    SLOT_CHERRY_LOVE_FREEGAME_CONTINUE: "SLOT_CHERRY_LOVE_FREEGAME_CONTINUE",       // 樱桃的爱，比倍游戏结算框 btn被点击
    SLOT_LAST_FREEGAME_SHOW_BIBEI_BTN: "SLOT_LAST_FREEGAME_SHOW_BIBEI_BTN",         // 比倍游戏结算框之后，然后弹出比倍按钮

    //slots 珍宝岛
    SLOT_YE_EXCLAMATION_SHOW_SOUND: "SLOT_YE_EXCLAMATION_SHOW_SOUND",                 // 出现感叹号 “！” 警报时播放一次
    SLOT_YE_SEA_MOVE1_SOUND: "SLOT_YE_SEA_MOVE1_SOUND",                               // 第1次移动海面时移动时播放一次
    SLOT_YE_SCOPE_SOUND: "SLOT_YE_SCOPE_SOUND",                                       // 打开和收起望远镜时各播放一次
    SLOT_SCOPE_FIND_YE01_BIRD_SOUND: "SLOT_SCOPE_FIND_YE01_BIRD_SOUND",               // 打开望远镜观察到海鸥时
    SLOT_SCOPE_FIND_YE02_SHIP_SOUND: "SLOT_SCOPE_FIND_YE02_SHIP_SOUND",               // 打开望远镜观察到其它船只时播放
    SLOT_SCOPE_FIND_YE03_ISLAND_SOUND: "SLOT_SCOPE_FIND_YE03_ISLAND_SOUND",           // 打开望远镜观察时发现岛屿时播放
    SLOT_CANNON_MOVE_FINISHED_STARG_SUBGAME: "SLOT_CANNON_MOVE_FINISHED_STARG_SUBGAME", //过程动画完成之后，开始小游戏
    SLOT_CANNON_START_MOVE_SOUND: "SLOT_CANNON_START_MOVE_SOUND",                      // 黄金炮筒伸出时
    SLOT_SUBGAME_START_BOOM_SOUND: "SLOT_SUBGAME_START_BOOM_SOUND",                    // 过渡到小游戏前面的 炸弹爆炸音
    SLOT_SUBGAME_SELECT_CANNON_FIRE: "SLOT_SUBGAME_SELECT_CANNON_FIRE",               // 选择炮筒开火的音效
    SLOT_SUBGAME_NO_BOOM_WATER: "SLOT_SUBGAME_NO_BOOM_WATER",                         // 炮弹没击中对面船只时播放，落水的声音
    SLOT_SUBGAME_BOOM_SHIP: "SLOT_SUBGAME_BOOM_SHIP",                                 // 炮弹击中对面船只爆炸时
    SLOT_SUBGAME_UPDATE_WINSCORE_LIST: "SLOT_SUBGAME_UPDATE_WINSCORE_LIST",           // 加农炮游戏， 获得分数时显示到左侧表单上时播放一次（右图）
    SLOT_SUBGAME_MAP_WINSCORE_SOUND: "SLOT_SUBGAME_MAP_WINSCORE_SOUND",               // 藏宝图游戏得分时的音效
    SLOT_SUBGAME_MAP_DIE_SOUND: "SLOT_SUBGAME_MAP_DIE_SOUND",                         // 移动到骷髅上时，船只爆炸的音效
    SLOT_SUBGAME_MAP_WARP_SOUND: "SLOT_SUBGAME_MAP_WARP_SOUND",                       // 传送门音效
    SLOT_SUBGAME_MAP_SHIPMOVE_SOUND: "SLOT_SUBGAME_MAP_SHIPMOVE_SOUND",               // 藏宝图玩法中船只移动时的音效，每一步都播放一次

    //DRAGON5
    SLOT_ENTER_SELECT_FREEGAME: "slot_enter_select_freegame",        //进入选择免费次数界面
    SLOT_EXIT_SELECT_FREEGAME: "slot_exit_select_freegame",        //离开选择免费次数界面
    //end

    PLAY_POKER_BLINK_SOUND: "play_poker_blink_sound",            // 扑克牌闪动
    PLAY_CLICK_POKER_SOUND: "play_click_poker_sound",            // 翻牌
    PLAY_CLICK_EASTER_EGG_SOUND: "play_click_easter_egg_sound",  // 敲鸡蛋声音
    SLOT_RALLY_CHOOSE_BGSOUND: "slot_rally_choose_bgsound",      // 拉力赛选择背景音效事件
    SLOT_CHOOSE_TIMES: "SLOT_CHOOSE_TIMES",        // 拉选择免费次数

    SLOT_TRAFFICLIGHT_RANK: "slot_trafficlight_rank",            // 播放红绿灯排名背景音效
    SLOT_TRAFFICLIGHT_READY: "slot_trafficlight_ready",          // 播放红绿灯小游戏准备音效
    SLOT_TRAFFICLIGHT_RUN: "slot_trafficlight_run",              // 播放红绿灯小游戏赛车音效
    SLOT_TRAFFICLIGHT_LIGHT: "slot_trafficlight_light",          // 播放红绿灯闪动音效

    SLOT_UPDATE_BOUNS_COIN: "slot_update_bouns_coin",            // 更新小游戏赢得钱
    SLOT_UPDATE_BONUS_COIN_BY_SPIN: "slot_update_bonus_coin_by_spin",    // 更新小游戏赢得钱 增长形式

    SLOT_OPEN_BOX_SOUND: "slot_open_box_sound",                  // 开箱子游戏
    SLOT_BOUNS_SOUND: "slot_bouns_sound",                        // 奖励音效

    // 阿拉丁
    SLOT_CHANG_CARD_ACTION: "slot_chang_card_action",            // 变牌动画
    SLOT_SHOW_CHANG_CARD: "slot_show_chang_card",                // 显示变化的牌
    SLOT_PLAY_CHANG_CARD_LINE: "slot_play_chang_card_line",      // 播放变牌后的中奖线路
    SLOT_PLAY_START_CHANGE: "slot_play_start_change",            // 开始播放变牌
    SLOT_PLAY_END_CHANGE: "slot_play_end_change",                // 变牌完成
    SLOT_PLAY_RANDOMBOUNS_FINISH: "slot_play_randombouns_finish",// 随机奖励播放完成
    SLOT_CHANG_WILD_START: "slot_chang_wild_start",              // 随机变万能牌
    SLOT_CHANG_WILD_FINISH: "slot_chang_wild_finish",            // 随机变万能牌结束
    SLOT_MAGIC_SOUND: "slot_magic_sound",                        // 魔术师发射魔法音效
    SLOT_CHOOSE_CARD_SOUND: "slot_choose_card_sound",            // 选择特殊牌音效
    SLOT_CHANG_CARD_LINE_SOUND: "slot_chang_card_line_sound",    // 一整列变牌音效
    SLOT_CHANG_WILD_SOUND: "slot_chang_wild_sound",              // 将牌变成万能牌音效
    SLOT_THOROW_MONEY_SOUND: "slot_thorow_money",                // 扔钱音效
    SLOT_FLIPCARD_SOUND: "slot_flipcard_sound",                  // 翻牌音效
    SLOT_CHOOSE_SOUND: "slot_choose_sound",                      // 选牌音效

    // 万圣节
    SLOT_BOUNS_GAME_FINISH: "slot_bouns_game_finish",            // 万圣节奖励动画
    SLOT_SPIN_ONELINE_SOUND: "slot_move_oneline_sound",          // 旋转一列音效

    // 万圣节惊喜
    SLOT_CHOOSE_WITCH_BG_MUSIC: "slot_choose_witch_bg_music",    // 选择女巫背景音效.
    SLOT_CHOOSE_POTION_BG_MUSIC: "slot_choose_potion_bg_music",  // 选择药水背景音效.
    SLOT_POUR_POTION_SOUND: "slot_pour_potion_sound",            // 倒药水音效
    SLOT_WITCH_FLY_SOUND: "slot_witch_fly_sound",                // 女巫飞出屏幕

    SLOT_DELAY_PLAY_WIN_EFFECT: "slot_delay_play_win_effect",    // 延迟播放结算
    SLOT_DELAY_PLAY_BIGWIN_EFFECT: "SLOT_DELAY_PLAY_BIGWIN_EFFECT",// 延迟播放bigwin 效果
    SLOT_SPIN: "slot_spin",                                      // 拉吧旋转
    SLOT_REQUEST_SPIN: "slot_request_spin",                      // 请求旋转
    SLOT_SHOW_STOP: "slot_show_stop",                            // 显示停止按钮
    SLOT_SET_ADJUST_ENABLE: "slot_set_adjust_enable",            // 设置是否可以调整押注，压线
    SLOT_CLICK_ALL_LINE: "slot_click_all_line",                  // 手动点击了所有列
    SLOT_SPIN_ONELINE: "slot_spin_oneline",                      // 旋转一列
    SLOT_DISABLE_STOP_BTN: "slot_disable_stop_btn",              // 旋转过程中的特殊动画期间要禁用掉 停止 按钮 [西部牧场，农场故事，珍宝岛，海洋世界等]

    SLOT_SHOW_FREE_BALANCE_SOUND: "slot_show_free_balance_sound", // 免费游戏结算音效
    SLOT_CLEAR_LINE: "slot_clear_line",                          // 清除线路

    //黑豹
    SLOT_PANTHER_CHANGE_SPINE_BTN: "SLOT_PANTHER_CHANGE_SPINE_BTN",
    SLOT_PANTHER_RESET_SPINE_BTN: "SLOT_PANTHER_RESET_SPINE_BTN",


    SLOT_STOP_PLAY_LINE: "SLOT_STOP_PLAY_LINE",                   //停止播放线的动画或action

    SLOT_UPDATE_BALANCE: "slot_update_balance",                    // 更新余额

    SLOT_SINGLE_SPIN_STOP: "slot_single_spin_stop",                // 单个停止

    SLOT_END_ALLSCREEN_BONUS: "slot_end_allscreen_bonus",          // 结束全屏奖
    SLOT_START_ALLSCREEN_BONUS: "slot_start_allscreen_bonus",      // 开始全屏奖
    SLOT_SHOW_ALLSCREEN_BONUS_ACTION: "slot_show_allscreen_bonus_action",
    SLOT_OPEN_SCROLL: "slot_open_scroll",                          // 打开转轴
    SLOT_START_FIGHT: "slot_start_fight",                          // 开始战斗
    SLOT_FIGHT: "slot_fight",                                      // 战斗

    SLOT_THREE_BONUS: "slot_three_bonus",                          // 三倍奖金提示
    SLOT_HIDE_MENU: "slot_hide_menu",                              // 隐藏菜单

    SLOT_FALL_SOUND: "slot_fall_sound",                            // 跌倒音效
    SLOT_CLOSE_FREE_BALANCE: "slot_close_free_balance",            // 隐藏功能奖金面板
    SLOT_CLOSE_FREE_BOUNS_FRAME: "SLOT_CLOSE_FREE_BOUNS_FRAME",    // 隐藏双赢彩奖金面板

    SLOT_PLAY_BIBEI_BG: "slot_play_bibei_bg",                       // 海豚礁 播放比倍背景音效
    SLOT_UPDATE_BIBEI_COIN: "slot_update_bibei_coin",               // 比倍 赢钱更新

    //圣斗士星矢
    SLOT_SAINT_CHANGE_BOX: "slot_saint_change_box",                  //圣斗士星矢切换箱子事件

    // 财神到
    GDF_SHOW_ITEM: "gdf_show_item",                                  // 财神到显示item
    SLOT_PLAYITEM_FINISH: "slot_playitem_finish",                    // 播放中奖动画完成
    SLOT_FREE_GAME: "slot_free_game",                                // 免费游戏
    SLOT_PLAY_SCATTER_ACTION_FINISH: "slot_play_scatter_action_finish",  // 播放scatter动画完成
    PLAY_SCATTER_SOUND: "play_scatter_sound",                        // scatter音效

    PLAY_TK_BONUS_FINISH: "play_tk_bonus_finish",                    // 三国播放小刀动画完成
    PLAY_TK_BONUS_SOUND: "play_tk_bonus_sound",                      // 播放青龙偃月刀音效

    SLOT_BONUS_BTN_SHOW: "SLOT_BONUS_BTN_SHOW",                      // 显示bonus btn

    SLOT_BALLDATA_SHOW: "slot_balldata_show",                        // 显示猜球数据
    SLOT_SHOW_BONUSGAME_RESULT: "slot_show_bonusgame_result",        // 奖励游戏结果

    //悟空slot
    WK_ADJUST_LINE_BTN: "WK_ADJUST_LINE_BTN",                        //调整线路的音效不一样，这里处理
    WK_SHOW_FREE_GAME_CHOOSE: "WK_SHOW_FREE_GAME_CHOOSE",            //免费游戏出现选择
    WK_SHOW_BTN_BACKGAME: "WK_SHOW_BTN_BACKGAME",                    //悟空菜单返回按钮
    SWK_SCATTER_FREE_FINISH: "SWK_SCATTER_FREE_FINISH",              //悟空scatter图标动画播放完

    SLOT_SHOW_OPEARATE: "slot_show_opearate",                        // bigwin用于显示按钮可操作
    SLOT_START_SOUND: "slot_start_sound",                            // 播放开始音效
    SLOT_UPDATE_FREEBALACE: "slot_update_freebalace",                // 更新免费结算数据
    SLOT_TOUCH_MOVE: "slot_touch_move",                              // 触摸转动
    SLOT_CAN_SPIN: "slot_can_spin",                                  // 可以转动

    //龙卷风
    TORNADO_OPEARATE_ENABLE: "TORNADO_OPEARATE_ENABLE",              // 龙卷风可以点击movebtn了
    SLOT_RESET: "slot_reset",                                        // 断线重连 拉吧重置
    MOCY_SHOW_ITEMMASK: "MOCY_SHOW_ITEMMASK",                        // 极限比赛显示item mask
    MOCY_SELECT_CAR: "MO_CY_SELECT_CAR",                             //极限比赛选车
    MOCY_EXIST_SUBGAME: "MOCY_EXIST_SUBGAME",                        // 极限比赛退出小游戏
    MOCY_BEGIN_SUBGAME_MOVE: "MOCY_BEGIN_SUBGAME_MOVE",              // 极限比赛开始小游戏
    MOCY_SHOW_SUBGAME: "MOCY_SHOW_SUBGAME",                          // 显示极限比赛的小游戏
    MOCY_SUBGAME_AUDIOEFF: "MOCY_SUBGAME_AUDIOEFF",                  // 播放小游戏的音效
    GREAT_CHINA_EFF: "GREAT_CHINA_EFF",                              // 中华之最音效
    SLOT_FREEBALACE_ROLL_END: "slot_freebalace_roll_end",            // 免费结算金币滚动结束
    SLOT_SET_FAST_MODE: "slot_set_fast_mode",                        // 设置快速模式

    //名利场
    SLOT_PLAY_DIAMONDBOUNS: "slot_play_diamondBouns",    // 播放钻石的音效

    //富贵熊猫
    SLOT_PLAY_STARTFREE_BGMUSIC: "slot_play_startFree_bgmusic",      //富贵熊猫开始免费游戏音效
    SLOT_STOP_STARTFREE_BGMUSIC: "slot_stop_startFree_bgmusic",      //富贵熊猫停止免费游戏音效
    SLOT_PLAY_PANDADOWN_SOUND: "slot_paly_pandaDown_sound",          //富贵熊猫熊猫落下音效

    // Sun Goddess
    SLOT_SUNGODDESS_ENTER_EXPANDGAME: "slot_sungoddess_enter_expandgame",       //进入免费游戏
    SLOT_SUNGODDESS_ENTER_PICKBONUSGAME: "slot_sungoddess_enter_pickbonusgame", // 进入选小刀游戏
    SLOT_SUNGODDESS_CHOOSE_KNIFE: "slot_sungoddess_choose_knife",       // 选小刀

    SLOT_SUNGODDESS_ENTER_SUNGODDESS: "slot_sungoddess_enter_sungoddess",   // 进入女神免费
    SLOT_SUNGODDESS_UPDATE_WINCOIN: "slot_sungoddess_update_wincoin",   // 更新赢钱
    SLOT_SUNGODDESS_CHOOSE_SHIELD: "slot_sungoddesss_choose_shield",    // 选盾牌
    SLOT_SUNGODDESS_ENTER_SHIELDGAME: "slot_sungoddess_enter_shieldgame",   // 进入盾牌游戏



    //老虎
    SLOT_ENERGYGAME_OperationOVER: "slot_energygame_operationover",              //老虎能量游戏操作结束(回到旋转界面)
    SLOT_TIGER_BONUSTIPS: "slot_tiger_bonustips",                                //老虎bonus游戏显示提示
    SLOT_TIGER_SHOWGOLDCOIN: "slot_tiger_showgoldcoin",                          //同时展示金币对象
    SLOT_TIGER_STARTBONUS: "slot_tiger_startbonus",                              //开始bonus游戏
    SLOT_CLOSE_SPIN: "slot_close_spin",                                          //关闭spin


    //墨西哥帅哥
    GAME423_SHOW_WHEEL_RESULT: "GAME423_SHOW_WHEEL_RESULT",

    PLAYER_ENTER_ROOM : "player_enter_room",          // 玩家加入
    CLEAR_DESK : "clear_desk",                        // 清理桌面
    PLAYER_LEAVE_ROOM :"player_leave_room",         // 玩家离开房间
    PLAYER_ALREADY : "player_already",               // 玩家已经准备
    PLAYER_READY_FAIL : "player_ready_fail",          // 玩家已经准备
    RECONNECT_DESKINFO : "reconnect_deskinfo",      // 断线重连数据
    OFFLINE_STATUS : "offline_status",                // 离线状态
    MONEY_CHANGED : "money_changed",                  // 金币变化
}