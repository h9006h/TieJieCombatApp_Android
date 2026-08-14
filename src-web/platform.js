(() => {
  'use strict';
  const root=typeof globalThis!=='undefined'?globalThis:window;
  const ttApi=root.tt;
  const config=()=>root.TieJieAdConfig||{};
  const placementKey={gold:'rewardedGold',chicken:'rewardedChicken',fruit:'rewardedFruit',revive:'rewardedRevive',stageDouble:'rewardedStageDouble',temporaryRecruit:'rewardedTemporaryRecruit'};
  let adBusy=false,lastInterstitialAt=0,launchedAt=Date.now();

  function isDouyin(){return !!ttApi?.createRewardedVideoAd}
  function showRewarded(kind){
    if(adBusy)return Promise.resolve({ok:false,reason:'busy'});
    const adUnitId=config()[placementKey[kind]]||'';
    if(!isDouyin())return new Promise(resolve=>setTimeout(()=>resolve({ok:true,mock:true}),450));
    if(!adUnitId)return Promise.resolve({ok:false,reason:'missing-ad-unit'});
    adBusy=true;root.TieJieAudio?.pause?.();
    return new Promise(resolve=>{
      const ad=ttApi.createRewardedVideoAd({adUnitId});let settled=false;
      const finish=(ok,reason='')=>{if(settled)return;settled=true;adBusy=false;try{ad.offClose?.(onClose);ad.offError?.(onError);ad.destroy?.()}catch{}root.TieJieAudio?.resume?.();resolve({ok,reason})};
      const onClose=result=>finish(result?.isEnded===true||(result?.count||0)>0,result?.isEnded===false?'not-completed':'');
      const onError=error=>finish(false,error?.errMsg||'ad-error');
      ad.onClose(onClose);ad.onError(onError);
      Promise.resolve(ad.load?.()).then(()=>ad.show()).catch(error=>finish(false,error?.errMsg||'ad-show-failed'));
    })
  }
  function showInterstitial(){
    const now=Date.now(),adUnitId=config().interstitialStage||'';
    if(!ttApi?.createInterstitialAd||!adUnitId||now-launchedAt<30000||now-lastInterstitialAt<60000)return Promise.resolve(false);
    root.TieJieAudio?.pause?.();
    return new Promise(resolve=>{const ad=ttApi.createInterstitialAd({adUnitId});let settled=false;const done=ok=>{if(settled)return;settled=true;try{ad.destroy?.()}catch{}if(ok)lastInterstitialAt=Date.now();root.TieJieAudio?.resume?.();resolve(ok)};ad.onError?.(()=>done(false));Promise.resolve(ad.load?.()).then(()=>ad.show()).then(()=>done(true)).catch(()=>done(false))})
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
  root.TieJiePlatform={isDouyin,ads:{showRewarded,showInterstitial},rank:{submitHighestStage,open:openLeaderboard},support:{openFeedback}};
})();
