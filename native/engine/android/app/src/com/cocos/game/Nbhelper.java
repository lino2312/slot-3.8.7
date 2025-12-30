package com.cocos.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.opengl.GLSurfaceView;
import android.os.Build;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.SurfaceView;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

//import androidx.annotation.Nullable;

//import com.free.yono.R;

import com.game.testGame.R;

import java.lang.ref.WeakReference;

public class Nbhelper {

    private static WeakReference<Activity> sActivityRef;
    private static FrameLayout sOverlayRoot;
    private static WebView sWebView;
    private static Button sBackBtn;
    private static ProgressBar sProgress;

    private static  Activity getActivity() {
        Activity act = AppActivity.getInstance();
        if (act != null) {
            sActivityRef = new WeakReference<>(act);
        } else if (sActivityRef != null) {
            act = sActivityRef.get();
        }
        return act;
    }

    private static void runOnUi(Runnable r) {
        Activity a = getActivity();
        if (a != null) a.runOnUiThread(r);
    }

    public static void showWebPage(final String url) {
        runOnUi(() -> {
            Activity act = getActivity();
            if (act == null) return;

            if (sOverlayRoot != null) {
                if (sWebView != null) sWebView.loadUrl(url);
                return;
            }

            View cocosView = findCocosView(act);
            if (cocosView != null) cocosView.setVisibility(View.INVISIBLE);

            sOverlayRoot = new FrameLayout(act);
            sOverlayRoot.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));

            sProgress = new ProgressBar(act);
            FrameLayout.LayoutParams pParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER);
            sProgress.setLayoutParams(pParams);
            sOverlayRoot.addView(sProgress);

            sWebView = new WebView(act);
            sWebView.setBackgroundColor(Color.BLACK);
            sWebView.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
            configWebSettings(sWebView.getSettings(), sWebView);
            sWebView.setWebViewClient(new WebViewClient() {
                @Override public void onPageStarted(WebView view, String u, android.graphics.Bitmap favicon) {
                    if (sProgress != null) sProgress.setVisibility(View.VISIBLE);
                    view.setVisibility(View.INVISIBLE);
                }
                @Override public void onPageFinished(WebView view, String u) {
                    if (sProgress != null) sProgress.setVisibility(View.GONE);
                    view.setVisibility(View.VISIBLE);
                }
            });
            sWebView.loadUrl(url);

            sBackBtn = new Button(act);
            sBackBtn.setBackgroundColor(Color.TRANSPARENT);
            sBackBtn.setTextColor(Color.BLACK);
            Drawable icon = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
                    ? act.getResources().getDrawable(R.mipmap.ic_home, act.getTheme())
                    : act.getResources().getDrawable(R.mipmap.ic_home);
            if (icon instanceof BitmapDrawable) {
                android.graphics.Bitmap bmp = ((BitmapDrawable) icon).getBitmap();
                android.graphics.Bitmap resized = android.graphics.Bitmap.createScaledBitmap(bmp, 85, 85, true);
                sBackBtn.setCompoundDrawablesWithIntrinsicBounds(
                        new BitmapDrawable(act.getResources(), resized),
                        null, null, null);
            }
            FrameLayout.LayoutParams bParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.END | Gravity.CENTER_VERTICAL);
            sBackBtn.setLayoutParams(bParams);
            enableDrag(sBackBtn);
            sBackBtn.setOnClickListener(v -> {
                new AlertDialog.Builder(act)
                        .setTitle("Confirmation")
                        .setMessage("Are you sure you want to return to the lobby?")
                        .setPositiveButton("Yes", (DialogInterface dialog, int which) -> {
                            act.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                            closeInternal(true);
                            PlatformAndroidApi.confirmedBackToHall();
                        })
                        .setNegativeButton("No", (d, w) -> d.dismiss())
                        .show();
            });

            sOverlayRoot.addView(sWebView);
            sOverlayRoot.addView(sBackBtn);
            sBackBtn.bringToFront();

            FrameLayout decor = (FrameLayout) act.getWindow().getDecorView();
            decor.addView(sOverlayRoot);
        });
    }

    public static void closeIfShowing() {
        runOnUi(() -> closeInternal(false));
    }

    private static void closeInternal(boolean restoreCocos) {
        Activity act = getActivity();
        if (act == null) return;

        if (sWebView != null) {
            sWebView.stopLoading();
            sWebView.destroy();
        }
        if (sOverlayRoot != null) {
            FrameLayout decor = (FrameLayout) act.getWindow().getDecorView();
            decor.removeView(sOverlayRoot);
        }
        sWebView = null;
        sBackBtn = null;
        sProgress = null;
        sOverlayRoot = null;

        if (restoreCocos) {
            View cocosView = findCocosView(act); // 同样用查找方法恢复
            if (cocosView != null) cocosView.setVisibility(View.VISIBLE);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled"})
    private static void configWebSettings(WebSettings ws, WebView wv) {
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        ws.setSupportZoom(false);
        ws.setUseWideViewPort(true);
        ws.setLoadWithOverviewMode(true);

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cm.setAcceptThirdPartyCookies(wv, true);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private static void enableDrag(View v) {
        v.setOnTouchListener(new View.OnTouchListener() {
            float startX, startY, rawX, rawY;
            boolean dragging;
            final float THRESHOLD = 10;
            @Override public boolean onTouch(View view, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        startX = view.getX(); startY = view.getY();
                        rawX = e.getRawX(); rawY = e.getRawY();
                        dragging = false; break;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - rawX, dy = e.getRawY() - rawY;
                        if (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD) {
                            dragging = true; view.setX(startX + dx); view.setY(startY + dy);
                        } break;
                    case MotionEvent.ACTION_UP:
                        if (!dragging) view.performClick(); break;
                }
                return true;
            }
        });
    }

    // 关键：查找 Cocos 主视图（GLSurfaceView/SurfaceView），找不到则退回根内容第一个子视图
    private static  View findCocosView(Activity act) {
        ViewGroup content = act.findViewById(android.R.id.content);
        if (content != null) {
            for (int i = 0; i < content.getChildCount(); i++) {
                View child = content.getChildAt(i);
                if (child instanceof GLSurfaceView || child instanceof SurfaceView) {
                    return child;
                }
            }
            if (content.getChildCount() > 0) return content.getChildAt(0);
        }
        return null;
    }
}