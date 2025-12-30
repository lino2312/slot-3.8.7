import { sys } from "cc";
import { App } from "../App";
import { Config } from "../config/Config";

export class ApiManager {
    private static _instance: ApiManager = null;
    public static getInstance(): ApiManager {
        if (this._instance == null) {
            this._instance = new ApiManager();
        }
        return this._instance;
    }

    // 一键洗码  CodeType = -1 领取所有返水
    async addCodeWashRecord(codeType: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { codeType };
            App.HttpUtils.sendPostRequest("AddCodeWashRecord", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("一键洗码", codeType, response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 洗码量 GetCodeWashAmount   codeType = -1 获取返水总金额
    async getCodeWashAmount(codeType: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { codeType };
            App.HttpUtils.sendPostRequest("GetCodeWashAmount", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("洗码量:", codeType, response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取VIP奖励  
    async addReceiveAward(vipLevel: number, rewardType: number, receiveId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { vipLevel, rewardType, receiveId };
            App.HttpUtils.sendPostRequest("AddReceiveAward", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领取VIP奖励 :", vipLevel, response);
                    if (response.msg) {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                    }
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取VIP会员奖励
    async getListVipUserRewards(vipLevel: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { vipLevel };
            App.HttpUtils.sendPostRequest("GetListVipUserRewards", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取VIP会员奖励:", vipLevel, response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }


    // 红包兑换
    async conversionRedpage(giftCode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { giftCode };
            App.HttpUtils.sendPostRequest("ConversionRedpage", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        if (response.msg) {
                            App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        }
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 今日活动列表
    async getTodayRewards(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetTodayRewards", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("今日活动列表:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 查询可购买的促销卡
    async getPromotionCardsList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetPromotionCardsList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("查询可购买的促销卡:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        // App.AlertManager.showFloatTip(response.msg);
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg)
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 购买促销卡
    async getPromotionCards(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { id };
            App.HttpUtils.sendPostRequest("GetPromotionCards", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        if (response.msg) {
                            // App.AlertManager.showFloatTip(response.msg);
                            App.AlertManager.getCommonAlert().showWithoutCancel(response.msg)
                        }
                        resolve(response.data);
                    } else {
                        // App.AlertManager.showFloatTip(response.msg);
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg)
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 查询已结算未领取的促销卡奖金
    async getPromotionCardsDayBonusList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetPromotionCardsDayBonusList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("查询已结算未领取的促销卡奖金:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领奖促销卡每日奖金
    async getPromotionCardsDayBonus(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetPromotionCardsDayBonus", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领奖促销卡每日奖金:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取充值大类列表
    async getPayTypeName(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetPayTypeName", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取充值大类列表:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 充值通道列表
    async getRechargeTypes(payid: number, payTypeId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { payid, payTypeId };
            App.HttpUtils.sendPostRequest("GetRechargeTypes", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetRechargeTypes:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取 ARB 钱包会员信息
    async getARBWalletMemberInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest(
                "ARBWalletMemberInfo",
                { ip: sys.localStorage.getItem('ARIP') || "158.62.17.55" },
                (error, response) => {
                    console.log("ARBWalletMemberInfo:", response);
                    if (error) {
                        console.warn(error);
                        reject(error);
                    } else {
                        if (response.code == 0 && response.msg == "Succeed") {
                            resolve(response.data);
                        } else {
                            App.AlertManager.showFloatTip(response.msg);
                            reject(new Error(response.msg));
                        }
                    }
                }
            );
        });
    }

    // ARB 钱包进入
    async arbWalletEnter(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("ARBWalletEnter", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // ARB 钱包激活
    async arbWalletActivate(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("ARBWalletActivate", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        let url = response.data.walletActivationPageUrl;
                        if (url.includes("lang=")) {
                            url = url.replace(/lang=[^&]*/i, "lang=0");
                        } else {
                            url += (url.includes('?') ? '&' : '?') + 'lang=0';
                        }
                        response.data.walletActivationPageUrl = url;
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 新建充值银行订单
    async newSetRechargesBankOrder(
        amount: number,
        payTypeId: number,
        transferType: number,
        accountName: string,
        bankAccountNumber: string
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                amount,
                payTypeId,
                transferType,
                accountName,
                bankAccountNumber,
            };
            App.HttpUtils.sendPostRequest("NewSetRechargesBankOrder", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("NewSetRechargesBankOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // USDT充值订单
    async rechargeUsdtOrder(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("RechargesUsdtOrder", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("RechargesUsdtOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 更新USDT充值订单
    async updateRechargesUsdtOrder(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("UpdateRechargesUsdtOrder", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("UpdateRechargesUsdtOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取USDT订单
    async getUsdtOrder(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetUsdtOrder", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetUsdtOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 更新UPI充值订单
    async updateRechargesUpiOrder(orderNo: string, tranrefId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                orderNo,
                tranrefId,
                type: 1,
            };
            App.HttpUtils.sendPostRequest("updateRechargesUpiOrder", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("updateRechargesUpiOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取银行订单
    async getBankOrder(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetBankOrder", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetBankOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取银行订单详情
    async getBankOrderInfo(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetBankOrderInfo", query, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetBankOrderInfo:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 充值记录
    async getRechargeRecord(state: number, pageNo: number, pageSize: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                startDate: '',
                endDate: '',
                state,
                payId: -1,
                payTypeId: -1,
                pageNo,
                pageSize //每页10条
            };
            App.HttpUtils.sendPostRequest("GetRechargeRecord", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetRechargeRecord:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取个人信息
    async getUserInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetUserInfo", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取个人信息:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        // 如需赋值全局变量请在外部处理
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提现大类
    async getWithdrawalTypes(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetWithdrawalTypes", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("提现大类:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提现记录
    async getWithdrawLog(state: number, pageNo: number, pageSize: number): Promise<any> {
        console.log("[DEBUG] getWithdrawLog CALLED with state =", state);
        return new Promise((resolve, reject) => {
            let additionalParams = {
                startDate: '',
                endDate: '',
                state: state,
                payId: -1,
                payTypeId: -1,
                pageNo,
                pageSize //每页10条
            };
            App.HttpUtils.sendPostRequest("GetWithdrawLog", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("提现记录:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提现通道列表
    async getWithdrawals(withdrawid: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { withdrawid };
            App.HttpUtils.sendPostRequest("getWithdrawals", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("提现通道列表:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        // App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提现银行卡列表
    async getBankList(withdrawID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { withdrawID };
            App.HttpUtils.sendPostRequest("GetBankList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("提现银行卡列表:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提现申诉
    async newSetWithdrawal(amount: number, type: number, bid: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // 如需获取 yc_pwd，请确保 Global.getLocal 可用
            let yc_pwd = sys.localStorage.getItem('yc_pwd', "") || "";
            let additionalParams = {
                amount,
                type,
                bid,
                pwd: yc_pwd,
            };
            App.HttpUtils.sendPostRequest("NewSetWithdrawal", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("提现申诉:", response);
                    if (response.code == 0) {
                        resolve(response);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 添加银行卡
    async setWithdrawalBankCard(
        beneficiaryname: string,
        accountno: string,
        mobileno: string,
        ifsccode: string,
        bankid: number
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const code_type = 6;
            let additionalParams = {
                beneficiaryname,
                accountno,
                mobileno,
                ifsccode,
                bankid,
                bankbranchaddress: "",
                bankcitycode: "",
                bankprovincecode: "",
                codeType: code_type,
                email: "",
                smsCode: "",
                type: "",
            };
            App.HttpUtils.sendPostRequest("SetWithdrawalBankCard", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("添加银行卡:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        // 如需赋值全局变量请在外部处理
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 添加USDT
    async setWithdrawalUSDT(
        usdtaddress: string,
        usdtRemarkName: string,
        bankid: number,
        withdrawid: number
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const code_type = 7;
            let additionalParams = {
                usdtaddress,
                usdtRemarkName,
                bankid,
                withdrawid,
                codeType: code_type,
                smsCode: "",
                type: "",
            };
            App.HttpUtils.sendPostRequest("SetWithdrawalUSDT", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("添加USDT:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        // 如需赋值全局变量请在外部处理
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 添加电子钱包
    async setWithdrawalNewUPI(
        beneficiaryname: string,
        accountNo: string,
        withdrawID: number,
        smsCode: string,
        mobile: string
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const code_type = 8;
            let additionalParams = {
                beneficiaryname,
                accountNo,
                codeType: code_type,
                smsCode: smsCode || "",
                type: "",
                withdrawId: withdrawID,
                mobileNo: mobile,
            };
            App.HttpUtils.sendPostRequest("SetWithdrawalNewUPI", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("添加电子钱包:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    async setWithdrawalWallet(query: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const code_type = 8;
            let additionalParams = {
                ...query,
                codeType: code_type,
                type: "",
            };
            App.HttpUtils.sendPostRequest("SetWithdrawalWallet", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("添加电子钱包:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取注册设置
    async registerState(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("RegisterState", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取注册设置:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 修改昵称
    async editNickName(name: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const additionalParams = { nikeName: name };

            App.HttpUtils.sendPostRequest("EditNickName", additionalParams, (error, response) => {

                if (error) {
                    console.warn(error);
                    reject(error);
                    return;
                }
                console.log("EditNickName Response:", response);
                if (response.code === 0 && response.msg === "Succeed") {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });
    }


    // 发送短信
    // async smsVerifyCode(phone: string, codeType: number): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         let additionalParams = {
    //             phone,
    //             codeType,
    //         };
    //         App.HttpUtils.sendPostRequest("SmsVerifyCode", additionalParams, (error, response) => {
    //             if (error) {
    //                 console.warn(error);
    //                 reject(error);
    //             } else {
    //                 console.log("发送短信:", response);
    //                 resolve(response);
    //             }
    //         });
    //     });
    // }

    async smsVerifyCode(phone: string, codeType: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                phone,
                codeType,
            };
            App.HttpUtils.sendPostRequest("SmsVerifyCode", additionalParams, (error, response) => {
                if (error) {
                    console.warn("SMS verification error:", error);
                    reject(error);
                } else {
                    console.log("SMS verification response:", response);

                    // Check if the API response indicates success
                    // Based on your response: code: 1 means failure, code: 0 would mean success
                    if (response && response.code === 0) {
                        resolve(response); // Success
                    } else {
                        // API returned failure - reject the promise
                        const errorMsg = response?.msg || 'Failed to send SMS code';
                        console.warn("SMS verification failed:", errorMsg);
                        reject(new Error(errorMsg));
                    }
                }
            });
        });
    }

    // 忘记密码
    async forgetPassword(phone: string, password: string, smsvcode: string, type: number | string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                username: phone,
                password,
                smsvcode,
                type,
            };
            App.HttpUtils.sendPostRequest("ForgetPassword", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("忘记密码:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 上分
    async getGameUrl(gameCode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // 如需 Global.getCategory/Global.domainurl，请在外部处理
            let vendorCode = App.GameManager.getCategory(parseInt(gameCode));
            let additionalParams = {
                vendorCode,
                gameCode,
                returnUrl: Config.domainurl,
                phonetype: 0,
            };
            App.HttpUtils.sendPostRequest("GetGameUrl", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("上分:", response);
                    resolve(response);
                }
            });
        });
    }

    // 下分
    async getUserAmount(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetUserAmount", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("下分:", response);
                    resolve(response);
                }
            });
        });
    }

    // 轮播图
    async getBannerList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetBannerList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("轮播图:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 三方钱包
    async getAllWallets(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetAllWallets", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("三方钱包:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取用户余额
    async getBalance(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetBalance", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取用户余额:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 一键回收余额
    async recoverBalance(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("RecoverBalance", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取用户余额:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取钱包
    async getWallet(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetWallet", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetWallet:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取奖金钱包设置
    async getBonusWalletSettings(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("BonusWalletSettings", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("BonusWalletSettings:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 亚彩登录
    async yaCaiLogin(username: string, pwd: string, optstr?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let uuid = App.DeviceUtils.getDeviceId();
            let additionalParams = {
                username,
                pwd,
                logintype: "mobile",
                phonetype: -1,
                uuid,
                vCode: optstr || null
            };
            App.HttpUtils.sendPostRequest("Login", additionalParams, (error, response) => {
                console.log("亚彩登录:", response);
                if (response.code == 0 && response.msg == "Succeed") {
                    App.StorageUtils.saveLocal('loginToken', response.data.token);
                    App.StorageUtils.saveLocal('tokenHeader', response.data.tokenHeader);
                    App.StorageUtils.saveLocal('refreshToken', response.data.refreshToken);
                    App.StorageUtils.saveLocal('yc_username', username);
                    App.StorageUtils.saveLocal('yc_pwd', pwd);
                    App.userData().isLogin = true;
                    App.userData().isGuest = false;
                    resolve(response.data);
                } else {
                    App.SystemUtils.isLoginFun(false);
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 获取游戏大类列表排序及启用状态
    async getGameCategoryList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetGameCategoryList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取游戏大类列表排序及启用状态:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取全部游戏分类
    async getAllGameList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetAllGameList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetAllGameList:", response);
                    if (response.code == 0) {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 根据type获取游戏
    async getThirdGameList(type: number): Promise<any> {
        // return
        return new Promise((resolve, reject) => {
            let additionalParams = {
                gameNameEn: '',
                isMiniGame: true,
                type
            };
            App.HttpUtils.sendPostRequest("GetThirdGameList", additionalParams, (error, response) => {
                console.log("GetThirdGameList:", response);
                if (error) {
                    console.warn(error);
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 获取排行榜配置
    async getLeaderBoardConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetLeaderBoardConfig", {}, (error, response) => {
                console.log("根据获取游戏:", response);
                if (error) {
                    console.warn(error);
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 获取每日排名配置
    async getDailyRankingsConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetDailyRankingsConfig", {}, (error, response) => {
                console.log("根据获取游戏:", response);
                if (error) {
                    console.warn(error);
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 进入游戏
    async getGameUrlThird(gameCode: string, vendorCode: string): Promise<any> {

        return new Promise((resolve, reject) => {
            let additionalParams: any = {};
            if (vendorCode !== "") {
                additionalParams = {
                    gameCode,
                    vendorCode,
                    phonetype: 0
                };
            } else {
                additionalParams = {
                    vendorCode: gameCode,
                    phonetype: 0
                };
            }


            App.HttpUtils.sendPostRequest("GetGameUrl", additionalParams, (error, response) => {

                if (response.code == 0 && response.msg == "Succeed") {
                    if (sys.isNative) {
                        App.AudioManager.setMusicVolume(0);
                    }
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }


    // 获取首充奖励信息
    async getRechargeManageRewardList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetRechargeManageRewardList", additionalParams, (error, response) => {
                console.log("获取首充奖励信息:", response);
                if (error) {
                    console.warn(error);
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 获取玩家vip
    getVipUsers(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetVipUsers", "", (error, response) => {
                if (error) {
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 客服意见反馈
    async submitSuggest(content: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { content };
            App.HttpUtils.sendPostRequest("SubmitSuggest", additionalParams, (error, response) => {
                console.log("客服意见反馈:", response);
                if (error) {
                    console.warn(error);
                    reject(error);
                } else if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 邀请地址
    async getUrlAddress(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (App.status.urlAddress) {
                resolve();
                return;
            }
            App.HttpUtils.sendPostRequest("GetUrlAddress", {}, (error, response) => {
                if (response.code == 0 && response.msg == "Succeed") {
                    App.status.urlAddress = response.data.url.replace(/#\/register/, "") || "";
                    resolve();
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 游戏打码排行榜列表
    async getDailyRankingsList(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetDailyRankingsList", {}, (error, response) => {
                if (response.code == 0 && response.msg == "Succeed") {
                    resolve(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                }
            });
        });
    }

    // 救援金总额
    async getReliefFundTotalPrize(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetReliefFundTotalPrize", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("救援金总额:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 救援金记录
    async getReliefFundList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { id: "123" };
            App.HttpUtils.sendPostRequest("GetReliefFundList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("救援金记录:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 救援金领取
    async getReliefFundAllPrize(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { id: "123" };
            App.HttpUtils.sendPostRequest("GetReliefFundAllPrize", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("救援金领取:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 救援金配置
    async getReliefFundConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetReliefFundConfig", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("救援金配置:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取Bonus奖金总额(促销卡/救援金)
    async getBonusWalletBalance(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetBonusWalletBalance", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取Bonus奖金总额(促销卡/救援金):", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取Bonus奖金(促销卡/救援金)
    async getBonus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetBonus", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领取Bonus奖金(促销卡/救援金):", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 查询Bonus奖金记录(促销卡/救援金)
    async getBonusRecord(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetBonusRecord", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("查询Bonus奖金记录(促销卡/救援金):", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 根据key获取系统字典值
    async getSettingByKey(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetSettingByKey", { key }, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("根据key获取系统字典值:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        if (!response.data) {
                            this.refreshCache()
                                .then(() => this.getSettingByKey(key).then(resolve).catch(reject))
                                .catch(reject);
                            return;
                        }
                        return resolve(response.data);
                    }
                    App.AlertManager.showFloatTip(response.msg);
                    reject(new Error(response.msg));
                    // } else {
                    //     App.AlertManager.showFloatTip(response.msg);
                    //     reject(new Error(response.msg));
                    // }
                }
            });
        });
    }

    // 获取不到系统字典值就通过这个接口刷一下再获取
    async refreshCache(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (App.status.isRefreshCache) {
                resolve();
                return;
            }
            App.HttpUtils.sendPostRequest("RefreshCache?loadCachePwd=Lottery9527", {}, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        App.status.isRefreshCache = true;
                        resolve();
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 客服类型
    async getCustomerServiceTypelist(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetCustomerServiceTypelist", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("客服类型:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取会员客服
    async getCustomerServiceList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetCustomerServiceList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取会员客服:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        let array = response.data;
                        for (let index = 0; index < array.length; index++) {
                            const element = array[index];
                            if (element.typeID == 3) {
                                let userId = App.userData().userInfo.userId;
                                let userName = App.userData().userInfo.userName;
                                let url = element.url;
                                // 解析已有参数
                                let hasUserId = url.includes("userID=");
                                let hasUserName = url.includes("userName=");
                                // 替换或追加 userID
                                if (hasUserId) {
                                    url = url.replace(/userID=([^&]*)/, `userID=${encodeURIComponent(userId)}`);
                                } else {
                                    url += (url.includes("?") ? "&" : "?") + `userID=${encodeURIComponent(userId)}`;
                                }
                                // 替换或追加 userName
                                if (hasUserName) {
                                    url = url.replace(/userName=([^&]*)/, `userName=${encodeURIComponent(userName)}`);
                                } else {
                                    url += `&userName=${encodeURIComponent(userName)}`;
                                }
                                element.url = url;
                            }
                        }
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 客服群入口
    async getCustomerServiceGroup(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetCustomerServiceGroup", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("客服群入口:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 设置
    async getHomeSettings(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetHomeSettings", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("设置:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        App.TransactionData.withdrawModel = response.data.withdrawalModel;
                        App.TransactionData.homeSettings = response.data;
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取收藏游戏
    async getFavoriteGames(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetFavoriteGames", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取收藏游戏:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 收藏/取消收藏游戏
    async updateFavoriteGames(gameCode: string, bool: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let GameVendorId = App.GameManager.getCategory(parseInt(gameCode));
            gameCode = String(gameCode);
            let additionalParams = {
                gameCode,
                GameVendorId,
                isRemoveGame: bool
            };
            App.HttpUtils.sendPostRequest("UpdateFavoriteGames", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("收藏游戏:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取优惠券
    async claimCoupon(code: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { code };
            App.HttpUtils.sendPostRequest("ClaimCoupon", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领取优惠券:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        console.error("领取优惠券失败:", response.msg);
                    }
                }
            });
        });
    }

    // 获取已领取优惠券
    async getClaimedCoupons(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = "";
            App.HttpUtils.sendPostRequest("GetClaimedCoupons", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取已领取优惠券:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }


    // 获取帐变记录
    async getFinancialLog(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                pageNo: 1,
                pageSize: 1000,
                logTypes: [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                    24, 25, 26, 27, 28, 29, 30, 31, 32, 100, 101, 102, 103, 104, 105, 106, 107, 108,
                    109, 110, 111, 112, 113, 114, 116, 117, 118, 119, 115, 122, 123, 124, 125, 126, 127,
                    128, 129, 130, 131, 132, 133
                ]
            };
            App.HttpUtils.sendPostRequest("GetFinancialLog", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("获取帐变记录:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取邮件奖励
    async claimMailReward(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { messageId: id };
            App.HttpUtils.sendPostRequest("ClaimMailReward", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领取邮件奖励:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取邮件奖励（带State参数）
    async claimMailReward2(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { messageId: id, State: 0 };
            App.HttpUtils.sendPostRequest("ClaimMailReward", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("领取邮件奖励:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 游客登录
    async guestLogin(guestUserName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let username = guestUserName;
            let pwd = "5LYW2waQytc3mW5";
            let uuid = App.DeviceUtils.getDeviceId();
            let additionalParams = {
                guestUserName: username,
                expiresDay: 1,
                phonetype: this.detectPhoneType(),
                uuid: uuid,
            };
            App.HttpUtils.sendPostRequest("GuestLogin", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("游客登录:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        App.StorageUtils.saveLocal('loginToken', response.data.token);
                        App.StorageUtils.saveLocal('tokenHeader', response.data.tokenHeader);
                        App.StorageUtils.saveLocal('refreshToken', response.data.refreshToken);
                        App.StorageUtils.saveLocal('ycGuest_username', username);
                        App.StorageUtils.saveLocal('ycGuest_pwd', pwd);
                        App.userData().isLogin = true;
                        resolve(response.data);
                    } else {
                        // App.SystemUtils.isLoginFun(false);
                        // App.AlertManager.showFloatTip(response.msg);
                        App.SceneUtils.enterLoginScene();
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    detectPhoneType() {
        // 默认 PC
        let type = 0;

        // 原生 APK 环境
        if (App.DeviceUtils.isAndroid()) {
            type = 1;
        } else if (App.DeviceUtils.isIOS()) {
            type = 2;
        } else if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
            // H5 浏览器环境
            const ua = navigator.userAgent;
            if (/Android/i.test(ua)) {
                type = 1;
            } else if (/iPhone|iPad|iPod/i.test(ua)) {
                type = 2;
            }
        }
        return type;
    }

    // 游客注册
    async registerSlots(): Promise<any> {
        return new Promise((resolve, reject) => {
            let uuid = App.DeviceUtils.getDeviceId();
            let invitationCode = "";
            let fbcId = "";
            App.userData().invitationCode = "";
            App.userData().isGuest

            // 解析剪贴板或URL参数
            if (App.DeviceUtils.isNative()) {
                let clipboardText = App.PlatformApiMgr.getTxtFromClipboard?.() || "";
                clipboardText = clipboardText.replace(/^=+/, '').trim();
                clipboardText.split("&").forEach(param => {
                    const [keyRaw, valueRaw] = param.split("=");
                    if (!keyRaw || !valueRaw) return;
                    const key = keyRaw.trim().toLowerCase();
                    const value = valueRaw.trim();
                    if (key === "invitationcode") {
                        invitationCode = value;
                    } else if (key === "fbcid") {
                        fbcId = value;
                        App.StorageUtils.saveLocal('fbcId', fbcId);
                    }
                });
            } else if (typeof URLSearchParams !== "undefined") {
                const urlParams = new URLSearchParams(window.location.search);
                invitationCode = urlParams.get('invitationCode') || "";
                App.userData().invitationCode = invitationCode;
            } else {
                const query = window.location.search.substring(1);
                const params = query.split("&");
                for (let i = 0; i < params.length; i++) {
                    const param = params[i].split("=");
                    if (param[0] === "invitationCode") {
                        invitationCode = decodeURIComponent(param[1]);
                        App.userData().invitationCode = invitationCode;
                        break;
                    }
                }
            }

            let pixelId = "";
            if (App.DeviceUtils.isNative()) {
                pixelId = App.StorageUtils.getLocal('pixelId', "");
                if (!pixelId && typeof App.PlatformApiMgr.getPixelId === "function") {
                    pixelId = App.PlatformApiMgr.getPixelId() || "";
                    App.StorageUtils.saveLocal('pixelId', pixelId);
                }
                fbcId = App.StorageUtils.getLocal('fbcId', "");
                if (!fbcId) {
                    fbcId = App.SystemUtils.generateFBP();
                }
                if (pixelId == "") {
                    fbcId = "";
                }
            } else {
                pixelId = (window as any).fbq?.getState?.().pixels?.[0]?.id || "";
                fbcId = App.SystemUtils.getFullFbc();
            }
            console.log("pixelId:", pixelId, "---fbcId:", fbcId);
            if (App.DeviceUtils.isNative()) {
                let domainurlAndInvitecode = App.StorageUtils.getLocal('domainurlAndInvitecode', "");
                if (!domainurlAndInvitecode && typeof App.PlatformApiMgr.domainurlAndInvitecode === "function") {
                    domainurlAndInvitecode = App.PlatformApiMgr.domainurlAndInvitecode() || "";
                    App.StorageUtils.saveLocal('domainurlAndInvitecode', domainurlAndInvitecode);
                }
                if (domainurlAndInvitecode != '') {
                    let arr = domainurlAndInvitecode.split("|");
                    Config.domainurl = arr[0];
                    App.userData().invitationCode = arr[1];
                }
            }

            let additionalParams = {
                domainurl: Config.domainurl,
                registerType: "mobile",
                invitecode: App.userData().invitationCode,
                phonetype: this.detectPhoneType(),
                userType: 0,
                uuid: uuid,
                pixelId: pixelId,
                fbcId: fbcId,
            };
            App.HttpUtils.sendPostRequest("RegisterSlotsGuest", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("游客注册:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.SystemUtils.isLoginFun(false);
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // KYC 实名认证
    async kycVerification(phoneNumber: string, password: string, realName: string, otpCode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                phoneNumber,
                password,
                realName,
                otpCode,
            };
            App.HttpUtils.sendPostRequest("KycVerification", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("kyc:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        App.StorageUtils.saveLocal('yc_username', phoneNumber);
                        App.StorageUtils.saveLocal('yc_pwd', password);
                        App.AlertManager.showFloatTip(response.msg);
                        App.userData().isLogin = true;
                        App.userData().isGuest = false;
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 奖金列表
    async bonuses(dateTimeFilter: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { dateTimeFilter };
            App.HttpUtils.sendPostRequest("Bonuses", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("bonuses:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 推荐人列表
    async referals(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                pageNo: 1,
                pageSize: 100
            };
            App.HttpUtils.sendPostRequest("Referals", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("Referals:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 好友推荐列表
    async friendsReferals(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {};
            App.HttpUtils.sendPostRequest("FriendsReferrals", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("friendsReferals:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 奖金详情
    async bonusDetails(userId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = { userId };
            App.HttpUtils.sendPostRequest("BonusDetails", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("bonusDetails:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取所有奖金
    async claimBonuses(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {};
            App.HttpUtils.sendPostRequest("ClaimBonuses", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("ClaimBonuses:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 奖励明细
    async rewardsDetails(date: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                pageSize: 20,
                pageNo: 1,
                date
            };
            App.HttpUtils.sendPostRequest("RewardsDetails", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("rewardsDetails:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 领取解锁奖金
    async getClaimUnlockBonus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {};
            App.HttpUtils.sendPostRequest("ClaimUnlockBonus", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("ClaimUnlockBonus:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 提交充值反馈
    async getCommitRechargeFeedback(UTR: string, Mobile: string, OrderNo: string, ScreenShoot: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                UTR,
                Mobile,
                OrderNo,
                ScreenShoot
            };
            App.HttpUtils.sendPostRequest("CommitRechargeFeedback", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("CommitRechargeFeedback:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 上传图片
    async getUploadImage(file: any): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendMultipartRequest("UploadImage", file, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("UploadImage:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取消息列表
    async getMessageList(): Promise<any> {
        return new Promise((resolve, reject) => {
            let additionalParams = {
                pageSize: 20,
                pageNo: 1,
            };
            App.HttpUtils.sendPostRequest("GetMessageList", additionalParams, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetMessageList:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    // 获取消息列表
    async getTaskList(): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetTaskList", {}, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("GetTaskList:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response.data);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(new Error(response.msg));
                    }
                }
            });
        });
    }

    async setTaskOrder(taskID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("SetTaskOrder", { taskID: taskID }, (error, response) => {
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    console.log("setTaskOrder:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                        reject(response);
                    }
                }
            });
        });
    }

    async getCloudDataHandler(method: string, params: Record<string, any> = {}): Promise<any> {
        if (method) {
            return new Promise((resolve, reject) => {
                App.HttpUtils.sendPostRequest(method, params, (error, response) => {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        if (response.code == 0 && response.msg == "Succeed") {
                            resolve(response.data);
                        } else {
                            App.AlertManager.showFloatTip(response.msg);
                            reject(new Error(response.msg));
                        }
                    }
                });
            });
        } else {
            console.log('no method input')
        }
    }

    //获取旋转次数
    async getTurnTableUserRotateNum() {
        let params = {}
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetTurnTableUserRotateNum", params, (error, response) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        })
    }

    //获取充值金额
    async getNowdayRechargeAmount() {
        let params = {}
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetNowdayRechargeAmount", params, (error, response) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        })
    }

    //获取转盘信息
    async getTurnTableInfo() {
        let params = {}
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetTurnTableInfo", params, (error, response) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        })
    }

    //转盘抽奖
    async getTurnTableDraw() {
        let params = {}
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("TurnTableDraw", params, (error, response) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        })
    }

    //抽奖记录
    async getTurnTableRecord() {
        let params = {}
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("GetTurnTableRecord", params, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    console.log("响应结果:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        })
    }


    //转盘
    async luckyWheels() {
        let additionalParams = "";
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("LuckyWheels", additionalParams, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    console.log("LuckyWheels:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg)
                        console.log("LuckyWheel reject: ", response.msg);
                        reject(response.msg);
                    }
                }
            });
        });
    }

    //开始转盘
    spinLuckyWheel(id) {
        let additionalParams = {
            id: id
        };
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("SpinLuckyWheel", additionalParams, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg)
                        reject(response.msg);
                    }
                }
            });
        });
    }
    //转盘记录
    luckyWheelRecords() {
        let additionalParams = {
            pageNo: 1,
            pageSize: 1000 //每页10条
        };
        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest("LuckyWheelRecords", additionalParams, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    console.log("转盘记录:", response);
                    if (response.code == 0 && response.msg == "Succeed") {
                        resolve(response);
                    } else {
                        App.AlertManager.getCommonAlert().showWithoutCancel(response.msg);
                        reject(response.msg);
                    }
                }
            });
        });
    }

    getCurrentActivityLevel1People(): Promise<any> {
        const additionalParams = {
            Lv: -1,
            pageNo: 1,
            pageSize: 1000
        };

        return new Promise((resolve, reject) => {
            App.HttpUtils.sendPostRequest(
                "GetCurrentActivityLevel1People",
                additionalParams,
                (error: any, response: any) => {
                    if (error) {
                        console.error(error);
                        reject(error);

                    }

                    if (response.code === 0 && response.msg === "Succeed") {
                        resolve(response);
                    } else {
                        (cc as any).vv?.AlertView?.showTips?.(response.msg);
                        reject(response.msg);
                    }
                }
            );
        });
    }

}