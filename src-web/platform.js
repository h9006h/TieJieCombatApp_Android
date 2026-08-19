(() => {
  'use strict';
  const root=typeof globalThis!=='undefined'?globalThis:window;
  const ttApi=root.tt;
  const nativeAds=root.TieJieAndroidAdsNative;
  const config=()=>root.TieJieAdConfig||{};
  const placementKey={gold:'rewardedGold',chicken:'rewardedChicken',fruit:'rewardedFruit',revive:'rewardedRevive',stageDouble:'rewardedStageDouble',temporaryRecruit:'rewardedTemporaryRecruit'};
  let adBusy=false,lastInterstitialAt=0,launchedAt=Date.now();
  let nativeRequestSeq=0;
  const adDebugState={
    log:[],
    lastResult:null
  };
  const logAdEvent=(entry={})=>{
    const item={time:new Date().toISOString(),...entry};
    adDebugState.lastResult=item;
    adDebugState.log.unshift(item);
    if(adDebugState.log.length>18)adDebugState.log.length=18;
    return item
  };
  const safeParse=value=>{try{return value?JSON.parse(value):null}catch{return null}};

  const androidAds=root.TieJieAndroidAds=root.TieJieAndroidAds||(()=>{
    const pending=new Map();
    return{
      __resolve(id,ok,reason=''){
        const task=pending.get(id);
        if(!task)return;
        pending.delete(id);
        task.resolve({ok:ok===true,reason:reason||''});
      },
      __resolveBoolean(id,ok){
        const task=pending.get(id);
        if(!task)return;
        pending.delete(id);
        task.resolve(ok===true);
      },
      requestRewarded(kind){
        if(!nativeAds?.showRewarded)return Promise.resolve({ok:false,reason:'unsupported'});
        const id=`rewarded-${Date.now()}-${nativeRequestSeq++}`;
        return new Promise(resolve=>{
          pending.set(id,{resolve});
          nativeAds.showRewarded(id,kind||'');
        })
      },
      requestInterstitial(){
        if(!nativeAds?.showInterstitial)return Promise.resolve(false);
        const id=`interstitial-${Date.now()}-${nativeRequestSeq++}`;
        return new Promise(resolve=>{
          pending.set(id,{resolve});
          nativeAds.showInterstitial(id);
        })
      }
    }
  })();

  function isDouyin(){return !!ttApi?.createRewardedVideoAd}
  function isAndroidNative(){return !!nativeAds?.isAvailable?.()}
  function nativeDebugSnapshot(){return safeParse(nativeAds?.getDebugSnapshot?.())}
  function adPlatformName(){return isAndroidNative()?'android-native':isDouyin()?'douyin':'browser'}
  function debugReport(){
    return{
      platform:adPlatformName(),
      nativeAvailable:isAndroidNative(),
      busy:adBusy,
      launchedAt,
      lastInterstitialAt,
      douyinConfigured:{
        rewarded:Object.fromEntries(Object.entries(placementKey).map(([kind,key])=>[kind,!!config()[key]])),
        interstitial:!!config().interstitialStage
      },
      native:nativeDebugSnapshot(),
      log:[...adDebugState.log],
      lastResult:adDebugState.lastResult
    }
  }
  function showRewarded(kind){
    if(adBusy)return Promise.resolve({ok:false,reason:'busy'});
    const adUnitId=config()[placementKey[kind]]||'';
    if(isAndroidNative()){
      adBusy=true;root.TieJieAudio?.pause?.();
      return androidAds.requestRewarded(kind).then(result=>{logAdEvent({type:'rewarded',placement:kind,platform:'android-native',ok:!!result?.ok,reason:result?.reason||''});return result}).catch(()=>{const result={ok:false,reason:'ad-error'};logAdEvent({type:'rewarded',placement:kind,platform:'android-native',ok:false,reason:'ad-error'});return result}).finally(()=>{adBusy=false;root.TieJieAudio?.resume?.()})
    }
    if(!isDouyin())return window.TieJieAuthorization?.mode==='test'?new Promise(resolve=>setTimeout(()=>{const result={ok:true,mock:true};logAdEvent({type:'rewarded',placement:kind,platform:'browser',ok:true,reason:'mock'});resolve(result)},450)):Promise.resolve((()=>{const result={ok:false,reason:'unsupported'};logAdEvent({type:'rewarded',placement:kind,platform:'browser',ok:false,reason:'unsupported'});return result})());
    if(!adUnitId)return Promise.resolve((()=>{const result={ok:false,reason:'missing-ad-unit'};logAdEvent({type:'rewarded',placement:kind,platform:'douyin',ok:false,reason:'missing-ad-unit'});return result})());
    adBusy=true;root.TieJieAudio?.pause?.();
    return new Promise(resolve=>{
      const ad=ttApi.createRewardedVideoAd({adUnitId});let settled=false;
      const finish=(ok,reason='')=>{if(settled)return;settled=true;adBusy=false;try{ad.offClose?.(onClose);ad.offError?.(onError);ad.destroy?.()}catch{}root.TieJieAudio?.resume?.();logAdEvent({type:'rewarded',placement:kind,platform:'douyin',ok,reason});resolve({ok,reason})};
      const onClose=result=>finish(result?.isEnded===true||(result?.count||0)>0,result?.isEnded===false?'not-completed':'');
      const onError=error=>finish(false,error?.errMsg||'ad-error');
      ad.onClose(onClose);ad.onError(onError);
      Promise.resolve(ad.load?.()).then(()=>ad.show()).catch(error=>finish(false,error?.errMsg||'ad-show-failed'));
    })
  }
  function showInterstitial(){
    const now=Date.now(),adUnitId=config().interstitialStage||'';
    if(isAndroidNative()){
      if(adBusy||now-launchedAt<30000||now-lastInterstitialAt<60000)return Promise.resolve(false);
      adBusy=true;root.TieJieAudio?.pause?.();
      return androidAds.requestInterstitial().then(ok=>{if(ok)lastInterstitialAt=Date.now();logAdEvent({type:'interstitial',placement:'stage',platform:'android-native',ok:ok===true,reason:ok?'':'show-failed'});return ok===true}).catch(()=>{logAdEvent({type:'interstitial',placement:'stage',platform:'android-native',ok:false,reason:'ad-error'});return false}).finally(()=>{adBusy=false;root.TieJieAudio?.resume?.()})
    }
    if(!ttApi?.createInterstitialAd||!adUnitId||now-launchedAt<30000||now-lastInterstitialAt<60000)return Promise.resolve(false);
    root.TieJieAudio?.pause?.();
    return new Promise(resolve=>{const ad=ttApi.createInterstitialAd({adUnitId});let settled=false;const done=(ok,reason='')=>{if(settled)return;settled=true;try{ad.destroy?.()}catch{}if(ok)lastInterstitialAt=Date.now();root.TieJieAudio?.resume?.();logAdEvent({type:'interstitial',placement:'stage',platform:'douyin',ok,reason});resolve(ok)};ad.onError?.(error=>done(false,error?.errMsg||'ad-error'));Promise.resolve(ad.load?.()).then(()=>ad.show()).then(()=>done(true,'')).catch(error=>done(false,error?.errMsg||'ad-show-failed'))})
  }
  function login(){
    if(!ttApi?.login)return Promise.resolve({ok:false,reason:'unsupported'});
    return new Promise(resolve=>ttApi.login({success:result=>resolve({ok:true,result}),fail:error=>resolve({ok:false,reason:error?.errMsg||'login-failed'})}))
  }
  function submitHighestStage(value){
    const score=Math.max(0,Math.floor(Number(value)||0));
    if(!score)return Promise.resolve({ok:false,reason:'invalid-score'});
    if(!ttApi?.setImRankData)return Promise.resolve({ok:!isDouyin(),mock:!isDouyin(),reason:isDouyin()?'unsupported':''});
    return new Promise(resolve=>ttApi.setImRankData({dataType:0,value:String(score),priority:0,zoneId:'default',success:()=>resolve({ok:true}),fail:error=>resolve({ok:false,reason:error?.errMsg||'rank-submit-failed'})}))
  }
  async function openLeaderboard(){
    if(!ttApi?.getImRankList)return {ok:false,reason:'unsupported'};
    const session=await login();if(!session.ok)return session;
    return new Promise(resolve=>ttApi.getImRankList({rankType:'all',dataType:0,relationType:'all',suffix:'关',rankTitle:'铁街最高推关榜',zoneId:'default',success:()=>resolve({ok:true}),fail:error=>resolve({ok:false,reason:error?.errMsg||'rank-open-failed'})}))
  }
  function openFeedback(){
    if(!ttApi?.openFeedback)return Promise.resolve({ok:false,reason:'unsupported'});
    return new Promise(resolve=>ttApi.openFeedback({success:()=>resolve({ok:true}),fail:error=>resolve({ok:false,reason:error?.errMsg||'feedback-open-failed'})}))
  }
  root.TieJiePlatform={isDouyin,isAndroidNative,ads:{showRewarded,showInterstitial,debugReport},rank:{submitHighestStage,open:openLeaderboard},support:{openFeedback}};
})();
