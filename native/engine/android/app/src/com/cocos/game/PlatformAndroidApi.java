/****************************************************************************
 // android platform static function api to javascript
 ****************************************************************************/
package com.cocos.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.WebView;

import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;
import com.cocos.lib.CocosWebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;


public class PlatformAndroidApi {
    public static AppActivity context = (AppActivity) AppActivity.getInstance();
    public static String openAppUrlDataString = "";
    //public static String firebaseMsgToken = ""; //firebase推送的唯一令牌
    public static Boolean isPushWeEvent = false;
    public static String channelstr = "0";    //渠道信息
    public static String fbParam = "0";    //FB pixel信息
    public static String facebook_fbc = null;
    public static String facebook_fbp = null;
    public static String facebook_url = null;
    public static String ClientIP = null;
    //	public static AMapLocationMgr locMgr = null;
    public static boolean googleService = false;

    public static WebView webView;

    public static String getAppVersion() {
        String appVersion = "1.0.0";
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageInfo(context.getPackageName(), 0);
            appVersion = pi.versionName;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return appVersion;
    }

    @SuppressLint("NewApi")
    public static String getTxtFromClipboard() {
        try {
            if (context == null) return "";
            ClipboardManager cm = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm == null || !cm.hasPrimaryClip()) return "";
            ClipData cd = cm.getPrimaryClip();
            if (cd == null || cd.getItemCount() == 0) return "";
            CharSequence cs = cd.getItemAt(0).coerceToText(context);
            return cs != null ? cs.toString() : "";
        } catch (Exception e) {
            Log.e("PlatformAndroidApi", "getTxtFromClipboard failed", e);
            return "";
        }
    }

    public static String getOpenAppUrlDataString() {
        String tempStr = PlatformAndroidApi.openAppUrlDataString;
        PlatformAndroidApi.openAppUrlDataString = "";
        return tempStr;
    }

    public static void clearOpenAppUrlDataString() {
        PlatformAndroidApi.openAppUrlDataString = "";
    }

    //获取firebase 的推送消息唯一令牌
    public static String getFMCToken() {
//		Log.d("API","fmctoken："+firebaseMsgToken);
//		return	firebaseMsgToken;
        return "";
    }

    //re get
    public static void reGetFMCToken() {
//		FirebaseMessaging.getInstance().getToken()
//				.addOnCompleteListener(new OnCompleteListener<String>() {
//					@Override
//					public void onComplete(@NonNull Task<String> task) {
//						if (!task.isSuccessful()) {
////							Log.w(TAG, "Fetching FCM registration token failed", task.getException());
//							return;
//						}
//
//						// Get new FCM registration token
//						String token = task.getResult();
//
//						firebaseMsgToken = token;
//					}
//				});
    }

    //获取渠道信息
    public static String getChannelstr() {
        if (channelstr.equals("0")) {
            return null;
        }
        return channelstr;
    }

    //获取FB pixel信息
    public static String getFBParam() {
        if (fbParam.equals("0")) {
            return null;
        }
        return fbParam;
    }

    // 重启 App（热更新完成后调用）
    public static void restartApp() {
        Log.i("PlatformAndroidApi", "[restartApp] 开始执行重启应用");
        try {
            if (context == null) {
                Log.d("PlatformAndroidApi", "[restartApp] context 为 null，尝试获取实例");
                context = (AppActivity) AppActivity.getInstance();
            }

            if (context == null) {
                Log.e("PlatformAndroidApi", "[restartApp] 获取 context 失败，无法重启应用");
                return;
            }

            Log.d("PlatformAndroidApi", "[restartApp] 获取 context 成功，包名: " + context.getPackageName());

            Intent intent = context.getPackageManager()
                    .getLaunchIntentForPackage(context.getPackageName());

            if (intent == null) {
                Log.e("PlatformAndroidApi", "[restartApp] 获取启动 Intent 失败，无法重启应用");
                return;
            }

            Log.d("PlatformAndroidApi", "[restartApp] 获取启动 Intent 成功");

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_CLEAR_TOP |
                            Intent.FLAG_ACTIVITY_CLEAR_TASK
            );

            Log.d("PlatformAndroidApi", "[restartApp] 设置 Intent 标志完成");

            Log.d("PlatformAndroidApi", "[restartApp] 启动新的 Activity");
            context.startActivity(intent);
            
            Log.d("PlatformAndroidApi", "[restartApp] 结束当前 Activity");
            context.finish();

            Log.d("PlatformAndroidApi", "[restartApp] 准备杀掉当前进程");
            // 彻底杀掉当前进程，确保 JS VM 重新初始化
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);
            
            Log.i("PlatformAndroidApi", "[restartApp] 重启应用完成");

        } catch (Exception e) {
            Log.e("PlatformAndroidApi", "[restartApp] 重启应用失败", e);
            e.printStackTrace();
        }
    }

    public static String domainurlAndInvitecode() {
        return "";
    }
    public static String getPixelId() {
        return "";
    }
    @SuppressLint("NewApi")
    public static void setTxtToClipboard(final String txt) {
		/*ClipboardManager clipboardManager = (ClipboardManager)context.getSystemService(Context.CLIPBOARD_SERVICE);
	    ClipData clipData = ClipData.newPlainText("label", txt);
	    clipboardManager.setPrimaryClip(clipData);*/
        Runnable runnable = new Runnable() {
            public void run() {
                ClipboardManager cm = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setText(txt);
            }
        };
        context.runOnUiThread(runnable);
    }

    public static void openGPSSetting() {
        Intent intent = new Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS);
        context.startActivityForResult(intent, 0);
    }

    public static boolean isOpenGPS() {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        boolean isOpen = false;
        if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            isOpen = true;
        }
        return isOpen;
    }

