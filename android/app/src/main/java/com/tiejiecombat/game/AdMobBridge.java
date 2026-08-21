package com.tiejiecombat.game;

import android.webkit.JavascriptInterface;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.ResponseInfo;
import com.google.android.gms.ads.preload.PreloadCallbackV2;
import com.google.android.gms.ads.preload.PreloadConfiguration;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdPreloader;
import com.google.android.gms.ads.rewarded.ServerSideVerificationOptions;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/** A single rewarded-ad bridge shared by test and production reward flows. */
public final class AdMobBridge {
    private static final int PRELOAD_BUFFER_SIZE = 2;
    private static final String TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";

    private final MainActivity activity;
    private final AtomicBoolean startupStarted = new AtomicBoolean(false);
    private final AtomicBoolean showInProgress = new AtomicBoolean(false);
    private final Set<String> startedPreloaders = ConcurrentHashMap.newKeySet();
    private volatile String state = "idle";
    private volatile String rewardedState = "idle";
    private volatile boolean destroyed;

    public AdMobBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String startAndPreload(boolean testMode) {
        if (destroyed) return "failed:destroyed";
        String adUnitId = rewardedId(testMode);
        if (adUnitId.isEmpty()) return "failed:missing-ad-unit";
        if (startupStarted.compareAndSet(false, true)) {
            state = "initializing";
            new Thread(() -> {
                try {
                    MobileAds.initialize(activity.getApplicationContext(), status -> {
                        if (destroyed) return;
                        state = "initialized";
                        activity.runOnUiThread(() -> startPreloader(adUnitId));
                    });
                } catch (Throwable error) {
                    state = "failed:" + error.getClass().getSimpleName();
                    rewardedState = state;
                }
            }, "admob-rewarded-initialization").start();
        } else if ("initialized".equals(state)) {
            activity.runOnUiThread(() -> startPreloader(adUnitId));
        }
        return state;
    }

    private void startPreloader(String adUnitId) {
        if (destroyed || adUnitId.isEmpty() || !startedPreloaders.add(adUnitId)) return;
        rewardedState = "loading";
        PreloadConfiguration configuration = new PreloadConfiguration.Builder(adUnitId)
            .setBufferSize(PRELOAD_BUFFER_SIZE).build();
        RewardedAdPreloader.start(adUnitId, configuration, new PreloadCallbackV2() {
            @Override public void onAdPreloaded(@NonNull String preloadId, ResponseInfo info) {
                if (!destroyed && !showInProgress.get()) rewardedState = "loaded";
            }
            @Override public void onAdsExhausted(@NonNull String preloadId) {
                if (!destroyed && !showInProgress.get()) rewardedState = "loading";
            }
            @Override public void onAdFailedToPreload(@NonNull String preloadId, @NonNull AdError error) {
                if (!destroyed && !showInProgress.get()) rewardedState = "retrying:load-" + error.getCode();
            }
        });
    }

    @JavascriptInterface
    public String showRewarded(String customData, boolean testMode) {
        if (destroyed) return rewardedState = "failed:destroyed";
        if (!"initialized".equals(state)) {
            String startupState = startAndPreload(testMode);
            return rewardedState = startupState.startsWith("failed:") ? startupState : "loading";
        }
        String adUnitId = rewardedId(testMode);
        if (adUnitId.isEmpty()) return rewardedState = "failed:missing-ad-unit";
        String safeCustomData = customData == null ? "" : customData.trim();
        activity.runOnUiThread(() -> showRewardedOnMainThread(adUnitId, safeCustomData));
        return rewardedState;
    }

    private void showRewardedOnMainThread(String adUnitId, String customData) {
        if (destroyed || !showInProgress.compareAndSet(false, true)) return;
        try {
            startPreloader(adUnitId);
            RewardedAd ad = RewardedAdPreloader.pollAd(adUnitId);
            if (ad == null) {
                showInProgress.set(false);
                rewardedState = "loading";
                return;
            }
            if (!customData.isEmpty()) {
                ad.setServerSideVerificationOptions(new ServerSideVerificationOptions.Builder()
                    .setCustomData(customData).build());
            }
            rewardedState = "showing";
            final boolean[] earned = {false};
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdShowedFullScreenContent() { rewardedState = "showing"; }
                @Override public void onAdDismissedFullScreenContent() {
                    showInProgress.set(false);
                    rewardedState = earned[0] ? "earned" : "closed";
                }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                    showInProgress.set(false);
                    rewardedState = "failed:show-" + error.getCode();
                }
            });
            ad.show(activity, (@NonNull RewardItem reward) -> earned[0] = true);
        } catch (Throwable error) {
            showInProgress.set(false);
            rewardedState = "failed:native-" + error.getClass().getSimpleName();
        }
    }

    @JavascriptInterface public String getState() { return state; }
    @JavascriptInterface public String getRewardedState() { return rewardedState; }
    @JavascriptInterface public int getRewardedReadyCount(boolean testMode) {
        return "loaded".equals(rewardedState) ? 1 : 0;
    }

    public void destroy() {
        destroyed = true;
        for (String id : startedPreloaders) RewardedAdPreloader.destroy(id);
        startedPreloaders.clear();
    }

    private String rewardedId(boolean testMode) {
        if (testMode) return TEST_REWARDED_ID;
        int id = activity.getResources().getIdentifier("admob_rewarded_default", "string", activity.getPackageName());
        return id == 0 ? "" : activity.getString(id).trim();
    }
}
