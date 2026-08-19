(() => {
  'use strict';
  const root=typeof globalThis!=='undefined'?globalThis:window;
  const ttApi=root.tt;
  function isDouyin(){return !!ttApi}
  function isAndroidNative(){return false}
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
  root.TieJiePlatform={isDouyin,isAndroidNative,rank:{submitHighestStage,open:openLeaderboard},support:{openFeedback}};
})();
