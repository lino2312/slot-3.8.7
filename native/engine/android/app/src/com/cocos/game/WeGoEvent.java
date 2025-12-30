//package com.cocos.game;
//
//import android.content.Context;
//import android.content.pm.PackageInfo;
//import android.util.Log;
//
//import org.json.JSONObject;
//
//import java.io.IOException;
//import java.security.MessageDigest;
//
////import okhttp3.Call;
////import okhttp3.Callback;
////import okhttp3.MediaType;
////import okhttp3.MultipartBody;
////import okhttp3.OkHttpClient;
////import okhttp3.Request;
////import okhttp3.RequestBody;
////import okhttp3.Response;
//
//public class WeGoEvent implements Runnable {
//
//    // Define the JSON media type
//    public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
//    private OkHttpClient client = new OkHttpClient();
//
//    public enum Type{
//        init,register,purchase,first_pay
//    }
//    private Context mContext = null;
//    public static String afId = "";
//    private String user = "zxc990000015";
//    private Type type = Type.init;
//    private String money = null;
//    private String uid = null;
//
//    public WeGoEvent(Context context,Type type)
//    {
//        this.mContext = context;
//        this.type = type;
//    }
//
//    public WeGoEvent(Context context,Type type,String money)
//    {
//        this.mContext = context;
//        this.type = type;
//        this.money = money;
//    }
//
//    public WeGoEvent(Context context,Type type,String money,String uid)
//    {
//        this.mContext = context;
//        this.type = type;
//        this.money = money;
//        this.uid = uid;
//    }
//
//    private String md5Decode(String content) throws Exception{
//        byte[] hash = MessageDigest.getInstance("MD5").digest(content.getBytes("UTF-8"));
//        StringBuilder hex = new StringBuilder(hash.length * 2);
//        for(byte b : hash){
//            if((b & 0xFF) < 0x10){
//                hex.append("0");
//            }
//            hex.append(Integer.toHexString(b & 0xFF));
//        }
//        return hex.toString();
//    }
//
//    @Override
//    public void run() {
//        if(PlatformAndroidApi.isPushWeEvent)
//        {
//            try {
//                switch (type){
//                    case init:
//                        init();
//                        break;
//                    case register:
//                        register();
//                        break;
//                    case purchase:
//                        purchase();
//                        break;
//                    case first_pay:
//                        first_pay();
//                        break;
//                }
//            } catch (Exception e) {
//
//            }
//        }
//    }
//
//    public void postJson(String url, String jsonString, String user, String token) {
//
//        // Create the request body using JSON
//        RequestBody body = RequestBody.create(jsonString, JSON);
//
//        // Build the request with headers
//        Request request = new Request.Builder()
//                .url(url)
//                .post(body)
//                .addHeader("user", user)
//                .addHeader("token", token)
//                .build();
//
//        // Asynchronously execute the request
//        client.newCall(request).enqueue(new Callback() {
//            @Override
//            public void onFailure(Call call, IOException e) {
//                // Here is where you handle the request error
//                System.out.println("Request error: " + e.toString());
//            }
//
//            @Override
//            public void onResponse(Call call, Response response) throws IOException {
//                // Here is where you handle the response
//                if (response.isSuccessful()) {
//                    String responseBody = response.body().string();
//                    System.out.println("Request success: " + responseBody);
//                } else {
//                    System.out.println("Response not successful: " + response.toString());
//                }
//            }
//        });
//    }
//
//    public void init() throws Exception {
//        // Retrieve package info and version code
//        PackageInfo packageInfo = mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0);
//        int versionCode = packageInfo.versionCode;
//
//        // Generate a token using md5Decode
//        String token = md5Decode(this.user + this.afId);
//
//        // Create JSON object to send in the request body
//        JSONObject jo = new JSONObject();
//        jo.put("googleAdId", this.afId);
//        jo.put("versionCode", versionCode);
//        jo.put("pck", packageInfo.packageName);
//
//        // Create the URL with query parameters
//        String url = String.format("https://worker.rummyking.xyz/devicesApi?pck=%s&googleAdId=%s", packageInfo.packageName, this.afId);
//
//        // Build the request body with JSON content
//        RequestBody body = RequestBody.create(jo.toString(), JSON);
//
//        // Build the OkHttp request
//        Request request = new Request.Builder()
//                .url(url)
//                .post(body)
//                .addHeader("user", this.user)
//                .addHeader("token", token)
//                .build();
//
//        // Execute the request asynchronously
//        client.newCall(request).enqueue(new Callback() {
//            @Override
//            public void onFailure(Call call, IOException e) {
//                // Handle request failure
//                Log.d("TAG", "response error: " + e.toString());
//            }
//
//            @Override
//            public void onResponse(Call call, Response response) throws IOException {
//                if (response.isSuccessful()) {
//                    // Handle successful response
//                    String responseBody = response.body().string();
//                    Log.d("TAG", "response success: " + responseBody);
//                } else {
//                    // Handle unsuccessful response
//                    Log.d("TAG", "response not successful: " + response.toString());
//                }
//            }
//        });
//    }
//
//    public void register() throws Exception
//    {
//        PackageInfo packageInfo = mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0);
//        String token = md5Decode(this.user+this.afId);
//        String userIp = ProjUtil.getLocalIPAddress();
//        userIp = (userIp == null ? "127.0.0.1" : userIp);
//        String url = "https://api.wegoevent.com/api/put_event";
//
//        OkHttpClient client = new OkHttpClient().newBuilder()
//                .build();
//        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
//                .addFormDataPart("event","register")
//                .addFormDataPart("adid",this.afId)
//                .addFormDataPart("phone","")
//                .addFormDataPart("userId",this.afId)
//                .addFormDataPart("userLoginIp",userIp)
//                .addFormDataPart("package",packageInfo.packageName)
//                .addFormDataPart("email","")
//                .build();
//        Request request = new Request.Builder()
//                .url(url)
//                .method("POST", body)
//                .addHeader("user", this.user)
//                .addHeader("token", token)
//                .addHeader("User-Agent", "Apifox/1.0.0 (https://apifox.com)")
//                .build();
//        Response response = client.newCall(request).execute();
//        String result = response.body().string();
//        Log.d("WeGoEvent", "response success : " + response.message());
//    }
//
//    public void purchase() throws Exception
//    {
//        PackageInfo packageInfo = mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0);
//        String token = md5Decode(this.user+this.afId);
//        String userIp = ProjUtil.getLocalIPAddress();
//        userIp = (userIp == null ? "127.0.0.1" : userIp);
//        String url = "https://api.wegoevent.com/api/put_event";
//
//        OkHttpClient client = new OkHttpClient().newBuilder()
//                .build();
//        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
//                .addFormDataPart("event","purchase")
//                .addFormDataPart("adid",this.afId)
//                .addFormDataPart("money",this.money)
//                .addFormDataPart("phone","")
//                .addFormDataPart("userId",this.afId)
//                .addFormDataPart("userLoginIp",userIp)
//                .addFormDataPart("package",packageInfo.packageName)
//                .addFormDataPart("email","")
//                .build();
//        Request request = new Request.Builder()
//                .url(url)
//                .method("POST", body)
//                .addHeader("user", this.user)
//                .addHeader("token", token)
//                .addHeader("User-Agent", "Apifox/1.0.0 (https://apifox.com)")
//                .build();
//        Response response = client.newCall(request).execute();
//        String result = response.body().string();
//        Log.d("WeGoEvent", "response success : " + response.message());
//    }
//
//    public void first_pay() throws Exception
//    {
//        PackageInfo packageInfo = mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0);
//        String token = md5Decode(this.user+this.afId);
//        String userIp = ProjUtil.getLocalIPAddress();
//        userIp = (userIp == null ? "127.0.0.1" : userIp);
//        String url = "https://api.wegoevent.com/api/put_event";
//
//        OkHttpClient client = new OkHttpClient().newBuilder()
//                .build();
//        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
//                .addFormDataPart("event","first_pay")
//                .addFormDataPart("adid",this.afId)
//                .addFormDataPart("money",this.money)
//                .addFormDataPart("phone","")
//                .addFormDataPart("userId",this.afId)
//                .addFormDataPart("userLoginIp",userIp)
//                .addFormDataPart("package",packageInfo.packageName)
//                .addFormDataPart("email","")
//                .build();
//        Request request = new Request.Builder()
//                .url(url)
//                .method("POST", body)
//                .addHeader("user", this.user)
//                .addHeader("token", token)
//                .addHeader("User-Agent", "Apifox/1.0.0 (https://apifox.com)")
//                .build();
//        Response response = client.newCall(request).execute();
//        String result = response.body().string();
//        Log.d("WeGoEvent", "response success : " + response.message());
//    }
//}
