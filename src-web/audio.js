(() => {
  'use strict';
  const root=typeof globalThis!=='undefined'?globalThis:window;
  const ttApi=root.tt;
  const musicFiles=[
    'assets/audio/music/01-iron-alley.wav',
    'assets/audio/music/02-dunhuang-wall.wav',
    'assets/audio/music/03-beacon-wall.wav',
    'assets/audio/music/04-highrise-pulse.wav',
    'assets/audio/music/05-close-quarters.wav',
    'assets/audio/music/06-ancient-battle.wav'
  ];
  const enemyTypes=new Set(['skinny','heavy','spinner','grappler','axe','assassin','suit','breaker','whip','barbarian']);
  const hasDouyinAudio=!!ttApi?.createInnerAudioContext;
  const musicDisabled=hasDouyinAudio;
  const hasWebAudio=typeof root.Audio==='function';
  const asset=src=>hasDouyinAudio?src:`${src}?v=5`;
  let enabled=true,unlocked=false,currentMusic=0,music=null,sfxCursor=0;
  const sfxPool=[];
  const variants=new Map();

  try{enabled=localStorage.getItem('tiejie-audio-enabled')!=='0'}catch{}

  function makeContext(loop=false){
    if(hasDouyinAudio){
      const context=ttApi.createInnerAudioContext();
      context.loop=loop;
      context.obeyMuteSwitch=true;
      return context
    }
    if(hasWebAudio){
      const context=new root.Audio();
      context.loop=loop;
      context.preload='auto';
      return context
    }
    return null
  }

  function stop(context){
    if(!context)return;
    try{context.stop?.()}catch{}
    try{context.pause?.();context.currentTime=0}catch{}
  }

  function play(context){
    if(!context||!enabled||!unlocked)return;
    try{const result=context.play?.();result?.catch?.(()=>{})}catch{}
  }

  function ensureMusic(){
    if(musicDisabled)return null;
    if(!music){music=makeContext(true);if(music)music.volume=.34}
    return music
  }

  function playMusic(index=0){
    currentMusic=Math.max(0,Math.min(musicFiles.length-1,Number(index)||0));
    const context=ensureMusic();
    if(!context)return;
    const src=asset(musicFiles[currentMusic]);
    if(context.src!==src){stop(context);context.src=src;context.loop=true;context.volume=.34}
    play(context)
  }

  function acquireSfx(){
    if(sfxPool.length<10){
      const context=makeContext(false);
      if(context)sfxPool.push(context);
      return context
    }
    const context=sfxPool[sfxCursor++%sfxPool.length];
    stop(context);
    return context
  }

  function playSfx(src,volume=0.72){
    if(!enabled||!unlocked)return;
    const context=acquireSfx();
    if(!context)return;
    try{context.src=asset(src);context.loop=false;context.volume=Math.max(.05,Math.min(1,volume));play(context)}catch{}
  }

  function nextVariant(key){const next=(variants.get(key)||0)%2+1;variants.set(key,next);return next}
  function hitEnemy(type='skinny',damage=12,elite=false){
    const safeType=enemyTypes.has(type)?type:'skinny',variant=nextVariant(safeType);
    playSfx(`assets/audio/sfx/hit-${safeType}-${variant}.wav`,Math.min(.96,.48+Math.max(0,damage)*.012+(elite?.08:0)))
  }
  function hitPlayer(damage=12,sourceType=''){
    const blade=sourceType==='axe'||sourceType==='assassin',key=blade?`player-${sourceType}`:'player',variant=nextVariant(key);
    const src=blade?`assets/audio/sfx/hit-player-${sourceType}-${variant}.wav`:`assets/audio/sfx/hit-player-${variant}.wav`;
    playSfx(src,Math.min(.96,.5+Math.max(0,damage)*.013))
  }

  function unlock(){unlocked=true}
  function setEnabled(value){
    enabled=!!value;
    try{localStorage.setItem('tiejie-audio-enabled',enabled?'1':'0')}catch{}
    if(enabled){if(unlocked)playMusic(currentMusic)}else{stop(music);for(const context of sfxPool)stop(context)}
    return enabled
  }
  function pause(){try{music?.pause?.()}catch{}}
  function resume(){if(enabled&&unlocked)playMusic(currentMusic)}
  function isEnabled(){return enabled}

  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
  root.TieJieAudio={unlock,playMusic,hitEnemy,hitPlayer,setEnabled,isEnabled,pause,resume};
})();
