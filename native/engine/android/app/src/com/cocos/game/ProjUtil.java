package com.cocos.game;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Base64;
import android.webkit.WebSettings;
import android.widget.Toast;

import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Enumeration;

public class ProjUtil {
    public static AppActivity context = AppActivity.getInstance();

    //java中调用js回调
    // funcName: 调用的函数名 其实就是注册回调函数的key,一般与函数名相同
    // jsData: 需要传递的数据
    // className: 调用的类名回和funcName组成 classNmae.funcName
    public static void callJS(String funcName, JSONObject jsData, final String className){
        if(funcName != null && jsData != null && className != null){
            try {
                jsData.put("cbName",funcName);
                final String str = jsData.toString();

                CocosHelper.runOnGameThread(new Runnable() {

                    @Override
                    public void run() {
                        CocosJavascriptJavaBridge.evalString(className+"("+str+")");

                    }
                });
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }
    //默认调用cc.vv.PlatformApiMgr.trigerCallback
    public static void callJS(String funcName, JSONObject jsData){
        callJS(funcName,jsData,"cc.vv.PlatformApiMgr.trigerCallback");

    }

    //默认调用cc.vv.PlatformApiMgr.trigerCallback
    public static void callJS(String funcName){
        JSONObject   obj = new JSONObject  ();
        callJS(funcName,obj);

    }

    //显示提示
    public static void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }

    public static  InputStream getHtmlStream(final String url){
        URL htmlUrl = null;
        InputStream inStream = null;
        try {
            htmlUrl = new URL(url);
            URLConnection connection = htmlUrl.openConnection();
            HttpURLConnection httpConnection = (HttpURLConnection)connection;
            int responseCode = httpConnection.getResponseCode();
            if(responseCode == HttpURLConnection.HTTP_OK){
                inStream = httpConnection.getInputStream();
            }
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return inStream;
    }

    public static byte[] getHtmlByteArray(final String url) {

        InputStream inStream = getHtmlStream(url);
        byte[] data = inputStreamToByte(inStream);

        return data;
    }

    public static byte[] inputStreamToByte(InputStream is) {
        try{
            ByteArrayOutputStream bytestream = new ByteArrayOutputStream();
            int ch;
            while ((ch = is.read()) != -1) {
                bytestream.write(ch);
            }
            byte imgdata[] = bytestream.toByteArray();
            bytestream.close();
            return imgdata;
        }catch(Exception e){
            e.printStackTrace();
        }

        return null;
    }

    public static String getLocalIPAddress() {
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {

                NetworkInterface intf = en.nextElement();

                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {

                    InetAddress inetAddress = enumIpAddr.nextElement();

                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof Inet4Address) {
                        return inetAddress.getHostAddress().toString();
                    }
                }
            }
        } catch (SocketException ex) {
        }

        return null;
    }

