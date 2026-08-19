package com.tiejiecombat.game;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import org.json.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;

public class AdMobBridge {
    private static final String DEFAULT_KIND = "default";

    private final MainActivity activity;
    private final AtomicBoolean adShowing = new AtomicBoolean(false);

    private volatile boolean initialized;
    private volatile boolean destroyed;
    private boolean rewardedLoading;
    private RewardedAd rewardedAd;
    private InterstitialAd interstitialAd;
    private long lastInterstitialShownAt;
    private String lastRewardedEvent = "idle";
    private String lastRewardedError = "";
    private String lastInterstitialEvent = "idle";
    private String lastInterstitialError = "";

    public AdMobBridge(MainActivity activity) {
        this.activity = activity;
    }

    public void initialize() {
        if (initialized || destroyed) {
            return;
        }
        initialized = true;
        MobileAds.initialize(activity, initializationStatus -> {
            if (destroyed) {
                return;
            }
            activity.runOnUiThread(() -> {
                preloadRewarded();
                preloadInterstitial();
            });
        });
    }

    public void destroy() {
        destroyed = true;
        rewardedAd = null;
        interstitialAd = null;
    }

    @JavascriptInterface
    public boolean isAvailable() {
        return !destroyed;
    }

    @JavascriptInterface
    public String getDebugSnapshot() {
        try {
            JSONObject snapshot = new JSONObject();
            snapshot.put("initialized", initialized);
            snapshot.put("destroyed", destroyed);
            snapshot.put("adShowing", adShowing.get());
            snapshot.put("rewardedReadyCount", rewardedAd == null ? 0 : 1);
            snapshot.put("interstitialReady", interstitialAd != null);
            snapshot.put("lastInterstitialShownAt", lastInterstitialShownAt);
            snapshot.put("lastRewardedEvent", lastRewardedEvent);
            snapshot.put("lastRewardedError", lastRewardedError);
            snapshot.put("lastInterstitialEvent", lastInterstitialEvent);
            snapshot.put("lastInterstitialError", lastInterstitialError);
            return snapshot.toString();
        } catch (Exception error) {
            return "{}";
        }
    }

    @JavascriptInterface
    public void showRewarded(String requestId, String kind) {
        activity.runOnUiThread(() -> {
            if (destroyed) {
                resolve(requestId, false, "destroyed");
                return;
            }
            if (adShowing.get()) {
                resolve(requestId, false, "busy");
                return;
            }
            String normalizedKind = normalizeKind(kind);
            RewardedAd ad = rewardedAd;
            rewardedAd = null;
            if (ad == null) {
                lastRewardedEvent = "not-ready";
                lastRewardedError = "";
                preloadRewarded();
                resolve(requestId, false, "not-ready");
                return;
            }
            adShowing.set(true);
            lastRewardedEvent = "showing";
            lastRewardedError = "";
            final boolean[] earnedReward = {false};
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    adShowing.set(false);
                    lastRewardedEvent = earnedReward[0] ? "dismissed-earned" : "dismissed-no-reward";
                    lastRewardedError = earnedReward[0] ? "" : "not-completed";
                    preloadRewarded();
                    resolve(requestId, earnedReward[0], earnedReward[0] ? "" : "not-completed");
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                    adShowing.set(false);
                    lastRewardedEvent = "show-failed";
                    lastRewardedError = adError.getMessage();
                    preloadRewarded();
                    resolve(requestId, false, adError.getMessage());
                }
            });
            ad.show(activity, new OnUserEarnedRewardListener() {
                @Override
                public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                    earnedReward[0] = true;
                }
            });
        });
    }

    @JavascriptInterface
    public void showInterstitial(String requestId) {
        activity.runOnUiThread(() -> {
            if (destroyed) {
                resolveBoolean(requestId, false);
                return;
            }
            if (adShowing.get()) {
                resolveBoolean(requestId, false);
                return;
            }
            if (interstitialAd == null) {
                lastInterstitialEvent = "not-ready";
                lastInterstitialError = "";
                preloadInterstitial();
                resolveBoolean(requestId, false);
                return;
            }
            adShowing.set(true);
            lastInterstitialEvent = "showing";
            lastInterstitialError = "";
            InterstitialAd ad = interstitialAd;
            interstitialAd = null;
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    adShowing.set(false);
                    lastInterstitialShownAt = System.currentTimeMillis();
                    lastInterstitialEvent = "dismissed";
                    lastInterstitialError = "";
                    preloadInterstitial();
                    resolveBoolean(requestId, true);
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                    adShowing.set(false);
                    lastInterstitialEvent = "show-failed";
                    lastInterstitialError = adError.getMessage();
                    preloadInterstitial();
                    resolveBoolean(requestId, false);
                }
            });
            ad.show(activity);
        });
    }

    private void preloadRewarded() {
        if (destroyed || rewardedLoading || rewardedAd != null) {
            return;
        }
        String adUnitId = stringResource("admob_rewarded_default");
        if (adUnitId.isEmpty()) {
            return;
        }
        rewardedLoading = true;
        RewardedAd.load(activity, adUnitId, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedLoading = false;
                if (destroyed) {
                    return;
                }
                lastRewardedEvent = "loaded";
                lastRewardedError = "";
                rewardedAd = ad;
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                rewardedLoading = false;
                lastRewardedEvent = "load-failed";
                lastRewardedError = loadAdError.getMessage();
                rewardedAd = null;
            }
        });
    }

    private void preloadInterstitial() {
        if (destroyed || interstitialAd != null || System.currentTimeMillis() - lastInterstitialShownAt < 15000L) {
            return;
        }
        String adUnitId = stringResource("admob_interstitial_stage");
        if (adUnitId.isEmpty()) {
            return;
        }
        InterstitialAd.load(activity, adUnitId, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                if (destroyed) {
                    return;
                }
                lastInterstitialEvent = "loaded";
                lastInterstitialError = "";
                interstitialAd = ad;
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                lastInterstitialEvent = "load-failed";
                lastInterstitialError = loadAdError.getMessage();
                interstitialAd = null;
            }
        });
    }

    private String stringResource(String name) {
        int id = activity.getResources().getIdentifier(name, "string", activity.getPackageName());
        if (id == 0) {
            return "";
        }
        return activity.getString(id).trim();
    }

    private String normalizeKind(String kind) {
        if (kind == null) {
            return DEFAULT_KIND;
        }
        String value = kind.trim();
        return value.isEmpty() ? DEFAULT_KIND : value;
    }

    private void resolveBoolean(String requestId, boolean ok) {
        dispatchJs(
            "window.TieJieAndroidAds&&window.TieJieAndroidAds.__resolveBoolean("
                + JSONObject.quote(requestId)
                + ","
                + ok
                + ");"
        );
    }

    private void resolve(String requestId, boolean ok, String reason) {
        dispatchJs(
            "window.TieJieAndroidAds&&window.TieJieAndroidAds.__resolve("
                + JSONObject.quote(requestId)
                + ","
                + ok
                + ","
                + JSONObject.quote(reason == null ? "" : reason)
                + ");"
        );
    }

    private void dispatchJs(String code) {
        WebView webView = activity.getBridgeWebView();
        if (webView == null) {
            return;
        }
        webView.post(() -> {
            if (!destroyed) {
                webView.evaluateJavascript(code, null);
            }
        });
    }
}
