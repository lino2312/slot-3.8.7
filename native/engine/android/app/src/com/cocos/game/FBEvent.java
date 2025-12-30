//package com.cocos.game;
//
//import android.content.Context;
//import android.util.Log;
//
//import org.json.JSONArray;
//import org.json.JSONObject;
//
////import okhttp3.MediaType;
////import okhttp3.OkHttpClient;
////import okhttp3.Request;
////import okhttp3.RequestBody;
////import okhttp3.Response;
//
//public class FBEvent implements Runnable{
//
//    private String eventData;
//    private Context mContext = null;
//
//    public FBEvent(Context context, String data)
//    {
//        this.eventData = data;
//        this.mContext = context;
//    }
//
//    @Override
//    public void run()  {
//        try{
//            JSONObject jb = new JSONObject(this.eventData);
//            String eventName = jb.getString("EventName");
//            String eventValue = "";
//            if (jb.has("EventValue")) eventValue = jb.getString("EventValue");
//
//            // 创建事件数据的 JSON 对象
//            JSONObject eventData = new JSONObject();
//            eventData.put("event_name",eventName);
//            eventData.put("event_time", System.currentTimeMillis() / 1000);  // 当前时间的时间戳
//            eventData.put("action_source","website");
//
//            if(PlatformAndroidApi.facebook_url != null) eventData.put("event_source_url",PlatformAndroidApi.facebook_url);
//
//
//            // 创建用户数据的 JSON 对象
//            JSONObject userData = new JSONObject();
//            if(PlatformAndroidApi.facebook_fbc != null) userData.put("fbc", PlatformAndroidApi.facebook_fbc);
//
//            if(PlatformAndroidApi.facebook_fbp != null) userData.put("fbp", PlatformAndroidApi.facebook_fbp);
//
//            String client_user_agent = ProjUtil.getClientUserAgent(this.mContext);
//
//            if(client_user_agent != null) userData.put("client_user_agent", client_user_agent);
//
//            if(PlatformAndroidApi.ClientIP != null) userData.put("client_ip_address", PlatformAndroidApi.ClientIP);
//
//            eventData.put("user_data", userData);
//
//            // 创建自定义数据的 JSON 对象
//            if(eventValue.length() > 0)
//            {
//                JSONObject customData = new JSONObject(eventValue);
//                eventData.put("custom_data", customData);
//            }
//
//            // 创建包含事件数据的 JSON 数组
//            JSONArray eventDataArray = new JSONArray();
//            eventDataArray.put(eventData);
//
//            String[] fbParam = PlatformAndroidApi.fbParam.split("\\|");
//
//            // 创建最终的请求数据的 JSON 对象
//            JSONObject jsonData = new JSONObject();
//            jsonData.put("data", eventDataArray);
//            jsonData.put("access_token", fbParam[1]);
//            // 创建 OkHttp 客户端
//            OkHttpClient client = new OkHttpClient();
//
//            // 创建请求体
//            RequestBody requestBody = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), jsonData.toString());
//
//            String apiUrl = String.format("https://graph.facebook.com/v18.0/%s/events",fbParam[0]);
//            // 创建请求
//            Request request = new Request.Builder()
//                    .url(apiUrl)
//                    .addHeader("Content-Type", "application/json")
//                    .post(requestBody)
//                    .build();
//
//            Response response = client.newCall(request).execute();
//            String result = response.body().string();
//            Log.d("WeGoEvent", "response success : " + response.message());
//        }
//        catch (Exception e)
//        {
//            Log.d("FBEvent:", e.getMessage());
//        }
//
//    }
//}
