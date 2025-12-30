import { _decorator, Component, Node } from 'cc';
import { App } from '../App';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('UserManager')
export class UserManager extends GameManager {
    private static instance: UserManager;
    userData: any = {
        //=========首次登陆下发的数据=====
        gameServer: '',  //服务端下发的游服地址
        token: '',       //首次登陆的token
        serverId: '',    //服务器id
        subId: '',
        //==============================
        uid: 0,         //用户id
        openid: 0,      //用户openid（第三方id）

        totalcoin: 0,
        dcoin: 0,
        cashbonus: 0,
        dcashbonus: 0,
        bankcoin: 0,
        coin: {
            get() {
                return this._coin ? this._coin : 0;
            },
            set(value) {
                this._coin = value;
            }
        },        //金币
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



        bank_token: null, //银行token
        bank_info: {}, //银行信息
        rememberPsw: false,
        gameList: null,  // 有些列表
        isAutoLogin: false,  // 自动登录
        // notice:"",      // 公告
        luckRedvelopesNum: 0,    //幸运红包的个数
        growup: null,    //成长星级
        red_envelop: 0,      // bigbang红包
        // localFavList:null,  //本地的喜爱列表
        areaCode: null,      //http服务器下发的区域代码
        evo: 0,      //是否在casino中

        _stampInfo: null,   // 邮票信息

        svip: 0,    //vip等级
        svipexp: 28,    //vip经验
        svipup: 1,  //vip升级经验

        logonTime: 0,
        serverTime: 0,

        bonusList: null, //bonus页面的显示活动

        guides: null,    //已经完成的引导列表

        favorite_games: [], //喜爱列表

        _notEnoughCoinPopList: null, //金币不足的弹框

        activityTipsInGame: false, //游戏内活动提示
        questmaxcoin: 0,//QUEST奖励金币
        _dailygift: null,//0:不可领取，1可以领取

        _richpoint: 0,  //富豪点

        _hallIconSpin: [],

        _firstBuyGift: {},  //首充
        _diamond: 0,
        _noticerewards: 0,//召回奖励金币
        _questroundid: 1,//当前第几轮quest
        _bingoFrom: 1,// 从哪进入bingo
        _popParams: null,//弹窗游戏id
        _betData: {},//押注数据
        playedGameIds: [], //玩家玩过的游戏列表

        _bonusTab: 0,
        _hallRankData: {},//大厅排行数据

        _pvpRank: '', //pvp排名
        _pvpScore: '', //pvp积分
        _pvpCC: '',//pvp战力
        _pvp_defend_team: [],
        _popupSign: true,
    }; //用户数据

    protected onLoad(): void {
        App.UserManager = this;
    }
    start() {

    }

    update(deltaTime: number) {

    }

    getNickName() {
        return this.userData.nickName;
    }
}


