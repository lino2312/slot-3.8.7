package com.cocos.game;



//import gun0912.tedimagepicker.builder.TedImagePicker;


import android.app.Activity;

public class TakePhotoActivity extends Activity {

//    private static final String TAG = "TAKEPHOTO";
//
//    // Request codes for permissions
//    private static final int REQUEST_CAMERA_PERMISSION = 100;
//    private static final int REQUEST_STORAGE_PERMISSION = 101;
//
//    private int configHeight = 0;
//    private int configWidth = 0;
//    private int configSize = 0;
//    private int configFrom = 0;  // 1: camera, 0: gallery
//
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_take_photo);
//
//        // Retrieve configuration from intent
//        String paramStr = getIntent().getStringExtra("param");
//        parseConfig(paramStr);
//
//        // Check storage permission before proceeding
//        if (checkStoragePermission()) {
//            if (configFrom == 1) {
//                checkCameraPermissionAndCapturePhoto();
//            } else {
//                selectImageFromGallery();
//            }
//        }
//    }
//
//    // Parse the JSON configuration string for image settings
//    private void parseConfig(String paramStr) {
//        try {
//            JSONObject paramConfig = new JSONObject(paramStr);
//            configHeight = paramConfig.getInt("height");
//            configWidth = paramConfig.getInt("width");
//            configSize = paramConfig.getInt("size");
//            configFrom = paramConfig.getInt("from");
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//    }
//
//    // Check if storage permission is granted
//    private boolean checkStoragePermission() {
//        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
//            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQUEST_STORAGE_PERMISSION);
//            return false;
//        }
//        return true;
//    }
//
//    // Check if camera permission is granted and then capture photo
//    private void checkCameraPermissionAndCapturePhoto() {
//        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
//            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA_PERMISSION);
//        } else {
//            capturePhoto();
//        }
//    }
//
//    // Capture photo using CameraX
//    private void capturePhoto() {
//        // Here, you would set up CameraX and use it to capture a photo.
//        // Once captured, proceed with the cropping logic if necessary.
//        // The captured image can be processed as needed.
//
//        // For now, let's log that CameraX is ready to capture.
//        Log.d(TAG, "CameraX is ready to capture a photo!");
//    }
//
//    // Select an image from the gallery using TedImagePicker
//    private void selectImageFromGallery() {
//        TedImagePicker.with(this)
//                .start(uri -> {
//                    // Handle the selected image URI here
//                    Log.d(TAG, "Image selected: " + uri.toString());
//
//                    // Optional: Convert the selected image to base64, handle cropping, etc.
//                    processImage(uri);
//                });
//    }
//
//    // Process the selected or captured image (compress, crop, etc.)
//    private void processImage(Uri imageUri) {
//        // Here, you can compress the image, crop it, or convert it to base64
//        // For demonstration, we will just log the image path and size
//
//        Log.d(TAG, "Processing image: " + imageUri.getPath());
//
//        // Example: Convert to base64 if needed (custom utility method)
//        // String base64Image = ProjUtil.imageToBase64(imageUri.getPath());
//
//        // Send the result back to JavaScript or finish the activity with result
//        sendActionResult(1, imageUri.toString());  // Sending the image URI for now
//    }
//
//    // Handle the permission result
//    @Override
//    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
//        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
//        if (requestCode == REQUEST_CAMERA_PERMISSION) {
//            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
//                capturePhoto();
//            } else {
//                Log.d(TAG, "Camera permission denied.");
//            }
//        } else if (requestCode == REQUEST_STORAGE_PERMISSION) {
//            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
//                if (configFrom == 1) {
//                    checkCameraPermissionAndCapturePhoto();
//                } else {
//                    selectImageFromGallery();
//                }
//            } else {
//                Log.d(TAG, "Storage permission denied.");
//            }
//        }
//    }
//
//    // Send result back to JavaScript
//    private void sendActionResult(int code, String data) {
//        JSONObject result = new JSONObject();
//        try {
//            result.put("result", code);
//            if (!data.isEmpty()) {
//                result.put("data", data);
//            }
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//
//        // Call the JS function with the result (assumed that ProjUtil is a helper method)
//        ProjUtil.callJS("TakePhotoCallback", result);
//    }
}

