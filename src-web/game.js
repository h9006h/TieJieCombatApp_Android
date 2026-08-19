(async () => {
  'use strict';
  const authorization=await window.TieJieAuthorization.ready;
  await window.TieJieViewportReady;
  const W=window.TieJieViewport?.width||1280,H=window.TieJieViewport?.height||720,WORLD_W=8600,SURFACE_WORLD_W=6200,WORLD_BOTTOM=1320,GROUND_Y=570,UNDER_Y=1460,GROUND_MIN_Y=490,GROUND_MAX_Y=760,BUNKER_ROOM_MODULE_W=1280,BUNKER_DEPTH=200,BUNKER_FLOOR_SKEW=1.12, canvas=document.querySelector('#game'), g=canvas.getContext('2d');
  const {
    heroKickSheet,heroKick1Sheet,heroKick2Sheet,heroKick3Sheet,heroJumpKickSheet,heroJumpKickChainSheet,
    heroCombatSheet,heroWalkSheet,heroPunchComboSheet,heroBlueFistFlameSheet,heroHurtSheet,enemyKnockdownSheet,
    heavyEnemySheet,heavyEnemyDeathSheet,skinnyEnemySheet,heavyEnemyWalkSheet,skinnyEnemyWalkSheet,
    skinnySlideSheet,heroGrabSheet,heroGrabKneeSheet,heroOverChestThrowSheet,heroBackThrowFrames,heroJumpTransitionSheet,heroClimbOutSheet,heroRisingPunchSheet,heroRisingFlameSheet,
    spinnerSpinSheet,suitDaggerSheet,suitBackflipSheet,grapplerWrestlingSheet,heavyCounterGrabSheet,grapplerCounterGrabSheet,barbarianReviveSheet,barbarianSprintSheet,barbarianQiAuraSheet,barbarianSwingFxSheet,
    materialAtlas,greatWallBrickTile,greatWallGroundTile,greatWallPitSprite,greatWallPitEdgeSprite,greatWallCollapseSprite,greatWallMountainLayer,greatWallPitFloorTile,
    oldAlleyRoadCollapseSprite,oldAlleyHouseWallWindows,oldAlleyHouseWallBalcony,oldAlleyBackground,oldAlleyStreetGround,oldAlleyRooftopGround,desertYardangBackground,desertYardangTerrainAtlas,desertYardangArchitectureAtlas,
    highriseBackground,highriseRooftopGround,highriseStructure,skyShelterBackground,skyShelterRooftopGround,skyShelterStructureAtlas,skyShelterBoundariesAtlas,skyShelterOuterPitWallsAtlas,
    waterShelterOceanBackground,waterShelterSurfaceAtlas,waterShelterStructureAtlas,waterShelterFloodedRoomAtlas,
    forestBackdropTile,forestTreeRootSprite,forestTerrainAtlas,forestArchitectureAtlas,environmentBoundaryAtlas,bunkerStructureAtlas,bunkerCavePlainTexture,bunkerCaveClimbTexture,bunkerRoomAtlas,bunkerSideDoorAtlas,bunkerCivilDefenseDoorAtlas,bunkerLoungeGymAtlas,bunkerModernRoomStrips,generatedEnemySheets,fighterShadows
  }=window.TieJieAssets;
  const nativeDouyinRuntime=!!window.TieJieAssets?.runtimeUsesLocalPaths;
  const fighterShadowMap=new Map([
    [heroKickSheet,fighterShadows.heroKickSheet],[heroKick1Sheet,fighterShadows.heroKick1Sheet],
    [heroKick2Sheet,fighterShadows.heroKick2Sheet],[heroKick3Sheet,fighterShadows.heroKick3Sheet],
    [heroJumpKickSheet,fighterShadows.heroJumpKickSheet],[heroJumpKickChainSheet,fighterShadows.heroJumpKickChainSheet],[heroCombatSheet,fighterShadows.heroCombatSheet],
    [heroWalkSheet,fighterShadows.heroWalkSheet],
    [heroPunchComboSheet,fighterShadows.heroPunchComboSheet],[heroHurtSheet,fighterShadows.heroHurtSheet],
    [enemyKnockdownSheet,fighterShadows.enemyKnockdownSheet],[heavyEnemySheet,fighterShadows.heavyEnemySheet],
    [heavyEnemyDeathSheet,fighterShadows.heavyEnemyDeathSheet],
    [skinnyEnemySheet,fighterShadows.skinnyEnemySheet],[heavyEnemyWalkSheet,fighterShadows.heavyEnemyWalkSheet],
    [skinnyEnemyWalkSheet,fighterShadows.skinnyEnemyWalkSheet],[skinnySlideSheet,fighterShadows.skinnySlideSheet],
    [heroGrabSheet,fighterShadows.heroGrabSheet],[heroGrabKneeSheet,fighterShadows.heroGrabKneeSheet],
    [heroOverChestThrowSheet,fighterShadows.heroOverChestThrowSheet],
    [heroJumpTransitionSheet,fighterShadows.heroJumpTransitionSheet],
    [heroRisingPunchSheet,fighterShadows.heroRisingPunchSheet]
  ]);
  heroBackThrowFrames.forEach((sheet,index)=>fighterShadowMap.set(sheet,fighterShadows.heroBackThrowFrames[index]));
  const palette={ink:'#101416',sky:'#18282c',wall:'#273033',wall2:'#31393a',steel:'#596063',rust:'#8a492d',orange:'#d27a3d',mud:'#4b3c31',mud2:'#65503d',teal:'#31565b'};
  const sceneModules=[
    {type:'skyline',x:0,y:80,w:WORLD_W,h:260},
    {type:'wall',x:0,y:210,w:WORLD_W,h:315},
    {type:'fence',x:35,y:300,w:300,h:205},
    {type:'market',x:1220,y:310,w:360,h:190},
    {type:'pipes',x:1980,y:215,w:130,h:305},
    {type:'elevator',x:1580,y:312,w:220,h:220},
    {type:'stairs',x:880,y:300,w:420,h:320,topW:260,bottomW:420},
    {type:'platform',x:650,y:185,w:1290,h:130},
    {type:'stairs',x:1510,y:125,w:260,h:175,topW:190,bottomW:260},
    {type:'platform',x:1320,y:55,w:740,h:95},
    {type:'stairs',x:1720,y:-95,w:230,h:220,topW:165,bottomW:230},
    {type:'platform',x:1500,y:-185,w:600,h:100},
    {type:'mud',x:0,y:GROUND_MIN_Y,w:WORLD_W,h:GROUND_MAX_Y-GROUND_MIN_Y}
  ];
  const keys={left:false,right:false,up:false,down:false};
  const GATE_SIDE_MARGIN=70,GATE_CAMERA_TRIGGER=W*.48,GRAB_MAX_DURATION=5;
  let running=false,last=0,shake=0,flash=0,slow=0,wave=1,message='',messageT=0,screenTint=0,hitFx=[],blastFx=[],resourceFx=[],eliteArmorFx=[],starAbsorbFx=[],cameraX=0,cameraY=0,mapIndex=0,gateIndex=0,mapCycle=0,gatePhase='combat',stageLockX=70,stageRightX=1050,cameraLockX=0,powerSwitch=null,gauntletMode=false,gauntletIndex=0,gauntletEliteMode=false,freeTourMode=false,testRunMode=false,rankedRunEligible=false,failureHandled=false,failurePopupT=0,partyDefeatPending=false,lostResources=null,pendingReward=null,rewardResumeRunning=false,battleMenuResumeRunning=false,pendingGrowthAdvance=false,stageRewardTotals={gold:0,chicken:0,fruit:0},stageChickenBudget=1,stageChickenDropped=0,stageSettlementOpen=false,stageRewardDoubled=false,jumpSourcePlatform=null,jumpPlatformCleared=false;
  document.body.classList.add('menu-mode');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const PLATFORMS=[
    {level:1,minX:650,maxX:1940,minY:185,maxY:315,w:1290,fallDamage:0,name:'二层平台'},
    {level:2,minX:1320,maxX:2060,minY:55,maxY:145,w:740,fallDamage:42,name:'三层高台'},
    {level:3,minX:1500,maxX:2100,minY:-185,maxY:-85,w:600,fallDamage:70,name:'四层测试高台'}
  ];
  const STAIRS=[
    {x:880,bottomW:420,topW:260,bottomY:620,topY:300,fromLevel:0,toLevel:1},
    {x:1510,bottomW:260,topW:190,bottomY:300,topY:125,fromLevel:1,toLevel:2},
    {x:1720,bottomW:230,topW:165,bottomY:125,topY:-95,fromLevel:2,toLevel:3}
  ];
  const DESERT_PLATFORMS=[
    {level:1,minX:980,maxX:2360,minY:295,maxY:405,w:1380,fallDamage:0,name:'敦煌石壁上层'},
    {level:2,minX:3560,maxX:5240,minY:170,maxY:275,w:1680,fallDamage:34,name:'风蚀高岩'}
  ];
  const DESERT_STAIRS=[
    {x:760,bottomW:520,topW:290,bottomY:620,topY:385,fromLevel:0,toLevel:1},
    {x:3230,bottomW:470,topW:260,bottomY:610,topY:260,fromLevel:0,toLevel:2}
  ];
  const DESERT_PIT_ZONES=[
    {min:300,max:750},{min:2200,max:2900},{min:5400,max:5900}
  ];
  let desertPits=[];
  const GRASS_PLATFORMS=[
    {level:1,baseMinX:620,baseMaxX:6040,minX:620,maxX:6040,baseMinY:205,baseMaxY:265,minY:205,maxY:265,w:5420,fallDamage:0,name:'长城二层城墙'},
    {level:2,baseMinX:2380,baseMaxX:5980,minX:2380,maxX:5980,baseMinY:15,baseMaxY:135,minY:15,maxY:135,w:3600,fallDamage:26,name:'长城三层敌楼'},
    {level:3,baseMinX:4580,baseMaxX:5960,minX:4580,maxX:5960,baseMinY:-125,baseMaxY:0,minY:-125,maxY:0,w:1380,fallDamage:48,name:'四层烽火台'}
  ];
  const GRASS_STAIRS=[
    {x:790,baseBottomW:310,baseTopW:145,bottomW:310,topW:145,bottomY:620,topY:330,fromLevel:0,toLevel:1},
    {x:2240,baseBottomW:260,baseTopW:125,bottomW:260,topW:125,bottomY:330,topY:270,fromLevel:1,toLevel:2},
    {x:4300,baseBottomW:250,baseTopW:120,bottomW:250,topW:120,bottomY:270,topY:155,fromLevel:2,toLevel:3}
  ];
  const GRASS_PITS=[{x:2360,w:260,y:626,damage:12,name:'城墙塌陷口'},{x:5160,w:300,y:626,damage:16,name:'山石暗坑'}];
  const HIGHRISE_PLATFORMS=[
    {level:1,minX:720,maxX:2380,minY:280,maxY:385,w:1660,fallDamage:0,name:'脚手架一层'},
    {level:2,minX:2780,maxX:4380,minY:120,maxY:230,w:1600,fallDamage:42,name:'吊臂钢梁'},
    {level:3,minX:4560,maxX:6040,minY:-60,maxY:48,w:1480,fallDamage:70,name:'天台边缘'}
  ];
  const HIGHRISE_STAIRS=[
    {x:620,bottomW:390,topW:210,bottomY:620,topY:370,fromLevel:0,toLevel:1},
    {x:2500,bottomW:360,topW:210,bottomY:370,topY:215,fromLevel:1,toLevel:2},
    {x:4300,bottomW:340,topW:190,bottomY:215,topY:35,fromLevel:2,toLevel:3}
  ];
  const HIGHRISE_PITS=[{x:2040,w:300,y:760,damage:26,name:'楼板缺口'},{x:4860,w:260,y:760,damage:32,name:'电梯井'}];
  const INDOOR_PLATFORMS=[
    {level:1,minX:860,maxX:2220,minY:315,maxY:410,w:1360,fallDamage:0,name:'拳馆擂台'},
    {level:2,minX:3380,maxX:5200,minY:260,maxY:350,w:1820,fallDamage:10,name:'看台二层'}
  ];
  const INDOOR_STAIRS=[
    {x:650,bottomW:420,topW:260,bottomY:620,topY:398,fromLevel:0,toLevel:1},
    {x:3140,bottomW:410,topW:260,bottomY:610,topY:340,fromLevel:0,toLevel:2}
  ];
  const INDOOR_PITS=[{x:2500,w:310,y:760,damage:10,name:'破木地板'},{x:5350,w:240,y:760,damage:14,name:'器械坑'}];
  const HAZARDS_BY_THEME={
    '沙漠':[
      {type:'spike',x:1720,w:150,y:570,level:0,damage:12},
      {type:'fireJet',x:4680,w:170,y:570,level:0,damage:18}
    ],
    '草地':[
      {type:'spike',x:1540,w:210,y:570,level:0,damage:10},
      {type:'spike',x:3840,w:240,y:570,level:0,damage:14}
    ],
    '高楼':[
      {type:'electric',x:1840,w:230,y:570,level:0,damage:18},
      {type:'electric',x:3180,w:230,y:180,level:2,damage:22},
      {type:'steam',x:5200,w:190,y:-10,level:3,damage:24}
    ],
    '室内':[
      {type:'glass',x:1780,w:210,y:570,level:0,damage:11},
      {type:'spark',x:4300,w:305,y:300,level:2,damage:15}
    ],
  };
  const TERRAIN_BY_THEME={
    '街区':{platforms:PLATFORMS,stairs:STAIRS,pits:[]},
    '水中避难所':{platforms:PLATFORMS,stairs:STAIRS,pits:[]},
    '沙漠':{platforms:PLATFORMS,stairs:STAIRS,pits:[]},
    '草地':{platforms:GRASS_PLATFORMS,stairs:GRASS_STAIRS,pits:GRASS_PITS},
    '高楼':{platforms:PLATFORMS,stairs:STAIRS,pits:[]},
    '室内':{platforms:INDOOR_PLATFORMS,stairs:INDOOR_STAIRS,pits:INDOOR_PITS},
    '森林':{platforms:[],stairs:[],pits:[]}
  };
  const STAIR_EDGE_MARGIN=200;
  const GRASS_STAIR_MIN_TOP_W=105,GRASS_STAIR_MIN_BOTTOM_W=220;
  const GRASS_MIN_WALL_HEIGHT={1:300,2:150,3:140};
  const THEME_MIN_WALL_HEIGHT={
    '街区':{1:190,2:105,3:120},
    '水中避难所':{1:190,2:105,3:120},
    '沙漠':{1:150,2:150},
    '草地':GRASS_MIN_WALL_HEIGHT,
    '高楼':{1:190,2:105,3:120},
    '室内':{1:145,2:145}
  };
  const PIT_TOP=GROUND_Y+Math.round((GROUND_MAX_Y-GROUND_Y)*.5);
  const PIT_BOTTOM=GROUND_MAX_Y-26,PIT_EDGE_SAFE=460;
  let grassTerrainSeed=0,generatedTerrain=null,mapSeed=0,terrainGenerationSerial=0,lastTerrainSeed=0;
  const lastTerrainSignatureByTheme=new Map();
  function seedRand(seed){
    let a=(seed>>>0)||1;
    return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
  }
  function copyTerrainList(list){return(list||[]).map(o=>({...o}))}
  function randomTerrainSeed(theme,index){
    let h=2166136261^(index+1)*2654435761^(++terrainGenerationSerial*2246822519);
    for(let i=0;i<theme.length;i++)h=Math.imul(h^theme.charCodeAt(i),16777619);
    const entropy=(Date.now()^Math.floor(performance.now()*1000)^Math.floor(Math.random()*0xffffffff))>>>0;
    let seed=(h^entropy)>>>0;
    if(seed===lastTerrainSeed)seed=(seed+0x9e3779b9)>>>0;
    lastTerrainSeed=seed;
    return seed
  }
  function normalizePit(pit,theme,rng){
    const sourceW=pit.w||pit.h||180,scale=.78+rng()*.5;
    const maxW=theme==='沙漠'?156:theme==='街区'?300:260;
    const w=Math.round(clamp(sourceW*scale,96,maxW));
    const minX=PIT_EDGE_SAFE,maxX=WORLD_W-PIT_EDGE_SAFE-w;
    return{...pit,x:Math.round(clamp(pit.x,minX,maxX)),w,y:PIT_BOTTOM,h:PIT_BOTTOM-PIT_TOP,topY:PIT_TOP,shape:'square',damage:0,visualScaleY:.78+rng()*.48,visualFlipX:rng()<.5}
  }
  function generateForestTrees(platforms=[],stairs=[],bridges=[]){
    const base=[[420,545,.72,1],[780,705,.82,-1],[1120,590,.76,1],[1450,670,.86,-1],[1740,720,.7,1],[1960,530,.68,-1]],trees=[];
    const blockedX=x=>platforms.some(p=>x>p.minX-125&&x<p.maxX+125)||stairs.some(s=>x>s.x-110&&x<s.x+s.bottomW+110)||bridges.some(b=>x>Math.min(b.x1,b.x2)-90&&x<Math.max(b.x1,b.x2)+90);
    for(let repeat=0;repeat<3;repeat++)for(const [localX,y,baseScale,flip] of base){const x=localX+repeat*2048;if(blockedX(x))continue;const scale=baseScale*1.4;trees.push({x,y,level:0,rx:28+scale*14,ry:17+scale*8,scale,flip,forestProp:true,name:`巨树${trees.length+1}`})}
    return trees
  }
  function stairWallBottomY(s,platforms){
    if((s.fromLevel||0)<=0)return GROUND_Y;
    const source=platforms.find(p=>p.level===s.fromLevel);
    return source?source.minY:GROUND_Y
  }
  function platformWallBottomY(p,platforms=currentPlatforms(),stairs=currentStairs()){
    if(p.supportLevel!=null){
      if(p.supportLevel<=0)return GROUND_Y;
      const support=platforms.find(q=>q.level===p.supportLevel);
      return support?support.minY:GROUND_Y
    }
    const access=stairs.find(s=>s.toLevel===p.level);
    if(access)return stairWallBottomY(access,platforms);
    const below=platforms.find(q=>q.level===p.level-1);
    return below?below.minY:GROUND_Y
  }
  function enforceGeneratedWallHeights(platforms,stairs,theme){
    const minimums=THEME_MIN_WALL_HEIGHT[theme]||{};
    const ordered=stairs.slice().sort((a,b)=>a.toLevel-b.toLevel);
    for(const s of ordered){
      const target=platforms.find(p=>p.level===s.toLevel);
      if(!target)continue;
      const wallBottom=stairWallBottomY(s,platforms);
      const minHeight=minimums[s.toLevel]||110;
      const maxFrontY=wallBottom-minHeight;
      if(target.maxY>maxFrontY){
        const dy=target.maxY-maxFrontY;
        target.minY-=dy;
        target.maxY-=dy
      }
    }
  }
  function enforceGeneratedPlatformSupport(platforms,stairs,rng,theme){
    const ordered=stairs.slice().sort((a,b)=>a.toLevel-b.toLevel);
    for(const s of ordered){
      if((s.fromLevel||0)<=0)continue;
      const lower=platforms.find(p=>p.level===s.fromLevel);
      const upper=platforms.find(p=>p.level===s.toLevel);
      if(!lower||!upper)continue;
      // The lower platform is a trapezoid: its visible back edge is narrower
      // than minX/maxX. Contain the upper front edge inside that real edge.
      const inset=Math.round(clamp(lower.w*.045,24,72));
      const supportLeft=lower.minX+76+inset,supportRight=lower.maxX-92-inset;
      const available=Math.max(280,supportRight-supportLeft);
      const supportsAnother=stairs.some(next=>(next.fromLevel||0)===upper.level);
      const safeStairWidth=theme==='草地'?840:560;
      const minWidth=Math.min(Math.max(safeStairWidth,supportsAnother?900:0),available);
      const width=Math.round(clamp(available*(.58+rng()*.22),minWidth,available));
      const minCenter=supportLeft+width*.5,maxCenter=supportRight-width*.5;
      const randomCenter=minCenter+rng()*Math.max(0,maxCenter-minCenter);
      const center=clamp(randomCenter,minCenter,maxCenter);
      upper.minX=Math.round(center-width*.5);
      upper.maxX=Math.round(center+width*.5);
      upper.w=upper.maxX-upper.minX
    }
  }
  function tuneGeneratedStairs(platforms,stairs,theme,rng){
    for(const s of stairs){
      const target=platforms.find(p=>p.level===s.toLevel);
      if(!target)continue;
      const source=(s.fromLevel||0)>0?platforms.find(p=>p.level===s.fromLevel):null;
      s.topY=target.maxY;
      s.bottomY=stairWallBottomY(s,platforms);
      const h=Math.max(1,s.bottomY-s.topY);
      const tall=clamp(h/280,0,1.5);
      const topBase=s.baseTopW??s.topW??220,bottomBase=s.baseBottomW??s.bottomW??360;
      s.topW=Math.max(theme==='草地'?GRASS_STAIR_MIN_TOP_W:135,Math.round(topBase*(.82+rng()*.34)-h*.06));
      s.bottomW=Math.max(theme==='草地'?GRASS_STAIR_MIN_BOTTOM_W:230,Math.round(bottomBase*(.8+rng()*.38)-h*.035));
      if(theme!=='草地'){s.topW=Math.round(s.topW*(1-.08*tall));s.bottomW=Math.round(s.bottomW*(1-.05*tall))}
      const edgeMargin=theme==='草地'?Math.max(STAIR_EDGE_MARGIN,340):STAIR_EDGE_MARGIN;
      s.topW=Math.min(s.topW,Math.max(theme==='草地'?GRASS_STAIR_MIN_TOP_W:135,Math.floor(target.w-edgeMargin*2)));
      let minCenter=target.minX+edgeMargin+s.topW*.5;
      let maxCenter=target.maxX-edgeMargin-s.topW*.5;
      if(source){
        const sourceBackLeft=source.minX+76,sourceBackRight=source.maxX-92;
        const supportMargin=24,supportedWidth=Math.max(1,sourceBackRight-sourceBackLeft-supportMargin*2);
        s.bottomW=Math.min(s.bottomW,Math.floor(supportedWidth));
        minCenter=Math.max(minCenter,sourceBackLeft+supportMargin+s.bottomW*.5);
        maxCenter=Math.min(maxCenter,sourceBackRight-supportMargin-s.bottomW*.5)
      }
      const targetCenter=minCenter+rng()*Math.max(0,maxCenter-minCenter);
      if(maxCenter>=minCenter)s.x=targetCenter-s.bottomW*.5;
    }
  }
  function generateThemeTerrain(theme,seed=randomTerrainSeed(theme,mapIndex)){
    const rng=seedRand(seed),forestTheme=theme==='森林',waterShelterTheme=theme==='水中避难所',desertSkinTheme=theme==='沙漠',logicTheme=forestTheme||waterShelterTheme||desertSkinTheme?'街区':theme,base=TERRAIN_BY_THEME[logicTheme]||{platforms:PLATFORMS,stairs:STAIRS,pits:[]};
    const platforms=copyTerrainList(base.platforms),stairs=copyTerrainList(base.stairs);
    for(const p of platforms){
      const baseMinX=p.baseMinX??p.minX,baseMaxX=p.baseMaxX??p.maxX,baseMinY=p.baseMinY??p.minY,baseMaxY=p.baseMaxY??p.maxY;
      const baseWidth=baseMaxX-baseMinX,baseDepth=baseMaxY-baseMinY;
      const widthJ=Math.round(baseWidth*(rng()-.5)*(logicTheme==='草地'?.24:.38));
      const shiftX=Math.round((rng()-.5)*(logicTheme==='草地'?520:760));
      const shiftY=Math.round((rng()-.5)*(logicTheme==='草地'?82:112));
      const depthJ=Math.round(baseDepth*(rng()-.5)*.36);
      const supportsUpper=stairs.some(s=>(s.fromLevel||0)===p.level);
      const minGeneratedWidth=Math.max(supportsUpper?900:560,baseWidth*.72);
      p.minX=clamp(baseMinX+shiftX,120,WORLD_W-760);
      p.maxX=clamp(baseMaxX+shiftX+widthJ,p.minX+minGeneratedWidth,WORLD_W-130);
      p.minY=Math.round(baseMinY+shiftY);
      p.maxY=Math.round(p.minY+clamp(baseDepth+depthJ,72,180));
      p.w=p.maxX-p.minX;
    }
    // 高度使用无硬上限的指数分布：常见值仍易攀爬，但关卡生成不再封顶。
    for(const p of platforms.sort((a,b)=>a.level-b.level)){
      const stair=stairs.find(s=>s.toLevel===p.level),support=stair&&stair.fromLevel>0?platforms.find(q=>q.level===stair.fromLevel):null;
      const baseY=support?support.minY:GROUND_Y,depth=p.maxY-p.minY,gap=Math.round(174-Math.log(Math.max(1e-6,1-rng()))*190);
      p.maxY=baseY-gap;p.minY=p.maxY-depth;
    }
    enforceGeneratedPlatformSupport(platforms,stairs,rng,logicTheme);
    enforceGeneratedWallHeights(platforms,stairs,logicTheme);
    tuneGeneratedStairs(platforms,stairs,logicTheme,rng);
    const bridges=generateExtraPlatforms(waterShelterTheme?theme:logicTheme,platforms,stairs,rng);
    const fallbackStairs=ensurePlatformAccessStairs(platforms,stairs);
    if(fallbackStairs.length)tuneGeneratedStairs(platforms,fallbackStairs,logicTheme,rng);
    const pits=generateThemePits(logicTheme,platforms,stairs,rng);
    if(waterShelterTheme)for(const [index,pit] of pits.entries())pit.name=`水淹区入口${index+1}`;
    const bunkers=generateBunkers(pits,rng);
    const hazards=generateThemeHazards(logicTheme,platforms,pits,rng);
    if(forestTheme){
      for(const p of platforms){p.hunterHut=true;p.name=p.level===1?'林间木屋二层':p.level===2?'林间木屋三层':p.level===3?'林间木屋高台':`林间木屋侧台`}
      for(const s of stairs)s.wooden=true;
      for(const [i,p] of pits.entries())p.name=i?'隐蔽落叶陷阱':'落叶陷阱';
      return{theme,seed,platforms,stairs,pits,bunkers,hazards,slowZones:[{type:'swamp',x:2500,y:GROUND_MIN_Y-28,w:820,h:GROUND_MAX_Y-GROUND_MIN_Y+56,mul:.48,irregular:true}],collapseClimbs:[],bridges,blockers:generateForestTrees(platforms,stairs,bridges)}
    }
    return{theme,seed,platforms,stairs,pits,bunkers,hazards,collapseClimbs:[],bridges}
  }
  function terrainSignature(terrain){
    return terrain.platforms.map(p=>`${p.level}:${p.minX},${p.maxX},${p.minY},${p.maxY}`).join('|')+
      ';'+terrain.stairs.map(s=>`${s.fromLevel}>${s.toLevel}:${Math.round(s.x)},${s.topW},${s.bottomW}`).join('|')+
      ';'+terrain.pits.map(p=>`${p.x},${p.w}`).join('|')+
      ';'+(terrain.bridges||[]).map(b=>`${b.fromLevel}>${b.toLevel}:${b.x1},${b.x2}`).join('|')+
      ';'+(terrain.blockers||[]).map(o=>`${o.x},${o.y},${o.scale.toFixed(2)}`).join('|')
  }
  function generateFreshTerrain(theme,index){
    let terrain=null,signature='',previous=lastTerrainSignatureByTheme.get(theme);
    for(let attempt=0;attempt<4;attempt++){
      mapSeed=randomTerrainSeed(theme,index);
      terrain=generateThemeTerrain(theme,mapSeed);
      signature=terrainSignature(terrain);
      if(signature!==previous)break
    }
    lastTerrainSignatureByTheme.set(theme,signature);
    return terrain
  }
  function generateThemePits(theme,platforms,stairs,rng){
    const count=2;
    const anchors=[760,5220];
    return anchors.map((anchor,index)=>{
      const w=Math.round(118+rng()*82),min=PIT_EDGE_SAFE,max=SURFACE_WORLD_W-PIT_EDGE_SAFE-w;
      let x=clamp(anchor+(rng()-.5)*210,min,max);
      for(let tries=0;tries<20;tries++){
        const blocked=stairs.some(s=>{const b=stairBoundsAtY(s,s.bottomY,150);return x<b.right&&x+w>b.left});
        if(!blocked)break;
        x=clamp(anchor+(rng()-.5)*420,min,max)
      }
      return normalizePit({x,w,name:theme==='水中避难所'?`水淹区入口${index+1}`:`地下避难所入口${index+1}`},theme,rng)
    }).sort((a,b)=>a.x-b.x)
  }
  const bunkerResidentTypes=['skinny','heavy','spinner','grappler','axe','assassin','suit','breaker','whip','barbarian'];
  function generateBunkers(pits,rng){
    const sorted=pits.slice().sort((a,b)=>a.x-b.x),bunkers=[];
    for(let pairIndex=0;pairIndex+1<sorted.length;pairIndex+=2){
      const leftPit=sorted[pairIndex],rightPit=sorted[pairIndex+1],left=120,requestedRoomCount=3+Math.floor(rng()*3),roomLeft=left+190;
      const roomCount=requestedRoomCount;
      const widths=Array.from({length:roomCount},()=>BUNKER_ROOM_MODULE_W);
      const rooms=[],doors=[];
      let cursor=roomLeft;
      for(let i=0;i<roomCount;i++){
        const next=cursor+widths[i];
        const residentCount=1+Math.floor(rng()*3),residents=[];
        for(let n=0;n<residentCount;n++)residents.push({id:`b${pairIndex/2}r${i}e${n}`,type:bunkerResidentTypes[Math.floor(rng()*bunkerResidentTypes.length)],x:cursor+(next-cursor)*(n+1)/(residentCount+1),y:UNDER_Y+(rng()-.5)*(BUNKER_DEPTH-90)});
        const stoneRoom=i===0||i===roomCount-1,material=stoneRoom?-1:Math.floor(rng()*3);
        rooms.push({index:i,left:cursor,right:next,opened:false,kind:stoneRoom?'stone':'inhabited',climbable:i===roomCount-1,material,tileOffset:0,residents});cursor=next
      }
      for(const room of rooms.slice(0,-1))doors.push({index:room.index+1,x:room.right,opened:false});
      const right=rooms[rooms.length-1].right+190;
      const bunker={id:`bunker-${pairIndex/2}`,left,right,y:UNDER_Y,leftPit,rightPit,rooms,doors,roomCount};
      leftPit.bunker=bunker;rightPit.bunker=bunker;bunkers.push(bunker)
    }
    return bunkers
  }
  function generateThemeHazards(theme,platforms,pits,rng){
    const base=HAZARDS_BY_THEME[theme]||[];
    const source=base.length?base:[{type:theme==='高楼'?'electric':theme==='室内'?'glass':theme==='沙漠'?'fireJet':'spike',x:2500,w:190,y:570,level:0,damage:theme==='室内'?10:14}];
    return source.map((h,i)=>{
      const level=h.level||0,p=level?platforms.find(q=>q.level===level):null;
      const min=p?p.minX+120:360,max=p?p.maxX-220:WORLD_W-520;
      let x=clamp(h.x+(rng()-.5)*520,min,max);
      for(let tries=0;tries<12&&pits.some(pit=>Math.abs((pit.x+pit.w*.5)-(x+h.w*.5))<pit.w+180);tries++)x=clamp(min+rng()*(max-min),min,max);
      return{...h,x:Math.round(x),w:Math.round(h.w*(.85+rng()*.34))}
    })
  }
  function generateExtraPlatforms(theme,platforms,stairs,rng){
    const bridges=[],original=platforms.slice();
    let nextLevel=Math.max(3,...platforms.map(p=>p.level))+1;
    const desired=3+Math.floor(rng()*4);
    const shuffled=original.slice().sort(()=>rng()-.5);
    const supportOf=p=>p.supportLevel??stairs.find(s=>s.toLevel===p.level)?.fromLevel??0;
    const addPlatform=(anchor,supportLevel,minX,width)=>{
      const depth=Math.round(clamp((anchor.maxY-anchor.minY)*(.82+rng()*.32),72,145));
      const maxY=Math.round(anchor.maxY+(rng()-.5)*66),minY=maxY-depth,maxX=minX+width;
      const extra={level:nextLevel++,minX:Math.round(minX),maxX:Math.round(maxX),minY,maxY,w:Math.round(width),fallDamage:anchor.fallDamage||0,name:`${anchor.name}侧台`,supportLevel,noEnemy:true,generatedSide:true};
      platforms.push(extra);
    };
    for(let n=0;n<desired;n++){
      let placed=false;
      for(let attempt=0;attempt<18&&!placed;attempt++){
        const anchor=shuffled[(n+attempt)%shuffled.length];
        const access=stairs.find(s=>s.toLevel===anchor.level);
        const supportLevel=access?.fromLevel??0;
        const support=supportLevel>0?platforms.find(p=>p.level===supportLevel):null;
        const dir=rng()<.5?-1:1,gap=120+Math.round(rng()*190);
        const width=520+Math.round(rng()*310);
        let minX;
        if(support){
          const supportLeft=support.minX+115,supportRight=support.maxX-135;
          if(supportRight-supportLeft<width)continue;
          minX=dir<0?anchor.minX-gap-width:anchor.maxX+gap;
          minX=clamp(minX,supportLeft,supportRight-width)
        }else{
          minX=dir<0?anchor.minX-gap-width:anchor.maxX+gap;
          minX=clamp(minX,150,WORLD_W-width-150)
        }
        const maxX=minX+width;
        const overlapsSibling=platforms.some(p=>{
          return supportOf(p)===supportLevel&&minX<p.maxX+100&&maxX>p.minX-100
        });
        if(overlapsSibling)continue;
        addPlatform(anchor,supportLevel,minX,width);
        placed=true
      }
      if(!placed){
        let best=null;
        const supportLevels=[0,...original.map(p=>p.level)];
        for(const supportLevel of supportLevels){
          const support=supportLevel>0?platforms.find(p=>p.level===supportLevel):null;
          const left=support?support.minX+115:150,right=support?support.maxX-135:WORLD_W-150;
          const siblings=platforms.filter(p=>supportOf(p)===supportLevel).sort((a,b)=>a.minX-b.minX);
          if(!siblings.length||right-left<420)continue;
          let cursor=left;
          for(const sibling of siblings){
            const gapRight=Math.min(right,sibling.minX-100);
            if(gapRight-cursor>=420&&(!best||gapRight-cursor>best.span))best={left:cursor,right:gapRight,span:gapRight-cursor,siblings,supportLevel};
            cursor=Math.max(cursor,sibling.maxX+100)
          }
          if(right-cursor>=420&&(!best||right-cursor>best.span))best={left:cursor,right,span:right-cursor,siblings,supportLevel}
        }
        if(best){
          const width=Math.round(clamp(best.span-60,340,780));
          const minX=Math.round(best.left+(best.span-width)*.5),center=minX+width*.5;
          const anchor=best.siblings.reduce((near,p)=>Math.abs((p.minX+p.maxX)*.5-center)<Math.abs((near.minX+near.maxX)*.5-center)?p:near);
          addPlatform(anchor,best.supportLevel,minX,width)
        }
      }
    }
    // 平台全部落位后再连桥。旧逻辑会把侧台连回最初选中的 anchor，
    // anchor 与侧台之间若已有平台，就会生成一座跨过中间平台的长桥。
    // 这里不区分主平台、侧平台或支撑归属：每个新平台只连接横向最近的直接邻居。
    const bridgeName=theme==='高楼'?'钢梁连接桥':theme==='草地'?'城墙石桥':theme==='沙漠'?'风蚀石梁':theme==='水中避难所'?'避难所栈桥':'平台连接桥';
    const linkedPairs=new Set();
    for(const extra of platforms.filter(p=>p.generatedSide)){
      const candidates=[];
      for(const other of platforms){
        if(other===extra)continue;
        if(other.maxX<extra.minX)candidates.push({left:other,right:extra,gap:extra.minX-other.maxX});
        else if(other.minX>extra.maxX)candidates.push({left:extra,right:other,gap:other.minX-extra.maxX})
      }
      const nearest=candidates.filter(c=>c.gap>=70&&c.gap<=520).sort((a,b)=>a.gap-b.gap)[0];
      if(!nearest)continue;
      const {left,right}=nearest,key=[left.level,right.level].sort((a,b)=>a-b).join(':');
      if(linkedPairs.has(key))continue;
      linkedPairs.add(key);
      const y1=Math.round(clamp(left.maxY-30,left.minY+22,left.maxY-16));
      const y2=Math.round(clamp(right.maxY-30,right.minY+22,right.maxY-16));
      bridges.push({fromLevel:left.level,toLevel:right.level,x1:Math.round(left.maxX-32),y1,x2:Math.round(right.minX+32),y2,width:58,name:bridgeName})
    }
    return bridges
  }
  function ensurePlatformAccessStairs(platforms,stairs){
    const added=[];
    for(const target of platforms){
      if(stairs.some(s=>s.toLevel===target.level))continue;
      const fromLevel=target.supportLevel??0;
      const stair={
        x:target.minX+Math.max(90,target.w*.18),
        topW:Math.round(clamp(target.w*.3,150,230)),
        bottomW:Math.round(clamp(target.w*.46,240,360)),
        fromLevel,
        toLevel:target.level,
        generatedAccess:true
      };
      stairs.push(stair);added.push(stair)
    }
    return added
  }
  function configureGrassTerrain(seed=0){
    grassTerrainSeed=seed;
    const offsets=[-18,-8,-24].map((base,i)=>base+Math.sin(seed*.73+i*1.91)*18);
    for(const p of GRASS_PLATFORMS){
      const off=offsets[p.level-1]||0;
      p.minX=p.baseMinX??p.minX;
      p.maxX=p.baseMaxX??p.maxX;
      p.minY=Math.round((p.baseMinY??p.minY)+off);
      p.maxY=Math.round((p.baseMaxY??p.maxY)+off);
      p.w=p.maxX-p.minX;
    }
    for(let i=1;i<GRASS_PLATFORMS.length;i++){
      const lower=GRASS_PLATFORMS[i-1],upper=GRASS_PLATFORMS[i],margin=180;
      upper.minX=Math.max(upper.minX,lower.minX+margin);
      upper.maxX=Math.min(upper.maxX,lower.maxX-margin);
      if(upper.maxX<=upper.minX+420){
        const center=clamp((upper.minX+upper.maxX)*.5,lower.minX+margin+210,lower.maxX-margin-210);
        upper.minX=center-210;upper.maxX=center+210;
      }
      upper.w=upper.maxX-upper.minX;
    }
    for(const p of GRASS_PLATFORMS){
      const below=GRASS_PLATFORMS.find(q=>q.level===p.level-1);
      const supportBackY=below?below.minY:GROUND_Y;
      const minWallH=GRASS_MIN_WALL_HEIGHT[p.level]||120;
      const maxAllowedFrontY=supportBackY-minWallH;
      if(p.maxY>maxAllowedFrontY){
        const dy=p.maxY-maxAllowedFrontY;
        p.minY-=dy;
        p.maxY-=dy;
      }
    }
  }
  function validateStairPlacement(){
    const allTerrains=[
      {platforms:PLATFORMS,stairs:STAIRS,name:'街区'},
      {platforms:DESERT_PLATFORMS,stairs:DESERT_STAIRS,name:'沙漠'},
      {platforms:GRASS_PLATFORMS,stairs:GRASS_STAIRS,name:'草地'},
      {platforms:HIGHRISE_PLATFORMS,stairs:HIGHRISE_STAIRS,name:'高楼'},
      {platforms:INDOOR_PLATFORMS,stairs:INDOOR_STAIRS,name:'室内'}
    ];
    for(const terrain of allTerrains){
      const{platforms,stairs,name}=terrain;
      for(const s of stairs){
        const target=platforms.find(p=>p.level===s.toLevel);
        if(!target)continue;
        s.topY=target.maxY;
        s.bottomY=stairWallBottomY(s,platforms);
        if(name==='草地'){
          s.topY=target.maxY;
          const h=Math.max(1,s.bottomY-s.topY);
          s.topW=Math.max(GRASS_STAIR_MIN_TOP_W,Math.round((s.baseTopW??s.topW)-h*.08));
          s.bottomW=Math.max(GRASS_STAIR_MIN_BOTTOM_W,Math.round((s.baseBottomW??s.bottomW)-h*.05));
        }
        const edgeMargin=name==='草地'?Math.max(STAIR_EDGE_MARGIN,340):STAIR_EDGE_MARGIN;
        const topCenter=s.x+s.bottomW*.5;
        const minCenter=target.minX+edgeMargin+s.topW*.5;
        const maxCenter=target.maxX-edgeMargin-s.topW*.5;
        if(maxCenter<=minCenter)continue;
        const safeCenter=clamp(topCenter,minCenter,maxCenter);
        s.x=safeCenter-s.bottomW*.5;
      }
    }
  }
  configureGrassTerrain(0);
  validateStairPlacement();
  function activeTerrain(){return generatedTerrain&&generatedTerrain.theme===currentStageTheme?generatedTerrain:(TERRAIN_BY_THEME[currentStageTheme]||{platforms:PLATFORMS,stairs:STAIRS,pits:[]})}
  function currentPlatforms(){return activeTerrain().platforms}
  function currentStairs(){return activeTerrain().stairs}
  function currentCollapseClimbs(){return[]}
  function currentBridges(){return activeTerrain().bridges||[]}
  function currentPits(){return activeTerrain().pits??(currentStageTheme==='沙漠'?desertPits:[])}
  function currentHazards(){return activeTerrain().hazards||(HAZARDS_BY_THEME[currentStageTheme]||[])}
  function currentBlockers(){return activeTerrain().blockers||[]}
  function currentSlowZones(){return activeTerrain().slowZones||[]}
  function swampEdgeX(z,y,right=false){const t=clamp((y-z.y)/z.h,0,1),wave=Math.sin(t*12.7+(right ? 1.4 : 0.2))*22+Math.sin(t*28.3+(right ? 0.7 : 2.1))*11;return z.x+(right?z.w:0)+wave}
  function slowZoneContains(z,x,y){if(y<=z.y||y>=z.y+z.h)return false;if(z.type==='swamp'&&z.irregular)return x>swampEdgeX(z,y,false)&&x<swampEdgeX(z,y,true);return x>z.x&&x<z.x+z.w}
  function actorSlowZone(a){for(const z of currentSlowZones())if((a.level||0)===(z.level||0)&&slowZoneContains(z,a.x,a.y))return z;return null}
  function terrainSpeedMul(a){const z=actorSlowZone(a);if(!z||a.type==='spinner'||(a.z||0)>18||a.airLaunch)return 1;return Math.max(.22,(z.mul||.6)*(1-(a.swampDepth||0)*.34))}
  function floodWalkSpeedMul(a){
    if(currentStageTheme!=='水中避难所'||(a.level??0)>=0||(a.z||0)>18||a.airLaunch||['spinAir','thrown','grappleThrown','grappleSlide'].includes(a.state))return 1;
    return .6
  }
  function updateSwampActor(a,dt,isPlayer=false){
    const z=actorSlowZone(a),immune=a.type==='spinner',airborne=(a.z||0)>18||a.airLaunch||['thrown','grappleThrown','grappleSlide'].includes(a.state);
    if(!z||z.type!=='swamp'||immune||airborne){a.swampDepth=Math.max(0,(a.swampDepth||0)-dt*(immune?4:1.45));if(!z&&a.swampDepth<=0)a.swampEscaped=false;return}
    if(isPlayer){a.swampDepth=Math.min(1,(a.swampDepth||0)+dt*.27);if(a.swampDepth>=1&&!a.swampDead){a.swampDead=true;a.hp=0;a.state='down';a.timer=2;a.z=0;a.vz=0;message='沼泽没过头顶……挣不出来了';messageT=3;queueRunFailure()}return}
    if(!a.swampEscaped){a.swampDepth=Math.min(.5,(a.swampDepth||0)+dt*.22);if(a.swampDepth>=.5)a.swampEscaped=true}
    else a.swampDepth+=(1/6-a.swampDepth)*Math.min(1,dt*5.2)
  }
  function applySwampTravelDrag(a,previousX,previousY){const z=actorSlowZone(a);if(!z||z.type!=='swamp'||a.type==='spinner'||(a.z||0)>18)return;const mul=terrainSpeedMul(a);a.x=previousX+(a.x-previousX)*mul;a.y=previousY+(a.y-previousY)*mul}
  function applyFloodWalkDrag(a,previousX,previousY){
    if(floodWalkSpeedMul(a)===1||!['run','idle'].includes(a.state))return;
    a.x=previousX+(a.x-previousX)*.6;a.y=previousY+(a.y-previousY)*.6
  }
  function forestSteeredVector(a,targetX,targetY){
    const direct={dx:targetX-a.x,dy:targetY-a.y},blockers=currentBlockers();
    if(currentStageTheme!=='森林'||!blockers.length)return direct;
    let nav=a.forestDetour;
    const direction=Math.sign(direct.dx);
    if(nav&&(!blockers.includes(nav.blocker)||!direction||direction!==nav.dir||(a.x-nav.blocker.x)*nav.dir>nav.blocker.rx+88)){a.forestDetour=null;nav=null}
    if(!nav){
      let blocker=null,nearest=Infinity;
      for(const o of blockers){
        if((o.level||0)!==(a.level||0))continue;
        const rx=o.rx+52,ry=o.ry+60,sx=(a.x-o.x)/rx,sy=(a.y-o.y)/ry,vx=direct.dx/rx,vy=direct.dy/ry,qa=vx*vx+vy*vy,qb=2*(sx*vx+sy*vy),qc=sx*sx+sy*sy-1;
        if(qa<.000001)continue;const disc=qb*qb-4*qa*qc;if(disc<0&&qc>=0)continue;
        const hit=qc<0?0:(-qb-Math.sqrt(Math.max(0,disc)))/(2*qa);if(hit<0||hit>1||hit>=nearest)continue;blocker=o;nearest=hit
      }
      if(blocker&&direction){
        const ground=groundWalkBounds(),clear=blocker.ry+86,top=clamp(blocker.y-clear,ground.min+24,ground.max-24),bottom=clamp(blocker.y+clear,ground.min+24,ground.max-24),topCost=Math.abs(a.y-top)+Math.abs(targetY-top)*.42,bottomCost=Math.abs(a.y-bottom)+Math.abs(targetY-bottom)*.42,side=topCost<=bottomCost?-1:1;
        nav={blocker,dir:direction,side,phase:0};a.forestDetour=nav
      }
    }
    if(!nav)return direct;
    const ground=groundWalkBounds(),o=nav.blocker,safeY=clamp(o.y+nav.side*(o.ry+72),ground.min+26,ground.max-26);
    if(nav.phase===0&&Math.abs(a.y-safeY)<=15)nav.phase=1;
    if(nav.phase===0)return{dx:nav.dir*Math.max(14,Math.min(42,Math.abs(o.x-a.x)*.22)),dy:safeY-a.y};
    return{dx:o.x+nav.dir*(o.rx+94)-a.x,dy:safeY-a.y}
  }
  const platformForLevel=level=>currentPlatforms().find(p=>p.level===level)||null;
  // Each terrain renderer gives its platform cap a different overhang. Mirror
  // those exact back/front overhangs in traversal instead of using the smaller
  // raw trapezoid or one broad collision estimate.
  const ACTOR_WALL_COLLISION_PAD=12,PLAYER_STAIR_ENTRY_PAD=28;
  function platformBoundsAtY(y,p=currentPlatforms()[0]){const t=clamp((y-p.minY)/(p.maxY-p.minY),0,1);return{left:p.minX+76*(1-t),right:p.minX+(p.w-92)*(1-t)+p.w*t}}
  function platformVisualOverhangAtY(y,p){const t=clamp((y-p.minY)/(p.maxY-p.minY),0,1);if(currentStageTheme==='草地')return 34+(8-34)*t;if(currentStageTheme==='沙漠')return 22+(36-22)*t;return 3}
  function platformWalkBoundsAtY(y,p=currentPlatforms()[0],pad=0){const b=platformBoundsAtY(y,p),edge=platformVisualOverhangAtY(y,p)+pad;return{left:b.left-edge,right:b.right+edge}}
  function platformWalkMaxY(p){return p.maxY}
  function insidePlatform(x,y,pad=0,p=platformForLevel(player.level)||currentPlatforms()[0]){if(y<p.minY-pad||y>p.maxY+pad)return false;const b=platformWalkBoundsAtY(y,p,pad);return x>=b.left&&x<=b.right}
  function stairEnds(s){
    return{topY:s.topY,bottomY:s.bottomY};
  }
  function stairBoundsAtY(s,y,pad=0){const e=stairEnds(s),t=clamp((e.bottomY-y)/(e.bottomY-e.topY),0,1),w=s.bottomW+(s.topW-s.bottomW)*t,c=s.x+s.bottomW*.5;return{left:c-w*.5-pad,right:c+w*.5+pad,t,topY:e.topY,bottomY:e.bottomY}}
  function insideStair(s,x,y,pad=0){const e=stairEnds(s);if(y<e.topY-pad||y>e.bottomY+pad)return false;const b=stairBoundsAtY(s,y,pad);return x>=b.left&&x<=b.right}
  function insideStairWalkZone(s,x,y,xPad=0){const e=stairEnds(s);if(y<e.topY||y>e.bottomY)return false;const b=stairBoundsAtY(s,y,xPad);return x>=b.left&&x<=b.right}
  function bridgeYAtX(b,x){const t=clamp((x-b.x1)/(b.x2-b.x1||1),0,1);return b.y1+(b.y2-b.y1)*t}
  function insideBridge(b,x,y,pad=0){const left=Math.min(b.x1,b.x2)-pad,right=Math.max(b.x1,b.x2)+pad;if(x<left||x>right)return false;return Math.abs(y-bridgeYAtX(b,x))<(b.width*.5+pad)}
  function applyBridgeTerrain(b,a=player){a.y=bridgeYAtX(b,a.x);const t=clamp((a.x-b.x1)/(b.x2-b.x1||1),0,1);a.level=t>.5?b.toLevel:b.fromLevel;return true}
  function levelAtPoint(x,y){for(const p of currentPlatforms())if(insidePlatform(x,y,0,p))return p.level;return 0}
  function grassWallRect(p){
    const b=platformBoundsAtY(p.maxY,p),top=p.maxY,bottom=platformWallBottomY(p);
    return{left:b.left-8,right:b.right+8,top,bottom:Math.max(bottom,top+8)}
  }
  function platformWallRect(p,platforms=currentPlatforms()){
    const b=platformBoundsAtY(p.maxY,p),top=p.maxY,bottom=platformWallBottomY(p,platforms);
    return{left:b.left-10,right:b.right+10,top,bottom:Math.max(bottom,top+8)}
  }
  function isGroundAccessLane(a,pad=0){
    for(const s of currentStairs()){
      if((s.fromLevel||0)!==0)continue;
      const mouth=stairBoundsAtY(s,s.bottomY,pad+34);
      if(a.x>=mouth.left&&a.x<=mouth.right&&a.y>=s.bottomY-10&&a.y<=s.bottomY+78+pad)return true
    }
    for(const c of currentCollapseClimbs()){
      if((c.fromLevel||0)!==0)continue;
      const t=collapseClimbTarget(c);
      if(a.x>=c.x-42-pad&&a.x<=c.x+c.w+42+pad&&Math.abs(a.y-t.fromY)<=78+pad)return true
    }
    return false
  }
  function pushOutOfGroundWalls(a,pad=0){
    return pushOutOfBuildingSolids(a,pad)
  }
  function isBuildingEntrance(a,p,pad=0){
    for(const s of currentStairs())if(s.toLevel===p.level&&(s.fromLevel===a.level||s.toLevel===a.level)&&insideStair(s,a.x,a.y,pad+PLAYER_STAIR_ENTRY_PAD))return true;
    for(const c of currentCollapseClimbs())if(c.toLevel===p.level&&c.fromLevel===a.level&&a.x>=c.x-42-pad&&a.x<=c.x+c.w+42+pad){const t=collapseClimbTarget(c);if(Math.abs(a.y-t.fromY)<=78+pad)return true}
    return false
  }
  function platformHorizontalGap(a,b){
    if(a.maxX<b.minX)return b.minX-a.maxX;
    if(b.maxX<a.minX)return a.minX-b.maxX;
    return 0
  }
  function playerCrossJumpTarget(p,requireInside=true){
    if(!jumpSourcePlatform||jumpPlatformCleared||p===jumpSourcePlatform||player.vz>=0)return null;
    if(platformHorizontalGap(jumpSourcePlatform,p)>360)return null;
    const landingY=clamp(player.y,p.minY+12,p.maxY-12);
    if(Math.abs(landingY-player.y)>96)return null;
    const liftedFootY=player.y-player.z+8;
    if(liftedFootY>landingY)return null;
    if(requireInside&&!insidePlatform(player.x,landingY,34,p))return null;
    return{p,landingY,depthGap:Math.abs(landingY-player.y)}
  }
  function pushOutOfBuildingSolids(a,pad=0,previousX=a.x,previousY=a.y){
    const support=platformForLevel(a.level);
    let blocked=false;
    for(const p of currentPlatforms()){
      if(p===support||isBuildingEntrance(a,p,pad)||(a===player&&playerCrossJumpTarget(p,false)))continue;
      const wall=platformWallRect(p),left=wall.left-pad,right=wall.right+pad,top=wall.top-pad,bottom=wall.bottom+pad;
      if(right<=left||bottom<=top||a.x<=left||a.x>=right||a.y<=top||a.y>=bottom)continue;
      if(previousX<=left)a.x=left;
      else if(previousX>=right)a.x=right;
      else if(previousY<=top)a.y=top;
      else if(previousY>=bottom)a.y=bottom;
      else{
        const exits=[{axis:'x',value:left,d:a.x-left},{axis:'x',value:right,d:right-a.x},{axis:'y',value:top,d:a.y-top},{axis:'y',value:bottom,d:bottom-a.y}].sort((u,v)=>u.d-v.d)[0];
        a[exits.axis]=exits.value
      }
      blocked=true
    }
    return blocked
  }
  function collapseClimbTarget(c){
    const target=platformForLevel(c.toLevel),source=platformForLevel(c.fromLevel);
    const fromY=source?platformWalkMaxY(source)-12:GROUND_Y;
    const toY=target?platformWalkMaxY(target)-18:GROUND_Y-34;
    const x=clamp(c.x+c.w*.5,stageLockX+70,stageRightX-70);
    return{fromY,toY,x,source,target}
  }
  function lowerPitBounds(pit){
    const bunker=pit.bunker;
    if(bunker){const firstRoom=bunker.rooms[0],lastRoom=bunker.rooms[bunker.rooms.length-1],exitPit=bunker.rightPit;return{left:bunker.left,right:bunker.right,backX:firstRoom.left+180,exitX:lastRoom.right-190,climbX:lastRoom.right-190,surfaceExitX:exitPit.x+exitPit.w*.5,y:bunker.y,pit,bunker,entersLeft:true,exitDoor:null}}
    const left=clamp(pit.x-210,stageLockX+25,stageRightX-180),right=clamp(pit.x+pit.w+560,left+420,stageRightX-60);return{left,right,backX:left+48,exitX:right-62,climbX:clamp(pit.x+pit.w*.5,left+95,right-95),y:pit.lowerY||UNDER_Y,pit}
  }
  function pitSlopeFor(b){
    return{x:b.exitX-220,bottomW:310,topW:170,bottomY:b.y+44,topY:b.y-96,fromLevel:-1,toLevel:0,pit:b.pit}
  }
  function insidePit(a,pit){
    if((a.level||0)!==0)return false;
    if(pit.shape==='forestHole'){const rx=pit.w*.5,ry=pit.h*.5,dx=(a.x-(pit.x+rx))/rx,dy=(a.y-pit.y)/ry;return dx*dx+dy*dy<.72}
    if(pit.shape==='square'){const top=pit.topY??GROUND_Y,bottom=pit.y+16;return a.x>pit.x&&a.x<pit.x+pit.w&&a.y>top&&a.y<bottom}
    return a.x>pit.x&&a.x<pit.x+pit.w&&a.y>GROUND_Y
  }
  function laneBoundsFor(level,y,margin=55,actor=player){if(level<0&&actor.subPit){const b=actor.subPit;return{left:b.left+margin*.4,right:b.right-margin*.4}}const p=platformForLevel(level);if(!p)return{left:margin,right:WORLD_W-margin};const b=platformBoundsAtY(clamp(y,p.minY,p.maxY),p);return{left:b.left+margin,right:b.right-margin}}
  function actorTravelBounds(margin=18){if(player.level<0&&player.subPit)return{left:player.subPit.left+margin,right:player.subPit.right-margin};return{left:Math.max(42,stageLockX+margin),right:Math.min(WORLD_W-42,stageRightX-margin)}}
  function playerHorizontalBounds(){return player.level<0&&player.subPit?{left:player.subPit.left,right:player.subPit.right}:{left:stageLockX,right:stageRightX}}
  function pushOutOfBlockers(a,margin=0,previousX=a.x,previousY=a.y){
    if((a.z||0)>18&&currentStageTheme!=='森林')return false;
    let blocked=false;
    for(const o of currentBlockers()){
      if((o.level||0)!==a.level)continue;
      const dx=a.x-o.x;if(Math.max(a.x,previousX)<o.x-180-margin)break;if(Math.min(a.x,previousX)>o.x+180+margin)continue;
      const dy=a.y-o.y;if(Math.abs(dy)>120+margin)continue;
      const rx=o.rx+margin,ry=o.ry+margin*.45,n=(dx*dx)/(rx*rx)+(dy*dy)/(ry*ry);
      if(n>=1){
        const sx=(previousX-o.x)/rx,sy=(previousY-o.y)/ry,ex=dx/rx,ey=dy/ry,vx=ex-sx,vy=ey-sy,qa=vx*vx+vy*vy,qb=2*(sx*vx+sy*vy),qc=sx*sx+sy*sy-1,disc=qb*qb-4*qa*qc;
        if(qc>=0&&qa>.000001&&disc>=0){const hit=(-qb-Math.sqrt(disc))/(2*qa);if(hit>=0&&hit<=1){const stop=Math.max(0,hit-.015);a.x=previousX+(a.x-previousX)*stop;a.y=previousY+(a.y-previousY)*stop;blocked=true}}
        continue
      }
      let len=Math.hypot(dx/rx,dy/ry),ux,uy;
      if(len<.001){ux=a.face||1;uy=0}else{ux=(dx/rx)/len;uy=(dy/ry)/len}
      a.x=o.x+ux*rx;
      a.y=o.y+uy*ry;
      if(a.level===0&&!platformForLevel(0)){
        const ground=groundWalkBounds();a.y=clamp(a.y,ground.min,ground.max);
        const nx=(a.x-o.x)/rx,ny=(a.y-o.y)/ry;
        if(nx*nx+ny*ny<1)a.x=o.x+(ux<0?-rx:rx);
      }
      blocked=true;
    }
    return blocked
  }
  function levelName(level){if(level<0)return currentStageTheme==='水中避难所'?'水淹区':'地下暗层';return platformForLevel(level)?.name||'地面层'}
  function themeName(t){return t==='草地'?'长城':t}
  function groundWalkBounds(theme=currentStageTheme){
    if(theme==='沙漠')return{min:520,max:GROUND_MAX_Y};
    if(theme==='草地')return{min:GROUND_Y,max:GROUND_MAX_Y};
    return{min:GROUND_MIN_Y,max:GROUND_MAX_Y}
  }
  function canPlayerHitAcrossLevelEdge(e){
    if(player.level<0||e.level!==player.level+1||(player.z||0)>48||(e.z||0)>72)return false;
    const upper=platformForLevel(e.level),lower=player.level===0?null:platformForLevel(player.level);
    if(!upper||(player.level>0&&!lower))return false;
    const lowerBackY=lower?lower.minY:groundWalkBounds().min;
    return Math.abs(player.y-lowerBackY)<=64&&Math.abs(e.y-upper.maxY)<=64
  }
  function updateCamera(){
    const targetX=player.x-W*.48;
    const underground=player.level<0&&player.subPit,worldLeft=underground?player.subPit.left:cameraLockX,worldRight=underground?player.subPit.right:stageRightX;
    const minX=clamp(worldLeft,0,WORLD_W-W);
    const rightPadding=gatePhase==='exit'?W*.48:W-100;
    const maxX=clamp(worldRight-rightPadding,minX,WORLD_W-W);
    const desiredX=clamp(targetX,minX,maxX);
    cameraX+= (desiredX-cameraX)*(gatePhase==='combat'?.28:.2);
    if(Math.abs(desiredX-cameraX)<.5)cameraX=desiredX;
    const groundCameraBottom=groundWalkBounds().max-H+24;
    const maxY=player.level<0||player.climb?.kind==='pitOut'?WORLD_BOTTOM:groundCameraBottom;
    cameraY=Math.min(player.y-player.z-H*.58,maxY)
  }
  function blackoutActive(){return currentStageTheme==='高楼'&&powerSwitch&&!powerSwitch.on}
  const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.35);
  const PLAYER_MOVE_SPEED_X=320,PLAYER_MOVE_SPEED_Y=206,ENEMY_MOVE_SPEED_MUL=3,ENEMY_ALERT_X=450,ENEMY_ALERT_Y=180,SKILL_CHARGE_MAX=12;
  const player={x:270,y:566,z:0,vz:0,knockVx:0,level:0,face:1,hp:160,maxHp:160,state:'idle',timer:0,combo:0,comboT:0,kickCombo:0,kickComboT:0,cleanHits:0,attackSpeedTier:0,starAbsorbHits:0,launchKickChargeHits:0,starAbsorbPull:null,grab:null,grabTarget:null,grabT:0,grabEscapeT:0,grabKickQueue:0,grabKickTotal:0,risingQueued:false,risingCooldown:0,risingAirInv:false,risingInvT:0,held:null,heldUses:0,inv:0,kills:0,inputQueue:[],climb:null,fallDamage:0,fallFromLevel:null,fallStartY:null,subPit:null,pitSafeT:0,launchKickChainCount:0,launchKickChainQueued:0};
  let enemies=[],companions=[],pickups=[],projectiles=[],forestHives=[];
  const pendingGrowthUpgrades={hp:0,atk:0,def:0};
  const defaultProgress={gold:0,chicken:0,fruit:0,hpLv:0,atkLv:0,defLv:0,spdLv:0,ascend:0,bestStage:0,currentStage:1,unlockedRecruits:[],tempRecruit:null,unlockedSkills:[]};
  let progress=loadProgress();
  const isTestBuild=authorization.mode==='test';
  function loadProgress(){try{const saved=JSON.parse(localStorage.getItem('tiejie-progress')||'{}'),next={...defaultProgress,...saved};next.bestStage=Math.max(0,Math.floor(Number(next.bestStage)||0));next.currentStage=Math.max(1,Math.floor(Number(next.currentStage)||next.bestStage||1));next.unlockedRecruits=Array.isArray(next.unlockedRecruits)?[...new Set(next.unlockedRecruits.filter(type=>typeof type==='string'))]:[];next.unlockedSkills=Array.isArray(next.unlockedSkills)?[...new Set(next.unlockedSkills.filter(id=>typeof id==='string').map(id=>id==='airRisingPunch'?'lifeSteal':id))]:[];if(!next.tempRecruit||typeof next.tempRecruit.type!=='string'||Number(next.tempRecruit.remaining)<=0)next.tempRecruit=null;return next}catch(e){return{...defaultProgress,unlockedRecruits:[],unlockedSkills:[]}}}
  function saveProgress(){try{localStorage.setItem('tiejie-progress',JSON.stringify(progress))}catch(e){}}
  const skillCatalog=[
    {id:'basicPunch',branch:'拳击分支',icon:'拳',name:'普通三段拳',cost:0,requires:null,desc:'连续普通拳形成三段攻击，也是升龙拳和拳焰的根节点。',release:'连续按“拳”：左直拳→右直拳→上勾拳。',story:'主角机缘巧合下获得了能让拳头力大无穷的神器果实，从此掌握普通三段拳。'},
    {id:'risingPunch',branch:'拳击分支',icon:'升',name:'升龙拳',cost:1,requires:'basicPunch',desc:'起飞后的前 0.34 秒处于无敌状态，可以穿过敌人的攻击；下蹲蓄力阶段没有无敌。',release:'在地面进入跳跃下蹲时按“拳”，完成蓄力后自动起飞出拳；技能冷却 1 秒。',story:''},
    {id:'lifeSteal',branch:'拳击分支',icon:'血',name:'吸血',cost:3,requires:'risingPunch',desc:'主角造成伤害时，将敌人实际损失生命的 10% 转化为自己的生命。',release:'点亮后被动生效；主角的拳脚、擒拿、摔投和投掷道具造成伤害时均可吸血。',story:''},
    {id:'downRisingPunch',branch:'拳击分支',icon:'躺',name:'地躺升龙拳',cost:3,requires:'risingPunch',desc:'被击倒且已经落地时，可以瞬间用升龙拳反击。',release:'主角倒地并接触地面后按“拳”；仍在空中被击飞时无效。',story:''},
    {id:'blueFlame',branch:'拳击分支',icon:'拳焰',name:'拳焰',cost:3,requires:'basicPunch',desc:'每次拳击额外造成 10 点基础伤害；无伤期间每有效命中 5 次，攻击速度提高 20%，最高达到 2 倍。受到伤害会失去全部攻速加成。',release:'点亮后被动生效。连续命中并避免受伤，才能维持攻速增益。',story:''},
    {id:'legArts',branch:'腿法分支',icon:'腿',name:'腿法',cost:1,requires:null,desc:'开放主角的普通腿法和战斗界面的“腿”按键。',release:'按“腿”发动普通腿法。',story:''},
    {id:'legFlame',branch:'腿法分支',icon:'腿焰',name:'腿焰',cost:2,requires:'legArts',desc:'为所有腿技附加腿部火焰，并将腿技的攻击距离提升为原来的 1.3 倍。',release:'点亮后被动生效；普通踢腿、空中踢和弹射飞踢均获得腿焰与 1.3 倍攻击距离。',story:''},
    {id:'launchKick',branch:'腿法分支',icon:'飞',name:'弹射飞踢',cost:3,requires:'legFlame',desc:'在跳跃起势阶段高速向前弹射飞踢；命中后仍保持横向弹射，并带动敌人进入空中追击距离。',release:'跳跃下蹲阶段按“腿”；命中后继续点腿可接弹射飞连腿。',story:''},
    {id:'launchKickChain',branch:'腿法分支',icon:'连',name:'弹射飞连腿',cost:4,requires:'launchKick',desc:'每次有效命中为技能独立充能，积满 12 次后可释放一整套；整套最多六次有效命中。',release:'充满后先发动弹射飞踢，再持续点“腿”维持飞连腿；起手消耗全部充能。',story:''},
    {id:'grapple',branch:'擒拿分支',icon:'抓',name:'擒拿',cost:1,requires:null,desc:'开放主动抓取敌人。未点亮时，“抓”仍可用于拾取道具；暗坑石门使用独立的“开门”按键。',release:'靠近可抓取的敌人后按“抓”。',story:''},
    {id:'invincibleGrapple',branch:'擒拿分支',icon:'御',name:'无敌擒拿',cost:3,requires:'grapple',desc:'成功抓住敌人的持续阶段处于无敌状态；抓取尝试、失败、松手和挣脱后不无敌。',release:'点亮后被动生效；成功抓住敌人即进入无敌阶段。',story:''},
    {id:'starAbsorb',branch:'擒拿分支',icon:'聚',name:'聚势之握',cost:2,requires:'grapple',desc:'每次有效命中独立充能，积满 12 次后可吸引前方扇形内所有敌人；吸收阶段没有伤害。',release:'充满后长按“抓”触发，最长持续 2 秒；松手或到时后立即衔接升龙拳。只有被敌人擒拿才能打断。',story:''}
  ];
  const skillIconPositions={basicPunch:[0,0],risingPunch:[1,0],lifeSteal:[2,0],downRisingPunch:[3,0],blueFlame:[0,1],legArts:[1,1],legFlame:[2,1],launchKick:[3,1],launchKickChain:[0,2],grapple:[1,2],invincibleGrapple:[2,2],starAbsorb:[3,2]};
  function applySkillIcon(node,skill){const position=skillIconPositions[skill.id]||[0,0];node.textContent='';node.dataset.skillIcon=skill.id;node.style.setProperty('--skill-icon-x',`${position[0]*100/3}%`);node.style.setProperty('--skill-icon-y',`${position[1]*50}%`)}
  let selectedSkillId='basicPunch';
  function hasSkill(id){return id==='basicPunch'||progress.unlockedSkills.includes(id)}
  function unlockSkill(id){const skill=skillCatalog.find(item=>item.id===id);if(!skill||id==='basicPunch')return false;if(isTestBuild){const unlocked=progress.unlockedSkills.includes(id);progress.unlockedSkills=unlocked?progress.unlockedSkills.filter(skillId=>skillId!==id):[...new Set([...progress.unlockedSkills,id])];saveProgress();refreshSkillPanel(`${skill.name}${unlocked?'已熄灭':'已点亮'}`);refreshSkillControls();return true}if(hasSkill(id))return false;if(skill.requires&&!hasSkill(skill.requires)){refreshSkillPanel(`需要先点亮${skillCatalog.find(item=>item.id===skill.requires)?.name||'前置技能'}`);return false}if(progress.fruit<skill.cost){refreshSkillPanel(`神奇果实不足，需要 ${skill.cost} 个`);return false}progress.fruit-=skill.cost;progress.unlockedSkills.push(id);progress.unlockedSkills=[...new Set(progress.unlockedSkills)];saveProgress();refreshSkillPanel(`${skill.name}已点亮`);refreshSkillControls();return true}
  function refreshSkillControls(){const kick=[...document.querySelectorAll('[data-action]')].find(item=>item.dataset.action==='kick');if(kick)kick.hidden=!hasSkill('legArts');window.TieJieSkillState={legArts:hasSkill('legArts')}}
  function selectSkill(id){if(skillCatalog.some(skill=>skill.id===id)){selectedSkillId=id;refreshSkillPanel()}}
  function refreshSkillDetail(){const skill=skillCatalog.find(item=>item.id===selectedSkillId)||skillCatalog[0],unlocked=hasSkill(skill.id),available=isTestBuild||!skill.requires||hasSkill(skill.requires),requires=skill.requires?skillCatalog.find(item=>item.id===skill.requires)?.name:'';const set=(id,text)=>{const node=document.querySelector(`#${id}`);if(node)node.textContent=text};const detailIcon=document.querySelector('#skill-detail-icon');if(detailIcon)applySkillIcon(detailIcon,skill);set('skill-detail-path',skill.branch);set('skill-detail-name',skill.name);set('skill-detail-desc',skill.desc);set('skill-detail-release',skill.release);set('skill-detail-story',skill.story||'相关故事尚未确定。');set('skill-detail-requirement',skill.id==='basicPunch'?'初始技能 · 始终点亮':isTestBuild?'测试版 · 可自由点亮或熄灭':`前置：${requires||'无'} · 消耗：${skill.cost} 个神奇果实`);const action=document.querySelector('#skill-unlock');if(action){action.disabled=skill.id==='basicPunch'||(!isTestBuild&&(unlocked||!available));action.textContent=skill.id==='basicPunch'?'初始技能':isTestBuild?unlocked?'熄灭技能':'免费点亮':unlocked?'已点亮':available?`消耗 ${skill.cost} 个果实点亮`:`需要先点亮${requires}`;action.onclick=()=>unlockSkill(skill.id)}}
  function refreshSkillPanel(status=''){const fruit=document.querySelector('#skill-fruit'),box=document.querySelector('#skill-tree'),state=document.querySelector('#skill-status');if(fruit)fruit.textContent=isTestBuild?'测试版 · 自由配技':`果实 ${progress.fruit}`;if(!box)return;box.innerHTML='';if(Array.isArray(box.children))box.children.length=0;box.skillNodes=[];const appendNode=(parent,skill)=>{const unlocked=hasSkill(skill.id),available=isTestBuild||!skill.requires||hasSkill(skill.requires),button=document.createElement('button');button.className=`skill-node ${unlocked?'unlocked':available?'available':'locked'} ${selectedSkillId===skill.id?'selected':''}`;button.dataset.skill=skill.id;const icon=document.createElement('span');icon.className='skill-icon';applySkillIcon(icon,skill);button.appendChild(icon);const name=document.createElement('span');name.className='skill-name';name.textContent=skill.name;button.appendChild(name);const detail=document.createElement('small');detail.textContent=skill.id==='basicPunch'?'初始技能':isTestBuild?unlocked?'已点亮 · 可熄灭':'点击免费点亮':unlocked?'已点亮':available?`${skill.cost} 果实`:`需 ${skillCatalog.find(item=>item.id===skill.requires)?.name}`;button.appendChild(detail);button.onclick=()=>selectSkill(skill.id);parent.appendChild(button);box.skillNodes.push(button)};const punch=document.createElement('section');punch.className='skill-branch';punch.dataset.title='拳击分支';appendNode(punch,skillCatalog.find(skill=>skill.id==='basicPunch'));const punchMiddle=document.createElement('div');punchMiddle.className='skill-split';for(const id of['risingPunch','blueFlame'])appendNode(punchMiddle,skillCatalog.find(skill=>skill.id===id));punch.appendChild(punchMiddle);const split=document.createElement('div');split.className='skill-split';for(const id of['lifeSteal','downRisingPunch'])appendNode(split,skillCatalog.find(skill=>skill.id===id));punch.appendChild(split);box.appendChild(punch);const leg=document.createElement('section');leg.className='skill-branch';leg.dataset.title='腿法分支';for(const id of['legArts','legFlame','launchKick','launchKickChain'])appendNode(leg,skillCatalog.find(skill=>skill.id===id));box.appendChild(leg);const grapple=document.createElement('section');grapple.className='skill-branch';grapple.dataset.title='擒拿分支';appendNode(grapple,skillCatalog.find(skill=>skill.id==='grapple'));const grappleSplit=document.createElement('div');grappleSplit.className='skill-split';for(const id of['invincibleGrapple','starAbsorb'])appendNode(grappleSplit,skillCatalog.find(skill=>skill.id===id));grapple.appendChild(grappleSplit);box.appendChild(grapple);refreshSkillDetail();if(state)state.textContent=status||(isTestBuild?'测试版可自由点亮或熄灭技能':'点击技能图标查看详情，再决定是否点亮')}
  function vitalityStat(){return 10+progress.hpLv+progress.ascend}
  function strengthStat(){return 10+progress.atkLv+progress.ascend}
  function defenseStat(){return 10+progress.defLv+progress.ascend}
  function playerMaxHp(){return Math.round(16*vitalityStat())}
  function playerAtkMul(){return strengthStat()/10}
  function playerDefMul(){return 10/defenseStat()}
  function playerSpeedMul(){return 1}
  function stageChickenReward(){const expected=(vitalityStat()+strengthStat()+defenseStat())*.08,whole=Math.floor(expected);return Math.max(1,whole+(Math.random()<expected-whole?1:0))}
  function playerAttackSpeedMul(){return Math.min(2,1+(player.attackSpeedTier||0)*.2)}
  function legAttackRange(range){return hasSkill('legFlame')?range*1.3:range}
  const LAUNCH_KICK_CHAIN_FRAME_DURATIONS=[.05,.1,.05,.1],LAUNCH_KICK_CHAIN_DURATION=.3,LAUNCH_KICK_CHAIN_MAX_HITS=6,LAUNCH_KICK_CHAIN_ACTIVE_FRAMES=[1,3],LAUNCH_KICK_CHAIN_FORWARD_SPEEDS=[480,520,520,560],LAUNCH_KICK_CHAIN_LIFTS=[3,3,3,3];
  function launchKickChainFrameAt(elapsed){let boundary=0;for(let frame=0;frame<LAUNCH_KICK_CHAIN_FRAME_DURATIONS.length;frame++){boundary+=LAUNCH_KICK_CHAIN_FRAME_DURATIONS[frame];if(elapsed<boundary)return frame}return LAUNCH_KICK_CHAIN_FRAME_DURATIONS.length-1}
  function resetLaunchKickChain(){player.launchKickChainCount=0;player.launchKickChainQueued=0;player.launchKickChainHitCount=0;player.launchKickChainFace=0;player.launchKickChainMotionFrame=-1}
  function updateLaunchKickChainMotion(dt){
    if(!(player.state==='airBackKick'&&!player.launchKick&&player.launchKickChainCount>0))return;
    const speed=playerAttackSpeedMul(),duration=Math.max(.001,player.launchKickChainDuration||LAUNCH_KICK_CHAIN_DURATION*speed),elapsed=clamp((duration-player.timer)/speed,0,LAUNCH_KICK_CHAIN_DURATION-.0001),frame=launchKickChainFrameAt(elapsed),face=player.launchKickChainFace||player.face||1;
    player.face=face;
    if(frame!==(player.launchKickChainMotionFrame??-1)){player.launchKickChainMotionFrame=frame;player.z=Math.max(0,(player.z||0)+LAUNCH_KICK_CHAIN_LIFTS[frame])}
    if(dt<=0)return;
    const previousX=player.x,b=playerHorizontalBounds();player.x=clamp(player.x+face*LAUNCH_KICK_CHAIN_FORWARD_SPEEDS[frame]*dt,b.left,b.right);pushOutOfBlockers(player,26,previousX,player.y)
  }
  function queueLaunchKickChain(){
    if(!hasSkill('launchKickChain'))return false
    if(!(player.state==='airBackKick'&&(player.launchKick||player.launchKickChainCount>0)&&player.z>0))return false
    if((player.launchKickChainCount||0)<=0&&(player.launchKickChargeHits||0)<SKILL_CHARGE_MAX){message=`空中飞连踢尚未充满 ${(player.launchKickChargeHits||0)}/${SKILL_CHARGE_MAX}`;messageT=.75;return true}
    if((player.launchKickChainHitCount||0)>=LAUNCH_KICK_CHAIN_MAX_HITS){player.launchKickChainQueued=0;message=`飞连腿${LAUNCH_KICK_CHAIN_MAX_HITS}下已满`;messageT=.35;return true}
    player.launchKickChainQueued=1
    message='持续点腿，飞连腿就不会停'
    messageT=.35
    return true
  }
  function startLaunchKickChainSegment(){
    resetPlayerHitStreak()
    const continuing=player.launchKickChainCount>0
    if(!continuing)player.launchKickChargeHits=0
    player.launchKick=false
    player.launchKickTime=0
    player.launchKickSpeed=0
    player.launchKickFace=0
    player.launchKickChainQueued=Math.max(0,(player.launchKickChainQueued||0)-1)
    player.launchKickChainCount=1
    player.state='airBackKick'
    const chainSpeed=playerAttackSpeedMul(),completed=player.launchKickChainHitCount||0,segmentHits=Math.min(LAUNCH_KICK_CHAIN_ACTIVE_FRAMES.length,LAUNCH_KICK_CHAIN_MAX_HITS-completed),lastActiveFrame=LAUNCH_KICK_CHAIN_ACTIVE_FRAMES[segmentHits-1],segmentFrames=lastActiveFrame+1,segmentDuration=LAUNCH_KICK_CHAIN_FRAME_DURATIONS.slice(0,segmentFrames).reduce((total,value)=>total+value,0)
    player.launchKickChainHitCount=completed+segmentHits
    player.launchKickChainDuration=segmentDuration*chainSpeed
    player.timer=player.launchKickChainDuration
    player.launchKickChainFace=player.launchKickChainFace||player.face||1
    player.launchKickChainMotionFrame=-1
    player.z=Math.max(player.z||0,continuing?12:32)
    player.vz=Math.max(player.vz||0,continuing?140:280)
    player.knockVx=0
    updateLaunchKickChainMotion(0)
    const strikes={1:{range:100,damage:7,force:520,delay:130,launchVz:440,juggle:310},3:{range:100,damage:7,force:740,delay:280,launchVz:460,juggle:330}}
    for(const frame of LAUNCH_KICK_CHAIN_ACTIVE_FRAMES.slice(0,segmentHits)){const strike=strikes[frame];attack(strike.range,strike.damage,strike.force,strike.delay*chainSpeed,{knockdown:true,launchVz:strike.launchVz,airJuggleVz:strike.juggle,zReach:165,kneeChain:true})}
    message=`高低连环鞭腿 ${player.launchKickChainHitCount}/${LAUNCH_KICK_CHAIN_MAX_HITS}`
    messageT=.4
  }
  function registerPlayerHit(){
    let starReady=false,launchReady=false;
    if(hasSkill('starAbsorb')&&(player.starAbsorbHits||0)<SKILL_CHARGE_MAX){player.starAbsorbHits=Math.min(SKILL_CHARGE_MAX,(player.starAbsorbHits||0)+1);starReady=player.starAbsorbHits===SKILL_CHARGE_MAX}
    if(hasSkill('launchKickChain')&&(player.launchKickChargeHits||0)<SKILL_CHARGE_MAX){player.launchKickChargeHits=Math.min(SKILL_CHARGE_MAX,(player.launchKickChargeHits||0)+1);launchReady=player.launchKickChargeHits===SKILL_CHARGE_MAX}
    if(starReady||launchReady){message=starReady&&launchReady?'聚势之握与空中飞连踢已充满':starReady?'聚势之握已充满——长按“抓”释放':'空中飞连踢已充满';messageT=1.5}
    if(!hasSkill('blueFlame'))return;player.cleanHits=(player.cleanHits||0)+1;if(player.cleanHits%5===0&&player.attackSpeedTier<5){player.attackSpeedTier++;message=`无伤连击 ${player.cleanHits} 次 · 攻速 ×${playerAttackSpeedMul().toFixed(1)}`;messageT=1.1}
  }
  function healPlayerFromDamage(target,previousHp){
    if(!hasSkill('lifeSteal')||player.hp<=0||player.hp>=player.maxHp)return 0;
    const actualDamage=Math.max(0,Math.min(Math.max(0,previousHp),Math.max(0,previousHp-target.hp)));if(actualDamage<=0)return 0;
    const healed=Math.min(player.maxHp-player.hp,actualDamage*.1);player.hp+=healed;return healed
  }
  function applyPlayerDirectDamage(target,damage,register=true){const previousHp=target.hp;if(register)registerPlayerHit();target.hp-=damage;healPlayerFromDamage(target,previousHp);return Math.min(Math.max(0,previousHp),Math.max(0,damage))}
  function resetPlayerHitStreak(){if((player.cleanHits||0)>0||(player.attackSpeedTier||0)>0){player.cleanHits=0;player.attackSpeedTier=0;message='无伤连击中断，攻速恢复';messageT=.8}}
  const playerAttackStates=new Set(['punch1','punch2','punch3','kick1','kick2','backKick','airBackKick','risingPunch','grabKnee','throw','throwItem','overChestThrow']);
  const BLUE_FIST_FLAME_BONUS=10;
  // Source-pixel anchors for the striking fist in the six 384 px punch cells.
  // Keeping this as equipment metadata lets the flame follow every authored pose
  // without coupling the effect animation to the character animation timing.
  const BLUE_FIST_FLAME_ANCHORS=[[264,201],[240,225],[264,205],[223,222],[230,176],[212,136]];
  // The generated flame's rounded hot head points down-left in source space.
  // Rotate that head into each fist's travel direction so the pointed tail
  // always streams behind the punch instead of leading it.
  const BLUE_FIST_FLAME_ROTATIONS=[-2.25,.1,-2.95,.5,2.61,2.04];
  const LEG_FLAME_SOURCE_HEAD_ANGLE=Math.atan2(1,-1);
  const OVER_CHEST_THROW_DURATION=1,OVER_CHEST_THROW_MS=900,OVER_CHEST_LIFT_RATIO=.55,OVER_CHEST_CONTACT_RATIO=.78;
  // Pixel anchors of the hero's clasped hands in the four 384 px source cells.
  // Enemy placement is solved from these points so its waist stays in the grip.
  const OVER_CHEST_HAND_ANCHORS=[[270,180],[225,135],[130,55],[67,270]];
  const OVER_CHEST_ENEMY_ANGLES=[0,.55,1.65,Math.PI];
  const OVER_CHEST_ENEMY_FRAMES={skinny:1,spinner:2,grappler:3,axe:3,assassin:3,suit:3,breaker:3,whip:3,barbarian:3};
  // Source-pixel belt/waist points for the single held frame used by each enemy.
  // These are intentionally anatomical anchors, not the centre of the padded cell.
  const OVER_CHEST_ENEMY_WAIST_ANCHORS={skinny:[194,266],spinner:[194,276],grappler:[190,263],axe:[190,267],assassin:[192,263],suit:[192,263],breaker:[192,263],whip:[192,263],barbarian:[192,266]};
  const overChestHeroFrame=progress=>progress<.18?0:progress<.36?1:progress<OVER_CHEST_LIFT_RATIO?2:3;
  function currentStageNumber(){return mapCycle*trialMaps.length+mapIndex+1}
  function stageDifficulty(stage=currentStageNumber()){return 1+(Math.max(1,stage)-1)*.1}
  function maxSelectableStage(){return Math.max(1,progress.currentStage,progress.bestStage+1)}
  function setStagePosition(stage,persist=true,allowAny=false){const upper=allowAny?Number.MAX_SAFE_INTEGER:maxSelectableStage(),value=clamp(Math.floor(Number(stage)||1),1,upper),zero=value-1;mapCycle=Math.floor(zero/trialMaps.length);mapIndex=zero%trialMaps.length;if(persist){progress.currentStage=value;saveProgress()}return value}
  function makeDesertPits(){
    desertPits=DESERT_PIT_ZONES.map((z,i)=>{
      const size=104+Math.floor(Math.random()*30),safeMin=z.min+90,safeMax=z.max-90;
      let x=Math.round(safeMin+Math.random()*Math.max(1,safeMax-safeMin-size));
      for(let tries=0;tries<16&&DESERT_STAIRS.some(s=>{const b=stairBoundsAtY(s,s.bottomY,90);return x<b.right&&x+size>b.left});tries++)x=Math.round(safeMin+Math.random()*Math.max(1,safeMax-safeMin-size));
      return normalizePit({x,w:size,name:i===0?'浅层方坑':i===1?'沙下断层':'塌陷方坑'},'沙漠',Math.random)
    })
  }
  function tryUpgrade(kind){
    if(!canAllocateStats())return;
    const map={hp:['hpLv','血量'],atk:['atkLv','力量'],def:['defLv','防御']},m=map[kind];if(!m)return;
    const pendingTotal=Object.values(pendingGrowthUpgrades).reduce((sum,value)=>sum+value,0);if(progress.chicken-pendingTotal<1){message='鸡腿数量不足，无法继续加点';messageT=1;return}
    pendingGrowthUpgrades[kind]++;message=`${m[1]}获得提升 +${pendingGrowthUpgrades[kind]}，保存后生效`;messageT=.9;refreshGrowthConfirmation()
  }
  function undoPendingUpgrade(kind){if(!canAllocateStats()||!pendingGrowthUpgrades[kind])return;pendingGrowthUpgrades[kind]--;message=`已撤回 1 点，本次${kind==='hp'?'血量':kind==='atk'?'力量':'防御'}待提升 +${pendingGrowthUpgrades[kind]}`;messageT=.75;refreshGrowthConfirmation()}
  function canAllocateStats(){return pendingGrowthAdvance||document.querySelector('#start-card')?.style.display!=='none'}
  function pendingGrowthTotal(){return Object.values(pendingGrowthUpgrades).reduce((sum,value)=>sum+value,0)}
  function clearPendingGrowth(){for(const kind of Object.keys(pendingGrowthUpgrades))pendingGrowthUpgrades[kind]=0;refreshGrowthConfirmation()}
  function refreshGrowthConfirmation(){const button=document.querySelector('#growth-confirm'),total=pendingGrowthTotal();document.querySelectorAll('[data-downgrade]').forEach(control=>{control.disabled=(pendingGrowthUpgrades[control.dataset.downgrade]||0)<=0});if(button){button.disabled=total<=0;button.textContent=total>0?`保存强化（消耗 ${total} 鸡腿）`:'保存强化'}}
  function confirmGrowthUpgrades(){const total=pendingGrowthTotal();if(!total)return;if(progress.chicken<total){message='鸡腿数量不足，无法确认强化';messageT=1;return}const oldMax=player.maxHp;progress.chicken-=total;progress.hpLv+=pendingGrowthUpgrades.hp;progress.atkLv+=pendingGrowthUpgrades.atk;progress.defLv+=pendingGrowthUpgrades.def;player.maxHp=playerMaxHp();player.hp=Math.min(player.maxHp,player.hp+player.maxHp-oldMax);const summary=`血量 +${pendingGrowthUpgrades.hp} · 力量 +${pendingGrowthUpgrades.atk} · 防御 +${pendingGrowthUpgrades.def}`;clearPendingGrowth();saveProgress();message=`强化生效：${summary}`;messageT=1.4}
  function closeGrowthPanel(){const panel=document.querySelector('#growth-panel'),close=document.querySelector('#growth-close');clearPendingGrowth();if(panel)panel.hidden=true;if(close){close.textContent='×';close.classList.remove('advance');close.setAttribute('aria-label','关闭')}if(pendingGrowthAdvance){pendingGrowthAdvance=false;running=true;advanceStage()}}
  function closeRewardModal(resume=true){const modal=document.querySelector('#reward-modal'),summary=document.querySelector('#stage-settlement-summary'),cancel=document.querySelector('#reward-cancel'),exit=document.querySelector('#reward-exit');if(modal)modal.hidden=true;if(summary)summary.hidden=true;if(cancel)cancel.hidden=false;if(exit)exit.hidden=true;pendingReward=null;if(resume)running=rewardResumeRunning;rewardResumeRunning=false}
  function openRewardModal(kind,reason='',mode='resource'){
    const modal=document.querySelector('#reward-modal'),title=document.querySelector('#reward-modal-title'),desc=document.querySelector('#reward-modal-desc'),confirm=document.querySelector('#reward-confirm'),cancel=document.querySelector('#reward-cancel'),exit=document.querySelector('#reward-exit'),summary=document.querySelector('#stage-settlement-summary');if(!modal)return;
    if(summary)summary.hidden=true;cancel.hidden=false;if(exit)exit.hidden=mode!=='defeat';
    rewardResumeRunning=running;running=false;pendingReward={kind,mode};title.textContent=mode==='defeat'?'全员阵亡':'资源补给';
    desc.textContent=mode==='defeat'?'主角和所有队友均已阵亡，本关携带的金币、鸡腿和果实已经掉落。可以满血复活继续此关，或放弃掉落返回初始页。':reason;
    confirm.hidden=true;cancel.textContent=mode==='defeat'?'满血复活继续此关':'取消';modal.hidden=false
  }
  function openStageSettlement(){
    if(stageSettlementOpen)return;stageSettlementOpen=true;expireTemporaryRecruitAfterStage();
    const modal=document.querySelector('#reward-modal'),title=document.querySelector('#reward-modal-title'),desc=document.querySelector('#reward-modal-desc'),confirm=document.querySelector('#reward-confirm'),cancel=document.querySelector('#reward-cancel'),exit=document.querySelector('#reward-exit'),summary=document.querySelector('#stage-settlement-summary');if(!modal)return;
    rewardResumeRunning=false;running=false;pendingReward={mode:'stage-settlement'};title.textContent='关卡结算';desc.textContent=`第 ${currentStageNumber()} 关 · ${trialMaps[mapIndex].name} 已清理完毕 · 难度 ×${stageDifficulty().toFixed(1)}`;
    const clearedStage=currentStageNumber();
    if(!testRunMode&&clearedStage>progress.bestStage){progress.bestStage=clearedStage;saveProgress();if(rankedRunEligible)window.TieJiePlatform?.rank?.submitHighestStage?.(clearedStage)}
    document.querySelector('#settlement-gold').textContent=String(stageRewardTotals.gold);document.querySelector('#settlement-chicken').textContent=String(stageRewardTotals.chicken);document.querySelector('#settlement-fruit').textContent=String(stageRewardTotals.fruit);
    const testAdReady=isTestBuild&&(window.TieJieAdMobTestNative?.getRewardedReadyCount?.()||0)>0;summary.hidden=false;confirm.hidden=!testAdReady;confirm.disabled=false;confirm.textContent='播放测试广告，奖励翻倍';cancel.textContent='领取并分配属性';cancel.hidden=false;if(exit)exit.hidden=true;modal.hidden=false
  }
  function continueAfterStageSettlement(){
    if(pendingReward?.mode!=='stage-settlement')return;stageSettlementOpen=false;closeRewardModal(false);pendingGrowthAdvance=true;running=false;const panel=document.querySelector('#growth-panel'),close=document.querySelector('#growth-close');if(panel)panel.hidden=false;if(close){close.textContent='进入下一关';close.classList.add('advance');close.setAttribute('aria-label','完成加点并进入下一关')}
  }
  let rewardedTestPoll=0;
  function showSettlementTestRewarded(){
    if(pendingReward?.mode!=='stage-settlement'||stageRewardDoubled)return;
    const native=window.TieJieAdMobTestNative,confirm=document.querySelector('#reward-confirm'),cancel=document.querySelector('#reward-cancel'),desc=document.querySelector('#reward-modal-desc');if(!native?.showTestRewarded){if(desc)desc.textContent='测试广告桥不可用';return}
    confirm.disabled=true;cancel.disabled=true;if(desc)desc.textContent='正在加载 Google 官方测试激励广告……';window.TieJieAudio?.pause();
    let state='';try{state=native.showTestRewarded()||''}catch{state='failed:bridge-error'}
    clearInterval(rewardedTestPoll);const started=Date.now();rewardedTestPoll=setInterval(()=>{try{state=native.getRewardedState?.()||state;if(state==='loaded')state=native.showTestRewarded?.()||state}catch{state='failed:bridge-error'}if(state==='loading'&&desc)desc.textContent='正在加载 Google 官方测试激励广告……';else if(state==='showing'&&desc)desc.textContent='测试广告正在播放……';if(!['earned','closed'].includes(state)&&!state.startsWith('failed:')&&Date.now()-started<=65000)return;clearInterval(rewardedTestPoll);rewardedTestPoll=0;confirm.disabled=false;cancel.disabled=false;if(state==='earned'){if(!stageRewardDoubled&&pendingReward?.mode==='stage-settlement'){for(const key of['gold','chicken','fruit'])progress[key]+=stageRewardTotals[key];stageRewardDoubled=true;saveProgress();document.querySelector('#settlement-gold').textContent=String(stageRewardTotals.gold*2);document.querySelector('#settlement-chicken').textContent=String(stageRewardTotals.chicken*2);document.querySelector('#settlement-fruit').textContent=String(stageRewardTotals.fruit*2);message='测试广告完成，双倍奖励已到账';messageT=1.8;continueAfterStageSettlement()}return}if(desc)desc.textContent=state==='closed'?'测试广告未完整观看，奖励没有翻倍':state.startsWith('failed:')?`测试广告失败：${state}`:'测试广告等待超时';window.TieJieAudio?.resume?.()},250)
  }
  function revivePartyFull(){
    lostResources=null;failureHandled=false;failurePopupT=0;partyDefeatPending=false;
    player.hp=player.maxHp;Object.assign(player,{state:'idle',timer:0,z:0,vz:0,knockVx:0,throwVx:0,airLaunch:false,cleanHits:0,attackSpeedTier:0,starAbsorbHits:0,launchKickChargeHits:0,starAbsorbPull:null,inv:2,grab:null,grabTarget:null,grabbed:false,grappleHolder:null,grappleInvincible:false});starAbsorbFx=[];
    for(const c of companions){syncCompanionStats(c);Object.assign(c,{hp:c.maxHp,dead:false,state:'idle',timer:0,z:0,vz:0,knockVx:0,throwVx:0,airLaunch:false,inv:2,grabbed:false,grabVictim:null,grappleHolder:null,grappleInvincible:false,revived:false,rage:false})}
    for(const e of enemies){clearGrapplerHold(e);e.grappleHolder=null;e.grabbed=false;if(enemyAttackStates.has(e.state)){e.state='idle';e.timer=0;e.specialHit=false}}
    closeRewardModal(false);running=true;message='全队满血复活，继续此关！';messageT=1.8
  }
  function abandonDropsAndReturn(){
    if(pendingReward?.mode!=='defeat')return;
    lostResources=null;
    closeRewardModal(false);
    returnToStart()
  }
  function returnToStart(){
    clearPendingGrowth();running=false;testRunMode=false;document.body.classList.add('menu-mode');window.TieJieAudio?.pause();rewardResumeRunning=false;battleMenuResumeRunning=false;pendingGrowthAdvance=false;failureHandled=false;failurePopupT=0;partyDefeatPending=false;stageSettlementOpen=false;stageRewardDoubled=false;stageRewardTotals={gold:0,chicken:0,fruit:0};pendingReward=null;
    for(const k of Object.keys(keys))keys[k]=false;
    const modal=document.querySelector('#reward-modal'),battleMenu=document.querySelector('#battle-menu'),menuToggle=document.querySelector('#battle-menu-toggle'),growthToggle=document.querySelector('#growth-toggle'),growth=document.querySelector('#growth-panel'),growthClose=document.querySelector('#growth-close'),startCard=document.querySelector('#start-card');
    if(modal)modal.hidden=true;if(battleMenu)battleMenu.hidden=true;if(menuToggle)menuToggle.hidden=true;if(growthToggle)growthToggle.hidden=false;if(growth)growth.hidden=true;if(growthClose){growthClose.textContent='×';growthClose.classList.remove('advance')}if(startCard)startCard.style.display='';document.querySelectorAll('.menu-page').forEach(page=>page.hidden=true);const skillPanel=document.querySelector('#skill-panel');if(skillPanel)skillPanel.hidden=true;document.querySelector('#touch-ui')?.classList.remove('active');
    enemies=[];companions=[];projectiles=[];hitFx=[];blastFx=[];resourceFx=[];eliteArmorFx=[];starAbsorbFx=[];player.starAbsorbHits=0;player.launchKickChargeHits=0;message='';messageT=0;refreshStartStageLabel()
  }
  function handleRunFailure(){
    if(failureHandled)return;failureHandled=true;lostResources={gold:progress.gold,chicken:progress.chicken,fruit:progress.fruit};progress.gold=0;progress.chicken=0;progress.fruit=0;saveProgress();
    const growthPanel=document.querySelector('#growth-panel'),battleMenu=document.querySelector('#battle-menu');if(growthPanel)growthPanel.hidden=true;if(battleMenu)battleMenu.hidden=true;openRewardModal('gold','', 'defeat')
  }
  function queueRunFailure(){player.starAbsorbHits=0;player.launchKickChargeHits=0;starAbsorbFx=[];const growthPanel=document.querySelector('#growth-panel');if(growthPanel)growthPanel.hidden=true}
  function updatePartyFailure(dt){
    const defeated=player.hp<=0&&companions.every(c=>c.dead||c.hp<=0);
    if(!defeated){failurePopupT=0;partyDefeatPending=false;return}
    if(failureHandled)return;
    if(!partyDefeatPending){partyDefeatPending=true;failurePopupT=3;message='全员阵亡……3 秒后结算';messageT=3;return}
    failurePopupT=Math.max(0,failurePopupT-dt);if(failurePopupT<=0){partyDefeatPending=false;handleRunFailure()}
  }
  const {enemyCatalog,stageThemes,enemyOrder,enemyNames,enemyAnimationProfiles,trialMaps}=window.TieJieEnemyData;
  const gauntletEnemyTypes=['skinny','heavy','spinner','grappler','axe','assassin','suit','breaker','whip','barbarian'];
  const recruitCatalog=[
    {type:'assassin',price:2500,tempSeconds:180},{type:'axe',price:10000,tempSeconds:160},{type:'suit',price:35000,tempSeconds:145},
    {type:'skinny',price:80000,tempSeconds:130},{type:'heavy',price:180000,tempSeconds:115},{type:'spinner',price:390000,tempSeconds:95},
    {type:'grappler',price:800000,tempSeconds:75},{type:'whip',price:1500000,tempSeconds:55},{type:'barbarian',price:2900000,tempSeconds:40}
  ];
  const selectedRecruitTypes=new Set();
  let pendingRecruitType=null,tempRecruitSaveT=0;
  if(progress.tempRecruit?.type&&recruitCatalog.some(item=>item.type===progress.tempRecruit.type))selectedRecruitTypes.add(progress.tempRecruit.type);
  function recruitInfo(type){return recruitCatalog.find(item=>item.type===type)}
  function recruitUnlocked(type){return isTestBuild||progress.unlockedRecruits.includes(type)}
  function companionSkillCooldown(type){const index=Math.max(0,recruitCatalog.findIndex(item=>item.type===type)),tier=index/Math.max(1,recruitCatalog.length-1),priceBias=.1-tier*.2,stageReduction=Math.min(1.95,Math.max(0,currentStageNumber()-1)*.03);return Math.max(1.45,3.5+Math.random()*.6+priceBias-stageReduction)}
  function enemyName(type,seed,elite=false){const n=enemyNames[type]||[enemyCatalog[type]?.name||'打手'];return elite?`${n[seed%n.length]}·头目`:n[seed%n.length]}
  let currentStageTheme=trialMaps[0].theme;

  function enemy(x,y,type='skinny',name,elite=false,rank=1){const meta=enemyCatalog[type]||enemyCatalog.skinny,difficulty=gauntletMode?1+Math.max(0,rank-1)*.075:stageDifficulty(rank),baseHp=Math.round(meta.hp*difficulty),hp=baseHp*(elite?2:1);return{x,y,z:0,vz:0,level:levelAtPoint(x,y),face:-1,faceHold:0,hp,maxHp:hp,type,rank,difficulty,damage:Math.round(meta.dmg*difficulty*(elite?1.25:1)),speed:meta.spd*ENEMY_MOVE_SPEED_MUL*(1+Math.min(1.5,(difficulty-1)*.03)),state:'idle',timer:0,inv:0,attackT:1+Math.random()*1.3,slamT:type==='heavy'?.9+Math.random()*1.4:99,slideT:type==='skinny'?1.1+Math.random()*1.2:99,specialT:type==='barbarian'?2.8+Math.random()*1.8:.8+Math.random()*1.4,slamTargetX:x,slamHit:false,slideHit:false,name:name||meta.name,elite,dead:false,grabbed:false,revived:false,rage:false,eliteAware:false,eliteArmorCheckT:4,eliteArmorT:0}}
  function syncCompanionStats(c){
    const nextMax=playerMaxHp(),oldMax=c.maxHp||nextMax;
    if(nextMax!==oldMax)c.hp=Math.min(nextMax,Math.max(1,c.hp+nextMax-oldMax));
    c.maxHp=nextMax;c.damage=Math.max(1,Math.round(30*playerAtkMul()));c.speed=225*playerSpeedMul();c.defMul=playerDefMul()
  }
  function spawnSelectedCompanions(){
    companions=[];const type=[...selectedRecruitTypes][0];if(!type)return;
    const unlocked=recruitUnlocked(type),temp=progress.tempRecruit;
    if(!unlocked){
      if(!temp||temp.type!==type){selectedRecruitTypes.clear();return}
      if(temp.pending){temp.pending=false;temp.activeStage=currentStageNumber();saveProgress()}
      if(temp.activeStage!==currentStageNumber()||temp.remaining<=0){progress.tempRecruit=null;selectedRecruitTypes.clear();saveProgress();return}
    }
    const c=enemy(player.x-72,player.y+42,type,`队友·${enemyCatalog[type].name}`,false,1);
    c.companion=true;c.team='player';c.temporary=!unlocked;c.face=1;c.level=player.level;c.attackT=.22;c.specialT=companionSkillCooldown(type);if(type==='heavy')c.slamT=companionSkillCooldown(type);if(type==='skinny')c.slideT=companionSkillCooldown(type);c.followSlot=0;c.state='idle';syncCompanionStats(c);c.hp=c.maxHp;companions.push(c)
  }
  function prepareRecruitment(){
    const type=[...selectedRecruitTypes][0];if(!type)return true;
    if(recruitUnlocked(type))return true;
    const temp=progress.tempRecruit;if(temp?.type===type&&(temp.pending||(temp.activeStage===progress.currentStage&&temp.remaining>0)))return true;
    refreshRecruitPanel('该队友尚未解锁，请先使用金币购买');return false
  }
  function updateTemporaryRecruit(dt){
    const temp=progress.tempRecruit;if(!temp||temp.pending||temp.activeStage!==currentStageNumber())return;
    temp.remaining=Math.max(0,temp.remaining-dt);tempRecruitSaveT+=dt;
    if(temp.remaining<=0){companions=companions.filter(c=>!c.temporary);selectedRecruitTypes.delete(temp.type);progress.tempRecruit=null;tempRecruitSaveT=0;saveProgress();message='临时队友的支援时间结束了';messageT=1.5;return}
    if(tempRecruitSaveT>=1){tempRecruitSaveT=0;saveProgress()}
  }
  function expireTemporaryRecruitAfterStage(){const temp=progress.tempRecruit;if(!temp||temp.pending)return;selectedRecruitTypes.delete(temp.type);progress.tempRecruit=null;tempRecruitSaveT=0;saveProgress()}
  function hurtCompanion(c,dmg,kx,options={}){
    if(c.dead||c.grappleInvincible||(c.inv>0&&!options.ignoreInv))return;const held=!!c.grappleHolder,heavyCasting=c.type==='heavy'&&['slamCharge','slamAir','slamLand'].includes(c.state),axeCasting=c.type==='axe'&&axeArmorStates.has(c.state),armoredCasting=heavyCasting||axeCasting,real=Math.max(1,Math.round(dmg*(c.defMul||1))),blade=options.sourceType==='axe'||options.sourceType==='assassin';c.hp-=real;c.inv=.32;if(!held&&!armoredCasting)c.x+=kx*.35;if(blade)window.TieJieAudio?.hitPlayer(real,options.sourceType);else window.TieJieAudio?.hitEnemy(c.type,real,false);impact(c.x,c.y-c.z-76,real,false,kx);
    if(c.hp<=0&&c.type==='barbarian'&&!c.revived){c.hp=0;c.state='barbarianDown';c.timer=3;c.inv=3;c.z=0;c.vz=0;c.knockVx=0;return}
    if(c.hp<=0){c.hp=0;c.dead=true;c.state='down';c.timer=2.2;message=`${c.name}倒下了，下张地图会归队`;messageT=1.2}else if(armoredCasting){return}else if(held){c.state='grappleHeld';c.timer=Math.max(c.timer,.18)}else if(options.knockdown){c.state='down';c.timer=.9;c.z=Math.max(c.z||0,18);c.vz=Math.max(c.vz||0,options.launchVz||340)}else{c.state='hurt';c.timer=.3}
  }
  function enemySkillTarget(e,xRange,yRange=62,zRange=150,forwardMin=null){
    const targets=[player,...companions].filter(a=>a.hp>0&&!a.dead&&a.level===e.level&&zReach(e,a,zRange)&&Math.abs(a.y-e.y)<yRange).filter(a=>{const dx=(a.x-e.x)*e.face;return forwardMin==null?Math.abs(a.x-e.x)<xRange:dx>forwardMin&&dx<xRange});
    return targets.sort((a,b)=>dist(e,a)-dist(e,b))[0]||null
  }
  function enemyCombatTarget(e){
    const targets=[player,...companions].filter(a=>a.hp>0&&!a.dead);
    return targets.sort((a,b)=>((a.level===e.level?0:650)+dist(e,a))-((b.level===e.level?0:650)+dist(e,b)))[0]||player
  }
  function hurtFriendlyTarget(target,dmg,kx,options={}){if(!target)return false;if(target===player)hurtPlayer(dmg,kx,options);else hurtCompanion(target,dmg,kx,options);return true}
  function knockFriendlyTarget(target,dmg,kx,options={}){if(!target)return false;if(target===player)knockPlayerDown(dmg,kx,options);else hurtCompanion(target,dmg,kx,{...options,knockdown:true});return true}
  function grappleVictimState(victim){return victim===player?'enemyGrabbed':victim.companion?'grappleHeld':'grabbed'}
  function canBeGrappled(victim){return !!(victim&&victim.type!=='heavy'&&!(victim.type==='axe'&&axeArmorStates.has(victim.state))&&!victim.dead&&victim.hp>0)}
  function clearGrapplerHold(holder,victim=holder?.grabVictim){
    if(victim){victim.grabbed=false;victim.grappleHolder=null;if(victim.hp>0&&!victim.dead&&['enemyGrabbed','grappleHeld','grabbed'].includes(victim.state)){victim.state='idle';victim.timer=0}}
    if(holder){holder.grabVictim=null;holder.grappleInvincible=false}
  }
  function pinGrappleVictim(holder,victim,trip=false){
    if(!holder||!canBeGrappled(victim))return false;
    if(victim===player&&player.starAbsorbPull)cancelStarAbsorbPull(false);
    holder.grabVictim=victim;holder.grappleInvincible=true;holder.inv=Math.max(holder.inv||0,.12);
    victim.grabbed=true;victim.grappleHolder=holder;victim.state=grappleVictimState(victim);victim.timer=Math.max(victim.timer||0,.18);victim.face=-holder.face;victim.level=holder.level;
    victim.x=holder.x+holder.face*(trip?27:42);victim.y=holder.y+(trip?12:0);victim.z=trip?4:0;victim.vz=0;victim.knockVx=0;victim.throwVx=0;return true
  }
  function beginGrapplerThrow(holder,victim){
    if(!holder||!victim)return false;
    const damage=holder.companion?Math.max(1,Math.round(holder.damage*1.18)):enemyDmg(holder,1.18),direction=holder.face||1;
    victim.grabbed=false;victim.grappleHolder=null;
    if(victim===player)hurtPlayer(damage,0,{ignoreInv:true,lift:false,timer:.12,sourceType:'grappler'});
    else if(victim.companion)hurtCompanion(victim,damage,0,{ignoreInv:true,sourceType:'grappler'});
    else hurtEnemy(victim,damage,0,{ignoreGrappleInv:true});
    const reviveAfterThrow=victim.type==='barbarian'&&victim.hp<=0&&!victim.revived;
    if(victim.hp<=0&&victim!==player&&!victim.dead&&!reviveAfterThrow){victim.dead=true;if(!victim.companion)player.kills++}
    if(reviveAfterThrow){victim.dead=false;victim.reviveAfterGrappleThrow=true}
    if(victim.hp>0||victim!==player){victim.state='grappleThrown';victim.timer=.95;victim.throwVx=direction*720;victim.z=52;victim.vz=560;victim.airLaunch=true;victim.throwHits=new Set();victim.throwDamage=Math.max(12,Math.round(damage*.72));victim.face=-direction}
    impact(holder.x+direction*34,holder.y-94,damage,victim===player,direction*520);hitStop(.13);return true
  }
  function hitGrappleThrownTarget(actor,target){
    if(!target||target===actor||target.dead||target.hp<=0||target.level!==actor.level||actor.throwHits?.has(target))return false;
    if(Math.abs(target.x-actor.x)>86||Math.abs(target.y-actor.y)>54)return false;
    actor.throwHits?.add(target);const force=Math.sign(actor.throwVx||actor.face||1)*360,damage=actor.throwDamage||18;
    if(enemies.includes(target))hurtEnemy(target,damage,force,{knockdown:true,launchVz:330});else knockFriendlyTarget(target,damage,force*.16,{ignoreInv:true,launchVz:330,sourceType:'grappler'});
    impact(target.x,target.y-(target.z||0)-72,damage,target===player,force);message='被甩飞的人撞倒了一整排！';messageT=.75;return true
  }
  function updateGrappleThrownActor(actor,dt,isEnemyActor){
    if(actor.state!=='grappleThrown'&&actor.state!=='grappleSlide')return false;
    const bounds=laneBoundsFor(actor.level,actor.y,38),targets=isEnemyActor?enemies:[player,...companions];actor.timer=Math.max(0,(actor.timer||0)-dt);
    actor.x=clamp(actor.x+(actor.throwVx||0)*dt,bounds.left,bounds.right);
    for(const target of targets)hitGrappleThrownTarget(actor,target);
    if(actor.state==='grappleThrown'){
      actor.z+=(actor.vz||0)*dt;actor.vz=(actor.vz||0)-1450*dt;
      if(actor.z<=0&&actor.vz<0){actor.z=0;actor.vz=0;actor.airLaunch=false;actor.state='grappleSlide';actor.timer=.72;actor.throwVx*=.78;impact(actor.x,actor.y-18,actor.throwDamage||18,actor===player,-actor.throwVx*.35);shake=Math.max(shake,10)}
    }else{
      actor.z=0;actor.vz=0;actor.throwVx*=Math.pow(.045,dt);
      if(actor.timer<=0||Math.abs(actor.throwVx)<24){actor.throwVx=0;actor.airLaunch=false;if(actor.reviveAfterGrappleThrow){actor.reviveAfterGrappleThrow=false;actor.state='barbarianDown';actor.timer=3;actor.inv=3}else{actor.state='down';actor.timer=actor.dead?2.2:1.05}}
    }
    return true
  }
  function companionCanHit(c,t,xRange,yRange=62,zRange=150){return !!(t&&!t.dead&&(!t.grabbed||t.grappleHolder)&&t.level===c.level&&Math.abs(t.x-c.x)<xRange&&Math.abs(t.y-c.y)<yRange&&zReach(c,t,zRange))}
  function companionStrike(c,t,mult=1,force=230,options={}){if(!companionCanHit(c,t,options.range||112,options.yRange||62,options.zReach||150))return false;hurtEnemy(t,Math.max(1,Math.round(c.damage*mult)),c.face*force,options);return true}
  function startCompanionSpecial(c,t,d){
    c.target=t;c.specialHit=false;c.specialDone=false;
    if(c.type==='suit'&&d<168){const daggerReady=(c.suitDaggerT||0)<=0,backflipReady=(c.suitBackflipT||0)<=0;if(!daggerReady&&!backflipReady)return false;const backflip=backflipReady&&(!daggerReady||d<112);c.state=backflip?'suitBackflip':'suitDagger';c.timer=backflip?.92:.72;c.suitHits=backflip?null:[false,false,false,false];if(backflip)c.suitBackflipT=2;else c.suitDaggerT=companionSkillCooldown(c.type);return true}
    c.specialT=companionSkillCooldown(c.type);
    if(c.type==='barbarian'&&d<(c.rage?380:300)){c.state='barbarianCharge';c.timer=c.rage?.52:.82;return true}
    if(c.type==='spinner'){c.state='spinAir';c.timer=.78;c.z=65;c.spinVx=c.face*310;return true}
    if(c.type==='grappler'&&canBeGrappled(t)&&!t.grabbed&&d<145&&Math.abs(t.y-c.y)<64){c.state='enemyGrabWindup';c.timer=.34;return true}
    if(c.type==='axe'&&d<170){c.state='axeWindup';c.timer=.48;return true}
    if(c.type==='assassin'&&d<360){c.state='teleport';c.timer=.34;c.z=0;return true}
    if(c.type==='whip'&&d<470&&Math.abs(t.y-c.y)<76){c.state='whipWindup';c.timer=.22;return true}
    return false
  }
  function companionSlamImpact(c){impact(c.x,c.y-20,null,false,0);c.slamHit=true;for(const e of enemies){if(e.dead||e.level!==c.level)continue;const dx=e.x-c.x,dy=(e.y-c.y)*1.35;if(e.z<55&&Math.hypot(dx,dy)<145)hurtEnemy(e,Math.round(c.damage*.86),Math.sign(dx||c.face)*300,{knockdown:true,launchVz:360})}}
  function updateCompanionSpecialState(c,dt){
    const t=c.target;
    if(c.state==='barbarianDown'){c.timer-=dt;if(c.timer<=0){c.state='barbarianRevive';c.timer=1.12;c.inv=1.2}return true}
    if(c.state==='barbarianRevive'){c.timer-=dt;c.inv=Math.max(c.inv,.12);if(c.timer<=0){c.revived=true;c.rage=true;c.hp=Math.max(1,Math.round(c.maxHp*.38));c.state='barbarianUppercut';c.timer=.56;c.specialHit=false;c.inv=.65;c.specialT=companionSkillCooldown(c.type)}return true}
    if(c.state==='barbarianCharge'){c.timer-=dt;const b=laneBoundsFor(c.level,c.y,50);c.x=clamp(c.x+c.face*(c.rage?430:350)*dt,b.left,b.right);if(t&&!t.dead)c.y+=(t.y-c.y)*Math.min(1,dt*3);if(!c.specialHit&&companionStrike(c,t,.55,380,{range:78,yRange:55})){c.state='barbarianUppercut';c.timer=.56;c.specialHit=false;if(t&&!t.dead)setEnemyFace(c,t.x-c.x,true);return true}if(c.timer<=0){c.state='barbarianUppercut';c.timer=.56;c.specialHit=false}return true}
    if(c.state==='barbarianUppercut'){c.timer-=dt;if(!c.specialHit&&c.timer<.31&&companionStrike(c,t,1.1,620,{range:125,yRange:62,knockdown:true,launchVz:c.rage?820:720})){c.specialHit=true}if(c.timer<=0)c.state='idle';return true}
    if(c.state==='spinAir'){c.timer-=dt;const b=laneBoundsFor(c.level,c.y,45);c.x=clamp(c.x+(c.spinVx||0)*dt,b.left,b.right);c.z=55+Math.sin((1-c.timer/.78)*Math.PI)*45;if(!c.specialHit&&companionStrike(c,t,1.05,470,{range:86,yRange:58,zReach:145,knockdown:true,launchVz:410})){c.specialHit=true}if(c.timer<=0){c.z=0;c.state='idle'}return true}
    if(c.state==='enemyGrabWindup'){c.timer-=dt;if(t&&!t.dead)c.y+=(t.y-c.y)*Math.min(1,dt*8);if(c.timer<=0){if(companionCanHit(c,t,110,55,110)&&pinGrappleVictim(c,t)){c.state='enemyGrabbed';c.timer=.46;message='擒拿手锁死关节，目标无法反抗！';messageT=.8}else c.state='idle'}return true}
    if(c.state==='enemyGrabbed'){c.timer-=dt;const victim=c.grabVictim||t;if(!pinGrappleVictim(c,victim)){clearGrapplerHold(c,victim);c.state='idle';return true}if(c.timer<=0){c.state='grappleTrip';c.timer=.38}return true}
    if(c.state==='grappleTrip'){c.timer-=dt;const victim=c.grabVictim||t;if(!pinGrappleVictim(c,victim,true)){clearGrapplerHold(c,victim);c.state='idle';return true}if(c.timer<=0){c.state='enemyThrow';c.timer=.42;c.specialHit=false}return true}
    if(c.state==='enemyThrow'){c.timer-=dt;const victim=c.grabVictim||t;c.grappleInvincible=true;c.inv=Math.max(c.inv,.12);if(!c.specialHit&&c.timer<.27&&victim){c.specialHit=beginGrapplerThrow(c,victim);message='绊腿、拧腰——甩出去！';messageT=.8}if(c.timer<=0){clearGrapplerHold(c,victim);c.state='idle'}return true}
    if(c.state==='axeWindup'){c.timer-=dt;if(c.timer<=0){c.state='axeSlash';c.timer=.78;c.axeHits=[false,false,false]}return true}
    if(c.state==='axeSlash'){const prev=c.timer;c.timer-=dt;const elapsed=.78-c.timer,hitTimes=[.12,.34,.56];for(let i=0;i<hitTimes.length;i++){if(!c.axeHits[i]&&prev>.78-hitTimes[i]&&elapsed>=hitTimes[i]){c.axeHits[i]=true;companionStrike(c,t,.55,250+i*55,{range:112,yRange:58,zReach:130})}}if(c.timer<=0)c.state='idle';return true}
    if(c.state==='teleport'){c.timer-=dt;if(!c.specialDone&&c.timer<.17){c.specialDone=true;if(t&&!t.dead){c.x=clamp(t.x-t.face*78,70,WORLD_W-70);c.y=t.y;c.level=t.level;setEnemyFace(c,t.x-c.x,true)}c.state='stab';c.timer=.32;c.specialHit=false}return true}
    if(c.state==='stab'){c.timer-=dt;if(!c.specialHit&&companionStrike(c,t,1.25,360,{range:92,yRange:52,zReach:120})){c.specialHit=true}if(c.timer<=0)c.state='idle';return true}
    if(c.state==='suitDagger'){const prev=c.timer;c.timer-=dt;const elapsed=.72-c.timer,hitTimes=[.16,.32,.48,.64];for(let i=0;i<hitTimes.length;i++){if(!c.suitHits[i]&&prev>.72-hitTimes[i]&&elapsed>=hitTimes[i]){c.suitHits[i]=true;companionStrike(c,t,i===3?.48:.3,0,{range:i===3?132:120,yRange:54,zReach:125,timer:.24,hitStop:.045})}}if(c.timer<=0)c.state='idle';return true}
    if(c.state==='suitBackflip'){c.timer-=dt;const p=clamp(1-c.timer/.92,0,.9999),b=laneBoundsFor(c.level,c.y,48);c.x=clamp(c.x-c.face*(p<.78?236:84)*dt,b.left,b.right);if(!c.specialHit&&p>.38&&p<.68&&companionStrike(c,t,.9,560,{range:128,yRange:62,zReach:140,knockdown:true,launchVz:440}))c.specialHit=true;if(c.timer<=0){c.state='idle';c.attackT=.5}return true}
    if(c.state==='whipWindup'){c.timer-=dt;if(c.timer<=0){c.state='whipStrike';c.timer=.36;c.specialHit=false}return true}
    if(c.state==='whipStrike'){c.timer-=dt;const dx=t?(t.x-c.x)*c.face:0;if(!c.specialHit&&t&&!t.dead&&dx>45&&dx<340&&companionStrike(c,t,1.05,520,{range:340,yRange:46,zReach:160,knockdown:true,launchVz:360})){c.specialHit=true}if(c.timer<=0)c.state='idle';return true}
    if(c.state==='slamCharge'){c.timer-=dt;if(t&&!t.dead)c.slamTargetX=clamp(t.x,c.x-95,c.x+95);if(c.timer<=0){c.state='slamAir';c.timer=1.15;c.z=1;c.vz=610;c.slamHit=false}return true}
    if(c.state==='slamAir'){c.timer-=dt;c.x+=(c.slamTargetX-c.x)*Math.min(1,dt*3.2);c.z+=c.vz*dt;c.vz-=1320*dt;if(c.z<=0&&c.vz<0){c.z=0;c.vz=0;c.state='slamLand';c.timer=.5;if(!c.slamHit)companionSlamImpact(c)}return true}
    if(c.state==='slamLand'){c.timer-=dt;if(c.timer<=0)c.state='idle';return true}
    if(c.state==='slideWindup'){c.timer-=dt;if(c.timer<=0){c.state='slide';c.timer=.58;c.slideHit=false}return true}
    if(c.state==='slide'){const b=laneBoundsFor(c.level,c.y,55);c.timer-=dt;c.x=clamp(c.x+c.face*430*dt,b.left,b.right);if(t&&!t.dead)c.y+=(t.y-c.y)*Math.min(1,dt*2.6);if(!c.slideHit&&companionStrike(c,t,.7,420,{range:76,yRange:48,zReach:58,knockdown:true,launchVz:320})){c.slideHit=true}if(c.timer<=0){c.state='idle';c.attackT=.65}return true}
    return false
  }
  function updateCompanion(c,dt){
    syncCompanionStats(c);c.inv=Math.max(0,c.inv-dt);c.attackT=Math.max(0,c.attackT-dt);c.specialT=Math.max(0,c.specialT-dt);c.suitDaggerT=Math.max(0,(c.suitDaggerT||0)-dt);c.suitBackflipT=Math.max(0,(c.suitBackflipT||0)-dt);c.slamT=Math.max(0,c.slamT-dt);c.slideT=Math.max(0,c.slideT-dt);
    if(updateGrappleThrownActor(c,dt,false))return;
    if(c.dead){c.timer=Math.max(0,c.timer-dt);return}
    if((c.state==='down'||c.state==='hurt')&&(c.z>0||c.vz)){c.z+=c.vz*dt;c.vz-=1450*dt;if(c.z<=0){c.z=0;c.vz=0}}
    if(updateCompanionSpecialState(c,dt))return;
    if(c.timer>0){
      c.timer-=dt;
      if(c.timer<=0)c.state='idle';return
    }
    let target=null,best=460;
    for(const e of enemies){if(e.dead||(e.grabbed&&!e.grappleHolder)||e.level!==c.level)continue;const d=dist(c,e);if(d<best){best=d;target=e}}
    if(!target){
      if(c.level!==player.level||Math.abs(c.x-player.x)>620){c.level=player.level;c.x=player.x-70-(c.followSlot%3)*58;c.y=player.y+36+Math.floor(c.followSlot/3)*30}
      const tx=player.x-player.face*(82+(c.followSlot%3)*54),ty=player.y+30+Math.floor(c.followSlot/3)*32,dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);
      if(d>28){const move=forestSteeredVector(c,tx,ty),moveD=Math.hypot(move.dx,move.dy)||1;c.state='run';c.face=Math.sign(move.dx)||c.face;c.x+=move.dx/moveD*c.speed*dt;c.y+=move.dy/moveD*c.speed*.68*dt}else c.state='idle';return
    }
    c.target=target;const dx=target.x-c.x,dy=target.y-c.y,d=Math.hypot(dx,dy*1.25);setEnemyFace(c,dx,true);
    if((c.type==='suit'||c.specialT<=0)&&startCompanionSpecial(c,target,d))return;
    if(c.type==='heavy'&&c.slamT<=0&&d<225){c.state='slamCharge';c.timer=.72;c.slamTargetX=target.x;c.attackT=1.2;c.slamT=companionSkillCooldown(c.type);return}
    if(c.type==='skinny'&&c.slideT<=0&&d<310){c.state='slideWindup';c.timer=.24;c.slideT=companionSkillCooldown(c.type);return}
    if(c.type==='whip'){
      const b=laneBoundsFor(c.level,c.y,55),safe=235;
      if(Math.abs(dy)>34){c.state='run';c.y+=Math.sign(dy)*c.speed*.62*dt;return}
      if(Math.abs(dx)<safe){c.state='run';c.x=clamp(c.x-Math.sign(dx||c.face)*c.speed*1.15*dt,b.left,b.right);return}
      if(Math.abs(dx)>390){c.state='run';c.x+=Math.sign(dx)*c.speed*.82*dt;return}
      c.state='idle';return
    }
    if(d>78){const move=forestSteeredVector(c,target.x,target.y);c.state='run';c.x+=Math.sign(move.dx)*c.speed*dt;c.y+=Math.sign(move.dy)*c.speed*.62*dt}
    else c.state='idle';
    // 不在队友逻辑里伪造敌人的近身反击；伤害必须来自敌人自己的招式状态。
    const b=laneBoundsFor(c.level,c.y,42);c.x=clamp(c.x,b.left,b.right)
  }
  function setEnemyFace(e,direction,force=false){const next=Math.sign(direction);if(!next||next===e.face)return true;if(!force&&(e.faceHold||0)>0)return false;e.face=next;e.faceHold=1;return true}
  function enemyStandSpots(gate,count){
    const spots=[];
    const minX=gate.start+180,maxX=gate.end-160;
    for(let i=0;i<count+3;i++){
      const x=clamp(minX+(maxX-minX)*(i+1)/(count+4)+(Math.random()-.5)*180,minX,maxX);
      const y=555+Math.random()*34;
      spots.push({x,y,level:0,kind:'ground'});
    }
    for(const p of currentPlatforms()){
      const left=Math.max(minX,p.minX+120),right=Math.min(maxX,p.maxX-130);
      if(right<=left)continue;
      const y=p.minY+(p.maxY-p.minY)*(Math.random()*.65+.18),b=platformBoundsAtY(y,p);
      spots.push({x:clamp(left+Math.random()*(right-left),b.left+70,b.right-70),y,level:p.level,kind:'platform'});
    }
    return spots;
  }
  function spawnBunkerResidents(rank){
    for(const bunker of activeTerrain().bunkers||[])for(const room of bunker.rooms)for(const resident of room.residents){
      const e=enemy(resident.x,resident.y,resident.type,enemyName(resident.type,rank+room.index+resident.x,false),false,rank);
      e.level=-1;e.subPit={left:bunker.left,right:bunker.right,y:bunker.y,bunker,pit:bunker.leftPit};e.spawnKind='bunker';e.bunkerRoom=room;e.homeX=e.x;e.homeY=e.y;e.awake=false;enemies.push(e)
    }
  }
  function spawnGate(){
    const map=trialMaps[mapIndex],gate={start:120,end:6040,boss:true,enemies:map.gates.flatMap(g=>g.enemies)},rank=currentStageNumber();currentStageTheme=map.theme;gatePhase='combat';stageLockX=35;stageRightX=SURFACE_WORLD_W-35;cameraLockX=0;enemies=[];
    if(freeTourMode){gatePhase='tour';stageLockX=70;stageRightX=SURFACE_WORLD_W-70;cameraLockX=0;powerSwitch=null;message=`自由游览：${map.name}，敌人已关闭`;messageT=2;return}
    const spots=enemyStandSpots(gate,gate.enemies.length),platformSpots=spots.filter(s=>s.kind==='platform').sort((a,b)=>a.x-b.x),pitSpots=spots.filter(s=>s.kind==='pit'),used=[];
    const specs=gate.enemies.slice();
    const selectedPitSpots=pitSpots.filter(()=>Math.random()<.5);
    while(specs.length<platformSpots.length+selectedPitSpots.length){const index=specs.length;specs.push({type:index%2?'heavy':'skinny',dx:220+index*260,y:570})}
    const regularIndexes=specs.map((spec,index)=>({spec,index})).filter(({spec})=>!spec.elite).map(({index})=>index);
    for(let i=regularIndexes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[regularIndexes[i],regularIndexes[j]]=[regularIndexes[j],regularIndexes[i]]}
    const pitAssignments=new Map();selectedPitSpots.slice(0,regularIndexes.length).forEach((spot,index)=>pitAssignments.set(regularIndexes[index],spot));
    for(let i=0;i<specs.length;i++){
      const spec=specs[i],type=spec.type,elite=!!spec.elite,name=gate.boss&&elite?map.boss:enemyName(type,rank+(spec.dx||i),elite);
      let spot=pitAssignments.get(i)||platformSpots.find(s=>!used.includes(s))||spots.find(s=>!used.includes(s)&&s.kind==='ground')||spots.find(s=>!used.includes(s)&&s.kind!=='pit')||{x:clamp(gate.start+(spec.dx||220+i*260),gate.start+180,gate.end-160),y:spec.y||570,level:0,kind:'ground'};
      used.push(spot);
      const e=enemy(spot.x,spot.y,type,name,elite,rank);e.level=spot.level;e.subPit=spot.subPit||null;e.spawnKind=spot.kind||'ground';e.homeX=spot.x;e.homeY=spot.y;e.awake=false;enemies.push(e)
    }
    spawnBunkerResidents(rank);
    const breaker=enemies.find(e=>e.type==='breaker'&&e.level>=0);powerSwitch=currentStageTheme==='高楼'?null:breaker?{x:clamp(breaker.x+150,gate.start+210,gate.end-120),y:breaker.y,level:breaker.level,on:true,flash:0}:null;
    message=breaker?'整张地图已开放；断电工正往电闸走':`${map.name} · 全场开放，无场景隔断`;messageT=2.2
  }
  function loadMap(index){
    forestHives=[];player.swampDepth=0;player.swampDead=false;player.swampEscaped=false;
    gauntletMode=false;failureHandled=false;failurePopupT=0;partyDefeatPending=false;lostResources=null;jumpSourcePlatform=null;jumpPlatformCleared=false;closeRewardModal(false);
    const maxHp=playerMaxHp();mapIndex=index;if(!testRunMode){progress.currentStage=currentStageNumber();saveProgress()}stageRewardTotals={gold:0,chicken:0,fruit:0};stageChickenBudget=stageChickenReward();stageChickenDropped=0;stageSettlementOpen=false;stageRewardDoubled=false;window.TieJieAudio?.playMusic(mapIndex);gateIndex=0;gatePhase='combat';stageLockX=70;stageRightX=1050;cameraLockX=0;cameraX=0;currentStageTheme=trialMaps[mapIndex].theme;generatedTerrain=generateFreshTerrain(currentStageTheme,mapIndex);Object.assign(player,{x:220,y:566,z:0,vz:0,knockVx:0,throwVx:0,airLaunch:false,level:0,face:1,hp:maxHp,maxHp,state:'idle',timer:0,combo:0,comboT:0,kickCombo:0,kickComboT:0,cleanHits:0,attackSpeedTier:0,starAbsorbHits:0,launchKickChargeHits:0,starAbsorbPull:null,grab:null,grabTarget:null,grabbed:false,grappleHolder:null,grappleInvincible:false,grabT:0,grabEscapeT:0,grabKickQueue:0,grabKickTotal:0,risingQueued:false,risingCooldown:0,risingAirInv:false,risingInvT:0,held:null,heldUses:0,inv:0,kills:player.kills||0,inputQueue:[],climb:null,fallDamage:0,fallFromLevel:null,fallStartY:null,subPit:null,pitSafeT:0,launchKickChainCount:0,launchKickChainQueued:0});
    spawnSelectedCompanions();pickups=freeTourMode?[]:[{type:'grenade',x:620,y:570,level:0,active:true},{type:'hammer',x:860,y:570,level:0,active:true,throwsLeft:2},{type:'grenade',x:2350,y:575,level:0,active:true},{type:'hammer',x:3920,y:570,level:0,active:true,throwsLeft:2},{type:'grenade',x:5200,y:570,level:0,active:true}];projectiles=[];hitFx=[];blastFx=[];resourceFx=[];eliteArmorFx=[];starAbsorbFx=[];screenTint=0;wave=1;spawnGate();updateCamera()
  }
  function reset(){player.kills=0;setStagePosition(progress.currentStage,false);loadMap(mapIndex)}
  function restartCurrentStage(){if(gauntletMode){startGauntlet();return}const stage=currentStageNumber();player.kills=0;loadMap(mapIndex);message=`重新开始第 ${stage} 关`;messageT=1}
  function spawnGauntletEnemy(){
    const type=gauntletEnemyTypes[gauntletIndex],rank=gauntletIndex+3;
    const groundSpots=[{x:560,y:552,level:0},{x:940,y:614,level:0},{x:1080,y:548,level:0},{x:670,y:616,level:0}];
    const spot=groundSpots[gauntletIndex%groundSpots.length];
    const e=enemy(spot.x,spot.y,type,enemyName(type,rank+17,gauntletEliteMode),gauntletEliteMode,rank);e.level=spot.level;e.subPit=spot.subPit||null;e.homeX=e.x;e.homeY=e.y;e.awake=false;enemies=[e];
    powerSwitch=null;currentStageTheme='沙漠';
    player.hp=Math.min(player.maxHp,player.hp+34);
    message=`${gauntletEliteMode?'精英':''}轮番战 ${gauntletIndex+1} / ${gauntletEnemyTypes.length}：${enemyCatalog[type].name}`;
    messageT=1.6;
  }
  function startGauntlet(){
    gauntletMode=true;failureHandled=false;failurePopupT=0;partyDefeatPending=false;lostResources=null;stageRewardTotals={gold:0,chicken:0,fruit:0};stageSettlementOpen=false;stageRewardDoubled=false;jumpSourcePlatform=null;jumpPlatformCleared=false;closeRewardModal(false);gauntletIndex=0;wave=1;mapCycle=0;mapIndex=1;window.TieJieAudio?.playMusic(mapIndex);gateIndex=0;gatePhase='combat';stageLockX=70;stageRightX=1860;cameraLockX=0;currentStageTheme='沙漠';generatedTerrain=generateThemeTerrain(currentStageTheme,0x7eed1234);generatedTerrain.pits=[normalizePit({x:1460,w:118,name:'测试暗坑'},'沙漠',Math.random)];desertPits=generatedTerrain.pits;
    const maxHp=playerMaxHp();Object.assign(player,{x:220,y:566,z:0,vz:0,knockVx:0,throwVx:0,airLaunch:false,level:0,face:1,hp:maxHp,maxHp,state:'idle',timer:0,combo:0,comboT:0,kickCombo:0,kickComboT:0,cleanHits:0,attackSpeedTier:0,starAbsorbHits:0,launchKickChargeHits:0,starAbsorbPull:null,grab:null,grabTarget:null,grabbed:false,grappleHolder:null,grappleInvincible:false,grabT:0,grabEscapeT:0,grabKickQueue:0,grabKickTotal:0,risingQueued:false,risingCooldown:0,risingAirInv:false,risingInvT:0,held:null,heldUses:0,inv:.35,kills:0,inputQueue:[],climb:null,fallDamage:0,fallFromLevel:null,fallStartY:null,subPit:null,pitSafeT:0,launchKickChainCount:0,launchKickChainQueued:0});
    spawnSelectedCompanions();pickups=[{type:'hammer',x:520,y:570,level:0,active:true,throwsLeft:2},{type:'grenade',x:650,y:570,level:0,active:true}];projectiles=[];hitFx=[];blastFx=[];resourceFx=[];eliteArmorFx=[];starAbsorbFx=[];screenTint=0;spawnGauntletEnemy();updateCamera()
  }
  function act(name,fromQueue=false){if(!running||player.hp<=0||player.climb)return;if(player.state==='starAbsorbPull')return;if(player.state==='down'&&player.z===0&&name==='punch'&&hasSkill('downRisingPunch')){startRisingPunch('down');return}if(player.state==='hurt'||player.state==='down'||player.state==='fall')return;
    if(player.state==='overChestThrow'&&player.timer>0){player.inputQueue.length=0;return}
    if(player.state==='grabKnee'&&player.timer>0){if(player.grab&&name==='kick')queueKneeStrike();return}
    if(player.grab&&name==='punch'){overChestThrow();return}
    if(player.grab&&name==='kick'){queueKneeStrike();return}
    if(player.state==='jumpCrouch'&&name==='punch'&&!player.held){if(hasSkill('risingPunch')&&player.risingCooldown<=0&&!player.risingQueued){player.risingQueued=true;player.risingAirInv=false;player.risingInvT=0;player.timer=Math.max(player.timer,.48);message='蹲住……这一拳不能急';messageT=.75}return}
    if(player.state==='jumpCrouch'&&name==='kick'){if(hasSkill('launchKick'))startLaunchKick();return}
    if(name==='kick'&&queueLaunchKickChain())return
    const locked=['punch1','punch2','punch3','kick1','kick2','backKick','airBackKick','risingPunch','throwItem','throw','pickup','doorPush','grabAttempt','grabRelease','grabKnee','jumpCrouch','jumpLand','getUp'].includes(player.state)&&player.timer>0;if(locked&&!fromQueue){if(['punch','kick','jump'].includes(name)&&player.inputQueue.length<2)player.inputQueue.push(name);return}
    if(player.held&&name==='punch'){throwHeld();return}
    if(name==='jump'){if(player.z===0&&!player.grab){const standingPlatform=player.level>0?platformForLevel(player.level):null;jumpSourcePlatform=standingPlatform&&insidePlatform(player.x,player.y,0,standingPlatform)?standingPlatform:null;jumpPlatformCleared=false;player.vz=0;player.airOrigin='self';player.risingQueued=false;player.risingAirInv=false;player.risingInvT=0;player.state='jumpCrouch';player.timer=.14}return}
    if(name==='grab'){
      if(player.grab){message='抓稳了……出拳过胸摔，出腿膝撞';messageT=.9;return}
      if(player.held){message='手里已经有家伙了……先扔出去';messageT=1;return}
      let item=null,itemDist=76;for(const p of pickups){if(!p.active||['coin','chicken','fruit'].includes(p.type)||p.level!==player.level)continue;const d=Math.hypot(player.x-p.x,player.y-p.y);if(d<itemDist){item=p;itemDist=d}}if(item){item.active=false;player.held=item.type;player.heldUses=item.type==='hammer'?(item.throwsLeft??2):1;player.state='pickup';player.timer=.48;player.inputQueue.length=0;message=item.type==='grenade'?'蹲下捡起手榴弹……近点扔':`蹲下捡起战锤……还能投 ${player.heldUses} 次`;messageT=1.7;return}
      if(!hasSkill('grapple')){message='我的手劲不够';messageT=1.1;return}
      const ungrab=nearestUngrabbable(90);player.grabTarget=nearest(82);player.state='grabAttempt';player.timer=.48;player.inputQueue.length=0;message=player.grabTarget?'抓住他！':ungrab?`这家伙不好抓……硬来要吃亏`:'抓空了……破绽太大';messageT=.7;return
    }
    if(name==='punch'){
      if(player.state==='jump'||player.z>0)return;
      player.combo=player.comboT>0?(player.combo%3)+1:1;player.comboT=.72;player.state='punch'+player.combo;
      const punches=[null,{timer:.28,range:78,damage:11,force:145,delay:95,lunge:12},{timer:.31,range:78,damage:14,force:185,delay:115,lunge:15},{timer:.43,range:78,damage:24,force:540,delay:215,lunge:20,knockdown:true,launchVz:520}];
      const punch=punches[player.combo],blueFlame=hasSkill('blueFlame');player.timer=punch.timer;combatAttack(punch.range,punch.damage,punch.force,punch.delay,punch.lunge,{knockdown:punch.knockdown,launchVz:punch.launchVz,blueFistFlame:blueFlame,bonusDamage:blueFlame?BLUE_FIST_FLAME_BONUS:0});if(player.combo===3){message='下巴露出来了！';messageT=.9}return
    }
    if(name==='kick'){
      if(!hasSkill('legArts'))return;
      if(player.state==='jump'||player.z>0){resetLaunchKickChain();player.launchKick=false;player.launchKickTime=0;player.launchKickSpeed=0;player.launchKickFace=0;player.state='airBackKick';player.timer=.62;combatAttack(legAttackRange(136),15,640,285,24,{knockdown:true,launchVz:420,zReach:128});message='空中也别想近我身！';messageT=.62;return}
      player.kickCombo=player.kickComboT>0?(player.kickCombo%3)+1:1;player.kickComboT=1.08;
      if(player.kickCombo===1){player.state='kick1';player.timer=.45;combatAttack(legAttackRange(136),15,210,215,15);message='先压住他的步子';messageT=.45;return}
      if(player.kickCombo===2){player.state='kick2';player.timer=.45;combatAttack(legAttackRange(136),21,310,245,22);message='别让他站稳';messageT=.45;return}
      player.state='backKick';player.timer=.6;combatAttack(legAttackRange(136),35,730,415,31,{knockdown:true,launchVz:460});message='转过去，把力踹透！';messageT=.6;return
    }
  }
  function nearbyBunkerDoor(){
    const bunker=player.level<0&&player.subPit?.bunker;if(!bunker)return false;
    let door=null,best=92;for(const candidate of bunker.doors){if(candidate.opened)continue;const d=Math.abs(player.x-candidate.x);if(d<best){door=candidate;best=d}}
    return door
  }
  function tryPushBunkerDoor(){
    const door=nearbyBunkerDoor();if(!door)return false;const bunker=player.subPit.bunker;
    door.opened=true;door.openedT=.55;
    const before=bunker.rooms[door.index-1],after=bunker.rooms[door.index];if(before)before.opened=true;if(after)after.opened=true;
    player.state='doorPush';player.timer=.42;player.inputQueue.length=0;player.face=1;message=after?'石门被推开，下一间房亮起来了':'最后一道石门打开，出口露出来了';messageT=1.25;hitStop(.05);return true
  }
  function startLaunchKick(){
    const intent=(keys.right?1:0)-(keys.left?1:0);if(intent)player.face=Math.sign(intent);
    resetLaunchKickChain();player.risingQueued=false;player.inputQueue.length=0;player.launchKick=true;player.launchKickTime=.5;player.launchKickSpeed=1000;player.launchKickFace=player.face;player.state='airBackKick';player.timer=.5;player.vz=300;player.knockVx=0;
    combatAttack(legAttackRange(136),15,640,200*playerAttackSpeedMul(),0,{knockdown:true,launchVz:420,zReach:128,launchKickCarry:780});message='蹬地弹射——飞踢！';messageT=.95
  }
  function startRisingPunch(mode='ground'){player.risingQueued=false;player.risingCooldown=1;player.risingAirInv=true;player.risingInvT=.34;player.airOrigin='self';player.state='risingPunch';player.timer=.56;player.vz=560;player.inv=Math.max(player.inv,.34);combatAttack(122,30,610,95,12,{knockdown:true,launchVz:760});message=mode==='down'?'倒地也能还这一拳！':mode==='absorb'?'聚势收拳——升龙！':'就是现在，冲上去！';messageT=.7}
  const counterGrabTypes=new Set(['heavy','grappler']);
  const axeArmorStates=new Set(['axeWindup','axeSlash']);
  const defeatedReviveStates=new Set(['barbarianDown','barbarianRevive']);
  function canGrabEnemy(e){return !!(e&&e.hp>0&&!e.dead&&enemyCatalog[e.type]?.grab)&&!defeatedReviveStates.has(e.state)&&!(e.eliteArmorT>0)&&!e.grappleInvincible&&!e.grabVictim&&!(e.type==='axe'&&axeArmorStates.has(e.state))}
  function zReach(a,b,reach=96){const az=a.z||0,bz=b.z||0;return Math.abs(az-bz)<=reach||(az===0&&bz<=reach)||(bz===0&&az<=reach)}
  function triggerCounterGrab(e){
    clearGrapplerHold(e);player.grabTarget=null;e.grabbed=false;e.state='counterGrab';e.timer=.64;e.attackT=Math.max(e.attackT||0,.9);e.inv=Math.max(e.inv||0,.64);setEnemyFace(e,player.x-e.x,true);
    const technical=e.type==='grappler',damage=technical?12:9,push=e.face*(technical?34:42);
    hurtPlayer(damage,push,{ignoreInv:true,lift:false,timer:.54,sourceType:e.type});
    message=technical?'擒拿手扣腕转身——反抓！':'胖打手沉肩撑臂——抓被震开了！';messageT=1.05;shake=Math.max(shake,technical?10:13);hitStop(.12)
  }
  function beginPlayerGrab(e){
    player.grab=e;player.grabTarget=null;player.grabT=0;player.grabEscapeT=GRAB_MAX_DURATION;player.grabKickQueue=0;player.grabKickTotal=0;player.grappleInvincible=hasSkill('invincibleGrapple');player.risingAirInv=player.grappleInvincible;e.grabbed=true;e.state='grabbed';e.z=player.z||0;e.vz=player.vz||0;player.state='grab';player.timer=.15;hitStop(.06)
  }
  function enemiesInStarAbsorbCone(range=350){const coneSlope=Math.tan(35*Math.PI/180);return enemies.filter(e=>{if(e.dead||e.hp<=0||e.grabbed||e.level!==player.level||defeatedReviveStates.has(e.state))return false;const forward=(e.x-player.x)*player.face,lateral=(e.y-player.y)*1.35,distance=Math.hypot(forward,lateral);return forward>0&&distance<=range&&Math.abs(lateral)<=forward*coneSlope})}
  function useStarAbsorb(){
    if((player.starAbsorbHits||0)<SKILL_CHARGE_MAX)return false;player.starAbsorbHits=0;player.inputQueue.length=0;player.starAbsorbPull={elapsed:0,duration:2,face:player.face||1,seed:Math.random()*Math.PI*2};player.state='starAbsorbPull';player.timer=2;player.knockVx=0;player.vz=0;message='聚势之握——松手便升龙！';messageT=.9;shake=Math.max(shake,5);return true
  }
  function cancelStarAbsorbPull(followWithRising=false){
    if(!player.starAbsorbPull)return;player.starAbsorbPull=null;player.timer=0;
    if(followWithRising&&running&&player.hp>0&&player.state!=='enemyGrabbed'){player.state=player.z>0?'jump':'idle';startRisingPunch('absorb')}else if(player.state==='starAbsorbPull')player.state=player.z>0?'jump':'idle'
  }
  function updateStarAbsorbPull(dt){
    const pull=player.starAbsorbPull;if(!pull)return;pull.elapsed=Math.min(pull.duration,pull.elapsed+dt);player.timer=Math.max(0,pull.duration-pull.elapsed);player.face=pull.face;
    const targetX=player.x+pull.face*55,targetY=player.y,targetZ=player.z||0;
    for(const e of enemiesInStarAbsorbCone(350)){clearGrapplerHold(e);e.starAbsorbT=.12;e.attackTarget=null;e.state='hurt';e.timer=.12;e.airLaunch=false;e.throwVx*=.35;e.knockVx*=.35;e.vz*=.45;e.x+=(targetX-e.x)*Math.min(1,dt*3.8);e.y+=(targetY-e.y)*Math.min(1,dt*3.2);e.z+=(targetZ-e.z)*Math.min(1,dt*3.6);setEnemyFace(e,-pull.face,true)}
    if(pull.elapsed>=pull.duration)cancelStarAbsorbPull(true)
  }
  function finishGrabAttempt(){
    const e=player.grabTarget,ungrab=nearestUngrabbable(96),blockedByAxeArmor=e?.type==='axe'&&axeArmorStates.has(e.state);player.grabTarget=null;
    if(!e||!canGrabEnemy(e)||e.dead||e.grabbed||e.level!==player.level||dist(player,e)>96||!zReach(player,e,108)){player.state='grabRelease';player.timer=.28;message=blockedByAxeArmor?'斧王正处于霸体……抓不住':ungrab?'这家伙不好抓……硬来只会露出破绽':'手空了……得挨打了';messageT=.65;return}
    if(counterGrabTypes.has(e.type)){triggerCounterGrab(e);return}
    beginPlayerGrab(e);message='抓住后不能移动……五秒内出手';messageT=2.4
  }
  function nearest(range){let best=null,d=range;for(const e of enemies){if(!canGrabEnemy(e)||e.dead||e.grabbed||e.state==='down'||e.state==='knockdown'||e.state==='slamAir'||e.state==='thrown'||e.level!==player.level||!zReach(player,e,108))continue;const q=dist(player,e);if(q<d){d=q;best=e}}return best}
  function nearestUngrabbable(range){let best=null,d=range;for(const e of enemies){if(canGrabEnemy(e)||e.dead||e.state==='down'||e.state==='slamAir'||e.state==='thrown'||e.level!==player.level||!zReach(player,e,108))continue;const q=dist(player,e);if(q<d){d=q;best=e}}return best}
  function combatAttack(range,damage,force,delay,lunge,options={}){const intent=(keys.right?1:0)-(keys.left?1:0),directed=intent!==0;if(directed)player.face=Math.sign(intent);const step=directed?lunge*1.75:lunge;player.x+=player.face*step;attack(range+(directed?22:0),damage,force*(directed?1.28:1),delay,options)}
  function strikeForestTree(range){if(currentStageTheme!=='森林'||player.level!==0)return;for(const o of currentBlockers()){if(!o.forestProp||o.hiveDropped)continue;const dx=(o.x-player.x)*player.face;if(dx>-38&&dx<range+28&&Math.abs(o.y-player.y)<105){o.hiveDropped=true;forestHives.push({x:o.x+player.face*24,y:o.y,z:150,vz:30,t:8,stingT:.35,level:0});impact(o.x,o.y-125,null,false,player.face*90);message='蜂巢掉下来了——蜂群会攻击附近所有人！';messageT=1.4;break}}}
  function attack(range,damage,force,delay=105,options={}){setTimeout(()=>{if(!running||player.hp<=0)return;let hitEnemy=false;for(const e of enemies){const airborneTarget=e.airLaunch||e.state==='thrown'||e.state==='grappleThrown';if(e.dead||(e.grabbed&&!e.grappleHolder)||e.state==='down'||(e.state==='knockdown'&&!e.airLaunch))continue;const sameLevel=e.level===player.level,edgeReach=canPlayerHitAcrossLevelEdge(e);if(!sameLevel&&!edgeReach)continue;const dx=(e.x-player.x)*player.face,extra=airborneTarget?58:0,verticalReach=edgeReach||Math.abs(e.y-player.y)<(airborneTarget?86:52);if(dx>-35-extra&&dx<range+extra&&verticalReach&&zReach(player,e,options.zReach||(airborneTarget?260:112))){const finalDamage=Math.round(damage*playerAtkMul())+Math.max(0,options.bonusDamage||0);if(hurtEnemy(e,finalDamage,force*player.face,{...options,playerHit:true})!==false)hitEnemy=true}}strikeForestTree(range);if(powerSwitch&&!powerSwitch.on&&powerSwitch.level===player.level){const dx=(powerSwitch.x-player.x)*player.face;if(dx>-24&&dx<range+20&&Math.abs(powerSwitch.y-player.y)<62){powerSwitch.on=true;powerSwitch.flash=.45;impact(powerSwitch.x,powerSwitch.y-62,null,false,0);message='电闸打开了！趁亮赶快打';messageT=1.2}}},delay/playerAttackSpeedMul())}
  function updateForestHives(dt){for(const h of forestHives){h.t-=dt;if(h.z>0||h.vz){h.z+=h.vz*dt;h.vz-=620*dt;if(h.z<=0){h.z=0;h.vz=0}}if(h.z>0||h.t<=0)continue;h.stingT-=dt;if(h.stingT>0)continue;h.stingT=.72;for(const a of[player,...companions,...enemies]){if(!a||a.dead||a.hp<=0||(a.level||0)!==0||Math.hypot(a.x-h.x,(a.y-h.y)*1.25)>245)continue;const kx=Math.sign(a.x-h.x||1)*8;if(a===player)hurtPlayer(4,kx,{sourceType:'bees',lift:false,inv:.16});else if(a.companion)hurtCompanion(a,4,kx,{sourceType:'bees'});else hurtEnemy(a,4,kx,{})}}forestHives=forestHives.filter(h=>h.t>0)}
  function drawForestHives(){const now=performance.now()*.012;for(const h of forestHives){if(h.x<cameraX-280||h.x>cameraX+W+280)continue;const yy=h.y-h.z;g.save();g.translate(h.x,yy);g.fillStyle='#7a4c19';g.beginPath();g.ellipse(0,-18,19,26,0,0,6.3);g.fill();g.strokeStyle='#d2a33d';g.lineWidth=4;for(let y=-34;y<0;y+=10){g.beginPath();g.moveTo(-15,y);g.lineTo(15,y);g.stroke()}if(h.z===0){for(let i=0;i<12;i++){const a=now+i*1.83,r=42+(i%4)*24;g.fillStyle=i%3?'#e7bd3e':'#2b2114';g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a*1.31)*r*.55-30,3,0,6.3);g.fill()}}g.restore()}}
  function continueEnemyDeathFall(e,kx,airZ,airVz,airCarryX){
    e.state='knockdown';e.airLaunch=true;e.timer=Math.max(e.timer||0,.9);e.knockdownDuration=Math.max(e.knockdownDuration||0,.9);
    e.knockVx=airCarryX*.7+kx*.18;e.throwVx=0;e.z=Math.max(airZ,18);e.vz=Math.abs(airVz)>1?airVz:-80
  }
  function placeEnemyAtChainKnee(e){const face=player.launchKickChainFace||player.face||1;e.x=player.x+face*100;e.y+=(player.y-e.y)*.72;e.z=Math.max(18,(player.z||0)+8);e.vz=Math.max(player.vz||0,80);e.knockVx=face*195}
  function hurtEnemy(e,dmg,kx,options={}){
    if(e.grappleInvincible&&!['enemyGrabbed','grappleTrip','enemyThrow'].includes(e.state))clearGrapplerHold(e);
    if(e.grappleInvincible&&!options.ignoreGrappleInv)return false;
    if(options.playerHit)registerPlayerHit();
    const previousHp=e.hp,eliteArmored=e.eliteArmorT>0,axeArmored=e.type==='axe'&&axeArmorStates.has(e.state),grappleHeld=!!e.grappleHolder,wasAirLaunch=e.airLaunch&&e.state==='knockdown',airZ=e.z||0,airVz=e.vz||0,airCarryX=e.throwVx||e.knockVx||0,wasAirborne=airZ>0||Math.abs(airVz)>1||e.airLaunch||e.state==='thrown'||e.state==='grappleThrown'||e.state==='slamAir';e.hp-=dmg;if(options.playerHit)healPlayerFromDamage(e,previousHp);e.inv=wasAirLaunch?.08:.22;window.TieJieAudio?.hitEnemy(e.type,dmg,e.elite);impact(e.x,e.y-e.z-86,dmg,false,kx,options.blueFistFlame?clamp((playerAttackSpeedMul()-1)/(2-1),0,1):0);if(!options.kneeChain)hitStop(dmg>20?.1:.055);
    if(e.type==='barbarian'&&e.hp<=0&&!e.revived){e.hp=0;e.state='barbarianDown';e.timer=3;e.inv=3;e.z=0;e.vz=0;e.knockVx=0;message='荒铁蛮士倒下了……但还没有结束';messageT=1.4;return}
    if(eliteArmored&&e.hp>0)return true;
    if(axeArmored&&e.hp>0)return true;
    if(grappleHeld&&e.hp>0){e.state='grabbed';e.z=0;e.vz=0;return true}
    if(e.type==='heavy'){
      e.x+=kx*.012;
      if(e.hp<=0){e.dead=true;if(wasAirborne)continueEnemyDeathFall(e,kx,airZ,airVz,airCarryX);else{e.z=0;e.vz=0;e.state='heavyDefeated';e.timer=1.35}player.kills++;message=e.elite?'总算打穿了这块铁':'这肉山终于倒了';messageT=1;return}
      if(e.state==='slamCharge'||e.state==='slamAir')return;
      e.z=0;e.vz=0;
      const breakStun=Math.random()<(e.elite?.5:.32);e.state=breakStun?'idle':'hurt';e.timer=breakStun?.06:.28;if(breakStun){message='糟了，这家伙抗住了！';messageT=.45}return
    }
    const kneeChain=!!options.kneeChain;if(kneeChain)placeEnemyAtChainKnee(e);else e.x+=kx*.045;if((e.airLaunch||e.state==='thrown'||e.state==='grappleThrown')&&e.hp>0){e.state='knockdown';e.airLaunch=true;e.timer=Math.max(e.timer,.48);e.knockdownDuration=Math.max(e.knockdownDuration||0,.9);e.knockVx=kneeChain?e.knockVx:options.launchKickCarry?Math.sign(kx||player.face)*Math.max(Math.abs(e.knockVx||0),options.launchKickCarry):(e.knockVx||0)+kx*.18;e.throwVx=0;e.z=Math.max(e.z||0,24);e.vz=kneeChain?e.vz:Math.max(e.vz||0,options.airJuggleVz||260);message='空中追打！';messageT=.35}else if(options.knockdown){e.state='knockdown';e.timer=.9;e.knockdownDuration=.9;e.knockVx=kneeChain?e.knockVx:options.launchKickCarry?Math.sign(kx||player.face)*options.launchKickCarry:kx*.5;e.z=options.launchVz?Math.max(e.z||0,18):0;e.vz=kneeChain?e.vz:options.launchVz?Math.max(e.vz||0,options.launchVz):0;e.airLaunch=!!options.launchVz}else{e.state=e.hp<=0?'down':'hurt';e.timer=e.hp<=0?1.5:.38;if(e.hp>0){e.z=Math.max(e.z||0,options.liftZ||10);e.vz=Math.max(e.vz||0,options.liftVz||Math.min(280,Math.abs(kx)*.5))}else e.vz=0}if(e.hp<=0){e.dead=true;if(wasAirborne)continueEnemyDeathFall(e,kx,airZ,airVz,airCarryX);player.kills++;message='倒下一个……后面还有';messageT=1}return true
  }
  function queueKneeStrike(){if(!player.grab)return;if(player.state==='grabKnee'&&player.timer>0){if(player.grabKickTotal<3){player.grabKickQueue++;player.grabKickTotal++;message=`等我收腿……再顶一次`;messageT=.55}return}if(player.grabKickTotal>=3){message='不能贪，三下够了';messageT=.65;return}player.grabKickTotal++;startKneeStrike()}
  function startKneeStrike(){if(!player.grab)return;const strikeNo=Math.max(1,player.grabKickTotal-player.grabKickQueue);player.state='grabKnee';player.timer=.56;setTimeout(()=>strikeGrab(11,`膝撞 ${strikeNo}`),190/playerAttackSpeedMul())}
  function beginBarbarianRevive(e){if(e.type!=='barbarian'||e.hp>0||e.revived)return false;e.hp=0;e.dead=false;e.grabbed=false;e.state='barbarianDown';e.timer=3;e.inv=3;e.z=0;e.vz=0;e.knockVx=0;e.throwVx=0;message='荒铁蛮士倒下了……但还没有结束';messageT=1.4;return true}
  function strikeGrab(dmg,label){const e=player.grab;if(!e)return;applyPlayerDirectDamage(e,dmg);window.TieJieAudio?.hitEnemy(e.type,dmg,e.elite);impact(e.x,e.y-96,dmg,false,player.face*120);hitStop(.09);message=label+'！';messageT=.5;if(e.hp<=0){e.grabbed=false;if(!beginBarbarianRevive(e)){e.dead=true;e.state=e.type==='heavy'?'heavyDefeated':'down';e.timer=1.05;e.z=0;e.vz=0;player.kills++}clearGrab();player.state='grabRelease';player.timer=.28}}
  function clearGrab(){player.grab=null;player.grabTarget=null;player.grabT=0;player.grabEscapeT=0;player.grabKickQueue=0;player.grabKickTotal=0;player.grappleInvincible=false;player.risingAirInv=false}
  function shoulderThrow(){const e=player.grab;if(!e)return;const damage=e.type==='heavy'?22:34;applyPlayerDirectDamage(e,damage);e.grabbed=false;window.TieJieAudio?.hitEnemy(e.type,damage,e.elite);e.throwHits=new Set();if(e.type==='heavy'){e.x=player.x-player.face*62;e.z=0;e.vz=0;e.state=e.hp<=0?'heavyDefeated':'hurt';e.timer=e.hp<=0?1.2:.3;if(e.hp<=0){e.dead=true;player.kills++}}else{e.state='thrown';e.playerThrown=true;e.timer=.82;e.throwVx=-player.face*560;e.z=48;e.vz=600}clearGrab();player.state='throw';player.timer=.32;player.inv=Math.max(player.inv,.82);impact(player.x-player.face*12,player.y-105,damage,false,-player.face*420);message=e.type==='heavy'?'太沉了……只能拽到身后':'给我飞过去！';messageT=.9;hitStop(.14)}
  function overChestThrow(){const e=player.grab;if(!e)return;if(e.type==='heavy'){shoulderThrow();return}const durationMs=OVER_CHEST_THROW_MS/playerAttackSpeedMul(),contactMs=durationMs*OVER_CHEST_CONTACT_RATIO;player.inputQueue.length=0;player.state='overChestThrow';player.timer=OVER_CHEST_THROW_DURATION;player.inv=Math.max(player.inv,1.12);e.overChestThrow=true;e.overChestThrowStart=performance.now();e.overChestDuration=durationMs;e.overChestContact=false;e.overChestAngle=0;message='过胸摔！';messageT=.9;hitStop(.1);setTimeout(()=>{if(!running||player.state!=='overChestThrow'||player.grab!==e||e.overChestContact)return;e.overChestContact=true;applyPlayerDirectDamage(e,34);window.TieJieAudio?.hitEnemy(e.type,34,e.elite);impact(e.x,e.y-18,34,false,-player.face*420);shake=15;hitStop(.14)},contactMs);setTimeout(()=>{if(!running||player.state!=='overChestThrow'||player.grab!==e)return;e.overChestThrow=false;e.overChestContact=false;e.overChestAngle=0;e.grabbed=false;e.throwHits=new Set();e.x=player.x-player.face*58;e.y=player.y-2;if(!beginBarbarianRevive(e)){e.state='thrown';e.playerThrown=true;e.timer=.82;e.throwVx=-player.face*560;e.z=30;e.vz=620;if(e.hp<=0){e.dead=true;player.kills++}}clearGrab();player.state='idle';player.timer=0},durationMs)}
  function releaseGrab(kick=false,escaped=false){const e=player.grab;if(!e)return;e.grabbed=false;e.state=kick?'down':'hurt';e.timer=kick?.9:.32;if(kick){applyPlayerDirectDamage(e,28);e.x+=player.face*82;e.vz=300;window.TieJieAudio?.hitEnemy(e.type,28,e.elite);impact(e.x,e.y-80,28,false,player.face*340);shake=17;hitStop(.13)}clearGrab();player.state='grabRelease';player.timer=.28;if(escaped){message='抓不稳了……他挣开了！';messageT=1.1}}
  function throwHeld(){
    const type=player.held;if(!type)return;const throwsLeft=type==='hammer'?Math.max(0,player.heldUses-1):0;player.held=null;player.heldUses=0;player.state='throwItem';player.timer=.32;player.inputQueue.length=0;
    if(type==='grenade')projectiles.push({type,x:player.x+player.face*38,y:player.y,z:92,vx:player.face*330,vz:330,level:player.level,spin:0,life:1.2});
    else projectiles.push({type,x:player.x+player.face*42,y:player.y,z:96,vx:player.face*680,vz:0,level:player.level,spin:0,life:.88,throwsLeft});
    message=type==='grenade'?'近点炸，别浪费':'砸直线，够远！';messageT=.75;
  }
  function hitStop(t){slow=Math.max(slow,t)}
  function impact(x,y,dmg,onPlayer,kx,blueFistFlame=0){hitFx.push({x,y,dmg,onPlayer,kx,blueFistFlame,t:.42,max:.42,seed:Math.random()*6.28});if(hitFx.length>18)hitFx.shift()}
  function absorbPullArmorHit(dmg,kx,options={}){if(player.hp<=0||(player.inv>0&&!options.ignoreInv))return;resetPlayerHitStreak();const real=Math.max(1,Math.round(dmg*playerDefMul()));player.hp-=real;player.inv=options.inv??.12;window.TieJieAudio?.hitPlayer(real,options.sourceType);impact(player.x,player.y-player.z-88,real,true,kx*9);hitStop(options.hitStop??.055);if(player.hp>0)return;cancelStarAbsorbPull();player.state='down';player.timer=2;message='撑不住了……';messageT=3;queueRunFailure()}
  function hurtPlayer(dmg,kx,options={}){if(player.state==='starAbsorbPull'){absorbPullArmorHit(dmg,kx,options);return}const chainable=player.z>0||player.vz>0||player.state==='hurt'||player.state==='enemyGrabbed';if(player.grappleInvincible||player.risingAirInv||player.hp<=0||(player.inv>0&&!options.ignoreInv&&!chainable))return;resetPlayerHitStreak();if(player.grab)releaseGrab(false);player.grabTarget=null;player.risingQueued=false;player.risingAirInv=false;player.risingInvT=0;player.airOrigin='enemy';const held=player.state==='enemyGrabbed',real=Math.max(1,Math.round(dmg*playerDefMul()));player.hp-=real;player.inv=options.inv??(chainable?.08:.22);player.state=player.hp<=0?'down':held?'enemyGrabbed':'hurt';player.timer=player.hp<=0?2:(options.timer??.44);player.inputQueue.length=0;if(!held){player.x+=kx*1.25;player.knockVx=(player.knockVx||0)+kx*.28;if(player.hp>0&&options.lift!==false){player.z=Math.max(player.z||0,chainable?18:10);player.vz=Math.max(player.vz||0,options.liftVz||(chainable?260:190))}}window.TieJieAudio?.hitPlayer(real,options.sourceType);impact(player.x,player.y-player.z-88,real,true,kx*9);hitStop(options.hitStop??.075);if(player.hp<=0){message='撑不住了……';messageT=3;queueRunFailure()}}
  function knockPlayerDown(dmg,kx,options={}){if(player.state==='starAbsorbPull'){absorbPullArmorHit(dmg,kx,options);return}const chainable=player.z>0||player.vz>0||player.state==='hurt'||player.state==='enemyGrabbed';if(player.grappleInvincible||player.risingAirInv||player.hp<=0||(player.inv>0&&!options.ignoreInv&&!chainable))return;player.airOrigin='enemy';resetPlayerHitStreak();if(player.grab)releaseGrab(false);player.grabTarget=null;player.risingQueued=false;player.risingAirInv=false;player.risingInvT=0;const held=player.state==='enemyGrabbed'&&!options.breakHold,real=Math.max(1,Math.round(dmg*playerDefMul()));player.hp-=real;player.inv=options.inv??(chainable?.08:.3);player.state=player.hp<=0?'down':held?'enemyGrabbed':'down';player.timer=player.hp<=0?2.2:.9;player.inputQueue.length=0;if(!held){player.z=Math.max(player.z||0,18);player.vz=Math.max(player.vz||0,options.launchVz||(chainable?420:340));player.knockVx=(player.knockVx||0)+kx*.75;player.x+=kx*.65}window.TieJieAudio?.hitPlayer(real,options.sourceType);impact(player.x,player.y-player.z-52,real,true,kx*9);hitStop(.1);message=player.hp<=0?'撑不住了……':'腿被扫了，起身要快！';messageT=player.hp<=0?3:.8;if(player.hp<=0)queueRunFailure()}

  function applyStairTerrain(s){
    const e=stairEnds(s);player.y=clamp(player.y,e.topY,e.bottomY);
    const t=clamp((e.bottomY-player.y)/(e.bottomY-e.topY),0,1);player.level=t>.55?s.toLevel:s.fromLevel;return true;
  }
  function applyActorStairTerrain(a,s){
    const e=stairEnds(s);a.y=clamp(a.y,e.topY,e.bottomY);
    const t=clamp((e.bottomY-a.y)/(e.bottomY-e.topY),0,1);a.level=t>.55?s.toLevel:s.fromLevel;return true;
  }
  function stairLandingYAtX(s,x,pad=16){
    const e=stairEnds(s),c=s.x+s.bottomW*.5,dx=Math.abs(x-c),topHalf=s.topW*.5+pad,bottomHalf=s.bottomW*.5+pad;
    if(dx>Math.max(topHalf,bottomHalf))return null;
    if(Math.abs(bottomHalf-topHalf)<1)return e.topY;
    const q=clamp((dx-topHalf)/(bottomHalf-topHalf),0,1);
    return e.topY+(e.bottomY-e.topY)*q
  }
  function crossedStairWhileFalling(previousAirY,currentAirY){
    if(currentAirY<previousAirY)return null;
    let landing=null;
    for(const s of currentStairs()){
      const y=stairLandingYAtX(s,player.x);if(y==null||previousAirY>y||currentAirY<y)continue;
      if(!landing||y<landing.y)landing={s,y}
    }
    return landing
  }
  function stairCenterAtY(s,y){const b=stairBoundsAtY(s,y);return(b.left+b.right)*.5}
  function terrainRouteFirstStep(fromLevel,toLevel){
    if(fromLevel===toLevel)return null;
    const queue=[fromLevel],seen=new Set(queue),first=new Map();
    while(queue.length){
      const level=queue.shift(),links=[];
      for(const stair of currentStairs())if(stair.fromLevel===level||stair.toLevel===level)links.push({kind:'stair',connector:stair,next:stair.fromLevel===level?stair.toLevel:stair.fromLevel});
      for(const bridge of currentBridges())if(bridge.fromLevel===level||bridge.toLevel===level)links.push({kind:'bridge',connector:bridge,next:bridge.fromLevel===level?bridge.toLevel:bridge.fromLevel});
      links.sort((a,b)=>Math.abs(a.next-toLevel)-Math.abs(b.next-toLevel));
      for(const link of links){
        if(seen.has(link.next))continue;seen.add(link.next);
        first.set(link.next,first.get(level)||{kind:link.kind,connector:link.connector,fromLevel,toLevel:link.next});
        if(link.next===toLevel)return first.get(link.next);queue.push(link.next)
      }
    }
    return null
  }
  function moveEnemyTowardRoutePoint(e,x,y,dt,speedMul=1){
    const dx=x-e.x,dy=y-e.y,far=Math.hypot(dx,dy),move=forestSteeredVector(e,x,y),moveFar=Math.hypot(move.dx,move.dy)||1,speed=Math.max(58,(e.speed||80)*.82)*speedMul;
    setEnemyFace(e,dx);e.state=far>7?'run':'idle';if(far>1){const step=Math.min(moveFar,speed*dt);e.x+=move.dx/moveFar*step;e.y+=move.dy/moveFar*step}return far
  }
  function enemyUseStairs(e,dt,target=player){
    let nav=e.terrainNav;
    if(nav&&(e.level===target.level||nav.goalLevel!==target.level)){e.terrainNav=null;e.forestDetour=null;nav=null}
    if(nav&&e.level!==nav.fromLevel&&e.level!==nav.toLevel){e.terrainNav=null;nav=null}
    if(!nav){if(e.level===target.level)return false;nav=terrainRouteFirstStep(e.level,target.level);if(nav)nav.goalLevel=target.level;e.terrainNav=nav;if(!nav){e.state='idle';setEnemyFace(e,target.x-e.x);return true}}
    if(nav.kind==='bridge'){
      const b=nav.connector,forward=nav.fromLevel===b.fromLevel,entrance={x:forward?b.x1:b.x2,y:forward?b.y1:b.y2},exit={x:forward?b.x2:b.x1,y:forward?b.y2:b.y1};
      if(!nav.entered){const far=moveEnemyTowardRoutePoint(e,entrance.x,entrance.y,dt,1.05);if(far>10)return true;e.x=entrance.x;e.y=entrance.y;nav.entered=true}
      const far=moveEnemyTowardRoutePoint(e,exit.x,exit.y,dt,1.08);applyBridgeTerrain(b,e);
      if(far<=8){e.x=exit.x;e.y=exit.y;e.level=nav.toLevel;e.terrainNav=null;e.state='run'}return true
    }
    const s=nav.connector,up=nav.fromLevel===s.fromLevel,entranceY=up?s.bottomY:s.topY,exitY=up?s.topY:s.bottomY,entranceX=stairCenterAtY(s,entranceY);
    if(!nav.entered){const far=moveEnemyTowardRoutePoint(e,entranceX,entranceY,dt,1.08);if(far>9)return true;e.x=entranceX;e.y=entranceY;nav.entered=true}
    const step=Math.max(58,(e.speed||80)*.76)*(e.type==='skinny'?1.18:e.elite?1.05:1)*dt;e.y+=up?-step:step;e.x+=(stairCenterAtY(s,e.y)-e.x)*Math.min(1,dt*7);setEnemyFace(e,target.x-e.x);e.state='run';applyActorStairTerrain(e,s);
    if((up&&e.y<=exitY+2)||(!up&&e.y>=exitY-2)){e.y=exitY+(up?-2:2);e.x=stairCenterAtY(s,exitY);e.level=nav.toLevel;e.terrainNav=null}return true;
  }
  function beginClimb(up){
    if(player.climb||player.grab||player.z>0)return;
    player.inputQueue.length=0;player.state='climb';player.timer=0;player.face=up?1:-1;player.inv=1.45;
    player.climb={t:0,dur:1.35,up,fromX:player.x,fromY:player.y,toX:up?540:390,toY:up?285:515,targetLevel:up?1:0};
    message=up?'往上走，别在楼梯口挨打':'下去，脚下别空';messageT=1.2;
  }
  function updateClimb(dt){
    const c=player.climb;if(!c){if(player.state==='climbOut')player.state='idle';return}
    c.t=Math.min(c.dur,c.t+Math.max(dt,1/120));const q=c.t/c.dur,e=q*q*(3-2*q);
    if(c.kind==='pitOut'||c.kind==='collapseUp'){
      player.x=c.anchorX;player.y=c.anchorY;
      if(q>=1){
        player.level=c.targetLevel??0;player.climb=null;player.state='idle';
        if(c.kind==='pitOut')player.subPit=null;
        player.z=0;player.vz=0;player.knockVx=0;player.x=c.toX;player.y=c.toY;
        player.pitSafeT=c.kind==='pitOut'?1.35:(player.pitSafeT||0);player.inv=Math.max(player.inv,.35);
        message=c.kind==='pitOut'?'抓着岩壁爬上来了':'踩着坍塌砖石爬上去了';messageT=1.1
      }
      return
    }
    player.x=c.fromX+(c.toX-c.fromX)*e;player.y=c.fromY+(c.toY-c.fromY)*e;
    if(q>.52)player.level=c.targetLevel;
    if(q>=1){player.level=c.targetLevel;player.climb=null;player.state='idle';if(c.kind==='pitOut'){player.subPit=null;player.z=0;player.vz=0;player.pitSafeT=.75;player.inv=Math.max(player.inv,.35);message='抓着岩壁爬上来了';messageT=1.1}else{message=c.up?'上来了……边缘能把人踢下去':'回到地面，脚踏实了';messageT=1.25}}
  }
  function beginPitClimbOut(b){
    if(player.climb||player.grab||player.z>8)return;
    player.inputQueue.length=0;player.state='climbOut';player.timer=0;player.face=player.x<b.climbX?1:-1;player.inv=.55;
    const safeY=GROUND_Y-34,safeX=clamp(b.surfaceExitX??b.climbX,stageLockX+70,stageRightX-70);
    player.climb={kind:'pitOut',t:0,dur:.82,up:true,anchorX:player.x,anchorY:player.y,fromX:player.x,fromY:player.y,toX:safeX,toY:safeY,targetLevel:0};
    message='抓住岩壁，往上爬！';messageT:.7;
  }
  function beginCollapseClimb(c){
    if(player.climb||player.grab||player.z>8)return;
    const t=collapseClimbTarget(c);
    player.inputQueue.length=0;player.state='climbOut';player.timer=0;player.face=player.x<t.x?1:-1;player.inv=.55;
    player.climb={kind:'collapseUp',t:0,dur:.88,up:true,anchorX:player.x,anchorY:player.y,fromX:player.x,fromY:player.y,toX:t.x,toY:t.toY,targetLevel:c.toLevel};
    message='踩着坍塌砖石往上爬！';messageT:.75;
  }
  function fallDamageFromYDelta(deltaY){
    return Math.max(0,Math.round((Math.max(0,deltaY)-520)*.16))
  }
  function finishPlayerLanding(stairLanding=null){
    if(stairLanding){player.y=stairLanding.y;applyStairTerrain(stairLanding.s)}
    player.z=0;player.vz=0;player.knockVx=0;player.launchKick=false;player.launchKickTime=0;player.launchKickSpeed=0;player.launchKickFace=0;resetLaunchKickChain();player.risingAirInv=false;player.risingInvT=0;
    const fallKind=player.fallFromLevel,fallStartY=player.fallStartY,actualDropY=Number.isFinite(fallStartY)?Math.max(0,player.y-fallStartY):0;
    player.fallFromLevel=null;player.fallStartY=null;player.fallDamage=fallKind!=null&&fallKind!=='pit'?fallDamageFromYDelta(actualDropY):0;
    if(player.fallDamage>0){
      const dmg=player.fallDamage;player.fallDamage=0;resetPlayerHitStreak();player.hp=Math.max(0,player.hp-dmg);window.TieJieAudio?.hitPlayer(dmg);impact(player.x,player.y-38,dmg,true,0);hitStop(.08);message=player.hp<=0?'摔狠了……站不起来':'腿麻了……疼得够呛 -'+dmg;messageT=player.hp<=0?99:1;
      if(player.hp<=0){player.state='down';player.timer=2;message='摔狠了……站不起来';messageT=3;queueRunFailure()}else{player.state='jumpLand';player.timer=.34}
    }else if(player.state==='jump'||player.state==='airBackKick'||player.state==='risingPunch'){
      player.state='jumpLand';player.timer=.28;const landedPlatform=!stairLanding&&player.level>0?platformForLevel(player.level):null;jumpSourcePlatform=landedPlatform&&insidePlatform(player.x,player.y,0,landedPlatform)?landedPlatform:null;jumpPlatformCleared=false
    }
  }
  function startPlatformDrop(){
    const p=platformForLevel(player.level);if(!p||player.hp<=0)return;
    const oldY=player.y,oldLevel=player.level;
    let landing={level:0,y:570};
    const below=currentPlatforms().filter(q=>q!==p&&q.minY>p.maxY&&insidePlatform(player.x,q.minY+18,12,q)).sort((a,b)=>a.minY-b.minY)[0];
    if(below)landing={level:below.level,y:below.minY+18};
    const dropY=Math.max(0,landing.y-oldY);
    player.fallFromLevel=oldLevel;player.fallStartY=oldY;player.level=landing.level;player.z=dropY;player.vz=-70;player.y=landing.y;player.fallDamage=fallDamageFromYDelta(dropY);player.state='jump';player.timer=.62;player.inv=Math.max(player.inv,.18);
    message=player.fallDamage>0?`太高了……落地要出事`:`这高度还能扛`;messageT=.9;
  }
  function startEnemyPlatformDrop(e){
    const p=platformForLevel(e.level);if(!p||e.dead||e.airLaunch)return false;
    const oldY=e.y;
    let landing={level:0,y:570};
    const below=currentPlatforms().filter(q=>q!==p&&q.minY>p.maxY&&insidePlatform(e.x,q.minY+18,12,q)).sort((a,b)=>a.minY-b.minY)[0];
    if(below)landing={level:below.level,y:below.minY+18};
    const dropY=Math.max(0,landing.y-oldY),damage=fallDamageFromYDelta(dropY);
    e.level=landing.level;e.y=landing.y;e.z=Math.max(1,dropY);e.vz=-70;e.airLaunch=true;e.state='knockdown';e.timer=Math.max(e.timer||0,.72);e.knockdownDuration=.72;e.knockVx=e.knockVx||0;
    if(damage>0){e.hp=Math.max(0,e.hp-damage);window.TieJieAudio?.hitEnemy(e.type,damage,e.elite);if(e.hp<=0){e.dead=true;player.kills++}}
    return true
  }
  function enemyCanFallFromAttack(e){return['hurt','knockdown','thrown','grappleThrown','down','heavyDefeated','stunned'].includes(e.state)}
  function enterPitLowerLevel(pit){
    if(player.hp<=0||player.level<0)return;
    const oldY=player.y,b=lowerPitBounds(pit),dropY=Math.max(0,b.y-oldY);if(b.bunker)b.bunker.rooms[0].opened=true;player.subPit=b;player.level=-1;player.x=b.backX;player.y=b.y;player.z=dropY;player.vz=-120;player.fallFromLevel='pit';player.fallStartY=oldY;player.fallDamage=0;player.state='jump';player.timer=.56;player.inv=Math.max(player.inv,.45);hitStop(.06);impact(player.x,pit.y-25,null,true,0);message=b.bunker?'落进第一间石室……去右端按“抓”开门':'跳进方坑……下面还能打！';messageT=1.8;
  }
  function dropEnemyIntoPit(e,pit){
    const b=lowerPitBounds(pit);e.level=-1;e.subPit=b;e.y=b.y;e.z=0;e.vz=0;e.airLaunch=false;e.throwVx=0;e.knockVx=0;e.state=e.hp<=0?'down':'hurt';e.timer=e.hp<=0?1.1:.55;e.inv=Math.max(e.inv,.18);if(e.hp<=0&&!e.dead){e.dead=true;player.kills++}impact(e.x,b.y-54,null,false,0);message=e.dead?'他摔到下层，没再起来':'他掉到下面一层了，跳下去继续打！';messageT=1.05;return true
  }
  function applyLowerTerrain(previousX=player.x){
    const b=player.subPit;if(!b){player.level=0;player.y=GROUND_Y;return}
    player.y=clamp(player.y,b.y-BUNKER_DEPTH*.5,b.y+BUNKER_DEPTH*.5);player.x=clamp(player.x,b.left,b.right);
    if(b.bunker)blockActorAtClosedBunkerDoors(player,previousX);
    const climbHalfWidth=190;
    const nearClimb=(!b.exitDoor||b.exitDoor.opened)&&player.x>b.climbX-climbHalfWidth&&player.x<b.climbX+climbHalfWidth&&player.y>b.y-96&&player.y<b.y+72;
    if(nearClimb&&keys.up&&player.state!=='jumpCrouch'){beginPitClimbOut(b);return}
  }
  function blockActorAtClosedBunkerDoors(actor,previousX=actor.x){
    const bunker=actor.level<0&&actor.subPit?.bunker;if(!bunker)return;
    actor.y=clamp(actor.y,bunker.y-BUNKER_DEPTH*.5,bunker.y+BUNKER_DEPTH*.5);
    if(actor===player){
      const nextClosed=bunker.doors.find(door=>!door.opened);if(!nextClosed)return;
      const limit=nextClosed.x-34;if(actor.x>limit){actor.x=limit;actor.launchKickTime=0;actor.knockVx=0}return
    }
    for(const door of bunker.doors){if(door.opened)continue;const pad=34;if(previousX<=door.x-pad&&actor.x>door.x-pad)actor.x=door.x-pad;else if(previousX>=door.x+pad&&actor.x<door.x+pad)actor.x=door.x+pad}
  }
  function applyHazards(){
    if(player.level<0||player.z>42||player.inv>0||player.hp<=0)return false;
    for(const h of currentHazards()){
      if((h.level||0)!==player.level)continue;
      if(player.x>h.x&&player.x<h.x+h.w&&Math.abs(player.y-h.y)<48){
        const dir=player.x<h.x+h.w*.5?-1:1;hurtPlayer(h.damage||12,dir*26);
        message=h.type==='electric'?'电火花炸开了，别踩线':h.type==='steam'?'蒸汽喷出来了，太烫':h.type==='thorn'?'藤刺扎脚，别硬闯':h.type==='glass'?'碎玻璃割得真狠':h.type==='fireBowl'||h.type==='fireJet'?'火焰喷出来了，等节奏':h.type==='spike'?'这排尖刺不能硬踩':'机关！看清再走';
        messageT=.75;return true;
      }
    }
    return false
  }
  function applyPlayerTerrain(previousX=player.x,previousY=player.y){
    if(player.level<0){applyLowerTerrain(previousX);return}
    if(player.z>0||player.vz!==0){
      // 相邻建筑可在下降阶段横跳；抬腿后的脚部越过台面即可落脚。
      const liftedFootY=player.y-player.z+8;
      const target=currentPlatforms().map(p=>playerCrossJumpTarget(p,true)).filter(Boolean).sort((a,b)=>a.depthGap-b.depthGap)[0]||null;
      if(target){player.level=target.p.level;player.y=target.landingY;player.z=Math.max(0,player.y-liftedFootY+8);jumpPlatformCleared=true;return}
      const airStartX=Number.isFinite(player.airPrevX)?player.airPrevX:previousX;
      pushOutOfBuildingSolids(player,ACTOR_WALL_COLLISION_PAD,airStartX,previousY);if(pushOutOfBlockers(player,26,airStartX,previousY)){player.launchKickTime=0;message='树干像墙一样挡住了';messageT=.55}player.x=clamp(player.x,stageLockX,stageRightX);return
    }
    if(player.level===0&&player.pitSafeT<=0){for(const pit of currentPits()){if(insidePit(player,pit)){enterPitLowerLevel(pit);return}}}
    if(pushOutOfBlockers(player,26,previousX,previousY)){message=currentStageTheme==='森林'?'树干挡住了，从前后绕过去':'湖水太深，绕着绿洲走';messageT=.55}
    if(applyHazards())return;
    for(const c of currentCollapseClimbs()){
      if(player.level!==c.fromLevel)continue;
      const t=collapseClimbTarget(c);
      const near=player.x>c.x-40&&player.x<c.x+c.w+40&&Math.abs(player.y-t.fromY)<58;
      if(near&&keys.up&&player.state!=='jumpCrouch'){beginCollapseClimb(c);return}
    }
    for(const b of currentBridges())if((player.level===b.fromLevel||player.level===b.toLevel)&&insideBridge(b,player.x,player.y,8)){applyBridgeTerrain(b);return}
    for(const s of currentStairs())if((player.level===s.fromLevel||player.level===s.toLevel)&&insideStairWalkZone(s,player.x,player.y,PLAYER_STAIR_ENTRY_PAD)){applyStairTerrain(s);return}
    const p=platformForLevel(player.level);
    if(p){
      if(!insidePlatform(player.x,player.y,0,p)){
        if(player.y<p.minY){player.y=p.minY;const inner=platformWalkBoundsAtY(player.y,p);player.x=clamp(player.x,inner.left,inner.right);return}
        startPlatformDrop();return
      }
      const maxY=platformWalkMaxY(p);player.y=clamp(player.y,p.minY,maxY);const b=platformWalkBoundsAtY(player.y,p);player.x=clamp(player.x,b.left,b.right);return
    }
    const ground=groundWalkBounds();
    player.x=clamp(player.x,42,WORLD_W-42);player.y=clamp(player.y,ground.min,ground.max);pushOutOfGroundWalls(player,ACTOR_WALL_COLLISION_PAD,previousX,previousY);if(pushOutOfBlockers(player,26,previousX,previousY)){message=currentStageTheme==='森林'?'树干挡住了，从前后绕过去':'湖水太深，绕着绿洲走';messageT=.55}
  }
  function constrainEnemyToAccessibleTerrain(e,previousX=e.x,previousY=e.y){
    if(e.dead||(e.z||0)>18||e.airLaunch||e.level<0)return;
    for(const bridge of currentBridges())if((e.level===bridge.fromLevel||e.level===bridge.toLevel)&&insideBridge(bridge,e.x,e.y,10)){applyBridgeTerrain(bridge,e);return}
    for(const stair of currentStairs())if((e.level===stair.fromLevel||e.level===stair.toLevel)&&insideStairWalkZone(stair,e.x,e.y,10)){applyActorStairTerrain(e,stair);return}
    const platform=platformForLevel(e.level);
    if(platform){
      if(e.y<platform.minY){e.y=platform.minY;const inner=platformWalkBoundsAtY(e.y,platform,0);e.x=clamp(e.x,inner.left,inner.right);return}
      if(!insidePlatform(e.x,e.y,0,platform)&&enemyCanFallFromAttack(e)){startEnemyPlatformDrop(e);return}
      e.y=clamp(e.y,platform.minY,platformWalkMaxY(platform));const bounds=platformWalkBoundsAtY(e.y,platform,0);e.x=clamp(e.x,bounds.left,bounds.right);return
    }
    const ground=groundWalkBounds();
    e.y=clamp(e.y,ground.min,ground.max);e.x=clamp(e.x,42,WORLD_W-42);
    pushOutOfGroundWalls(e,ACTOR_WALL_COLLISION_PAD,previousX,previousY);
    e.y=clamp(e.y,ground.min,ground.max);e.x=clamp(e.x,42,WORLD_W-42)
  }
  function catchEnemyOnPlatform(e){
    if(e.vz>0)return false;
    const projectedY=e.y-e.z;
    const target=currentPlatforms().filter(p=>!p.noEnemy&&p.level>e.level&&projectedY>=p.minY-18&&projectedY<=p.maxY+26&&insidePlatform(e.x,clamp(projectedY,p.minY,p.maxY),18,p)).sort((a,b)=>b.level-a.level)[0];
    if(!target)return false;
    const carry=e.throwVx||e.knockVx||0;e.level=target.level;e.y=clamp(projectedY,target.minY+20,platformWalkMaxY(target)-8);e.z=0;e.vz=0;e.throwVx=carry*.55;e.knockVx=carry*.72;e.airLaunch=false;e.playerThrown=false;e.state='knockdown';e.timer=.72;e.knockdownDuration=.72;
    if(e.hp<=0&&!e.dead){e.dead=true;player.kills++}
    impact(e.x,e.y-20,null,false,e.knockVx);message='这一下居然把他砸上去了';messageT=.85;return true;
  }

  function dropHammer(p){if((p.throwsLeft??0)<=0)return;const b=laneBoundsFor(p.level,p.y,55);pickups.push({type:'hammer',x:clamp(p.x,b.left,b.right),y:p.y,level:p.level,active:true,throwsLeft:p.throwsLeft})}
  function grenadeBlast(p){
    const radius=155;blastFx.push({x:p.x,y:p.y,t:.5,max:.5,radius});impact(p.x,p.y-18,null,false,0);hitStop(.13);
    for(const e of enemies){
      if(e.dead||e.level!==p.level)continue;const dx=e.x-p.x,dy=(e.y-p.y)*1.35,d=Math.hypot(dx,dy);if(d>radius)continue;
      if(player.grab===e){e.grabbed=false;clearGrab();player.state='idle'}applyPlayerDirectDamage(e,34);e.inv=.28;e.grabbed=false;e.state='thrown';e.playerThrown=true;e.timer=.9;e.throwHits=new Set();e.throwVx=(Math.sign(dx)||player.face)*(e.type==='heavy'?240:410)*(1-d/radius*.28);e.z=Math.max(24,e.z);e.vz=e.type==='heavy'?420:570;window.TieJieAudio?.hitEnemy(e.type,34,e.elite);impact(e.x,e.y-e.z-65,34,false,e.throwVx);
    }
    message='炸开了！别让他站稳';messageT=1;
  }
  function hammerStun(p,e){
    const airZ=e.z||0,airVz=e.vz||0,airCarryX=e.throwVx||e.knockVx||0,wasAirborne=airZ>0||Math.abs(airVz)>1||e.airLaunch||e.state==='slamAir';applyPlayerDirectDamage(e,16);e.inv=.25;e.x+=Math.sign(p.vx)*24;window.TieJieAudio?.hitEnemy(e.type,16,e.elite);impact(e.x,e.y-airZ-78,16,false,p.vx);hitStop(.1);
    if(e.hp<=0){e.dead=true;if(wasAirborne)continueEnemyDeathFall(e,p.vx*.35,airZ,airVz,airCarryX);else{e.z=0;e.vz=0;e.state=e.type==='heavy'?'heavyDefeated':'down';e.timer=1.3}player.kills++;message='锤中了，倒！'}else{e.z=0;e.vz=0;e.state='stunned';e.timer=1.55;message='脑袋发懵了，机会！'}messageT=1;dropHammer(p)
  }
  function grantEnemyReward(e){
    if(e.rewarded||!e.dead)return;e.rewarded=true;
    const gold=8+Math.floor(e.rank*1.6)+(e.elite?28:0),remaining=Math.max(0,stageChickenBudget-stageChickenDropped),rewardSlots=Math.max(1,enemies.filter(other=>!other.rewarded).length+1),chicken=gauntletMode?1:Math.min(remaining,Math.ceil(remaining/rewardSlots)),fruitDrop=e.elite||Math.random()<Math.min(.18,.025+e.rank*.002);stageChickenDropped+=chicken;
    const drops=[{type:'coin',value:gold,dx:-24}];if(chicken>0)drops.push({type:'chicken',value:chicken,dx:18});if(fruitDrop)drops.push({type:'fruit',value:1,dx:55});
    for(const drop of drops){const x=e.x+drop.dx,y=e.y+(Math.random()-.5)*22;pickups.push({...drop,x,y,z:48+Math.random()*16,level:e.level,active:true,spin:Math.random()*6.28,bob:Math.random()*6.28});resourceFx.push({x,y:y-18,t:.55,max:.55,type:drop.type,value:drop.value,mode:'drop'})}
    message=`敌人掉下了金币${chicken>0?'和鸡腿':''}${fruitDrop?'，还有果实！':''}，走过去拾取`;messageT=1.35;
  }
  function updateResourcePickups(dt){
    const names={coin:'金币',chicken:'鸡腿',fruit:'果实'},keys={coin:'gold',chicken:'chicken',fruit:'fruit'};
    for(const p of pickups){if(!p.active||!keys[p.type])continue;p.spin=(p.spin||0)+dt*7;p.bob=(p.bob||0)+dt*4;p.z=Math.max(14,(p.z||0)-dt*90);if(p.level!==player.level)continue;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy);if(d<72&&d>1){const pull=(72-d)*3.8*dt;p.x+=dx/d*pull;p.y+=dy/d*pull}if(d<38){p.active=false;const value=p.value||1,key=keys[p.type];progress[key]+=value;stageRewardTotals[key]+=value;saveProgress();resourceFx.push({x:p.x,y:p.y-36,t:.7,max:.7,type:p.type,value,mode:'collect'});message=`拾取${names[p.type]} +${value}`;messageT=.7}}
    // Long Douyin sessions can span many gates. Reclaim collected drops instead of
    // retaining their image/update metadata until the next full map reload.
    if(nativeDouyinRuntime&&pickups.length>48)pickups=pickups.filter(p=>p.active)
  }
  function collectUnclaimedStageRewards(){
    const keys={coin:'gold',chicken:'chicken',fruit:'fruit'};let changed=false;
    for(const p of pickups){const key=keys[p.type];if(!p.active||!key)continue;p.active=false;const value=p.value||1;progress[key]+=value;stageRewardTotals[key]+=value;changed=true}
    if(changed)saveProgress()
  }
  function updateProjectiles(dt){
    for(const p of projectiles){p.life-=dt;p.x+=p.vx*dt;p.spin+=dt*(p.type==='grenade'?9:15);
      if(p.type==='grenade'){p.z+=p.vz*dt;p.vz-=900*dt;if(p.z<=0||p.life<=0){p.z=0;grenadeBlast(p);p.dead=true}}
      else{let target=null;for(const e of enemies){if(e.dead||e.level!==p.level||e.state==='thrown')continue;if(Math.abs(e.x-p.x)<54&&Math.abs(e.y-p.y)<48){target=e;break}}if(target){hammerStun(p,target);p.dead=true}else if(p.life<=0||p.x<45||p.x>WORLD_W-45){dropHammer(p);p.dead=true}}
    }
    projectiles=projectiles.filter(p=>!p.dead)
  }
  function stageCleared(){return enemies.length>0&&enemies.every(e=>e.dead&&e.timer<=0)}
  function advanceGauntlet(){
    gauntletIndex++;
    if(gauntletIndex<gauntletEnemyTypes.length){spawnGauntletEnemy();return}
    wave=2;enemies=[];message=`${gauntletEnemyTypes.length}个敌人都打完了……按 R 再来`;messageT=99;
  }
  function advanceStage(){
    const next=currentStageNumber()+1;setStagePosition(next,!testRunMode,testRunMode);loadMap(mapIndex);message=`进入第 ${next} 关 · 难度 ×${stageDifficulty(next).toFixed(1)}`;messageT=2;return;
  }
  function enterNextGateIfReady(){
    if(gauntletMode||gatePhase!=='exit')return;
    const map=trialMaps[mapIndex],next=map.gates[gateIndex+1];if(!next)return;
    const playerAtEntry=player.x>=next.start+GATE_CAMERA_TRIGGER-2;
    const oldRegionOutOfView=cameraX>=next.start-1;
    if(!playerAtEntry||!oldRegionOutOfView)return;
    gateIndex++;spawnGate();player.x=Math.max(player.x,stageLockX+28);player.inv=Math.max(player.inv,.28);
    message=`进入第 ${gateIndex+1} 区……后路封锁，清掉所有敌人`;messageT=1.9
  }

  function update(dt){if(player.state==='climbOut'&&!player.climb){player.state='idle';player.z=0;player.vz=0;player.level=0;player.subPit=null;player.pitSafeT=1.1}if(player.climb){if((player.climb.kind==='pitOut'||player.climb.kind==='collapseUp')&&player.climb.t>=player.climb.dur+.08){player.climb.t=player.climb.dur}updateClimb(dt);updateCamera();return}if(slow>0){slow-=dt;return}updateGrabHoldPending(dt);player.inv=Math.max(0,player.inv-dt);player.risingInvT=Math.max(0,(player.risingInvT||0)-dt);if(player.risingInvT<=0||player.state!=='risingPunch')player.risingAirInv=false;player.pitSafeT=Math.max(0,(player.pitSafeT||0)-dt);player.comboT=Math.max(0,player.comboT-dt);player.kickComboT=Math.max(0,player.kickComboT-dt);player.risingCooldown=Math.max(0,player.risingCooldown-dt);messageT=Math.max(0,messageT-dt);flash=Math.max(0,flash-dt);screenTint=Math.max(0,screenTint-dt);if(powerSwitch)powerSwitch.flash=Math.max(0,powerSwitch.flash-dt);shake*=Math.pow(.04,dt);for(const f of hitFx)f.t-=dt;hitFx=hitFx.filter(f=>f.t>0);for(const f of blastFx)f.t-=dt;blastFx=blastFx.filter(f=>f.t>0);for(const f of resourceFx)f.t-=dt;resourceFx=resourceFx.filter(f=>f.t>0);for(const f of eliteArmorFx)f.t-=dt;eliteArmorFx=eliteArmorFx.filter(f=>f.t>0);for(const f of starAbsorbFx)f.t-=dt;starAbsorbFx=starAbsorbFx.filter(f=>f.t>0);updateProjectiles(dt);
    updateForestHives(dt);updateSwampActor(player,dt,true);
    if(player.hp<=0){
      player.state='down';
      if(player.timer>0)player.timer=Math.max(0,player.timer-dt);
      if(player.knockVx){
        player.x=clamp(player.x+player.knockVx*dt,stageLockX,stageRightX);
        player.knockVx*=Math.pow(.12,dt);
      }
      if(player.z>0||player.vz){
        player.z+=player.vz*dt;
        player.vz-=1200*dt;
        if(player.z<=0){
          player.z=0;
          player.vz=0;
          player.knockVx=0;
          player.timer=0;
        }
      }
    }else if(updateGrappleThrownActor(player,dt,false)){
      applyPlayerTerrain();{const b=playerHorizontalBounds();player.x=clamp(player.x,b.left,b.right)}
    }else{
    if(player.state==='airBackKick'&&!player.launchKick&&player.launchKickChainCount>0)updateLaunchKickChainMotion(dt);
    if(player.state==='starAbsorbPull')updateStarAbsorbPull(dt);else if(player.timer>0){const timerRate=player.launchKick&&player.state==='airBackKick'?1:playerAttackStates.has(player.state)?playerAttackSpeedMul():1;player.timer-=dt*timerRate;if(player.timer<=0){if(player.state==='jumpCrouch'){if(player.risingQueued)startRisingPunch();else{player.vz=520;player.state='jump';player.timer=.55;const queued=player.inputQueue.shift();if(queued==='punch'||queued==='kick')act(queued,true)}}else if(player.state==='jumpLand'){const queued=player.inputQueue.shift();player.state='idle';if(queued)act(queued,true)}else if(player.state==='doorPush'){player.state=player.grab?'grab':'idle'}else if(player.state==='grabAttempt'){finishGrabAttempt()}else if(player.grab&&player.state==='grabKnee'){if(player.grabKickQueue>0){player.grabKickQueue--;startKneeStrike()}else if(player.grabKickTotal>=3){releaseGrab(false,true);message='三次膝撞够狠了……他拼命挣脱了！';messageT=1}else player.state='grab'}else if(player.state==='down'&&player.z>0){player.timer=.1}else if(player.state==='down'){player.state='getUp';player.timer=.55}else if(player.state==='getUp'){const queued=player.inputQueue.shift();player.state='idle';if(queued)act(queued,true)}else if(!player.grab){if(player.state==='airBackKick'&&player.launchKickChainQueued>0&&(player.launchKickChainHitCount||0)<LAUNCH_KICK_CHAIN_MAX_HITS&&player.z>0)startLaunchKickChainSegment();else{const queued=player.inputQueue.shift();if(player.state!=='airBackKick'||player.z<=0)resetLaunchKickChain();player.state=player.z>0?'jump':'idle';if(queued)act(queued,true)}}}}
    let dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0);if(player.z>0||player.vz!==0){player.airPrevX=player.x;dy=0}
    const moveLocked=['hurt','down','getUp','pickup','punch1','punch2','punch3','kick1','kick2','backKick','risingPunch','throwItem','throw','overChestThrow','doorPush','grabAttempt','grabRelease','starAbsorbPull','enemyGrabbed','climb','jumpCrouch','jumpLand'].includes(player.state)||(player.state==='airBackKick'&&(player.launchKick||player.launchKickChainCount>0));
    if(player.grab){const e=player.grab;player.grabT+=dt;player.grabEscapeT=Math.max(0,GRAB_MAX_DURATION-player.grabT);if(player.state==='drag')player.state='grab';if(player.state==='overChestThrow'){
      const p=clamp((performance.now()-(e.overChestThrowStart||performance.now()))/(e.overChestDuration||OVER_CHEST_THROW_MS),0,1),heroFrame=overChestHeroFrame(p),[handPixelX,handPixelY]=OVER_CHEST_HAND_ANCHORS[heroFrame],heroScale=characterFrameScale(heroOverChestThrowSheet,heroFrame),[heroOffsetX,heroOffsetY]=characterFrameOffset(heroOverChestThrowSheet,heroFrame),heroFlip=enemyFrameFlip('heroOverChestThrow',heroFrame)?-1:1,targetHandX=player.x+player.face*(heroOffsetX+heroFlip*(handPixelX-192)*heroScale),targetHandY=player.y-(player.z||0)+heroOffsetY+(handPixelY-344)*heroScale,angle=-player.face*OVER_CHEST_ENEMY_ANGLES[heroFrame],scaleKey=e.type==='skinny'?'skinnyBase':{spinner:'spinnerBase',grappler:'grapplerBase',axe:'axeBase',assassin:'assassinBase',suit:'suitBase',breaker:'breakerBase',whip:'whipBase',barbarian:'barbarianBase'}[e.type],enemyFrame=OVER_CHEST_ENEMY_FRAMES[e.type]??3,enemyScale=enemyFrameScale(scaleKey,enemyFrame,1)*(e.elite?1.1:1),[enemyOffsetX,enemyOffsetY]=enemyFrameOffset(scaleKey,enemyFrame),[waistPixelX,waistPixelY]=OVER_CHEST_ENEMY_WAIST_ANCHORS[e.type]||[192,264],enemyFlip=enemyFrameFlip(scaleKey,enemyFrame)?-1:1;
      setEnemyFace(e,-player.face,true);
      const enemyFacing=e.face*enemyFlip,waistX=enemyFacing*((waistPixelX-192)*enemyScale+enemyOffsetX),waistY=(waistPixelY-344)*enemyScale+enemyOffsetY,pivotY=waistY+90,cos=Math.cos(angle),sin=Math.sin(angle),waistRotX=cos*waistX-sin*pivotY,waistRotY=sin*waistX+cos*pivotY-90;
      e.x=targetHandX-waistRotX;e.y=player.y-2;e.z=e.y+waistRotY-targetHandY;e.vz=0;e.overChestAngle=angle
    }else{e.x=player.x+player.face*47;e.y=player.y-2;e.z=player.z||0;e.vz=player.vz||0;e.overChestAngle=0;setEnemyFace(e,-player.face)}if(player.grabT>=GRAB_MAX_DURATION){releaseGrab(false,true);message='五秒到了……他挣开了！';messageT=1.1}}
    else if(!moveLocked){
      const sp=playerSpeedMul()*terrainSpeedMul(player)*floodWalkSpeedMul(player),airControl=player.z>0||player.vz!==0?1.1:1,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;if(dx)player.face=Math.sign(dx);player.x+=dx*PLAYER_MOVE_SPEED_X*sp*airControl*dt;player.y+=dy*PLAYER_MOVE_SPEED_Y*sp*(airControl>1?1.25:1)*dt;if(player.z===0&&player.vz<=0&&player.state!=='jumpCrouch')player.state=(dx||dy)?'run':'idle';
    }
    applyPlayerTerrain();{const b=playerHorizontalBounds();player.x=clamp(player.x,b.left,b.right)}enterNextGateIfReady();{const b=playerHorizontalBounds();player.x=clamp(player.x,b.left,b.right)}
    if(player.z>0||player.vz>0){
      if(player.launchKick&&player.launchKickTime>0){const launchDt=Math.min(dt,player.launchKickTime),launchFace=player.launchKickFace||player.face,launchStartX=player.x,b=playerHorizontalBounds();player.face=launchFace;player.x=clamp(player.x+launchFace*player.launchKickSpeed*launchDt,b.left,b.right);player.launchKickTime-=launchDt;if(pushOutOfBlockers(player,26,launchStartX,player.y)){player.launchKickTime=0;message='飞踢撞上树干了';messageT=.55}}
      else if(player.knockVx){player.x=clamp(player.x+player.knockVx*dt,stageLockX,stageRightX);player.knockVx*=Math.pow(.12,dt)}
      const previousAirY=player.y-player.z;player.z+=player.vz*dt;player.vz-=1200*dt;const currentAirY=player.y-player.z;
      const stairLanding=player.vz<=0?crossedStairWhileFalling(previousAirY,currentAirY):null;
      if(stairLanding)finishPlayerLanding(stairLanding);
      else if(player.z<=0)finishPlayerLanding();
      if(player.level<0)blockActorAtClosedBunkerDoors(player);
    }
    }
    updateTemporaryRecruit(dt);for(const c of companions){const previousX=c.x,previousY=c.y;updateSwampActor(c,dt);updateCompanion(c,dt);applySwampTravelDrag(c,previousX,previousY);applyFloodWalkDrag(c,previousX,previousY);constrainEnemyToAccessibleTerrain(c,previousX,previousY);blockActorAtClosedBunkerDoors(c,previousX);if(!c.grabbed&&(currentStageTheme==='森林'||!c.dead))pushOutOfBlockers(c,22,previousX,previousY)}
    for(const e of enemies){const previousX=e.x,previousY=e.y;updateSwampActor(e,dt);updateEnemy(e,dt);applySwampTravelDrag(e,previousX,previousY);applyFloodWalkDrag(e,previousX,previousY);constrainEnemyToAccessibleTerrain(e,previousX,previousY);blockActorAtClosedBunkerDoors(e,previousX);if(!e.grabbed&&(currentStageTheme==='森林'||!e.dead))pushOutOfBlockers(e,24,previousX,previousY);if(!freeTourMode&&!gauntletMode&&gatePhase==='combat')e.x=clamp(e.x,stageLockX+18,stageRightX-18);grantEnemyReward(e)}updateResourcePickups(dt);
    updatePartyFailure(dt);if(!partyDefeatPending&&!failureHandled&&!freeTourMode&&wave===1&&gatePhase==='combat'&&stageCleared()){if(gauntletMode)advanceGauntlet();else{collectUnclaimedStageRewards();openStageSettlement()}}updateCamera()
  }
  function heavySlamImpact(e){
    const radius=e.elite?175:145,damage=e.elite?38:26;
    impact(e.x,e.y-20,null,false,0);e.slamHit=true;
    let hit=false;for(const target of [player,...companions]){const dx=target.x-e.x,dy=(target.y-e.y)*1.35;if(target.hp>0&&!target.dead&&target.z<55&&target.level===e.level&&Math.hypot(dx,dy)<radius){knockFriendlyTarget(target,damage,Math.sign(dx||e.face)*(e.elite?38:30),{launchVz:390});hit=true}}
    if(hit){message=e.elite?'地面都震了，别贴太近！':'这胖子砸下来太重了';messageT=1}
  }
  function enemyDmg(e,m=1){return Math.max(1,Math.round((e.damage||18)*m))}
  function breakerYBounds(e){const p=platformForLevel(e.level);if(p)return{min:p.minY,max:platformWalkMaxY(p)};if(e.level<0&&e.subPit)return{min:e.subPit.y-38,max:e.subPit.y+38};return groundWalkBounds()}
  function beginBreakerCurrent(e,target){
    const bounds=breakerYBounds(e);e.attackTarget=target;e.state='breakerCurrent';e.timer=.86;e.specialHit=false;e.specialT=2.1;e.currentStartY=e.y;e.currentMinY=bounds.min;e.currentMaxY=bounds.max;e.currentHeadMinY=e.y;e.currentHeadMaxY=e.y;e.currentHits=new Set();
    message='电流从手部机器导向脚下，贯穿整条纵轴！';messageT=.9
  }
  function startEnemySpecial(e,d,target=player){
    e.attackTarget=target;e.specialHit=false;e.specialDone=false;
    if(e.type==='suit'&&d<168){const daggerReady=(e.suitDaggerT||0)<=0,backflipReady=(e.suitBackflipT||0)<=0;if(!daggerReady&&!backflipReady)return false;const backflip=backflipReady&&(!daggerReady||d<112);e.state=backflip?'suitBackflip':'suitDagger';e.timer=backflip?.92:.72;e.suitHits=backflip?null:[false,false,false,false];if(backflip)e.suitBackflipT=2;else e.suitDaggerT=1.6+Math.random()*.9+Math.max(0,2.2-e.rank*.03);message=backflip?'西装男压低身体，准备后手翻！':'西装男拔出匕首，连续划刺！';messageT=.65;return true}
    e.specialT=1.6+Math.random()*.9+Math.max(0,2.2-e.rank*.03);
    if(e.type==='barbarian'&&d<(e.rage?380:300)){e.state='barbarianCharge';e.timer=e.rage?.52:.82;e.specialHit=false;e.specialT=e.rage?1.05:3.4+Math.random()*1.2;message='狼牙棒压低了——他要冲撞升棍！';messageT=.7;return true}
    if(e.type==='spinner'){e.state='spinAir';e.timer=.78;e.z=65;e.spinVx=e.face*(e.elite?380:310);message='空中转身？别被扫到';messageT=.65;return true}
    if(e.type==='grappler'&&canBeGrappled(target)&&!target.grabbed&&d<145&&Math.abs(target.y-e.y)<64){e.state='enemyGrabWindup';e.timer=.34;message='擒拿手贴近目标了';messageT=.65;return true}
    if(e.type==='axe'&&d<170){e.state='axeWindup';e.timer=.48;message='斧头抬起来了……要躲开';messageT=.65;return true}
    if(e.type==='assassin'&&d<360){e.state='teleport';e.timer=.34;e.z=0;message='人呢？背后不安全';messageT=.55;return true}
    if(e.type==='whip'&&d<470&&Math.abs(target.y-e.y)<76){e.state='whipWindup';e.timer=.22;message='别和她站一条线，鞭子太长';messageT=.55;return true}
    return false
  }
  function updateEnemySpecialState(e,dt){
    const aim=e.attackTarget&&e.attackTarget.hp>0&&!e.attackTarget.dead?e.attackTarget:enemyCombatTarget(e);
    if(e.state==='counterGrab'){e.timer-=dt;e.inv=Math.max(e.inv,.08);if(e.timer<=0){clearGrapplerHold(e);e.state='idle'}return true}
    if(e.state==='barbarianDown'){e.timer-=dt;if(e.timer<=0){e.state='barbarianRevive';e.timer=1.12;e.inv=1.2;message='荒铁蛮士正在重新站起……';messageT=1.1}return true}
    if(e.state==='barbarianRevive'){e.timer-=dt;e.inv=Math.max(e.inv,.12);if(e.timer<=0){e.revived=true;e.rage=true;e.maxHp=Math.max(38,Math.round(e.maxHp*.38));e.hp=e.maxHp;e.speed*=1.38;e.damage=Math.round(e.damage*1.18);setEnemyFace(e,aim.x-e.x,true);e.state='barbarianUppercut';e.timer=.56;e.specialHit=false;e.inv=.65;e.specialT=1.2;message='荒铁蛮士复活——暴走挥棒！';messageT=1.35}return true}
    if(e.state==='barbarianCharge'){e.timer-=dt;const b=laneBoundsFor(e.level,e.y,50);e.x=clamp(e.x+e.face*(e.rage?430:350)*dt,b.left,b.right);e.y+=(aim.y-e.y)*Math.min(1,dt*3);const target=!e.specialHit&&enemySkillTarget(e,78,55,120);if(target){e.specialHit=true;hurtFriendlyTarget(target,enemyDmg(e,.55),e.face*38)}if(e.timer<=0){e.state='barbarianUppercut';e.timer=.56;e.specialHit=false}return true}
    if(e.state==='barbarianUppercut'){e.timer-=dt;const target=!e.specialHit&&e.timer<.31&&enemySkillTarget(e,125,62,160);if(target){e.specialHit=true;knockFriendlyTarget(target,enemyDmg(e,1.1),e.face*92,{ignoreInv:true,launchVz:e.rage?820:720});message='狼牙棒从下往上掀飞了！';messageT=.7}if(e.timer<=0)e.state='idle';return true}
    if(e.state==='spinAir'){e.timer-=dt;const b=laneBoundsFor(e.level,e.y,45);e.x=clamp(e.x+(e.spinVx||0)*dt,b.left,b.right);e.z=55+Math.sin((1-e.timer/.78)*Math.PI)*45;const target=!e.specialHit&&enemySkillTarget(e,86,58,145);if(target){e.specialHit=true;knockFriendlyTarget(target,enemyDmg(e,1.05),e.face*68,{launchVz:420})}if(e.timer<=0){e.z=0;e.state='idle'}return true}
    if(e.state==='enemyGrabWindup'){e.timer-=dt;e.y+=(aim.y-e.y)*Math.min(1,dt*8);if(e.timer<=0){const victim=enemySkillTarget(e,110,55,110);if(victim&&!victim.grabbed&&pinGrappleVictim(e,victim)){e.state='enemyGrabbed';e.timer=.46;e.specialHit=false;message='被锁住了，完全挣不开！';messageT=.8}else e.state='idle'}return true}
    if(e.state==='enemyGrabbed'){e.timer-=dt;const victim=e.grabVictim;if(!pinGrappleVictim(e,victim)){clearGrapplerHold(e,victim);e.state='idle';return true}if(e.timer<=0){e.state='grappleTrip';e.timer=.38}return true}
    if(e.state==='grappleTrip'){e.timer-=dt;const victim=e.grabVictim;if(!pinGrappleVictim(e,victim,true)){clearGrapplerHold(e,victim);e.state='idle';return true}if(e.timer<=0){e.state='enemyThrow';e.timer=.42;e.specialHit=false}return true}
    if(e.state==='enemyThrow'){e.timer-=dt;const victim=e.grabVictim;e.grappleInvincible=true;e.inv=Math.max(e.inv,.12);if(!e.specialHit&&e.timer<.27&&victim){e.specialHit=beginGrapplerThrow(e,victim);message='脚下一绊——整个人被甩飞了！';messageT=.8}if(e.timer<=0){clearGrapplerHold(e,victim);e.state='idle'}return true}
    if(e.state==='axeWindup'){e.timer-=dt;if(e.timer<=0){e.state='axeSlash';e.timer=.78;e.axeHits=[false,false,false];message='斧王开始三连劈！';messageT=.65}return true}
    if(e.state==='axeSlash'){const prev=e.timer;e.timer-=dt;const elapsed=.78-e.timer,hitTimes=[.12,.34,.56];for(let i=0;i<hitTimes.length;i++){if(!e.axeHits?.[i]&&prev>.78-hitTimes[i]&&elapsed>=hitTimes[i]){if(!e.axeHits)e.axeHits=[false,false,false];e.axeHits[i]=true;const target=enemySkillTarget(e,112,58,130);if(target){hurtFriendlyTarget(target,enemyDmg(e,.55),e.face*(34+i*10),{ignoreInv:true,inv:.09,timer:.24,hitStop:.055,sourceType:'axe'});message=`斧王第 ${i+1} 劈！`;messageT=.35}}}if(e.timer<=0)e.state='idle';return true}
    if(e.state==='teleport'){e.timer-=dt;if(!e.specialDone&&e.timer<.17){e.specialDone=true;e.x=clamp(aim.x-aim.face*78,70,WORLD_W-70);e.y=aim.y;e.level=aim.level;setEnemyFace(e,aim.x-e.x,true);e.state='stab';e.timer=.32;e.specialHit=false}return true}
    if(e.state==='stab'){e.timer-=dt;const target=!e.specialHit&&enemySkillTarget(e,92,52,120);if(target){e.specialHit=true;hurtFriendlyTarget(target,enemyDmg(e,1.25),e.face*48,{sourceType:'assassin'});message='背后一凉……中刀了';messageT=.65}if(e.timer<=0)e.state='idle';return true}
    if(e.state==='suitDagger'){const prev=e.timer;e.timer-=dt;const elapsed=.72-e.timer,hitTimes=[.16,.32,.48,.64];for(let i=0;i<hitTimes.length;i++){if(!e.suitHits?.[i]&&prev>.72-hitTimes[i]&&elapsed>=hitTimes[i]){if(!e.suitHits)e.suitHits=[false,false,false,false];e.suitHits[i]=true;const target=enemySkillTarget(e,i===3?132:120,54,125);if(target)hurtFriendlyTarget(target,enemyDmg(e,i===3?.48:.3),0,{ignoreInv:true,inv:.06,timer:.24,hitStop:.045,lift:false,sourceType:'suitDagger'})}}if(e.timer<=0)e.state='idle';return true}
    if(e.state==='suitBackflip'){e.timer-=dt;const p=clamp(1-e.timer/.92,0,.9999),b=laneBoundsFor(e.level,e.y,48);e.x=clamp(e.x-e.face*(p<.78?236:84)*dt,b.left,b.right);const target=!e.specialHit&&p>.38&&p<.68&&enemySkillTarget(e,128,62,140);if(target){e.specialHit=true;knockFriendlyTarget(target,enemyDmg(e,.9),e.face*112,{ignoreInv:true,knockdown:true,launchVz:440,sourceType:'suitBackflip'});message='后手翻踢中，目标被踢飞！';messageT=.7}if(e.timer<=0){e.state='idle';e.attackT=.5}return true}
    if(e.state==='whipWindup'){e.timer-=dt;if(e.timer<=0){e.state='whipStrike';e.timer=.36;e.specialHit=false}return true}
    if(e.state==='whipStrike'){e.timer-=dt;const target=!e.specialHit&&enemySkillTarget(e,340,46,160,45);if(target){e.specialHit=true;knockFriendlyTarget(target,enemyDmg(e,1.05),e.face*84,{launchVz:360});message='鞭子抽得太远了，别站直线';messageT=.8}if(e.timer<=0)e.state='idle';return true}
    return false
  }
  const enemyAttackStates=new Set(['slamCharge','slamAir','slamLand','slideWindup','slide','spinAir','enemyGrabWindup','enemyGrabbed','grappleTrip','enemyThrow','counterGrab','axeWindup','axeSlash','teleport','stab','suitDagger','suitBackflip','whipWindup','whipStrike','lightsOutCast','barbarianRevive','barbarianCharge','barbarianUppercut','breakerCurrent']);
  function activeEnemyAttacks(){let count=0;for(const e of enemies)if(!e.dead&&enemyAttackStates.has(e.state))count++;return count}
  function updateEliteArmor(e,dt){
    if(!e.elite)return;e.eliteArmorT=Math.max(0,(e.eliteArmorT||0)-dt);if(e.dead||e.hp<=0)return;
    const target=enemyCombatTarget(e),detected=target&&target.hp>0&&!target.dead&&target.level===e.level;
    if(!detected){e.eliteAware=false;e.eliteArmorCheckT=4;return}
    if(!e.eliteAware){e.eliteAware=true;e.eliteArmorCheckT=4;return}
    e.eliteArmorCheckT=Math.max(0,(e.eliteArmorCheckT??4)-dt);
    if(e.eliteArmorCheckT>0||e.grabbed||e.grappleHolder||['down','knockdown','thrown','grappleThrown','heavyDefeated','barbarianDown'].includes(e.state))return;
    e.eliteArmorCheckT=4;if(Math.random()>=.5)return;e.eliteArmorT=3;eliteArmorFx.push({x:e.x,y:e.y-(e.z||0)-105,t:.38,max:.38,radius:165,seed:Math.random()*Math.PI*2});if(eliteArmorFx.length>10)eliteArmorFx.shift();screenTint=Math.max(screenTint,.08);message='精英怪金光迸发——进入 3 秒霸体！';messageT=.9
  }
  function updateEnemy(e,dt){e.inv=Math.max(0,e.inv-dt);e.faceHold=Math.max(0,(e.faceHold||0)-dt);updateEliteArmor(e,dt);if(updateGrappleThrownActor(e,dt,true))return;if(e.state==='knockdown'){const b=actorTravelBounds(18);e.timer-=dt;e.x=clamp(e.x+e.knockVx*dt,b.left,b.right);e.knockVx*=Math.pow(.07,dt);if(e.airLaunch){e.z+=e.vz*dt;e.vz-=1450*dt;if(catchEnemyOnPlatform(e))return;if(e.z<=0&&e.vz<0){for(const pit of currentPits())if(insidePit(e,pit))return dropEnemyIntoPit(e,pit);e.z=0;e.vz=0;e.airLaunch=false;e.timer=Math.min(e.timer,.14);impact(e.x,e.y-18,null,false,e.knockVx)}}if(e.timer<=0&&!e.airLaunch){e.state='down';e.timer=e.dead?3:2.2;e.knockVx=0}return}if(e.state==='thrown'){const b=actorTravelBounds(18);e.timer-=dt;e.x=clamp(e.x+e.throwVx*dt,b.left,b.right);e.throwVx*=Math.pow(.22,dt);e.z+=e.vz*dt;e.vz-=1450*dt;if(catchEnemyOnPlatform(e))return;for(const other of enemies){if(other===e||other.dead||other.grabbed||other.level!==e.level||e.throwHits?.has(other))continue;if(Math.abs(other.x-e.x)<82&&Math.abs(other.y-e.y)<50){e.throwHits?.add(other);hurtEnemy(other,22,Math.sign(e.throwVx||-player.face)*310,e.playerThrown?{playerHit:true}:{});impact(other.x,other.y-75,22,false,e.throwVx);message='砸中了！身后也不安全';messageT=.85}}if(e.z<=0&&e.vz<0){for(const pit of currentPits())if(insidePit(e,pit))return dropEnemyIntoPit(e,pit);e.z=0;e.vz=0;e.throwVx=0;e.playerThrown=false;e.state='down';e.timer=1.05;impact(e.x,e.y-18,34,false,-player.face*220);if(e.hp<=0&&!e.dead){e.dead=true;player.kills++}}return}if(e.dead){if(e.timer>0)e.timer-=dt;return}e.attackT=Math.max(0,e.attackT-dt);e.slamT=Math.max(0,e.slamT-dt);if(e.grabbed)return;
    if(e.level<0&&e.subPit?.bunker!==player.subPit?.bunker){e.state='idle';return}
    e.slideT=Math.max(0,e.slideT-dt);e.specialT=Math.max(0,e.specialT-dt);e.suitDaggerT=Math.max(0,(e.suitDaggerT||0)-dt);e.suitBackflipT=Math.max(0,(e.suitBackflipT||0)-dt);const aim=enemyCombatTarget(e);
    if(e.level<0&&e.bunkerRoom&&!e.bunkerRoom.opened){e.state='idle';e.awake=false;return}
    if(e.type==='breaker'&&powerSwitch&&powerSwitch.on&&powerSwitch.level===e.level){
      if(e.state==='lightsOutCast'){e.timer-=dt;if(e.timer<=0){powerSwitch.on=false;powerSwitch.flash=.5;e.state='idle';e.specialT=1.2;message='咔哒——灯被他关了！打电闸开灯';messageT=1.25}return}
      const sx=powerSwitch.x-e.x,sy=powerSwitch.y-e.y;
      if(Math.abs(sx)<48&&Math.abs(sy)<34){setEnemyFace(e,sx);e.state='lightsOutCast';e.timer=.72;message='他摸到电闸了，快阻止他！';messageT=.75;return}
      const len=Math.hypot(sx,sy)||1,b=laneBoundsFor(e.level,e.y,42,e);e.currentHits=null;setEnemyFace(e,sx);e.x=clamp(e.x+sx/len*e.speed*1.18*dt,b.left,b.right);e.y+=sy/len*e.speed*.78*dt;e.state='run';return
    }
    if(e.type==='breaker'&&e.state==='breakerCurrent'){
      e.timer-=dt;const travel=clamp((.66-e.timer)/.5,0,1),start=e.currentStartY??e.y,previousMin=e.currentHeadMinY??start,previousMax=e.currentHeadMaxY??start,headMin=start+((e.currentMinY??start)-start)*travel,headMax=start+((e.currentMaxY??start)-start)*travel;e.currentHeadMinY=headMin;e.currentHeadMaxY=headMax;
      if(travel>0)for(const target of [player,...companions]){if(target.hp<=0||target.dead||target.level!==e.level||e.currentHits?.has(target)||Math.abs(target.x-e.x)>58)continue;const crossedUp=target.y>=Math.min(previousMin,headMin)-26&&target.y<=Math.max(previousMin,headMin)+26,crossedDown=target.y>=Math.min(previousMax,headMax)-26&&target.y<=Math.max(previousMax,headMax)+26;if(!crossedUp&&!crossedDown)continue;e.currentHits?.add(target);knockFriendlyTarget(target,enemyDmg(e,1.2),Math.sign(target.x-e.x||1)*28,{ignoreInv:true,launchVz:390});message='整条纵轴的电流弹道命中了！';messageT=.8}
      if(e.timer<=0){e.state='idle';e.currentHits=null}return
    }
    if(aim===player&&player.fallFromLevel!=null&&player.z>35){if(e.state==='slamCharge'||e.state==='slideWindup')e.state='idle';setEnemyFace(e,player.x-e.x);return}
    if(updateEnemySpecialState(e,dt))return;
    if(e.state==='slamCharge'){e.timer-=dt;const target=e.attackTarget&&e.attackTarget.hp>0?e.attackTarget:aim;e.slamTargetX=clamp(target.x,e.x-95,e.x+95);if(e.timer<=0){e.state='slamAir';e.timer=1.15;e.z=1;e.vz=e.elite?650:610;e.slamHit=false}return}
    if(e.state==='slamAir'){e.timer-=dt;e.x+=(e.slamTargetX-e.x)*Math.min(1,dt*3.2);e.z+=e.vz*dt;e.vz-=1320*dt;if(e.z<=0&&e.vz<0){e.z=0;e.vz=0;e.state='slamLand';e.timer=e.elite?.58:.5;if(!e.slamHit)heavySlamImpact(e)}return}
    if(e.state==='slamLand'){e.timer-=dt;if(e.timer<=0)e.state='idle';return}
    if(e.state==='slideWindup'){e.timer-=dt;if(e.timer<=0){e.state='slide';e.timer=.58;e.slideHit=false}return}
    if(e.state==='slide'){
      const b=laneBoundsFor(e.level,e.y,55,e),nextX=e.x+e.face*430*dt,hitEdge=nextX<b.left||nextX>b.right;
      e.timer-=dt;e.x=clamp(nextX,b.left,b.right);
      if(hitEdge){e.state='idle';e.attackT=.85;e.slideT=Math.max(e.slideT,.55);return}
      const target=e.attackTarget&&e.attackTarget.hp>0?e.attackTarget:aim;e.y+=(target.y-e.y)*Math.min(1,dt*2.6);
      const p=platformForLevel(e.level);if(p){const maxY=platformWalkMaxY(p);if(e.y>maxY)e.y=maxY;if(!insidePlatform(e.x,e.y,4,p)){const edge=laneBoundsFor(e.level,clamp(e.y,p.minY,maxY),55);e.x=clamp(e.x,edge.left,edge.right);e.y=clamp(e.y,p.minY,maxY);e.state='idle';e.attackT=.85;e.slideT=Math.max(e.slideT,.55);return}}
      const slideTarget=!e.slideHit&&enemySkillTarget(e,76,48,58);if(slideTarget){e.slideHit=true;knockFriendlyTarget(slideTarget,16,e.face*34,{launchVz:330})}
      if(e.timer<=0){e.state='idle';e.attackT=.65}return
    }
    if(e.vz>0||e.z>0){e.z+=e.vz*dt;e.vz-=1000*dt;if(e.z<=0){e.z=0;e.vz=0}}
    if(e.timer>0){e.timer-=dt;if(e.timer<=0)e.state='idle';return}
    const senseX=Math.abs(aim.x-e.x),senseY=Math.abs(aim.y-e.y),aggro=e.awake||(Math.abs(aim.level-e.level)<=2&&senseX<ENEMY_ALERT_X&&senseY<ENEMY_ALERT_Y);
    if(!aggro){e.state='idle';setEnemyFace(e,aim.x-e.x);return}
    e.awake=true;
    if(e.terrainNav||e.level!==aim.level){enemyUseStairs(e,dt,aim);return}
    const d=dist(e,aim),dx=aim.x-e.x,dy=aim.y-e.y;setEnemyFace(e,dx);
    if(e.type==='breaker'){
      const positionTarget=player.hp>0&&!player.dead&&player.level===e.level?player:aim,bounds=breakerYBounds(e),bx=positionTarget.x-e.x,by=positionTarget.y-e.y,span=Math.max(1,bounds.max-bounds.min),safeY=Math.min(220,span*.72),sp=e.speed||92;let moved=false;
      if(e.specialT<=0&&Math.abs(bx)<52){beginBreakerCurrent(e,positionTarget);return}
      if(Math.abs(by)<safeY){const away=by===0?(e.y>(bounds.min+bounds.max)*.5?1:-1):-Math.sign(by);e.y=clamp(e.y+away*sp*.82*dt,bounds.min,bounds.max);moved=true}
      const lane=laneBoundsFor(e.level,e.y,48,e);if(Math.abs(bx)>34){e.x=clamp(e.x+Math.sign(bx)*sp*dt,lane.left,lane.right);moved=true}
      setEnemyFace(e,bx);e.state=moved?'run':'idle';return
    }
    const facingTarget=!Math.sign(dx)||Math.sign(dx)===e.face;
    const canAttack=facingTarget;
    if((e.type==='suit'||e.specialT<=0)&&canAttack&&startEnemySpecial(e,d,aim))return;
    if(e.type==='heavy'&&e.slamT<=0&&d<225&&canAttack){e.attackTarget=aim;e.state='slamCharge';e.timer=e.elite?.62:.72;e.slamTargetX=aim.x;e.attackT=1.3;e.slamT=e.elite?2.8:3.7;message=e.elite?'他要砸地，离远点！':'胖子蹲下了……要跳了';messageT=.8;return}
    if(e.type==='skinny'&&e.slideT<=0&&d<310&&canAttack){e.attackTarget=aim;e.state='slideWindup';e.timer=.24;e.slideT=2.1+Math.random()*.8;message='他压低身体了……小心下段';messageT=.55;return}
    if(e.type==='whip'){
      const b=laneBoundsFor(e.level,e.y,55,e),safe=235,sp=e.speed||100;
      if(Math.abs(dy)>34){e.state='run';e.y+=Math.sign(dy)*sp*.62*dt;return}
      if(Math.abs(dx)<safe){e.state='run';e.x=clamp(e.x-Math.sign(dx||e.face)*sp*1.15*dt,b.left,b.right);return}
      if(Math.abs(dx)>390){e.state='run';e.x+=Math.sign(dx)*sp*.82*dt;return}
      e.state='idle';return
    }
    if(d>68){const sp=e.speed||80,move=forestSteeredVector(e,aim.x,aim.y);e.state='run';e.x+=Math.sign(move.dx)*sp*dt;e.y+=Math.sign(move.dy)*Math.max(48,sp*.62)*dt}
    else e.state='idle';
    const p=platformForLevel(e.level);if(e.type==='skinny'&&p&&e.state==='hurt'&&!insidePlatform(e.x,e.y,0,p)){e.level=0;e.x=clamp(e.x,55,WORLD_W-55);e.y=570;e.hp-=18;window.TieJieAudio?.hitEnemy(e.type,18,e.elite);e.state='down';e.timer=1;message='摔下去了……这高度够他受';messageT=1.1;if(e.hp<=0)e.dead=true}
  }

  function drawDesertRockNeedle(cx,baseY,h,w,seed,alpha=1){
    const j=(i,a)=>Math.sin(seed+i*17.37+a*51.91);
    g.save();g.globalAlpha=alpha;
    const grad=g.createLinearGradient(cx-w*.6,baseY-h,cx+w*.7,baseY);grad.addColorStop(0,'#f2a45b');grad.addColorStop(.38,'#c86938');grad.addColorStop(.78,'#78351f');grad.addColorStop(1,'#35170f');g.fillStyle=grad;
    g.beginPath();
    g.moveTo(cx-w*.42+j(1,1)*8,baseY);
    g.lineTo(cx-w*.34+j(2,1)*6,baseY-h*.28);
    g.lineTo(cx-w*.22+j(3,1)*6,baseY-h*.62);
    g.lineTo(cx-w*.34+j(4,1)*7,baseY-h*.78);
    g.lineTo(cx-w*.08+j(5,1)*5,baseY-h*.88);
    g.lineTo(cx+w*.24+j(6,1)*6,baseY-h*.82);
    g.lineTo(cx+w*.12+j(7,1)*5,baseY-h*.64);
    g.lineTo(cx+w*.34+j(8,1)*7,baseY-h*.3);
    g.lineTo(cx+w*.46+j(9,1)*8,baseY);
    g.closePath();g.fill();
    g.strokeStyle='#ffd08a55';g.lineWidth=3;for(let y=baseY-h*.82;y<baseY-12;y+=h*.16){g.beginPath();g.moveTo(cx-w*.28+j(y,2)*5,y);g.quadraticCurveTo(cx+j(y,3)*12,y-5,cx+w*.28+j(y,4)*5,y+2);g.stroke()}
    g.strokeStyle='#4a1f1490';g.lineWidth=2.2;for(let i=0;i<4;i++){const x=cx-w*.22+i*w*.14+j(i,5)*5;g.beginPath();g.moveTo(x,baseY-h*.76+j(i,6)*12);g.quadraticCurveTo(x+j(i,7)*16,baseY-h*.42,x+j(i,8)*8,baseY-8);g.stroke()}
    g.fillStyle='#2c120c55';g.beginPath();g.ellipse(cx+w*.18,baseY-h*.52,w*.13,h*.08,.2,0,6.3);g.fill();
    g.restore()
  }
  function drawDesertCanyonBand(startX,baseY,width,height,seed,alpha=.9){
    const j=(i,a)=>Math.sin(seed+i*13.71+a*47.13);
    g.save();g.globalAlpha=alpha;
    const topY=baseY-height;
    const grad=g.createLinearGradient(0,topY,0,baseY);grad.addColorStop(0,'#ef9f55');grad.addColorStop(.28,'#d8793f');grad.addColorStop(.64,'#914523');grad.addColorStop(1,'#442015');g.fillStyle=grad;
    g.beginPath();g.moveTo(startX,baseY);
    for(let x=startX;x<=startX+width;x+=95){
      const cap=topY+22+j(x,1)*24;
      g.lineTo(x+22+j(x,2)*14,cap);
      g.lineTo(x+70+j(x,3)*16,cap+8+j(x,4)*13);
    }
    g.lineTo(startX+width,baseY);g.closePath();g.fill();
    g.strokeStyle='#ffd49466';g.lineWidth=3;for(let y=topY+38;y<baseY-20;y+=36){g.beginPath();g.moveTo(startX+16,y+j(y,4)*4);for(let x=startX+80;x<startX+width-20;x+=130)g.quadraticCurveTo(x-55,y-6+j(x,5)*4,x,y+j(x,6)*4);g.stroke()}
    g.strokeStyle='#4b211690';g.lineWidth=2.5;for(let x=startX+38;x<startX+width-20;x+=48){g.beginPath();g.moveTo(x+j(x,7)*7,topY+34+j(x,8)*20);g.quadraticCurveTo(x+16+j(x,9)*12,topY+height*.55,x+j(x,10)*9,baseY-8);g.stroke()}
    for(let x=startX+70;x<startX+width-40;x+=210)drawDesertRockNeedle(x+j(x,11)*28,baseY+4,90+Math.abs(j(x,12))*120,46+Math.abs(j(x,13))*38,seed+x,.65);
    g.restore()
  }

  function drawGreatWallTree(cx,baseY,scale,seed,alpha=1){
    const j=(i,a)=>Math.sin(seed+i*12.73+a*41.19),h=118*scale,trunkW=Math.max(2.5,6.5*scale),dead=j(7,3)<-.58;
    g.save();g.globalAlpha=alpha;
    const trunk=g.createLinearGradient(cx-trunkW,0,cx+trunkW,0);trunk.addColorStop(0,'#101713');trunk.addColorStop(.46,'#403f30');trunk.addColorStop(1,'#0b120f');g.fillStyle=trunk;
    g.beginPath();g.moveTo(cx-trunkW*1.5,baseY);g.lineTo(cx-trunkW*.42+j(1,1)*3,baseY-h*.55);g.lineTo(cx-1+j(2,1)*3,baseY-h);g.lineTo(cx+trunkW*.4+j(3,1)*2,baseY-h*.5);g.lineTo(cx+trunkW*1.35,baseY);g.closePath();g.fill();
    g.strokeStyle='#171f19';g.lineCap='round';
    for(let i=0;i<6;i++){const q=(i+1)/7,by=baseY-h*(.18+q*.68),reach=h*(.18+q*.08)*(dead?1:.7),lean=j(i,2)*7*scale;g.lineWidth=Math.max(1,scale*(3.1-q*1.4));g.beginPath();g.moveTo(cx+lean,by);g.lineTo(cx-reach*(.65+Math.abs(j(i,3))*.35),by-h*.08*(.3+q));g.moveTo(cx+lean,by-3);g.lineTo(cx+reach*(.58+Math.abs(j(i,4))*.38),by-h*.07*(.2+q));g.stroke()}
    if(!dead){
      const canopy=g.createLinearGradient(0,baseY-h,0,baseY-h*.08);canopy.addColorStop(0,'#465442');canopy.addColorStop(.5,'#26372c');canopy.addColorStop(1,'#101d18');g.fillStyle=canopy;
      for(let i=0;i<7;i++){
        const q=i/6,cy=baseY-h*(.88-q*.105)+j(i,5)*3*scale,half=h*(.08+q*.18)*(1+j(i,6)*.14),lean=j(i,7)*8*scale;
        g.beginPath();g.moveTo(cx+lean,cy-h*.15);g.lineTo(cx-half*.38,cy-h*.035);g.lineTo(cx-half,cy+h*.08);g.lineTo(cx-half*.28,cy+h*.045);g.lineTo(cx+lean-j(i,8)*5,cy+h*.14);g.lineTo(cx+half*.32,cy+h*.05);g.lineTo(cx+half,cy+h*.09);g.lineTo(cx+half*.4,cy-h*.035);g.closePath();g.fill();
        g.strokeStyle='#78816a24';g.lineWidth=1;g.beginPath();g.moveTo(cx+lean,cy-h*.1);g.lineTo(cx-half*.76,cy+h*.065);g.moveTo(cx+lean,cy-h*.08);g.lineTo(cx+half*.72,cy+h*.07);g.stroke()
      }
    }
    g.restore()
  }
  function drawGreatWallForestLayer(baseY,spacing,scale,seed,alpha){
    const start=Math.floor((cameraX-180)/spacing)*spacing,end=cameraX+W+180;
    for(let x=start;x<end;x+=spacing){const j=Math.sin(seed+x*.017),s=scale*(.82+Math.abs(Math.sin(seed+x*.031))*.36);drawGreatWallTree(x+j*spacing*.34,baseY+Math.sin(seed+x*.009)*13,s,seed+x*.007,alpha)}
  }
  function drawGreatWallEdgePlants(l,r,y,seed,density=1){
    const visibleStart=Math.max(l,cameraX-90),end=Math.min(r,cameraX+W+90);if(end<=visibleStart)return;
    const step=34/density,anchor=l+18,start=anchor+Math.max(0,Math.ceil((visibleStart-anchor)/step))*step;
    g.save();
    for(let x=start;x<end-12;x+=step){
      const j=Math.sin(seed+x*.071),h=7+Math.abs(Math.sin(seed*2.1+x*.113))*17;
      g.strokeStyle=j>.12?'#60734d':'#394b36';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y+2);g.quadraticCurveTo(x-4-j*5,y-h*.58,x-7-j*7,y-h);g.moveTo(x+2,y+2);g.quadraticCurveTo(x+6+j*4,y-h*.54,x+8+j*6,y-h*.88);g.stroke();
      if(j>.58){g.fillStyle='#899565aa';g.beginPath();g.ellipse(x-5,y-h*.54,4.5,2.2,-.5,0,6.3);g.ellipse(x+5,y-h*.43,4,2,.45,0,6.3);g.fill()}
      if(j<-.76){g.fillStyle='#c5b274bb';g.beginPath();g.arc(x+2,y-h-2,2.3,0,6.3);g.fill()}
    }
    const bushAnchor=l+46,bushStart=bushAnchor+Math.max(0,Math.ceil((visibleStart-bushAnchor)/128))*128;
    g.fillStyle='#2c3b3066';for(let x=bushStart;x<end;x+=128){const w=34+Math.abs(Math.sin(seed+x*.019))*38;g.beginPath();g.moveTo(x-w,y);for(let i=0;i<=8;i++){const q=i/8;g.lineTo(x-w+q*w*2,y-4-Math.abs(Math.sin(seed+x*.03+i*2.1))*15)}g.lineTo(x+w,y+2);g.closePath();g.fill()}
    g.restore()
  }
  function drawGreatWallWallVegetation(l,r,top,bottom,seed){
    const visibleStart=Math.max(l,cameraX-80),end=Math.min(r,cameraX+W+80),height=bottom-top;if(end<=visibleStart||height<24)return;
    const patchAnchor=l+54,patchStart=patchAnchor+Math.max(0,Math.ceil((visibleStart-patchAnchor)/118))*118;
    const vineAnchor=l+92,vineStart=vineAnchor+Math.max(0,Math.ceil((visibleStart-vineAnchor)/205))*205;
    g.save();
    for(let x=patchStart;x<end-20;x+=118){
      const j=Math.sin(seed+x*.043);if(j<-.48)continue;
      const py=top+18+Math.abs(Math.sin(seed+x*.021))*Math.min(52,height*.35),pw=24+Math.abs(j)*34;
      g.fillStyle=j>.45?'#53634470':'#34463465';g.beginPath();g.ellipse(x,py,pw,5+Math.abs(j)*5,j*.08,0,6.3);g.fill();
    }
    for(let x=vineStart;x<end-24;x+=205){
      const j=Math.sin(seed*1.7+x*.037);if(j<-.22)continue;
      const vineTop=top+15+Math.abs(j)*28,len=Math.min(height*.68,42+Math.abs(Math.sin(seed+x*.063))*108);
      g.strokeStyle=j>.46?'#516541aa':'#364d37aa';g.lineWidth=2.2;g.beginPath();g.moveTo(x,vineTop);g.bezierCurveTo(x+18*j,vineTop+len*.28,x-20*j,vineTop+len*.68,x+8*j,vineTop+len);g.stroke();
      g.fillStyle='#647653aa';for(let i=1;i<5;i++){const q=i/5,vy=vineTop+len*q,vx=x+Math.sin(seed+x*.05+i*1.8)*7,side=i%2?-1:1;g.beginPath();g.ellipse(vx+side*4,vy,5,2.6,side*.6,0,6.3);g.fill()}
    }
    g.restore()
  }

  function drawTiledImage(image,l,top,r,bottom,tileW,tileH,alpha=1){
    if(!image||!(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth))return false;
    const visibleLeft=Math.max(l,cameraX-4),visibleRight=Math.min(r,cameraX+W+4);
    if(visibleRight<=visibleLeft||bottom<=top)return false;
    const startX=Math.floor(visibleLeft/tileW)*tileW;
    g.save();g.beginPath();g.rect(visibleLeft,top,visibleRight-visibleLeft,bottom-top);g.clip();g.globalAlpha=alpha;
    for(let y=top;y<bottom;y+=tileH)for(let x=startX;x<visibleRight;x+=tileW)g.drawImage(image,x,y,tileW,tileH);
    g.restore();return true
  }

  function atlasReady(image){return!!image&&(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth)}
  function drawAtlasCell(image,col,row,x,y,w,h,alpha=1){
    if(!atlasReady(image))return false;
    const cellW=(image.naturalWidth||image.width)/2,cellH=(image.naturalHeight||image.height)/2,inset=4;
    g.save();g.globalAlpha=alpha;g.drawImage(image,col*cellW+inset,row*cellH+inset,cellW-inset*2,cellH-inset*2,x,y,w,h);g.restore();return true
  }
  function drawAtlasCellBottomAligned(image,col,row,bounds,x,baseY,w,alpha=1){
    if(!atlasReady(image))return false;
    const cellW=(image.naturalWidth||image.width)/2,cellH=(image.naturalHeight||image.height)/2,[left,top,right,bottom]=bounds,sourceW=right-left,sourceH=bottom-top,h=w*sourceH/sourceW;
    g.save();g.globalAlpha=alpha;g.drawImage(image,col*cellW+left,row*cellH+top,sourceW,sourceH,x,baseY-h,w,h);g.restore();return true
  }
  function drawWaterShelterAtlasCell(image,col,row,x,y,w,h,alpha=1){
    if(!atlasReady(image))return false;
    const cellW=(image.naturalWidth||image.width)/2,cellH=(image.naturalHeight||image.height)/2,inset=14;
    g.save();g.globalAlpha=alpha;g.drawImage(image,col*cellW+inset,row*cellH+inset,cellW-inset*2,cellH-inset*2,x,y,w,h);g.restore();return true
  }
  function drawDesertAtlasCell(image,col,row,x,y,w,h,alpha=1){
    if(!atlasReady(image))return false;
    const cellW=(image.naturalWidth||image.width)/2,cellH=(image.naturalHeight||image.height)/2,inset=5;
    g.save();g.globalAlpha=alpha;g.drawImage(image,col*cellW+inset,row*cellH+inset,cellW-inset*2,cellH-inset*2,x,y,w,h);g.restore();return true
  }
  function drawTiledDesertAtlasCell(image,col,row,l,top,r,bottom,tileW,tileH,alpha=1){
    if(!atlasReady(image)||r<=l||bottom<=top)return false;
    const visibleLeft=Math.max(l,cameraX-4),visibleRight=Math.min(r,cameraX+W+4);if(visibleRight<=visibleLeft)return false;
    const start=Math.floor((visibleLeft-l)/tileW)*tileW+l;
    g.save();g.beginPath();g.rect(visibleLeft,top,visibleRight-visibleLeft,bottom-top);g.clip();for(let y=top;y<bottom;y+=tileH)for(let x=start;x<visibleRight;x+=tileW)drawDesertAtlasCell(image,col,row,x,y,tileW+1,tileH+1,alpha);g.restore();return true
  }
  function drawTiledAtlasCell(image,col,row,l,top,r,bottom,tileW,tileH,alpha=1){
    if(!atlasReady(image)||r<=l||bottom<=top)return false;
    const visibleLeft=Math.max(l,cameraX-4),visibleRight=Math.min(r,cameraX+W+4);if(visibleRight<=visibleLeft)return false;
    const start=Math.floor((visibleLeft-l)/tileW)*tileW+l;
    g.save();g.beginPath();g.rect(visibleLeft,top,visibleRight-visibleLeft,bottom-top);g.clip();
    for(let y=top;y<bottom;y+=tileH)for(let x=start;x<visibleRight;x+=tileW)drawAtlasCell(image,col,row,x,y,tileW+1,tileH+1,alpha);
    g.restore();return true
  }
  function drawTiledWaterShelterAtlasCell(image,col,row,l,top,r,bottom,tileW,tileH,alpha=1){
    if(!atlasReady(image)||r<=l||bottom<=top)return false;
    const visibleLeft=Math.max(l,cameraX-4),visibleRight=Math.min(r,cameraX+W+4);if(visibleRight<=visibleLeft)return false;
    const start=Math.floor((visibleLeft-l)/tileW)*tileW+l;
    g.save();g.beginPath();g.rect(visibleLeft,top,visibleRight-visibleLeft,bottom-top);g.clip();
    for(let y=top;y<bottom;y+=tileH)for(let x=start;x<visibleRight;x+=tileW)drawWaterShelterAtlasCell(image,col,row,x,y,tileW+1,tileH+1,alpha);
    g.restore();return true
  }
  function drawSkyShelterOuterBoundary(left,right,baseY,worldOffsetX=0){
    if(!atlasReady(skyShelterBoundariesAtlas)||right<=left)return false;
    const tileW=520,bounds=[11,221,500,325],viewLeft=cameraX-worldOffsetX,visibleLeft=Math.max(left,viewLeft-8),visibleRight=Math.min(right,viewLeft+W+8),start=Math.floor((visibleLeft-left)/tileW)*tileW+left;
    for(let x=start;x<visibleRight;x+=tileW)drawAtlasCellBottomAligned(skyShelterBoundariesAtlas,0,0,bounds,x-2,baseY,tileW+4,1);return true
  }

  const FOREST_ATLAS_CELL=512,FOREST_ATLAS_INSET=3;
  function forestAtlasReady(image){return!!image&&(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth)}
  function drawForestAtlasCell(image,col,row,x,y,w,h,alpha=1){
    if(!forestAtlasReady(image))return false;
    const i=FOREST_ATLAS_INSET,sx=col*FOREST_ATLAS_CELL+i,sy=row*FOREST_ATLAS_CELL+i,sw=FOREST_ATLAS_CELL-i*2,sh=FOREST_ATLAS_CELL-i*2;
    g.save();g.globalAlpha=alpha;g.drawImage(image,sx,sy,sw,sh,x,y,w,h);g.restore();return true
  }
  function drawTiledForestAtlasCell(image,col,row,l,top,r,bottom,tileW,tileH,alpha=1){
    if(!forestAtlasReady(image))return false;
    const visibleLeft=Math.max(l,cameraX-4),visibleRight=Math.min(r,cameraX+W+4);if(visibleRight<=visibleLeft||bottom<=top)return false;
    const startX=Math.floor((visibleLeft-l)/tileW)*tileW+l;
    g.save();g.beginPath();g.rect(visibleLeft,top,visibleRight-visibleLeft,bottom-top);g.clip();for(let y=top;y<bottom;y+=tileH)for(let x=startX;x<visibleRight;x+=tileW)drawForestAtlasCell(image,col,row,x,y,tileW,tileH,alpha);g.restore();return true
  }
  function traceIrregularSwamp(z){
    const steps=20;g.beginPath();g.moveTo(swampEdgeX(z,z.y,false),z.y);
    for(let i=1;i<=steps;i++){const y=z.y+z.h*i/steps;g.lineTo(swampEdgeX(z,y,false),y)}
    for(let i=steps;i>=0;i--){const y=z.y+z.h*i/steps;g.lineTo(swampEdgeX(z,y,true),y)}
    g.closePath()
  }
  function drawIrregularSwamp(z){
    g.save();traceIrregularSwamp(z);g.clip();drawTiledForestAtlasCell(forestTerrainAtlas,1,0,z.x-42,z.y,z.x+z.w+42,z.y+z.h,410,320,1);g.restore()
  }
  function drawImpassableBoundary(row,left,right,baseY,tileW,tileH){
    if(!forestAtlasReady(environmentBoundaryAtlas)||right<=left)return false;
    const visibleLeft=Math.max(left,cameraX-6),visibleRight=Math.min(right,cameraX+W+6);if(visibleRight<=visibleLeft)return false;
    const cell=512,inset=3,sourceSize=cell-inset*2,bottomRatio=row===0?.85:.81,start=Math.floor((visibleLeft-left)/tileW)*tileW+left;
    g.save();g.beginPath();g.rect(visibleLeft,baseY-tileH,visibleRight-visibleLeft,tileH+8);g.clip();
    for(let x=start;x<visibleRight;x+=tileW){const index=Math.floor((x-left)/tileW),col=((index%2)+2)%2;g.drawImage(environmentBoundaryAtlas,col*cell+inset,row*cell+inset,sourceSize,sourceSize,x-2,baseY-tileH*bottomRatio,tileW+4,tileH)}
    g.restore();return true
  }

  function drawParallaxStrip(image,top,bottom,tileW,parallax=.7,alpha=1,followViewport=true){
    if(!image||!(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth)||bottom<=top)return false;
    const sourceW=image.naturalWidth||image.width,sourceH=image.naturalHeight||image.height;
    const scale=followViewport?Math.max(H/sourceH,tileW/sourceW):tileW/sourceW,tileDrawW=sourceW*scale,tileH=followViewport?sourceH*scale:bottom-top,drawTop=followViewport?cameraY+H-tileH:top;
    const phase=cameraX*parallax,first=Math.floor((cameraX-phase)/tileDrawW)-1,last=Math.ceil((cameraX+W-phase)/tileDrawW)+1;
    g.save();g.beginPath();g.rect(cameraX,followViewport?cameraY:top,W,followViewport?H:tileH);g.clip();g.globalAlpha=alpha;
    for(let i=first;i<=last;i++){
      const x=phase+i*tileDrawW;
      if(i&1){g.save();g.translate(x+tileDrawW+1,0);g.scale(-1,1);g.drawImage(image,0,drawTop,tileDrawW+2,tileH);g.restore()}
      else g.drawImage(image,x-1,drawTop,tileDrawW+2,tileH)
    }
    g.restore();return true
  }

  function drawThemeOverlay(){
    const t=currentStageTheme,viewLeft=cameraX-360,viewRight=cameraX+W+360;g.save();
    if(t==='沙漠'){
      if(atlasReady(desertYardangBackground)&&atlasReady(desertYardangTerrainAtlas)){
        g.fillStyle='#7fd0f5';g.fillRect(cameraX,cameraY,W,H);
        drawParallaxStrip(desertYardangBackground,cameraY,GROUND_MIN_Y+34,1024,.64,1);
        drawTiledDesertAtlasCell(desertYardangTerrainAtlas,0,0,cameraX,GROUND_MIN_Y,cameraX+W,cameraY+H+90,420,320,1);
        g.restore();return
      }
      const sky=g.createLinearGradient(0,cameraY,0,cameraY+H);sky.addColorStop(0,'#071b36');sky.addColorStop(.34,'#16416a');sky.addColorStop(.62,'#d76d38');sky.addColorStop(.86,'#9c3e25');sky.addColorStop(1,'#4b1f19');g.fillStyle=sky;g.fillRect(cameraX,cameraY,W,H);
      const sunX=cameraX+W*.58,sunY=cameraY+120;
      const glow=g.createRadialGradient(sunX,sunY,26,sunX,sunY,300);glow.addColorStop(0,'#ffe889bb');glow.addColorStop(.24,'#ff9c3b77');glow.addColorStop(.6,'#d44e2d35');glow.addColorStop(1,'#10254400');g.fillStyle=glow;g.beginPath();g.arc(sunX,sunY,300,0,6.3);g.fill();
      g.fillStyle='#ffdf7a';g.beginPath();g.arc(sunX,sunY,48,0,6.3);g.fill();
      const upperSky=g.createLinearGradient(0,cameraY,0,cameraY+150);upperSky.addColorStop(0,'#06173344');upperSky.addColorStop(1,'#06173300');g.fillStyle=upperSky;g.fillRect(cameraX,cameraY,W,150);
      g.fillStyle='#fff4dd70';for(let x=cameraX+180;x<cameraX+W;x+=430){g.beginPath();g.ellipse(x,cameraY+128+Math.sin(x*.01)*20,44,10,0,0,6.3);g.ellipse(x+42,cameraY+116+Math.sin(x*.012)*14,30,8,0,0,6.3);g.fill()}
      for(let x=-420;x<WORLD_W;x+=960)if(x+980>=viewLeft&&x<=viewRight)drawDesertCanyonBand(x,520,980,160,2.7+x*.003,.58);
      for(let x=-680;x<WORLD_W;x+=1280)if(x+1300>=viewLeft&&x+120<=viewRight)drawDesertCanyonBand(x+120,575,1180,260,7.2+x*.002,.9);
      for(let x=-220;x<WORLD_W;x+=1400)if(x+400>=viewLeft&&x+70<=viewRight)drawDesertRockNeedle(x+70,560,330,170,13+x*.005,.72);
      const dgTop=520,bottom=cameraY+H+80,near=g.createLinearGradient(0,dgTop,0,bottom);near.addColorStop(0,'#5a2820');near.addColorStop(.12,'#94402a');near.addColorStop(.3,'#b8542b');near.addColorStop(.65,'#6b3025');near.addColorStop(1,'#160b14');g.fillStyle=near;g.fillRect(cameraX,dgTop,W,bottom-dgTop);
      const desertLineStart=Math.floor(viewLeft/230)*230;
      g.strokeStyle='#ffb3574a';g.lineWidth=3;for(let y=dgTop+20;y<bottom-34;y+=42){g.beginPath();let first=true;for(let x=desertLineStart;x<viewRight;x+=230){const yy=y+Math.sin((x+y)*.01)*7;if(first){g.moveTo(x,yy);first=false}else g.quadraticCurveTo(x-110,yy-17,x,yy)}g.stroke()}
      const desertDarkStart=Math.floor(viewLeft/300)*300;
      g.strokeStyle='#2a142255';g.lineWidth=2;for(let y=dgTop+52;y<bottom-20;y+=52){g.beginPath();let first=true;for(let x=desertDarkStart;x<viewRight;x+=300){const yy=y+Math.cos((x-y)*.009)*5;if(first){g.moveTo(x,yy);first=false}else g.quadraticCurveTo(x-125,yy+18,x,yy)}g.stroke()}
    }
    else if(t==='草地'){
      const sky=g.createLinearGradient(0,cameraY,0,cameraY+H);sky.addColorStop(0,'#d1d9df');sky.addColorStop(.46,'#8ea6b4');sky.addColorStop(.7,'#5e756f');sky.addColorStop(1,'#2d3a31');g.fillStyle=sky;g.fillRect(cameraX,cameraY,W,H);
      if(!drawParallaxStrip(greatWallMountainLayer,cameraY,GROUND_Y+34,720,.72,1))for(let x=-520;x<WORLD_W;x+=980){
          if(x+1040<viewLeft||x>viewRight)continue;
          const ridge=g.createLinearGradient(0,260,0,585);ridge.addColorStop(0,'#536c76');ridge.addColorStop(.45,'#324c49');ridge.addColorStop(1,'#1c2d26');g.fillStyle=ridge;
          g.beginPath();g.moveTo(x,520);g.quadraticCurveTo(x+240,250,x+560,480);g.quadraticCurveTo(x+720,348,x+1040,508);g.lineTo(x+1040,650);g.lineTo(x,650);g.closePath();g.fill();
          g.strokeStyle='#9caeaf77';g.lineWidth=7;g.beginPath();g.moveTo(x+120,385);g.quadraticCurveTo(x+340,322,x+560,386);g.quadraticCurveTo(x+720,340,x+915,390);g.stroke();
        }
      // The two forest layers sat entirely behind the tall wall for almost the
      // whole stage. They were invisible but still built hundreds of canvas
      // paths every frame, so do not render them.
      const bottom=cameraY+H+80,near=g.createLinearGradient(0,GROUND_Y,0,bottom);near.addColorStop(0,'#8a704d');near.addColorStop(.32,'#645238');near.addColorStop(.72,'#2f3127');near.addColorStop(1,'#10130f');g.fillStyle=near;g.fillRect(cameraX,GROUND_Y,W,bottom-GROUND_Y);
      if(!drawTiledImage(greatWallGroundTile,cameraX,GROUND_Y,cameraX+W,bottom,320,320,.72)){
        const wallLineStart=Math.floor(viewLeft/230)*230;
        g.strokeStyle='#b6976566';g.lineWidth=3;for(let y=GROUND_Y+18;y<bottom-36;y+=42){g.beginPath();let first=true;for(let x=wallLineStart;x<viewRight;x+=230){const yy=y+Math.sin((x+y)*.011)*6;if(first){g.moveTo(x,yy);first=false}else g.quadraticCurveTo(x-110,yy-13,x,yy)}g.stroke()}
        const wallDarkStart=Math.floor(viewLeft/280)*280;
        g.strokeStyle='#1b241d88';g.lineWidth=2;for(let y=GROUND_Y+48;y<bottom-20;y+=54){g.beginPath();let first=true;for(let x=wallDarkStart;x<viewRight;x+=280){const yy=y+Math.cos((x-y)*.01)*5;if(first){g.moveTo(x,yy);first=false}else g.quadraticCurveTo(x-120,yy+15,x,yy)}g.stroke()}
      }
      // Keep the Great Wall masonry clean. Ground and wall vegetation added a
      // surprising number of tiny paths on the Douyin canvas every frame.
    }
    else if(t==='街区'){
      if(!drawParallaxStrip(oldAlleyBackground,cameraY,GROUND_Y+26,720,.68,1)){g.fillStyle='#182226';g.fillRect(cameraX,cameraY,W,GROUND_Y+26-cameraY)}
    }
    else if(t==='水中避难所'){
      if(!drawParallaxStrip(waterShelterOceanBackground,cameraY,GROUND_Y+26,1240,.58,1)){g.fillStyle='#7c9eaa';g.fillRect(cameraX,cameraY,W,GROUND_Y+26-cameraY)}
    }
    else if(t==='室内'||t==='地下车库'){g.fillStyle=t==='室内'?'#2f2b2440':'#18202955';g.fillRect(cameraX,cameraY,W,H);g.strokeStyle='#8a817044';for(let y=120;y<660;y+=70){g.beginPath();g.moveTo(0,y);g.lineTo(WORLD_W,y);g.stroke()}}
    else if(t==='高楼'){
      if(!drawParallaxStrip(skyShelterBackground,cameraY,GROUND_Y+26,1024,.64,1)){const sky=g.createLinearGradient(0,cameraY,0,GROUND_Y+26);sky.addColorStop(0,'#bfe5f3');sky.addColorStop(1,'#eef5e6');g.fillStyle=sky;g.fillRect(cameraX,cameraY,W,GROUND_Y+26-cameraY)}
    }
    else if(t==='屋顶'){g.fillStyle='#0b111866';g.fillRect(cameraX,cameraY,W,H);g.strokeStyle='#8ba5b544';for(let x=80;x<WORLD_W;x+=120){g.beginPath();g.moveTo(x,cameraY-H);g.lineTo(x,650);g.stroke()}}
    else if(t==='森林'){
      const backdropReady=window.TieJieAssets?.imageReady?.(forestBackdropTile)||forestBackdropTile?.complete&&forestBackdropTile.naturalWidth;
      if(backdropReady)drawParallaxStrip(forestBackdropTile,0,1600,2048,.72,1,false);
      drawTiledForestAtlasCell(forestTerrainAtlas,0,0,0,GROUND_MIN_Y,WORLD_W,GROUND_MAX_Y+180,420,320,1)
    }
    else if(t==='码头'){g.fillStyle='#12334a33';g.fillRect(cameraX,cameraY,W,H);g.strokeStyle='#5b7c8155';for(let x=0;x<WORLD_W;x+=95){g.beginPath();g.moveTo(x,520);g.lineTo(x+55,500);g.lineTo(x+110,520);g.stroke()}}
    else if(t==='工厂'){g.fillStyle='#40201533';g.fillRect(cameraX,cameraY,W,H);g.strokeStyle='#b25e3655';for(let x=120;x<WORLD_W;x+=260){g.beginPath();g.moveTo(x,260);g.lineTo(x,120);g.lineTo(x+55,120);g.lineTo(x+55,260);g.stroke()}}
    else if(t==='夜市'){g.fillStyle='#37124d33';g.fillRect(cameraX,cameraY,W,H);for(let x=80;x<WORLD_W;x+=170){g.fillStyle=x%340?'#d95b5b88':'#e0b64f88';g.beginPath();g.arc(x,245,8,0,6.3);g.fill()}}
    g.restore()
  }

  function drawScene(){
    const grad=g.createLinearGradient(0,cameraY,0,cameraY+H);grad.addColorStop(0,'#101d22');grad.addColorStop(.62,'#223034');grad.addColorStop(1,'#171a19');g.fillStyle=grad;g.fillRect(cameraX,cameraY,W,H);
    // The surface is completely hidden while the player is in an underground
    // branch. Skipping its background, modules, props and hazards avoids a
    // second full scene render on the Douyin Skity/Krypton canvas.
    if(player.level<0){drawLowerLayer();return}
    g.fillStyle='#d9d0a8';g.beginPath();g.arc(cameraX+145,cameraY+104,37,0,6.3);g.fill();g.fillStyle='#7e8984';g.beginPath();g.arc(cameraX+132,cameraY+94,8,0,6.3);g.arc(cameraX+157,cameraY+115,11,0,6.3);g.fill();
    drawThemeOverlay();for(const m of sceneModules)if(shouldDrawModule(m))drawModule(m);
    // Separate reusable props placed over the base modules.
    if(!TERRAIN_BY_THEME[currentStageTheme]){lamp(615,328);lamp(1085,348);lamp(1715,338);crate(70,455,90,48);crate(1160,472,78,40);crate(1890,452,110,55);warningSign(746,424);warningSign(1510,432)}drawLongMapProps();drawHazards();if(player.level<0)drawLowerLayer();
    if(!window.TieJieAssets?.runtimeUsesLocalPaths){const vignette=g.createRadialGradient(cameraX+W*.5,cameraY+H*.48,150,cameraX+W*.5,cameraY+H*.5,760);vignette.addColorStop(0,'#00000008');vignette.addColorStop(.62,'#00000022');vignette.addColorStop(1,'#000000b8');g.fillStyle=vignette;g.fillRect(cameraX,cameraY,W,H)}
  }
  function shouldDrawModule(m){
    if(TERRAIN_BY_THEME[currentStageTheme]){
      if(currentStageTheme==='街区')return !['skyline','stairs','platform'].includes(m.type);
      if(currentStageTheme==='水中避难所')return m.type==='mud';
      if(currentStageTheme==='沙漠')return ['wall','mud'].includes(m.type);
      if(currentStageTheme==='草地')return false;
      if(currentStageTheme==='室内')return ['wall','mud'].includes(m.type);
      if(currentStageTheme==='高楼')return ['wall','mud'].includes(m.type);
      if(currentStageTheme==='森林')return false;
      return ['skyline','mud'].includes(m.type);
    }
    if(currentStageTheme==='屋顶')return !['market','fence'].includes(m.type);
    return true
  }
  function drawLongMapProps(){
    const t=currentStageTheme;for(let x=460;x<WORLD_W-160;x+=520){if(x+430<cameraX-120||x>cameraX+W+120)continue;if(t==='沙漠'){
        g.strokeStyle='#5d401f55';g.lineWidth=3;g.beginPath();g.moveTo(x+40,590);g.quadraticCurveTo(x+96,574,x+152,590);g.stroke();
      }
      else if(t==='草地'){continue}
      else if(t==='高楼'){continue}
      else if(t==='屋顶'){g.strokeStyle='#6f858c';g.lineWidth=8;g.strokeRect(x,340,128,138);g.strokeStyle='#c06a3e';g.lineWidth=5;g.beginPath();g.moveTo(x-12,340);g.lineTo(x+140,478);g.moveTo(x+140,340);g.lineTo(x-12,478);g.stroke()}
      else if(t==='室内'){g.fillStyle='#151819';g.fillRect(x,385,120,94);g.fillStyle='#6a5543';g.fillRect(x+12,400,96,56);g.fillStyle='#b88a49';g.fillRect(x+26,414,68,10)}
      else if(t==='水中避难所')continue
      else if(t==='森林'){continue}
      else if(t==='码头'){g.fillStyle='#5b4129';g.fillRect(x,450,150,28);g.strokeStyle='#2f2017';g.lineWidth=8;g.beginPath();g.moveTo(x+22,450);g.lineTo(x+22,500);g.moveTo(x+124,450);g.lineTo(x+124,500);g.stroke()}
      else if(t==='工厂'){g.fillStyle='#292d2e';g.fillRect(x,392,115,88);g.strokeStyle='#a45a35';g.lineWidth=7;g.beginPath();g.moveTo(x+18,392);g.lineTo(x+18,335);g.moveTo(x+78,392);g.lineTo(x+78,315);g.stroke()}
      else if(t==='夜市'){g.fillStyle='#692f31';g.fillRect(x,388,145,92);g.fillStyle='#d7aa4e';g.fillRect(x-8,372,160,20);g.fillStyle='#f0d27a';for(let i=0;i<4;i++){g.beginPath();g.arc(x+28+i*30,420,9,0,6.3);g.fill()}g.strokeStyle='#ffd37a';g.lineWidth=3;g.beginPath();g.moveTo(x+18,444);g.lineTo(x+126,444);g.stroke()}
      else if(t==='地下车库'){g.fillStyle='#1c2528';g.fillRect(x,405,150,70);g.strokeStyle='#d2a544';g.lineWidth=7;g.beginPath();g.moveTo(x,405);g.lineTo(x+150,475);g.stroke()}
      else{crate(x,452,88,44);if(x%1040===460)lamp(x+180,336)}
    }
    if(TERRAIN_BY_THEME[t])drawActiveTerrain();
    if(t==='沙漠')drawDesertDetails();
  }
  function drawDesertDetails(){
    g.save();
    g.strokeStyle='#ff9e4a2f';g.lineWidth=2.5;
    for(let x=260;x<WORLD_W;x+=680){if(x+168<cameraX-120||x>cameraX+W+120)continue;g.beginPath();g.moveTo(x,618);g.quadraticCurveTo(x+78,594,x+168,616);g.stroke()}
    g.strokeStyle='#1f10203f';g.lineWidth=2;
    for(let x=120;x<WORLD_W;x+=860){if(x+315<cameraX-120||x>cameraX+W+120)continue;g.beginPath();g.moveTo(x,660);g.quadraticCurveTo(x+150,632,x+315,658);g.stroke()}
    g.restore()
  }
  function terrainStyle(){
    const t=currentStageTheme;
    if(t==='街区')return{pitFill:'#101416dd',pitStroke:'#596063',pitText:'#d6a45d',ledge:'#101416',platform1:'#626869',platform2:'#535c5e',stroke:'#8a492d',stripe:'#293234',stair:'#444d4f',step:'#687173'};
    if(t==='水中避难所')return{pitFill:'#07171dcc',pitStroke:'#77a5aa',pitText:'#b9d8d7',ledge:'#142326',platform1:'#536b6b',platform2:'#3d5557',stroke:'#8ba3a0',stripe:'#24383a',stair:'#40595b',step:'#9eb3ae'};
    if(t==='沙漠')return{pitFill:'#2b2117e8',pitStroke:'#d7ad67',pitText:'#ffe1a5',ledge:'#72502e',platform1:'#d7a65f',platform2:'#b98243',stroke:'#f1c77c',stripe:'#8a6035',stair:'#c69350',step:'#f1cf8b'};
    if(t==='草地')return{pitFill:'#080705dd',pitStroke:'#9b9380',pitText:'#e7dfcf',ledge:'#211d18',platform1:'#8f8877',platform2:'#746d60',stroke:'#d9d0bd',stripe:'#3e382f',stair:'#776f61',step:'#d9d0bd'};
    if(t==='高楼')return{pitFill:'#26363ddd',pitStroke:'#d9e2df',pitText:'#eff7f3',ledge:'#d5ddd8',platform1:'#edf0e8',platform2:'#dfe6df',stroke:'#b9c8c5',stripe:'#8fa09e',stair:'#b8c3c0',step:'#eef3ef'};
    if(t==='室内')return{pitFill:'#100c0acc',pitStroke:'#b08751',pitText:'#d7b47c',ledge:'#171311',platform1:'#5d3d2e',platform2:'#3f3029',stroke:'#be9057',stripe:'#2a201c',stair:'#46352c',step:'#b89162'};
    if(t==='森林')return{pitFill:'#090806ee',pitStroke:'#6d5735',pitText:'#b49458',ledge:'#17130d',platform1:'#55422d',platform2:'#30271d',stroke:'#806440',stripe:'#241b13',stair:'#503a25',step:'#a07a4c'};
    return{pitFill:'#170d09dd',pitStroke:'#a9824d',pitText:'#d0a466',ledge:'#24120c',platform1:'#6b3c24',platform2:'#58301e',stroke:'#b8793e',stripe:'#341b12',stair:'#4b2a1b',step:'#c08a52'};
  }
  function drawActiveTerrain(){
    const style=terrainStyle(),t=currentStageTheme;
    const viewLeft=cameraX-140,viewRight=cameraX+W+140;
    g.save();
    if(t==='森林')drawImpassableBoundary(1,0,WORLD_W,GROUND_MIN_Y,520,340);
    else if(t==='草地')drawImpassableBoundary(0,0,WORLD_W,GROUND_Y,520,150);
    for(const z of currentSlowZones()){if(z.x+z.w<viewLeft||z.x>viewRight)continue;if(z.type==='swamp'&&z.irregular)drawIrregularSwamp(z);else drawTiledForestAtlasCell(forestTerrainAtlas,1,0,z.x,z.y,z.x+z.w,z.y+z.h,410,320,1)}
    for(const pit of currentPits()){
      if(pit.x+pit.w<viewLeft||pit.x>viewRight)continue;
      if(pit.shape==='forestHole'){drawForestAtlasCell(forestTerrainAtlas,0,1,pit.x-14,pit.y-pit.h*.72,pit.w+28,pit.h*1.45);continue}
      if(pit.shape==='square'){drawSquarePit(pit,style);continue}
      g.fillStyle=style.pitFill;g.beginPath();g.ellipse(pit.x+pit.w*.5,pit.y+18,pit.w*.5,38,0,0,6.3);g.fill();g.strokeStyle=style.pitStroke;g.lineWidth=5;g.beginPath();g.ellipse(pit.x+pit.w*.5,pit.y+12,pit.w*.46,26,0,0,6.3);g.stroke();drawPitHazard(pit,t,style)
    }
    for(const p of currentPlatforms()){if(p.maxX+90<viewLeft||p.minX-90>viewRight)continue;const b1=platformBoundsAtY(p.minY,p),b2=platformBoundsAtY(p.maxY,p);if(t==='沙漠'){drawDesertPlatform(p,b1,b2);continue}if(t==='草地'){drawGrassPlatform(p,b1,b2);drawImpassableBoundary(0,b1.left-34,b1.right+34,p.minY+6,300,148);continue}drawGenericWallPlatform(p,b1,b2,t,style)}
    for(const b of currentBridges()){if(Math.max(b.x1,b.x2)+90<viewLeft||Math.min(b.x1,b.x2)-90>viewRight)continue;drawPlatformBridge(b,style,t)}
    for(const c of currentCollapseClimbs()){if(c.x+c.w+90<viewLeft||c.x-90>viewRight)continue;drawGrassCollapse(c)}
    for(const s of currentStairs()){const stairLeft=s.x-80,stairRight=s.x+s.bottomW+80;if(stairRight<viewLeft||stairLeft>viewRight)continue;if(t==='沙漠'){drawDesertDuneRamp(s);continue}if(t==='草地'){drawGrassRamp(s);continue}if(t==='街区'){drawIronStreetStairs(s);continue}if(t==='高楼'){drawSkyShelterStairs(s,style);continue}if(t==='水中避难所'){drawWaterShelterStairs(s,style);continue}if(t==='森林'){drawForestLogStairs(s);continue}const c=s.x+s.bottomW*.5,top=s.topY,bot=s.bottomY;g.fillStyle=style.stair;g.beginPath();g.moveTo(c-s.topW*.5,top);g.lineTo(c+s.topW*.5,top);g.lineTo(c+s.bottomW*.5,bot);g.lineTo(c-s.bottomW*.5,bot);g.closePath();g.fill();g.strokeStyle=style.step;g.lineWidth=4;for(let i=1;i<10;i++){const y=top+(bot-top)*i/9,b=stairBoundsAtY(s,y,0);g.beginPath();g.moveTo(b.left+12,y);g.lineTo(b.right-12,y);g.stroke()}}
    g.restore()
  }
  function tracePlatformSurface(p){
    const b1=platformBoundsAtY(p.minY,p),b2=platformBoundsAtY(p.maxY,p);g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath()
  }
  function drawWaterShelterStairs(s,style){
    const e=stairEnds(s),top=e.topY,bot=e.bottomY,c=s.x+s.bottomW*.5,steps=Math.max(8,Math.round((bot-top)/24)),edge=(t,side)=>{const y=top+(bot-top)*t,w=s.topW+(s.bottomW-s.topW)*t;return{x:c+side*w*.5,y}};
    g.save();g.lineJoin='round';g.lineCap='round';
    for(let i=steps-1;i>=0;i--){const t=i/steps,next=Math.min(1,(i+1)/steps),a=edge(t,-1),b=edge(t,1),na=edge(next,-1),nb=edge(next,1),depth=Math.max(7,(bot-top)/steps*.42);g.save();g.beginPath();g.moveTo(a.x+7,a.y);g.lineTo(b.x-7,b.y);g.lineTo(nb.x-10,Math.min(nb.y-2,a.y+depth));g.lineTo(na.x+10,Math.min(na.y-2,a.y+depth));g.closePath();g.clip();if(!drawWaterShelterAtlasCell(waterShelterSurfaceAtlas,1,1,a.x,a.y-7,b.x-a.x,depth+16)){g.fillStyle=style.stair;g.fillRect(a.x,a.y,b.x-a.x,depth)}g.restore();g.strokeStyle='#253538';g.lineWidth=2;g.beginPath();g.moveTo(a.x+7,a.y+depth);g.lineTo(b.x-7,b.y+depth);g.stroke()}
    for(const side of[-1,1]){const a=edge(0,side),b=edge(1,side);g.strokeStyle='#1c292b';g.lineWidth=12;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y+3);g.stroke();g.strokeStyle='#704a35';g.lineWidth=5;g.stroke()}
    g.restore()
  }
  function drawGenericWallPlatform(p,b1,b2,t,style){
    const wall=platformWallRect(p),theme=t||'街区',forestTextured=theme==='森林'&&forestAtlasReady(forestArchitectureAtlas);
    if(theme==='森林'&&!forestTextured)return;
    const wallGrad=g.createLinearGradient(0,wall.top,0,wall.bottom);
    if(theme==='高楼'){wallGrad.addColorStop(0,'#f3f1e9');wallGrad.addColorStop(.46,'#d9ddd8');wallGrad.addColorStop(1,'#9ba9a5')}
    else if(theme==='水中避难所'){wallGrad.addColorStop(0,'#647b78');wallGrad.addColorStop(.42,'#354d4f');wallGrad.addColorStop(1,'#142326')}
    else if(theme==='室内'){wallGrad.addColorStop(0,'#6d4a38');wallGrad.addColorStop(.48,'#49362e');wallGrad.addColorStop(1,'#211915')}
    else if(theme==='古战场'||theme==='森林'){wallGrad.addColorStop(0,'#715139');wallGrad.addColorStop(.46,'#493421');wallGrad.addColorStop(1,'#1b140e')}
    else{wallGrad.addColorStop(0,'#596164');wallGrad.addColorStop(.44,'#3d4648');wallGrad.addColorStop(1,'#141a1c')}
    if(!forestTextured){g.fillStyle=wallGrad;g.fillRect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top)}
    let texturedPlatformWall=false;
    if(theme==='街区'&&(window.TieJieAssets?.imageReady?.(oldAlleyHouseWallWindows)||oldAlleyHouseWallWindows?.complete&&oldAlleyHouseWallWindows.naturalWidth)&&(window.TieJieAssets?.imageReady?.(oldAlleyHouseWallBalcony)||oldAlleyHouseWallBalcony?.complete&&oldAlleyHouseWallBalcony.naturalWidth)){
      const tileW=420,tileH=315,start=Math.floor(wall.left/tileW)*tileW,end=wall.right+tileW;
      g.save();g.beginPath();g.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);g.clip();
      let row=0;for(let y=wall.bottom-tileH;y>wall.top-tileH;y-=tileH,row++){
        const buildingTexture=((Math.floor(p.minX/640)+p.level+row)&1)?oldAlleyHouseWallBalcony:oldAlleyHouseWallWindows;
        for(let x=start;x<end;x+=tileW)g.drawImage(buildingTexture,x,y,tileW,tileH)
      }
      g.restore();texturedPlatformWall=true
    }else if(theme==='高楼'&&atlasReady(skyShelterStructureAtlas)){
      const tileW=420,tileH=315,start=Math.floor(wall.left/tileW)*tileW,end=wall.right+tileW;
      g.save();g.beginPath();g.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);g.clip();
      for(let x=start,i=0;x<end;x+=tileW,i++)drawAtlasCell(skyShelterStructureAtlas,i%3===2?1:0,0,x,wall.bottom-tileH,tileW,tileH);
      g.restore();texturedPlatformWall=true
    }else if(theme==='水中避难所'&&atlasReady(waterShelterStructureAtlas)){
      const tileW=420,tileH=315,start=Math.floor(wall.left/tileW)*tileW,end=wall.right+tileW;
      g.save();g.beginPath();g.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);g.clip();
      for(let y=wall.bottom-tileH,row=0;y>wall.top-tileH;y-=tileH,row++)for(let x=start,i=0;x<end;x+=tileW,i++)drawWaterShelterAtlasCell(waterShelterStructureAtlas,0,(i+row)%3===2?1:0,x,y,tileW,tileH);
      g.restore();texturedPlatformWall=true
    }else if(forestTextured){
      g.save();g.beginPath();g.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);g.clip();drawTiledForestAtlasCell(forestArchitectureAtlas,0,0,wall.left,wall.top,wall.right,wall.bottom,440,360,1);g.restore();texturedPlatformWall=true
    }
    if(theme!=='森林'&&theme!=='水中避难所'){g.strokeStyle=theme==='街区'?'#161c1ecc':style.stripe;g.lineWidth=4;g.strokeRect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top)}
    const rowH=theme==='街区'?34:theme==='高楼'?30:28;
    if(!texturedPlatformWall)for(let y=wall.top+rowH;y<wall.bottom-6;y+=rowH){
      g.strokeStyle=theme==='街区'?'#7c858850':theme==='高楼'?'#9fb0b750':theme==='水中避难所'?'#91aaa650':'#d8b27c38';g.lineWidth=2;g.beginPath();g.moveTo(wall.left+10,y);g.lineTo(wall.right-10,y);g.stroke();
      for(let x=wall.left+24+((Math.floor(y/rowH)%2)*44);x<wall.right-16;x+=88){
        g.strokeStyle=theme==='街区'?'#20282aaa':theme==='高楼'?'#212b31aa':theme==='水中避难所'?'#203638aa':'#2a1810aa';g.lineWidth=2;g.beginPath();g.moveTo(x,y-rowH+7);g.lineTo(x,y-3);g.stroke()
      }
    }
    const platformSurfaceTile=theme==='街区'?oldAlleyRooftopGround:theme==='高楼'?skyShelterRooftopGround:null;
    const canTexturePlatformSurface=!!platformSurfaceTile&&(window.TieJieAssets?.imageReady?.(platformSurfaceTile)||platformSurfaceTile.complete&&platformSurfaceTile.naturalWidth),canTextureForestSurface=theme==='森林'&&forestAtlasReady(forestArchitectureAtlas),canTextureWaterSurface=theme==='水中避难所'&&atlasReady(waterShelterSurfaceAtlas);
    if(!canTexturePlatformSurface&&!canTextureForestSurface&&!canTextureWaterSurface){g.fillStyle=style.ledge;g.beginPath();g.moveTo(b1.left-35,p.minY-8);g.lineTo(b1.right+35,p.minY-8);g.lineTo(b2.right+70,p.maxY+34);g.lineTo(b2.left-70,p.maxY+34);g.closePath();g.fill()}
    if(!canTextureForestSurface){g.fillStyle=p.level===1?style.platform1:style.platform2;g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath();g.fill()}
    let texturedPlatformSurface=false;
    if(canTextureForestSurface){
      g.save();g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath();g.clip();texturedPlatformSurface=drawTiledForestAtlasCell(forestArchitectureAtlas,1,0,Math.min(b1.left,b2.left)-4,p.minY,Math.max(b1.right,b2.right)+4,p.maxY+3,280,250,1);g.restore()
    }else if(theme==='水中避难所'&&atlasReady(waterShelterSurfaceAtlas)){
      g.save();tracePlatformSurface(p);g.clip();texturedPlatformSurface=drawTiledWaterShelterAtlasCell(waterShelterSurfaceAtlas,1,0,Math.min(b1.left,b2.left)-4,p.minY,Math.max(b1.right,b2.right)+4,p.maxY+3,300,260,1);g.restore()
    }else if(canTexturePlatformSurface){
      g.save();g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath();g.clip();
      texturedPlatformSurface=drawTiledImage(platformSurfaceTile,Math.min(b1.left,b2.left)-4,p.minY,Math.max(b1.right,b2.right)+4,p.maxY+3,300,300,.94);g.restore()
    }
    if(!texturedPlatformSurface){g.strokeStyle=style.stroke;g.lineWidth=5;g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath();g.stroke();g.strokeStyle=style.stripe;g.lineWidth=3;for(let x=b2.left+55;x<b2.right-20;x+=95){g.beginPath();g.moveTo(x,p.minY+8);g.lineTo(x-50,p.maxY-8);g.stroke()}drawPlatformDetails(p,b1,b2,theme,style)}
  }
  function drawForestLogStairs(s){
    const e=stairEnds(s),top=e.topY,bot=e.bottomY,c=s.x+s.bottomW*.5,steps=Math.max(10,Math.round((bot-top)/31));
    const edge=(t,side)=>{const y=top+(bot-top)*t,w=s.topW+(s.bottomW-s.topW)*t;return{x:c+side*w*.5,y}};
    g.save();g.lineCap='round';
    for(const side of[-1,1]){const a=edge(0,side),b=edge(1,side);g.strokeStyle='#24170f';g.lineWidth=22;g.beginPath();g.moveTo(a.x,a.y-5);g.lineTo(b.x,b.y+6);g.stroke();g.strokeStyle='#68472c';g.lineWidth=14;g.stroke();g.strokeStyle='#9a704399';g.lineWidth=3;g.beginPath();g.moveTo(a.x+side*2,a.y);g.lineTo(b.x+side*2,b.y);g.stroke()}
    for(let i=0;i<=steps;i++){const t=i/steps,a=edge(t,-1),b=edge(t,1),y=a.y;g.strokeStyle='#21150e';g.lineWidth=18;g.beginPath();g.moveTo(a.x-7,y);g.lineTo(b.x+7,y);g.stroke();g.strokeStyle=i%3?'#6d4a2d':'#795537';g.lineWidth=12;g.stroke();g.strokeStyle='#ad805155';g.lineWidth=2;g.beginPath();g.moveTo(a.x,y-3);g.lineTo(b.x,y-3);g.stroke();for(const p of[a,b]){g.fillStyle='#342116';g.beginPath();g.ellipse(p.x,p.y,7,5,0,0,6.3);g.fill()}}
    g.restore()
  }
  function drawIronStreetStairs(s){
    const e=stairEnds(s),top=e.topY,bot=e.bottomY,c=s.x+s.bottomW*.5,steps=Math.max(9,Math.round((bot-top)/24));
    const edge=(t,side)=>{const y=top+(bot-top)*t,w=s.topW+(s.bottomW-s.topW)*t;return{x:c+side*w*.5,y}};
    const topL=edge(0,-1),topR=edge(0,1),botL=edge(1,-1),botR=edge(1,1);
    g.save();
    const voidGrad=g.createLinearGradient(0,top,0,bot);voidGrad.addColorStop(0,'#302d29');voidGrad.addColorStop(.42,'#1e1c1a');voidGrad.addColorStop(1,'#090909');g.fillStyle=voidGrad;
    g.beginPath();g.moveTo(topL.x,topL.y);g.lineTo(topR.x,topR.y);g.lineTo(botR.x,botR.y);g.lineTo(botL.x,botL.y);g.closePath();g.fill();
    g.strokeStyle='#37332eaa';g.lineWidth=3;for(let i=0;i<steps;i+=2){const a=edge(i/steps,-1),b=edge(Math.min(1,(i+2)/steps),1);g.beginPath();g.moveTo(a.x+12,a.y+8);g.lineTo(b.x-12,b.y-6);g.stroke();const c1=edge(i/steps,1),d=edge(Math.min(1,(i+2)/steps),-1);g.beginPath();g.moveTo(c1.x-12,c1.y+8);g.lineTo(d.x+12,d.y-6);g.stroke()}
    for(let i=steps-1;i>=0;i--){
      const t=i/steps,next=Math.min(1,(i+1)/steps),aL=edge(t,-1),aR=edge(t,1),bL=edge(next,-1),bR=edge(next,1),depth=Math.max(6,(bot-top)/steps*.32);
      g.fillStyle='#171110';g.beginPath();g.moveTo(aL.x+10,aL.y+depth);g.lineTo(aR.x-10,aR.y+depth);g.lineTo(bR.x-12,bR.y-2);g.lineTo(bL.x+12,bL.y-2);g.closePath();g.fill();
      const tread=g.createLinearGradient(0,aL.y-3,0,aL.y+depth);tread.addColorStop(0,'#706b63');tread.addColorStop(.28,'#4d4943');tread.addColorStop(.68,'#302d29');tread.addColorStop(1,'#171615');g.fillStyle=tread;
      g.beginPath();g.moveTo(aL.x+8,aL.y);g.lineTo(aR.x-8,aR.y);g.lineTo(aR.x-11,aR.y+depth);g.lineTo(aL.x+11,aL.y+depth);g.closePath();g.fill();g.strokeStyle='#111718';g.lineWidth=2;g.stroke();
      const left=aL.x+16,right=aR.x-16,slots=Math.max(5,Math.floor((right-left)/15));g.strokeStyle='#151b1c';g.lineWidth=2;
      for(let j=0;j<=slots;j++){const x=left+(right-left)*j/slots;g.beginPath();g.moveTo(x,aL.y+2);g.lineTo(x,aL.y+depth-1);g.stroke()}
      g.fillStyle='#39342daa';for(let j=0;j<3;j++){const q=Math.abs(Math.sin((i+1)*17.3+j*9.7)),x=left+(right-left)*q,r=1.5+Math.abs(Math.sin(i*6.1+j))*3;g.beginPath();g.ellipse(x,aL.y+depth*(.2+.22*j),r*2.1,r,.2,0,6.3);g.fill()}
      g.strokeStyle='#a5aeac55';g.lineWidth=1;g.beginPath();g.moveTo(left,aL.y+3);g.lineTo(right,aR.y+3);g.stroke()
    }
    const drawStringer=side=>{const a=edge(0,side),b=edge(1,side);g.strokeStyle='#111110';g.lineWidth=15;g.beginPath();g.moveTo(a.x,a.y-3);g.lineTo(b.x,b.y+4);g.stroke();g.strokeStyle='#45413b';g.lineWidth=6;g.beginPath();g.moveTo(a.x,a.y-5);g.lineTo(b.x,b.y+2);g.stroke();g.strokeStyle='#6c665c88';g.lineWidth=2.5;g.setLineDash([18,11,7,23]);g.beginPath();g.moveTo(a.x-side*2,a.y-6);g.lineTo(b.x-side*2,b.y);g.stroke();g.setLineDash([]);g.strokeStyle='#aaa39955';g.lineWidth=1;g.beginPath();g.moveTo(a.x-side*4,a.y-7);g.lineTo(b.x-side*4,b.y-1);g.stroke()};drawStringer(-1);drawStringer(1);
    const railHeight=58;
    for(const side of[-1,1]){
      g.strokeStyle='#211817';g.lineWidth=9;for(let i=0;i<=steps;i+=2){const p=edge(i/steps,side);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x,p.y-railHeight);g.stroke()}
      g.strokeStyle='#47433d';g.lineWidth=3;for(let i=0;i<=steps;i+=2){const p=edge(i/steps,side);g.beginPath();g.moveTo(p.x-side*1.5,p.y);g.lineTo(p.x-side*1.5,p.y-railHeight);g.stroke();g.strokeStyle='#76706688';g.lineWidth=1.5;g.beginPath();g.moveTo(p.x+side*2,p.y-8);g.lineTo(p.x+side*2,p.y-railHeight+7);g.stroke();g.strokeStyle='#47433d';g.lineWidth=3}
      const a=edge(0,side),b=edge(1,side);g.strokeStyle='#111110';g.lineWidth=12;g.beginPath();g.moveTo(a.x,a.y-railHeight);g.lineTo(b.x,b.y-railHeight);g.stroke();g.strokeStyle='#48443e';g.lineWidth=4;g.beginPath();g.moveTo(a.x,a.y-railHeight-2);g.lineTo(b.x,b.y-railHeight-2);g.stroke();g.strokeStyle='#77706677';g.lineWidth=2;g.setLineDash([27,14,9,20]);g.stroke();g.setLineDash([])
    }
    const landingW=s.bottomW+38;g.fillStyle='#191817';g.fillRect(c-landingW*.5,bot-8,landingW,13);g.strokeStyle='#48443e';g.lineWidth=3;g.strokeRect(c-landingW*.5,bot-8,landingW,13);g.strokeStyle='#77706677';g.lineWidth=2;g.setLineDash([22,13]);g.beginPath();g.moveTo(c-landingW*.5+8,bot-4);g.lineTo(c+landingW*.5-8,bot-4);g.stroke();g.setLineDash([]);
    g.restore()
  }
  function drawSkyShelterStairs(s,style){
    const e=stairEnds(s),top=e.topY,bot=e.bottomY,c=s.x+s.bottomW*.5,steps=Math.max(12,Math.round((bot-top)/22));
    const edge=(t,side)=>{const y=top+(bot-top)*t,w=s.topW+(s.bottomW-s.topW)*t;return{x:c+side*w*.5,y}};
    const tl=edge(0,-1),tr=edge(0,1),bl=edge(1,-1),br=edge(1,1);g.save();g.lineJoin='round';g.lineCap='round';
    g.fillStyle='#60706f55';g.beginPath();g.moveTo(tl.x-15,tl.y+13);g.lineTo(tr.x+15,tr.y+13);g.lineTo(br.x+24,br.y+24);g.lineTo(bl.x-24,bl.y+24);g.closePath();g.fill();
    const chassis=g.createLinearGradient(0,top,0,bot);chassis.addColorStop(0,'#eef3f0');chassis.addColorStop(.5,'#b8c4c1');chassis.addColorStop(1,'#768784');g.fillStyle=chassis;g.beginPath();g.moveTo(tl.x,tl.y);g.lineTo(tr.x,tr.y);g.lineTo(br.x,br.y);g.lineTo(bl.x,bl.y);g.closePath();g.fill();g.strokeStyle='#526765';g.lineWidth=5;g.stroke();
    for(let i=steps-1;i>=0;i--){const a=i/steps,b=(i+1)/steps,l1=edge(a,-1),r1=edge(a,1),l2=edge(b,-1),r2=edge(b,1),lip=Math.max(4,(bot-top)/steps*.28);const tread=g.createLinearGradient(0,l1.y,0,l2.y);tread.addColorStop(0,'#f7faf7');tread.addColorStop(.38,i%2?'#d9e2df':'#cbd7d4');tread.addColorStop(1,'#8fa09e');g.fillStyle=tread;g.beginPath();g.moveTo(l1.x+9,l1.y);g.lineTo(r1.x-9,r1.y);g.lineTo(r1.x-11,r1.y+lip);g.lineTo(l1.x+11,l1.y+lip);g.closePath();g.fill();g.strokeStyle='#607371';g.lineWidth=1.5;g.stroke();g.strokeStyle='#87989588';g.lineWidth=1;for(let q=.18;q<.9;q+=.18){const x=l1.x+(r1.x-l1.x)*q;g.beginPath();g.moveTo(x,l1.y+2);g.lineTo(x,l1.y+lip-1);g.stroke()}}
    for(const t of[.33,.66]){const l=edge(t,-1),r=edge(t,1);g.strokeStyle='#4d6260';g.lineWidth=8;g.beginPath();g.moveTo(l.x+4,l.y);g.lineTo(r.x-4,r.y);g.stroke();g.strokeStyle='#dce5e2';g.lineWidth=2;g.stroke();for(const p of[l,r]){g.fillStyle='#3f5553';g.beginPath();g.arc(p.x,p.y,7,0,6.3);g.fill();g.fillStyle='#dbe5e1';g.beginPath();g.arc(p.x,p.y,2.5,0,6.3);g.fill()}}
    for(const side of[-1,1]){const a=edge(0,side),b=edge(1,side);g.strokeStyle='#344947';g.lineWidth=13;g.beginPath();g.moveTo(a.x,a.y+2);g.lineTo(b.x,b.y+5);g.stroke();g.strokeStyle='#9caaa7';g.lineWidth=5;g.stroke();for(let i=0;i<=steps;i+=2){const p=edge(i/steps,side);g.strokeStyle='#455b59';g.lineWidth=5;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x,p.y-52);g.stroke();g.fillStyle='#dce5e2';g.beginPath();g.arc(p.x,p.y-52,3.5,0,6.3);g.fill()}g.strokeStyle='#344947';g.lineWidth=8;g.beginPath();g.moveTo(a.x,a.y-52);g.lineTo(b.x,b.y-52);g.stroke();g.strokeStyle='#d5dfdc';g.lineWidth=2.5;g.stroke()}
    g.strokeStyle='#6f8582';g.lineWidth=7;g.beginPath();g.moveTo(c,top+18);g.lineTo(c,bot-18);g.stroke();g.strokeStyle='#e7ece9';g.lineWidth=2;g.setLineDash([24,12]);g.stroke();g.setLineDash([]);
    for(const p of[tl,tr,bl,br]){g.fillStyle='#405553';g.beginPath();g.arc(p.x,p.y,10,0,6.3);g.fill();g.strokeStyle='#dce5e2';g.lineWidth=3;g.stroke();g.fillStyle='#8fa19e';g.beginPath();g.arc(p.x,p.y,3,0,6.3);g.fill()}g.restore()
  }
  function drawPitHazard(pit,t,style){
    if(t==='沙漠')return;
    else if(t==='高楼'){g.strokeStyle='#ced9dccc';g.lineWidth=5;for(let x=pit.x+32;x<pit.x+pit.w-20;x+=42){g.beginPath();g.moveTo(x,pit.y-18);g.lineTo(x+24,pit.y+36);g.stroke()}}
    else if(t==='古战场'){g.fillStyle='#4b2b1e';for(let x=pit.x+28;x<pit.x+pit.w-12;x+=38){g.beginPath();g.moveTo(x,pit.y+28);g.lineTo(x+13,pit.y-20);g.lineTo(x+27,pit.y+28);g.closePath();g.fill()}}
    else{g.strokeStyle=style.stroke;g.lineWidth=4;for(let x=pit.x+30;x<pit.x+pit.w-20;x+=46){g.beginPath();g.moveTo(x,pit.y+24);g.quadraticCurveTo(x+16,pit.y-18,x+34,pit.y+18);g.stroke()}}
  }
  function traceDesertErodedWall(wall,seed){
    const leftExtra=i=>10+Math.abs(Math.sin(seed+i*1.73))*18,rightExtra=i=>10+Math.abs(Math.cos(seed+i*1.41))*18,steps=Math.max(3,Math.ceil((wall.bottom-wall.top)/72));
    g.beginPath();g.moveTo(wall.left-18,wall.top-12);g.lineTo(wall.right+18,wall.top-12);
    for(let i=1;i<=steps;i++){const t=i/steps;g.lineTo(wall.right+rightExtra(i),wall.top+(wall.bottom-wall.top)*t)}
    for(let i=steps;i>=0;i--){const t=i/steps;g.lineTo(wall.left-leftExtra(i),wall.top+(wall.bottom-wall.top)*t)}
    g.closePath()
  }
  function traceDesertErodedPlatform(p,b1,b2,seed){
    const topExtra=10+Math.abs(Math.sin(seed))*10,frontExtra=12+Math.abs(Math.cos(seed*1.7))*16;
    g.beginPath();g.moveTo(b1.left-topExtra,p.minY-7);g.lineTo(b1.right+topExtra,p.minY-7);
    g.lineTo(b2.right+frontExtra,p.maxY+10);g.lineTo(b2.right+7+Math.sin(seed+3)*6,p.maxY+18);
    g.lineTo(b2.left-7+Math.cos(seed+5)*6,p.maxY+18);g.lineTo(b2.left-frontExtra,p.maxY+10);g.closePath()
  }
  function drawDesertPlatform(p,b1,b2){
    if(atlasReady(desertYardangTerrainAtlas)&&atlasReady(desertYardangArchitectureAtlas)){
      const wall=platformWallRect(p),seed=p.minX*.013+p.level*2.37,left=Math.min(b1.left,b2.left)-48,right=Math.max(b1.right,b2.right)+48;
      // Always seal the collision-sized support first. The eroded silhouette
      // expands only outwards, so no background can leak through its notches.
      g.fillStyle='#b98549';g.fillRect(wall.left-3,wall.top,wall.right-wall.left+6,wall.bottom-wall.top);
      g.save();traceDesertErodedWall(wall,seed);g.clip();drawTiledDesertAtlasCell(desertYardangArchitectureAtlas,0,1,wall.left-30,wall.top-14,wall.right+30,wall.bottom+24,420,340,1);g.restore();
      g.fillStyle='#b98549';g.beginPath();g.moveTo(b1.left,p.minY);g.lineTo(b1.right,p.minY);g.lineTo(b2.right,p.maxY);g.lineTo(b2.left,p.maxY);g.closePath();g.fill();
      g.save();traceDesertErodedPlatform(p,b1,b2,seed);g.clip();drawTiledDesertAtlasCell(desertYardangTerrainAtlas,1,0,left,p.minY-10,right,p.maxY+22,330,250,1);g.restore();return
    }
    const seed=(p.minX*.019+p.w*.011+p.level*.7)%10.1,jit=(i,a)=>Math.sin(seed+i*13.17+a*43.91);
    const topY=p.minY,botY=p.maxY,crestL=b1.left-22,crestR=b1.right+22,baseL=b2.left-36,baseR=b2.right+36;
    const wallBottom=p.generatedSide?Math.max(botY+8,platformWallBottomY(p)):Math.max(botY+150,GROUND_Y),wallTop=botY-18;
    g.save();
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    // Opaque foundation shared by the deck and its support. The former two
    // independently jittered polygons could expose a strip of sky between them.
    g.fillStyle='#71301f';g.beginPath();g.moveTo(baseL-10,wallTop);g.lineTo(baseR+10,wallTop);g.lineTo(baseR+18,wallBottom);g.lineTo(baseL-18,wallBottom);g.closePath();g.fill();
    const wall=g.createLinearGradient(0,wallTop,0,wallBottom);wall.addColorStop(0,'#e28242');wall.addColorStop(.22,'#c76535');wall.addColorStop(.55,'#8a3d23');wall.addColorStop(1,'#32160e');g.fillStyle=wall;
    g.beginPath();g.moveTo(baseL,wallTop);for(let x=baseL;x<=baseR;x+=75)g.lineTo(Math.min(baseR+10,x+38),wallTop+jit(x,1)*7);g.lineTo(baseR+18,wallBottom);g.lineTo(baseL-18,wallBottom);g.closePath();g.fill();
    g.fillStyle='#220f0a33';for(let x=baseL+35;x<baseR;x+=92){const w=20+Math.abs(jit(x,2))*28;g.beginPath();g.moveTo(x,botY+10);g.quadraticCurveTo(x-w*.5,botY+90+jit(x,3)*20,x-w*.15,wallBottom-8);g.lineTo(x+w*.35,wallBottom-8);g.quadraticCurveTo(x+w*.15,botY+86+jit(x,4)*18,x+w*.42,botY+12);g.closePath();g.fill()}
    g.strokeStyle='#ffd08a5a';g.lineWidth=3;for(let y=botY+18;y<wallBottom-14;y+=34){g.beginPath();g.moveTo(baseL+18,y+jit(y,5)*3);for(let x=baseL+90;x<baseR-18;x+=125)g.quadraticCurveTo(x-60,y-7+jit(x,6)*4,x,y+jit(x,7)*3);g.stroke()}
    g.strokeStyle='#4b1e1288';g.lineWidth=2.4;for(let x=baseL+50;x<baseR-30;x+=58){g.beginPath();g.moveTo(x+jit(x,8)*8,botY+12);g.quadraticCurveTo(x+14+jit(x,9)*14,botY+(wallBottom-botY)*.52,x+jit(x,10)*9,wallBottom-10);g.stroke()}
    g.fillStyle='#8d4028';g.beginPath();g.moveTo(crestL-4,topY);g.lineTo(crestR+4,topY);g.lineTo(baseR+10,botY+12);g.lineTo(baseL-10,botY+12);g.closePath();g.fill();
    const cap=g.createLinearGradient(0,topY-18,0,botY+12);cap.addColorStop(0,'#ffc06a');cap.addColorStop(.34,'#e48543');cap.addColorStop(.72,'#a74c2b');cap.addColorStop(1,'#54251a');g.fillStyle=cap;
    g.beginPath();g.moveTo(crestL,topY+4);for(let x=crestL;x<=crestR;x+=120)g.quadraticCurveTo(x+54,topY-10+jit(x,11)*5,x+120,topY+5+jit(x,12)*4);g.lineTo(baseR,botY+10);for(let x=baseR;x>=baseL;x-=110)g.lineTo(x+jit(x,13)*8,botY+8+jit(x,14)*4);g.closePath();g.fill();
    const rim=g.createLinearGradient(crestL,topY,crestR,botY);rim.addColorStop(0,'#ffe0a855');rim.addColorStop(.52,'#ff9a4b22');rim.addColorStop(1,'#1b0b0b55');g.fillStyle=rim;g.beginPath();g.moveTo(crestL+20,topY+5);for(let x=crestL+80;x<crestR-20;x+=110)g.quadraticCurveTo(x-42,topY-9+jit(x,15)*3,x,topY+7);g.lineTo(crestR-55,topY+40);g.lineTo(crestL+45,topY+38);g.closePath();g.fill();
    for(let x=baseL+110;x<baseR-90;x+=230)drawDesertRockNeedle(x+jit(x,16)*30,botY+4,70+Math.abs(jit(x,17))*80,42+Math.abs(jit(x,18))*34,seed+x,.34);
    g.strokeStyle='#ffcf8755';g.lineWidth=2.2;for(let y=topY+28;y<botY-4;y+=28){g.beginPath();g.moveTo(baseL+40,y+jit(y,19)*3);g.lineTo(baseR-45,y+jit(y,20)*3);g.stroke()}
    g.strokeStyle='#ffd08a88';g.lineWidth=3;g.beginPath();g.moveTo(crestL+12,topY+4);for(let x=crestL+12;x<=crestR-12;x+=110)g.quadraticCurveTo(x+55,topY-12+jit(x,21)*3,x+110,topY+4+jit(x,22)*2);g.stroke();
    g.restore()
  }
  function drawDesertDuneRamp(s){
    if(atlasReady(desertYardangTerrainAtlas)){
      const e=stairEnds(s),c=s.x+s.bottomW*.5,top=e.topY,bot=e.bottomY,topL=c-s.topW*.5,topR=c+s.topW*.5,botL=c-s.bottomW*.5,botR=c+s.bottomW*.5;
      g.save();g.beginPath();g.moveTo(topL,top);g.lineTo(topR,top);g.lineTo(botR,bot);g.lineTo(botL,bot);g.closePath();g.clip();drawDesertAtlasCell(desertYardangTerrainAtlas,1,1,botL,top,botR-botL,bot-top);g.restore();return
    }
    const e=stairEnds(s),c=s.x+s.bottomW*.5,top=e.topY,bot=e.bottomY,seed=(s.x*.015+s.bottomW*.021)%9.9,jit=(i,a)=>Math.sin(seed+i*11.27+a*39.41);
    const topL=c-s.topW*.5,topR=c+s.topW*.5,botL=c-s.bottomW*.5,botR=c+s.bottomW*.5;
    const steps=7,leftPts=[],rightPts=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,y=top+(bot-top)*t,w=s.topW+(s.bottomW-s.topW)*t;
      leftPts.push([c-w*.5-18-jit(i,1)*16,y+jit(i,2)*7]);
      rightPts.push([c+w*.5+18+jit(i,3)*16,y+jit(i,4)*7])
    }
    g.save();
    const dune=g.createLinearGradient(0,top-20,0,bot+8);dune.addColorStop(0,'#ff9e45');dune.addColorStop(.36,'#d96334');dune.addColorStop(.78,'#7b3029');dune.addColorStop(1,'#3d1c24');g.fillStyle=dune;
    g.beginPath();
    leftPts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));
    rightPts.slice().reverse().forEach(p=>g.lineTo(p[0],p[1]));
    g.closePath();g.fill();
    const shade=g.createLinearGradient(topR,top,botL,bot+8);shade.addColorStop(0,'#7c2f2500');shade.addColorStop(.58,'#2b102b44');shade.addColorStop(1,'#08050d66');g.fillStyle=shade;
    g.beginPath();g.moveTo(c-18+jit(30,1)*8,top);g.lineTo(rightPts[steps][0],rightPts[steps][1]);g.lineTo(c-26+jit(31,1)*12,bot);g.closePath();g.fill();
    g.strokeStyle='#ffad5c42';g.lineWidth=2.2;for(let i=0;i<2;i++){const yy=top+30+i*(bot-top)/3;g.beginPath();g.moveTo(topL+24+i*8,yy+jit(i,2)*3);g.lineTo(botR-18-i*14,yy+16);g.stroke()}
    g.strokeStyle='#23102055';g.lineWidth=2;for(let i=0;i<3;i++){const x=topL+45+i*Math.max(48,(topR-topL)/2);g.beginPath();g.moveTo(x+jit(i,4)*8,top+18+jit(i,5)*3);g.quadraticCurveTo(x+18+jit(i,6)*18,(top+bot)*.5,x+8+jit(i,7)*18,bot-2);g.stroke()}
    g.fillStyle='#7a3d24aa';for(let i=0;i<9;i++){const t=(i+.3)/9,w=s.topW+(s.bottomW-s.topW)*t,x=c+(jit(i,8))*w*.48,y=top+(bot-top)*t+jit(i,9)*7,r=4+Math.abs(jit(i,10))*10;g.beginPath();g.ellipse(x,y,r,r*.45,jit(i,11),0,6.3);g.fill()}
    g.restore()
  }
  function drawGreatWallBricks(l,r,top,bottom,seed=0,alpha=1){
    const patternLeft=l,visibleLeft=Math.max(l,cameraX-80),visibleRight=Math.min(r,cameraX+W+80);
    if(visibleRight<=visibleLeft)return;
    l=visibleLeft;r=visibleRight;
    g.save();g.beginPath();g.rect(l,top,r-l,bottom-top);g.clip();
    g.globalAlpha=alpha;
    const rowH=22,rows=[];
    g.strokeStyle='rgba(225,219,205,.58)';g.lineWidth=2.2;g.beginPath();
    for(let y=top+10,row=0;y<bottom-5;y+=rowH,row++){
      rows.push([y,row]);g.moveTo(l+8,y);g.lineTo(r-8,y)
    }
    g.stroke();
    g.strokeStyle='rgba(45,39,32,.64)';g.lineWidth=2.2;g.beginPath();
    for(const [y,row] of rows){
      const off=row%2?42:4,anchor=patternLeft+off,start=anchor+Math.max(0,Math.ceil((l-anchor)/82))*82;
      for(let x=start;x<r-10;x+=82){
        const wig=Math.sin(seed+x*.07+y*.11)*3;
        g.moveTo(x+wig,y-rowH+5);g.lineTo(x-wig*.5,y-2)
      }
    }
    g.stroke();
    g.restore()
  }
  function drawPlatformBridge(b,style,theme){
    if(theme==='高楼'){drawSkyShelterBridge(b);return}
    const dx=b.x2-b.x1,dy=b.y2-b.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*(b.width*.5),ny=dx/len*(b.width*.5);
    if(theme==='水中避难所'&&atlasReady(waterShelterSurfaceAtlas)){
      g.save();g.beginPath();g.moveTo(b.x1+nx,b.y1+ny);g.lineTo(b.x2+nx,b.y2+ny);g.lineTo(b.x2-nx,b.y2-ny);g.lineTo(b.x1-nx,b.y1-ny);g.closePath();g.clip();drawWaterShelterAtlasCell(waterShelterSurfaceAtlas,1,1,Math.min(b.x1,b.x2)-40,Math.min(b.y1,b.y2)-b.width,Math.abs(dx)+80,Math.abs(dy)+b.width*2);g.restore();
      return
    }
    g.fillStyle=theme==='沙漠'?'#b98448':theme==='草地'?'#655f54':theme==='高楼'?'#3d4b52':theme==='水中避难所'?'#365256':style.stair;
    g.beginPath();g.moveTo(b.x1+nx,b.y1+ny);g.lineTo(b.x2+nx,b.y2+ny);g.lineTo(b.x2-nx,b.y2-ny);g.lineTo(b.x1-nx,b.y1-ny);g.closePath();g.fill();
    g.strokeStyle=theme==='沙漠'?'#f0c77e':theme==='草地'?'#b7ae9d':style.step;g.lineWidth=4;g.stroke();
    g.strokeStyle=theme==='高楼'?'#1d262b':theme==='水中避难所'?'#17292c':'#2b211b99';g.lineWidth=2;
    for(let t=.12;t<1;t+=.14){const x=b.x1+dx*t,y=b.y1+dy*t;g.beginPath();g.moveTo(x+nx*.82,y+ny*.82);g.lineTo(x-nx*.82,y-ny*.82);g.stroke()}
  }
  function drawSkyShelterBridge(b){
    const dx=b.x2-b.x1,dy=b.y2-b.y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,half=b.width*.5,point=(t,side=0)=>({x:b.x1+dx*t+nx*side,y:b.y1+dy*t+ny*side});
    const a=point(0,half),c=point(1,half),d=point(1,-half),e=point(0,-half);g.save();g.lineJoin='round';g.lineCap='round';
    g.fillStyle='#50605f55';g.beginPath();g.moveTo(a.x,a.y+14);g.lineTo(c.x,c.y+14);g.lineTo(d.x,d.y+14);g.lineTo(e.x,e.y+14);g.closePath();g.fill();
    const deck=g.createLinearGradient(0,Math.min(b.y1,b.y2)-half,0,Math.max(b.y1,b.y2)+half);deck.addColorStop(0,'#f0f4f1');deck.addColorStop(.5,'#c4d0cd');deck.addColorStop(1,'#81928f');g.fillStyle=deck;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.lineTo(e.x,e.y);g.closePath();g.fill();g.strokeStyle='#455b59';g.lineWidth=5;g.stroke();
    for(let i=0;i<4;i++){const t1=i/4,t2=(i+1)/4,p1=point(t1,-half*.78),p2=point(t1,half*.78),q1=point(t2,-half*.78),q2=point(t2,half*.78);g.fillStyle=i%2?'#afbfbc38':'#f5f7f438';g.beginPath();g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.lineTo(q2.x,q2.y);g.lineTo(q1.x,q1.y);g.closePath();g.fill();if(i){g.strokeStyle='#536966';g.lineWidth=7;g.beginPath();g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.stroke();g.strokeStyle='#e6ece9';g.lineWidth=2;g.stroke();for(const p of[p1,p2]){g.fillStyle='#3d5351';g.beginPath();g.arc(p.x,p.y,6,0,6.3);g.fill();g.fillStyle='#dbe4e1';g.beginPath();g.arc(p.x,p.y,2,0,6.3);g.fill()}}}
    g.strokeStyle='#6c807d';g.lineWidth=3;for(let t=.08;t<1;t+=.1){const l=point(t,-half*.72),r=point(t,half*.72);g.beginPath();g.moveTo(l.x,l.y);g.lineTo(r.x,r.y);g.stroke()}
    for(const side of[-half,half]){const p0=point(0,side),p1=point(1,side);g.strokeStyle='#354a48';g.lineWidth=8;g.beginPath();g.moveTo(p0.x,p0.y);g.lineTo(p1.x,p1.y);g.stroke();for(let t=0;t<=1.001;t+=.125){const p=point(t,side);g.strokeStyle='#425957';g.lineWidth=5;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x,p.y-46);g.stroke()}g.strokeStyle='#354a48';g.lineWidth=8;g.beginPath();g.moveTo(p0.x,p0.y-46);g.lineTo(p1.x,p1.y-46);g.stroke();g.strokeStyle='#dce5e2';g.lineWidth=2.5;g.stroke();for(let t=0;t<1;t+=.25){const p=point(t,side),q=point(Math.min(1,t+.125),side),r=point(Math.min(1,t+.25),side);g.strokeStyle='#718481';g.lineWidth=3;g.beginPath();g.moveTo(p.x,p.y+11);g.lineTo(q.x,q.y+27);g.lineTo(r.x,r.y+11);g.stroke()}}
    for(const t of[0,1]){const p=point(t,0);g.fillStyle='#364b49';g.beginPath();g.arc(p.x,p.y,15,0,6.3);g.fill();g.strokeStyle='#e0e7e4';g.lineWidth=4;g.stroke();g.fillStyle='#8da09d';g.beginPath();g.arc(p.x,p.y,5,0,6.3);g.fill()}g.restore()
  }
  function drawGrassPlatform(p,b1,b2){
    const seed=(p.minX*.017+p.w*.013+p.level*.5)%9.4,jit=(i,a)=>Math.sin(seed+i*10.37+a*36.71);
    const wallRect=grassWallRect(p);
    const topY=p.minY,botY=p.maxY,backL=b1.left-34,backR=b1.right+34,frontL=wallRect.left,frontR=wallRect.right,wallBottom=wallRect.bottom,isTower=!p.generatedSide&&p.level>=3;
    g.save();
    // A flat masonry tone avoids the dark rectangle that used to appear behind
    // actors standing at the foot of the wall and is cheaper than rebuilding a
    // full-height gradient every frame.
    g.fillStyle=isTower?'#8d8679':'#777064';
    g.fillRect(frontL,botY,frontR-frontL,wallBottom-botY);
    g.strokeStyle='#2f291fcc';g.lineWidth=4;g.strokeRect(frontL,botY,frontR-frontL,wallBottom-botY);
    if(!drawTiledImage(greatWallBrickTile,frontL+7,botY+3,frontR-7,wallBottom-4,300,300,.88))drawGreatWallBricks(frontL+8,frontR-8,botY+10,wallBottom-6,seed,.95);
    const road=g.createLinearGradient(0,topY-12,0,botY);road.addColorStop(0,'#b6ad9a');road.addColorStop(.42,'#8d8676');road.addColorStop(1,'#60584a');g.fillStyle=road;
    g.beginPath();g.moveTo(backL,topY);g.lineTo(backR,topY);g.lineTo(frontR,botY);g.lineTo(frontL,botY);g.closePath();g.fill();
    g.strokeStyle='#ded7c999';g.lineWidth=4;g.beginPath();g.moveTo(backL+12,topY+5);g.lineTo(backR-12,topY+5);g.moveTo(frontL+8,botY);g.lineTo(frontR-8,botY);g.stroke();
    g.save();g.beginPath();g.moveTo(backL,topY);g.lineTo(backR,topY);g.lineTo(frontR,botY);g.lineTo(frontL,botY);g.closePath();g.clip();
    if(!drawTiledImage(greatWallGroundTile,Math.min(backL,frontL),topY,Math.max(backR,frontR),botY,280,280,.9)){
      const surfaceRows=[];
      for(let y=topY+22,row=0;y<botY-2;y+=23,row++){
        const b=platformBoundsAtY(y,p),l=b.left-18,r=b.right+18;
        surfaceRows.push([y,row,l,r]);
      }
      g.lineWidth=2;g.beginPath();for(const [y,row,l,r] of surfaceRows){g.moveTo(l,y);g.lineTo(r,y+jit(row,2)*2)}g.strokeStyle='rgba(80,72,60,.34)';g.stroke();
      g.strokeStyle='rgba(45,39,31,.3)';g.beginPath();
      for(const [y,row,l,r] of surfaceRows){
        const anchor=l+28+(row%2?42:0),start=anchor+Math.max(0,Math.ceil((cameraX-80-anchor)/86))*86,end=Math.min(r-18,cameraX+W+80);
        for(let x=start;x<end;x+=86){g.moveTo(x,y-18);g.lineTo(x+jit(row+x,3)*3,y-3)}
      }
      g.stroke();
    }
    g.restore();
    if(isTower){
      const mid=(backL+backR)*.5,tw=Math.min(520,(backR-backL)*.7),tx=mid-tw*.5,ty=topY-150;
      const tower=g.createLinearGradient(0,ty,0,ty+152);tower.addColorStop(0,'#aaa292');tower.addColorStop(.46,'#786f61');tower.addColorStop(1,'#3b342a');g.fillStyle=tower;g.fillRect(tx,ty,tw,152);g.strokeStyle='#2b251bcc';g.lineWidth=6;g.strokeRect(tx,ty,tw,152);
      if(!drawTiledImage(greatWallBrickTile,tx+7,ty+12,tx+tw-7,ty+146,260,260,.96))drawGreatWallBricks(tx+7,tx+tw-7,ty+12,ty+146,seed+4,.98);
      drawImpassableBoundary(0,tx,tx+tw,ty+4,300,148);
      g.fillStyle='#2a241c';g.fillRect(tx,ty+34,tw,9);g.fillRect(tx,ty+106,tw,8);
      g.fillStyle='#090807';for(let x=tx+64;x<tx+tw-54;x+=108){g.beginPath();g.moveTo(x,ty+88);g.lineTo(x,ty+64);g.quadraticCurveTo(x+18,ty+39,x+36,ty+64);g.lineTo(x+36,ty+88);g.closePath();g.fill();g.strokeStyle='#d9d0bd55';g.lineWidth=2;g.stroke()}
      g.fillStyle='#11100d';g.beginPath();g.moveTo(mid-42,ty+152);g.lineTo(mid-42,ty+96);g.quadraticCurveTo(mid,ty+58,mid+42,ty+96);g.lineTo(mid+42,ty+152);g.closePath();g.fill();
      g.strokeStyle='#d9d0bd66';g.lineWidth=3;g.stroke();
    }
    g.restore()
  }
  function drawGrassRamp(s){
    const e=stairEnds(s),c=s.x+s.bottomW*.5,top=e.topY,bot=e.bottomY,seed=(s.x*.017+s.bottomW*.019)%8.8,jit=(i,a)=>Math.sin(seed+i*12.11+a*31.41);
    const topL=c-s.topW*.5,topR=c+s.topW*.5,botL=c-s.bottomW*.5,botR=c+s.bottomW*.5;
    g.save();
    const target=platformForLevel(s.toLevel);
    if(target){
      const wall=grassWallRect(target),clipTop=Math.min(wall.top,wall.bottom),clipBottom=Math.max(wall.top,wall.bottom);
      g.beginPath();g.rect(wall.left,clipTop,wall.right-wall.left,clipBottom-clipTop);g.clip();
    }
    const steps=13;
    const lerp=(a,b,t)=>a+(b-a)*t;
    const edge=(tt,side)=>{
      const wob=jit(Math.floor(tt*97),side)*3;
      if(side<0)return{ x:lerp(topL-16,botL-22,tt)+wob, y:lerp(top,bot,tt)};
      return{ x:lerp(topR+16,botR+22,tt)+wob, y:lerp(top,bot,tt)}
    };
    const base=g.createLinearGradient(0,top-12,0,bot+16);base.addColorStop(0,'#bbb5a6');base.addColorStop(.38,'#8c8576');base.addColorStop(.78,'#555048');base.addColorStop(1,'#211d18');g.fillStyle=base;
    const l0=edge(0,-1),r0=edge(0,1),l1=edge(1,-1),r1=edge(1,1);
    g.beginPath();g.moveTo(l0.x,l0.y);g.lineTo(r0.x,r0.y);g.lineTo(r1.x,r1.y);g.lineTo(l1.x,l1.y);g.closePath();g.fill();
    g.strokeStyle='#1d1812cc';g.lineWidth=5;g.stroke();
    const landingW=s.bottomW+58;
    g.fillStyle='#6f6758';g.fillRect(c-landingW*.5,bot-20,landingW,18);
    g.strokeStyle='#d8ceb899';g.lineWidth=3;g.beginPath();g.moveTo(c-landingW*.5+8,bot-18);g.lineTo(c+landingW*.5-8,bot-18);g.stroke();
    for(let i=steps-1;i>=0;i--){
      const t0=i/steps,t1=(i+1)/steps,la=edge(t0,-1),ra=edge(t0,1),lb=edge(t1,-1),rb=edge(t1,1);
      const slab=g.createLinearGradient(0,la.y-8,0,lb.y+8);slab.addColorStop(0,i%2?'#c4beb0':'#d0c8b8');slab.addColorStop(.5,i%2?'#999182':'#a59b8a');slab.addColorStop(1,'#5d564b');g.fillStyle=slab;
      g.beginPath();g.moveTo(la.x+7,la.y+2);g.lineTo(ra.x-7,ra.y+2);g.lineTo(rb.x-12,rb.y-3);g.lineTo(lb.x+12,lb.y-3);g.closePath();g.fill();
      g.strokeStyle='#2a2117dd';g.lineWidth=3;g.stroke();
      g.fillStyle='rgba(20,16,12,.42)';g.beginPath();g.moveTo(lb.x+12,lb.y-3);g.lineTo(rb.x-12,rb.y-3);g.lineTo(rb.x-4,rb.y+13);g.lineTo(lb.x+4,lb.y+13);g.closePath();g.fill();
      if(i>0){g.strokeStyle='#eadbb566';g.lineWidth=2;g.beginPath();g.moveTo(la.x+16,la.y+6);g.lineTo(ra.x-18,ra.y+6);g.stroke()}
      const cols=3+(i%2),left=lerp(la.x,lb.x,.42)+22,right=lerp(ra.x,rb.x,.42)-22;
      g.strokeStyle='#473b2bbb';g.lineWidth=2;
      for(let j=1;j<cols;j++){const k=j/cols,x=lerp(left,right,k)+jit(i*17+j,4)*8,yA=lerp(la.y,lb.y,.16),yB=lerp(la.y,lb.y,.76);g.beginPath();g.moveTo(x+jit(i,j)*3,yA+4);g.lineTo(x+jit(i,j+2)*4,yB-4);g.stroke()}
      g.strokeStyle='rgba(28,22,16,.3)';g.lineWidth=1.3;
      for(let j=0;j<3;j++){const x=lerp(left,right,(j+.5)/3)+jit(i,j+7)*16,y=lerp(la.y,lb.y,.45)+jit(i,j+9)*5;g.beginPath();g.moveTo(x-18,y);g.lineTo(x+18,y+jit(i,j+10)*5);g.stroke()}
      g.fillStyle='#75664eaa';for(let j=0;j<2;j++){const x=lerp(left,right,(j+.35)/2)+jit(i,j+11)*18,y=lerp(la.y,lb.y,.55)+jit(i,j+12)*7;g.fillRect(x,y,4+jit(i,j+13)*2,3)}
    }
    g.fillStyle='#2b2419';for(let i=0;i<5;i++){const tt=i/4,l=edge(tt,-1),r=edge(tt,1);g.fillRect(l.x-16,l.y-14,14,18);g.fillRect(r.x+2,r.y-14,14,18)}
    g.restore()
  }
  function drawGrassCollapse(c){
    const t=collapseClimbTarget(c),x=c.x,w=c.w,top=t.toY+18,bot=t.fromY+4,seed=(x*.017+w*.029+c.toLevel*.7)%9.8;
    if(window.TieJieAssets?.imageReady?.(greatWallCollapseSprite)||greatWallCollapseSprite?.complete&&greatWallCollapseSprite.naturalWidth){
      const dw=Math.max(230,w*1.28),dh=dw*1.047,baseY=bot+42;
      g.drawImage(greatWallCollapseSprite,x+w*.5-dw*.5,baseY-dh*.9,dw,dh);return
    }
    const rand=(i,a)=>Math.sin(seed+i*14.17+a*42.31);
    g.save();
    const grad=g.createLinearGradient(0,top,0,bot+38);grad.addColorStop(0,'#9d9685');grad.addColorStop(.42,'#70695c');grad.addColorStop(1,'#2f2a22');g.fillStyle=grad;
    g.beginPath();g.moveTo(x+w*.44,top);g.lineTo(x+w*.72,top+32);g.lineTo(x+w+46,bot+22);g.lineTo(x-58,bot+34);g.lineTo(x+w*.18,top+48);g.closePath();g.fill();
    g.strokeStyle='#2a241bcc';g.lineWidth=5;g.stroke();
    g.fillStyle='#0b0907bb';g.beginPath();g.moveTo(x+w*.38,top+8);g.lineTo(x+w*.62,top+26);g.lineTo(x+w*.47,top+88);g.lineTo(x+w*.25,top+70);g.closePath();g.fill();
    const block=(bx,by,bw,bh,col,rot=0)=>{
      g.save();g.translate(bx,by);g.rotate(rot);g.fillStyle=col;g.fillRect(-bw*.5,-bh*.5,bw,bh);g.strokeStyle='#2c251bcc';g.lineWidth=2;g.strokeRect(-bw*.5,-bh*.5,bw,bh);g.fillStyle='rgba(255,255,255,.10)';g.fillRect(-bw*.38,-bh*.34,bw*.55,3);g.restore();
    };
    for(let i=0;i<18;i++){
      const q=i/17,spread=24+q*w*.42,bx=x+w*.5+rand(i,1)*spread,by=top+q*(bot-top)+rand(i,2)*18;
      const bw=28+Math.abs(rand(i,3))*36,bh=16+Math.abs(rand(i,4))*24,col=i%3?'#8c8473':'#b0a795';
      block(bx,by,bw,bh,col,rand(i,5)*.35);
    }
    for(let i=0;i<12;i++){
      const bx=x-24+i*(w+48)/11+rand(i,6)*12,by=bot+16+Math.abs(rand(i,7))*16,s=10+Math.abs(rand(i,8))*18;
      block(bx,by,s*1.35,s,i%2?'#776d5e':'#a49b88',rand(i,9)*.5);
    }
    g.fillStyle='#f2d18d88';g.font='800 14px sans-serif';g.textAlign='center';g.fillText('↑',x+w*.5,top-18);
    g.restore();
  }
  function drawSquarePit(pit,style){
    const x=pit.x,y=pit.topY??GROUND_Y,w=pit.w,h=Math.max(44,pit.y-y),t=currentStageTheme,isDesert=t==='沙漠',isRoad=t==='街区'||t==='高楼'||t==='室内';
    if(t==='森林'&&forestAtlasReady(forestTerrainAtlas)){drawForestAtlasCell(forestTerrainAtlas,0,1,x-w*.18,y-h*.55,w*1.36,h*1.72);return}
    if(isDesert&&atlasReady(desertYardangArchitectureAtlas)){
      const dw=w*1.9,dh=Math.max(132,w*1.08),cx=x+w*.5;
      const l=cx-dw*.5,r=cx+dw*.5,top=y-dh*.34,bottom=top+dh;
      g.save();g.beginPath();g.moveTo(l+dw*.19,top+dh*.04);g.lineTo(r-dw*.15,top);g.lineTo(r-dw*.035,top+dh*.2);g.lineTo(r,top+dh*.54);g.lineTo(r-dw*.08,bottom-dh*.13);g.lineTo(r-dw*.31,bottom);g.lineTo(l+dw*.2,bottom-dh*.025);g.lineTo(l+dw*.035,bottom-dh*.24);g.lineTo(l,top+dh*.43);g.closePath();g.clip();drawDesertAtlasCell(desertYardangArchitectureAtlas,1,1,l,top,dw,dh);g.restore();return
    }
    if(t==='街区'&&(window.TieJieAssets?.imageReady?.(oldAlleyRoadCollapseSprite)||oldAlleyRoadCollapseSprite?.complete&&oldAlleyRoadCollapseSprite.naturalWidth)){
      const dw=w*1.9,dh=Math.max(110,w*.76)*(pit.visualScaleY||1),cx=x+w*.5;
      g.save();g.translate(cx,y-32);if(pit.visualFlipX)g.scale(-1,1);g.drawImage(oldAlleyRoadCollapseSprite,-dw*.5,0,dw,dh);g.restore();return
    }
    if(t==='水中避难所'&&atlasReady(waterShelterStructureAtlas)){
      const dw=w*1.35,dh=Math.max(92,w*.68),cx=x+w*.5,left=cx-dw*.5,top=y-26;g.save();g.beginPath();g.moveTo(left+dw*.09,top+dh*.17);g.lineTo(left+dw*.28,top+dh*.04);g.lineTo(left+dw*.76,top+dh*.05);g.lineTo(left+dw*.94,top+dh*.22);g.lineTo(left+dw*.98,top+dh*.72);g.lineTo(left+dw*.77,top+dh*.94);g.lineTo(left+dw*.22,top+dh*.92);g.lineTo(left+dw*.03,top+dh*.67);g.closePath();g.clip();drawWaterShelterAtlasCell(waterShelterStructureAtlas,1,1,left,top,dw,dh);g.restore();return
    }
    if(t==='草地'&&(window.TieJieAssets?.imageReady?.(greatWallPitSprite)||greatWallPitSprite?.complete&&greatWallPitSprite.naturalWidth)){
      const dw=w*1.5,dh=Math.max(120,w*1.15);
      if(window.TieJieAssets?.imageReady?.(greatWallPitEdgeSprite)||greatWallPitEdgeSprite?.complete&&greatWallPitEdgeSprite.naturalWidth)g.drawImage(greatWallPitEdgeSprite,x+w*.5-dw*.61,y-45,dw*1.22,dh*1.16);
      g.drawImage(greatWallPitSprite,x+w*.5-dw*.5,y-28,dw,dh);return
    }
    const cx=x+w*.5,cy=y+h*.52,seed=(pit.x*.013+pit.w*.021)%9.7;
    const jitter=(i,a)=>Math.sin(seed+i*12.989+a*78.233);
    const rimRaise=isRoad?14:22;
    const ring=[
      [-.6,-.42],[-.44,-.62],[-.18,-.52],[.02,-.68],[.28,-.56],[.5,-.43],[.66,-.16],[.54,.06],[.62,.32],[.35,.56],[.08,.48],[-.18,.64],[-.48,.43],[-.68,.08]
    ].map((p,i)=>[cx+p[0]*w+jitter(i,1)*26,cy+p[1]*h+jitter(i,2)*22-rimRaise*(i<7?1:.25)]);
    const inner=ring.map((p,i)=>[cx+(p[0]-cx)*.64+jitter(i,3)*8,cy+(p[1]-cy)*.58+jitter(i,4)*8+10]);
    g.save();
    g.shadowColor='#0009';g.shadowBlur=12;g.shadowOffsetY=12;
    g.fillStyle=isRoad?'#2f3130':isDesert?'#7a4628':'#4f3425';
    g.beginPath();ring.forEach((p,i)=>i?g.lineTo(p[0],p[1]+24):g.moveTo(p[0],p[1]+24));g.closePath();g.fill();
    g.fillStyle=isRoad?'#575853':isDesert?'#c08a52':'#816042';
    g.beginPath();ring.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();
    g.shadowColor='transparent';
    if(isRoad){
      g.fillStyle='#d6d4cb';g.beginPath();g.moveTo(x-54,y+h*.02);g.lineTo(x+w*.18,y-22);g.lineTo(x+w*.5,y-8);g.lineTo(x+w*.36,y+h*.25);g.lineTo(x+w*.02,y+h*.32);g.closePath();g.fill();
      g.fillStyle='#8f8d83';g.beginPath();g.moveTo(x-54,y+h*.02);g.lineTo(x+w*.02,y+h*.32);g.lineTo(x+w*.36,y+h*.25);g.lineTo(x+w*.42,y+h*.38);g.lineTo(x+w*.06,y+h*.48);g.lineTo(x-30,y+h*.22);g.closePath();g.fill();
      g.fillStyle='#c9c7bd';g.beginPath();g.moveTo(x+w*.36,y-16);g.lineTo(x+w+42,y+h*.05);g.lineTo(x+w+8,y+h*.38);g.lineTo(x+w*.55,y+h*.26);g.closePath();g.fill();
      g.fillStyle='#6b6a64';g.beginPath();g.moveTo(x+w*.55,y+h*.26);g.lineTo(x+w+8,y+h*.38);g.lineTo(x+w-10,y+h*.58);g.lineTo(x+w*.44,y+h*.43);g.closePath();g.fill();
      g.fillStyle='#5f625f';g.beginPath();g.moveTo(x-45,y+h*.08);g.lineTo(x+w*.22,y-16);g.lineTo(x+w+36,y+h*.18);g.lineTo(x+w+10,y+h*.52);g.lineTo(x+w*.12,y+h*.43);g.closePath();g.fill();
      g.strokeStyle='#1f2425aa';g.lineWidth=3;for(let i=0;i<9;i++){const sx=x-36+i*w*.15,sy=y+8+jitter(i,5)*20;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+32+jitter(i,6)*45,sy+18+jitter(i,7)*44);g.stroke()}
    }else{
      const dirt=g.createRadialGradient(cx,cy,12,cx,cy,w*.72);dirt.addColorStop(0,'#6a3e24');dirt.addColorStop(.55,isDesert?'#b9793f':'#8b6139');dirt.addColorStop(1,isDesert?'#d0a16200':'#8b613900');g.fillStyle=dirt;g.beginPath();g.ellipse(cx,cy,w*.76,h*.72,0,0,6.3);g.fill();
    }
    const wall=g.createLinearGradient(cx,cy-h*.5,cx,cy+h*.5);wall.addColorStop(0,isRoad?'#b7b4aa':'#d29a60');wall.addColorStop(.28,isRoad?'#6b6a64':'#8b5532');wall.addColorStop(.64,isRoad?'#343535':'#402319');wall.addColorStop(1,'#050403');g.fillStyle=wall;
    g.beginPath();ring.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));inner.slice().reverse().forEach(p=>g.lineTo(p[0],p[1]));g.closePath();g.fill();
    const dark=g.createRadialGradient(cx,cy,8,cx,cy,w*.42);dark.addColorStop(0,'#000');dark.addColorStop(.68,'#030201');dark.addColorStop(1,'#120b08dd');g.fillStyle=dark;
    g.beginPath();inner.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();
    g.strokeStyle=isRoad?'#1c2021':'#4d2817';g.lineWidth=9;g.beginPath();ring.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();
    g.strokeStyle=isRoad?'#d4d1c788':'#edc27a88';g.lineWidth=4;g.beginPath();
    for(let i=0;i<ring.length;i+=2){const p=ring[i],q=ring[(i+1)%ring.length];g.moveTo(p[0],p[1]-3);g.lineTo((p[0]+q[0])*.5,(p[1]+q[1])*.5-5)}
    g.stroke();
    if(isRoad){
      g.fillStyle='#d8d6cb';for(let i=0;i<8;i++){const p=ring[i],q=ring[(i+1)%ring.length],mx=(p[0]+q[0])*.5,my=(p[1]+q[1])*.5,s=16+Math.abs(jitter(i,14))*26;g.beginPath();g.moveTo(mx-s*.8,my-jitter(i,15)*8);g.lineTo(mx+s*.7,my-6);g.lineTo(mx+s*.25,my+s*.55);g.lineTo(mx-s*.55,my+s*.35);g.closePath();g.fill();g.strokeStyle='#76746d';g.lineWidth=2;g.stroke()}
      g.strokeStyle='#3b3f40cc';g.lineWidth=4;for(let i=0;i<5;i++){const p=ring[(i*2+1)%ring.length];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]+jitter(i,16)*45,p[1]+36+Math.abs(jitter(i,17))*70);g.stroke()}
    }
    g.strokeStyle=isRoad?'#bbb8ad88':'#e1b77578';g.lineWidth=3;g.beginPath();for(let i=0;i<ring.length;i+=3){const p=ring[i],q=inner[i];g.moveTo(p[0],p[1]+6);g.lineTo(q[0],q[1])}g.stroke();
    g.fillStyle=isRoad?'#343635':'#8f5b32';for(let i=0;i<9;i++){const px=cx+(jitter(i,8))*w*.58,py=cy+(jitter(i,9))*h*.52,s=7+Math.abs(jitter(i,10))*18;g.beginPath();g.ellipse(px,py,s,s*.48,jitter(i,11),0,6.3);g.fill()}
    g.strokeStyle=isRoad?'#20232488':'#6d3d2488';g.lineWidth=2.5;for(let i=0;i<7;i++){const p=ring[(i*2)%ring.length],len=38+Math.abs(jitter(i,12))*56,ang=Math.atan2(p[1]-cy,p[0]-cx)+jitter(i,13)*.45;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]+Math.cos(ang)*len,p[1]+Math.sin(ang)*len);g.stroke()}
    g.globalAlpha=.95;
    g.fillStyle=isDesert?'#b98747':isRoad?'#6d6d65':'#8e6740';
    g.beginPath();g.moveTo(cx+w*.22,y+h*.78);g.lineTo(x+w+78,y+h+42);g.lineTo(x+w*.66,y+h+36);g.lineTo(cx+w*.04,y+h*.78);g.closePath();g.fill();
    g.strokeStyle=isDesert?'#e4bd74aa':'#b9b5a688';g.lineWidth=3;for(let i=0;i<4;i++){g.beginPath();g.moveTo(cx+w*.16+i*12,y+h*.82+i*5);g.lineTo(x+w+44+i*6,y+h+28+i*2);g.stroke()}
    g.restore()
  }
  function drawHazardHousing(h){
    const x=h.x,y=h.y,w=h.w;g.save();
    if(h.type==='electric'||h.type==='spark'){
      const steel=g.createLinearGradient(0,y-8,0,y+24);steel.addColorStop(0,'#657176');steel.addColorStop(.28,'#293337');steel.addColorStop(1,'#101719');g.fillStyle=steel;g.fillRect(x-5,y-8,w+10,27);g.fillStyle='#090d0f';g.fillRect(x-5,y+19,w+10,8);g.strokeStyle='#899497';g.lineWidth=2;g.strokeRect(x-3,y-6,w+6,23);
      g.fillStyle='#c98632';for(let bx=x+4;bx<x+w-3;bx+=24){g.beginPath();g.moveTo(bx,y+12);g.lineTo(bx+8,y+12);g.lineTo(bx+3,y+18);g.lineTo(bx-5,y+18);g.closePath();g.fill()}g.fillStyle='#c8cfcd';for(const bx of [x+5,x+w-5]){g.beginPath();g.arc(bx,y-1,2.5,0,6.3);g.fill()}
    }else if(h.type==='steam'){
      const pipe=g.createLinearGradient(0,y-7,0,y+26);pipe.addColorStop(0,'#a5adae');pipe.addColorStop(.22,'#596467');pipe.addColorStop(.62,'#252e31');pipe.addColorStop(1,'#101618');g.fillStyle=pipe;g.fillRect(x-5,y-4,w+10,29);g.fillStyle='#12191b';g.fillRect(x-8,y+20,w+16,8);g.fillStyle='#737d7e';for(let bx=x+12;bx<x+w;bx+=42){g.fillRect(bx-5,y-8,11,35);g.fillStyle='#c47a3c';g.fillRect(bx-3,y-5,3,28);g.fillStyle='#737d7e'}
    }else if(h.type==='thorn'||h.type==='spike'){
      const base=g.createLinearGradient(0,y+7,0,y+29);base.addColorStop(0,h.type==='thorn'?'#52653a':'#6c5238');base.addColorStop(.35,h.type==='thorn'?'#26351f':'#3b2c21');base.addColorStop(1,'#10120f');g.fillStyle=base;g.beginPath();g.moveTo(x-7,y+8);g.lineTo(x+w+7,y+8);g.lineTo(x+w+2,y+29);g.lineTo(x-2,y+29);g.closePath();g.fill();g.strokeStyle='#111615';g.lineWidth=3;g.stroke();g.fillStyle='#a7ad9e';for(let bx=x+7;bx<x+w-4;bx+=38){g.beginPath();g.arc(bx,y+19,2,0,6.3);g.fill()}
    }else if(h.type==='fireBowl'||h.type==='fireJet'){
      const iron=g.createLinearGradient(0,y,0,y+35);iron.addColorStop(0,'#7e5540');iron.addColorStop(.24,'#402a22');iron.addColorStop(1,'#15100f');g.fillStyle='#100c0b';g.fillRect(x+5,y,w-10,9);g.fillStyle=iron;g.beginPath();g.moveTo(x+9,y+5);g.lineTo(x+w-9,y+5);g.lineTo(x+w-18,y+34);g.lineTo(x+18,y+34);g.closePath();g.fill();g.strokeStyle='#9b6944';g.lineWidth=3;g.stroke();g.fillStyle='#202425';for(let bx=x+23;bx<x+w-12;bx+=34)g.fillRect(bx,y+10,5,20)
    }else if(h.type==='glass'){
      const rail=g.createLinearGradient(0,y+9,0,y+28);rail.addColorStop(0,'#66767a');rail.addColorStop(1,'#182124');g.fillStyle=rail;g.fillRect(x-5,y+10,w+10,18);g.fillStyle='#0c1113';g.fillRect(x-5,y+25,w+10,6);g.strokeStyle='#a8bdc1';g.lineWidth=2;g.strokeRect(x-3,y+11,w+6,15)
    }
    g.restore()
  }
  function drawHazards(){
    const t=performance.now()/160;g.save();
    for(const h of currentHazards()){
      const cx=h.x+h.w*.5,y=h.y,flash=.65+Math.sin(t+h.x*.01)*.35;
      g.save();g.translate(cx,y+12);drawGroundShadow(h.w*.45,7,8,'#03050677');g.restore();
      drawHazardHousing(h);
      if(h.type==='electric'||h.type==='spark'){
        g.strokeStyle=`rgba(105,205,255,${.5+flash*.45})`;g.lineWidth=5;g.beginPath();g.moveTo(h.x+8,y-3);g.lineTo(h.x+h.w-8,y-3);g.stroke();
        for(let x=h.x+24;x<h.x+h.w-18;x+=42){g.strokeStyle=x%84?'#eafcff':'#65d5ff';g.lineWidth=x%84?3:5;g.beginPath();g.moveTo(x,y-24);g.lineTo(x+13,y-7);g.lineTo(x-4,y+7);g.lineTo(x+18,y+25);g.stroke()}
        g.fillStyle='#1b2428';g.fillRect(cx-28,y-48,56,38);g.strokeStyle='#84dfff';g.strokeRect(cx-28,y-48,56,38);
      }else if(h.type==='steam'){
        g.fillStyle='#30383a';g.fillRect(h.x,y+4,h.w,18);g.strokeStyle='#b9c8c9aa';g.lineWidth=6;for(let x=h.x+22;x<h.x+h.w;x+=42){g.beginPath();g.moveTo(x,y+2);g.quadraticCurveTo(x+18,y-42+Math.sin(t+x)*12,x+2,y-78);g.stroke()}
      }else if(h.type==='thorn'||h.type==='spike'){
        g.fillStyle=h.type==='thorn'?'#1f3c20':'#3b2a20';for(let x=h.x+8;x<h.x+h.w-8;x+=24){g.beginPath();g.moveTo(x,y+16);g.lineTo(x+11,y-32-(x%3)*5);g.lineTo(x+23,y+16);g.closePath();g.fill()}g.strokeStyle=h.type==='thorn'?'#7fa464':'#c09355';g.lineWidth=3;g.beginPath();g.moveTo(h.x,y+16);g.lineTo(h.x+h.w,y+16);g.stroke();
      }else if(h.type==='fireBowl'||h.type==='fireJet'){
        g.fillStyle='#3a2118';g.fillRect(h.x+12,y+4,h.w-24,20);for(let x=h.x+26;x<h.x+h.w-14;x+=36){const hgt=32+Math.sin(t+x*.08)*16;g.fillStyle='#f05a20cc';g.beginPath();g.moveTo(x-12,y+4);g.quadraticCurveTo(x,y-hgt,x+13,y+4);g.fill();g.fillStyle='#ffd15acc';g.beginPath();g.moveTo(x-6,y+4);g.quadraticCurveTo(x+3,y-hgt*.58,x+8,y+4);g.fill()}
      }else if(h.type==='glass'){
        g.fillStyle='#cde8ee88';for(let x=h.x+8;x<h.x+h.w-8;x+=28){g.beginPath();g.moveTo(x,y+12);g.lineTo(x+18,y-13);g.lineTo(x+31,y+8);g.closePath();g.fill()}g.strokeStyle='#edf8fb';g.lineWidth=2;g.beginPath();g.moveTo(h.x,y+16);g.lineTo(h.x+h.w,y+6);g.stroke();
      }
    }
    g.restore()
  }
  function drawPlatformDetails(p,b1,b2,t,style){
    const mid=(b1.left+b1.right)/2;
    if(t==='沙漠'){g.fillStyle='#c89855aa';for(let x=b1.left+80;x<b1.right-80;x+=180){g.beginPath();g.arc(x,p.minY+24,10,0,6.3);g.fill();g.fillRect(x-4,p.minY+26,8,30)}}
    else if(t==='草地'){g.strokeStyle='#4b3b27aa';g.lineWidth=3;for(let y=p.minY+26;y<p.maxY-8;y+=26){g.beginPath();g.moveTo(b1.left+25,y);g.lineTo(b2.right-35,y+8);g.stroke()}g.fillStyle='#251d14cc';for(let x=b1.left+65;x<b1.right-65;x+=130){g.fillRect(x,p.minY-16,22,20);g.fillRect(x+54,p.minY-10,22,14)}}
    else if(t==='高楼'){for(let x=b1.left+44;x<b1.right-80;x+=210)drawAtlasCell(skyShelterBoundariesAtlas,1,0,x,p.minY-72,180,100,.92)}
    else if(t==='水中避难所'){
      g.strokeStyle='#293d40';g.lineWidth=7;g.beginPath();g.moveTo(b1.left+18,p.minY+15);g.lineTo(b1.right-18,p.minY+15);g.stroke();
      g.strokeStyle='#9a6a48';g.lineWidth=3;for(let x=b1.left+62;x<b1.right-40;x+=138){g.beginPath();g.moveTo(x,p.minY+15);g.lineTo(x+24,p.maxY-10);g.stroke()}
    }
    else if(t==='室内'){g.strokeStyle='#e0b16b88';g.lineWidth=4;for(let x=b1.left+80;x<b1.right-60;x+=160){g.strokeRect(x,p.minY+20,80,42)}}
    else if(t==='古战场'){g.fillStyle='#382219cc';g.fillRect(mid-26,p.minY-54,52,46);g.fillStyle='#cc6f2b';g.beginPath();g.arc(mid,p.minY-64,18,0,6.3);g.fill();g.fillStyle='#f1b45a88';g.beginPath();g.moveTo(mid-10,p.minY-55);g.quadraticCurveTo(mid,p.minY-96,mid+12,p.minY-55);g.fill()}
  }
  function drawBunkerAtlasCell(image,col,row,x,y,w,h,alpha=1){
    if(!image||!(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth))return false;
    const cell=(image.naturalWidth||image.width)/2,inset=3,source=cell-inset*2;g.save();g.globalAlpha=alpha;g.drawImage(image,col*cell+inset,row*cell+inset,source,source,x,y,w,h);g.restore();return true
  }
  function drawBunkerRoomWallTiles(room,top,wallBottom){
    const tileSize=wallBottom-top,flooded=currentStageTheme==='水中避难所',stone=room.kind==='stone'&&!flooded;
    if(flooded&&atlasReady(waterShelterFloodedRoomAtlas)){
      const first=Math.max(0,Math.floor((cameraX-room.left-tileSize)/tileSize));
      for(let x=room.left+first*tileSize,i=first;x<room.right-.5&&x<cameraX+W+tileSize;x+=tileSize,i++){
        const w=Math.min(tileSize,room.right-x);drawWaterShelterAtlasCell(waterShelterFloodedRoomAtlas,i&1,0,x-.75,top,w+1.5,tileSize)
      }
      return true
    }
    if(stone&&currentStageTheme==='沙漠'&&atlasReady(desertYardangArchitectureAtlas)&&atlasReady(desertYardangTerrainAtlas)){
      const first=Math.max(0,Math.floor((cameraX-room.left-tileSize)/tileSize));let x=room.left+first*tileSize;
      while(x<room.right-.5&&x<cameraX+W+tileSize){
        const w=Math.min(tileSize,room.right-x),tileCenter=x+w*.5,climbCenter=room.right-190,useClimb=room.climbable&&Math.abs(tileCenter-climbCenter)<tileSize*.62;
        drawDesertAtlasCell(useClimb?desertYardangTerrainAtlas:desertYardangArchitectureAtlas,useClimb?1:0,1,x-.75,top,w+1.5,tileSize);x+=w
      }
      return true
    }
    if(stone&&currentStageTheme==='高楼'&&atlasReady(skyShelterOuterPitWallsAtlas)){
      const first=Math.max(0,Math.floor((cameraX-room.left-tileSize)/tileSize));let x=room.left+first*tileSize,tileIndex=first;
      while(x<room.right-.5&&x<cameraX+W+tileSize){
        const remaining=room.right-x,w=Math.min(tileSize,remaining),tileCenter=x+w*.5,climbCenter=room.right-190,useClimb=room.climbable&&Math.abs(tileCenter-climbCenter)<tileSize*.62;
        drawAtlasCell(skyShelterOuterPitWallsAtlas,tileIndex&1,useClimb?0:1,x-.75,top,w+1.5,tileSize);x+=w;tileIndex++
      }
      return true
    }
    if(!stone&&bunkerModernRoomStrips&&(window.TieJieAssets?.imageReady?.(bunkerModernRoomStrips)||bunkerModernRoomStrips.complete&&bunkerModernRoomStrips.naturalWidth)){
      const sourceW=bunkerModernRoomStrips.naturalWidth||bunkerModernRoomStrips.width,sourceH=(bunkerModernRoomStrips.naturalHeight||bunkerModernRoomStrips.height)/4,tileW=tileSize*(sourceW/sourceH),row=flooded?0:room.material%3;
      // Adjacent room strips can land on half pixels after the camera transform.
      // Give every strip a tiny horizontal bleed so the backing wall never
      // appears as a bright one-pixel seam between two modules.
      const first=Math.max(0,Math.floor((cameraX-room.left-tileW)/tileW));
      for(let x=room.left+first*tileW;x<room.right-.5&&x<cameraX+W+tileW;x+=tileW){
        const w=Math.min(tileW,room.right-x),bleed=.75;
        g.drawImage(bunkerModernRoomStrips,0,row*sourceH,sourceW*(w/tileW),sourceH,x-bleed,top,w+bleed*2,tileSize)
      }
      return true
    }
    const climb=bunkerCaveClimbTexture,climbReady=climb&&(window.TieJieAssets?.imageReady?.(climb)||climb.complete&&climb.naturalWidth),plain=bunkerCavePlainTexture,plainReady=plain&&(window.TieJieAssets?.imageReady?.(plain)||plain.complete&&plain.naturalWidth);
    const first=Math.max(0,Math.floor((cameraX-room.left-tileSize)/tileSize));let x=room.left+first*tileSize,tileIndex=first,ready=false;
    while(x<room.right-.5&&x<cameraX+W+tileSize){
      const remaining=room.right-x,w=Math.min(tileSize,remaining);
      const tileCenter=x+w*.5,climbCenter=room.right-190,useClimb=room.climbable&&Math.abs(tileCenter-climbCenter)<tileSize*.62;
      if(useClimb&&climbReady){
        // Dedicated climb texture shares the exact plain-rock border, so no
        // rectangular legacy atlas background can appear around the holds.
        g.drawImage(climb,0,0,climb.naturalWidth||climb.width,climb.naturalHeight||climb.height,x,top,w,tileSize);
        ready=true
      }else if(plainReady){g.drawImage(plain,0,0,plain.naturalWidth||plain.width,plain.naturalHeight||plain.height,x-.75,top,w+1.5,tileSize);ready=true}
      x+=w;tileIndex++
    }
    return ready
  }
  function drawBunkerRoomFloorTiles(room,floorTop,floorBottom,top){
    const stone=room.kind==='stone'&&currentStageTheme!=='水中避难所',floorShift=(floorBottom-floorTop)*BUNKER_FLOOR_SKEW;
    if(currentStageTheme==='水中避难所'&&atlasReady(waterShelterFloodedRoomAtlas)){
      g.save();g.beginPath();g.moveTo(room.left-.75,floorTop-.75);g.lineTo(room.right+.75,floorTop-.75);g.lineTo(room.right+floorShift+.75,floorBottom+.75);g.lineTo(room.left+floorShift-.75,floorBottom+.75);g.closePath();g.clip();g.transform(1,0,BUNKER_FLOOR_SKEW,1,-BUNKER_FLOOR_SKEW*floorTop,0);
      const tileSize=340,visibleLeft=cameraX-floorShift-tileSize,first=Math.max(0,Math.floor((visibleLeft-room.left)/tileSize));
      for(let x=room.left+first*tileSize;x<room.right&&x<cameraX+W+tileSize;x+=tileSize){const w=Math.min(tileSize,room.right-x);drawWaterShelterAtlasCell(waterShelterFloodedRoomAtlas,0,1,x-.75,floorTop,w+1.5,tileSize)}
      g.restore();return true
    }
    if(!stone&&bunkerModernRoomStrips&&(window.TieJieAssets?.imageReady?.(bunkerModernRoomStrips)||bunkerModernRoomStrips.complete&&bunkerModernRoomStrips.naturalWidth)){
      const sourceW=bunkerModernRoomStrips.naturalWidth||bunkerModernRoomStrips.width,sourceH=(bunkerModernRoomStrips.naturalHeight||bunkerModernRoomStrips.height)/4;
      // The authored floor used to be drawn as a rectangle.  The cross-wall
      // follows the corridor's slanted depth, so that rectangle stopped early
      // and exposed a black triangular hole below an opened door.  Clip the
      // same floor strip to the shared corridor parallelogram and slightly
      // overdraw its edges to keep sub-pixel seams out of the doorway.
      const bleed=1;
      g.save();g.beginPath();g.moveTo(room.left-bleed,floorTop-bleed);g.lineTo(room.right+bleed,floorTop-bleed);g.lineTo(room.right+floorShift+bleed,floorBottom+bleed);g.lineTo(room.left+floorShift-bleed,floorBottom+bleed);g.closePath();g.clip();
      g.drawImage(bunkerModernRoomStrips,0,sourceH*3,sourceW,sourceH,room.left-bleed,floorTop-bleed,room.right-room.left+floorShift+bleed*2,floorBottom-floorTop+bleed*2);g.restore();return true
    }
    g.save();g.beginPath();g.moveTo(room.left-.75,floorTop-.75);g.lineTo(room.right+.75,floorTop-.75);g.lineTo(room.right+floorShift+.75,floorBottom+.75);g.lineTo(room.left+floorShift-.75,floorBottom+.75);g.closePath();g.clip();g.transform(1,0,BUNKER_FLOOR_SKEW,1,-BUNKER_FLOOR_SKEW*floorTop,0);
    if(currentStageTheme==='沙漠'&&atlasReady(desertYardangArchitectureAtlas)){
      const tileSize=320,visibleLeft=cameraX-floorShift-tileSize,first=Math.max(0,Math.floor((visibleLeft-room.left)/tileSize));
      for(let x=room.left+first*tileSize;x<room.right&&x<cameraX+W+tileSize;x+=tileSize){const w=Math.min(tileSize,room.right-x);drawDesertAtlasCell(desertYardangArchitectureAtlas,1,1,x-.75,floorTop,w+1.5,tileSize)}
      g.restore();return true
    }
    const plain=bunkerCavePlainTexture;if(!plain||!(window.TieJieAssets?.imageReady?.(plain)||plain.complete&&plain.naturalWidth)){g.restore();return false}
    const sourceW=plain.naturalWidth||plain.width,sourceH=plain.naturalHeight||plain.height,tileSize=320;
    const visibleLeft=cameraX-floorShift-tileSize,first=Math.max(0,Math.floor((visibleLeft-room.left)/tileSize));
    for(let x=room.left+first*tileSize,tile=first;x<room.right&&x<cameraX+W+tileSize;x+=tileSize,tile++){
      const w=Math.min(tileSize,room.right-x);
      g.drawImage(plain,0,0,sourceW*(w/tileSize),sourceH,x-.75,floorTop,w+1.5,tileSize)
    }
    g.restore();return true
  }
  function bunkerVisible(left,right,pad=360){return right>=cameraX-pad&&left<=cameraX+W+pad}
  function drawBunkerWater(room,top,floorTop){
    const now=performance.now()*.001,seed=room.index*7.31+room.left*.0017;g.save();
    for(let i=0;i<3;i++){
      const cx=room.left+170+i*335+Math.sin(seed+i*9.2)*72,cy=floorTop+45+Math.sin(seed+i*4.7)*28,rx=55+Math.abs(Math.sin(seed+i))*38,ry=9+Math.abs(Math.cos(seed+i*2.1))*8;
      g.fillStyle=i%2?'#302b258c':'#41372d78';g.beginPath();
      for(let n=0;n<14;n++){const a=n/14*Math.PI*2,r=1+Math.sin(seed+i*11+n*4.73)*.2+Math.cos(seed+n*2.17)*.12,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;n?g.lineTo(x,y):g.moveTo(x,y)}
      g.closePath();g.fill();g.strokeStyle='#7d706255';g.lineWidth=1.5;g.stroke()
    }
    for(let i=0;i<4;i++){
      const x=room.left+130+i*285+Math.sin(seed+i*8.3)*58,phase=(now*(1.65+i*.16)+seed+i*.23)%1,impactY=floorTop+28+Math.sin(seed+i)*22,dropY=top+20+phase*(impactY-top-20),trail=30+phase*24;
      const dropGrad=g.createLinearGradient(x,dropY-trail,x,dropY+5);dropGrad.addColorStop(0,'#b9cec600');dropGrad.addColorStop(.45,'#b9cec65c');dropGrad.addColorStop(1,'#d8e8e0cc');g.strokeStyle=dropGrad;g.lineWidth=2.2;g.beginPath();g.moveTo(x,Math.max(top+8,dropY-trail));g.lineTo(x,dropY+5);g.stroke();
      if(phase>.9){const q=(phase-.9)*10;g.strokeStyle=`rgba(170,205,196,${(1-q)*.55})`;g.lineWidth=1.5;g.beginPath();g.ellipse(x,impactY,8+q*22,2+q*5,0,0,6.3);g.stroke()}
    }
    g.restore()
  }
  function drawFloodedBunkerRoom(room,floorTop,floorBottom){
    const floorShift=(floorBottom-floorTop)*BUNKER_FLOOR_SKEW,now=performance.now()*.0015;
    g.save();g.beginPath();g.moveTo(room.left,floorTop-34);g.lineTo(room.right,floorTop-34);g.lineTo(room.right+floorShift,floorBottom);g.lineTo(room.left+floorShift,floorBottom);g.closePath();g.clip();
    const water=g.createLinearGradient(0,floorTop-34,0,floorBottom);water.addColorStop(0,'#78b9bd88');water.addColorStop(.3,'#397c869c');water.addColorStop(1,'#103d4bbd');g.fillStyle=water;g.fillRect(room.left-10,floorTop-34,room.right-room.left+floorShift+20,floorBottom-floorTop+40);
    g.strokeStyle='#b9dcda80';g.lineWidth=2;for(let y=floorTop-24;y<floorBottom;y+=32){g.beginPath();for(let x=room.left-20,first=true;x<room.right+floorShift+20;x+=48){const wy=y+Math.sin(now*2+x*.02+y*.03)*2.5;first?(g.moveTo(x,wy),first=false):g.lineTo(x,wy)}g.stroke()}g.restore()
  }
  function drawBunkerClimbVines(x,top,bottom){
    g.save();g.lineCap='round';for(let y=top+92,row=0;y<bottom-44;y+=64,row++){
      if(row%4===2)continue;
      const left=x-82+(row%3)*9,right=x+76-(row%2)*24,breakAt=row%3===1;
      g.strokeStyle='#20170f';g.lineWidth=10;g.beginPath();g.moveTo(left,y+Math.sin(row)*5);if(breakAt){g.bezierCurveTo(x-54,y-10,x-30,y+9,x-12,y+2);g.moveTo(x+12,y-4);g.bezierCurveTo(x+28,y+12,x+52,y-8,right,y-3)}else g.bezierCurveTo(x-32,y-12,x+28,y+13,right,y-3);g.stroke();g.strokeStyle='#59442b';g.lineWidth=5;g.stroke();g.strokeStyle='#8a704755';g.lineWidth=1.4;g.stroke();
      g.fillStyle='#67513a';for(let i=0;i<2;i++){const bx=left+24+i*(right-left-48),by=y+(i?5:-4),bw=22+(row+i)%3*8;g.beginPath();g.moveTo(bx-bw*.55,by+7);g.lineTo(bx-bw*.34,by-8);g.lineTo(bx+bw*.4,by-10);g.lineTo(bx+bw*.55,by+5);g.closePath();g.fill()}
    }g.restore()
  }
  function drawBunkerSideDoor(door,floorTop,floorBottom){
    const image=bunkerCivilDefenseDoorAtlas;if(!image||!(window.TieJieAssets?.imageReady?.(image)||image.complete&&image.naturalWidth))return false;
    const cell=(image.naturalWidth||image.width)/2,sourceH=image.naturalHeight||image.height,sourceX=door.opened?cell:0;
    // The cross-wall is perpendicular to world X. Map its narrow rear foot to
    // the room boundary/floor back edge and its foreground foot to the shared
    // corridor shear so it visibly blocks the complete depth of the passage.
    const sourceBackX=298,sourceBackY=777,sourceFrontX=508,sourceFrontY=1005;
    const scaleY=(floorBottom-floorTop)/(sourceFrontY-sourceBackY),scaleX=((floorBottom-floorTop)*BUNKER_FLOOR_SKEW)/(sourceFrontX-sourceBackX);
    const drawX=door.x-sourceBackX*scaleX,drawY=floorTop-sourceBackY*scaleY,w=cell*scaleX,h=sourceH*scaleY;
    // Column 767 in the generated two-state atlas is a white separator. The
    // closed state occupies the left cell, so exclude that final source column
    // instead of scaling it into a full-height line beside the door.
    const sourceW=door.opened?cell:cell-1;
    g.drawImage(image,sourceX,0,sourceW,sourceH,drawX,drawY,w,h);return true
  }
  function drawBunkerLowerLayer(b){
    const bunker=b.bunker,y=b.y,top=y-420,floorTop=y-BUNKER_DEPTH*.5,floorBottom=y+BUNKER_DEPTH*.5,bottom=floorBottom+44;g.save();
    g.fillStyle='#030303';g.fillRect(cameraX-80,top-70,W+160,bottom-top+150);
    // Draw only camera-near rooms. The previous backing pass painted the full
    // bunker and then painted every room again, doubling texture work.
    for(let i=0;i<bunker.rooms.length;i++){
      const room=bunker.rooms[i];
      const wallRoom=i===bunker.rooms.length-1?{...room,right:bunker.right+760}:room;
      if(bunkerVisible(wallRoom.left,wallRoom.right,420))drawBunkerRoomWallTiles(wallRoom,top,floorTop)
    }
    // Perspective floors extend into the room on their right. Draw them from
    // right to left so the current/left room owns the doorway overlap instead
    // of exposing the next room's warm floor through the closed partition.
    for(let i=bunker.rooms.length-1;i>=0;i--){
      const room=bunker.rooms[i];if(!bunkerVisible(room.left,room.right+BUNKER_DEPTH*BUNKER_FLOOR_SKEW,420))continue;
      const floorRoom=i===0?{...room,left:bunker.left-760}:i===bunker.rooms.length-1?{...room,right:bunker.right+760}:room;
      drawBunkerRoomFloorTiles(floorRoom,floorTop,floorBottom,top);
      if(currentStageTheme==='水中避难所')drawFloodedBunkerRoom(floorRoom,floorTop,floorBottom);
      else if(room.kind==='stone'&&currentStageTheme!=='沙漠')drawBunkerWater(room,top,floorTop)
    }
    if(currentStageTheme==='水中避难所')drawBunkerClimbVines(b.climbX,top+30,floorTop+12);
    // Both ends are open cave passages. Their old full-height shaft caps were
    // rectangular overlays, not part of the room wall, so neither is drawn.
    const visibleDoors=bunker.doors.filter(door=>bunkerVisible(door.x,door.x,520));
    for(const door of visibleDoors)drawBunkerSideDoor(door,floorTop,floorBottom)
    g.fillStyle='#d8b66caa';g.font='700 13px sans-serif';g.textAlign='center';for(const door of visibleDoors)if(!door.opened)g.fillText('抓',door.x,y-258);
    g.restore()
  }
  function drawBunkerRoomFog(){
    const bunker=player.level<0&&player.subPit?.bunker;if(!bunker)return;
    const top=bunker.y-440,bottom=bunker.y+BUNKER_DEPTH*.5+66,floorTop=bunker.y-BUNKER_DEPTH*.5,floorBottom=bunker.y+BUNKER_DEPTH*.5;
    const floorShift=(floorBottom-floorTop)*BUNKER_FLOOR_SKEW;
    g.save();g.fillStyle='#000';for(const room of bunker.rooms)if(!room.opened&&bunkerVisible(room.left,room.right+floorShift,160)){
      // The concealed room follows the same perspective as its floor. A
      // rectangular mask used to cut off the opened room's slanted floor at
      // the doorway, exposing a conspicuous black triangular hole.
      g.beginPath();g.moveTo(room.left,top);g.lineTo(room.right,top);g.lineTo(room.right+floorShift,bottom);g.lineTo(room.left+floorShift,bottom);g.closePath();g.fill()
    }
    // Closed doors stay readable over the hard-edged black room mask.
    for(const door of bunker.doors)if(!door.opened&&bunkerVisible(door.x,door.x,520))drawBunkerSideDoor(door,floorTop,floorBottom);g.restore();
    // Canvas paths are not part of save()/restore(). Without clearing here,
    // a later bare stroke() can redraw the room-mask edge as a full-height
    // pale vertical line through the translucent HUD.
    g.beginPath()
  }
  function drawLowerLayer(){
    const pit=player.subPit?.pit||currentPits()[0];if(!pit)return;
    const b=player.subPit||lowerPitBounds(pit),y=b.y,theme=currentStageTheme;
    if(b.bunker){drawBunkerLowerLayer(b);return}
    g.save();
    g.fillStyle='#080706e8';g.fillRect(b.left-120,y-138,b.right-b.left+240,244);
    const desertLower=theme==='沙漠'&&atlasReady(desertYardangArchitectureAtlas),lowerFloorTile=theme==='草地'?greatWallPitFloorTile:theme==='街区'?oldAlleyStreetGround:theme==='高楼'?skyShelterRooftopGround:null;
    const texturedLowerFloor=desertLower?drawTiledDesertAtlasCell(desertYardangArchitectureAtlas,1,1,b.left-95,y-84,b.right+95,y+72,320,240,1):!!lowerFloorTile&&drawTiledImage(lowerFloorTile,b.left-95,y-84,b.right+95,y+72,280,280,.92);
    if(theme==='草地'&&texturedLowerFloor){
      g.fillStyle='#050606';g.beginPath();g.ellipse(b.backX-28,y-42,58,34,0,0,6.3);g.fill();g.beginPath();g.ellipse(b.exitX+34,y-44,70,40,0,0,6.3);g.fill();
      if(window.TieJieAssets?.imageReady?.(greatWallCollapseSprite)||greatWallCollapseSprite?.complete&&greatWallCollapseSprite.naturalWidth){const dw=250,dh=252;g.drawImage(greatWallCollapseSprite,b.climbX-dw*.5,y+58-dh,dw,dh)}
      g.restore();return
    }
    const earth=theme==='沙漠'?'#322117':theme==='草地'?'#2b2419':theme==='高楼'?'#11191d':theme==='古战场'?'#25140e':'#211915';
    const earthHi=theme==='高楼'||theme==='室内'?'#7c807c':theme==='沙漠'?'#87603b':'#6b5743';
    if(!texturedLowerFloor){
      g.fillStyle=earth;
      g.beginPath();g.moveTo(b.left-95,y-70);g.lineTo(b.left+80,y-84);g.lineTo(b.left+250,y-56);g.lineTo(b.right-170,y-78);g.lineTo(b.right+95,y-58);g.lineTo(b.right+95,y+70);g.lineTo(b.left-95,y+70);g.closePath();g.fill();
      g.strokeStyle=earthHi+'88';g.lineWidth=4;for(let x=b.left-60;x<b.right+45;x+=140){g.beginPath();g.moveTo(x,y-58);g.quadraticCurveTo(x+54,y-42,x+112,y-55);g.stroke()}
    }
    if(theme==='水中避难所'){
      const water=g.createLinearGradient(0,y-78,0,y+76);water.addColorStop(0,'#70afb588');water.addColorStop(1,'#123f4dbb');g.fillStyle=water;g.fillRect(b.left-95,y-78,b.right-b.left+190,150)
    }
    g.fillStyle='#050606';g.beginPath();g.ellipse(b.backX-28,y-42,58,34,0,0,6.3);g.fill();g.beginPath();g.ellipse(b.exitX+34,y-44,70,40,0,0,6.3);g.fill();
    const climbX=b.climbX,rock=theme==='高楼'||theme==='室内'?'#8b8980':'#9a7248',dark=theme==='高楼'||theme==='室内'?'#3f4443':'#46301f',hi=theme==='高楼'||theme==='室内'?'#d5d1c5':'#d8b176';
    const rubbleSeed=(b.climbX*.017+b.left*.013)%8.4,rand=(i,a)=>Math.sin(rubbleSeed+i*12.731+a*61.17);
    const block=(cx,cy,w,h,c,shade=0)=>{
      g.fillStyle=c;g.beginPath();g.moveTo(cx-w*.52,cy+h*.35);g.lineTo(cx-w*.34,cy-h*.38);g.lineTo(cx+w*.28,cy-h*.48);g.lineTo(cx+w*.55,cy+h*.18);g.lineTo(cx+w*.18,cy+h*.48);g.closePath();g.fill();
      g.fillStyle=shade?'#00000022':'#ffffff18';g.beginPath();g.moveTo(cx-w*.34,cy-h*.38);g.lineTo(cx+w*.28,cy-h*.48);g.lineTo(cx+w*.1,cy-h*.08);g.lineTo(cx-w*.48,cy+h*.08);g.closePath();g.fill();
      g.strokeStyle=dark;g.lineWidth=2.5;g.stroke()
    };
    g.fillStyle='#050403';g.beginPath();g.moveTo(climbX-126,y+42);g.lineTo(climbX-96,y-34);g.lineTo(climbX-34,y-118);g.lineTo(climbX+20,y-150);g.lineTo(climbX+88,y-92);g.lineTo(climbX+126,y+38);g.closePath();g.fill();
    const wallGrad=g.createLinearGradient(climbX-110,y-132,climbX+120,y+50);wallGrad.addColorStop(0,hi);wallGrad.addColorStop(.46,rock);wallGrad.addColorStop(1,dark);g.fillStyle=wallGrad;
    g.beginPath();g.moveTo(climbX-132,y+46);g.lineTo(climbX-104,y-18);g.lineTo(climbX-70,y-86);g.lineTo(climbX-30,y-72);g.lineTo(climbX+8,y-136);g.lineTo(climbX+42,y-104);g.lineTo(climbX+78,y-130);g.lineTo(climbX+112,y-64);g.lineTo(climbX+134,y+34);g.lineTo(climbX+80,y+16);g.lineTo(climbX+28,y+44);g.lineTo(climbX-28,y+22);g.lineTo(climbX-78,y+50);g.closePath();g.fill();
    g.strokeStyle=dark;g.lineWidth=6;g.stroke();
    g.strokeStyle='#ffffff20';g.lineWidth=5;g.beginPath();g.moveTo(climbX-82,y-74);g.lineTo(climbX-28,y-70);g.lineTo(climbX+8,y-132);g.moveTo(climbX+44,y-100);g.lineTo(climbX+78,y-124);g.stroke();
    const bigBlocks=[[-86,22,64,42],[-40,42,72,36],[20,32,76,42],[76,10,58,50],[-102,-26,48,58],[-42,-46,54,50],[32,-68,66,48],[82,-40,44,58]];
    for(let i=0;i<bigBlocks.length;i++){const q=bigBlocks[i];block(climbX+q[0],y+q[1],q[2],q[3],i%3?rock:hi,i%2)}
    for(let i=0;i<12;i++){const px=climbX-122+i*22+rand(i,8)*9,py=y+50-Math.abs(rand(i,9))*24,s=10+Math.abs(rand(i,10))*13;block(px,py,s*1.45,s,Math.abs(rand(i,11))>.55?hi:rock,i%2)}
    g.fillStyle='#f2d18d66';g.font='700 12px sans-serif';g.textAlign='center';g.fillText('↑',climbX,y-164);
    g.restore()
  }
  function drawUpperLayerMist(){
    if(player.level>=0||player.subPit?.bunker)return;
    const fogBottom=GROUND_Y+220,visibleBottom=Math.min(fogBottom,cameraY+H);if(visibleBottom<=cameraY)return;
    g.save();
    const fade=72,top=cameraY,bottom=visibleBottom;
    g.fillStyle='#000';g.fillRect(cameraX,top+fade,W,Math.max(0,bottom-top-fade*2));
    const topGrad=g.createLinearGradient(0,top,0,top+fade);topGrad.addColorStop(0,'rgba(0,0,0,0)');topGrad.addColorStop(.45,'rgba(0,0,0,.82)');topGrad.addColorStop(1,'#000');
    g.fillStyle=topGrad;g.fillRect(cameraX,top,W,fade);
    const bottomGrad=g.createLinearGradient(0,bottom-fade,0,bottom);bottomGrad.addColorStop(0,'#000');bottomGrad.addColorStop(.72,'rgba(0,0,0,.9)');bottomGrad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=bottomGrad;g.fillRect(cameraX,bottom-fade,W,fade);
    g.restore()
  }
  function drawBlackoutOverlay(){
    if(!blackoutActive())return;
    g.save();
    g.fillStyle='#000000c8';g.fillRect(cameraX,cameraY,W,H);
    g.globalCompositeOperation='destination-out';
    const r=190+Math.sin(performance.now()/240)*16,grd=g.createRadialGradient(player.x,player.y-player.z-58,20,player.x,player.y-player.z-58,r);
    grd.addColorStop(0,'rgba(0,0,0,.95)');grd.addColorStop(.55,'rgba(0,0,0,.55)');grd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grd;g.beginPath();g.arc(player.x,player.y-player.z-58,r,0,6.3);g.fill();
    g.globalCompositeOperation='source-over';
    g.strokeStyle='#d8ecff66';g.lineWidth=3;g.beginPath();g.arc(player.x,player.y-player.z-58,r*.62,0,6.3);g.stroke();
    if(powerSwitch){g.fillStyle='#76d9ff66';g.beginPath();g.arc(powerSwitch.x,powerSwitch.y-66,48+Math.sin(performance.now()/90)*6,0,6.3);g.fill()}
    g.restore()
  }
  function drawPowerSwitch(){
    if(!powerSwitch)return;const p=powerSwitch,t=performance.now()/180;if(player.level<0?p.level>=0:p.level<0)return;
    g.save();g.translate(p.x,p.y);drawGroundShadow(38,9,5,'#03050699');
    g.fillStyle='#090d0f';g.beginPath();g.moveTo(-34,-108);g.lineTo(27,-108);g.lineTo(36,-100);g.lineTo(36,-5);g.lineTo(-34,-5);g.closePath();g.fill();
    const side=g.createLinearGradient(25,-100,38,-100);side.addColorStop(0,'#394348');side.addColorStop(1,'#111719');g.fillStyle=side;g.beginPath();g.moveTo(27,-105);g.lineTo(35,-98);g.lineTo(35,-8);g.lineTo(27,-13);g.closePath();g.fill();
    const body=g.createLinearGradient(-30,-105,30,-5);body.addColorStop(0,'#5c676b');body.addColorStop(.18,'#354044');body.addColorStop(.72,'#1d2528');body.addColorStop(1,'#101517');g.fillStyle=body;g.fillRect(-30,-105,57,94);g.strokeStyle=p.on?'#d9c36a':'#607981';g.lineWidth=3;g.strokeRect(-29,-104,55,92);
    g.fillStyle='#0b1012';g.fillRect(-21,-94,39,58);g.strokeStyle=p.on?'#a98b2e':'#435a61';g.lineWidth=2;g.strokeRect(-20,-93,37,56);
    const plate=g.createLinearGradient(0,-91,0,-39);plate.addColorStop(0,p.on?'#d2b447':'#425358');plate.addColorStop(1,p.on?'#6f5b21':'#1c282c');g.fillStyle=plate;g.fillRect(-16,-89,29,48);
    g.strokeStyle=p.on?'#f6dc7a':'#9ab1b7';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(-2,-65);g.lineTo(p.on?11:-13,p.on?-47:-82);g.stroke();g.fillStyle='#171d1f';g.beginPath();g.arc(p.on?11:-13,p.on?-47:-82,7,0,6.3);g.fill();g.strokeStyle='#d8dedc';g.lineWidth=2;g.stroke();
    const glow=p.on?'#8bea79':'#e4604e';g.shadowColor=glow;g.shadowBlur=p.flash>0?14:6;g.fillStyle=glow;g.beginPath();g.arc(-2,-23,7+(p.flash>0?Math.sin(t)*2:0),0,6.3);g.fill();g.shadowBlur=0;
    g.fillStyle='#b9c1bf';for(const [bx,by] of [[-24,-99],[20,-99],[-24,-17],[20,-17]]){g.beginPath();g.arc(bx,by,2.2,0,6.3);g.fill()}
    if(!p.on){g.strokeStyle='#77d9ee88';g.lineWidth=3;g.beginPath();g.arc(0,-70,38+Math.sin(t)*4,-2.4,.7);g.stroke()}
    g.restore()
  }
  function drawDesertTerrain(){drawActiveTerrain()}
  function drawModule(m){g.save();g.translate(m.x,m.y);switch(m.type){
    case'skyline':
      g.fillStyle='#102226';for(let x=0;x<m.w;x+=68){const h=55+((x*17)%130);g.fillRect(x,m.h-h,52,h);g.fillStyle='#c16a3744';for(let yy=m.h-h+18;yy<m.h-12;yy+=28)g.fillRect(x+12,yy,7,5);g.fillStyle='#102226'}
      g.strokeStyle='#233f42';g.lineWidth=9;g.beginPath();g.moveTo(62,m.h-105);g.lineTo(62,22);g.lineTo(86,22);g.lineTo(86,m.h-105);g.stroke();break;
    case'wall':
      if(currentStageTheme==='沙漠'&&atlasReady(desertYardangArchitectureAtlas)){
        const tileW=500,start=Math.max(0,Math.floor((cameraX-m.x-24)/tileW)*tileW),end=Math.min(m.w,cameraX-m.x+W+24);
        for(let x=start,i=Math.floor(start/tileW);x<end;x+=tileW,i++)drawDesertAtlasCell(desertYardangArchitectureAtlas,i&1,0,x,0,tileW,m.h)
      }else if(currentStageTheme==='街区'&&(window.TieJieAssets?.imageReady?.(oldAlleyHouseWallWindows)||oldAlleyHouseWallWindows?.complete&&oldAlleyHouseWallWindows.naturalWidth)&&(window.TieJieAssets?.imageReady?.(oldAlleyHouseWallBalcony)||oldAlleyHouseWallBalcony?.complete&&oldAlleyHouseWallBalcony.naturalWidth)){
        const tileW=500,start=Math.max(0,Math.floor((cameraX-m.x-24)/tileW)*tileW),end=Math.min(m.w,cameraX-m.x+W+24);
        for(let x=start;x<end;x+=tileW)g.drawImage(oldAlleyHouseWallWindows,x,0,tileW,m.h)
      }else if(currentStageTheme==='高楼'&&atlasReady(skyShelterBoundariesAtlas)){
        drawSkyShelterOuterBoundary(0,m.w,m.h,m.x)
      }else if(currentStageTheme==='水中避难所'&&atlasReady(waterShelterStructureAtlas)){
        const tileW=430,start=Math.max(0,Math.floor((cameraX-m.x-24)/tileW)*tileW),end=Math.min(m.w,cameraX-m.x+W+24);
        for(let x=start,i=Math.floor(start/tileW);x<end;x+=tileW,i++)drawWaterShelterAtlasCell(waterShelterStructureAtlas,i&1,0,x,0,tileW,m.h)
      }else{
        g.fillStyle=palette.wall;g.fillRect(0,0,m.w,m.h);for(let y=0;y<m.h;y+=78)for(let x=(y/78)%2? -62:0;x<m.w;x+=126){g.fillStyle=((x+y)/20)%3<1?palette.wall2:palette.wall;g.fillRect(x+2,y+2,122,74);g.strokeStyle='#171d1f';g.lineWidth=3;g.strokeRect(x+2,y+2,122,74);g.fillStyle='#151b1c88';g.fillRect(x+10,y+64,70,5)}
      }break;
    case'fence':
      g.fillStyle='#172326cc';g.fillRect(0,0,m.w,m.h);g.strokeStyle=palette.steel;g.lineWidth=4;g.strokeRect(0,0,m.w,m.h);g.lineWidth=1.5;for(let x=-m.h;x<m.w;x+=25){g.beginPath();g.moveTo(x,0);g.lineTo(x+m.h,m.h);g.stroke();g.beginPath();g.moveTo(x+m.h,0);g.lineTo(x,m.h);g.stroke()}for(let x=0;x<=m.w;x+=100){g.lineWidth=6;g.beginPath();g.moveTo(x,-12);g.lineTo(x,m.h+8);g.stroke()}break;
    case'pipes':
      for(let i=0;i<3;i++){g.strokeStyle=palette.ink;g.lineWidth=18;g.beginPath();g.moveTo(20+i*36,0);g.lineTo(20+i*36,m.h-55);g.quadraticCurveTo(20+i*36,m.h-15,58+i*20,m.h-15);g.stroke();g.strokeStyle=i===1?palette.rust:palette.steel;g.lineWidth=10;g.stroke();for(let y=45;y<m.h-40;y+=72){g.fillStyle=palette.ink;g.fillRect(11+i*36,y,18,10);g.fillStyle=palette.rust;g.fillRect(14+i*36,y+2,12,6)}}break;
    case'market':
      g.fillStyle='#111719';g.fillRect(-8,-20,m.w+16,m.h+24);g.fillStyle='#30464a';g.fillRect(0,0,m.w,m.h);g.fillStyle='#6f2e2e';g.fillRect(0,0,m.w,36);g.fillStyle='#d28a43';for(let x=18;x<m.w-24;x+=68)g.fillRect(x,54,44,34);g.fillStyle='#182326';g.fillRect(24,112,126,78);g.fillRect(205,100,112,90);g.strokeStyle='#597073';g.lineWidth=5;for(let y=50;y<m.h;y+=48){g.beginPath();g.moveTo(0,y);g.lineTo(m.w,y-10);g.stroke()}break;
    case'elevator':
      g.fillStyle='#151b1c';g.fillRect(-8,-20,m.w+16,m.h+20);g.fillStyle='#3d4444';g.fillRect(0,0,m.w,m.h);g.strokeStyle=palette.ink;g.lineWidth=8;g.strokeRect(0,0,m.w,m.h);g.beginPath();g.moveTo(m.w/2,0);g.lineTo(m.w/2,m.h);g.stroke();g.fillStyle=palette.rust;for(let x=12;x<m.w-12;x+=38){g.save();g.translate(x,m.h-20);g.rotate(-.7);g.fillRect(0,0,22,8);g.restore()}g.fillStyle='#1a2223';g.fillRect(m.w+12,55,22,54);g.fillStyle='#d26b37';g.fillRect(m.w+18,63,10,10);g.fillStyle='#719178';g.fillRect(m.w+18,84,10,10);break;
    case'stairs':
      {const topW=m.topW||m.w*.62,bottomW=m.bottomW||m.w,c=m.w*.5,topL=c-topW*.5,topR=c+topW*.5,botL=c-bottomW*.5,botR=c+bottomW*.5;
      g.fillStyle='#111719';g.beginPath();g.moveTo(topL-14,-10);g.lineTo(topR+14,-10);g.lineTo(botR+18,m.h+14);g.lineTo(botL-18,m.h+14);g.closePath();g.fill();
      g.fillStyle='#444d4f';g.beginPath();g.moveTo(topL,0);g.lineTo(topR,0);g.lineTo(botR,m.h);g.lineTo(botL,m.h);g.closePath();g.fill();
      for(let i=0;i<13;i++){const y=i*m.h/12,t=i/12,w=topW+(bottomW-topW)*t,l=c-w*.5+10,r=c+w*.5-10,shade=i%2?'#687173':'#566063';g.fillStyle=shade;g.beginPath();g.moveTo(l,y+4);g.lineTo(r,y+4);g.lineTo(r+4,y+m.h/12-3);g.lineTo(l-4,y+m.h/12-3);g.closePath();g.fill();g.strokeStyle=palette.ink;g.lineWidth=4;g.beginPath();g.moveTo(l,y+4);g.lineTo(r,y+4);g.stroke()}
      g.strokeStyle=palette.rust;g.lineWidth=8;g.beginPath();g.moveTo(topL+8,0);g.lineTo(botL+12,m.h);g.moveTo(topR-8,0);g.lineTo(botR-12,m.h);g.stroke();break}
    case'platform':
      g.fillStyle=palette.ink;g.beginPath();g.moveTo(52,-7);g.lineTo(m.w-72,-7);g.lineTo(m.w+20,m.h+16);g.lineTo(-28,m.h+16);g.closePath();g.fill();g.fillStyle='#626869';g.beginPath();g.moveTo(76,0);g.lineTo(m.w-92,0);g.lineTo(m.w,m.h);g.lineTo(0,m.h);g.closePath();g.fill();g.save();g.beginPath();g.moveTo(76,0);g.lineTo(m.w-92,0);g.lineTo(m.w,m.h);g.lineTo(0,m.h);g.closePath();g.clip();for(let x=-20;x<m.w;x+=86){g.fillStyle=x%172?'#4c5556':'#707676';g.fillRect(x+3,6,78,m.h-14);g.strokeStyle='#252b2c';g.strokeRect(x+3,6,78,m.h-14);g.strokeStyle='#293234';g.beginPath();g.moveTo(x+14,8);g.lineTo(x-32,m.h-10);g.stroke()}g.restore();g.strokeStyle=palette.rust;g.lineWidth=6;g.beginPath();g.moveTo(44,-58);g.lineTo(m.w-68,-58);g.stroke();for(let x=40;x<=m.w-70;x+=115){g.beginPath();g.moveTo(x,-62);g.lineTo(x,0);g.stroke()}break;
    case'mud':
      {if(currentStageTheme==='沙漠'&&atlasReady(desertYardangTerrainAtlas)){drawTiledDesertAtlasCell(desertYardangTerrainAtlas,0,0,0,0,m.w,m.h,420,320,1);break}
      if(currentStageTheme==='水中避难所'&&atlasReady(waterShelterSurfaceAtlas)){drawTiledWaterShelterAtlasCell(waterShelterSurfaceAtlas,0,0,0,0,m.w,m.h,340,270,1);break}
      const ground=currentStageTheme==='街区'?oldAlleyStreetGround:currentStageTheme==='高楼'?skyShelterRooftopGround:null;
      if(ground&&(window.TieJieAssets?.imageReady?.(ground)||ground.complete&&ground.naturalWidth)){
        const tileW=340,tileH=270,start=Math.max(0,Math.floor((cameraX-m.x-8)/tileW)*tileW),end=Math.min(m.w,cameraX-m.x+W+8);
        for(let y=0;y<m.h;y+=tileH)for(let x=start;x<end;x+=tileW)g.drawImage(ground,x,y,tileW,tileH)
      }else{
        g.fillStyle=palette.mud;g.fillRect(0,0,m.w,m.h);for(let y=8;y<m.h;y+=42)for(let x=(y*3)%75-40;x<m.w;x+=88){g.fillStyle=((x+y)%5)?palette.mud2:'#354347';g.beginPath();g.ellipse(x,y,34+(x%17),8,0,0,6.3);g.fill()}g.strokeStyle='#231e1a';g.lineWidth=4;for(let x=0;x<m.w;x+=135){g.beginPath();g.moveTo(x,0);g.lineTo(x-30,m.h);g.stroke()}g.fillStyle='#182a2caa';g.beginPath();g.ellipse(570,105,125,18,-.04,0,6.3);g.ellipse(1050,58,85,12,.04,0,6.3);g.fill();g.strokeStyle='#577274';g.lineWidth=2;g.stroke()
      }break}
    if(materialAtlas.complete&&materialAtlas.naturalWidth){let panel=-1,alpha=.2;if(m.type==='mud'){panel=0;alpha=.34}else if(m.type==='wall'){panel=1;alpha=.2}else if(m.type==='platform'||m.type==='elevator'){panel=2;alpha=.28}if(panel>=0){const nativeDouyin=!!window.TieJieAssets?.runtimeUsesLocalPaths;g.globalAlpha=nativeDouyin?alpha*.35:alpha;g.globalCompositeOperation=nativeDouyin?'source-over':'soft-light';g.drawImage(materialAtlas,panel*256,0,256,256,0,0,m.w,m.h);g.globalCompositeOperation='source-over';g.globalAlpha=1}}
  }g.restore()}
  function lamp(x,y){
    g.save();const cone=g.createLinearGradient(0,y+8,0,y+150);cone.addColorStop(0,'#ffd27a4f');cone.addColorStop(.55,'#e6a54a1d');cone.addColorStop(1,'#e6a54a00');g.fillStyle=cone;g.beginPath();g.moveTo(x-11,y+12);g.lineTo(x-90,y+150);g.lineTo(x+90,y+150);g.lineTo(x+11,y+12);g.closePath();g.fill();
    const halo=g.createRadialGradient(x,y+2,2,x,y+2,42);halo.addColorStop(0,'#fff2b7aa');halo.addColorStop(.36,'#efb65455');halo.addColorStop(1,'#efb65400');g.fillStyle=halo;g.beginPath();g.arc(x,y+2,42,0,6.3);g.fill();
    g.fillStyle='#090d0f';g.fillRect(x-21,y-25,42,8);g.fillRect(x-18,y-18,36,53);g.fillStyle='#465054';g.fillRect(x-17,y-16,30,47);g.fillStyle='#7b8586';g.fillRect(x-14,y-13,4,39);g.fillStyle='#1a2224';g.fillRect(x+13,y-16,5,47);
    g.fillStyle='#e9b85d';g.fillRect(x-9,y-10,18,28);g.fillStyle='#fff0a8';g.fillRect(x-6,y-7,7,19);g.strokeStyle='#20292b';g.lineWidth=3;for(let bx=x-12;bx<=x+12;bx+=8){g.beginPath();g.moveTo(bx,y-13);g.lineTo(bx,y+24);g.stroke()}g.strokeRect(x-14,y-13,28,39);
    g.fillStyle='#111719';g.fillRect(x-20,y+29,40,7);g.fillStyle='#929b9a';for(const bx of [x-13,x+13]){g.beginPath();g.arc(bx,y-21,2.2,0,6.3);g.fill()}g.restore()
  }
  function crate(x,y,w,h){
    const d=clamp(Math.round(w*.12),7,13);g.save();g.fillStyle='#03050666';g.beginPath();g.ellipse(x+w*.52+d*.25,y+h+7,w*.58,8,0,0,6.3);g.fill();
    g.fillStyle='#160f0b';g.beginPath();g.moveTo(x-4,y-3);g.lineTo(x+d-1,y-d-6);g.lineTo(x+w+d+5,y-d-6);g.lineTo(x+w+d+5,y+h+2);g.lineTo(x+w+2,y+h+7);g.lineTo(x-4,y+h+4);g.closePath();g.fill();
    const top=g.createLinearGradient(0,y-d,0,y);top.addColorStop(0,'#b27a4b');top.addColorStop(1,'#69432c');g.fillStyle=top;g.beginPath();g.moveTo(x,y);g.lineTo(x+d,y-d);g.lineTo(x+w+d,y-d);g.lineTo(x+w,y);g.closePath();g.fill();
    const side=g.createLinearGradient(x+w,y,x+w+d,y);side.addColorStop(0,'#5a3827');side.addColorStop(1,'#2b1b15');g.fillStyle=side;g.beginPath();g.moveTo(x+w,y);g.lineTo(x+w+d,y-d);g.lineTo(x+w+d,y+h-d);g.lineTo(x+w,y+h);g.closePath();g.fill();
    const front=g.createLinearGradient(x,y,x+w,y+h);front.addColorStop(0,'#95603b');front.addColorStop(.48,'#75482f');front.addColorStop(1,'#42291f');g.fillStyle=front;g.fillRect(x,y,w,h);
    g.strokeStyle='#2b1a13';g.lineWidth=3;g.strokeRect(x+1,y+1,w-2,h-2);g.strokeStyle='#c08754aa';g.lineWidth=2;g.beginPath();g.moveTo(x+5,y+5);g.lineTo(x+w-5,y+5);g.moveTo(x+d+3,y-d+3);g.lineTo(x+w+d-4,y-d+3);g.stroke();
    g.strokeStyle='#3a2419';g.lineWidth=Math.max(7,h*.16);g.beginPath();g.moveTo(x+8,y+7);g.lineTo(x+w-8,y+h-7);g.moveTo(x+w-8,y+7);g.lineTo(x+8,y+h-7);g.stroke();g.strokeStyle='#a66c42';g.lineWidth=Math.max(3,h*.07);g.stroke();
    g.strokeStyle='#3a241988';g.lineWidth=1.5;for(let yy=y+h*.3;yy<y+h-5;yy+=Math.max(11,h*.25)){g.beginPath();g.moveTo(x+7,yy);g.bezierCurveTo(x+w*.28,yy-3,x+w*.65,yy+3,x+w-7,yy);g.stroke()}
    g.fillStyle='#252b2c';for(const [bx,by] of [[x+5,y+5],[x+w-5,y+5],[x+5,y+h-5],[x+w-5,y+h-5]]){g.fillRect(bx-3,by-3,6,6);g.fillStyle='#aeb5b2';g.fillRect(bx-1,by-1,2,2);g.fillStyle='#252b2c'}g.restore()
  }
  function warningSign(x,y){
    g.save();g.fillStyle='#111719';g.fillRect(x+5,y+5,74,42);const face=g.createLinearGradient(x,y,x+74,y+42);face.addColorStop(0,'#e3a04f');face.addColorStop(.48,'#bd692f');face.addColorStop(1,'#71351f');g.fillStyle=face;g.fillRect(x,y,74,42);g.strokeStyle='#271914';g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,71,39);
    g.fillStyle='#1a1d1d';g.beginPath();g.moveTo(x+37,y+6);g.lineTo(x+62,y+34);g.lineTo(x+12,y+34);g.closePath();g.fill();g.strokeStyle='#f4c978';g.lineWidth=2;g.stroke();g.strokeStyle='#f6d28b';g.lineWidth=4;g.beginPath();g.moveTo(x+37,y+14);g.lineTo(x+37,y+25);g.moveTo(x+37,y+30);g.lineTo(x+37,y+31);g.stroke();
    g.fillStyle='#d9dedb';for(const [bx,by] of [[x+6,y+6],[x+68,y+6],[x+6,y+36],[x+68,y+36]]){g.beginPath();g.arc(bx,by,2,0,6.3);g.fill()}g.fillStyle='#211713';for(let bx=x+2;bx<x+72;bx+=14){g.beginPath();g.moveTo(bx,y+38);g.lineTo(bx+7,y+38);g.lineTo(bx+12,y+42);g.lineTo(bx+5,y+42);g.closePath();g.fill()}g.restore()
  }
  const FIGHTER_SHADOW_SCALE_X=1.18,FIGHTER_SHADOW_SCALE_Y=1.12;
  function expandFighterShadow(){g.scale(FIGHTER_SHADOW_SCALE_X,FIGHTER_SHADOW_SCALE_Y)}
  function drawGroundShadow(w,h=8,y=1,color='#03050699'){w*=1.16;h*=1.12;g.fillStyle=color;g.beginPath();g.ellipse(0,y,w,h*.5,0,0,Math.PI*2);g.fill()}
  function enemyHasSuperArmor(a){return !!(a&&!a.companion&&!a.dead&&a.hp>0&&((a.eliteArmorT||0)>0||(a.type==='axe'&&axeArmorStates.has(a.state))||(a.type==='heavy'&&['slamCharge','slamAir'].includes(a.state))))}
  const superArmorOutlineCache=new WeakMap(),SUPER_ARMOR_OUTLINE_PAD=4;
  function enemySpriteFilter(a,base='none'){
    // Canvas filters are particularly costly in the Douyin native canvas and
    // cause thermal throttling in long sessions. Super armor uses a cached
    // outline bitmap, so this function only keeps essential sprite grading.
    return base&&base!=='none'&&(!nativeDouyinRuntime||a?.elite)?base:'none'
  }
  function createSuperArmorCanvas(width,height){let target=null;try{target=window.TieJieCreateCanvas?.()||document.createElement('canvas')}catch{}if(!target?.getContext)return null;target.width=Math.max(1,Math.ceil(width));target.height=Math.max(1,Math.ceil(height));return target}
  function superArmorOutlineFrame(sheet,sx,sy,sw,sh){
    if(!sheet||sw<=0||sh<=0)return null;
    let frames=superArmorOutlineCache.get(sheet);if(!frames){frames=new Map();superArmorOutlineCache.set(sheet,frames)}
    const key=`${sx}:${sy}:${sw}:${sh}`;if(frames.has(key))return frames.get(key);
    const pad=SUPER_ARMOR_OUTLINE_PAD,target=createSuperArmorCanvas(sw+pad*2,sh+pad*2);if(!target){frames.set(key,null);return null}
    const ctx=target.getContext('2d');if(!ctx){frames.set(key,null);return null}
    const offsets=[[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]];
    ctx.clearRect(0,0,target.width,target.height);ctx.globalCompositeOperation='source-over';ctx.filter='none';
    for(const [ox,oy] of offsets)ctx.drawImage(sheet,sx,sy,sw,sh,pad+ox,pad+oy,sw,sh);
    ctx.globalCompositeOperation='source-in';ctx.fillStyle='#f6c945';ctx.fillRect(0,0,target.width,target.height);
    ctx.globalCompositeOperation='destination-out';ctx.drawImage(sheet,sx,sy,sw,sh,pad,pad,sw,sh);ctx.globalCompositeOperation='source-over';
    const outline={canvas:target,pad};frames.set(key,outline);return outline
  }
  function drawEnemySpriteFrame(a,sheet,sx,sy,sw,sh,dx,dy,dw,dh,base='none'){
    if(enemyHasSuperArmor(a)){const outline=superArmorOutlineFrame(sheet,sx,sy,sw,sh);if(outline){const px=outline.pad*dw/sw,py=outline.pad*dh/sh;g.save();g.filter='none';g.globalAlpha*=.92;g.drawImage(outline.canvas,0,0,outline.canvas.width,outline.canvas.height,dx-px,dy-py,dw+px*2,dh+py*2);g.restore()}}
    g.filter=enemySpriteFilter(a,base);g.drawImage(sheet,sx,sy,sw,sh,dx,dy,dw,dh);g.filter='none'
  }
  const visibleActors=[];
  const actorDepth=a=>a.level*1000+a.y+(a.grabbed&&player.grab===a?10:0);
  function drawForestTree(o){
    if(o.x+280<cameraX||o.x-280>cameraX+W)return;
    const rootReady=window.TieJieAssets?.imageReady?.(forestTreeRootSprite)||forestTreeRootSprite?.complete&&forestTreeRootSprite.naturalWidth,s=o.scale||1,full=370*s,factor=full/384,cropX=0,cropY=0,w=384*factor,h=340*factor;
    g.save();g.translate(o.x,o.y+14);g.scale(o.flip||1,1);
    if(rootReady)g.drawImage(forestTreeRootSprite,-full*.5+cropX*factor,-full+cropY*factor,w,h);
    g.restore()
  }
  function swampSinkPixels(a){return Math.min(220,(a.swampDepth||0)*220)}
  function swampSurfaceY(a){return a.y-(a.z||0)+2}
  function actorInFloodWater(a){return currentStageTheme==='水中避难所'&&(a.level??0)<0&&(a.z||0)<=18&&!a.airLaunch&&a.state!=='spinAir'}
  function floodSurfaceY(a){return a.y-(a.z||0)-42}
  function drawSwampClippedFighter(a,isPlayer){
    if(actorInFloodWater(a)){
      const surface=floodSurfaceY(a);g.save();g.beginPath();g.rect(cameraX-300,cameraY-600,W+600,surface-(cameraY-600));g.clip();drawFighter(a,isPlayer);g.restore();return
    }
    const sink=swampSinkPixels(a);if(sink<1){drawFighter(a,isPlayer);return}
    const surface=swampSurfaceY(a);g.save();g.beginPath();g.rect(cameraX-300,cameraY-600,W+600,surface-(cameraY-600));g.clip();g.translate(0,sink);drawFighter(a,isPlayer);g.restore()
  }
  function drawSwampActorSurfaces(){
    const now=performance.now()*.0018;for(const a of[player,...companions,...enemies]){
      if(actorInFloodWater(a)){const y=floodSurfaceY(a),pulse=(Math.sin(now+a.x*.013)+1)*.5,w=42+(a.state==='run'?8:0);g.save();g.fillStyle='#4f939a42';g.beginPath();g.ellipse(a.x,y+5,w,11,0,0,6.3);g.fill();g.strokeStyle='#b7dddd99';g.lineWidth=1.6;g.beginPath();g.ellipse(a.x,y,w+pulse*5,6+pulse*1.5,0,0,6.3);g.stroke();g.strokeStyle='#5b9da488';g.beginPath();g.ellipse(a.x+4,y+3,w*.68,3.4,0,0,6.3);g.stroke();g.restore();continue}
      const depth=a.swampDepth||0;if(depth<=.01||!actorSlowZone(a))continue;const y=swampSurfaceY(a),pulse=(Math.sin(now+a.x*.013)+1)*.5,w=40+depth*22;
      g.save();g.strokeStyle=`rgba(111,126,112,${.18+depth*.12})`;g.lineWidth=1.15;g.beginPath();g.ellipse(a.x,y,w+pulse*3,5.5+depth*2,0,0,6.3);g.stroke();
      g.strokeStyle=`rgba(38,51,42,${.14+depth*.1})`;g.lineWidth=.9;g.beginPath();g.ellipse(a.x+3,y+1,w*.68+pulse*2,3.2+depth,0,0,6.3);g.stroke();g.restore()
    }
  }
  function render(){updateCamera();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.filter='none';g.shadowColor='transparent';g.shadowBlur=0;g.save();g.translate(-cameraX+(Math.random()-.5)*shake,-cameraY+(Math.random()-.5)*shake);g.save();drawScene();g.restore();
    drawBunkerRoomFog();drawPowerSwitch();for(const p of pickups)if(p.active)drawPickup(p);
    visibleActors.length=0;for(const o of currentBlockers())if(o.forestProp&&o.x+280>=cameraX&&o.x-280<=cameraX+W)visibleActors.push(o);for(const e of enemies)if((!e.dead||e.timer>0)&&(player.level<0?e.level<0&&e.subPit?.bunker===player.subPit?.bunker:e.level>=0)&&(!e.bunkerRoom||e.bunkerRoom.opened))visibleActors.push(e);for(const c of companions)if((!c.dead||c.timer>0)&&(player.level<0?c.level<0:c.level>=0))visibleActors.push(c);visibleActors.push(player);visibleActors.sort((a,b)=>actorDepth(a)-actorDepth(b));for(const a of visibleActors)if(a.forestProp)drawForestTree(a);else drawSwampClippedFighter(a,a===player);
    drawSwampActorSurfaces();drawForestHives();for(const p of projectiles)drawProjectile(p);drawUpperLayerMist();drawBlackoutOverlay();
    effects();drawEliteArmorEffects();g.restore();g.beginPath();if(!document.body.classList.contains('menu-mode'))hud()}
  function drawFighter(a,isP){
    const x=a.x,y=a.y-a.z,face=a.face||1,state=a.state,phase=performance.now()/105;
    const imageReady=window.TieJieAssets?.imageReady||((image)=>!!(image?.complete&&(image.naturalWidth||image.width)));
    if(isP&&imageReady(heroKickSheet)){drawHeroSprite(a,x,y,face,state,phase);return}
    if(!isP){drawEnemySprite(a,x,y,face,state,phase);return}
    return
  }
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  function drawPitClimbOutSprite(a,x,y,face){
    const c=a.climb,progress=c?clamp(c.t/c.dur,0,.9999):0;
    const frames=[1,2,3,3,2,1],i=Math.min(5,Math.floor(progress*6)),frame=frames[i];
    const sw=heroClimbOutSheet.naturalWidth/6,sh=heroClimbOutSheet.naturalHeight,scale=.37*enemyFrameScale('heroKick3',frame,1),[offsetX,offsetY]=enemyFrameOffset('heroKick3',frame),dw=sw*scale,dh=sh*scale;
    const leftAnchors=[[176,610],[184,609],[136,611]],rightAnchors=[[392,350],[330,430],[300,505]];
    const onLeftFoot=i<3,anchor=onLeftFoot?leftAnchors[i]:rightAnchors[i-3];
    const stageX=onLeftFoot?x:x+face*98,stageY=onLeftFoot?y+12:y-84,bodyPush=onLeftFoot?[0,3,5][i]:[0,2,3][i-3];
    g.save();
    g.translate(stageX,stageY);
    g.scale(face*(enemyFrameFlip('heroKick3',frame)?-1:1),1);
    g.translate(offsetX,offsetY);
    g.filter='none';g.fillStyle='#6c5742';g.beginPath();g.ellipse(0,1,26,8,0,0,6.3);g.fill();
    g.strokeStyle='#c2a06faa';g.lineWidth=3;g.beginPath();g.moveTo(-24,-6);g.lineTo(24,4);g.moveTo(-7,-12);g.lineTo(15,9);g.stroke();
    g.drawImage(heroClimbOutSheet,frame*sw,0,sw,sh,-anchor[0]*scale+bodyPush,-anchor[1]*scale,dw,dh);
    g.restore();
  }
  function drawHeroSprite(a,x,y,face,state,phase){
    if(state==='run'){if(heroWalkSheet.complete&&heroWalkSheet.naturalWidth){drawWalkSprite(a,x,y,face,phase,true);return}drawMovementSprite(a,x,y,face,state,phase,false);return}
    if(state==='climb'&&heroWalkSheet.complete&&heroWalkSheet.naturalWidth){drawWalkSprite(a,x,y,face,phase,false);return}
    if(state==='climbOut'&&heroClimbOutSheet.complete&&heroClimbOutSheet.naturalWidth){drawPitClimbOutSprite(a,x,y,face);return}
    const groundFix=0;
    g.save();g.translate(x,y+groundFix);g.scale(face,1);
    const paintShadow=(sheet,count,frame,scale,alpha=1,tx=0,sx=1)=>{const shadow=fighterShadowMap.get(sheet);if(!shadow?.complete||!shadow.naturalWidth)return;scale=characterFrameScale(sheet,frame);const [offsetX,offsetY]=characterFrameOffset(sheet,frame),sw=shadow.naturalWidth/count,sh=shadow.naturalHeight,dw=sw*scale,dh=sh*scale,flip=enemyFrameFlip(characterFrameScaleKeys.get(sheet),frame)?-1:1;g.save();g.globalAlpha=alpha;g.filter='none';g.translate(tx+offsetX,a.z-groundFix+offsetY);g.scale(sx*flip,1);expandFighterShadow();g.drawImage(shadow,frame*sw,0,sw,sh,-dw*.5,-dh+40*scale,dw,dh);g.restore()};
    const paint=(sheet,frame,scale,alpha=1,tx=0,ty=0,rot=0,sx=1,filter='none')=>{scale=characterFrameScale(sheet,frame);const [offsetX,offsetY]=characterFrameOffset(sheet,frame),sw=sheet.naturalWidth/3,sh=sheet.naturalHeight,dw=sw*scale,dh=sh*scale,flip=enemyFrameFlip(characterFrameScaleKeys.get(sheet),frame)?-1:1;paintShadow(sheet,3,frame,scale,alpha,tx,sx);g.save();g.globalAlpha=alpha;g.filter=filter;g.translate(tx+offsetX,ty+offsetY);g.rotate(rot);g.scale(sx*flip,1);g.drawImage(sheet,frame*sw,0,sw,sh,-dw*.5,-dh+40*scale,dw,dh);g.restore()};
    const paintN=(sheet,count,frame,scale,tx=0,ty=0,sx=1,filter='none',rot=0)=>{scale=characterFrameScale(sheet,frame);const [offsetX,offsetY]=characterFrameOffset(sheet,frame),sw=sheet.naturalWidth/count,sh=sheet.naturalHeight,dw=sw*scale,dh=sh*scale,flip=enemyFrameFlip(characterFrameScaleKeys.get(sheet),frame)?-1:1;paintShadow(sheet,count,frame,scale,1,tx,sx);g.save();g.filter=filter;g.translate(tx+offsetX,ty+offsetY);g.rotate(rot);g.scale(sx*flip,1);g.drawImage(sheet,frame*sw,0,sw,sh,-dw*.5,-dh+40*scale,dw,dh);g.restore()};
    const paintBlueFistFlame=(frame,tx=0,ty=0)=>{if(!heroBlueFistFlameSheet?.complete||!heroBlueFistFlameSheet.naturalWidth)return;const opacity=clamp((playerAttackSpeedMul()-1)/(2-1),0,1);if(opacity<=0)return;const [anchorX,anchorY]=BLUE_FIST_FLAME_ANCHORS[frame],heroScale=characterFrameScale(heroPunchComboSheet,frame),[offsetX,offsetY]=characterFrameOffset(heroPunchComboSheet,frame),flip=enemyFrameFlip('heroPunch',frame)?-1:1,now=performance.now(),flameFrame=(Math.floor(now/72)+frame)%6,sw=heroBlueFistFlameSheet.naturalWidth/6,sh=heroBlueFistFlameSheet.naturalHeight,jump=Math.sin(now*.021+frame*1.7)*2.4,frameScale=[1.06,.76,1.12,.74,.94,1.28][frame],pulse=frameScale*(.96+Math.sin(now*.028+frame)*.05),dw=60*pulse,dh=75*pulse,x=tx+offsetX+flip*(anchorX-192)*heroScale,y=ty+offsetY+(anchorY-344)*heroScale+jump;
      g.save();g.translate(x,y);g.scale(flip,1);g.rotate(BLUE_FIST_FLAME_ROTATIONS[frame]);g.globalCompositeOperation='screen';g.shadowColor='#24a9ff';g.shadowBlur=12;
      if(frame===0||frame===2||frame===5){g.globalAlpha=opacity*.26;g.drawImage(heroBlueFistFlameSheet,flameFrame*sw,0,sw,sh,-dw*.2-12,-dh*.82+3,dw,dh)}
      g.globalAlpha=opacity;g.drawImage(heroBlueFistFlameSheet,flameFrame*sw,0,sw,sh,-dw*.2,-dh*.82,dw,dh);g.restore()
    };
    const paintLegFlame=(sheet,count,frame,anchors,tx=0,ty=0,frameFlow=null)=>{if(!hasSkill('legFlame')||!heroBlueFistFlameSheet?.complete||!heroBlueFistFlameSheet.naturalWidth)return;const [anchorX,anchorY,rotation=0,size=1]=anchors[frame]||anchors[anchors.length-1],prevFrame=frameFlow?.prev??Math.max(0,frame-1),nextFrame=frameFlow?.next??Math.min(anchors.length-1,frame+1),motionAnchors=frameFlow?.motionAnchors||anchors,prev=motionAnchors[prevFrame]||motionAnchors[frame]||motionAnchors[motionAnchors.length-1],next=motionAnchors[nextFrame]||motionAnchors[frame]||motionAnchors[motionAnchors.length-1],scale=characterFrameScale(sheet,frame),[offsetX,offsetY]=characterFrameOffset(sheet,frame),flip=enemyFrameFlip(characterFrameScaleKeys.get(sheet),frame)?-1:1,now=performance.now(),flameFrame=(Math.floor(now/64)+frame)%6,sw=heroBlueFistFlameSheet.naturalWidth/6,sh=heroBlueFistFlameSheet.naturalHeight,pulse=size*(.96+Math.sin(now*.03+frame)*.06),motionX=((next[0]??anchorX)-(prev[0]??anchorX))*flip,motionY=(next[1]??anchorY)-(prev[1]??anchorY),dynamicRotation=frameFlow?.rotation??(Math.abs(motionX)+Math.abs(motionY)>4?Math.atan2(motionY,motionX)-LEG_FLAME_SOURCE_HEAD_ANGLE:rotation),dw=90*pulse,dh=113*pulse,x=tx+offsetX+flip*(anchorX-192)*scale,y=ty+offsetY+(anchorY-344)*scale;
      g.save();g.translate(x,y);g.scale(flip,1);g.rotate(dynamicRotation);g.globalCompositeOperation='screen';g.globalAlpha=.95;g.shadowColor='#24a9ff';g.shadowBlur=15;g.drawImage(heroBlueFistFlameSheet,flameFrame*sw,0,sw,sh,-dw*.18,-dh*.82,dw,dh);g.restore()
    };
    const seq=(frames,p)=>{const i=Math.min(frames.length-1,Math.floor(clamp(p,0,.9999)*frames.length));paint(heroKickSheet,frames[i],.243)};
    if(state.startsWith('punch')&&heroPunchComboSheet.complete){
      const durations={punch1:.28,punch2:.31,punch3:.43},sequences={punch1:[0,0,1],punch2:[1,2,2,3],punch3:[3,4,5,5]},p=clamp(1-a.timer/durations[state],0,.9999),frames=sequences[state],frame=frames[Math.min(frames.length-1,Math.floor(p*frames.length))],tx=Math.sin(p*Math.PI)*7,ty=-Math.sin(p*Math.PI)*2;
      paintN(heroPunchComboSheet,6,frame,.34,tx,ty,1,'none');if(hasSkill('blueFlame'))paintBlueFistFlame(frame,tx,ty);
    }else if(state==='risingPunch'&&heroRisingPunchSheet.complete){
      const p=clamp(1-a.timer/.56,0,.9999),frame=Math.min(3,Math.floor(p*4)),flameFrame=Math.min(3,Math.floor(p*4));
      paintN(heroRisingPunchSheet,4,frame,1,5,-p*8,1,'none');
      g.save();g.translate(0,a.z||0);g.globalCompositeOperation='screen';g.globalAlpha=.72+p*.24;g.shadowColor='#ff6a18';g.shadowBlur=8;
      if(heroRisingFlameSheet.complete&&heroRisingFlameSheet.naturalWidth){
        const sw=heroRisingFlameSheet.naturalWidth/4,sh=heroRisingFlameSheet.naturalHeight;
        g.drawImage(heroRisingFlameSheet,flameFrame*sw,0,sw,sh,-sw*.5,-sh+40,sw,sh);
      }else{
        g.strokeStyle='#ff8a28';g.lineWidth=12+flameFrame*4;g.lineCap='round';g.beginPath();g.moveTo(-34,-2);g.bezierCurveTo(4,-46,-38,-118,18,-178-flameFrame*18);g.stroke();
      }
      g.restore();
    }else if(state==='hurt'&&heroHurtSheet.complete){
      const p=clamp(1-a.timer/.44,0,.9999),frame=Math.min(4,Math.floor(p*5));paintN(heroHurtSheet,5,frame,.34,0,0,1,'none');
    }else if(state==='enemyGrabbed'&&heroHurtSheet.complete){
      paintN(heroHurtSheet,5,3,.34,0,0,1,'none');
    }else if(state==='grappleThrown'&&heroHurtSheet.complete){
      const dir=Math.sign(a.throwVx||face)||1;paintN(heroHurtSheet,5,3,.34,-dir*5,-8,1,'none',dir*.62);
    }else if(state==='grappleSlide'&&enemyKnockdownSheet.complete){
      paintN(enemyKnockdownSheet,5,4,.44,-face*12,8,-1,'none');
    }else if(state==='down'&&a.z>0&&heroHurtSheet.complete){
      const frame=a.vz>0?2:3;paintN(heroHurtSheet,5,frame,.34,0,0,1,'none');
    }else if((state==='down'||a.hp<=0)&&enemyKnockdownSheet.complete){
      const downDuration=a.hp<=0?2:.9,p=clamp(1-a.timer/downDuration,0,.9999),frames=[2,3,4],frame=frames[Math.min(2,Math.floor(p*frames.length))];
      paintN(enemyKnockdownSheet,5,frame,.44,-face*10,8, -1,'none');
    }else if(state==='getUp'&&heroJumpTransitionSheet.complete){
      const p=clamp(1-a.timer/.55,0,.9999),frame=p<.5?0:1;paintN(heroJumpTransitionSheet,2,frame,.25,0,0,1,'none');
    }else if(state==='pickup'&&heroJumpTransitionSheet.complete){
      const p=clamp(1-a.timer/.48,0,.9999),frames=[1,0,0,1],frame=frames[Math.min(3,Math.floor(p*4))];
      paintN(heroJumpTransitionSheet,2,frame,.25,0,0,1,'none');
    }else if(state==='throwItem'&&heroBackThrowFrames.every(sprite=>sprite.complete)){
      const p=clamp(1-a.timer/.32,0,.9999),frames=[2,3],frame=frames[Math.min(1,Math.floor(p*2))],scale=174/767,frameX=[0,2],frameY=[24,32];
      paintN(heroBackThrowFrames[frame],1,0,scale,frameX[frame-2],frameY[frame-2],-1,'none');
    }else if(state==='throw'&&heroBackThrowFrames.every(sprite=>sprite.complete)){
      const p=clamp(1-a.timer/.32,0,.9999),frame=Math.min(3,Math.floor(p*4)),scale=174/767,frameX=[-3,7,0,-2],frameY=[15,18,24,32];
      paintN(heroBackThrowFrames[frame],1,0,scale,frameX[frame],frameY[frame],1,'none');
    }else if(state==='overChestThrow'&&heroOverChestThrowSheet.complete){
      const held=a.grab,p=held?clamp((performance.now()-(held.overChestThrowStart||performance.now()))/(held.overChestDuration||OVER_CHEST_THROW_MS),0,.9999):clamp(1-a.timer/OVER_CHEST_THROW_DURATION,0,.9999),frame=overChestHeroFrame(p);paintN(heroOverChestThrowSheet,4,frame,.273,0,0,1,'none');
    }else if((state==='doorPush'||state==='grabAttempt'||state==='grabRelease'||state==='starAbsorbPull'||state==='grab'||state==='drag')&&heroGrabSheet.complete){
      let frame=2;if(state==='doorPush'){const p=clamp(1-a.timer/.42,0,.9999);frame=Math.min(2,Math.floor(p*3))}else if(state==='grabAttempt'){const p=clamp(1-a.timer/.48,0,.9999);frame=Math.min(2,Math.floor(p*3))}else if(state==='grabRelease'){const p=clamp(1-a.timer/.28,0,.9999);frame=Math.max(0,2-Math.floor(p*3))}paintN(heroGrabSheet,3,frame,.273,0,0,1,'none');
    }else if(state==='grabKnee'&&heroGrabKneeSheet.complete){
      const p=clamp(1-a.timer/.56,0,.9999),frames=[0,1,2,2,1,0],frame=frames[Math.min(frames.length-1,Math.floor(p*frames.length))];paintN(heroGrabKneeSheet,3,frame,.273,0,0,1,'none');
    }else if(state==='kick1'&&heroKick1Sheet.complete){
      const p=clamp(1-a.timer/.45,0,.9999),frame=Math.min(3,Math.floor(p*4)),frameY=[-1,0,0,0],anchors=[[230,320,-1.9,.7],[230,287,-1.7,.82],[271,231,-1.52,1.18],[230,288,-1.7,.82]];paintN(heroKick1Sheet,4,frame,.30,0,frameY[frame],1,'none');paintLegFlame(heroKick1Sheet,4,frame,anchors,0,frameY[frame],{prev:Math.max(0,frame-1),next:Math.min(3,frame+1)});
    }else if(state==='kick2'&&heroKick2Sheet.complete){
      const p=clamp(1-a.timer/.45,0,.9999),frame=Math.min(4,Math.floor(p*5)),frameY=[0,-1,-1,-1,0],anchors=[[232,320,-1.9,.7],[229,283,-1.72,.82],[279,230,-1.5,1.2],[278,283,-1.55,1.04],[226,320,-1.9,.7]];paintN(heroKick2Sheet,5,frame,.34,0,frameY[frame],1,'none');paintLegFlame(heroKick2Sheet,5,frame,anchors,0,frameY[frame],{prev:Math.max(0,frame-1),next:Math.min(4,frame+1)});
    }else if(state==='backKick'&&heroKick3Sheet.complete){
      const p=clamp(1-a.timer/.6,0,.9999),frame=Math.min(3,Math.floor(p*4)),frameY=[-2,-1,-1,-1],anchors=[[226,319,-1.9,.7],[229,288,-1.7,.82],[228,274,-1.62,.88],[281,263,-1.45,1.2]];paintN(heroKick3Sheet,4,frame,.371,0,frameY[frame],1,'none');paintLegFlame(heroKick3Sheet,4,frame,anchors,0,frameY[frame],{prev:Math.max(0,frame-1),next:Math.min(3,frame+1)});
    }else if(state==='airBackKick'&&(heroJumpKickSheet.complete||heroJumpKickChainSheet.complete)){
      const chainActive=!a.launchKick&&(a.launchKickChainCount||0)>0&&heroJumpKickChainSheet.complete,airKickSheet=chainActive?heroJumpKickChainSheet:heroJumpKickSheet,normalFrames=chainActive?[0,1,2,3]:[1,3,4],launchFrames=[0,1,3,5],elapsed=clamp(.5-a.timer,0,.4999),chainDuration=Math.max(.001,a.launchKickChainDuration||LAUNCH_KICK_CHAIN_DURATION*playerAttackSpeedMul()),chainElapsed=clamp((chainDuration-a.timer)/playerAttackSpeedMul(),0,LAUNCH_KICK_CHAIN_DURATION-.0001),frame=chainActive?launchKickChainFrameAt(chainElapsed):a.launchKick?(elapsed<.1?0:elapsed<.2?1:elapsed<.4?3:5):normalFrames[Math.min(normalFrames.length-1,Math.floor(clamp(1-a.timer/.62,0,.9999)*normalFrames.length))],flowFrames=chainActive?normalFrames:(a.launchKick?launchFrames:normalFrames),flowIndex=Math.max(0,flowFrames.indexOf(frame)),flowPrev=flowFrames[Math.max(0,flowIndex-1)],flowNext=chainActive&&frame===1?frame:flowFrames[Math.min(flowFrames.length-1,flowIndex+1)],airKickFrameY=chainActive?[0,0,0,0]:[0,-82,-62,-46,-76,0],normalAnchors=[[205,295,-1.85,.75],[232,284,-1.68,.86],[229,273,-1.6,.9],[282,262,-1.45,1.25],[229,286,-1.7,.86],[212,295,-1.82,.76]],launchAnchors=[[164,325,-1.85,.75],[203,326,-1.68,.86],[229,273,-1.6,.9],[279,274,-1.45,1.25],[229,286,-1.7,.86],[216,324,-1.82,.76]],chainMotionAnchors=[[194,292,-.35,.92],[286,224,-1.34,1.38],[193,304,-2.15,.9],[292,274,-1.48,1.34]],chainAnchors=[[193,300,-.35,.92],[302,128,-1.34,1.38],[207,292,-2.15,.9],[322,201,-1.48,1.34]],anchors=chainActive?chainAnchors:a.launchKick?launchAnchors:normalAnchors,frameCount=chainActive?4:6,kickOutFrame=!chainActive&&frame===3,kickOutFlameRotation=kickOutFrame?-LEG_FLAME_SOURCE_HEAD_ANGLE:null,kickOutFlameY=airKickFrameY[frame]+(kickOutFrame?10:0);paintN(airKickSheet,frameCount,frame,.41,0,airKickFrameY[frame],1,'none');paintLegFlame(airKickSheet,frameCount,frame,anchors,0,kickOutFlameY,{prev:flowPrev,next:flowNext,rotation:kickOutFlameRotation,motionAnchors:chainActive?chainMotionAnchors:a.launchKick?normalAnchors:null});
    }else if(state==='jumpCrouch'&&heroJumpTransitionSheet.complete){
      paintN(heroJumpTransitionSheet,2,0,.25,0,0,1,'none');
    }else if(state==='jumpLand'&&heroJumpTransitionSheet.complete){
      const p=clamp(1-a.timer/.28,0,.9999),frame=p<.56?0:1;paintN(heroJumpTransitionSheet,2,frame,.25,0,0,1,'none');
    }else if(state==='jumpkick')paint(heroKickSheet,2,.243,1,5,-4,-.035,1,'none');
    else if(state==='jump'&&heroJumpKickSheet.complete){
      let frame=0;
      if(a.vz>300)frame=0;
      else if(a.vz>70)frame=1;
      else if(a.vz>-170)frame=4;
      else if(a.z>52)frame=1;
      // Retracted-leg frames contain 50-58 px more transparent space above
      // the fighter. Lift only those images so the torso follows the same arc
      // while the feet visibly tuck upward; physics z and the shadow stay put.
      const jumpFrameY=[0,-58,0,0,-50,0];
      paintN(heroJumpKickSheet,6,frame,.41,0,5+jumpFrameY[frame],1,'none');
    }
    else if(state==='jump')paint(heroKickSheet,1,.243,1,0,0,0,1,'none');
    else paint(heroKickSheet,0,.243,1,0,0,0,1,'none');
    if(player.held&&state!=='pickup')drawItemShape(player.held,37,-122,0,.9)
    g.filter='none';g.restore()
  }
  function drawWalkSprite(a,x,y,face,phase,paintGroundShadow){
    const frameStep=paintGroundShadow?1.0:1.5,frame=Math.floor(phase/frameStep)%8,sw=heroWalkSheet.naturalWidth/8,sh=heroWalkSheet.naturalHeight,scale=enemyFrameScale('heroWalk',frame,1),[offsetX,offsetY]=enemyFrameOffset('heroWalk',frame),dw=sw*scale,dh=sh*scale,frameShifts=[0,0,0,0,0,0,0,0];
    const shadow=fighterShadowMap.get(heroWalkSheet);
    if(paintGroundShadow&&shadow?.complete&&shadow.naturalWidth){
      const shadowSw=shadow.naturalWidth/8,shadowSh=shadow.naturalHeight;
      g.save();g.translate(x,y+a.z);g.scale(face*(enemyFrameFlip('heroWalk',frame)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.filter='none';
      g.drawImage(shadow,frame*shadowSw,0,shadowSw,shadowSh,-dw*.5+frameShifts[frame],-dh+40*scale,dw,dh);
      g.restore()
    }
    g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip('heroWalk',frame)?-1:1),1);g.translate(offsetX,offsetY);
    g.filter='none';
    g.drawImage(heroWalkSheet,frame*sw,0,sw,sh,-dw*.5+frameShifts[frame],-dh+40*scale,dw,dh);
    g.filter='none';g.restore();
    if(player.held){g.save();g.translate(x,y);g.scale(face,1);drawItemShape(player.held,37,-122,0,.9);g.restore()}
  }
  function drawMovementSprite(a,x,y,face,state,phase,isEnemy){
    const sw=heroKickSheet.naturalWidth/3,sh=heroKickSheet.naturalHeight,scale=enemyFrameScale('heroIdle',0,1),[offsetX,offsetY]=enemyFrameOffset('heroIdle',0),dw=sw*scale,dh=sh*scale;
    const shadowSheet=fighterShadows.heroKickSheet;if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip('heroIdle',0)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,0,0,sw,sh,-dw*.5,-dh+40,dw,dh);g.restore()}
    g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip('heroIdle',0)?-1:1),1);g.translate(offsetX,offsetY);
    if(isEnemy)drawEnemySpriteFrame(a,heroKickSheet,0,0,sw,sh,-dw*.5,-dh+40,dw,dh,a.elite?'grayscale(.35) sepia(.75) hue-rotate(350deg) brightness(.72) contrast(1.2)':'grayscale(.7) sepia(.4) hue-rotate(125deg) brightness(.58) contrast(1.25)');
    else{g.filter='none';g.drawImage(heroKickSheet,0,0,sw,sh,-dw*.5,-dh+40,dw,dh)}
    if(!isEnemy&&player.held)drawItemShape(player.held,37,-122,0,.9);
    g.filter='none';g.restore();
    if(isEnemy){g.save();bar(x-38,y-dh-9,76,6,a.hp/a.maxHp,a.elite?'#bf7b2f':'#8f2c2b');g.fillStyle='#c9c3b7';g.font='12px sans-serif';g.textAlign='center';g.fillText(a.name,x,y-dh-15);g.restore()}
  }
  function generatedEnemyFrame(a,state,phase){
    if(a.overChestThrow)return OVER_CHEST_ENEMY_FRAMES[a.type]??3;
    if(a.type==='spinner'){
      if(state==='down'||state==='knockdown')return 3;
      if(state==='hurt'||state==='grabbed'||state==='grappleHeld'||state==='stunned'||state==='guard'||state==='thrown'||state==='grappleThrown'||state==='grappleSlide')return 2;
      if(state==='run'){const profile=enemyAnimationProfiles.spinner;return profile.walk[Math.floor(phase/profile.walkRate)%profile.walk.length]}
      return 0
    }
    if(state==='down'||state==='heavyDefeated'||state==='barbarianDown')return 4;
    if(state==='hurt'||state==='grabbed'||state==='grappleHeld'||state==='stunned'||state==='guard'||state==='thrown'||state==='grappleThrown'||state==='grappleSlide'||(state==='knockdown'&&a.airLaunch))return 3;
    if(state==='knockdown')return 4;
    if(state==='run'){
      const profile=enemyAnimationProfiles[a.type]||{walk:[0,1,0,1],walkRate:2.4};
      return profile.walk[Math.floor(phase/profile.walkRate)%profile.walk.length]
    }
    if(a.type==='axe'&&state==='axeSlash')return Math.floor((.78-(a.timer||0))/.13)%2?2:1;
    const attackStates=['attack','slamCharge','slamAir','slamLand','slideWindup','slide','spinAir','enemyGrabWindup','enemyGrabbed','grappleTrip','enemyThrow','axeWindup','axeSlash','stab','vanish','suitDagger','suitBackflip','lightsOutCast','whipWindup','whipStrike','barbarianCharge','barbarianUppercut','breakerCurrent'];
    if(attackStates.includes(state))return 2;
    return 0;
  }
  const generatedEnemyGroundAnchors={
    spinner:[[539,583],[507,585]],
    grappler:[[370,639],[331,636]],
    axe:[[366,615],[383,614]],
    assassin:[[366,613],[308,608]],
    suit:[[382.5,615],[358,611]],
    breaker:[[360,612],[323,616]],
    whip:[[344,584],[337,580]],
    barbarian:[[192,344],[192,344]]
  };
  // The hero's current idle art renders at the 174 px visual-height baseline.
  // Enemy targets vary around it by physique; the second scale compensates for
  // a different transparent crop in each generated movement pose.
  const enemyVisualHeights={skinny:166,heavy:194,spinner:179,grappler:186,axe:182,assassin:173,suit:181,breaker:170,whip:176,barbarian:208};
  // Every image frame owns an independent scale. This lets the adjustment tool
  // resize one pose without changing the rest of the character's animation.
  const defaultEnemyFrameScales={"heroIdle":[1.0,1.0,1.0],"heroWalk":[0.83,0.81,0.8,0.89,0.8,0.86,0.89,0.91],"heroCombat":[1.0,1.0,1.0],"heroPunch":[1.0,1.0,1.0,1.0,1.0,1.0],"heroHurt":[1.0,1.0,1.0,1.0,1.0],"heroKnockdown":[1.0,1.0,1.0,1.0,1.0],"heroJumpTransition":[1.0,1.0],"heroBackThrow1":[1.0],"heroBackThrow2":[1.0],"heroBackThrow3":[1.0],"heroBackThrow4":[1.0],"heroGrab":[1.0,1.0,1.0],"heroGrabKnee":[1.0,1.0,1.0],"heroOverChestThrow":[0.55,0.58,0.54,0.61],"heroKick1":[1.0,1.0,1.0,1.0],"heroKick2":[1.0,1.0,1.0,1.0,1.0],"heroKick3":[1.0,1.0,1.0,1.0],"heroJumpKick":[1.0,1.0,1.0,1.0,1.0,1.0],"heroJumpKickChain":[0.64,0.69,0.72,0.65],"heroRisingPunch":[1.0,1.0,1.0,1.0],"skinnyBase":[1.0,1.0,1.0,1.0,1.16],"skinnyWalk":[1.0,1.0,1.0,1.0],"skinnySlide":[1.0],"heavyBase":[1.0,1.0,1.0,1.0,1.0,1.0],"heavyWalk":[1.0,1.0,1.0,1.0],"heavyDeath":[0.7],"heavyCounterGrab":[0.81],"spinnerBase":[0.86,0.86,0.86,0.86],"spinnerSpin":[0.66,0.57,0.67,0.77],"grapplerBase":[1.0,1.0,1.0,1.0,1.0],"grapplerWrestling":[0.77,0.76,0.76,0.77],"grapplerCounterGrab":[0.61],"axeBase":[1.0,1.0,1.0,1.0,1.0],"assassinBase":[1.0,1.0,0.72,1.0,1.0],"suitBase":[1.0,1.0,1.0,1.0,0.82],"suitDagger":[0.89,0.88,0.86,0.88],"suitBackflip":[0.71,0.72,0.75,0.72],"breakerBase":[1.0,1.0,1.0,1.0,1.0],"whipBase":[1.0,1.0,1.0,1.0,1.0],"barbarianBase":[0.95,0.86,1.22,0.88,1.1],"barbarianRevive":[1.0,0.98,1.06,1.04],"barbarianSprint":[0.77,0.77,0.77,0.77]};
  // Position values are per-frame game-pixel offsets: +X moves toward the
  // character's facing direction and +Y moves downward.
  const defaultEnemyFrameOffsets={"heroIdle":[[0,0],[0,0],[0,0]],"heroWalk":[[-1,0],[0,0],[3,0],[-11,0],[-3,0],[-12,0],[-9,0],[-20,0]],"heroCombat":[[0,0],[0,0],[0,0]],"heroPunch":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"heroHurt":[[0,0],[0,0],[0,0],[0,0],[0,0]],"heroKnockdown":[[0,0],[0,0],[0,0],[0,0],[0,0]],"heroJumpTransition":[[0,0],[0,0]],"heroBackThrow1":[[0,0]],"heroBackThrow2":[[0,0]],"heroBackThrow3":[[0,0]],"heroBackThrow4":[[0,0]],"heroGrab":[[0,0],[0,0],[0,0]],"heroGrabKnee":[[0,0],[0,0],[0,0]],"heroOverChestThrow":[[0,0],[0,0],[0,0],[0,0]],"heroKick1":[[0,0],[0,0],[0,0],[0,0]],"heroKick2":[[0,0],[0,0],[0,0],[0,0],[0,0]],"heroKick3":[[0,0],[0,0],[0,0],[0,0]],"heroJumpKick":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"heroJumpKickChain":[[0,0],[71,-6],[5,14],[79,4]],"heroRisingPunch":[[0,0],[0,0],[0,0],[0,0]],"skinnyBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"skinnyWalk":[[0,0],[0,0],[0,0],[0,0]],"skinnySlide":[[0,0]],"heavyBase":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"heavyWalk":[[0,0],[0,0],[0,0],[0,0]],"heavyDeath":[[0,0]],"heavyCounterGrab":[[0,0]],"spinnerBase":[[0,0],[0,0],[0,0],[0,0]],"spinnerSpin":[[0,0],[0,0],[0,0],[0,0]],"grapplerBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"grapplerWrestling":[[0,0],[0,0],[0,0],[0,0]],"grapplerCounterGrab":[[0,0]],"axeBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"assassinBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"suitBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"suitDagger":[[0,0],[0,0],[0,0],[0,0]],"suitBackflip":[[0,0],[0,0],[0,0],[0,0]],"breakerBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"whipBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"barbarianBase":[[0,0],[0,0],[0,0],[0,0],[0,0]],"barbarianRevive":[[0,0],[0,0],[0,0],[0,0]],"barbarianSprint":[[0,0],[0,0],[0,0],[0,0]]};
  const defaultEnemyFrameFlips={"heroIdle":[false,false,false],"heroWalk":[false,false,false,false,false,false,false,false],"heroCombat":[false,false,false],"heroPunch":[false,false,false,false,false,false],"heroHurt":[false,false,false,false,false],"heroKnockdown":[false,false,false,false,false],"heroJumpTransition":[false,false],"heroBackThrow1":[false],"heroBackThrow2":[false],"heroBackThrow3":[false],"heroBackThrow4":[false],"heroGrab":[false,false,false],"heroGrabKnee":[false,false,false],"heroOverChestThrow":[false,false,false,false],"heroKick1":[false,false,false,false],"heroKick2":[false,false,false,false,false],"heroKick3":[false,false,false,false],"heroJumpKick":[false,false,false,false,false,false],"heroJumpKickChain":[false,false,false,false],"heroRisingPunch":[false,false,false,false],"skinnyBase":[false,false,false,false,false],"skinnyWalk":[false,false,false,false],"skinnySlide":[false],"heavyBase":[false,false,false,false,false,false],"heavyWalk":[false,false,false,false],"heavyDeath":[false],"heavyCounterGrab":[false],"spinnerBase":[false,false,false,false],"spinnerSpin":[false,false,false,false],"grapplerBase":[false,false,false,false,false],"grapplerWrestling":[false,false,false,false],"grapplerCounterGrab":[false],"axeBase":[false,false,false,false,false],"assassinBase":[false,false,false,false,false],"suitBase":[false,false,false,false,false],"suitDagger":[false,false,false,false],"suitBackflip":[false,true,true,true],"breakerBase":[false,false,false,false,false],"whipBase":[false,false,false,false,false],"barbarianBase":[false,false,false,false,false],"barbarianRevive":[false,false,false,false],"barbarianSprint":[false,false,false,false]};
  defaultEnemyFrameScales.spinnerBase=defaultEnemyFrameScales.spinnerBase.slice(0,4);defaultEnemyFrameOffsets.spinnerBase=defaultEnemyFrameOffsets.spinnerBase.slice(0,4);defaultEnemyFrameFlips.spinnerBase=defaultEnemyFrameFlips.spinnerBase.slice(0,4);
  defaultEnemyFrameScales.heroKick3=defaultEnemyFrameScales.heroKick3.slice(0,4);defaultEnemyFrameOffsets.heroKick3=defaultEnemyFrameOffsets.heroKick3.slice(0,4);defaultEnemyFrameFlips.heroKick3=defaultEnemyFrameFlips.heroKick3.slice(0,4);
  const enemyFrameScales=Object.fromEntries(Object.entries(defaultEnemyFrameScales).map(([key,values])=>[key,[...values]]));
  const enemyFrameOffsets=Object.fromEntries(Object.entries(defaultEnemyFrameScales).map(([key,values])=>[key,values.map((_,index)=>{
    const pair=defaultEnemyFrameOffsets[key]?.[index];
    return [Number(pair?.[0])||0,Number(pair?.[1])||0]
  })]));
  const enemyFrameFlips=Object.fromEntries(Object.entries(defaultEnemyFrameScales).map(([key,values])=>[key,values.map((_,index)=>!!defaultEnemyFrameFlips[key]?.[index])]));
  const enemyFrameScale=(key,frame,fallback=1)=>enemyFrameScales[key]?.[frame]??fallback;
  const enemyFrameOffset=(key,frame)=>enemyFrameOffsets[key]?.[frame]??[0,0];
  const enemyFrameFlip=(key,frame)=>!!enemyFrameFlips[key]?.[frame];
  const characterFrameScaleKeys=new Map([
    [heroKickSheet,'heroIdle'],[heroWalkSheet,'heroWalk'],[heroCombatSheet,'heroCombat'],[heroPunchComboSheet,'heroPunch'],[heroHurtSheet,'heroHurt'],
    [enemyKnockdownSheet,'heroKnockdown'],[heroJumpTransitionSheet,'heroJumpTransition'],[heroGrabSheet,'heroGrab'],[heroGrabKneeSheet,'heroGrabKnee'],[heroOverChestThrowSheet,'heroOverChestThrow'],
    [heroKick1Sheet,'heroKick1'],[heroKick2Sheet,'heroKick2'],[heroKick3Sheet,'heroKick3'],[heroJumpKickSheet,'heroJumpKick'],[heroJumpKickChainSheet,'heroJumpKickChain'],[heroRisingPunchSheet,'heroRisingPunch']
  ]);
  heroBackThrowFrames.forEach((sheet,index)=>characterFrameScaleKeys.set(sheet,`heroBackThrow${index+1}`));
  const characterFrameScale=(sheet,frame)=>enemyFrameScale(characterFrameScaleKeys.get(sheet),frame,1);
  const characterFrameOffset=(sheet,frame)=>enemyFrameOffset(characterFrameScaleKeys.get(sheet),frame);
  const generatedEnemyScales={
    spinner:[.438,.436],
    grappler:[.358,.380],
    axe:[.456,.456],
    assassin:[.352,.373],
    suit:[.377,.376],
    breaker:[.366,.353],
    whip:[.407,.405],
    barbarian:[1,1]
  };
  function drawWhipWeaponLayer(state,phase,timer){
    const strikeProgress=state==='whipStrike'?clamp(1-timer/.36,0,1):0;
    const windupProgress=state==='whipWindup'?clamp(1-timer/.22,0,1):0;
    const handX=18,handY=-118;
    g.save();
    g.lineCap='round';
    g.lineJoin='round';
    if(state==='whipWindup'){
      const coil=windupProgress*.9+.1;
      g.globalAlpha=.42+.28*Math.sin(phase*1.4);
      g.strokeStyle='#7c3f2fbb';
      g.lineWidth=3.6;
      g.beginPath();
      g.moveTo(handX,handY);
      g.bezierCurveTo(-26,-106,-76,-64,-90,-28);
      g.bezierCurveTo(-105,18,-54,28,-22,2);
      g.stroke();
      g.globalAlpha=.38*coil;
      g.strokeStyle='#e0b26e99';
      g.lineWidth=1.8;
      g.beginPath();
      g.arc(-52,-18,30+coil*8,-.2,Math.PI*1.55);
      g.stroke();
    }else if(state==='whipStrike'){
      const snap=Math.min(2,Math.floor(strikeProgress*3));
      const frame=[
        {y:-128,c1:[122,-166],c2:[236,-90],end:[348,-114],alpha:.62,width:4.2},
        {y:-120,c1:[142,-154],c2:[260,-82],end:[376,-104],alpha:.82,width:4.6},
        {y:-111,c1:[166,-134],c2:[276,-100],end:[332,-78],alpha:.52,width:3.4}
      ][snap];
      g.globalAlpha=frame.alpha;
      g.strokeStyle='#7a3b2dbb';
      g.lineWidth=frame.width+2.8;
      g.beginPath();
      g.moveTo(handX,handY);
      g.bezierCurveTo(frame.c1[0],frame.c1[1],frame.c2[0],frame.c2[1],frame.end[0],frame.end[1]);
      g.stroke();
      g.globalAlpha=Math.min(1,frame.alpha+.12);
      g.strokeStyle='#d7a364dd';
      g.lineWidth=frame.width;
      g.beginPath();
      g.moveTo(handX,handY);
      g.bezierCurveTo(frame.c1[0],frame.c1[1],frame.c2[0],frame.c2[1],frame.end[0],frame.end[1]);
      g.stroke();
      g.globalAlpha=.36*(1-strikeProgress);
      g.strokeStyle='#fff1bd';
      g.lineWidth=2;
      g.beginPath();
      g.moveTo(handX+18,frame.y+4);
      g.bezierCurveTo(136,frame.y-30,246,frame.y+18,frame.end[0]+14,frame.end[1]-4);
      g.stroke();
    }
    g.restore();
  }
  function drawAxeChopLayer(state,phase,timer){
    const slashTotal=state==='axeSlash'?clamp(1-timer/.78,0,1):0;
    const slash=state==='axeSlash'?((slashTotal*3)%1):0;
    g.save();
    g.lineCap='round';
    g.lineJoin='round';
    g.globalCompositeOperation='screen';
    if(state==='axeSlash'){
      const comboIndex=Math.min(2,Math.floor(slashTotal*3));
      const flash=clamp(1-Math.abs(slash-.36)/.38,0,1),after=clamp(1-slash,0,1);
      // Each chop owns a slightly different path: diagonal, upright, then a
      // wider outward cut. The broken parallel curves are blade afterimages;
      // no axe silhouette is drawn here.
      const paths=[
        {s:[-68,-224],c1:[-26,-196],c2:[34,-112],e:[58,-17],trails:[[-25,10],[-9,-5],[15,11]]},
        {s:[-27,-232],c1:[18,-205],c2:[70,-122],e:[82,-15],trails:[[-22,5],[-2,-8],[19,8]]},
        {s:[12,-226],c1:[60,-196],c2:[112,-107],e:[112,-12],trails:[[-19,-1],[3,-10],[24,6]]}
      ],path=paths[comboIndex],travel=(slash-.36)*10;
      const strokeAfterimage=(offsetX,offsetY,width,color,alpha,dash=[],dashOffset=0)=>{
        g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.lineCap='butt';g.setLineDash(dash);g.lineDashOffset=dashOffset;
        g.beginPath();g.moveTo(path.s[0]+offsetX+travel,path.s[1]+offsetY);
        g.bezierCurveTo(path.c1[0]+offsetX+travel*.7,path.c1[1]+offsetY,path.c2[0]+offsetX,path.c2[1]+offsetY,path.e[0]+offsetX,path.e[1]+offsetY);g.stroke()
      };
      strokeAfterimage(0,0,26,'#cfd4d455',(.12+flash*.16)*after);
      for(let i=0;i<path.trails.length;i++){
        const [ox,oy]=path.trails[i],trailLife=(.2-i*.035)+flash*(.22+i*.05);
        strokeAfterimage(ox,oy,9-i*1.1,i===1?'#ffe4a6bb':'#cfd5d8aa',trailLife*after,[58-i*6,16,34+i*5,18,22,15],-i*23+slash*15)
      }
      strokeAfterimage(0,0,12,'#ffd889cc',(.35+flash*.5)*after,[76,11,45,14,25,12],slash*12);
      strokeAfterimage(3,-2,3,'#fff9dc',flash*.92*after,[82,14,38,18,19,16],slash*10);
      g.setLineDash([]);g.lineDashOffset=0;
    }
    g.restore();
  }
  function drawBarbarianQiAuraLocal(phase){
    if(!barbarianQiAuraSheet.complete||!barbarianQiAuraSheet.naturalWidth)return;
    const frame=Math.floor(phase/1.65)%4,sw=barbarianQiAuraSheet.naturalWidth/4,sh=barbarianQiAuraSheet.naturalHeight,size=326;
    g.save();
    g.globalAlpha=.82;
    g.drawImage(barbarianQiAuraSheet,frame*sw,0,sw,sh,-size*.5,-size+12,size,size);
    g.restore()
  }
  function drawSpecialEnemyStrip(a,sheet,shadowSheet,count,frame,x,y,face,{air=false,rage=false,scaleKey=null}={}){
    const typeScale=enemyFrameScale(scaleKey,frame,1);
    const [offsetX,offsetY]=enemyFrameOffset(scaleKey,frame);
    const frameFace=enemyFrameFlip(scaleKey,frame)?-face:face;
    const sw=sheet.naturalWidth/count,sh=sheet.naturalHeight,sc=typeScale*(a.elite?1.1:1),dw=sw*sc,dh=sh*sc,drawX=-dw*.5,drawY=-dh+40*sc;
    if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y+(a.z||0));g.scale(frameFace,1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,frame*sw,0,sw,sh,drawX,drawY,dw,dh);g.restore()}
    g.save();g.translate(x,y-(air?Math.max(22,a.z||0):0));g.scale(frameFace,1);
    g.translate(offsetX,offsetY);
    if(rage)drawBarbarianQiAuraLocal(performance.now()/105);
    drawEnemySpriteFrame(a,sheet,frame*sw,0,sw,sh,drawX,drawY,dw,dh);
    g.restore()
  }
  function drawSuitDaggerTrail(frame,frameProgress,x,y,face){
    const paths=[[-46,-105,-2,-142,28,-126],[-38,-88,34,-176,104,-164],[82,-116,-8,-188,-102,-151],[18,-96,82,-142,138,-130]],path=paths[frame]||paths[0],alpha=clamp(1-frameProgress,0,1);
    g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip('suitDagger',frame)?-1:1),1);g.globalCompositeOperation='screen';g.lineCap='round';
    const stroke=(color,width,opacity)=>{g.globalAlpha=alpha*opacity;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(path[0],path[1]);g.quadraticCurveTo(path[2],path[3],path[4],path[5]);g.stroke()};
    stroke('#5bc8ff',18,.18);stroke('#8addff',9,.42);stroke('#fff5ce',3.2,.95);
    g.globalAlpha=alpha*.9;g.fillStyle='#fffdf0';g.beginPath();g.arc(path[4],path[5],3.4,0,Math.PI*2);g.fill();g.restore()
  }
  function drawSpinnerTornado(x,y,phase,scale=1){
    g.save();g.translate(x,y);g.globalCompositeOperation='screen';g.lineCap='round';
    for(let ring=0;ring<6;ring++){
      const progress=ring/5,arcY=-18-progress*126,width=(54-progress*27)*scale,tilt=Math.sin(phase*2.8+ring*1.7)*10*scale;
      g.globalAlpha=.18+progress*.11;g.strokeStyle=ring%2?'#d9f5ff':'#72c9e8';g.lineWidth=(7-progress*3)*scale;
      g.beginPath();g.ellipse(tilt,arcY,width,width*.18,Math.sin(phase*2+ring)*.18,.16,Math.PI-.16);g.stroke();
      g.globalAlpha=.13+progress*.09;g.strokeStyle='#e9fbff';g.lineWidth=(2.4-progress)*scale;
      g.beginPath();g.ellipse(-tilt*.45,arcY-4,width*.78,width*.13,-Math.sin(phase*2.4+ring)*.2,.35,Math.PI-.35);g.stroke()
    }
    g.globalAlpha=.18;g.fillStyle='#a6e8ff';g.beginPath();g.ellipse(0,-4,70*scale,13*scale,0,0,Math.PI*2);g.fill();g.restore()
  }
  function drawGeneratedEnemySprite(a,sheet,x,y,face,state,phase){
    if(a.type==='spinner'&&state==='spinAir')drawSpinnerTornado(x,y-Math.max(22,a.z||0),phase,a.elite?1.1:1);
    if(a.type==='suit'&&state==='suitDagger'&&suitDaggerSheet.complete&&suitDaggerSheet.naturalWidth){
      const p=clamp(1-a.timer/.72,0,.9999),frame=Math.min(3,Math.floor(p*4));
      drawSpecialEnemyStrip(a,suitDaggerSheet,fighterShadows.suitDaggerSheet,4,frame,x,y,face,{scaleKey:'suitDagger'});
      drawSuitDaggerTrail(frame,(p*4)%1,x,y,face);
      if(!a.dead)drawEnemyBar(a,x,y-183*(a.elite?1.08:1));return
    }
    if(a.type==='suit'&&state==='suitBackflip'&&suitBackflipSheet.complete&&suitBackflipSheet.naturalWidth){
      const p=clamp(1-a.timer/.92,0,.9999),frame=Math.min(3,Math.floor(p*4));
      drawSpecialEnemyStrip(a,suitBackflipSheet,fighterShadows.suitBackflipSheet,4,frame,x,y,face,{scaleKey:'suitBackflip'});
      if(!a.dead)drawEnemyBar(a,x,y-183*(a.elite?1.08:1));return
    }
    if(a.type==='grappler'&&state==='counterGrab'&&grapplerCounterGrabSheet.complete&&grapplerCounterGrabSheet.naturalWidth){
      drawSpecialEnemyStrip(a,grapplerCounterGrabSheet,fighterShadows.grapplerCounterGrabSheet,1,0,x,y,face,{scaleKey:'grapplerCounterGrab'});
      if(!a.dead)drawEnemyBar(a,x,y-183*(a.elite?1.08:1));return
    }
    if(a.type==='spinner'&&state==='spinAir'&&spinnerSpinSheet.complete&&spinnerSpinSheet.naturalWidth){
      const p=clamp(1-a.timer/.78,0,.9999),frame=Math.min(3,Math.floor(p*4));
      drawSpecialEnemyStrip(a,spinnerSpinSheet,fighterShadows.spinnerSpinSheet,4,frame,x,y,face,{air:true,scaleKey:'spinnerSpin'});
      if(!a.dead)drawEnemyBar(a,x,y-162*(a.elite?1.08:1));return
    }
    if(a.type==='grappler'&&['enemyGrabWindup','enemyGrabbed','grappleTrip','enemyThrow'].includes(state)&&grapplerWrestlingSheet.complete&&grapplerWrestlingSheet.naturalWidth){
      const frame={enemyGrabWindup:0,enemyGrabbed:1,grappleTrip:2,enemyThrow:3}[state];
      drawSpecialEnemyStrip(a,grapplerWrestlingSheet,fighterShadows.grapplerWrestlingSheet,4,frame,x,y,face,{scaleKey:'grapplerWrestling'});
      if(!a.dead)drawEnemyBar(a,x,y-183*(a.elite?1.08:1));return
    }
    if(a.type==='barbarian'&&state==='barbarianRevive'&&barbarianReviveSheet.complete&&barbarianReviveSheet.naturalWidth){
      const p=clamp(1-a.timer/1.12,0,.9999),frame=Math.min(3,Math.floor(p*4));
      drawSpecialEnemyStrip(a,barbarianReviveSheet,fighterShadows.barbarianReviveSheet,4,frame,x,y,face,{rage:p>.58,scaleKey:'barbarianRevive'});
      drawEnemyBar(a,x,y-225*(a.elite?1.08:1));return
    }
    if(a.type==='barbarian'&&(state==='run'||state==='barbarianCharge')&&barbarianSprintSheet.complete&&barbarianSprintSheet.naturalWidth){
      // The same leg cycle reads as a heavy jog during navigation and accelerates
      // into a fast sprint immediately before the upward mace slash.
      const frameRate=state==='barbarianCharge'?.58:2.2,frame=Math.floor(phase/frameRate)%4;
      drawSpecialEnemyStrip(a,barbarianSprintSheet,fighterShadows.barbarianSprintSheet,4,frame,x,y,face,{rage:a.rage,scaleKey:'barbarianSprint'});
      drawEnemyBar(a,x,y-225*(a.elite?1.08:1));return
    }
    if(a.type==='barbarian'&&state==='barbarianUppercut'&&barbarianReviveSheet.complete&&barbarianReviveSheet.naturalWidth){
      const p=clamp(1-a.timer/.56,0,.9999);
      if(p<.22){
        drawSpecialEnemyStrip(a,barbarianReviveSheet,fighterShadows.barbarianReviveSheet,4,3,x,y,face,{rage:a.rage,scaleKey:'barbarianRevive'});
        drawEnemyBar(a,x,y-225*(a.elite?1.08:1));return
      }
    }
    const count=a.type==='spinner'?4:5,sw=sheet.naturalWidth/count,sh=sheet.naturalHeight,frame=generatedEnemyFrame(a,state,phase);
    const scaleKey={spinner:'spinnerBase',grappler:'grapplerBase',axe:'axeBase',assassin:'assassinBase',suit:'suitBase',breaker:'breakerBase',whip:'whipBase',barbarian:'barbarianBase'}[a.type];
    const typeScale=enemyFrameScale(scaleKey,frame,1);
    const [offsetX,offsetY]=enemyFrameOffset(scaleKey,frame);
    const sc=typeScale*(a.elite?1.1:1),dw=sw*sc,dh=sh*sc;
    const isAir=state==='spinAir',isDown=frame===4;
    const drawX=-dw*.5;
    const drawY=-dh+40*sc;
    const shadowSheet=fighterShadows.generatedEnemySheets[a.type];
    if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y+(a.z||0));g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,frame*sw,0,sw,sh,drawX,drawY,dw,dh);g.restore()}
    g.save();
    g.translate(x,y-(a.overChestThrow?0:isAir?Math.max(22,a.z||0):0));
    if(a.overChestThrow){g.translate(0,-90);g.rotate(a.overChestAngle||0);g.translate(0,90)}
    g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);
    g.translate(offsetX,offsetY);
    if(a.type==='barbarian'&&a.rage)drawBarbarianQiAuraLocal(phase);
    if(state==='run'){
      const profile=enemyAnimationProfiles[a.type]||{walkRate:2.4};
      const walkCycle=phase/profile.walkRate*Math.PI;
      g.translate(Math.sin(walkCycle)*1.1,-Math.abs(Math.sin(walkCycle))*1.15);
      g.rotate(Math.sin(walkCycle)*.005)
    }
    if(state==='spinAir')g.rotate(Math.sin(phase*.7)*.08);
    if(state==='thrown'||state==='grappleThrown'){
      const p=1-clamp(a.timer/.82,0,1),dir=Math.sign(a.throwVx||face)||1;
      g.translate(-dir*4,-6+Math.sin(p*Math.PI)*4);
      g.rotate(state==='grappleThrown'?dir*.72:dir*(-.2+.08*Math.sin(p*Math.PI)));
    }else if(state==='grappleSlide'){
      const dir=Math.sign(a.throwVx||face)||1;g.translate(-dir*10,13);g.rotate(dir*1.22)
    }
    const spriteFilter=a.elite?'brightness(.93) saturate(1.22) contrast(1.16) drop-shadow(0 0 5px #9b4b2b88)':'brightness(.96) saturate(1.06) contrast(1.08)';
    if(a.type==='barbarian'&&state==='barbarianCharge'){
      g.save();g.filter='sepia(.55) saturate(1.8) hue-rotate(330deg)';
      for(let i=3;i>=1;i--){g.globalAlpha=.08+(4-i)*.055;g.drawImage(sheet,frame*sw,0,sw,sh,drawX-i*24,drawY,dw,dh)}
      g.restore()
    }
    drawEnemySpriteFrame(a,sheet,frame*sw,0,sw,sh,drawX,drawY,dw,dh,spriteFilter);
    if(a.type==='axe'&&(state==='axeWindup'||state==='axeSlash')){
      drawAxeChopLayer(state,phase,a.timer);
    }else if(a.type==='whip'&&(state==='whipWindup'||state==='whipStrike')){
      drawWhipWeaponLayer(state,phase,a.timer);
    }else if(a.type==='barbarian'&&state==='barbarianUppercut'){
      const raw=clamp(1-a.timer/.56,0,.9999),swing=clamp((raw-.22)/.78,0,.9999),fxFrame=Math.min(3,Math.floor(swing*4));
      if(barbarianSwingFxSheet.complete&&barbarianSwingFxSheet.naturalWidth){
        const fw=barbarianSwingFxSheet.naturalWidth/4,fh=barbarianSwingFxSheet.naturalHeight;
        g.save();g.globalCompositeOperation='screen';g.globalAlpha=.48+Math.sin(swing*Math.PI)*.46;
        g.drawImage(barbarianSwingFxSheet,fxFrame*fw,0,fw,fh,-fw*.5,-fh+40,fw,fh);g.restore()
      }
    }else if(state==='spinAir'){
      g.strokeStyle='#d9b06988';g.lineWidth=6;g.beginPath();g.arc(0,-92,78,-2.8,.5);g.stroke();
    }else if(a.type==='breaker'&&state==='breakerCurrent'){
      const handX=20,handY=-137,footX=2,footY=-5,pathYs=[(a.currentHeadMinY??a.y)-a.y,(a.currentHeadMaxY??a.y)-a.y];
      g.save();g.globalCompositeOperation='screen';g.lineCap='round';g.lineJoin='round';
      for(let pass=0;pass<3;pass++){
        g.strokeStyle=pass===2?'#ffffff':pass===1?'#69efff':'#167cff88';g.lineWidth=pass===2?1.4:pass===1?4:11;g.beginPath();g.moveTo(handX,handY);
        for(let i=1;i<=7;i++){const t=i/7,x=handX+(footX-handX)*t+Math.sin(phase*2.8+i*2.1)*7,y=handY+(footY-handY)*t;g.lineTo(x,y)}g.stroke();
        for(const pathY of pathYs)if(Math.abs(pathY)>1){const steps=Math.max(2,Math.ceil(Math.abs(pathY)/18));g.beginPath();g.moveTo(footX,footY);for(let i=1;i<=steps;i++){const t=i/steps,y=footY+(pathY-footY)*t,x=footX+Math.sin(phase*3.5+i*2.4)*9*(1-Math.abs(t-.5)*.45);g.lineTo(x,y)}g.stroke()}
      }
      g.fillStyle='#d9ffff';g.shadowColor='#43dfff';g.shadowBlur=18;for(const pathY of pathYs){g.beginPath();g.arc(footX,pathY,7+Math.sin(phase*2)*2,0,Math.PI*2);g.fill()}g.shadowBlur=0;
      for(const pathY of pathYs)for(let i=0;i<7;i++){const t=i/6,y=footY+(pathY-footY)*t;g.fillRect(footX+Math.sin(i*7+phase)*15,y,3,3)}g.restore();
    }else if(a.type==='breaker'&&state==='lightsOutCast'){
      g.strokeStyle='#8eeaffbb';g.lineWidth=4;g.beginPath();g.arc(18,-135,28+Math.sin(phase)*4,-2.5,1.6);g.stroke();
    }
    g.restore();
    if(state==='stunned')drawStunIndicator(x,y-170);
    if(!a.dead){const barHeight=a.type==='barbarian'?225:a.type==='spinner'?162:183;drawEnemyBar(a,x,y-barHeight*(a.elite?1.08:1))}
  }
  function drawEnemySprite(a,x,y,face,state,phase){
    const imageReady=window.TieJieAssets?.imageReady||((image)=>!!(image?.complete&&(image.naturalWidth||image.width)));
    const generatedSheet=generatedEnemySheets[a.type];
    if(imageReady(generatedSheet)){drawGeneratedEnemySprite(a,generatedSheet,x,y,face,state,phase);return}
    if(a.type==='heavy'&&imageReady(heavyEnemySheet)){drawHeavyEnemySprite(a,x,y,face,state,phase);if(state==='stunned')drawStunIndicator(x,y-172);return}
    if(a.type==='skinny'&&imageReady(skinnyEnemySheet)){drawSkinnyEnemySprite(a,x,y,face,state,phase);if(state==='stunned')drawStunIndicator(x,y-148);return}
    return
  }
  function drawSkinnyEnemySprite(a,x,y,face,state,phase){
    if(state==='run'&&skinnyEnemyWalkSheet.complete&&skinnyEnemyWalkSheet.naturalWidth){const walkFrame=Math.floor(phase/1.9)%4,scale=enemyFrameScale('skinnyWalk',walkFrame,1);drawEnemyWalkSprite(a,x,y,face,phase,skinnyEnemyWalkSheet,scale,[0,0,0,0],40,enemyVisualHeights.skinny,'skinnyWalk');return}
    const count=5,sw=skinnyEnemySheet.naturalWidth/count,sh=skinnyEnemySheet.naturalHeight;
    let frame=0,rot=0,tx=0,ty=0,sheet=skinnyEnemySheet,sheetW=sw,sheetH=sh,scaleKey='skinnyBase';
    if(state==='hurt'||state==='grabbed')frame=1;
    else if(state==='thrown'){frame=1;rot=-.14;tx=-face*4;ty=-4}
    else if(state==='knockdown'){const p=clamp(1-a.timer/(a.knockdownDuration||.82),0,.9999);frame=Math.min(4,1+Math.floor(p*4))}
    else if(state==='down'||a.dead)frame=4;
    else if(state==='slideWindup'){frame=0;rot=-.12;ty=8}
    else if(state==='slide'&&skinnySlideSheet.complete){sheet=skinnySlideSheet;sheetW=skinnySlideSheet.naturalWidth;sheetH=skinnySlideSheet.naturalHeight;scaleKey='skinnySlide';frame=0;ty=3}
    else if(state==='attack')tx=12;
    const scale=enemyFrameScale(scaleKey,frame,1),[offsetX,offsetY]=enemyFrameOffset(scaleKey,frame),drawW=sheetW*scale,drawH=sheetH*scale;
    const groundFix=0;
    const shadowSheet=fighterShadowMap.get(sheet);if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y+(a.z||0)+groundFix);g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,frame*sheetW,0,sheetW,sheetH,-drawW*.5,-drawH+40*scale,drawW,drawH);g.restore()}
    g.save();g.translate(x,y+groundFix);if(a.overChestThrow){g.translate(0,-90);g.rotate(a.overChestAngle||0);g.translate(0,90)}g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);g.translate(offsetX+tx,offsetY+ty);g.rotate(rot);if(state==='run')g.translate(Math.sin(phase*.95)*3,0);drawEnemySpriteFrame(a,sheet,frame*sheetW,0,sheetW,sheetH,-drawW*.5,-drawH+40*scale,drawW,drawH);g.restore();
    if(!a.dead)drawEnemyBar(a,x,y-160)
  }
  function drawHeavyEnemySprite(a,x,y,face,state,phase){
    if(state==='counterGrab'&&heavyCounterGrabSheet.complete&&heavyCounterGrabSheet.naturalWidth){
      drawSpecialEnemyStrip(a,heavyCounterGrabSheet,fighterShadows.heavyCounterGrabSheet,1,0,x,y,face,{scaleKey:'heavyCounterGrab'});
      if(!a.dead)drawEnemyBar(a,x,y-194*(a.elite?1.08:1));return
    }
    if(state==='run'&&heavyEnemyWalkSheet.complete&&heavyEnemyWalkSheet.naturalWidth){const walkFrame=Math.floor(phase/1.9)%4,walkScale=enemyFrameScale('heavyWalk',walkFrame,1)*(a.elite?1.1:1);drawEnemyWalkSprite(a,x,y,face,phase,heavyEnemyWalkSheet,walkScale,[0,0,0,0],34,enemyVisualHeights.heavy*(a.elite?1.1:1),'heavyWalk');return}
    const useHeavyDeathFrame=state==='heavyDefeated'||(a.dead&&state==='down');
    if(useHeavyDeathFrame&&heavyEnemyDeathSheet.complete&&heavyEnemyDeathSheet.naturalWidth){
      const size=384*enemyFrameScale('heavyDeath',0,1)*(a.elite?1.1:1),[offsetX,offsetY]=enemyFrameOffset('heavyDeath',0),shadowSheet=fighterShadowMap.get(heavyEnemyDeathSheet);
      if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y+a.z);g.scale(face*(enemyFrameFlip('heavyDeath',0)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,-size*.5,-size+40*(a.elite?1.1:1),size,size);g.restore()}
      g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip('heavyDeath',0)?-1:1),1);g.translate(offsetX,offsetY);drawEnemySpriteFrame(a,heavyEnemyDeathSheet,0,0,heavyEnemyDeathSheet.naturalWidth,heavyEnemyDeathSheet.naturalHeight,-size*.5,-size+40*(a.elite?1.1:1),size,size,a.elite?'sepia(.28) saturate(1.35) hue-rotate(330deg) brightness(.92) contrast(1.08)':'none');g.restore();return
    }
    const count=6,sw=heavyEnemySheet.naturalWidth/count,sh=heavyEnemySheet.naturalHeight;
    let frame=0,rot=0,tx=0,ty=0,shadowW=55;
    if(state==='run')frame=1+(Math.floor(phase/1.55)%2);
    else if(state==='slamCharge')frame=3;
    else if(state==='slamAir')frame=4;
    else if(state==='slamLand')frame=5;
    else if(state==='attack'){frame=0;tx=10}
    else if(state==='hurt'||state==='grabbed'){frame=3;tx=-5;ty=8}
    else if(state==='thrown'){const p=1-clamp(a.timer/.82,0,1),dir=Math.sign(a.throwVx||face)||1;frame=3;tx=-dir*7;ty=-2+Math.sin(p*Math.PI)*4;shadowW=72}
    else if(state==='knockdown'){frame=3;tx=8;ty=10;shadowW=76}
    else if(state==='heavyDefeated'){frame=5;ty=12;shadowW=72}
    else if(state==='down'){frame=5;ty=12;shadowW=92}
    const scale=enemyFrameScale('heavyBase',frame,1)*(a.elite?1.1:1),[offsetX,offsetY]=enemyFrameOffset('heavyBase',frame),dw=sw*scale,dh=sh*scale;
    if(state==='slamCharge'){
      const q=1-clamp(a.timer/(a.elite?.62:.72),0,1),radius=(a.elite?175:145)*(.55+q*.45);
      g.save();g.translate(x,y);g.strokeStyle=a.elite?'#e7a747dd':'#cf713ddd';g.fillStyle='#b94f2418';g.lineWidth=3;g.setLineDash([10,7]);g.beginPath();g.ellipse(0,2,radius,radius*.28,0,0,6.3);g.fill();g.stroke();g.setLineDash([]);g.restore()
    }
    const groundFix=0;
    const shadowSheet=fighterShadowMap.get(heavyEnemySheet);if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y+groundFix);g.scale(face*(enemyFrameFlip('heavyBase',frame)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,frame*sw,0,sw,sh,-dw*.5,-dh+40*scale,dw,dh);g.restore()}
    g.save();g.translate(x,y-Math.max(0,a.z||0)+groundFix);g.scale(face*(enemyFrameFlip('heavyBase',frame)?-1:1),1);g.translate(offsetX+tx,offsetY+ty);g.rotate(rot);
    if(state==='run')g.translate(Math.sin(phase*.8)*2,0);
    if(state==='slamLand')g.scale(1.06,.94);
    drawEnemySpriteFrame(a,heavyEnemySheet,frame*sw,0,sw,sh,-dw*.5,-dh+40*scale,dw,dh,a.elite?'sepia(.28) saturate(1.35) hue-rotate(330deg) brightness(.92) contrast(1.08)':'none');g.restore();
    if(!a.dead)drawEnemyBar(a,x,y-dh+30)
  }
  function drawEnemyWalkSprite(a,x,y,face,phase,sheet,scale,frameShifts,bottomPad,labelHeight,scaleKey){
    const frame=Math.floor(phase/1.9)%4,sw=sheet.naturalWidth/4,sh=sheet.naturalHeight,dw=sw*scale,dh=sh*scale;
    const [offsetX,offsetY]=enemyFrameOffset(scaleKey,frame);
    const shadowSheet=fighterShadowMap.get(sheet);if(shadowSheet?.complete&&shadowSheet.naturalWidth){g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);g.translate(offsetX,offsetY);expandFighterShadow();g.drawImage(shadowSheet,frame*sw,0,sw,sh,-dw*.5+frameShifts[frame],-dh+40*scale,dw,dh);g.restore()}
    g.save();g.translate(x,y);g.scale(face*(enemyFrameFlip(scaleKey,frame)?-1:1),1);g.translate(offsetX,offsetY);
    drawEnemySpriteFrame(a,sheet,frame*sw,0,sw,sh,-dw*.5+frameShifts[frame],-dh+40*scale,dw,dh,a.elite?'sepia(.28) saturate(1.35) hue-rotate(330deg) brightness(.92) contrast(1.08)':'none');g.restore();
    if(!a.dead)drawEnemyBar(a,x,y-labelHeight)
  }
  const enemyBarStyles={skinny:{fill:'#d06b32',edge:'#f0ad63',h:7},heavy:{fill:'#7d3030',edge:'#b8a28a',h:11},spinner:{fill:'#2b8f9d',edge:'#7de0dc',h:7},grappler:{fill:'#687c36',edge:'#b6c86d',h:9},axe:{fill:'#a44328',edge:'#ef8b4d',h:9},assassin:{fill:'#704394',edge:'#c38ae5',h:6},suit:{fill:'#496b8e',edge:'#94b5d5',h:8},breaker:{fill:'#a07a25',edge:'#e2c060',h:9},whip:{fill:'#8f3544',edge:'#e17a88',h:7},barbarian:{fill:'#a52c22',edge:'#ff7658',h:11}};
  function shortStat(value){const n=Math.max(0,Math.round(value));return n>=1e9?`${(n/1e9).toFixed(1)}B`:n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e4?`${(n/1e3).toFixed(1)}K`:String(n)}
  function drawEnemyBar(a,x,labelY){g.save();const referenceHp=enemyCatalog.skinny.hp||100,typeStyle=enemyBarStyles[a.type]||enemyBarStyles.skinny,style=a.companion?{fill:'#35a95d',edge:'#8df0ad',h:typeStyle.h}:{fill:'#c83d35',edge:'#ff8072',h:typeStyle.h},baseMaxHp=a.maxHp/Math.max(1,a.difficulty||1),w=clamp(68+Math.log2(Math.max(1,baseMaxHp/referenceHp))*20+(a.elite?18:0),68,230),h=style.h+(a.elite?2:0),left=x-w*.5,uiY=labelY-28,top=uiY-8,p=clamp(a.hp/a.maxHp,0,1);g.fillStyle='#07090bdd';g.fillRect(left-2,top-2,w+4,h+4);g.strokeStyle=style.edge;g.lineWidth=a.elite?2:1;g.strokeRect(left-1,top-1,w+2,h+2);g.fillStyle=style.fill;g.fillRect(left,top,w*p,h);g.fillStyle='#ffffff30';g.fillRect(left+1,top+1,Math.max(0,w*p-2),Math.max(1,Math.floor(h*.28)));if(a.type==='heavy'||a.type==='barbarian'){g.strokeStyle='#080a0c99';g.lineWidth=1;for(let i=1;i<5;i++){const sx=left+w*i/5;g.beginPath();g.moveTo(sx,top);g.lineTo(sx,top+h);g.stroke()}}g.fillStyle=a.companion?'#baf5ca':a.elite?'#ffd28a':'#ddd4c2';g.font=`${a.elite?'800':'700'} 12px sans-serif`;g.textAlign='center';g.fillText(a.name,x,uiY-15);g.fillStyle='#e8e1d5';g.font='10px sans-serif';g.fillText(`${shortStat(a.hp)} / ${shortStat(a.maxHp)}`,x,uiY+h+12);g.restore()}
  const STAR_ABSORB_FRAME_COUNT=8,STAR_ABSORB_FRAME_W=320,STAR_ABSORB_FRAME_H=188;
  let starAbsorbFrameStrip=null;
  function starAbsorbFrames(){
    if(starAbsorbFrameStrip)return starAbsorbFrameStrip;
    const frames=[];
    for(let frame=0;frame<STAR_ABSORB_FRAME_COUNT;frame++){
      const canvas=createSuperArmorCanvas(STAR_ABSORB_FRAME_W,STAR_ABSORB_FRAME_H);
      const ctx=canvas?.getContext?.('2d');
      if(!ctx)continue;
      const phase=frame/STAR_ABSORB_FRAME_COUNT,handX=58,handY=STAR_ABSORB_FRAME_H*.5+3,range=STAR_ABSORB_FRAME_W-80;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const haze=ctx.createLinearGradient(handX-6,handY,handX+range,handY);
      haze.addColorStop(0,'rgba(14, 4, 4, 0.08)');
      haze.addColorStop(.22,'rgba(48, 7, 8, 0.22)');
      haze.addColorStop(.68,'rgba(85, 13, 15, 0.18)');
      haze.addColorStop(1,'rgba(8, 3, 3, 0)');
      ctx.fillStyle=haze;
      ctx.beginPath();
      ctx.moveTo(handX-8,handY);
      ctx.lineTo(handX+range,handY-102);
      ctx.lineTo(handX+range,handY+102);
      ctx.closePath();
      ctx.fill();
      for(let strand=0;strand<4;strand++){
        const offset=(strand-1.5)*21,drift=Math.sin(phase*Math.PI*2+strand*.9),bulge=12+(strand%3)*6;
        ctx.strokeStyle=strand%3===0?'rgba(255, 198, 154, 0.56)':strand%2===0?'rgba(138, 17, 18, 0.7)':'rgba(74, 9, 11, 0.82)';
        ctx.lineWidth=strand%3===0?2.6:strand%2===0?5.2:8.5;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(handX+6,handY+offset*.18);
        for(let step=1;step<=6;step++){
          const p=step/6,surge=Math.sin(phase*Math.PI*2*1.45+strand*1.17+p*6.8),x=handX+range*p,y=handY+offset*(1-p*.72)+surge*(24-18*p)+drift*(15-11*p)+(p>.7?Math.sin(p*22+strand)*bulge*(1-p):0);
          ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      for(let plume=0;plume<8;plume++){
        const p=((plume/8)+phase*.92)%1,spread=22+Math.sin(plume*1.7+phase*8)*15,x=handX+range*(.16+p*.82),y=handY+Math.sin(plume*2.23+phase*7.6)*(48*(1-p*.55))+spread*(plume%2?.12:-.12),radius=8+(1-p)*14+((plume%3)*2);
        const smoke=ctx.createRadialGradient(x,y,2,x,y,radius);
        smoke.addColorStop(0,plume%4===0?'rgba(255, 224, 194, 0.36)':'rgba(145, 24, 19, 0.28)');
        smoke.addColorStop(.45,plume%3===0?'rgba(97, 11, 12, 0.22)':'rgba(71, 9, 10, 0.26)');
        smoke.addColorStop(1,'rgba(7, 2, 2, 0)');
        ctx.fillStyle=smoke;
        ctx.beginPath();
        ctx.ellipse(x,y,radius*1.25,radius*.72,Math.sin(plume+phase*5)*.8,0,Math.PI*2);
        ctx.fill();
      }
      for(let spark=0;spark<12;spark++){
        const p=((spark/12)+phase*1.6)%1,arc=(spark%2?1:-1)*(16+Math.sin(spark*1.31+phase*9)*8),x=handX+range*(.06+p*.9),y=handY+arc*(1-p*.72)+Math.sin(p*18+spark)*6,r=1.2+(spark%3)*.65;
        ctx.fillStyle=spark%5===0?'rgba(255, 236, 208, 0.82)':spark%2===0?'rgba(220, 70, 54, 0.72)':'rgba(122, 15, 17, 0.66)';
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fill();
      }
      const core=ctx.createRadialGradient(handX+4,handY,4,handX+4,handY,48);
      core.addColorStop(0,'rgba(255, 245, 232, 0.98)');
      core.addColorStop(.18,'rgba(255, 196, 147, 0.82)');
      core.addColorStop(.5,'rgba(148, 18, 18, 0.58)');
      core.addColorStop(1,'rgba(18, 4, 4, 0)');
      ctx.fillStyle=core;
      ctx.beginPath();
      ctx.arc(handX+4,handY,40+Math.sin(phase*Math.PI*2)*3,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(250, 214, 187, 0.7)';
      ctx.lineWidth=2.4;
      ctx.beginPath();
      ctx.arc(handX+2,handY,18+Math.sin(phase*Math.PI*2)*2,phase*Math.PI*2,phase*Math.PI*2+Math.PI*1.45);
      ctx.stroke();
      frames.push(canvas);
    }
    starAbsorbFrameStrip=frames;
    return frames;
  }
  function drawItemShape(type,x,y,rot=0,scale=1){
    g.save();g.translate(x,y);g.rotate(rot);g.scale(scale,scale);
    if(type==='coin'){
      const coin=g.createRadialGradient(-4,-5,2,0,0,16);coin.addColorStop(0,'#fff4a8');coin.addColorStop(.38,'#f4c442');coin.addColorStop(1,'#9d5d08');g.fillStyle=coin;g.beginPath();g.ellipse(0,0,15,17,0,0,6.3);g.fill();g.strokeStyle='#ffe47a';g.lineWidth=2.5;g.stroke();g.fillStyle='#8b5108';g.font='900 15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('金',0,1)
    }else if(type==='chicken'){
      g.strokeStyle='#5c2b18';g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(-10,9);g.lineTo(8,-8);g.stroke();g.fillStyle='#f0e4c2';g.beginPath();g.arc(-13,12,6,0,6.3);g.arc(12,-12,6,0,6.3);g.fill();const meat=g.createRadialGradient(-4,-6,2,0,0,18);meat.addColorStop(0,'#ffca71');meat.addColorStop(.55,'#bd572e');meat.addColorStop(1,'#692816');g.fillStyle=meat;g.beginPath();g.ellipse(4,-2,18,12,-.65,0,6.3);g.fill();g.strokeStyle='#f08a45';g.lineWidth=2;g.stroke()
    }else if(type==='fruit'){
      const fruit=g.createRadialGradient(-6,-8,2,0,0,18);fruit.addColorStop(0,'#fff28b');fruit.addColorStop(.28,'#e35a35');fruit.addColorStop(1,'#741b2e');g.fillStyle=fruit;g.beginPath();g.arc(0,1,17,0,6.3);g.fill();g.strokeStyle='#ff9b5d';g.lineWidth=2;g.stroke();g.fillStyle='#4d8a45';g.beginPath();g.ellipse(6,-16,9,4,-.45,0,6.3);g.fill();g.strokeStyle='#362519';g.lineWidth=3;g.beginPath();g.moveTo(0,-13);g.lineTo(2,-20);g.stroke()
    }else if(type==='grenade'){
      g.fillStyle='#0a0d0c';g.beginPath();g.arc(0,2,14,0,6.3);g.fill();
      g.fillStyle='#465448';g.beginPath();g.arc(-2,0,10,0,6.3);g.fill();
      g.strokeStyle='#b6a56c';g.lineWidth=3;g.beginPath();g.arc(3,-14,7,-2.5,.8);g.stroke();
      g.fillStyle='#242a25';g.fillRect(-5,-15,11,6)
    }else{
      g.rotate(-.7);
      g.lineCap='round';
      g.strokeStyle='#17100c';g.lineWidth=11;g.beginPath();g.moveTo(-34,0);g.lineTo(14,0);g.stroke();
      g.strokeStyle='#704526';g.lineWidth=7;g.stroke();
      g.strokeStyle='#aa7441';g.lineWidth=2.4;g.beginPath();g.moveTo(-30,-2);g.lineTo(11,-2);g.stroke();
      g.fillStyle='#3c2415';g.beginPath();g.ellipse(-35,0,6,7,0,0,6.3);g.fill();
      g.strokeStyle='#bb7d43';g.lineWidth=1.7;g.beginPath();g.arc(-35,-1,3.8,.15,2.85);g.stroke();
      g.fillStyle='#171b1c';g.beginPath();g.moveTo(4,-15);g.lineTo(31,-17);g.lineTo(38,-10);g.lineTo(38,10);g.lineTo(31,17);g.lineTo(4,15);g.lineTo(-1,9);g.lineTo(-1,-9);g.closePath();g.fill();
      const steel=g.createLinearGradient(0,-14,0,15);steel.addColorStop(0,'#a6acad');steel.addColorStop(.28,'#747c7d');steel.addColorStop(.72,'#4c5557');steel.addColorStop(1,'#2b3132');g.fillStyle=steel;
      g.beginPath();g.moveTo(5,-12);g.lineTo(29,-14);g.lineTo(34,-8);g.lineTo(34,8);g.lineTo(29,13);g.lineTo(5,11);g.lineTo(2,7);g.lineTo(2,-8);g.closePath();g.fill();
      g.strokeStyle='#d3d7d499';g.lineWidth=2;g.beginPath();g.moveTo(7,-10);g.lineTo(27,-12);g.lineTo(31,-8);g.moveTo(4,8);g.lineTo(27,10);g.stroke();
      g.strokeStyle='#252b2c';g.lineWidth=2.2;g.beginPath();g.moveTo(5,-2);g.lineTo(13,-6);g.moveTo(22,10);g.lineTo(29,5);g.moveTo(30,-12);g.lineTo(34,-7);g.stroke();
      g.fillStyle='#2a1b12';g.fillRect(5,-5,10,10)
    }
    g.restore()
  }
  function drawPickup(p){g.save();g.translate(p.x,p.y);if(['coin','chicken','fruit'].includes(p.type)){const bob=Math.sin(p.bob||0)*4;drawGroundShadow(20,6,4,'#03050688');g.translate(0,-(p.z||14)+bob);if(p.type==='coin')g.scale(.65+Math.abs(Math.cos(p.spin||0))*.35,1);else g.rotate(Math.sin(p.spin||0)*.09);drawItemShape(p.type,0,0,0,p.type==='fruit'?.82:.88)}else{drawGroundShadow(p.type==='grenade'?22:34,7,5,'#03050688');g.strokeStyle='#e2b36aaa';g.lineWidth=3;g.beginPath();g.ellipse(0,-8,p.type==='grenade'?24:34,18,0,0,6.3);g.stroke();drawItemShape(p.type,0,-7,p.type==='hammer'?-.28:0,p.type==='hammer'?.9:.82)}g.restore()}
  function drawProjectile(p){g.save();g.translate(p.x,p.y);drawGroundShadow(p.type==='grenade'?18:25,6,4,'#03050677');g.translate(0,-p.z);drawItemShape(p.type,0,0,p.spin*(p.vx<0?-1:1),p.type==='grenade'?.88:1);g.restore()}
  function drawStunIndicator(x,y){const t=performance.now()/180;g.save();g.translate(x,y);for(let i=0;i<3;i++){const a=t+i*2.094,s=5+(i===0?1:0);g.save();g.translate(Math.cos(a)*25,Math.sin(a)*7);g.rotate(a);g.fillStyle='#f2c34f';g.strokeStyle='#5b351a';g.lineWidth=2;g.beginPath();for(let k=0;k<10;k++){const r=k%2?s*.45:s,ang=-Math.PI/2+k*Math.PI/5;g.lineTo(Math.cos(ang)*r,Math.sin(ang)*r)}g.closePath();g.fill();g.stroke();g.restore()}g.restore()}
  function bar(x,y,w,h,p,c){g.fillStyle='#080a0cdd';g.fillRect(x,y,w,h);g.fillStyle=c;g.fillRect(x+2,y+2,(w-4)*clamp(p,0,1),h-4)}
  function hud(){const showStarAbsorb=hasSkill('starAbsorb'),showLaunchKick=hasSkill('launchKickChain'),meterCount=(showStarAbsorb?1:0)+(showLaunchKick?1:0),hudHeight=106+meterCount*25;g.fillStyle='#091014dd';g.fillRect(28,24,460,hudHeight);g.strokeStyle='#8a5638';g.strokeRect(28,24,460,hudHeight);g.fillStyle='#e8d5b3';g.font='800 21px sans-serif';g.textAlign='left';g.fillText('陆骁',48,54);bar(48,67,270,15,player.hp/player.maxHp,'#c84932');g.fillStyle='#96a5a5';g.font='14px sans-serif';g.fillText(`HP ${Math.max(0,Math.floor(player.hp))} / ${player.maxHp}`,328,80);g.fillStyle='#d5a467';g.fillText(player.held?(player.held==='grenade'?'手持：手榴弹':`手持：战锤（剩 ${player.heldUses} 次）`):'徒手格斗',48,94);
    const topGold=document.querySelector('#top-gold'),topChicken=document.querySelector('#top-chicken'),topFruit=document.querySelector('#top-fruit');if(topGold)topGold.textContent=String(progress.gold);if(topChicken)topChicken.textContent=String(progress.chicken);if(topFruit)topFruit.textContent=String(progress.fruit);
    const hpNow=vitalityStat(),atkNow=strengthStat(),defNow=defenseStat(),hpNext=hpNow+pendingGrowthUpgrades.hp,atkNext=atkNow+pendingGrowthUpgrades.atk,defNext=defNow+pendingGrowthUpgrades.def,preview=(now,next,pending)=>pending?`${now} → ${next}（待 +${pending}）`:String(now);const growthValues={hp:`属性 ${preview(hpNow,hpNext,pendingGrowthUpgrades.hp)} · HP ${Math.round(16*hpNext)}`,atk:`${preview(atkNow,atkNext,pendingGrowthUpgrades.atk)} · 伤害 ×${(atkNext/10).toFixed(2)}`,def:`${preview(defNow,defNext,pendingGrowthUpgrades.def)} · 减伤${Math.round((1-10/defNext)*100)}%`};for(const [kind,value] of Object.entries(growthValues)){const node=document.querySelector(`#growth-${kind}`);if(node)node.textContent=value}
    g.fillStyle='#d8c39a';g.font='13px sans-serif';g.fillText(`金币 ${progress.gold}  鸡腿 ${progress.chicken}  果实 ${progress.fruit}`,48,113);g.fillStyle='#91a0a1';g.fillText(`1血${vitalityStat()} 2力${strengthStat()} 3防${defenseStat()}  无伤${player.cleanHits%5}/5 攻速×${playerAttackSpeedMul().toFixed(1)}`,248,113);
    let meterY=137;const drawChargeMeter=(hits,label,fill,edge,readyFill,readyEdge,hint)=>{const ready=hits>=SKILL_CHARGE_MAX,x=48,y=meterY,w=270;g.fillStyle='#080a0cdd';g.fillRect(x,y,w,18);g.fillStyle=ready?readyFill:fill;g.fillRect(x+2,y+2,(w-4)*hits/SKILL_CHARGE_MAX,14);g.strokeStyle=ready?readyEdge:edge;g.lineWidth=1.5;g.strokeRect(x,y,w,18);g.fillStyle=ready?'#fff4d2':'#eee4f5';g.font='800 12px sans-serif';g.textAlign='left';g.fillText(`${label} ${hits}/${SKILL_CHARGE_MAX}${ready?` · ${hint}`:''}`,x+6,y+13);meterY+=25};
    if(showStarAbsorb)drawChargeMeter(Math.min(SKILL_CHARGE_MAX,player.starAbsorbHits||0),'聚势之握','#7b50b5','#b59adb','#b780e8','#e6c9ff','长按抓');
    if(showLaunchKick)drawChargeMeter(Math.min(SKILL_CHARGE_MAX,player.launchKickChargeHits||0),'空中飞连踢','#c95a2d','#ef986a','#ed8c3f','#ffd19f','飞踢后按腿');
    const place=levelName(player.level),map=trialMaps[mapIndex],hudRight=W-40,tempSupport=progress.tempRecruit&&!progress.tempRecruit.pending&&progress.tempRecruit.activeStage===currentStageNumber()?` · 临时支援 ${Math.ceil(progress.tempRecruit.remaining)}秒`:'';g.textAlign='right';g.fillStyle='#ddd';g.font='700 17px sans-serif';if(freeTourMode)g.fillText(`自由游览 · 第 ${currentStageNumber()} 关`,hudRight,49);else if(gauntletMode)g.fillText(`${gauntletEliteMode?'精英':''}测试轮战 ${Math.min(gauntletIndex+1,gauntletEnemyTypes.length)} / ${gauntletEnemyTypes.length}`,hudRight,49);else g.fillText(`第 ${currentStageNumber()} 关 · 难度 ×${stageDifficulty().toFixed(1)} · 路段 ${gateIndex+1}/${map.gates.length}`,hudRight,49);g.fillStyle='#91a0a1';g.font='14px sans-serif';g.fillText(`${gauntletMode?'模型测试场':map.name} · ${themeName(currentStageTheme)} · ${place}`,hudRight,72);g.fillText(freeTourMode?`队友 ${companions.length} · 敌人关闭`:`击倒 ${player.kills} · 队友 ${companions.filter(c=>!c.dead).length}/${companions.length}${tempSupport} · 最高 ${progress.bestStage} 关`,hudRight,94);
    if(messageT>0){g.textAlign='center';g.font='800 22px sans-serif';const tw=g.measureText(message).width+48;g.fillStyle='#080c0ee8';g.fillRect(W/2-tw/2,112,tw,46);g.strokeStyle='#b26b3b';g.strokeRect(W/2-tw/2,112,tw,46);g.fillStyle='#f0d4a5';g.fillText(message,W/2,143)}
    g.textAlign='center';g.font='14px sans-serif';g.fillStyle='#c9d0cbcc';g.fillText('升龙拳需要可被打断的下蹲蓄力｜膝撞每次命中后必须收腿，最多三次',W/2,H-18)}
  function drawEliteArmorEffects(){
    for(const f of eliteArmorFx){if(f.x+f.radius<cameraX-20||f.x-f.radius>cameraX+W+20||f.y+f.radius<cameraY-20||f.y-f.radius>cameraY+H+20)continue;const q=clamp(1-f.t/f.max,0,1),fade=clamp(f.t/f.max,0,1),radius=f.radius*(.25+.75*q);g.save();g.translate(f.x,f.y);g.globalCompositeOperation='screen';g.globalAlpha=fade;g.fillStyle='#ffd45a55';g.beginPath();g.arc(0,0,22+q*30,0,Math.PI*2);g.fill();g.shadowColor='#ffbd32';g.shadowBlur=nativeDouyinRuntime?0:16;for(let i=0;i<8;i++){const angle=f.seed+i*Math.PI*2/8+(i%3-.9)*.025,len=radius*(.64+(i%5)*.09),inner=18+q*17;g.strokeStyle=i%3===0?'#fff4b0':'#ffbd32';g.lineWidth=i%4===0?5:2.6;g.beginPath();g.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);g.lineTo(Math.cos(angle)*len,Math.sin(angle)*len);g.stroke()}g.shadowBlur=0;g.strokeStyle='#ffe477';g.lineWidth=4;g.beginPath();g.arc(0,0,34+q*82,0,Math.PI*2);g.stroke();g.restore()}
  }
  function drawStarAbsorbEffects(){
    if(player.starAbsorbPull){
      const pull=player.starAbsorbPull,face=pull.face||player.face||1,handX=player.x+face*36,handY=player.y-(player.z||0)-88,phase=performance.now()*.0013+(pull.seed||0),frames=starAbsorbFrames(),frameCount=Math.max(1,frames.length),frame=Math.floor((pull.elapsed*9+phase*5)%frameCount);
      if(frames.length){
        g.save();
        g.translate(handX,handY);
        g.scale(face,1);
        g.globalAlpha=.88;
        g.drawImage(frames[frame],-65,-106,360,212);
        g.globalAlpha=.44;
        g.fillStyle='rgba(26, 5, 5, 0.82)';
        g.beginPath();
        g.moveTo(-4,0);
        g.lineTo(346,-118);
        g.lineTo(346,118);
        g.closePath();
        g.fill();
        g.globalAlpha=.92;
        g.fillStyle='#fff1e0';
        g.shadowColor='#ffb27d';
        g.shadowBlur=16;
        g.beginPath();
        g.arc(2,0,5.8+Math.sin(phase*8)*1.4,0,Math.PI*2);
        g.fill();
        g.shadowBlur=0;
        g.restore();
      }
    }
    for(const f of starAbsorbFx){
      const q=clamp(1-f.t/f.max,0,1),fade=clamp(f.t/f.max,0,1),pulse=Math.sin(q*Math.PI),dx=f.toX-f.fromX,dy=f.toY-f.fromY,distance=Math.max(1,Math.hypot(dx,dy)),nx=-dy/distance,ny=dx/distance;
      g.save();g.globalCompositeOperation='screen';g.lineCap='round';g.lineJoin='round';
      const sweep=clamp(q/.72,0,1),fanRadius=f.radius*(f.success?1:1-sweep*.82),halfAngle=35*Math.PI/180,baseAngle=f.face>0?0:Math.PI;
      g.globalAlpha=fade*(f.success?.28:.62);g.fillStyle='#45111233';g.strokeStyle='#b05a4d';g.lineWidth=2.5;g.setLineDash([14,9]);g.lineDashOffset=-q*80;g.beginPath();g.moveTo(f.centerX,f.centerY);for(let i=0;i<=18;i++){const a=baseAngle-halfAngle+halfAngle*2*i/18;g.lineTo(f.centerX+Math.cos(a)*fanRadius,f.centerY+Math.sin(a)*fanRadius/1.35)}g.closePath();g.fill();g.stroke();g.setLineDash([]);
      if(!f.success){
        for(let i=0;i<18;i++){const a=baseAngle-halfAngle+halfAngle*2*(i+.5)/18,r=fanRadius*(.82+(i%3)*.08),x=f.centerX+Math.cos(a)*r,y=f.centerY+Math.sin(a)*r/1.35;g.strokeStyle=i%2?'#c98d73':'#7f1a1f';g.lineWidth=2+(i%3);g.beginPath();g.moveTo(x,y);g.lineTo(x+(f.toX-x)*.2,y+(f.toY-y)*.2);g.stroke()}
      }else{
        const sourceContract=42*(1-q)+8;
        g.globalAlpha=fade*(.45+.55*pulse);g.strokeStyle='#b45b55';g.lineWidth=3+3*pulse;g.beginPath();g.ellipse(f.fromX,f.fromY,sourceContract,sourceContract*.55,0,0,Math.PI*2);g.stroke();
        for(let i=0;i<10;i++){const lane=(i-4.5)*5.5,wave=Math.sin(f.seed+i*1.83+q*16)*10*(1-q*.55),sx=f.fromX+nx*lane,sy=f.fromY+ny*lane,tx=f.toX,ty=f.toY,cx=(sx+tx)*.5+nx*(wave+lane*.35),cy=(sy+ty)*.5+ny*(wave+lane*.35),stream=g.createLinearGradient(sx,sy,tx,ty);stream.addColorStop(0,i%2?'#2c060622':'#5c111122');stream.addColorStop(.45,i%2?'#8f1818cc':'#d68862cc');stream.addColorStop(1,'#fff1e0');g.globalAlpha=fade*(.48+.52*pulse);g.strokeStyle=stream;g.lineWidth=i%4===0?7:2.5;g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(cx,cy,tx,ty);g.stroke()}
        for(let i=0;i<22;i++){const p=clamp(q*1.42-(i/22)*.54,0,1),arc=Math.sin(p*Math.PI)*Math.sin(f.seed+i*2.17)*20,x=f.fromX+dx*p+nx*arc,y=f.fromY+dy*p+ny*arc,tail=10+(i%4)*3;g.globalAlpha=fade*(.5+.5*pulse);g.strokeStyle=i%2?'#f0ccad':'#b12624';g.lineWidth=1.5+(i%3);g.beginPath();g.moveTo(x-dx/distance*tail,y-dy/distance*tail);g.lineTo(x,y);g.stroke()}
      }
      const vortex=18+30*pulse;g.globalAlpha=fade;g.shadowColor='#9b1c1c';g.shadowBlur=18+18*pulse;g.strokeStyle='#f0cfb1';g.lineWidth=4;g.beginPath();g.arc(f.toX,f.toY,vortex,-q*9,-q*9+Math.PI*1.55);g.stroke();g.strokeStyle='#b72e27';g.lineWidth=2;g.beginPath();g.arc(f.toX,f.toY,vortex*.58,q*12,q*12+Math.PI*1.45);g.stroke();g.fillStyle='#fff1e1';g.beginPath();g.arc(f.toX,f.toY,4+7*pulse,0,Math.PI*2);g.fill();g.shadowBlur=0;g.restore()
    }
  }
  function effects(){if(!running)return;drawStarAbsorbEffects();for(const f of resourceFx){const q=1-f.t/f.max,color=f.type==='coin'?'#ffd85a':f.type==='chicken'?'#ee7c42':'#e85b72';g.save();g.translate(f.x,f.y-(f.mode==='collect'?q*42:0));g.globalAlpha=clamp(f.t/f.max,0,1);g.strokeStyle=color;g.lineWidth=3;g.beginPath();g.ellipse(0,0,14+q*38,6+q*16,0,0,6.3);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4,len=10+q*36;g.beginPath();g.moveTo(Math.cos(a)*8,Math.sin(a)*5);g.lineTo(Math.cos(a)*len,Math.sin(a)*len*.55);g.stroke()}if(f.mode==='collect'){g.fillStyle='#fff1c1';g.font='900 18px sans-serif';g.textAlign='center';g.fillText(`+${f.value}`,0,-18)}g.restore()}for(const f of blastFx){const q=1-f.t/f.max;g.save();g.translate(f.x,f.y);g.globalAlpha=clamp(f.t/f.max,0,1);g.fillStyle='#d85a2428';g.strokeStyle='#f1a646';g.lineWidth=8*(1-q)+2;g.beginPath();g.ellipse(0,0,f.radius*q,f.radius*q*.32,0,0,6.3);g.fill();g.stroke();g.strokeStyle='#ffd27a';g.lineWidth=3;for(let i=0;i<12;i++){const a=i*Math.PI/6,len=24+q*90;g.beginPath();g.moveTo(Math.cos(a)*12,Math.sin(a)*7);g.lineTo(Math.cos(a)*len,Math.sin(a)*len*.4);g.stroke()}g.restore()}for(const f of hitFx){const q=1-f.t/f.max,r=12+q*48,fade=clamp(f.t/f.max,0,1);g.save();g.translate(f.x,f.y);g.globalAlpha=fade;if(f.blueFistFlame){g.globalAlpha=fade*f.blueFistFlame;g.globalCompositeOperation='screen';g.shadowColor='#29b8ff';g.shadowBlur=18;g.fillStyle='#bff6ff';g.beginPath();g.arc(0,0,9+q*15,0,6.3);g.fill();for(let i=0;i<7;i++){const a=f.seed+i*.897,len=18+q*(40+(i%2)*16);g.strokeStyle=i%2?'#2c8cff':'#8fefff';g.lineWidth=i%3===0?6:3;g.beginPath();g.moveTo(Math.cos(a)*6,Math.sin(a)*6);g.lineTo(Math.cos(a)*len,Math.sin(a)*len);g.stroke()}g.shadowBlur=0;g.globalCompositeOperation='source-over'}g.globalAlpha=fade;g.strokeStyle=f.onPlayer?'#b62f29':'#f1bb69';g.lineWidth=5*(1-q)+1;g.beginPath();g.arc(0,0,r,0,6.3);g.stroke();for(let i=0;i<9;i++){const a=f.seed+i*.698,len=18+q*(28+(i%3)*9);g.strokeStyle=i%2?'#eee2c5':f.onPlayer?'#d63d31':'#df7737';g.lineWidth=i%3===0?4:2;g.beginPath();g.moveTo(Math.cos(a)*8,Math.sin(a)*8);g.lineTo(Math.cos(a)*len,Math.sin(a)*len);g.stroke()}if(f.dmg!=null){g.globalAlpha=Math.min(1,f.t*6);g.fillStyle=f.onPlayer?'#ef8171':'#ffe0a1';g.font='900 20px sans-serif';g.textAlign='center';g.fillText('-'+f.dmg,0,-30-q*25)}g.restore()}}
  function refreshDoorActionVisibility(){if(!doorActionButton)return;doorActionButton.hidden=!(running&&player.hp>0&&nearbyBunkerDoor())}
  function loop(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;if(running)update(dt);refreshDoorActionVisibility();render();window.TieJieNativeUi?.presentFrame?.();requestAnimationFrame(loop)}
  const heldActions=new Set();let grabHoldPending=null;const GRAB_LONG_PRESS_SECONDS=.24;
  function canPrepareStarAbsorb(){if(!running||player.hp<=0||player.climb||player.grab||player.held||player.state==='enemyGrabbed'||['hurt','down','fall'].includes(player.state)||!hasSkill('starAbsorb')||(player.starAbsorbHits||0)<SKILL_CHARGE_MAX)return false;return !playerAttackStates.has(player.state)}
  function pressAction(name){if(wave===2&&name==='grab'){if(gauntletMode)startGauntlet();else reset();return}if(name==='grab'&&canPrepareStarAbsorb()){heldActions.add(name);grabHoldPending={elapsed:0};return}act(name)}
  function releaseAction(name){heldActions.delete(name);if(name!=='grab')return;if(player.starAbsorbPull){cancelStarAbsorbPull(true);return}if(grabHoldPending){grabHoldPending=null;act('grab')}}
  function updateGrabHoldPending(dt){if(!grabHoldPending)return;if(!heldActions.has('grab')){grabHoldPending=null;return}if(!canPrepareStarAbsorb()){grabHoldPending=null;return}grabHoldPending.elapsed+=dt;if(grabHoldPending.elapsed<GRAB_LONG_PRESS_SECONDS)return;grabHoldPending=null;useStarAbsorb()}
  function key(e,on){const m={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};if(m[e.code]){keys[m[e.code]]=on;e.preventDefault()}if(!on&&e.code==='KeyL'){releaseAction('grab');return}if(on&&!e.repeat){if(e.code==='KeyR'){restartCurrentStage();return}if(failurePopupT>0)return;if(e.code==='Digit1')tryUpgrade('hp');if(e.code==='Digit2')tryUpgrade('atk');if(e.code==='Digit3')tryUpgrade('def');if(e.code==='KeyJ'&&player.hp>0)pressAction('punch');if(e.code==='KeyK')pressAction('kick');if(e.code==='KeyL')pressAction('grab');if(e.code==='Space')pressAction('jump')}}
  addEventListener('keydown',e=>key(e,true));addEventListener('keyup',e=>key(e,false));
  const touchUi=document.querySelector('#touch-ui'),dpad=touchUi?.querySelector('.dpad'),joystickKnob=dpad?.querySelector('.joystick-knob'),actionPad=touchUi?.querySelector('.actions'),doorActionButton=document.querySelector('#open-door-action');
  const joystickTouch={id:null,startX:0,startY:0,pressed:new Set()};
  function setTouchDirection(value,on){keys[value]=on;if(on)joystickTouch.pressed.add(value);else joystickTouch.pressed.delete(value)}
  function updateTouchJoystick(e){
    const scale=Math.min(innerWidth/1280,innerHeight/720),radius=126*scale,maxTravel=69.5*scale,dx=e.clientX-joystickTouch.startX,dy=e.clientY-joystickTouch.startY,distance=Math.hypot(dx,dy),amount=Math.min(1,distance/radius),x=distance?dx/distance*amount:0,y=distance?dy/distance*amount:0;
    const knobRadius=49.5*scale,dpadRect=dpad.getBoundingClientRect();
    joystickKnob.style.left=`${joystickTouch.startX-dpadRect.left-knobRadius+x*maxTravel}px`;
    joystickKnob.style.top=`${joystickTouch.startY-dpadRect.top-knobRadius+y*maxTravel}px`;
    joystickKnob.style.bottom='auto';
    const next={left:x<-.28,right:x>.28,up:y<-.28,down:y>.28};
    for(const value of ['left','right','up','down'])if(next[value]!==joystickTouch.pressed.has(value))setTouchDirection(value,next[value]);
  }
  function releaseTouchJoystick(e){
    if(joystickTouch.id!==e.pointerId)return;
    for(const value of [...joystickTouch.pressed])setTouchDirection(value,false);
    joystickTouch.id=null;dpad.classList.remove('active');joystickKnob.style.left='';joystickKnob.style.top='';joystickKnob.style.bottom='';
  }
  dpad?.addEventListener('pointerdown',e=>{if(joystickTouch.id!==null)return;e.preventDefault();joystickTouch.id=e.pointerId;joystickTouch.startX=e.clientX;joystickTouch.startY=e.clientY;dpad.setPointerCapture(e.pointerId);dpad.classList.add('active');updateTouchJoystick(e)});
  dpad?.addEventListener('pointermove',e=>{if(joystickTouch.id===e.pointerId)updateTouchJoystick(e)});
  dpad?.addEventListener('pointerup',releaseTouchJoystick);dpad?.addEventListener('pointercancel',releaseTouchJoystick);
  const actionGestures=new Map();
  function actionButtonAt(x,y){for(const button of actionPad?.querySelectorAll('[data-action]:not([hidden])')||[]){const r=button.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return button}return null}
  function triggerTouchAction(button,gesture){
    if(!button||gesture.values.has(button.dataset.action))return;
    gesture.values.add(button.dataset.action);gesture.buttons.add(button);button.classList.add('pressed');haptic(12);
    if(failurePopupT>0)return;const a=button.dataset.action;if(player.hp>0)pressAction(a)
  }
  function releaseTouchActions(e){const gesture=actionGestures.get(e.pointerId);if(!gesture)return;for(const action of gesture.values)releaseAction(action);for(const button of gesture.buttons)button.classList.remove('pressed');actionGestures.delete(e.pointerId)}
  actionPad?.addEventListener('pointerdown',e=>{const button=e.target.closest('[data-action]:not([hidden])');if(!button)return;e.preventDefault();const gesture={values:new Set(),buttons:new Set()};actionGestures.set(e.pointerId,gesture);actionPad.setPointerCapture(e.pointerId);triggerTouchAction(button,gesture)});
  actionPad?.addEventListener('pointermove',e=>{const gesture=actionGestures.get(e.pointerId);if(gesture)triggerTouchAction(actionButtonAt(e.clientX,e.clientY),gesture)});
  actionPad?.addEventListener('pointerup',releaseTouchActions);actionPad?.addEventListener('pointercancel',releaseTouchActions);
  doorActionButton?.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();if(tryPushBunkerDoor())haptic(20)});
  let battleStarting=false;
  async function beginFromMenu(starter,allowFreeTour=true,rankedRun=true,testMode=false){
    if(battleStarting)return;
    battleStarting=true;
    const loadResult=await window.TieJieAssets?.whenReady;
    if(loadResult&&(loadResult.failed||loadResult.loading)){
      const detail=`人物资源加载失败（成功 ${loadResult.loaded}/${loadResult.total}）`;
      message=detail;messageT=4;
      try{window.tt?.showToast?.({title:detail,icon:'none',duration:4000})}catch{}
      battleStarting=false;
      return
    }
    if(!prepareRecruitment()){battleStarting=false;return}
    window.TieJieAudio?.unlock();clearPendingGrowth();testRunMode=isTestBuild&&testMode;freeTourMode=allowFreeTour&&isTestBuild&&!!document.querySelector('#free-tour')?.checked;rankedRunEligible=rankedRun&&!freeTourMode&&!testRunMode;document.body.classList.remove('menu-mode');document.querySelector('#start-card').style.display='none';document.querySelectorAll('.menu-page').forEach(page=>page.hidden=true);document.querySelector('#skill-panel').hidden=true;document.querySelector('#growth-panel').hidden=true;document.querySelector('#growth-toggle').hidden=true;document.querySelector('#touch-ui').classList.add('active');document.querySelector('#battle-menu-toggle').hidden=false;document.querySelector('#battle-menu').hidden=true;starter();running=true;battleStarting=false
  }
  function refreshStartStageLabel(){const start=document.querySelector('#start');if(start)start.textContent=`继续第 ${progress.currentStage} 关`}
  refreshStartStageLabel();
  document.querySelector('#start').onclick=()=>beginFromMenu(reset,true);
  const testTools=document.querySelector('#test-tools'),gauntletButton=document.querySelector('#gauntlet-btn'),quickStageInput=document.querySelector('#quick-stage-number');
  if(testTools)testTools.hidden=!isTestBuild;if(gauntletButton)gauntletButton.hidden=!isTestBuild;if(quickStageInput)quickStageInput.value=String(progress.currentStage);
  function normalizeQuickStage(){const requested=Math.max(1,Math.floor(Number(quickStageInput?.value)||1)),stage=isTestBuild?requested:Math.min(requested,maxSelectableStage());if(quickStageInput)quickStageInput.value=String(stage);return stage}
  quickStageInput?.addEventListener('change',normalizeQuickStage);
  document.querySelector('#quick-stage-prev')?.addEventListener('click',()=>{if(quickStageInput)quickStageInput.value=String(Math.max(1,normalizeQuickStage()-1))});
  document.querySelector('#quick-stage-next')?.addEventListener('click',()=>{if(quickStageInput)quickStageInput.value=String(isTestBuild?normalizeQuickStage()+1:Math.min(maxSelectableStage(),normalizeQuickStage()+1))});
  document.querySelector('#quick-stage-start')?.addEventListener('click',()=>{const stage=normalizeQuickStage();beginFromMenu(()=>{player.kills=0;setStagePosition(stage,!testRunMode,testRunMode);loadMap(mapIndex)},true,!isTestBuild,isTestBuild)});
  let stageSelectPage=Math.floor((progress.currentStage-1)/trialMaps.length);
  function refreshStageSelect(page=stageSelectPage){const maxStage=maxSelectableStage(),maxPage=Math.floor((maxStage-1)/trialMaps.length);stageSelectPage=clamp(Math.floor(page)||0,0,maxPage);const first=stageSelectPage*trialMaps.length+1,buttons=[...document.querySelectorAll('[data-map]')];buttons.forEach((b,i)=>{const stage=first+i,map=trialMaps[(stage-1)%trialMaps.length];b.dataset.stage=String(stage);b.textContent=stage<=maxStage?`第 ${stage} 关 · ${map.name}`:'尚未解锁';b.disabled=stage>maxStage});const label=document.querySelector('#stage-page-label');if(label)label.textContent=`第 ${first}–${Math.min(first+trialMaps.length-1,maxStage)} 关 · 当前 ${progress.currentStage}`;const prev=document.querySelector('#stage-prev-page'),next=document.querySelector('#stage-next-page');if(prev)prev.disabled=stageSelectPage<=0;if(next)next.disabled=stageSelectPage>=maxPage}
  function closeMenuPages(){document.querySelectorAll('.menu-page').forEach(page=>page.hidden=true);document.querySelector('#skill-panel').hidden=true}
  document.querySelector('#level-select').onclick=()=>{closeMenuPages();const panel=document.querySelector('#level-panel');panel.hidden=false;refreshStageSelect(Math.floor((progress.currentStage-1)/trialMaps.length))};
  document.querySelector('#level-back').onclick=()=>{document.querySelector('#level-panel').hidden=true};
  document.querySelector('#stage-prev-page').onclick=()=>refreshStageSelect(stageSelectPage-1);
  document.querySelector('#stage-next-page').onclick=()=>refreshStageSelect(stageSelectPage+1);
  document.querySelector('#stage-current').onclick=()=>refreshStageSelect(Math.floor((progress.currentStage-1)/trialMaps.length));
  document.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>{const stage=Number(b.dataset.stage)||1;if(stage>maxSelectableStage())return;beginFromMenu(()=>{player.kills=0;setStagePosition(stage);loadMap(mapIndex)},true,true)}));
  const gauntletSelected=new Set();
  (function buildGauntletPanel(){
    const box=document.querySelector('#gauntlet-enemies');
    gauntletEnemyTypes.forEach(t=>{
      const d=document.createElement('button');d.className='gauntlet-enemy';d.dataset.type=t;
      const info=enemyCatalog[t];d.textContent=info.name;
      const tag=document.createElement('span');tag.className='tag';tag.textContent=info.tag;tag.style.display='block';
      d.appendChild(tag);
      d.onclick=()=>{d.classList.toggle('selected');gauntletSelected.has(t)?gauntletSelected.delete(t):gauntletSelected.add(t);
        document.querySelector('#gauntlet-start').disabled=gauntletSelected.size===0};
      box.appendChild(d);
    });
  })();
  document.querySelector('#gauntlet-btn').onclick=()=>{
    if(!isTestBuild)return;
    closeMenuPages();document.querySelector('#gauntlet-panel').hidden=false};
  document.querySelector('#gauntlet-back').onclick=()=>{document.querySelector('#gauntlet-panel').hidden=true};
  document.querySelector('#gauntlet-start').onclick=()=>{
    if(gauntletSelected.size===0)return;
    gauntletEliteMode=!!document.querySelector('#gauntlet-elite')?.checked;
    gauntletEnemyTypes.splice(0,gauntletEnemyTypes.length,...gauntletSelected);
    beginFromMenu(startGauntlet,false,false)};
  function refreshRecruitPanel(override=''){
    const type=[...selectedRecruitTypes][0],info=recruitInfo(type),temp=progress.tempRecruit;
    const gold=document.querySelector('#recruit-gold'),status=document.querySelector('#recruit-status'),action=document.querySelector('#recruit-action');if(gold)gold.textContent=`金币 ${progress.gold.toLocaleString()}`;
    document.querySelectorAll('.recruit-enemy').forEach(b=>{const unlocked=recruitUnlocked(b.dataset.type),selected=type===b.dataset.type;b.classList.toggle('selected',selected);b.classList.toggle('unlocked',unlocked);b.classList.toggle('unaffordable',!unlocked&&progress.gold<Number(b.dataset.price));const span=b.querySelector('span');if(span){const item=recruitInfo(b.dataset.type);span.textContent=isTestBuild?'测试版直接招募':unlocked?'已永久解锁':`${item.price.toLocaleString()} 金币`}});
    if(action){action.hidden=!info||recruitUnlocked(type)||temp?.type===type||(!isTestBuild&&progress.gold<info.price);action.textContent=info?`支付 ${info.price.toLocaleString()} 金币永久解锁`:''}
    const state=!type?'尚未选择队友':isTestBuild?`测试版已选择 ${enemyCatalog[type].name} · 可直接出战`:recruitUnlocked(type)?`已选择 ${enemyCatalog[type].name} · 永久队友`:temp?.type===type?temp.pending?`已预约 ${enemyCatalog[type].name}，只在下一关出战 ${Math.ceil(temp.remaining)} 秒`:`${enemyCatalog[type].name} 本关临时支援剩余 ${Math.ceil(temp.remaining)} 秒`:progress.gold>=(info?.price||Infinity)?`可永久解锁 ${enemyCatalog[type].name}`:'金币不足，暂时无法招募';
    if(status)status.textContent=override||state
  }
  (function buildRecruitPanel(){
    const box=document.querySelector('#recruit-enemies');
    recruitCatalog.forEach(({type,price})=>{const b=document.createElement('button');b.className='recruit-enemy';b.dataset.type=type;b.dataset.price=price;b.textContent=enemyCatalog[type].name;const cost=document.createElement('span');cost.textContent=isTestBuild?'测试版直接招募':`${price.toLocaleString()} 金币`;b.appendChild(cost);b.onclick=()=>{if(!isTestBuild&&progress.tempRecruit&&progress.tempRecruit.type!==type){refreshRecruitPanel(`临时队友 ${enemyCatalog[progress.tempRecruit.type].name} 已占用唯一队友位`);return}if(selectedRecruitTypes.has(type))selectedRecruitTypes.clear();else{selectedRecruitTypes.clear();selectedRecruitTypes.add(type)}pendingRecruitType=[...selectedRecruitTypes][0]||null;refreshRecruitPanel()};box.appendChild(b)});refreshRecruitPanel()
  })();
  document.querySelector('#recruit-action').onclick=async()=>{
    const type=[...selectedRecruitTypes][0],info=recruitInfo(type),button=document.querySelector('#recruit-action');if(!type||!info||recruitUnlocked(type))return;
    if(progress.gold>=info.price){progress.gold-=info.price;progress.unlockedRecruits.push(type);progress.unlockedRecruits=[...new Set(progress.unlockedRecruits)];if(progress.tempRecruit?.type===type)progress.tempRecruit=null;pendingRecruitType=null;saveProgress();refreshRecruitPanel(`${enemyCatalog[type].name} 已永久解锁`);return}
    refreshRecruitPanel('金币不足，暂时无法招募')
  };
  document.querySelector('#recruit-btn').onclick=()=>{closeMenuPages();document.querySelector('#recruit-panel').hidden=false;refreshRecruitPanel()};
  document.querySelector('#recruit-back').onclick=()=>{document.querySelector('#recruit-panel').hidden=true};
  document.querySelector('#skill-btn').onclick=()=>{closeMenuPages();document.querySelector('#skill-panel').hidden=false;refreshSkillPanel()};
  document.querySelector('#skill-back').onclick=()=>{document.querySelector('#skill-panel').hidden=true};
  document.querySelector('#rank-btn').onclick=async()=>{const result=await window.TieJiePlatform?.rank?.open?.();if(!result?.ok&&result?.reason!=='unsupported'){message='排行榜暂时无法打开，请稍后重试';messageT=1.8}};
  document.querySelector('#feedback-btn').onclick=async()=>{const result=await window.TieJiePlatform?.support?.openFeedback?.();if(!result?.ok&&result?.reason!=='unsupported'){message='反馈入口暂时无法打开，请稍后重试';messageT=1.8}};
  document.querySelector('#reward-confirm').addEventListener('click',showSettlementTestRewarded);
  document.querySelector('#reward-cancel').addEventListener('click',()=>{if(pendingReward?.mode==='stage-settlement')continueAfterStageSettlement();else if(pendingReward?.mode==='defeat')revivePartyFull();else closeRewardModal()});
  document.querySelector('#reward-exit').addEventListener('click',abandonDropsAndReturn);
  let vibrationEnabled=true,lastHapticAt=0;
  try{vibrationEnabled=localStorage.getItem('tiejie-vibration-enabled')!=='0'}catch{}
  function haptic(duration=14){const now=performance.now();if(!vibrationEnabled||now-lastHapticAt<45||typeof navigator.vibrate!=='function')return;lastHapticAt=now;navigator.vibrate(Math.max(8,Math.min(45,duration)))}
  const vibrationToggle=document.querySelector('#vibration-toggle');
  function refreshVibrationToggle(){const state=vibrationToggle?.querySelector('b');if(state)state.textContent=vibrationEnabled?'开':'关';vibrationToggle?.classList.toggle('muted',!vibrationEnabled);vibrationToggle?.setAttribute('aria-label',vibrationEnabled?'关闭震动':'开启震动')}
  vibrationToggle?.addEventListener('click',()=>{vibrationEnabled=!vibrationEnabled;try{localStorage.setItem('tiejie-vibration-enabled',vibrationEnabled?'1':'0')}catch{}refreshVibrationToggle();if(vibrationEnabled)haptic(24)});refreshVibrationToggle();
  document.addEventListener('pointerdown',event=>{if(event.target.closest('button')&&!event.target.closest('#touch-ui'))haptic(11)},{capture:true});
  document.querySelector('#battle-menu-toggle').addEventListener('click',()=>{const panel=document.querySelector('#battle-menu');if(panel.hidden){battleMenuResumeRunning=running;running=false;window.TieJieAudio?.pause();panel.hidden=false}else{panel.hidden=true;running=battleMenuResumeRunning;battleMenuResumeRunning=false;if(running)window.TieJieAudio?.resume()}});
  document.querySelector('#battle-menu-resume').addEventListener('click',()=>{document.querySelector('#battle-menu').hidden=true;running=battleMenuResumeRunning;battleMenuResumeRunning=false;if(running)window.TieJieAudio?.resume()});
  document.querySelector('#battle-menu-end').addEventListener('click',()=>returnToStart());
  document.querySelector('#growth-toggle').addEventListener('click',()=>{if(failurePopupT>0||!canAllocateStats())return;const panel=document.querySelector('#growth-panel');if(panel.hidden)panel.hidden=false;else closeGrowthPanel()});
  document.querySelector('#growth-confirm').addEventListener('click',confirmGrowthUpgrades);
  document.querySelector('#growth-close').addEventListener('click',closeGrowthPanel);
  function handleNativeBack(){
    const rewardModal=document.querySelector('#reward-modal');
    if(rewardModal&&!rewardModal.hidden){document.querySelector('#reward-cancel')?.click();return}
    const growthPanel=document.querySelector('#growth-panel');
    if(growthPanel&&!growthPanel.hidden){closeGrowthPanel();return}
    const battleMenu=document.querySelector('#battle-menu');
    if(battleMenu&&!battleMenu.hidden){document.querySelector('#battle-menu-resume')?.click();return}
    const visibleMenuPage=[...document.querySelectorAll('.menu-page')].find(page=>!page.hidden);
    if(visibleMenuPage){const backButton=visibleMenuPage.querySelector('button[id$="-back"]');if(backButton)backButton.click();else visibleMenuPage.hidden=true;return}
    const skillPanel=document.querySelector('#skill-panel');
    if(skillPanel&&!skillPanel.hidden){document.querySelector('#skill-back')?.click();return}
    const startCard=document.querySelector('#start-card');
    if(startCard&&startCard.style.display==='none')document.querySelector('#battle-menu-toggle')?.click()
  }
  window.addEventListener('tiejie-native-back',handleNativeBack);
  const audioToggle=document.querySelector('#audio-toggle');
  function refreshAudioToggle(){const on=window.TieJieAudio?.isEnabled?.()!==false,state=audioToggle.querySelector('b');if(state)state.textContent=on?'开':'关';audioToggle.classList.toggle('muted',!on);audioToggle.setAttribute('aria-label',on?'关闭音乐和音效':'开启音乐和音效')}
  audioToggle.addEventListener('click',()=>{window.TieJieAudio?.unlock();window.TieJieAudio?.setEnabled(!window.TieJieAudio?.isEnabled?.());refreshAudioToggle()});refreshAudioToggle();
  document.querySelectorAll('[data-upgrade]').forEach(button=>button.addEventListener('click',()=>tryUpgrade(button.dataset.upgrade)));
  document.querySelectorAll('[data-downgrade]').forEach(button=>button.addEventListener('click',()=>undoPendingUpgrade(button.dataset.downgrade)));
  async function startAdMobAfterMenuReady(){
    try{await window.TieJieAssets?.whenReady}catch{}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.TieJieAdMobTestNative?.startAndPreload?.()}catch{}}))
  }
  refreshSkillControls();refreshSkillPanel();refreshGrowthConfirmation();reset();requestAnimationFrame(loop);startAdMobAfterMenuReady();
})();
