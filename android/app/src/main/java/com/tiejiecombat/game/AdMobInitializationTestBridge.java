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

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AdMob 启动实验：关闭 SDK Provider 自动初始化，由 MainActivity 显式初始化，
 * 再启动一个缓冲区为 2 的激励广告预加载器，由 SDK 自动维持缓存。
 */
public final class AdMobInitializationTestBridge {
    private static final int PRELOAD_BUFFER_SIZE = 2;
    private static final String TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";

    private final MainActivity activity;
    private final AtomicBoolean startupStarted = new AtomicBoolean(false);
    private volatile String state = "idle";
    private volatile String rewardedState = "idle";
    private volatile boolean destroyed;

    public AdMobInitializationTestBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String startAndPreload() {
        if (destroyed || !startupStarted.compareAndSet(false, true)) {
            return state;
        }
        state = "initializing";
        new Thread(
            () -> {
                try {
                    MobileAds.initialize(activity.getApplicationContext(), initializationStatus -> {
                        if (destroyed) {
                            return;
                        }
                        state = "initialized";
                        activity.runOnUiThread(this::startRewardedPreloader);
                    });
                } catch (Throwable error) {
                    state = "failed:" + error.getClass().getSimpleName();
                }
            },
            "admob-startup-initialization"
        ).start();
        return state;
    }

    private void startRewardedPreloader() {
        if (destroyed) {
            return;
        }
        rewardedState = "loading";
        PreloadConfiguration configuration = new PreloadConfiguration.Builder(TEST_REWARDED_ID)
            .setBufferSize(PRELOAD_BUFFER_SIZE)
            .build();
        RewardedAdPreloader.start(
            TEST_REWARDED_ID,
            configuration,
            new PreloadCallbackV2() {
                @Override
                public void onAdPreloaded(@NonNull String preloadId, ResponseInfo responseInfo) {
                    if (!destroyed) {
                        rewardedState = "loaded";
                    }
                }

                @Override
                public void onAdsExhausted(@NonNull String preloadId) {
                    if (!destroyed) {
                        rewardedState = "loading";
                    }
                }

                @Override
                public void onAdFailedToPreload(@NonNull String preloadId, @NonNull AdError error) {
                    if (!destroyed) {
                        rewardedState = "retrying:load-" + error.getCode();
                    }
                }
            }
        );
    }

    public void destroy() {
        destroyed = true;
        RewardedAdPreloader.destroy(TEST_REWARDED_ID);
    }

    @JavascriptInterface
    public String getState() {
        return state;
    }

    @JavascriptInterface
    public int getRewardedReadyCount() {
        return RewardedAdPreloader.isAdAvailable(TEST_REWARDED_ID) ? 1 : 0;
    }

    @JavascriptInterface
    public String showTestRewarded() {
        if (!"initialized".equals(state)) {
            rewardedState = "failed:not-initialized";
            return rewardedState;
        }
        RewardedAd ad = RewardedAdPreloader.pollAd(TEST_REWARDED_ID);
        if (ad == null) {
            rewardedState = "loading";
            return rewardedState;
        }
        rewardedState = "showing";
        activity.runOnUiThread(() -> {
            final boolean[] earned = {false};
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdShowedFullScreenContent() {
                    rewardedState = "showing";
                }

                @Override
                public void onAdDismissedFullScreenContent() {
                    rewardedState = earned[0] ? "earned" : "closed";
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                    rewardedState = "failed:show-" + error.getCode();
                }
            });
            ad.show(activity, (@NonNull RewardItem rewardItem) -> earned[0] = true);
        });
        return rewardedState;
    }

    @JavascriptInterface
    public String getRewardedState() {
        return rewardedState;
    }
}