//	public static void startLocation() {
//		 if (locMgr == null) {
//		 	 locMgr = new AMapLocationMgr();
//			 locMgr.initLocation();
//		 }
//		locMgr.startLocation();
//	}
//
//	public static void stopLocation() {
//		if (locMgr != null) {
//			locMgr.stopLocation();
//		}
//	}

    //保存图片到相册
    public static int SaveToAlumb(String data) {
        return ProjUtil.saveToAlumb(data);
    }

    //保存网络图片
    public static int SaveUrlToAlumb(String url) {
		if(Build.VERSION.SDK_INT >= 23){
        String[] PERMISSIONS = {
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE"};
        //检测是否有写的权限
        int permission = context.checkSelfPermission( "android.permission.WRITE_EXTERNAL_STORAGE");
         if (permission != PackageManager.PERMISSION_GRANTED) {
            // 没有写的权限，去申请写的权限，会弹出对话框
            context.requestPermissions( PERMISSIONS, 1);
            return 0;
         }

		}

        InputStream istream = ProjUtil.getHtmlStream(url);
        Bitmap bmp = BitmapFactory.decodeStream(istream);
        final String fileName = System.currentTimeMillis() + ".jpg";
        final boolean doRes = ProjUtil.saveImageToGallery(context, bmp, fileName);
        if (doRes) {
            return 1;
        }
        return 0;
    }

    public static void openURL(String urlStr) {
        Uri uri = Uri.parse(!urlStr.isEmpty() ? urlStr : "https://www.test.com");
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        context.startActivity(intent);
    }

    //旋转屏幕
    public static void setOrientation(final String dir) {
        context.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (dir.equals("portrait")) {
                    context.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
                } else if (dir.equals("landscape")) {
                    context.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                }
            }
        });
    }

    //获取android id
    public static String getDeviceId() {
        return ProjUtil.getAnroidId();
    }

    //关闭启动图
