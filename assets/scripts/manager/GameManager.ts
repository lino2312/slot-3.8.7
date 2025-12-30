import { _decorator, assetManager, AssetManager, Component, director, find, game, Label, sys, UITransform, v3, WebView } from 'cc';
import { App } from '../App';
import { Config } from '../config/Config';
import { GameDataCfg } from "../config/GameDataCfg";
import { GameData } from "../data/GameData";
import { UserData } from '../data/UserData';
import { GameHall } from '../GameHall';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private isSendFbBind: boolean = false;
    private lastFCMToken: any;
    private isBackground: boolean;

    private loginConfig: any;
    private vipUserData: any;
    private enterGameId = -1;
    private favoriteGameList: any;
    private gameCategoryList: any;
    private allGameList: any;
    private slotsList: any;
    private popParams: any;
    private notEnoughCoinPopList: any;
    private updateIntervalTime = 0;
    private hallBundle: AssetManager.Bundle = null;

    protected onLoad(): void {
        App.GameManager = this;

    }

    start() {

    }

    update(deltaTime: number) {
        this.updateIntervalTime += deltaTime;
        if (this.updateIntervalTime >= 1000) {
            this.updateIntervalTime = 0;
            App.PlatformApiMgr.update();
        }
    }

    public init() {
        // 注册全局消息
        this.registerAllMsg();
        App.EventUtils.on("HALL_OPEN_SHOP", this.toRecharge, this);
    }

    registerAllMsg() {
        // 添加好友请求结果
        App.NetManager.on(App.MessageID.SOCIAL_FRIEND_HANDLE_ADD, (msg) => {
            this.onAddFriend(msg);
        });
        // 充值成功
        App.NetManager.on(App.MessageID.PURCHASE_RECHARGE_SUC, (msg) => {
            this.onPurchaseRechargeSuccess(msg);
        });

        App.NetManager.on(App.MessageID.GAME_ENTER_MATCH, (msg) => {
            this.onRcvNetEnterGame(msg);
        });

        //客户端重新刷房间信息
        App.NetManager.on(App.MessageID.REGET_DESKINFO, (msg) => {
            this.onRcvRefushDeskInfo(msg);
        });

        //登录获取节点服
        App.NetManager.on(App.MessageID.LOGIN, (msg) => {
            this.onRcvMsgLogin(msg);
        });
        //用户登录节点服
        App.NetManager.on(App.MessageID.LOGIN_USERID, (msg) => {
            this.onRcvMsgLoginByUid(msg);
        });
        //用户重新登录节点服
        App.NetManager.on(App.MessageID.RELOGIN_USERID, (msg) => {
            this.onRcvMsgLoginByUid(msg);
        });
        //创建房间
        App.NetManager.on(App.MessageID.GAME_CREATEROOM, (msg) => {
            this.onRecNetCreateOrJoinRoom(msg);
        });
        //加入房间
        App.NetManager.on(App.MessageID.GAME_JOINROOM, (msg) => {
            this.onRecNetCreateOrJoinRoom(msg);
        });
        //游戏断线重连房间信息
        App.NetManager.on(App.MessageID.GAME_RECONNECT_DESKINFO, (msg) => {
            this.onRecNetCreateOrJoinRoom(msg);
        });
        //异地登录
        App.NetManager.on(App.MessageID.GAME_REMOTE_LOGIN, (msg) => {
            this.onRecNetRemoteLogin(msg);
        });
        //房间解散踢人，T回大厅
        App.NetManager.on(App.MessageID.NOTIFY_SYS_KICK_HALL, (msg) => {
            this.onRcvNetTickHallNotice(msg);
        });
        //App需要重启，可能是强更
        App.NetManager.on(App.MessageID.GAME_NEED_RESTART, (msg) => {
            this.onRcvNetGameRestartNotice(msg);
        });

        //同步玩家信息
        App.NetManager.on(App.MessageID.SYNC_PLAYER_INFO, (msg) => {
            this.onRcvNetSyncPlayerInfo(msg);
        });
        //幸运红包变化
        App.NetManager.on(App.MessageID.REQ_REDPACK, (msg) => {
            this.onRcvRedPackInfo(msg);
        });

        //游戏内红包
        App.NetManager.on(App.MessageID.CAME_REDPACK_ALLSCENE, (msg) => {
            this.onRecvInGameRedpack(msg);
        });

        //随机轮盘活动
        App.NetManager.on(App.MessageID.ACTIVE_LUNPAN, (msg) => {
            this.onRecvActiveLunpan(msg);
        });

        //FB绑定账号
        App.NetManager.on(App.MessageID.REQ_BIND_FACEBOOK, (msg) => {
            this.onRcvNetBindAccount(msg);
        });

        //邮件完成通知，随时监听
        App.NetManager.on(App.MessageID.TASK_FINISH_NOTICE, (msg) => {
            this.onRcvNetTaskFinishNotice(msg);
        });

        //等级任务更新通知
        App.NetManager.on(App.MessageID.LEVEL_UP_PARTY_UPDATE_NOTICE, (msg) => {
            this.onRcvNetLevelUpPartyUpdateNotice(msg);
        });

        //破产补助
        App.NetManager.on(App.MessageID.COLLECT_BREAKGRANT_COIN_NOTICE, (msg) => {
            this.COLLECT_BREAKGRANT_COIN_NOTICE(msg);
        });

        //全服公告
        App.NetManager.on(App.MessageID.GLOBAL_SYSTEM_NOTIFY, (msg) => {
            this.OnRcvNetSystemNotice(msg);
        });

        //进入游戏
        App.NetManager.on(App.MessageID.GAME_LIST, (msg) => {
            this.recvGameList(msg);
        });
        // 金币不足的金币弹框
        App.NetManager.on(App.MessageID.PULL_CH_LESSCOIN_ACTIVELIST, (msg) => {
            this.onRcvLessCoinPoplist(msg);
        });
        // 大厅信息同步
        App.NetManager.on(App.MessageID.REQ_SYNC_HALLINFO, (msg) => {
            this.onRecvRefreshHallInfo(msg);
        });

        // --------------  监听 服务器通知的用户数据发送改变 -----------------------
        // 钻石和金币变化更新
        App.NetManager.on(App.MessageID.MONEY_CHANGED, (msg) => {
            this.onMoneyChange(msg);
        });
        // 主动同步金币
        App.NetManager.on(App.MessageID.SYNC_COIN, (msg) => {
            this.onSyncCoin(msg);
        });
        // BounsList改变
        App.NetManager.on(App.MessageID.CHANGE_BONUS_LIST, (msg) => {
            this.onBonusChange(msg);
        });
        // 经验值变化
        App.NetManager.on(App.MessageID.PULL_LEVEL_UP_EXP, (msg) => {
            this.onLevelUpExp(msg);
        });

        // 充值完成回调
        App.NetManager.on(App.MessageID.NOTIFY_RECHANGE_OVER, (msg) => {
            this.onRechargeOver(msg);
        });

        // 监听用户信息更新
        App.NetManager.on(App.MessageID.UPDATE_USER_INFO, (msg) => {
            this.onUserInfoChange(msg);
        });
        // 监听俱乐部信息更新
        App.NetManager.on(App.MessageID.CLUB_UPDATE_INFO, (msg) => {
            this.onClubInfoChange(msg);
        });
        // 俱乐部被踢 或者 被通过
        App.NetManager.on(App.MessageID.NOTIFY_CLUB_JOIN, (msg) => {
            this.onJoinClub(msg);
        });
        App.NetManager.on(App.MessageID.NOTIFY_CLUB_REMOVE, (msg) => {
            this.onKickOffByClub(msg);
        });
        // 礼物广播
        App.NetManager.on(App.MessageID.USER_GIFT_BROADCAST, (msg) => {
            this.onGiftBroadcast(msg);
        });
        // 走马灯消息
        App.NetManager.on(App.MessageID.GLOBAL_SPEAKER_NOTIFY, (msg) => {
            this.onNoticeBroadcast(msg);
        });
        // 邮件消息
        App.NetManager.on(App.MessageID.GLOBAL_MAIL_NOTIFY, (msg) => {
            this.onMailNotify(msg);
        });
        // 金猪同步消息
        App.NetManager.on(App.MessageID.PIGGY_BANK_NOTIFY, (msg) => {
            this.onPiggyBankNotify(msg);
        });
        // 收到一条好友私聊信息
        App.NetManager.on(App.MessageID.SOCIAL_FRIEND_MSG_REV, (msg) => {
            this.onRevFriendMsg(msg);
        });
        // 获取分享奖励
        App.NetManager.on(App.MessageID.GAME_SHARE_REWARD, (msg) => {
            this.onShareReward(msg);
        });
        // 联赛分数更新
        App.NetManager.on(App.MessageID.LEAGUE_EXP_CHANGE, (msg) => {
            this.onLeagueExpChange(msg);
        });
        // 国家投票最高票数更新
        App.NetManager.on(App.MessageID.COUNTRY_TOP_CHANGE, (msg) => {
            this.onCountryTopChange(msg);
        });
        // 消息置顶
        App.NetManager.on(App.MessageID.UPDATE_PINMSG, (msg) => {
            this.onPingMsg(msg);
        }, { once: false });
    }

    onBackGround() {
        this.isBackground = true;
        UserData.bankToken = null; //进入后台，清除银行token，防止其他人拿手机可以操作银行
    }

    async onEnterFront() {
        if (!this.isBackground) return;
        this.isBackground = false;
        //进去前台就断线重连
        if (!(director.getScene().name == Config.SCENE_NAME.LOGIN || //登录
            director.getScene().name == Config.SCENE_NAME.CHANGE_LANGUAGE //热更新
        )) {
            let bForseRecon = false
            // if (cc.vv.gameData && cc.vv.gameData.isBackgroundReConn) {
            //     //如果有游戏需要切后台强制刷新，可以实现这个函数，然后返回true
            //     bForseRecon = cc.vv.gameData.isBackgroundReConn()
            // }
            let bConnect = App.NetManager.isConnect()
            if (!bForseRecon) {
                if (!bConnect) { //poly只有断开了才发起重连，因为重连会关闭掉小游戏
                    console.warn("断线了，需要重连11111");
                    if (director.getScene().name == Config.SCENE_NAME.HALL) {
                        App.NetManager.reconnect();
                    }
                }
            }
            else {
                // AppLog.warn("重连222222", Global.appId, bConnect, bForseRecon);
                App.NetManager.reconnect();
            }

        }
        if (App.userData().isLogin && director.getScene().name == Config.SCENE_NAME.HALL) {
            const userAmount = await App.ApiManager.getUserAmount();
            if (userAmount.code == 0) {
                let lbl_coin = find("Canvas/safeview/UserinfoBar/lbl_coin");
                if (lbl_coin) {
                    lbl_coin.getComponent(Label).string = App.FormatUtils.FormatNumToComma(userAmount.data.amount);
                    App.TransactionData.amount = userAmount.data.amount;
                }
            }
        }
    }

    //删除注销账号
    doAccountDelete() {
        let req = { c: App.MessageID.ACCOUNT_DELETE };
        App.NetManager.send(req);
    }

    // 断线重连，重登陆
    reqReloginUser() {
        let self = this;
        let req = { c: App.MessageID.RELOGIN_USERID } as any;
        req.uid = UserData.uid;
        req.openid = UserData.openid;
        req.server = UserData.serverId;
        req.subid = UserData.subId;
        req.token = UserData.token;
        req.appver = Config.appVersion;
        req.app = Config.appId;
        req.bundleid = self.getAppPackname();
        App.NetManager.send(req);

        //清除超时连接
        App.NetManager.clearTimeoutReconnect();
    }

    async onRcvMsgLoginByUid(msgDic) {
        console.log('协议2返回', msgDic)
        if (msgDic.code === 200) {
            // 加载固定配置只加载在一次
            if (!this.loginConfig) {
                this.loginConfig = await App.NetManager.asyncSend({ c: App.MessageID.GAME_CONFIG });
            }

            this.initUserData(msgDic, this.loginConfig);

            //登陆成功
            //断线重连清理引导标志，以防卡死
            App.EventUtils.dispatchEvent(App.EventID.ENTER_LOGIN_SUCCESS, msgDic);
            let loginType = this.getLoginType();
            // //登录成功后，将user字段替换成palyername
            // if (msgDic.playerInfo && loginType == Global.LoginType.WX) {
            //     let reloginData = JSON.parse(Global.getLocal(Global.SAVEKEYREQLOGIN, ''));
            //     reloginData.user = cc.vv.WxMgr.getWXToken()
            //     Global.saveLocal(Global.SAVEKEYREQLOGIN, JSON.stringify(reloginData));
            // }
            //游戏断线重连
            if (msgDic.deskFlag == 1) {
                let gameId = msgDic.deskInfo.gameid;

                // 判断是否需要下载子包或为内置游戏
                if (this.isDownloadSubGame(gameId)) {
                    let enterFunc = () => {
                        msgDic.deskInfo.isReconnect = true;
                        App.NetManager.dispatchNetMsg({
                            c: App.MessageID.GAME_RECONNECT_DESKINFO,
                            code: Config.ERROR_CODE.NORMAL,
                            gameid: msgDic.deskInfo.gameid,
                            deskinfo: msgDic.deskInfo
                        });
                    };

                    // 如果是开发模式或内置游戏，直接进入游戏
                    if (!Config.publishMode) {
                        enterFunc();
                    } else {
                        let gameCfg = App.GameItemCfg[gameId];
                        if (gameCfg) {
                            // 获取子包的下载地址并加载子包
                            const gameUrl = await App.ApiManager.getGameUrl(gameId);
                            if (gameUrl.msg === "Succeed") {
                                assetManager.loadBundle(gameCfg.name, (err, bundle) => {
                                    if (!err) {
                                        console.log('加载子包成功：' + gameCfg.name);
                                        enterFunc();
                                    } else {
                                        console.log('加载子包错误：' + gameCfg.name + "; " + err);
                                    }
                                });
                            } else {
                                App.AlertManager.getCommonAlert().showWithoutCancel(gameUrl.msg);
                            };
                        }
                    }
                } else {
                    // 子包未下载时的处理逻辑
                    if (gameId) {
                        // 通知服务端退出房间
                        let req = { c: App.MessageID.GAME_LEVELROOM } as any;
                        req.deskid = gameId;
                        App.NetManager.send(req);

                        App.EventUtils.dispatchEvent(App.EventID.ENTER_HALL); // 返回大厅

                        // 提示用户游戏未下载
                        let gameCfg = App.GameItemCfg[gameId];
                        if (gameCfg) {
                            let gameName = gameCfg.name;
                            App.AlertManager.getCommonAlert().showWithoutCancel(`The game: ${gameName} is not downloaded. Please re-enter the game to download it.`);
                        }
                    }
                }
            }
            else {//进入大厅

                if (App.SceneUtils.canShowHallPreLoading()) {
                    //在登录界面，预加载下资源
                    App.SceneUtils.enterScene(Config.SCENE_NAME.HALL_PRELOAD);
                    App.PlatformApiMgr.KoSDKTrackEvent('LoginSuccess', { uid: msgDic.playerInfo.uid })
                }
                else {
                    let bInHall = App.SceneUtils.isInHallScene();
                    if (bInHall) {
                        if (this.isSendFbBind) {
                            this.isSendFbBind = false;
                            App.EventUtils.dispatchEvent(App.EventID.ENTER_HALL);
                        }

                    }
                    else {
                        //是否在游戏内
                        if (App.SubGameManager.isInGame()) {
                            // 在子游戏场景但是重连数据又没在游戏内说明是在游戏内断线重连但是游戏已经结束需要返回大厅
                            // let gameid = cc.vv.gameData.getGameId()
                            // cc.vv.GameManager.EnterGame(gameid)
                            App.SceneUtils.enterScene(Config.SCENE_NAME.HALL_PRELOAD, null, Config.APP_ORIENTATION);
                        }
                    }
                }
                //cc.vv.EventManager.emit(EventId.ENTERLOGINSUCCESS); 
            }
        }
        else {
            this.goBackLoginScene();
        }
    }

    //登录界面构造登录消息
    constructLoginMsg(nickname, pwd, loginType, accesstoken, loginExData, token) {
        let req = { c: App.MessageID.LOGIN } as any;
        req.user = nickname;
        req.passwd = pwd
        req.app = Config.appId
        req.v = Config.resVersion;
        if (App.DeviceUtils.isNative()) {
            req.av = App.PlatformApiMgr.getAppVersion();
            req.fmcToken = App.PlatformApiMgr.GetFMCToken() //firebase推送的唯一标志
            //console.log("推送令牌：" + req.fmcToken)

            //ko唯一标志
            // req.kouuid = cc.vv.PlatformApiMgr.GetKoUUID()
            //console.log("KO令牌：" + req.kouuid)
        }
        let _loginExData = loginExData || Config.LoginExData.reloginAction
        req.t = loginType; //1随机 2 微信 3fb
        req.accessToken = accesstoken;
        req.platform = sys.os;
        if (App.DeviceUtils.isIOS()) {
            req.deviceToken = App.PlatformApiMgr.getDeviceToken();
        }
        let tDeviceInfo = App.DeviceUtils.getDeviceInfo()
        if (tDeviceInfo && tDeviceInfo.phoneBrand) {
            req.phone = `${tDeviceInfo.phoneBrand}(${tDeviceInfo.phoneSystemVision})`;
        }
        else {
            if (App.DeviceUtils.isBrowser()) {
                req.phone = "Web_" + sys.os
            }

        }


        // let bOpenApi = false
        // if(UserData.getLoginType() == Global.LoginType.APILOGIN){
        //     bOpenApi = true
        // }
        // if(bOpenApi && Global.openAPIModel){
        //     //开放平台登陆就需要添加额外的参数
        //     let apiGameid = UserData.getApiGameId()
        //     req.gameid = apiGameid
        //     let apiSign = UserData.getApiSign()
        //     req.signstr = apiSign
        // }

        req.token = token || UserData.token;
        req.bwss = 0;
        req.LoginExData = _loginExData
        // req.language = App.i18n._language;
        req.language = 2;
        req.client_uuid = App.StorageUtils.getLocal('client_uuid', ''); //用来记录是当前客户端       
        if (App.SystemUtils.isUserWSS()) {
            req.bwss = 1
        }
        return req
    }

    // 添加好友成功
    onAddFriend(msg) {
        // 提示添加成功
        // 490, --好友信息不存在
        // 495, --添加好友，错误次数过于频繁
        // 619, --您的好友数量已达上限
        // 620, --不能加自己为好友
        // 621, --对方好友数量已达上限
        // 622, --好友关系在己方已经存在了
        // 623, --不能加自己为好友
        // 623, --发送请求成功
        if (msg.code != 200) return;
        if (msg.spcode && msg.spcode > 0) {
            App.AlertManager.showFloatTip(App.CommonUtils.spcode2String(msg.spcode));
            if (msg.spcode == 557) {
                // 弹出设置
                // App.PopUpManager.addPopup("BalootClient/Setting/PopupSetting");
            }
            return;
        }
        if (msg.friend && msg.friend.playername) {
            App.AlertManager.showFloatTip("添加好友成功");
        } else {
            App.AlertManager.showFloatTip("请求成功,请等待审核");
        }
    }

    onPurchaseRechargeSuccess(msg) {
        if (msg.rewards && msg.rewards.length > 0) {
        }
    }

    COLLECT_BREAKGRANT_COIN_NOTICE(msg) {
        // 记录已经破产了,在需要用钱的时候进行检测
    }

    //账号绑定消息
    onRcvNetBindAccount(msg) {
        let self = this;
        if (msg.code === 200) {
            let loginType = msg.type;
            let accountStr = "Facebook"
            if (loginType == Config.LoginType.GOOGLE_LOGIN) {
                accountStr = "Google";
            } else if (loginType == Config.LoginType.APPLE_LOGIN) {
                accountStr = "Apple";
            }
            let modifyData = () => {
                //删除本地游客的token
                App.StorageUtils.deleteLocal('guest_token_map')
                if (loginType == Config.LoginType.FB) {
                    this.setIsBindFb(true);
                } else if (loginType == Config.LoginType.GOOGLE_LOGIN) {
                    this.setIsBindGoogle(true);
                    this.getUserData().isbindgoogle = true;
                } else if (loginType == Config.LoginType.APPLE_LOGIN) {
                    this.getUserData().isbindapple = true;
                }
                this.setLoginType(loginType)
                if (msg.usericon) {
                    this.getUserData().userIcon = msg.usericon
                    this.getUserData().fbiconurl = msg.usericon
                }
                if (msg.playername) {
                    this.setNickName(msg.playername)
                }
                App.StorageUtils.saveLocal(App.StorageKey.SAVE_KEY_LOGIN_TYPE, loginType);
                //Global.saveLocal(Global.SAVE_KEY_LAST_LOGIN_TYPE, loginType);
                //修改自动登数据-登陆方式
                let preLoginStr = App.StorageUtils.getLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, "{}")
                let reloginData = JSON.parse(preLoginStr);
                reloginData.t = loginType
                reloginData.account = msg.account;
                reloginData.user = msg.user;
                reloginData.token = msg.token;
                reloginData.accesstoken = msg.accesstoken;
                if (msg.playername) {
                    reloginData.LoginExData = { nick: msg.playername, img: msg.usericon }
                }
                App.StorageUtils.saveLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, JSON.stringify(reloginData));
                App.EventUtils.dispatchEvent("USER_INFO_CHANGE");
                App.PopUpManager.closeAllPopups();
            }
            if (msg.spcode === 1071) {
                //已经绑定了，就直接登陆这个FB账号
                let sureCall = () => {
                    if (App.SubGameManager.getSlotGameDataScript()) {
                        //如果在游戏内需要先退出游戏
                        if (App.SubGameManager.getSlotGameDataScript().reqBackLobby) {
                            App.SubGameManager.getSlotGameDataScript().reqBackLobby();
                        }
                        //切换账号，清理quest的零时数据
                        if (App.SubGameManager.getSlotGameDataScript().setIsQuestModel) {
                            App.SubGameManager.getSlotGameDataScript().setIsQuestModel(null);
                        }
                    }
                    self.isSendFbBind = true;
                    modifyData();
                    // 重新登录
                    self.login(msg.user, '', loginType, msg.accesstoken, null, msg.token);
                }

                let tips = `你的${accountStr}账号已经绑定过其他账号了, 继续的话将移除当前账号数据并且切换到当前${accountStr}账号. 您是否要继续？`;
                App.AlertManager.getCommonAlert().showWithoutCancel(tips, sureCall);
                return
            }
            else {
                modifyData()
            }
            //绑定成功奖励
            App.EventUtils.dispatchEvent(App.EventID.FB_BIND_SUCCESS, msg);
        }
    }

    jumpTo(positionId) {
        let gameHallCpt = director.getScene().getComponentInChildren(GameHall);
        if (!gameHallCpt) return;
        App.PopUpManager.closeAllPopups();
        if (positionId > 100000) {              // 机台
            // 切换大页面
            gameHallCpt.pageTabbar.setPage(2);
            // cc.vv.PopupManager.addPopup("BalootClient/RoomList/RoomListView", {
            //     opacityIn: true,
            //     onShow: (node) => {
            //         let cpt = node.getComponent("RoomListView")
            //         if (cpt) {
            //             let gameid = positionId % 100000;
            //             cpt.onInit(gameid);
            //         }
            //     }
            // });
        } else if (positionId == 1) {       // game
            gameHallCpt.pageTabbar.setPage(2);
        } else if (positionId == 2) {       // 好友房
            gameHallCpt.pageTabbar.setPage(1);
        } else if (positionId == 3) {       // 代理
            gameHallCpt.pageTabbar.setPage(3);
        } else if (positionId == 4) {       // Slot
            gameHallCpt.pageTabbar.setPage(2);
            // 尝试点击slot按钮
            // let hallBtnSlot = cc.director.getScene().getComponentInChildren("HallSlotBtn");
            // if (hallBtnSlot) {
            //     hallBtnSlot.onClick();
            // }
        } else if (positionId == 5) {       // bank
            gameHallCpt.pageTabbar.setPage(0);
        } else if (positionId == 6) {       // 世界聊天
            gameHallCpt.pageTabbar.setPage(4);
            // 切换到聊天界面
            // let cpt = cc.director.getScene().getComponentInChildren("PageSocialView");
            // if (cpt) {
            //     let tabbarCpt = cpt.tabbarNode.getComponentInChildren("Tabbar");
            //     if (tabbarCpt) tabbarCpt.setPage(3);
            // }
        } else if (positionId == 7) {       // 每日任务
            gameHallCpt.pageTabbar.setPage(3);
            // let cpt = cc.director.getScene().getComponentInChildren("PageBounsView");
            // if (cpt) {
            //     let tabbarCpt = cpt.tabbarNode.getComponentInChildren("Tabbar");
            //     if (tabbarCpt) tabbarCpt.setPage(3);
            // }

        } else if (positionId == 8) {       // 分享界面
            gameHallCpt.pageTabbar.setPage(3);
            // let cpt = cc.director.getScene().getComponentInChildren("PageBounsView");
            // if (cpt) {
            //     let tabbarCpt = cpt.tabbarNode.getComponentInChildren("Tabbar");
            //     if (tabbarCpt) tabbarCpt.setPage(4);
            //     // 打开分享界面
            //     let shareView = cc.director.getScene().getComponentInChildren("FBShareView");
            //     if (shareView) {
            //         shareView.shareBtn.node.getComponent("PopupBtnCmp").onClick();
            //     }
            // }
        } else if (positionId == 9) {       // 新手任务
            gameHallCpt.pageTabbar.setPage(3);
            // let cpt = cc.director.getScene().getComponentInChildren("PageBounsView");
            // if (cpt) {
            //     let tabbarCpt = cpt.tabbarNode.getComponentInChildren("Tabbar");
            //     if (tabbarCpt) tabbarCpt.setPage(0);
            // }
        } else if (positionId == 10) {       // 商城 皮肤页
            gameHallCpt.pageTabbar.setPage(0);
            // let navigationPageView = cc.director.getScene().getComponentInChildren("NavigationPageView");
            // if (navigationPageView) {
            //     navigationPageView.scheduleOnce(() => {
            //         navigationPageView.showPage(3);
            //     }, 0.1)
            // }
        }
        else if (positionId == 11) { //游戏 - bonus
            gameHallCpt.pageTabbar.setPage(3);
        } else if (positionId == 11.1) {//游戏 - bonus-返水
            gameHallCpt.pageTabbar.setPage(3);
            App.EventUtils.dispatchEvent("Bonus_Tab", 1)
        }
        else if (positionId == 11.2) {//bonus-task
            gameHallCpt.pageTabbar.setPage(3);
            App.EventUtils.dispatchEvent("Bonus_Tab", 2)
        }
        else if (positionId == 11.3) {//bonus-login
            gameHallCpt.pageTabbar.setPage(3);
            App.EventUtils.dispatchEvent("Bonus_Tab", 3)
        }
        else if (positionId == 11.4) {//bonus-promo
            gameHallCpt.pageTabbar.setPage(3);
            App.EventUtils.dispatchEvent("Bonus_Tab", 4)
        }
        else if (parseInt(positionId) == 12) {  // 排行榜-12.1 12.2 12.3
            gameHallCpt.pageTabbar.setPage(2);
            // cc.vv.PopupManager.addPopup("YD_Pro/rank/yd_rank", {
            //     opacityIn: true,
            //     onShow: (node) => {
            //         // node.getComponent("yd_rank").initPage(positionId*10%12);
            //     }
            // })
        }
    }

    // 全服公告
    OnRcvNetSystemNotice(msg) {
        // if (msg.code == 200) {
        //     //收到全服公告
        //     let prefabPath = 'BalootClient/BaseRes/prefabs/system_notice';
        //     cc.loader.loadRes(prefabPath, cc.Prefab, (err, prefab) => {
        //         if (!err) {
        //             let canvas = cc.find("Canvas");
        //             if (cc.isValid(canvas)) {
        //                 let old = canvas.getChildByName('system_notice')
        //                 if (!old) {
        //                     old = cc.instantiate(prefab)
        //                     old.parent = canvas

        //                 }
        //                 let scp = old.getComponent('system_notice')
        //                 scp.show(msg.message)
        //             }
        //         }
        //     })
        // }
    }

    /**外链打开APP */
    onOpenAppByURL(paramsDic) {
        // AppLog.log("GameManager.onOpenAppByURL: " + JSON.stringify(paramsDic));
        // 判断当前场景是否是游戏场景
        if (App.SubGameManager.isInGame()) {
            App.AlertManager.showFloatTip("当前游戏还未结束");
            return;
        }
        if (paramsDic) {
            App.PlatformApiMgr.clearOpenAppUrlDataStr();
            let param = paramsDic.roomid
            // let gameid = paramsDic.gameid
            // let pwd = paramsDic.pwd
            if (param) { //有房间ID必须参数

                //加入游戏，是否有vip限制
                let needVip = this.getSalonVip();
                if (needVip > UserData.svip) {
                    //调往充值
                    let tipsmsg = `Upgrade your VIP level to VIP${needVip} to enjoy the Salon`;
                    App.AlertManager.getCommonAlert().setConfirmLabel("Upgrade Now")
                        .showWithoutCancel(tipsmsg, () => {
                            App.EventUtils.dispatchEvent("OpenCharge")
                        });
                    return false //不可以进入
                }

                let array = param.split("-")
                let roomid = array[0]
                let gameid = array[1]
                let pwd = array[2]
                let bInnerGame = this.isNoNeedDownGame(gameid)
                let bNew = true;
                // let bNew = cc.vv.SubGameUpdateNode.getComponent('subGameMgr')._isAreadyNew(gameid);
                if (App.DeviceUtils.isBrowser() || bNew || bInnerGame) {
                    let req = { c: App.MessageID.FRIEND_ROOM_JOIN } as any;
                    req.deskid = roomid
                    if (gameid) {
                        req.gameid = gameid
                    }
                    if (pwd) {
                        req.pwd = pwd
                    }
                    if (roomid) {
                        //enter room 
                        App.NetManager.send(req);
                    }
                }
                else {
                    //提示更新
                    let tips = `You need to download the latest resources of 【${this.getGameName(gameid)}】 first`;
                    App.AlertManager.getCommonAlert().showWithoutCancel(tips, () => {
                        // this._waitgameId = data.gameid
                        // cc.vv.SubGameUpdateNode.emit("check_subgame", gameid);
                        App.AlertManager.showFloatTip("start download");
                    });
                }


            }
            // else {
            //     //如果不是进入房间，检查是不是绑定邀请码
            //     let code = paramsDic.code
            //     if (code) {
            //         let req = { c: MsgId.EVENT_FB_INVITE_BIND_CODE }
            //         req.code = code
            //         cc.vv.NetManager.send(req)
            //     }

            // }

        }
    }

    // 游戏名称
    getGameName(gameid) {
        return App.GameItemCfg[gameid].name || "";
        // for (const item of App.GameData.gameMap) {
        //     if (item.gameid == gameid) {
        //         return item.title;
        //     }
        // }
        // return "";
    }

    onRefushFMCToken() {
        let tokenstr = App.PlatformApiMgr.GetFMCToken();

        if (tokenstr) {
            if (this.lastFCMToken != tokenstr) {
                this.lastFCMToken = tokenstr
                App.NetManager.send({ c: App.MessageID.UPDATE_FCMTOKEN, token: tokenstr }, true)
            }
            else {
                // AppLog.warn("推送token未变化:"+tokenstr)
            }

        }
    }

    //overwrite:io冷启动的时候不能调用加入房间,等到了大厅后加入
    doEnterFrontAction() {
        if (App.DeviceUtils.isIOS()) {
            let urlData = App.PlatformApiMgr.getOpenAppUrlDataStr();
            if (urlData) {
                this.onOpenAppByURL(JSON.parse(urlData))
            }
        }
    }

    //T回大厅
    onRcvNetTickHallNotice(msg) {
        if (msg.code === 200) {
            App.AlertManager.getCommonAlert().showWithoutCancel("您已被强制下线，如有疑问请联系管理员", () => {
                // if (cc.vv.gameData) {
                if (true) {
                    // if (cc.vv.gameData._EventId) {
                    //     Global.dispatchEvent(cc.vv.gameData._EventId.EXIT_GAME);
                    // }
                    App.EventUtils.dispatchEvent(App.EventID.EXIT_GAME);
                    App.SceneUtils.enterScene(Config.SCENE_NAME.HALL);
                }
            });
        }
    }

    onRcvRefushDeskInfo(msg) {
        if (msg.code == 200) {
            //if (cc.vv.gameData) {
            if (true) {
                if (msg.deskFlag == 1) {
                    if (msg.deskInfo) {
                        msg.deskInfo.isReconnect = true;
                        // cc.vv.gameData.init(msg.deskInfo, msg.gameid)
                    }
                }
            }
        }
    }

    onPressBackCall() {
        //看当前是否有webview
        let webs = director.getScene().getComponentsInChildren(WebView)
        if (webs && webs.length > 0) {
            //就不显示，否则会被webview挡住
            return
        }
        App.AlertManager.getCommonAlert().show("Are you sure you want to exit?", () => {
            game.end();
        })
    }

    getAppPackname() {
        if (App.DeviceUtils.isBrowser()) {
            return "com.yono.games.free";
        }
        else {
            return App.PlatformApiMgr.getPackageName();
        }

    }


    getCategory(number: number) {
        if (GameData.electronicNumbers.includes(number)) {
            return 42; // 电子 42 
        } else if (GameData.chessNumbers.includes(number)) {
            return 44; // 棋牌 44 
        } else if (GameData.bingoNumbers.includes(number)) {
            return 45; // 宾果 45
        }

        return -1; // 如果没有匹配的类别
    }

    getGameConfig(gameId: number) {
        return GameDataCfg.getInstance().getGameData(gameId);
    }

    onDestroy() {

    }

    goBackLoginScene() {
        if (App.userData().isLogin) {
            // Global.deleteLocal(Global.SAVE_KEY_REQ_LOGIN);
            // Global.deleteLocal(Global.SAVE_PLAYER_TOKEN);
            App.StorageUtils.deleteLocal('client_uuid');


            let did = (new Date()).getTime() + App.MathUtils.random(1, 9999999);
            App.StorageUtils.saveLocal('client_uuid', '' + did);
            App.NetManager.close();
            App.HttpUtils.sendPostRequest("LoginOff", "", function (error, response) {
                if (error) {
                    console.warn(error);
                } else {
                    let coin = find("Canvas/safeview/UserinfoBar/lbl_coin");
                    if (coin) coin.getComponent(Label).string = "0";
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {

                    } else {
                        // cc.vv.AlertView.showTips(response.msg)
                    }
                }
            });
            // cc.director.loadScene(Global.SCENE_NAME.HALL);
        }
        // Global.slotsTypeIDYono42 = Global.slotsTypeIDYono45 = Global.slotsTypeIDYono44 = 0
        App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
        setTimeout(() => {
            // App.SystemUtils.isLoginFun(false);
            App.SceneUtils.enterLoginScene();
        }, 300);
    }

    login(nickname, pwd, loginType, accesstoken, loginExData, token, btype = null, callback = null) {
        let self = this

        console.log('开始连接loginserver')
        App.NetManager.connect(Config.loginServerAddress, () => {
            console.log('loginserver连接成功')
            let req = self.constructLoginMsg(nickname, pwd, loginType, accesstoken, loginExData, token);
            if (loginType == Config.LoginType.PHONE) { //手机登陆，如果是重置密码，需要传reset参数
                if (loginExData == "rest") {
                    req.reset = 1
                    req.otp = token
                }
                else if (loginExData == "otp") {
                    req.otp = token
                }
            }
            console.log('发送协议1')
            req.bundleid = self.getAppPackname();
            req.deviceid = App.DeviceUtils.getDeviceId();
            req.dinfo = '';
            // 登录兼容绑定旧账户
            if (btype) {
                let tempReq = App.SystemUtils.deepClone(req)
                tempReq.btype = btype;
                App.NetManager.send(tempReq);
            } else {
                App.NetManager.send(req);
            }
            App.StorageUtils.saveLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, JSON.stringify(req));

            //清除超时连接
            App.NetManager.clearTimeoutReconnect();

            if (callback) {
                callback();
            }
        })
    }

    relogin(bAuto = false) {
        let self = this
        //发送协议1之前connect

        let preLoginStr = App.StorageUtils.getLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, '')
        if (preLoginStr) {
            console.log("relogin发送连接loginserver")
            App.NetManager.connect(Config.loginServerAddress, () => {
                //发送协议1 connect成功后
                let reloginData = JSON.parse(preLoginStr);
                if (UserData.uid) {
                    reloginData.uid = UserData.uid;
                }
                if (UserData.token) {
                    reloginData.token = UserData.token;
                }
                if (!bAuto) {
                    reloginData.LoginExData = Config.LoginExData.reloginAction;
                }
                else {
                    //自动登陆，替换asscesstoken
                    reloginData.accessToken = App.StorageUtils.getLocal('localtoken');
                }
                reloginData.bwss = 0
                if (App.SystemUtils.isUserWSS()) {
                    reloginData.bwss = 1
                }
                reloginData.app = Config.appId
                reloginData.bundleid = self.getAppPackname();
                reloginData.dinfo = '';
                reloginData.v = Config.resVersion
                if (App.DeviceUtils.isNative()) {
                    reloginData.av = App.PlatformApiMgr.getAppVersion();
                }
                let tDeviceInfo = App.DeviceUtils.getDeviceInfo();
                if (tDeviceInfo && tDeviceInfo.phoneBrand) {
                    reloginData.phone = `${tDeviceInfo.phoneBrand}(${tDeviceInfo.phoneSystemVision})`
                }
                else {
                    if (App.DeviceUtils.isBrowser()) {
                        reloginData.phone = "Web_" + sys.os;
                    }

                }
                console.log("relogin发送协议1")
                App.NetManager.send(reloginData);
                //清除超时连接
                App.NetManager.clearTimeoutReconnect();
            });
        }
        else {
            let sureCall = () => {
                self.goBackLoginScene();
            }
            App.AlertManager.getCommonAlert().show('Please log in again!', sureCall);
        }
    }

    //自动游客登陆
    autoTravellerLogin(bOnlyGeneralParam = false) {
        let self = this;
        //有账号登录记录则直接账号登录
        let preLoginStr = App.StorageUtils.getLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN, '')
        if (preLoginStr) {
            let reloginData = JSON.parse(preLoginStr);
            if (reloginData.user.indexOf("Guest") == -1) {
                this.relogin();
                return;
            }
        }

        let localNickname = App.StorageUtils.getLocal('nick_name', '');

        const doNext = async () => {
            App.StorageUtils.saveLocal('nick_name', localNickname);
            let guestTokenCfg = App.StorageUtils.getLocal(App.StorageKey.SAVE_PLAYER_TOKEN, '');
            let guestTokenMap = guestTokenCfg.length > 0 ? JSON.parse(guestTokenCfg) : {};
            let playerData = guestTokenMap[localNickname];
            let token = playerData ? playerData.token : null;
            if (!token || token.length <= 0) {
                token = (new Date()).getTime() + '_' + App.MathUtils.random(1, 99999999);
                guestTokenMap[localNickname] = { token: token };
                App.StorageUtils.saveLocal(App.StorageKey.SAVE_PLAYER_TOKEN, JSON.stringify(guestTokenMap));
            }

            const guestLoginResult = await App.ApiManager.guestLogin(localNickname);

            if (bOnlyGeneralParam) {
                return self.constructLoginMsg(localNickname, "5LYW2waQytc3mW5", Config.LoginType.PHONE, '', Config.LoginExData.loginAction, token);
            } else {
                console.log('游客自动登陆');
                self.login(localNickname, "5LYW2waQytc3mW5", Config.LoginType.PHONE, '', Config.LoginExData.loginAction, token);
            }
        };

        if (localNickname.length == 0) {
            // 如果没有昵称，先注册获取昵称再执行登录
            App.ApiManager.registerSlots()
                .then(registerResult => {
                    localNickname = registerResult.guestUserName;
                    return doNext();
                })
                .catch(error => {
                    console.warn('Register slots failed:', error);
                    // 可以添加错误处理逻辑
                });
        } else {
            // 直接执行登录
            doNext().catch(error => {
                console.warn('Guest login process failed:', error);
            });
        }
    }

    //用户登出
    onRcvMsgLoginout(msgDic) {

        if (msgDic.code === 200) {
            this.goBackLoginScene()
        }

    }

    //进入大厅
    onRcvEnterHall(params) {
        if (director.getScene().name !== Config.SCENE_NAME.HALL) {
            App.setParams(params);
            App.SceneUtils.enterScene(Config.SCENE_NAME.HALL, () => {
                console.log('进去大厅');
            });
        }
        else {
            //刷新大厅
            director.loadScene(Config.SCENE_NAME.HALL)
        }
    }

    //游戏是否开放
    isOpenOfGameId(gameid) {
        let gamelist = UserData.gameList;
        if (gamelist && gamelist.length > 0) {
            for (let i = 0; i < gamelist.length; i++) {
                if (gamelist[i].id == gameid) {
                    return gamelist[i].status == 1; //1开启
                }
            }
        }
        return true;
    }

    //准备登陆游戏服:协议2
    loginByUid(msgDic) {
        let self = this;
        if (msgDic) {
            //下发新的服务器地址
            let gameServer = msgDic.net
            let uid = UserData.uid2 = msgDic.uid
            let server = msgDic.server
            let subid = msgDic.subid
            let token = msgDic.token
            console.log("准备登陆游戏服", gameServer, uid, server, subid, token)
            //保存客户端IP
            App.PlatformApiMgr.setClientIP(msgDic.caddr)

            //保存uid
            App.StorageUtils.saveLocal('recent_uid', uid)
            App.StorageUtils.saveLocal('localtoken', token)

            //首次登陆下发的信息
            this.initLoginServer(msgDic)

            console.log('连接node服')
            App.NetManager.connect(gameServer, () => {
                console.log('协议2发送')
                let req = { 'c': App.MessageID.LOGIN_USERID } as any;
                req.uid = uid;
                req.openid = "";
                req.server = server;
                req.subid = subid;
                req.token = token;
                req.deviceid = App.DeviceUtils.getDeviceId();
                req.appver = Config.appVersion;
                req.app = Config.appId;
                req.bundleid = self.getAppPackname();
                req.v = Config.resVersion
                if (App.DeviceUtils.isNative()) {
                    req.av = App.PlatformApiMgr.getAppVersion();
                    req.fmcToken = App.PlatformApiMgr.GetFMCToken() //firebase推送的唯一标志
                    //ko唯一标志
                    req.kouuid = App.PlatformApiMgr.GetKoUUID()
                    if (App.DeviceUtils.isIOS()) {
                        req.deviceToken = App.PlatformApiMgr.getDeviceToken();
                    }
                }
                console.log(req, "===req")
                App.NetManager.send(req)
            });
        }
    }

    onRcvMsgLogin(msgDic) {
        if (msgDic.spcode && msgDic.spcode > 0) {
            if (msgDic.spcode == 214) {
                //资源版本号不对，需要更新
                this.showNeedUpdateRes()
                return
            }
            else if (msgDic.spcode == 761) {
                App.AlertManager.showFloatTip("Please login after 2 minutes!");
                return
            }
            else if (msgDic.spcode === 426) { //未开放注册
                App.AlertManager.showFloatTip("Registration unavailable now.Please try again after some time.");
            }
            else if (msgDic.spcode === 216) { //IP注册限制
                App.AlertManager.showFloatTip("Registration unavailable now.Please try again after some time.");
            }
            else if (msgDic.spcode === 217) { //设备登陆限制
                App.AlertManager.showFloatTip("Device login restrictions.");
            }
            else if (msgDic.spcode === 218) {
                App.AlertManager.showFloatTip("Unsupported device!");
            }
            else if (msgDic.spcode === 405) {//banned
                App.AlertManager.showFloatTip("This account has been banned");
            }
            else if (msgDic.spcode === 335) {//需要验证手机号码
                App.AlertManager.showFloatTip("Your account security is important to us,please enter the OTP for new device login");
            }
            else if (msgDic.spcode === 334) {
                App.AlertManager.showFloatTip("Invalid OTP code");
            }
            else if (msgDic.spcode === 955) {
                App.AlertManager.showFloatTip("This account does not exist!");
            }
            else if (msgDic.spcode === 333) {
                App.AlertManager.showFloatTip("wrong password!");
            }

            else {
                App.AlertManager.showFloatTip(`Login fail!(${msgDic.spcode})`);
            }
            console.log('协议1返回失败');
            App.StorageUtils.deleteLocal(App.StorageKey.SAVE_KEY_REQ_LOGIN)
            let errcode = msgDic.spcode;
            App.EventUtils.dispatchEvent(App.EventID.ENTER_LOGIN_FAILE, errcode);
            App.userData().isLogin = false;
            this.goBackLoginScene();
            return;
        }

        if (msgDic.code === 200) {
            console.log('协议1返回成功')
            //准备登陆游戏服
            this.loginByUid(msgDic);
        }
        else {
            console.log('协议1返回失败')
            //登陆异常处理
            let errcode = msgDic.code
            App.EventUtils.dispatchEvent(App.EventID.ENTER_LOGIN_FAILE, errcode);

            this.goBackLoginScene();
        }
    }

    showNeedUpdateRes() {
        let callback = () => {
            // 清理热更时间戳，确保下次启动会重新检查更新
            let last = App.StorageUtils.getLocal('last_hotupdate', '');
            if (last) {
                App.StorageUtils.deleteLocal('last_hotupdate');
            }

            // 关闭网络连接和停止音频
            App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
            App.NetManager.close();
            App.AudioManager.stopAll();

            console.log('[GameManager] 需要更新资源，重启应用以触发热更新');
            game.restart();
        };
        let tip = "There is a new resource update, restart the update immediately";
        App.AlertManager.getCommonAlert().showWithoutCancel(tip, callback);
    }

    //收到系统强制解散房间
    onRecNetDimissRoomBySystem(msgDic) {
        if (msgDic.code === 200) {
            let callback = () => {
                App.EventUtils.dispatchEvent(App.EventID.ENTER_HALL);
            }
            App.AlertManager.getCommonAlert().showWithoutCancel("The room has been dissolved by the system", callback);
        }
    }

    //异地登录
    onRecNetRemoteLogin(msgDic) {
        console.log("msgDic: onRecNetRemoteLogin ============================================", msgDic);
        App.NetManager.close();
        App.AlertManager.getCommonAlert().showWithoutCancel('The account is currently online.', () => {
            this.goBackLoginScene()
        });
        // director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {

        // });
    }

    //财富变化
    onRcvNetMoneyChanged(msgDic) {
        if (msgDic.code === 200) {
            UserData.coin = msgDic.coin;
            if (msgDic.type === 1) {
                let bDiamond = msgDic.diamond ? true : false
                if (bDiamond) {
                    this.setDiamond(msgDic.diamond, true)
                }
                //     let showAddCoin = function () {
                //         if (!msgDic.count) return

                //         //充值成功弹窗
                //         let prefabPath = 'CashHero/prefab/BuyCoinResult'
                //         cc.loader.loadRes(prefabPath, cc.Prefab, (err, prefab) => {
                //             if (!err) {
                //                 let canvas = cc.find("Canvas");
                //                 let old = canvas.getChildByName('BuyCoinResult')
                //                 if (!old) {
                //                     if (cc.isValid(canvas, true)) {
                //                         let node = cc.instantiate(prefab)
                //                         node.parent = canvas
                //                         node.name = 'BuyCoinResult'
                //                         let script = node.getComponent('CH_BuyCoinResult')
                //                         if (script) {
                //                             script.ShowInfo(msgDic.count, bDiamond)
                //                         }
                //                     }
                //                 }


                //             }
                //             else {
                //                 //没有特殊就用通用
                //                 cc.vv.AlertView.showTips(cc.js.formatStr(cc.vv.Language.add_score_succ, Global.S2P(msgDic.count)), () => { });
                //             }

                //         })
                //     }

                //     //是否有权益。如果有权益，先播放权益再播放金币
                //     if (msgDic.rewards && msgDic.rewards.length > 0) {
                //         let url = 'CashHero/prefab/pop_reward'
                //         cc.loader.loadRes(url, cc.Prefab, (err, prefab) => {
                //             if (!err) {
                //                 if (!cc.find('Canvas/pop_reward')) {
                //                     let node = cc.instantiate(prefab)
                //                     node.parent = cc.find('Canvas')
                //                     node.name = 'pop_reward'
                //                     let endCall = function () {
                //                         showAddCoin()
                //                     }
                //                     node.getComponent('CH_popreward').showRewards(msgDic.rewards, endCall)
                //                 }

                //             }
                //             else {
                //                 AppLog.err('未找到资源:' + url)
                //             }
                //         });
                //     }
                //     else {
                //         showAddCoin()
                //     }
            }

            App.EventUtils.dispatchEvent(App.EventID.RECHARGE_SUCC);
        }
    }

    onRcvNetSyncPlayerInfo(msgDic) {
        if (msgDic.code === 200) {
            if (msgDic.playerInfo.uid == UserData.uid) {
                for (let k in msgDic.playerInfo) {
                    UserData[k] = msgDic.playerInfo[k];
                }
            }
        }
    }

    onRcvNetTaskFinishNotice(msgDic) {
        if (msgDic.code === 200) {
            UserData.taskNum = msgDic.hasQuest; //0没有任务 1有任务
            App.EventUtils.dispatchEvent(App.EventID.UPDATE_TASK_REDPOINT);
        }
    }

    onRcvNetLevelUpPartyUpdateNotice(msgDic) {
        if (msgDic.code === 200) {
            // let canvas = find("Canvas");
            // let prefabPath = "hall_prefab/LevelUpPartyV";

            // if (cc.vv.gameData && cc.vv.gameData.getGameId()) {
            //     let data = cc.vv.GameDataCfg.getGameData(cc.vv.gameData.getGameId());
            //     if (data.orientation === "portrait") prefabPath = "hall_prefab/LevelUpPartyV";
            // }
            // // cc.loader.loadRes(prefabPath,cc.Prefab, (err, prefab) => {
            // //     if (!err) {
            // //         if(!canvas.getChildByName('LevelUpParty')){
            // //             let node = cc.instantiate(prefab);
            // //             node.name = "LevelUpParty";
            // //             node.parent = canvas;
            // //             // node.getComponent("level_up_party").init(msgDic.state);
            // //         }
            // //     }
            // //     else{
            // //         AppLog.err('未找到资源')
            // //     }
            // // });

            // //安队列弹出
            // let showWay = {
            //     type: 1,
            //     prefabUrl: prefabPath,

            // }
            // cc.vv.QueueWinMrg.addPop('LevelUpPartyV', msgDic.state, showWay)
        }
    }

    onRcvNetBreakGrantNotice(msgDic) {
        if (msgDic.code === 200) {
            // if (cc.vv.gameData) {
            //     // 优化
            //     if (cc.vv.gameData.isNotShowBreak && cc.vv.gameData.isNotShowBreak()) {
            //         //不显示破产
            //         return
            //     }

            //     //消息保存起来，合适的地方去展示
            //     cc.vv.gameData.SetBreakGrant(msgDic)
            // }
        }
    }

    //app强制重启
    onRcvNetGameRestartNotice(msg) {
        if (msg.code === 200) {
            App.AlertManager.getCommonAlert().showWithoutCancel("The app needs to be restarted to continue playing.", () => {
                //app重启
                App.EventUtils.dispatchEvent(App.EventID.STOP_ACTION);
                App.NetManager.close();
                App.AudioManager.stopAll();
                game.restart();
            });
        }
    }

    //幸运红包
    onRcvRedPackInfo(msg) {
        if (msg.code === 200) {
            if (msg.num > 0) {
                //更新红包数量
                // this.setLuckPackNum(msg.allnum)
                //提示
                App.AlertManager.showFloatTip(`You have received ${msg.num} Lucky Packets!`);
                //更新大厅红包状态
                App.EventUtils.dispatchEvent(App.EventID.UPDATE_REDPACK);
            }
        }
    }

    //发送进入游戏请求
    sendEnterGameReq(gameId, ssid = 0, exData = null) {
        if (gameId) {
            let req = { 'c': App.MessageID.GAME_ENTER_MATCH } as any;
            req.gameid = gameId;
            // req.gpsx = 0;
            // req.gpsy = 0;
            // req.gpsadd = '';

            //服务端已经不用了
            req.ssid = ssid || 0;
            if (exData) {
                for (let key in exData) {
                    req[key] = exData[key]
                }

            }
            // AppLog.warn(JSON.stringify(req))
            App.NetManager.send(req);
        }

    }

    onRcvNetEnterGame(msg) {
        console.log('进入游戏请求返回')
        this.onRecNetCreateOrJoinRoom(msg)
    }

    //收到游戏内红包
    onRecvInGameRedpack(msg) {
        // if (msg.code == 200) {
        //     //bb
        //     if (Config.appId == Config.APPID.BigBang) {
        //         cc.loader.loadRes('hall_prefab/prefab_game_redpack', cc.Prefab, (err, res) => {
        //             if (!err) {
        //                 let obj = cc.instantiate(res)
        //                 let winSize = cc.winSize
        //                 obj.x = winSize.width / 2
        //                 obj.y = winSize.height / 2
        //                 let curScene = cc.director.getScene();
        //                 curScene.addChild(obj)
        //                 let scriptCmp = obj.getComponent('BB_RedPack')
        //                 if (scriptCmp) {
        //                     Global.playerData.coin = msg.coin;
        //                     UserData.coin = msg.coin
        //                     scriptCmp.doShow(msg.hb, msg.coin)
        //                 }
        //             }
        //         })
        //     }
        // }
    }

    onRecvActiveLunpan(msg) {
        // if (msg.code == 200) {
        //     if (Global.appId == Global.APPID.BigBang) {
        //         cc.loader.loadRes('hall_prefab/prefab_lunpan_active', cc.Prefab, (err, res) => {
        //             if (!err) {
        //                 let obj = cc.instantiate(res)
        //                 let winSize = cc.director.getWinSize()
        //                 obj.x = winSize.width / 2
        //                 obj.y = winSize.height / 2
        //                 let curScene = cc.director.getScene();
        //                 curScene.addChild(obj)
        //                 let scriptCmp = obj.getComponent('BB_Active_lunpan')
        //                 if (scriptCmp) {
        //                     scriptCmp.setData(msg)
        //                     Global.playerData.coin = msg.coin;
        //                     UserData.coin = msg.coin
        //                     // scriptCmp.doShow(msg.hb,msg.coin)
        //                 }
        //             }
        //         })
        //     }
        // }
    }

    //进入游戏
    EnterGame(gameId, ssid = null, data = null) {

        if (!App.NetManager.isNetAvailable()) {
            App.NetManager.showNetTipType(2)
            // 插入网络重连成功后的逻辑，再继续执行下面的逻辑
            // 尝试发起网络重连，重连成功后再进入游戏
            App.NetManager.reconnect();

            // 监听网络重连成功事件，然后再执行后续逻辑
            const enterGameAfterReconnect = () => {
                // 避免多次触发
                App.EventUtils.off("GAME_SERVER_SOCKET_OPENED", enterGameAfterReconnect);

                // 继续执行进入游戏逻辑
                this.enterGameId = gameId;
                let dataCfg = this.getGameConfig(gameId);

                if (!dataCfg) {
                    console.warn(`Game data configuration not found for gameId: ${gameId}`);
                    return;
                }
                console.log("EnterGame dataCfg:", dataCfg);
                this.sendEnterGameReq(gameId, ssid, data);
            };
            App.EventUtils.on("GAME_SERVER_SOCKET_OPENED", enterGameAfterReconnect, this);
            return
        }
        this.enterGameId = gameId

        let dataCfg = this.getGameConfig(gameId);

        if (!dataCfg) {
            console.warn(`Game data configuration not found for gameId: ${gameId}`);
            return;
        }
        console.log("EnterGame dataCfg:", dataCfg);
        this.sendEnterGameReq(gameId, ssid, data);


        // if (dataCfg.hallScene) {
        //     console.log("handleEnterGame:" + dataCfg.hallScene);
        //     App.SceneUtils.enterScene(dataCfg.hallScene, () => {
        //         (find('Canvas').getComponent('GameCenter') as any).init(gameId);
        //     }, dataCfg.orientation);
        // } else if (dataCfg.loadingScene) {
        //     console.log("handleEnterGame:" + dataCfg.loadingScene);
        //     this.handleLoadingScene(dataCfg, gameId, ssid, data);
        // } else if (dataCfg.bNoLoading) {
        //     console.log("handleEnterGame:" + dataCfg.bNoLoading);
        //     this.sendEnterGameReq(gameId, ssid, data);
        // } else {
        //     console.log("handleEnterGame: default");
        //     this.handleDefaultScene(dataCfg, gameId, ssid, data);
        // }
    }

    handleSelectRoom(dataCfg, gameId) {
        // if (!cc.vv.gameData) {
        //     let DataCmp = require(dataCfg.dataCmp);
        //     cc.vv.gameData = new DataCmp();
        //     cc.vv.gameData.init({ gameid: gameId, users: [] }, gameId);
        //     Global.dispatchEvent(EventId.STOP_ACTION);
        //     cc.vv.SceneMgr.enterScene(dataCfg.gameScene);
        // }
    }

    // handleLoadingScene(dataCfg, gameId, ssid, extData) {
    //     if (!cc.vv.gameData) {
    //         let DataCmp = require(dataCfg.dataCmp);
    //         cc.vv.gameData = new DataCmp();
    //         cc.vv.gameData.init({ gameid: gameId, users: [] }, gameId);
    //         Global.dispatchEvent(EventId.STOP_ACTION);

    //         cc.vv.SceneMgr.enterScene(dataCfg.loadingScene, (err, tarScene) => {
    //             if (err) {
    //                 console.warn(`Loading scene failed: ${dataCfg.loadingScene}`, err);
    //                 return;
    //             }

    //             if (gameId === GAME_ID.DZPK) {
    //                 cc.vv.GameManager.sendEnterGameReq(gameId, ssid, extData);
    //             }
    //         }, dataCfg.orientation);
    //     }
    // }

    handleDefaultScene(dataCfg, gameId, ssid, extData) {
        let ShowScene = dataCfg.loadingScene || dataCfg.gameScene;

        if (App.DeviceUtils.isYDApp()) {
            this.sendEnterGameReq(gameId, ssid, extData);
            // cc.director.preloadScene(ShowScene, (err) => {
            //     if (err) {
            //         console.warn(`Preload default scene failed: ${ShowScene}`, err);
            //     }
            // });
        } else {
            // cc.vv.SceneMgr.enterScene(ShowScene, (err, tarScene) => {
            //     if (err) {
            //         console.warn(`Enter default scene failed: ${ShowScene}`, err);
            //         return;
            //     }

            //     if (cc.vv.gameData) {
            //         cc.vv.gameData.clear();
            //     }

            //     let canvas = cc.find('Canvas');
            //     let loadCmp = canvas.getComponent('SlotMachine_Loading') || canvas.getComponent('LMSlots_Loading_Base');
            //     if (loadCmp && loadCmp.setEnterGame) {
            //         let data = this.getEnterOpation();
            //         loadCmp.setEnterGame(gameId, data, ssid);
            //         this.setEnterOpation(null);
            //     }
            // }, dataCfg.orientation);
        }
    }

    OnRcvNetAccountDelete(msg) {
        if (msg.code == 200) {
            App.SceneUtils.enterScene(Config.SCENE_NAME.LOGIN)
        }
    }
    /**
         * 更新推送token,以免登陆的获取到的是空的
         */
    updateFCMToken() {
        let tokenstr = App.PlatformApiMgr.GetFMCToken()
        if (this.lastFCMToken != tokenstr) {
            this.lastFCMToken = tokenstr
            App.NetManager.send({ c: App.MessageID.UPDATE_FCMTOKEN, token: tokenstr }, true)
        }
    }

    //创建房间或者加入房间
    onRecNetCreateOrJoinRoom(msgDic) {
        console.log("onRecNetCreateOrJoinRoom");
        // let res = this._checkJoinRoomSpcode(msgDic)
        if (msgDic.code == 200) {
            let data = this.getGameConfig(msgDic.gameid); // 水浒传 二人麻将统一配置
            if (data) {
                if (data.dataName === "gameData") {
                    let loadingScene = data.loadingScene;
                    if (loadingScene) {

                    }
                    let sceneName = data.loadingScene || data.gameScene;
                    if (App.SubGameManager.getSlotGameDataScript() == null) {
                        console.log('准备进入游戏场景' + sceneName)
                        if (App.SceneUtils.getCurSceneName() != sceneName) {
                            // Global.dispatchEvent("HALL_TO_GAME");
                            App.SubGameManager.entrySlotGameLoadingScene(sceneName, msgDic);
                        } else {
                            App.SubGameManager.entrySlotGame(sceneName, msgDic);
                        }
                    } else {
                        (App.SubGameManager.getSlotGameDataScript() as any).init(msgDic.deskinfo, msgDic.gameid, msgDic.gameJackpot);
                    }
                }
                else {
                    // let dataCmp = require(data.dataCmp);
                    // if (dataCmp) {
                    //     dataCmp.init(msgDic.deskinfo, true);
                    //     cc.vv[data.dataName] = dataCmp;
                    //     Global.dispatchEvent(EventId.STOP_ACTION);
                    //     AppLog.log('准备进入游戏场景' + data.gameScene)
                    //     cc.vv.SceneMgr.enterScene(data.gameScene, (err, tarScene) => {
                    //         let canvas = cc.find('Canvas')
                    //         let loadCmp = canvas.getComponent('SlotMachine_Loading')
                    //         if (!loadCmp) {
                    //             loadCmp = canvas.getComponent('LMSlots_Loading_Base')
                    //         }
                    //         if (loadCmp && loadCmp.setEnterGame) {
                    //             loadCmp.setEnterGame(msgDic.gameid)
                    //         }

                    //     }, data.orientation);
                    // }
                }

            }
        } else {
            console.log("onRecNetCreateOrJoinRoom msg check err");
        }

    }

    toRecharge(event) {

        if (App.userData().userInfo.firstRecharge && App.userData().userInfo.firstRecharge > 0) {
            App.PopUpManager.closeAllPopups();
            let gameHallCpt = director.getScene().getComponentInChildren(GameHall);

            if (gameHallCpt && gameHallCpt.pageTabbar) {
                gameHallCpt.pageTabbar.setPage(0);
            }
        } else {
            App.PopUpManager.addPopup("prefabs/popup/popupFirstRecharge", "hall", null, true);
        }
    }

    // 打开私人聊天界面
    // OPEN_PRIVATE_CHAT_VIEW(event) {
    //     let data = event;
    //     // 判断是否要更换聊天框
    //     let privateChatCpt = cc.director.getScene().getComponentInChildren("PopupPrivateChatView")
    //     if (privateChatCpt && privateChatCpt.uid != data.uid) {
    //         cc.vv.PopupManager.removePopup(privateChatCpt.node);
    //     }
    //     let endPos = cc.v3(0, cc.winSize.height * -0.5);
    //     cc.vv.PopupManager.addPopup("BalootClient/Social/PopupPrivateChat", {
    //         onShow: (node) => {
    //             node.position = endPos.add(cc.v3(0, -node.height));
    //             cc.tween(node).to(0.2, { position: endPos }, { easing: "quadOut" }).start();
    //             // TODO 设置聊天对象
    //             let cpt = node.getComponent("PopupPrivateChatView");
    //             cpt && cpt.init(data.uid);
    //         },
    //         onClose: (node) => {
    //             let tempNode = cc.instantiate(node);
    //             for (const cpt of tempNode.getComponentsInChildren(cc.Component)) {
    //                 if (cpt instanceof cc.Sprite || cpt instanceof cc.Label) {
    //                 } else {
    //                     cpt.enabled = false;
    //                 }
    //             }
    //             tempNode.parent = cc.find("Canvas");
    //             tempNode.zIndex = 1000
    //             cc.tween(tempNode)
    //                 .by(0.2, { y: -node.height }, { easing: "quadIn" })
    //                 .call(() => {
    //                     tempNode.destroy();
    //                 })
    //                 .start();
    //         },
    //     })
    // }

    getUserData() {
        return UserData;
    }

    getVipUserData() {
        return this.vipUserData;
    }

    setFavoriteGames(favoriteGames) {
        this.favoriteGameList = favoriteGames;
    }

    getFavoriteGames() {
        return this.favoriteGameList;
    }

    getAllGameList() {
        return this.allGameList;
    }

    getGameCategoryList() {
        return this.gameCategoryList;
    }



    async initUserData(serverData, loginConfig) {
        let playerData = serverData.playerInfo;
        const [vipData, gameListData, favoriteData, gameCategoryData] = await Promise.all([
            App.ApiManager.getVipUsers(),
            App.ApiManager.getAllGameList(),
            App.ApiManager.getFavoriteGames(),
            App.ApiManager.getGameCategoryList()
        ]);

        this.vipUserData = vipData;
        console.log(vipData, 'vipData')
        App.userData().svip = vipData.vipLevel;
        UserData.svip = vipData.vipLevel;
        this.allGameList = gameListData;

        // 筛选掉 favoriteData 中 gameVendorCode 以 InHouse 开头的项
        let filteredFavoriteData = [];
        if (Array.isArray(favoriteData)) {
            filteredFavoriteData = favoriteData.filter(item => {
                // 保证 gameVendorCode 存在且不以 InHouse 开头
                return !(typeof item.gameVendorCode === 'string' && item.gameVendorCode.startsWith('InHouse'));
            });
        }
        this.favoriteGameList = filteredFavoriteData;
        console.log("Favorite Games:", this.favoriteGameList);
        this.gameCategoryList = gameCategoryData;

        // 如果没有收藏游戏，使用热门游戏作为默认收藏
        if (!favoriteData || favoriteData.length === 0) {
            try {
                const popularGames = this.allGameList?.popular?.platformList || this.allGameList?.popular;

                if (Array.isArray(popularGames) && popularGames.length > 0) {
                    const maxCount = Math.min(popularGames.length, 8);

                    for (let index = 0; index < maxCount; index++) {
                        const element = popularGames[index];
                        if (element) {
                            this.favoriteGameList.push(element);
                        }
                    }
                }
            } catch (error) {
                console.warn('Error setting default favorite games:', error);
                this.favoriteGameList = [];
            }
        }

        // 游戏入口配置
        UserData.gameList = loginConfig.gamelist || [];

        UserData.gameList.sort((a, b) => { return a.ord - b.ord });
        // slots游戏配置
        UserData.slotsList = loginConfig.slotslist || [];

        UserData.slotsList.sort((a, b) => { return a.ord - b.ord });

        UserData.productids = loginConfig.productids || [];
        UserData.pinmsg = loginConfig.pinmsg;                     //聊天界面置顶数据

        UserData.slotVoteCountry = serverData.country || 0                  //老虎机投票国家
        UserData.namerewards = loginConfig.namerewards || []                 //新手改名字任务
        UserData.adpics = loginConfig.adpics || {}                           //广告位配置
        UserData.newbiedone = serverData.newbiedone || 0                    //新手任务完成状态
        UserData.charmpack = playerData.charmpack || 0                    //新手任务完成状态
        UserData.voice = serverData.voice || 0                              //是否开启语聊按钮
        UserData.tmpvip = playerData.tmpvip || 0                    //新手任务完成状态

        UserData.newapp = serverData.newappurl                                   //新版本信息
        UserData.appdownloadurl = serverData.appdurl                              //app下载地址
        //this.signrewards = serverData.signrewards                       //自动签到奖励
        UserData.vipsign = serverData.vipsign

        UserData.redem = serverData.verify.redem || 0                  //是否开启兑换码功能
        UserData.sender = serverData.verify.sender || 0                  //是否开启兑换码功能
        UserData.report = serverData.verify.report || 0                  //是否开启兑换码功能

        UserData.shoptimeout = loginConfig.shoptimeout || 0                  //限时商店是否开启
        UserData.novice = playerData.novice || 0                  //是否领取了改名字新手任务

        UserData.rate = loginConfig.rate || 0                  //是否弹窗点赞引导
        UserData.guide = playerData.guide || []                  //已经完成的引导列表
        UserData.club = serverData.club || {};                    // 俱乐部信息
        UserData.sess = serverData.sess;                    //匹配与排位游戏盲注配置
        UserData.sharelink = loginConfig.sharelink || "";              // FB分享链接
        UserData.uploadlink = loginConfig.uploadlink || "";
        UserData.rateios = loginConfig.rateios || "";
        UserData.rateandroid = loginConfig.rateandroid || "";
        UserData.contactus = loginConfig.contactus || "";
        //保存一下客服地址
        App.StorageUtils.saveLocal('contacturl', UserData.contactus)
        UserData.reg_bonus_coin = loginConfig.reg_bonus_coin    //注册送的金币数量
        UserData.sign_bonus_coin = loginConfig.sign_bonus_coin  //签到送的总金币数量

        UserData.feedback = loginConfig.feedback || "";
        UserData.charmList = loginConfig.charmList || [];        //礼物配置
        UserData.charmList.sort((a, b) => {
            return a.count - b.count;
        })

        UserData.charmDataList = playerData.charmlist || [];        //礼物免费次数

        UserData.pinlist = playerData.pinlist || [];        //沙龙配置
        UserData.fgamelist = playerData.fgamelist || [];        //沙龙配置

        // this.whatapplink = loginConfig.whatapplink || "";              // whatsapp链接
        // this.adtime = serverData.adtime;                    // 广告数据


        UserData.bindfbcoin = playerData.bindfbcoin;            // 绑定FB奖励金币
        UserData.bindfbdiamond = playerData.bindfbdiamond;      // 绑定FB奖励钻石
        UserData.newerpack = playerData.newerpack;              // 新手礼包状态

        UserData.avatarframe = playerData.avatarframe;      //头像框ID
        UserData.chatskin = playerData.chatskin;            //聊天框
        UserData.tableskin = playerData.tableskin;          //牌桌
        UserData.pokerskin = playerData.pokerskin;          //牌背
        UserData.frontskin = playerData.frontskin;          //字体颜色
        UserData.emojiskin = playerData.emojiskin;          //表情包
        UserData.emojilist = playerData.emojilist;            //所有表情
        UserData.faceskin = playerData.faceskin;            //牌花
        UserData.salonskin = playerData.salonskin;            //牌花
        UserData.salontesttime = playerData.salontesttime;            //牌花
        UserData.verifyfriend = playerData.verifyfriend;    //加好友是否需要验证
        UserData.charm = playerData.charm;                  //魅力值
        UserData.leagueexp = playerData.leagueexp;                  //排位分
        UserData.rp = playerData.rp || 0;                  //rp
        UserData.country = playerData.country || 0;                  //国籍
        UserData.getviplv = playerData.getviplv || [];

        // this.level = playerData.level;

        UserData.moneybag = playerData.moneybag;            //金猪当前值
        // this.moneybagFull = playerData.moneybagFull;            //金猪最大值
        UserData.nextbag = playerData.nextbag;            //金猪最大值
        UserData.roomcnt = playerData.roomcnt;            //当前开房数

        UserData.viproomcnt = playerData.viproomcnt || [];                    // 开房配置
        UserData.favoritegames = loginConfig.favorite_games || [];                    // 喜爱游戏

        UserData.uid = playerData.uid
        UserData.coin = playerData.coin
        UserData.userIcon = playerData.usericon
        UserData.sex = playerData.sex
        UserData.agent = playerData.agent
        UserData.nickName = playerData.playername
        UserData.memo = playerData.memo;
        UserData.inviteCode = playerData.code
        UserData.bindcode = playerData.bindcode;
        UserData.ip = playerData.ip;
        UserData.onlinestate = playerData.onlinestate;
        UserData.lrwardstate = playerData.lrwardstate;
        UserData.upcoin = serverData.upcoin;                // 修改昵称需要金币数量
        UserData.ispayer = playerData.ispayer;
        UserData.account = playerData.account;
        UserData.logincoin = playerData.logincoin;
        UserData.switch = playerData.switch || [];
        UserData.logintype = playerData.logintype; //登录方式：游客/微信/fb/账号
        UserData.isbindfb = playerData.isbindfb || 0;
        UserData.isbindapple = playerData.isbindapple || 0;
        UserData.isbindgoogle = playerData.isbindgoogle || 0;
        UserData.isbindghuawei = playerData.isbindghuawei || 0;
        UserData.isbindphone = playerData.isbindphone || 0;
        UserData.fbrewards = playerData.fbrewards || []; //FB绑定的奖励
        UserData.blockuids = playerData.blockuids || []; //屏蔽UIDS
        UserData.fbiconurl = playerData.fbicon    //fb头像地址
        UserData.spread = playerData.spread || 0;    //推广总代级别0，1，2，3
        UserData.luckRedvelopesNum = playerData.luckRedvelopesNum
        UserData.growup = serverData.growup
        UserData.evo = serverData.evo
        UserData._curExp = playerData.levelexp
        UserData._updateExp = playerData.levelup
        UserData._nextLvReward = playerData.next_level_reward;
        UserData.initgift = playerData.initgift;
        UserData.svip = playerData.svip || 0;
        UserData.svipexp = playerData.svipexp || 0;
        UserData.nextvipexp = playerData.nextvipexp || 0;   // vip升级到下一级需要充值的金额
        UserData.svipup = playerData.svipup || 0;
        UserData.leftdays = playerData.leftdays || 0;
        UserData.bonusList = loginConfig.bonuslist || [];
        UserData.activityList = serverData.activitylist
        UserData.offlineaward = playerData.offlineaward;    // 离线奖励
        UserData.offlinetime = playerData.offlinetime;      // 离线时间
        UserData.popLuckySpin = serverData.fbshare || serverData.bonuswheel //是否需要弹出转盘

        UserData.ecoin = playerData.ecoin;  // 不可提现金额
        UserData.dcoin = playerData.dcoin;  // 可提现金额
        UserData.cashbonus = playerData.cashbonus;  // 优惠钱包金额
        UserData.dcashbonus = playerData.dcashbonus;  // 可提现到现金余额的金额
        UserData.bankcoin = playerData.bankcoin;  // 保险箱余额
        UserData.todaybonus = playerData.todaybonus;  //

        UserData.invit_uid = playerData.invit_uid //上级代理的uid



        UserData.logonTime = new Date().getTime()
        UserData.serverTime = serverData.servertime
        UserData._levelGift = 0;
        UserData._richpoint = playerData.upoint
        UserData._diamond = playerData.diamond || 0

        UserData.kycstatus = playerData.kyc || 0;

        UserData.payurl = loginConfig.payurl;
        UserData.contactus = loginConfig.contactus;
        UserData.kycUrl = loginConfig.kyc;
        UserData.drawUrl = loginConfig.drawurl;
        UserData.transactionUrl = loginConfig.transaction;
        UserData.paymentUrl = loginConfig.payment;
        UserData.addInvite = playerData.invits //新增的代理数
        UserData.emotionProplist = loginConfig.proplist
        UserData.lepordgames = loginConfig.lbgames //排行榜游戏参与的游戏
        UserData.salonVip = loginConfig.salonvip //沙龙限制的vip
        UserData.notice = loginConfig.notice
        UserData.rebatGames = loginConfig.rbgameids

        UserData.todayrewards = loginConfig.todayrewards
        UserData.bonus_prom = loginConfig.promoopen //bonus中促销是否打开

        App.StorageUtils.saveLocal(App.StorageKey.SAVE_KEY_LOGIN_TYPE, String(UserData.logintype));

        // 记住密码
        // 保存token
        let tokenStrs = App.StorageUtils.getLocal(App.StorageKey.SAVE_PLAYER_TOKEN);
        let tokenList = {};
        if (tokenStrs !== '') {
            tokenList = JSON.parse(tokenStrs);
        }
        if (UserData.logintype !== Config.LoginType.Guest) {
            if (tokenList[UserData.nickName]) tokenList[UserData.nickName] = {};
        }
        tokenList["curr_account"] = UserData.nickName;                  // 当前登录账号
        App.StorageUtils.saveLocal(App.StorageKey.SAVE_PLAYER_TOKEN, JSON.stringify(tokenList));
    }

    isNoNeedDownGame(gameId) {
        return false;
    }

    // 游戏入口配置
    recvGameList(msg) {
        if (msg.code === 200) {
            if (msg.gamelist[0]) {
                UserData.gameList = msg.gamelist[0];
                UserData.gameList.sort((a, b) => {
                    return a.ord - b.ord;
                });
            }

            if (msg.gamelist[1]) {
                UserData.slotsList = msg.gamelist[1]
                UserData.slotsList.sort((a, b) => {
                    return a.ord - b.ord;
                });
            }
            // Global.dispatchEvent("GAME_LIST_UPDATE");
        }
    }

    // 服务器推送 金币钻石变化同步
    onMoneyChange(msg) {
        if (msg.bankcoin) {
            UserData.bankcoin = msg.bankcoin;
        }
        if (msg.coin) {
            this.setCoin(msg.coin, true)
        }
        if (msg.diamond) {
            this.setDiamond(msg.diamond, true)
        }
    }

    // 主动同步金币
    onSyncCoin(msg) {
        if (msg.coin) {
            this.setCoin(msg.coin, true)
        }
        if (msg.diamond) {
            this.setDiamond(msg.diamond, true)
        }
        if (msg.levelexp) {
            UserData._curExp = msg.levelexp;
            // UserData.setUpdateExp(msg.levelup);
            // 发出事件通知
            App.EventUtils.dispatchEvent("USER_EXP_CHANGE");
        }
    }

    // 设置
    setCoin(val, bRefushHall) {
        UserData.coin = Number(val.toFixed(2));
        // this.totalcoin = this.coin + this.cashbonus + this.bankcoin;
        if (bRefushHall) {
            App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS)
        }
    }

    onBonusChange(msg) {
        if (msg.code != 200) return;
        // 更新本地数据
        UserData.bonusList = msg.bonuslist;
        // 发出事件通知
        App.EventUtils.dispatchEvent("BONUS_CHANGE");
    }

    // 更新本地用户信息
    onUserInfoChange(msg) {
        if (msg.code != 200) return;
        if (msg.spcode) {
            let spVal = msg.spcode
            if (spVal == 1073) {
                App.AlertManager.showFloatTip("This username is not available");
            }
            return
        }
        let data = msg.user;
        // 修改内存数据
        if (data.playername) UserData.nickName = data.playername;
        if (data.sex) UserData.sex = data.sex;
        if (data.redem) UserData.redem = data.redem;
        if (data.sender) UserData.sender = data.sender;
        if (data.report) UserData.report = data.report;
        if (data.usericon) UserData.userIcon = data.usericon;
        if (data.avatarframe) UserData.avatarframe = data.avatarframe;
        if (data.chatskin) UserData.chatskin = data.chatskin;
        if (data.tableskin) UserData.tableskin = data.tableskin;
        if (data.pokerskin) UserData.pokerskin = data.pokerskin;
        if (data.frontskin) UserData.frontskin = data.frontskin;
        if (data.emojiskin) UserData.emojiskin = data.emojiskin;
        if (data.faceskin) UserData.faceskin = data.faceskin;
        if (data.salonskin) UserData.salonskin = data.salonskin;
        if (data.salontesttime) UserData.salontesttime = data.salontesttime;
        // if (data.svip) UserData.svip = data.svip;
        // if (data.svip) UserData.svip = 0;
        if (data.svipexp) UserData.svipexp = data.svipexp;
        if (data.nextvipexp) UserData.nextvipexp = data.nextvipexp;
        if (data.svipup) UserData.svipup = data.svipup;
        if (data.leftdays) UserData.leftdays = data.leftdays;
        if (data.emojilist) UserData.emojilist = data.emojilist;
        if (data.verifyfriend) UserData.verifyfriend = data.verifyfriend;
        if (data.viproomcnt) UserData.viproomcnt = data.viproomcnt;
        if (data.charm) UserData.charm = data.charm;
        if (data.leagueexp) UserData.leagueexp = data.leagueexp;
        if (data.fgamelist) UserData.fgamelist = data.fgamelist;
        if (data.blockuids) UserData.blockuids = data.blockuids;
        if (data.roomcnt) UserData.roomcnt = data.roomcnt;
        if (data.rp) UserData.rp = data.rp;
        if (data.country) UserData.country = data.country;
        if (data.getviplv) UserData.getviplv = data.getviplv;
        if (data.tmpvip) UserData.tmpvip = data.tmpvip;
        // if (data.moneybagFull) UserData.moneybagFull = data.moneybagFull;
        if (data.nextbag) UserData.nextbag = data.nextbag;
        if (data.charmlist) UserData.charmDataList = data.charmlist;

        if (data.coin) this.setCoin(data.coin, true)
        if (data.ecoin) UserData.ecoin = data.ecoin;
        if (data.dcoin) UserData.dcoin = data.dcoin;
        if (data.cashbonus) UserData.cashbonus = data.cashbonus;
        if (data.dcashbonus) UserData.dcashbonus = data.dcashbonus;
        if (data.bankcoin) UserData.bankcoin = data.bankcoin;
        if (data.todaybonus) UserData.todaybonus = data.todaybonus;
        if (data.kyc) UserData.kycUrl = data.kyc
        if (data.isbindphone) UserData.isbindphone = data.isbindphone

        if (data.moneybag) {
            UserData.moneybag = data.moneybag;
            if (data.moneybag > 0) {
                //动画表现
                App.EventUtils.dispatchEvent("USER_PIGGY_BANK_HINT_NEW");
            }
            //同时刷新UI TODO：感觉可以合成一个消息的
            //bag值变化
            App.EventUtils.dispatchEvent("USER_PIGGY_BANK_CHANGE");
        }
        if (data.invits) {
            App.EventUtils.dispatchEvent("EVENT_ADD_REFFER", data.invits);
        }
        // 发送事件 通知信息已经更新
        App.EventUtils.dispatchEvent("USER_INFO_CHANGE");
    }

    // 更新俱乐部信息
    onClubInfoChange(msg) {
        if (msg.code != 200) return;
        if (msg.spcode && msg.spcode > 0) return;
        let club = msg.club || {};
        if (club.name) UserData.club.name = club.name;
        if (club.avatar) UserData.club.avatar = club.avatar;
        if (club.detail != undefined) UserData.club.detail = club.detail;
        if (club.cap != undefined) UserData.club.cap = club.cap;
        if (club.join_type != undefined) UserData.club.join_type = club.join_type;
        // 发送事件 通知信息已经更新
        App.EventUtils.dispatchEvent("CLUB_INFO_CHANGE");
    }

    // 被俱乐部加入
    onJoinClub(msg) {
        UserData.club = msg.club;
    }

    // 被俱乐部踢出
    onKickOffByClub(msg) {
        UserData.club = {} as any;
    }

    // 用户等级提升
    onLevelUpExp(msg) {
        if (msg.code != 200) return;
        // 修改本地数据
        UserData._curExp = msg.info.levelexp;
        // 发出事件通知
        App.EventUtils.dispatchEvent("USER_EXP_CHANGE");
    }

    // 充值完成回调
    onRechargeOver(msg) {
        if (msg.code != 200) return;
        //打点
        App.PlatformApiMgr.KoSDKTrackEvent('Purchase', { currency: "INR", value: msg.coin })
        if (msg.first == 1) {
            App.PlatformApiMgr.KoSDKTrackEvent('FirstPurchase', { uid: msg.uid, currency: "INR", value: msg.coin })
        }
    }

    // 礼物广播
    onGiftBroadcast(msg) {
        if (msg.code != 200) return;
        // 拒接他人礼物动画
        let isRefuseGiftAnim = Number(App.StorageUtils.getLocal("REFUSE_GIFT_ANIM", '0'));
        if (isRefuseGiftAnim == 1 && (msg.send.uid != UserData.uid && msg.receive.uid != UserData.uid)) {
            return;
        }

        // if (director.getScene().name == Config.SCENE_NAME.HALL) {
        //     App.BroadcastManager.addGiftAnim(msg);
        // } else {
        //     // 房间内存在接受者,则播放动画
        //     if (window.facade && window.facade.commonProxy && window.facade.commonProxy.checkPlayerInTable) {
        //         if (window.facade.commonProxy.checkPlayerInTable(msg.send.uid) || window.facade.commonProxy.checkPlayerInTable(msg.receive.uid)) {
        //             cc.vv.BroadcastManager.addGiftAnim(msg);
        //         }
        //     }
        //     //或者在slot中
        //     if (cc.vv.gameData && cc.vv.gameData.getGameId && cc.vv.gameData.getGameId() > 600) {
        //         if (msg.receive.uid == cc.vv.UserManager.uid) {
        //             cc.vv.BroadcastManager.addGiftAnim(msg);
        //         }
        //     }
        // }
    }

    // 走马灯
    onNoticeBroadcast(msg) {
        if (msg.code != 200 || director.getScene().name != Config.SCENE_NAME.HALL) return;
        // 进行跑马灯播报
        App.BroadcastManager.addBroadcast({
            content: msg.notices.msg,
            extra_info: msg.notices.extra_info,
            direction: 1,
            // direction: cc.vv.i18nManager.getLanguage() == cc.vv.i18nLangEnum.AR ? 2 : 1,
            level: msg.level,
        });
    }

    onMailNotify(msg) {
        if (msg.code != 200) return;
        // cc.vv.RedHitManager.setKeyVal("mail_notify", cc.vv.RedHitManager.data["mail_notify"] + 1);
    }

    // 金猪
    onPiggyBankNotify(msg) {
        if (msg.code != 200) return;
        // 更新金猪的金币数
        UserData.moneybag = msg.moneybag;
        UserData.nextbag = msg.nextbag;
        // UserData.moneybagFull = msg.moneybagFull;
        // 发出事件通知
        App.EventUtils.dispatchEvent("USER_PIGGY_BANK_CHANGE");
    }

    // 收到一条好友私聊信息 
    onRevFriendMsg(msg) {
        // 自己不接受自己发的私聊信息
        if (msg.data.uid == UserData.uid) return;
        // 如果已经在私聊界面 则不提示
        // let topPopup = App.PopupManager.getTop()
        // if (topPopup) {
        //     let chatCpt = topPopup.getComponent("PopupPrivateChatView")
        //     if (chatCpt && chatCpt.uid == msg.data.uid) {
        //         return;
        //     }
        // }
        // cc.loader.loadRes("BalootClient/Social/PrivateChatMsgHint", cc.Prefab, (err, prefab) => {
        //     if (!!err) return;
        //     let node = cc.instantiate(prefab);
        //     node.parent = cc.find("Canvas")
        //     node.zIndex = 1000;
        //     node.getComponent("PrivateChatMsgHintCpt").run(msg.data);
        // });
    }

    // 分享奖励结果
    onShareReward(msg) {
        if (msg.code != 200) return;
        if (msg.spcode && msg.spcode > 0) {
            App.AlertManager.showFloatTip(App.CommonUtils.spcode2String(msg.spcode));
            return;
        }
        if (msg.rewards) {
            App.AnimationUtils.RewardFly(msg.rewards, find("Canvas").getComponent(UITransform).convertToWorldSpaceAR(v3(0, -App.ScreenUtils.getScreenHeight / 2 + 700, 0)));
        }
    }

    // 联赛分数更新
    onLeagueExpChange(msg) {
        if (msg.code == 200) {
            for (const item of UserData.gameList) {
                if (item.id == msg.gameid) {
                    item.leagueexp = msg.exp;
                }
            }
        }
    }

    // 国家投票最高票数更新
    onCountryTopChange(msg) {
        if (msg.code == 200) {
            for (const item of UserData.gameList) {
                if (item.id == msg.gameid) {
                    item.topCountry = msg.topCountry;
                }
            }
        }
    }

    onPingMsg(msg) {
        if (msg.code == 200) {
            UserData.pinmsg = msg.pinmsg
        }
    }

    setCurLv(level) {
        UserData.level = level;
        App.StorageUtils.saveLocal("userlv", level.toString());
    }

    getCurLv() {
        return this.totalExp2Level(UserData._curExp);
    }

    totalExp2Level(totalExp) {
        for (let i = App.GameData.exp_cfg.length - 1; i >= 0; i--) {
            let levelInfo = App.GameData.exp_cfg[i];
            if (totalExp >= levelInfo[1]) {
                return levelInfo[0];
            }
        }
        return 1;
    }

    getVipLevel() {
        return this.vipExp2Level(UserData.svipexp);
    }

    vipExp2Level(vipexp) {
        let level = 0
        for (let i = 0; i < App.GameData.vipInfoConfig.length; i++) {
            const cfg = App.GameData.vipInfoConfig[i];
            if (vipexp >= cfg.expup) {
                level = i;
            }
        }
        return level
    }

    //新增的代理数
    getAddInvite() {
        return UserData.addInvite
    }

    // 设置震动开关状态
    setShakeStatus(status) {
        if (status) {
            App.StorageUtils.saveLocal("ROOM_SHAKE_STATUS", "1");
        } else {
            App.StorageUtils.saveLocal("ROOM_SHAKE_STATUS", "0");
        }
    }

    // 获取震动开关状态
    getShakeStatus() {
        let status = App.StorageUtils.getLocal("ROOM_SHAKE_STATUS", "1");
        if (status && status == "1") {
            return true;
        }
        return false;
    }

    getRegisterCoin() {
        return UserData.reg_bonus_coin
    }

    getSignTotalCoin() {
        return UserData.sign_bonus_coin
    }

    //游戏是否开放
    isGameOpen(gameid) {
        for (const _item of UserData.gameList) {
            if (_item.id == gameid || gameid == 9999) {
                return true;
            }
        }
        return false;
    }

    getSalonVip() {
        return UserData.salonVip
    }

    //是否在反水游戏列表
    isInRebateGames(val) {
        let res = false
        for (let i = 0; i < UserData.rebatGames.length; i++) {
            if (val == UserData.rebatGames[i]) {
                res = true
                break
            }
        }
        return res
    }

    //bonus促销是否打开
    isBonusPromOpen() {
        return UserData.bonus_prom
    }

    //初始化登陆服务器下发的数据
    initLoginServer(loginServerData) {
        UserData.gameServer = loginServerData.net;
        UserData.token = loginServerData.token;
        UserData.serverId = loginServerData.server;
        UserData.subId = loginServerData.subId;
        UserData.uid = loginServerData.uid;
        UserData.unionid = loginServerData.unionid;
    }

    setNickName(name) {
        UserData.nickName = name;
    }

    getNickName() {
        return UserData.nickName
    }

    setLoginType(val) {
        UserData.logintype = val
    }
    getLoginType() {
        return UserData.logintype
    }

    setIsBindFb(isBind) {
        UserData.isbindfb = isBind ? true : false;
    }

    isBindFb() {
        return UserData.isbindfb;
    }

    setIsBindGoogle(isBind) {
        UserData.isbindgoogle = isBind ? true : false;
    }

    isBindGoogle() {
        return UserData.isbindgoogle;
    }

    getDiamond() {
        return UserData._diamond;
    }
    setDiamond(val, bRefushHall) {
        UserData._diamond = val;
        if (bRefushHall) {
            App.EventUtils.dispatchEvent(App.EventID.UPATE_DIAMOND)
        }
    }

    //是否已经下载过这个子游戏
    isDownloadSubGame(gameId) {
        if (App.DeviceUtils.isNative()) {

            let gameCfg = App.GameItemCfg[gameId]
            if (gameCfg) {
                let name = gameCfg.name
                let file = App.StorageUtils.getLocal(name);
                if (file) {
                    return true; //已经下载过了
                } else {
                    return false;
                }
            }
            {
                //没有配置入口
                console.warn('没有配置入口' + gameId)
                return true
            }

        }
        else {
            return true
        }

    }

    onRcvLessCoinPoplist(msg) {
        if (msg.code == 200) {
            this.notEnoughCoinPopList = {} as any;
            this.notEnoughCoinPopList.list = msg.poplist
            this.notEnoughCoinPopList.bforse = msg.forcepop
            this.notEnoughCoinPopList.first = msg.first
            this.updatePopParams(msg.popParams)
        }
    }

    updatePopParams(data) {
        if (this.popParams) {
            //追加
            for (var item in data) {
                this.popParams[item] = data[item]
            }

        }
        else {
            this.popParams = data
        }
    }

    getNotEncoughCoinPoplist() {
        return this.notEnoughCoinPopList
    }


    setNotEncoughPopForceFlag(val) {
        if (this.notEnoughCoinPopList) {
            this.notEnoughCoinPopList.bforse = val
        }

    }

    onRecvRefreshHallInfo(msg) {
        if (msg.code == 200) {
            this.setCoin(msg.coin, true)
            this.setDiamond(msg.diamond, true)
            UserData.favoritegames = msg.favorite_games
        }
    }

    setHallBundle(bundle: AssetManager.Bundle) {
        this.hallBundle = bundle;
    }


    getHallBundle(): AssetManager.Bundle {
        return this.hallBundle;
    }
}

