package com.tiejiecombat.game;

import android.app.AlertDialog;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    private AdMobInitializationTestBridge adMobTestBridge;
    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener updateInstallStateListener;
    private boolean updateFlowRequested;
    private boolean updateReadyDialogVisible;

    private final ActivityResultLauncher<IntentSenderRequest> updateActivityResultLauncher =
        registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                // 允许玩家暂时取消；本次启动期间不重复打扰。
            }
        );

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }
        boolean isDebuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        android.webkit.WebView.setWebContentsDebuggingEnabled(isDebuggable);
        android.webkit.WebView webView = bridge != null ? bridge.getWebView() : null;
        if (isDebuggable && webView != null) {
            adMobTestBridge = new AdMobInitializationTestBridge(this);
            webView.addJavascriptInterface(
                adMobTestBridge,
                "TieJieAdMobTestNative"
            );
        }
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                android.webkit.WebView currentWebView =
                    bridge != null ? bridge.getWebView() : null;
                if (currentWebView == null) {
                    return;
                }
                currentWebView.post(() -> currentWebView.evaluateJavascript(
                    "window.dispatchEvent(new Event('tiejie-native-back'));",
                    null
                ));
            }
        });
        initializePlayStoreUpdates();
        enterImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }

    @Override
    public void onResume() {
        super.onResume();
        enterImmersiveMode();
        showDownloadedUpdateIfReady();
    }

    @Override
    public void onDestroy() {
        if (appUpdateManager != null && updateInstallStateListener != null) {
            appUpdateManager.unregisterListener(updateInstallStateListener);
        }
        if (adMobTestBridge != null) {
            adMobTestBridge.destroy();
        }
        super.onDestroy();
    }

    private void initializePlayStoreUpdates() {
        appUpdateManager = AppUpdateManagerFactory.create(this);
        updateInstallStateListener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                showUpdateReadyDialog();
            }
        };
        appUpdateManager.registerListener(updateInstallStateListener);
        checkForPlayStoreUpdate();
    }

    private void checkForPlayStoreUpdate() {
        if (appUpdateManager == null || updateFlowRequested) {
            return;
        }
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(updateInfo -> {
            boolean updateAvailable =
                updateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
            boolean flexibleUpdateAllowed =
                updateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE);
            if (!updateAvailable || !flexibleUpdateAllowed || updateFlowRequested) {
                return;
            }

            updateFlowRequested = true;
            boolean started = appUpdateManager.startUpdateFlowForResult(
                updateInfo,
                updateActivityResultLauncher,
                AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()
            );
            if (!started) {
                updateFlowRequested = false;
            }
        });
    }

    private void showDownloadedUpdateIfReady() {
        if (appUpdateManager == null) {
            return;
        }
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(updateInfo -> {
            if (updateInfo.installStatus() == InstallStatus.DOWNLOADED) {
                showUpdateReadyDialog();
            }
        });
    }

    private void showUpdateReadyDialog() {
        if (appUpdateManager == null || updateReadyDialogVisible || isFinishing()) {
            return;
        }
        updateReadyDialogVisible = true;
        new AlertDialog.Builder(this)
            .setTitle(R.string.update_ready_title)
            .setMessage(R.string.update_ready_message)
            .setPositiveButton(
                R.string.update_restart,
                (dialog, which) -> appUpdateManager.completeUpdate()
            )
            .setNegativeButton(R.string.update_later, null)
            .setOnDismissListener(dialog -> updateReadyDialogVisible = false)
            .show();
    }

    private void enterImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }
}
