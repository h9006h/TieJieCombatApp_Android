(() => {
  'use strict';
  const root=typeof globalThis!=='undefined'?globalThis:window;
  const ttApi=root.tt;
  const musicFiles=[
    'assets/audio/music/01-iron-alley.wav'
  ];
  const musicBpms=[148];
  const enemyTypes=new Set(['skinny','heavy','spinner','grappler','axe','assassin','suit','breaker','whip','barbarian']);
  const hasDouyinAudio=!!ttApi?.createInnerAudioContext;
  const musicDisabled=hasDouyinAudio;
  const hasHtmlAudio=typeof root.Audio==='function';
  const AudioContextClass=root.AudioContext||root.webkitAudioContext;
  const asset=src=>hasDouyinAudio?src:`${src}?v=7`;
  let enabled=true,unlocked=false,currentMusic=0,music=null,sfxCursor=0;
  let synthContext=null,synthBus=null,beatTimer=0,nextBeatAt=0,beatIndex=0,combatHeat=0,lastHeatAt=0;
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
    if(hasHtmlAudio){
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
    if(!music){music=makeContext(true);if(music)music.volume=.44}
    return music
  }

  function ensureSynth(){
    if(!AudioContextClass)return null;
    if(!synthContext){
      synthContext=new AudioContextClass();
      synthBus=synthContext.createGain();
      const compressor=synthContext.createDynamicsCompressor();
      compressor.threshold.value=-14;
      compressor.knee.value=16;
      compressor.ratio.value=5;
      compressor.attack.value=.003;
      compressor.release.value=.14;
      synthBus.gain.value=.82;
      synthBus.connect(compressor).connect(synthContext.destination)
    }
    return synthContext
  }

  function makeNoise(seconds=.16){
    const context=ensureSynth();
    if(!context)return null;
    const buffer=context.createBuffer(1,Math.max(1,Math.floor(context.sampleRate*seconds)),context.sampleRate),data=buffer.getChannelData(0);
    let previous=0;
    for(let i=0;i<data.length;i++){const white=Math.random()*2-1;previous=previous*.58+white*.42;data[i]=previous}
    const source=context.createBufferSource();
    source.buffer=buffer;
    return source
  }

  function envelope(node,when,peak,attack,release){
    node.gain.cancelScheduledValues(when);
    node.gain.setValueAtTime(.0001,when);
    node.gain.exponentialRampToValueAtTime(Math.max(.0001,peak),when+attack);
    node.gain.exponentialRampToValueAtTime(.0001,when+attack+release)
  }

  function playImpactLayer(damage=12,kind='body',elite=false){
    const context=ensureSynth();
    if(!context||context.state==='suspended'||!enabled||!unlocked)return;
    const when=context.currentTime+.003,strength=Math.min(1.35,.48+Math.max(0,damage)/55+(elite?.12:0));
    const thud=context.createOscillator(),thudGain=context.createGain();
    thud.type='sine';
    thud.frequency.setValueAtTime(kind==='blade'?128:86+Math.random()*9,when);
    thud.frequency.exponentialRampToValueAtTime(kind==='blade'?56:42,when+.12);
    envelope(thudGain,when,(kind==='blade'?.17:.24)*strength,.003,kind==='blade'?.14:.17);
    thud.connect(thudGain).connect(synthBus);
    thud.start(when);thud.stop(when+.17);

    const crack=makeNoise(kind==='blade'?.19:.13);
    if(crack){
      const filter=context.createBiquadFilter(),crackGain=context.createGain();
      filter.type=kind==='blade'?'highpass':'lowpass';
      filter.frequency.value=kind==='blade'?1900:500+Math.random()*150;
      filter.Q.value=kind==='blade'?.55:.38;
      envelope(crackGain,when,(kind==='blade'?.12:.052)*strength,.001,kind==='blade'?.16:.12);
      crack.connect(filter).connect(crackGain).connect(synthBus);
      crack.start(when);crack.stop(when+(kind==='blade'?.2:.15))
    }

    if(damage>=24||elite){
      const body=context.createOscillator(),bodyGain=context.createGain();
      body.type='triangle';body.frequency.setValueAtTime(64,when);body.frequency.exponentialRampToValueAtTime(34,when+.2);
      envelope(bodyGain,when,.12*strength,.008,.22);
      body.connect(bodyGain).connect(synthBus);body.start(when);body.stop(when+.25)
    }
    combatHeat=Math.min(1,combatHeat+.16+Math.min(.24,damage/180));
    lastHeatAt=performance.now()
  }

  function playWarDrum(when,accent=false){
    const context=ensureSynth();
    if(!context||context.state==='suspended')return;
    const heatAge=performance.now()-lastHeatAt;
    if(heatAge>160)combatHeat=Math.max(.12,combatHeat-(heatAge/1000)*.025);
    const strength=(accent?.15:.085)*(1+combatHeat*.9),drum=context.createOscillator(),gain=context.createGain();
    drum.type='sine';drum.frequency.setValueAtTime(accent?92:76,when);drum.frequency.exponentialRampToValueAtTime(accent?38:34,when+.2);
    envelope(gain,when,strength,.004,accent?.3:.2);
    drum.connect(gain).connect(synthBus);drum.start(when);drum.stop(when+(accent?.34:.24));
    if(accent){
      const noise=makeNoise(.08);
      if(noise){const filter=context.createBiquadFilter(),noiseGain=context.createGain();filter.type='bandpass';filter.frequency.value=420;filter.Q.value=.8;envelope(noiseGain,when,.035*(1+combatHeat),.002,.075);noise.connect(filter).connect(noiseGain).connect(synthBus);noise.start(when);noise.stop(when+.09)}
    }
  }

  function startBattlePulse(){
    stopBattlePulse();
    const context=ensureSynth();
    // Track 1 already contains a mastered 148 BPM battle-drum arrangement.
    if(!context||musicDisabled||!enabled||!unlocked||currentMusic===0)return;
    nextBeatAt=context.currentTime+.08;beatIndex=0;
    beatTimer=setInterval(()=>{
      if(!enabled||!unlocked||music?.paused)return;
      const secondsPerBeat=60/(musicBpms[currentMusic]||108);
      while(nextBeatAt<context.currentTime+.14){
        const accent=beatIndex%4===0;
        if(accent||combatHeat>.34||beatIndex%2===0)playWarDrum(nextBeatAt,accent);
        nextBeatAt+=secondsPerBeat;beatIndex++
      }
    },50)
  }

  function stopBattlePulse(){if(beatTimer){clearInterval(beatTimer);beatTimer=0}}

  function playMusic(index=0){
    currentMusic=Math.max(0,Math.min(musicFiles.length-1,Number(index)||0));
    const context=ensureMusic();
    if(!context)return;
    const src=asset(musicFiles[currentMusic]);
    if(context.src!==src){stop(context);context.src=src;context.loop=true;context.volume=.44}
    play(context);
    startBattlePulse()
  }

  function acquireSfx(){
    if(sfxPool.length<16){
      const context=makeContext(false);
      if(context)sfxPool.push(context);
      return context
    }
    const context=sfxPool[sfxCursor++%sfxPool.length];
    stop(context);
    return context
  }

  function playSfx(src,volume=0.72,rate=1){
    if(!enabled||!unlocked)return;
    const context=acquireSfx();
    if(!context)return;
    try{context.src=asset(src);context.loop=false;context.volume=Math.max(.05,Math.min(1,volume));if(!hasDouyinAudio)context.playbackRate=Math.max(.88,Math.min(1.12,rate));play(context)}catch{}
  }

  function nextVariant(key){const next=(variants.get(key)||0)%2+1;variants.set(key,next);return next}
  function hitEnemy(type='skinny',damage=12,elite=false){
    const safeType=enemyTypes.has(type)?type:'skinny',variant=nextVariant(safeType);
    playSfx(`assets/audio/sfx/hit-${safeType}-${variant}.wav`,Math.min(.82,.36+Math.max(0,damage)*.009+(elite?.06:0)),.96+Math.random()*.075);
    playImpactLayer(damage,'body',elite)
  }
  function hitPlayer(damage=12,sourceType=''){
    const blade=sourceType==='axe'||sourceType==='assassin',key=blade?`player-${sourceType}`:'player',variant=nextVariant(key);
    const src=blade?`assets/audio/sfx/hit-player-${sourceType}-${variant}.wav`:`assets/audio/sfx/hit-player-${variant}.wav`;
    const volume=blade?Math.min(.94,.48+Math.max(0,damage)*.012):Math.min(.84,.38+Math.max(0,damage)*.009);
    playSfx(src,volume,.95+Math.random()*.07);
    playImpactLayer(damage,blade?'blade':'body',false)
  }

  function unlock(){unlocked=true;try{ensureSynth()?.resume?.()}catch{}}
  function setEnabled(value){
    enabled=!!value;
    try{localStorage.setItem('tiejie-audio-enabled',enabled?'1':'0')}catch{}
    if(enabled){if(unlocked)playMusic(currentMusic)}else{stopBattlePulse();stop(music);for(const context of sfxPool)stop(context)}
    return enabled
  }
  function pause(){stopBattlePulse();try{music?.pause?.()}catch{}}
  function resume(){if(enabled&&unlocked)playMusic(currentMusic)}
  function isEnabled(){return enabled}

  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
  root.TieJieAudio={unlock,playMusic,hitEnemy,hitPlayer,setEnabled,isEnabled,pause,resume};
})();