    public static String getClientUserAgent(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                return WebSettings.getDefaultUserAgent(context);
            } else {
                return System.getProperty("http.agent");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    //保存到相册
    public static int saveToAlumb(String filePath){
        /*android 6.0需要权限
        if(Build.VERSION.SDK_INT >= 23){
            String[] PERMISSIONS = {
                    "android.permission.READ_EXTERNAL_STORAGE",
                    "android.permission.WRITE_EXTERNAL_STORAGE" };
            //检测是否有写的权限
            int permission = ContextCompat.checkSelfPermission(context,
                    "android.permission.WRITE_EXTERNAL_STORAGE");
            if (permission != PackageManager.PERMISSION_GRANTED) {
                // 没有写的权限，去申请写的权限，会弹出对话框
                ActivityCompat.requestPermissions(context, PERMISSIONS,1);
                return 0;
        }

        }
        //*/
        Bitmap bmp = BitmapFactory.decodeFile(filePath);
        final String fileName = System.currentTimeMillis() + ".jpg";
        final boolean doRes = saveImageToGallery(context,bmp,fileName);
        if(doRes){
            return 1;
        }
        return 0;

    }

    /**
     * 先保存到本地再广播到图库
     */
    public static boolean saveImageToGallery(Context context, Bitmap bmp, String fileName ) {
        boolean res = false;
        // 首先保存图片

        File basePath = null;
        if(Build.VERSION.SDK_INT>=29){
            basePath = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        }
        else{
            basePath= Environment.getExternalStorageDirectory();
        }
        final File appDir = new File(basePath, "myQrcode");
        if (!appDir.exists()) {
            appDir.mkdir();
        }


        final File file = new File(appDir, fileName);

        try {
            if(!file.exists()){
                file.createNewFile();
            }
            FileOutputStream fos = new FileOutputStream(file);
            bmp.compress(Bitmap.CompressFormat.JPEG, 100, fos);
            fos.flush();
            fos.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
//        其次把文件插入到系统图库

        try {
            savePhotoToMedia(context,file,fileName);
            res = true;

        } catch (FileNotFoundException e) {
            e.printStackTrace();

        }

        return res;
    }

    public static void savePhotoToMedia(Context context, File file, String fileName) throws FileNotFoundException {
        String uriString = MediaStore.Images.Media.insertImage(context.getContentResolver(), file.getAbsolutePath(), fileName, null);
//        String uriString = MediaStore.Images.Media.insertImage(context.getContentResolver(), bitmap, null, null);
        File file1 = new File(getRealPathFromURI(Uri.parse(uriString),context));
        updatePhotoMedia(file1,context);
    }

    //更新图库
    private static void updatePhotoMedia(File file ,Context context){
        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
        intent.setData(Uri.fromFile(file));
        context.sendBroadcast(intent);
    }
    //得到绝对地址
    private static String getRealPathFromURI(Uri contentUri,Context context) {
        String[] proj = { MediaStore.Images.Media.DATA };
        Cursor cursor = context.getContentResolver().query(contentUri, proj, null, null, null);
        int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
        cursor.moveToFirst();
        String fileStr = cursor.getString(column_index);
        cursor.close();
        return fileStr;
    }

    //获取androidid
    //在设备首次启动时，系统会随机生成一个64位的数字，并把这个数字以16进制字符串的形式保存下来。不需要权限，平板设备通用。
    // 获取成功率也较高，缺点是设备恢复出厂设置会重置。另外就是某些厂商的低版本系统会有bug，返回的都是相同的AndroidId
    public static String getAnroidId(){
        return Settings.System.getString(context.getContentResolver(), Settings.System.ANDROID_ID);
    }

    //获取手机品牌
    public static  String getDeviceBrand(){
        return Build.BRAND;
    }
    //获取手机model
    public static  String getDeviceModel(){
        return Build.MODEL;
    }

    //获取系统版本
    public static String getSystempVision(){
        return Build.VERSION.RELEASE;
    }

    //手机震动一下(1s)
    public static void phoneShock(String nDur){
        Vibrator vibrator = (Vibrator)context.getSystemService(context.VIBRATOR_SERVICE);

        vibrator.vibrate(Integer.parseInt(nDur));
    }


    /**
     * 将图片转换成Base64编码的字符串
     */
    public static String imageToBase64(String path){
        if(TextUtils.isEmpty(path)){
            return null;
        }
        InputStream is = null;
        byte[] data = null;
        String result = null;
        try{
            is = new FileInputStream(path);
            //创建一个字符流大小的数组。
            data = new byte[is.available()];
            //写入数组
            is.read(data);
            //用默认的编码格式进行编码
            result = Base64.encodeToString(data,Base64.NO_CLOSE);
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if(null !=is){
                try {
                    is.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

        }
        return result;
    }

    public static boolean isAppInstall(Context context,String packName){
        PackageInfo pkInfo = null;
        try{
            pkInfo = context.getPackageManager().getPackageInfo(packName,0);
        } catch (PackageManager.NameNotFoundException e){
            e.printStackTrace();
        }
        return  pkInfo == null?false:true;
    }

    //APK 路径
    public static String getPackagePath(Context context){
        if(context != null){
            return  context.getPackageCodePath();
        }
        return null;
    }

    public static String readApk(File file) {
        byte[] bytes = null;
        try {
            RandomAccessFile accessFile = new RandomAccessFile(file, "r");
            long index = accessFile.length();

            bytes = new byte[2];
            index = index - bytes.length;
            accessFile.seek(index);
            accessFile.readFully(bytes);

            int contentLength = stream2Short(bytes, 0);

            bytes = new byte[contentLength];
            index = index - bytes.length;
            accessFile.seek(index);
            accessFile.readFully(bytes);

            return new String(bytes, "utf-8");
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * 字节数组转换成short（小端序）
     * @param stream
     * @param offset
     * @return
     */
    private static short stream2Short(byte[] stream, int offset) {
        ByteBuffer buffer = ByteBuffer.allocate(2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.put(stream[offset]);
        buffer.put(stream[offset + 1]);
        return buffer.getShort(0);
    }



    /**
     * short转换成字节数组（小端序）
     * @param data
     * @return
     */
    private static byte[] short2Stream(short data) {
        ByteBuffer buffer = ByteBuffer.allocate(2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.putShort(data);
        buffer.flip();
        return buffer.array();
    }

    //cloner check
    public static boolean isCloner(Context context){
        //
        String packageName = "";
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo info = pm.getPackageInfo(context.getPackageName(), 0);
            ApplicationInfo appInfo = info.applicationInfo;
            packageName = appInfo.packageName;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }

        String filesDir = context.getFilesDir().getAbsolutePath();
        String normal_one = "/data/data/" + packageName + "/files";
        String normal_two = "/data/user/0/" + packageName + "/files";
        if(normal_one.equals(filesDir) || normal_two.equals(filesDir)){
            return false;
        }
        else {
            return true;
        }
    }

}