//    public static void closeSpalsh() {
//        AppActivity.hideSplash();
//    }

    //获取手机品牌
    public static String getDeviceBrand() {
        String strBrand = ProjUtil.getDeviceBrand();
        String strModel = ProjUtil.getDeviceModel();
        return strBrand + "_" + strModel;
    }

    //获取手机系统版本
    public static String getDeviceOpSysVision() {
        String strVision = ProjUtil.getSystempVision();
        return strVision;
    }

    //获取bundleid
    public static String getAPPBundleId() {
        // 获取packagemanager的实例
        String packageName = "";
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo info = pm.getPackageInfo(context.getPackageName(), 0);
            ApplicationInfo appInfo = info.applicationInfo;
            packageName = appInfo.packageName;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return packageName;
    }

    //手机震动一下
    public static void phoneShock(String nDur) {
        ProjUtil.phoneShock(nDur);
    }

    //唤起拨号盘
    public static void callPhone(String num) {
        Intent intent_call = new Intent(Intent.ACTION_DIAL);
        intent_call.setData(Uri.parse("tel:" + num));
        context.startActivity(intent_call);
    }

    //评分接口
    public static boolean openRating() {
        Uri uri = Uri.parse("market://details?id=" + getAPPBundleId());
        Intent intentpf = new Intent(Intent.ACTION_VIEW, uri);
        intentpf.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intentpf);
        return true;
    }

    //打开gp支付
    public static void SdkPay(String data) {
//		GglPayMgr.getInstance().purchase(data);
    }

    //gp查询并消耗已购买的订单
    public static void gpCheckOwned() {
//		GglPayMgr.getInstance().queryAndConsumePurchase();
    }

    //查询所有商品详情
    public static void queryAllSKU(String data) {
//		GglPayMgr.getInstance().queryAllSkuDetais(data);
    }

    //google登录
    public static void googleLogin() {

    }

    //google广告AdMob
    public static void loadAdMobRewardAd() {
//		context.runOnUiThread(new Runnable() {
//			@Override
//			public void run() {
//				AdMobMgr.getInstance().loadAdmobAwardAd();
//			}
//		});
    }
    public static void SetClientIP(String ipaddss) {
        ClientIP = ipaddss;
    }

    //记录ko事件打点
    public static void KoTrackEvent(String data) throws JSONException {
//        pushFBTrackEvent(data);
//        JSONObject jb = new JSONObject(data);
//        String eventName = jb.getString("EventName");
//        String eventValue = "";
//        if (jb.has("EventValue")) eventValue = jb.getString("EventValue");
//        //AFS
//        Map<String, Object> eventValues = new HashMap<>();
//        if (eventValue.length() > 0) {
//            JSONObject jsonObjValue = new JSONObject(eventValue);
//
//            Iterator it = jsonObjValue.keys();
//
//            while (it.hasNext()) {
//
//                String key = String.valueOf(it.next().toString());
//                String value = (String) jsonObjValue.get(key).toString();
//                if (key.equals("uid")) {
//                    key = AFInAppEventParameterName.CONTENT_ID;
//                }
//                if (key.equals("status")) {
//                    continue;
//                }
//                if (key.equals("currency")) {
//
//                    key = AFInAppEventParameterName.CURRENCY;
//                }
//                if (key.equals("value")) {
//                    key = AFInAppEventParameterName.REVENUE;
//                    //eventValues.put(AFInAppEventParameterName.REVENUE, value);
//                }
//
//                eventValues.put(key, value);
//            }
//        }
//
//        if (eventName.equals("LoginSuccess")) {
//            eventName = AFInAppEventType.LOGIN;
//        } else if (eventName.equals("CompleteRegistration")) {
//            eventName = AFInAppEventType.COMPLETE_REGISTRATION;
//            new Thread(new WeGoEvent(context, WeGoEvent.Type.register)).start();
//        } else if (eventName.equals("Purchase")) {
//            eventName = AFInAppEventType.PURCHASE;
//            new Thread(new WeGoEvent(context, WeGoEvent.Type.purchase, eventValues.get(AFInAppEventParameterName.REVENUE).toString())).start();
//        } else if (eventName.equals("FirstPurchase")) {
//            new Thread(new WeGoEvent(context, WeGoEvent.Type.first_pay, eventValues.get(AFInAppEventParameterName.REVENUE).toString(),
//                    eventValues.get(AFInAppEventParameterName.CONTENT_ID).toString())).start();
//        }

//        AppsFlyerLib.getInstance().logEvent(context, eventName, eventValues);
    }

    //记录facebook事件
    public static void pushFBTrackEvent(String data) throws JSONException {

        if(PlatformAndroidApi.fbParam != null && !PlatformAndroidApi.fbParam.equals("0"))
        {
//            new Thread(new FBEvent(context,data)).start();
        }
    }

    public static String getKoTrackUUID() {
        String struuid = "";
//		struuid = Tracker.getDeviceId();
        return struuid;
    }

    //加载TradPlus视频广告
    public static void loadTradPlusRewardedVideo(String adUnitId) {
//		TradPlusAdMgr.getInstance().loadRewardVideo(adUnitId);
    }

    //显示TradPlus视频广告
    public static void showTradPlusRewardedVideo(String adUnitId) {
//		TradPlusAdMgr.getInstance().showRewardVideo();
    }

    //fb登录
    public static void fbSdkLogin() throws JSONException {
//		FacebookMgr.getInstance().login();

    }

    //fb登出
    public static void fbSdkLoginOut() {
//		FacebookMgr.getInstance().loginOut();
    }

    //fb分享
    public static void fbSdkShare(String shareData) {

//		FacebookMgr.getInstance().shareSdk(shareData);
        JSONObject jb = null;
        try {
            jb = new JSONObject(shareData);

            int nShareWhere = 1; //1 fb 2 messager 3 whatsapp
            if (jb.has("shareWhere")) {
                nShareWhere = jb.getInt("shareWhere");
            }
            if (nShareWhere == 3) {
                String packname = "com.whatsapp";//"org.telegram.messenger";//"com.facebook.orca";//"com.whatsapp";
                if (ProjUtil.isAppInstall(context, packname)) {
                    String msgStr = jb.getString("msgStr");
                    Intent sendIntent = new Intent();
                    sendIntent.setAction(Intent.ACTION_SEND);
                    sendIntent.putExtra(Intent.EXTRA_TEXT, msgStr);
                    sendIntent.setType("text/plain");
                    sendIntent.setPackage(packname);
                    context.startActivity(sendIntent);
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

    }

    //按包名分享字符
    public static void packageAppShare(String shareData) {
        JSONObject jb = null;
        try {
            jb = new JSONObject(shareData);
            String packname = jb.getString("packname");
            if (ProjUtil.isAppInstall(context, packname)) {
                String msgStr = jb.getString("msgStr");
                Intent sendIntent = new Intent();
                sendIntent.setAction(Intent.ACTION_SEND);
                sendIntent.putExtra(Intent.EXTRA_TEXT, msgStr);
                sendIntent.setType("text/plain");
                sendIntent.setPackage(packname);
                context.startActivity(sendIntent);
            } else {
                //not install app
                JSONObject jsonObj = new JSONObject();
                jsonObj.put("packname", packname);
                jsonObj.put("result", "-1");
                JsTool.sendToPlatformApiCbFunc("packageAppShareCall", jsonObj);
            }

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    //打开fb
    public static boolean OpenFB(String data) {
//		return FacebookMgr.getInstance().openFBApp(data);
        return false;
    }

    //应用内FB好友
    public static void FbFriendsInApp() {
//		FacebookMgr.getInstance().appFriends();
    }

    //是否按照了原生FB
    public static int isInstallFB() {
//		if(FacebookMgr.getInstance().isInstallFBApp()){
//			return	1;
//		}
        return 0;
    }

    //归因
    public static void googleInstallReff() {
//		SDKPlayCore sdk = (SDKPlayCore) SDKWrapper.getInstance().getSDK("SDKPlayCore");
//		sdk.InstallReffconnect();
    }

    //应用内评价
    public static void loadReviewComment() {
//		SDKPlayCore sdk = (SDKPlayCore) SDKWrapper.getInstance().getSDK("SDKPlayCore");
//		sdk.loadReview();
    }

//
//	//微信是否安装
//	public static int installWXApp(){
//		int nResult = 0;
//		if(WxMgr.getInstance().isInstallWXApp()){
//			nResult = 1;
//		}
//		return nResult;
//	}
//
//	//打开微信
//	public static int openWXApp() {
//		int nResult = 0;
//		if(WxMgr.getInstance().openWXApp()){
//			nResult = 1;
//		}
//		return nResult;
//	}
//
//	//微信登录
//	public static void wxLogin(){WxMgr.getInstance().wxLogin();}
//
//	//微信分享
//	public static void wxShare(String data){WxMgr.getInstance().wxShare(data);}
//
//	//获取友盟渠道号
//	public static String getUMChannelIdx(){
//		return UMengMgr.getInstance().getChannelName();
//	}

    //打开相册选取头像
//	JSONObject obj = new JSONObject  ();
//		obj.put("height",100);
//		obj.put("width",100);
//		obj.put("size",102400);
//	takePhoto(obj.toString());
    public static void takePhoto(final String param) {
        context.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(context, TakePhotoActivity.class);
                intent.putExtra("param", param);
                context.startActivity(intent);
            }
        });
    }

    //    // 加入音频室
//	JSONObject obj = new JSONObject  ();
//		obj.put("token","006c91030f6f2bc4ac39748f72ad5fdf1aaIACA411orJNd8H+3vp5h4IYdL6kj1KZhAX+zLHvZHnrwZXhSBlYAAAAAEAAPz4g6IW5vYQEAAQAgbm9h");
//		obj.put("cname",10086);
//		obj.put("uid",1003);
//		obj.put("opt","test");
//
//	joinVoiceChannel(obj.toString());
    public static void joinVoiceChannel(final String param) {
//		VoiceMgr.getInstance().joinChannel(param);
    }

    //禁言-自己
    public static void setLocalMute(String val) {
//		boolean bmute = TextUtils.equals(val, "1")?true:false;
//		VoiceMgr.getInstance().setLocalMute(bmute);
    }

    //禁言-别人
    public static void setRemoteMute(String data) throws JSONException {
//		JSONObject jb = new JSONObject(data);
//		String uid = jb.getString("uid");
//		String mute = jb.getString("mute");
//		boolean val = TextUtils.equals(mute, "1")?true:false;
//		VoiceMgr.getInstance().setRemoteMute(Integer.parseInt(uid),val);

    }

    //离开聊天室
    public static void levelVoiceChannel() {
//		VoiceMgr.getInstance().leaveChannel();
    }

    //发送邮件
//	JSONObject obj = new JSONObject  ();
//		obj.put("sender","havefun@mensaplay.com");
//		obj.put("title","游戏反馈");
//		obj.put("content","反馈内容");
//	sendMail(obj.toString());

    public static void sendMail(String data) {

        try {
            JSONObject jb = new JSONObject(data);
            final String sender = jb.getString("sender");
            final String title = jb.getString("title");
            final String content = jb.getString("content");
            context.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent email = new Intent(Intent.ACTION_SEND);
                    //邮件发送类型：无附件，纯文本
                    email.setType("plain/text");
                    //邮件接收者（数组，可以是多位接收者）
                    String[] emailReciver = new String[]{sender};

                    String emailTitle = title;
                    String emailContent = content;
                    //设置邮件地址
                    email.putExtra(Intent.EXTRA_EMAIL, emailReciver);
                    //设置邮件标题
                    email.putExtra(Intent.EXTRA_SUBJECT, emailTitle);
                    //设置发送的内容
                    email.putExtra(Intent.EXTRA_TEXT, emailContent);
                    //调用系统的邮件系统
                    context.startActivity(Intent.createChooser(email, ""));
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }


    }

    /**
     * 系统分享
     */
    public static void systemShare(String data) {
        try {
            JSONObject jb = new JSONObject(data);
            final String imgUrl = jb.getString("imgUrl");
            final String title = jb.getString("title");
            final String content = jb.getString("content");
            context.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent sendIntent = new Intent(Intent.ACTION_SEND);
                    sendIntent.setType("text/*");
                    sendIntent.putExtra(Intent.EXTRA_TEXT, content);

                    // (Optional) Here we're setting the title of the content
                    sendIntent.putExtra(Intent.EXTRA_TITLE, title);

//					// (Optional) Here we're passing a content URI to an image to be displayed
//					if (!imgUrl.isEmpty()) {
//						sendIntent.setData(Uri.parse(imgUrl));
//						sendIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
//					}


                    // Show the Sharesheet
                    context.startActivity(Intent.createChooser(sendIntent, null));
                }

            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void openWebView(String url, boolean gameBut, int o, int oc,
                                   boolean loadWithOverviewMode, boolean useWideViewPort,
                                   int initScale, boolean builtInZoomCtrl, boolean builtInZoomCtrlDisplay) {
        Log.i("PlatformApu", "Opening WebView with URL: " + url);
        Nbhelper.showWebPage(url);
    }

    public static void evalGL(final String js) {
        CocosHelper.runOnGameThread((Runnable) () -> CocosJavascriptJavaBridge.evalString(js));
    }

    static void confirmedBackToHall() {
        String js = "cc.vv.PlatformApiMgr.goLobbyPlatform()";
        evalGL(js);
    }

    public static void copyToClipboard(final String str) {
        try {
//            if (BuildConfig.DEBUG) { // Or any debug flag
//                Set<Thread> threadSet = Thread.getAllStackTraces().keySet();
//                Log.i("ClipboardDebug", "#thread-copyToClipboard:" + threadSet.size());
//            }
            CocosHelper.copyTextToClipboard(str);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 解压zip文件
     * @param zipPath zip文件路径
     * @param extractDir 解压目标目录
     * @return 是否成功
     */
    public static boolean unzipFile(String zipPath, String extractDir) {
        try {
            File zipFile = new File(zipPath);
            if (!zipFile.exists()) {
                android.util.Log.e("AppActivity", "Zip file not exists: " + zipPath);
                return false;
            }
            
            File destDir = new File(extractDir);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            
            ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(zipFile));
            ZipEntry zipEntry = zipInputStream.getNextEntry();
            
            byte[] buffer = new byte[1024];
            while (zipEntry != null) {
                String fileName = zipEntry.getName();
                File newFile = new File(destDir, fileName);
                
                if (zipEntry.isDirectory()) {
                    newFile.mkdirs();
                } else {
                    // 确保父目录存在
                    new File(newFile.getParent()).mkdirs();
                    
                    FileOutputStream fileOutputStream = new FileOutputStream(newFile);
                    int len;
                    while ((len = zipInputStream.read(buffer)) > 0) {
                        fileOutputStream.write(buffer, 0, len);
                    }
                    fileOutputStream.close();
                }
                
                zipEntry = zipInputStream.getNextEntry();
            }
            
            zipInputStream.closeEntry();
            zipInputStream.close();
            
            android.util.Log.d("AppActivity", "Unzip success: " + extractDir);
            return true;
        } catch (Exception e) {
            android.util.Log.e("AppActivity", "Unzip error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

}
