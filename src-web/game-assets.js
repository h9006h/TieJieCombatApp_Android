(() => {
  'use strict';

  // `tt` is exposed as a global property in the native mini-game runtime, but
  // it is not guaranteed to exist as a free JavaScript variable.  Keeping the
  // browser cache query on a local mini-game path makes every sprite fail to
  // load on real devices, while the procedural background still renders.
  const runtime=typeof globalThis!=='undefined'?globalThis:window;
  const isDouyin=!!runtime.tt?.createImage;
  const imageStates=new WeakMap();
  const image=src=>{
    const value=new Image(),resolved=isDouyin?src.split('?')[0]:src;
    imageStates.set(value,'loading');
    const nativeOnload=value.onload;
    value.onload=event=>{
      nativeOnload?.call(value,event);
      imageStates.set(value,'loaded');
    };
    const nativeOnerror=value.onerror;
    value.onerror=error=>{
      nativeOnerror?.call(value,error);
      imageStates.set(value,'failed');
      try{console.error(`[TieJieAssets] 图片加载失败: ${resolved}`,error)}catch{}
    };
    value.src=resolved;
    return value
  };
  const assets={
    heroKickSheet:image('assets/fighter/normalized/hero-kick-clean-strip.webp?v=17.0'),
    heroKick1Sheet:image('assets/fighter/normalized/hero-kick1-v2-strip.webp?v=17.0'),
    heroKick2Sheet:image('assets/fighter/normalized/hero-kick2-v2-strip.webp?v=17.0'),
    heroKick3Sheet:image('assets/fighter/normalized/hero-kick3-v2-strip.webp?v=18.0'),
    heroClimbOutSheet:image('assets/fighter/hero-kick3-v2-strip.webp?v=12.0'),
    heroJumpKickSheet:image('assets/fighter/normalized/hero-jump-kick-v2-strip.webp?v=17.0'),
    heroJumpKickChainSheet:image('assets/fighter/normalized/hero-jump-kick-chain-explosive-4-strip-v2.webp?v=2.0'),
    heroCombatSheet:image('assets/fighter/normalized/hero-combat-strip.webp?v=12.0'),
    heroWalkSheet:image('assets/fighter/normalized/hero-run-8-reviewed-strip.webp?v=23.0'),
    heroPunchComboSheet:image('assets/fighter/normalized/hero-punch-combo-strip.webp?v=12.0'),
    heroBlueFistFlameSheet:image('assets/fighter/effects/hero-blue-fist-flame-6-strip-v1.png?v=1.0'),
    heroHurtSheet:image('assets/fighter/normalized/hero-hurt-5-strip.webp?v=12.0'),
    enemyKnockdownSheet:image('assets/fighter/normalized/enemy-knockdown-strip.webp?v=6.0'),
    heavyEnemySheet:image('assets/fighter/normalized/enemy-heavy-slam-strip.webp?v=5.0'),
    heavyEnemyDeathSheet:image('assets/fighter/normalized/enemy-heavy-death-v2.webp?v=1.0'),
    skinnyEnemySheet:image('assets/fighter/normalized/enemy-skinny-hit-strip.webp?v=5.0'),
    heavyEnemyWalkSheet:image('assets/fighter/normalized/enemy-heavy-walk-4-natural-strip.webp?v=5.0'),
    skinnyEnemyWalkSheet:image('assets/fighter/normalized/enemy-skinny-walk-4-natural-strip.webp?v=5.0'),
    skinnySlideSheet:image('assets/fighter/normalized/enemy-skinny-slide-strip.webp?v=5.0'),
    heroGrabSheet:image('assets/fighter/normalized/hero-grab-3-spaced-strip.webp?v=12.0'),
    heroGrabKneeSheet:image('assets/fighter/normalized/hero-grab-knee-3-spaced-strip.webp?v=12.0'),
    heroOverChestThrowSheet:image('assets/fighter/normalized/hero-over-chest-throw-4-strip-v2.webp?v=7.0'),
    heroBackThrowFrames:[1,2,3,4].map(frame=>image(`assets/fighter/normalized/hero-back-throw-${frame}.webp?v=13.0`)),
    heroJumpTransitionSheet:image('assets/fighter/normalized/hero-jump-transition-strip.webp?v=12.0'),
    heroRisingPunchSheet:image('assets/fighter/normalized/hero-rising-punch-4-strip-v2.webp?v=3.0'),
    heroRisingFlameSheet:image('assets/fighter/normalized/hero-rising-flame-4-strip-v3.webp?v=3.0'),
    spinnerSpinSheet:image('assets/fighter/normalized/enemy-spinner-spin-4-strip-v2.webp?v=2.0'),
    suitDaggerSheet:image('assets/fighter/normalized/enemy-suit-dagger-combo-4-strip-v1.webp?v=1.0'),
    suitBackflipSheet:image('assets/fighter/normalized/enemy-suit-backflip-4-strip-v1.webp?v=1.0'),
    grapplerWrestlingSheet:image('assets/fighter/normalized/enemy-grappler-wrestling-4-strip-v1.webp?v=1.0'),
    heavyCounterGrabSheet:image('assets/fighter/normalized/enemy-heavy-countergrab.webp?v=1.0'),
    grapplerCounterGrabSheet:image('assets/fighter/normalized/enemy-grappler-countergrab.webp?v=1.0'),
    assassinRunSheet:image('assets/fighter/normalized/enemy-assassin-run-2-strip-v3.webp?v=3.0'),
    enemyMoveSheets:{
      spinner:image('assets/fighter/normalized/enemy-spinner-move-2-strip-v1.webp?v=1.0'),
      grappler:image('assets/fighter/normalized/enemy-grappler-move-2-strip-v1.webp?v=1.0'),
      axe:image('assets/fighter/normalized/enemy-axe-move-2-strip-v1.webp?v=1.0'),
      suit:image('assets/fighter/normalized/enemy-suit-move-3-strip-v1.webp?v=1.0'),
      breaker:image('assets/fighter/normalized/enemy-breaker-move-2-strip-v1.webp?v=1.0'),
      whip:image('assets/fighter/normalized/enemy-whip-move-2-strip-v1.webp?v=1.0')
    },
    barbarianReviveSheet:image('assets/fighter/normalized/enemy-barbarian-revive-4-strip.webp?v=1.0'),
    barbarianSprintSheet:image('assets/fighter/normalized/enemy-barbarian-sprint-2-strip-v2.webp?v=2.0'),
    barbarianQiAuraSheet:image('assets/fighter/normalized/enemy-barbarian-qi-aura-4-strip-v1.webp?v=1.0'),
    barbarianSwingFxSheet:image('assets/fighter/normalized/enemy-barbarian-swing-fx-4-strip.webp?v=1.0'),
    grenadeItemSprite:image('assets/items/wasteland-grenade-v1.png?v=1.0'),
    warHammerItemSprite:image('assets/items/wasteland-war-hammer-v1.png?v=1.0'),
    materialAtlas:image('assets/environment/material-atlas.webp?v=5.0'),
    greatWallBrickTile:image('assets/environment/great-wall-bricks-tile-v1.jpg?v=1.0'),
    greatWallGroundTile:image('assets/environment/great-wall-ground-tile-v2.jpg?v=2.0'),
    greatWallPitSprite:image('assets/environment/great-wall-pit-v2.png?v=2.0'),
    greatWallPitEdgeSprite:image('assets/environment/great-wall-pit-edge-stones-v1.png?v=1.0'),
    greatWallCollapseSprite:image('assets/environment/great-wall-collapse-v2.png?v=2.0'),
    greatWallMountainLayer:image('assets/environment/great-wall-sky-mountains-v2.jpg?v=2.0'),
    greatWallPitFloorTile:image('assets/environment/great-wall-pit-floor-v1.jpg?v=1.0'),
    oldAlleyRoadCollapseSprite:image('assets/environment/old-alley-road-collapse-v2.png?v=2.0'),
    oldAlleyHouseWallWindows:image('assets/environment/old-alley-house-wall-windows-v1.jpg?v=1.0'),
    oldAlleyHouseWallBalcony:image('assets/environment/old-alley-house-wall-balcony-v1.jpg?v=1.0'),
    oldAlleyBackground:image('assets/environment/old-alley-background-v1.jpg?v=1.0'),
    oldAlleyStreetGround:image('assets/environment/old-alley-street-ground-v1.jpg?v=1.0'),
    oldAlleyRooftopGround:image('assets/environment/old-alley-rooftop-ground-v1.jpg?v=1.0'),
    desertYardangBackground:image('assets/environment/desert-yardang-oasis-background-v1.jpg?v=1.0'),
    desertYardangTerrainAtlas:image('assets/environment/desert-yardang-terrain-2x2-v1.jpg?v=1.0'),
    desertYardangArchitectureAtlas:image('assets/environment/desert-yardang-architecture-2x2-v3.jpg?v=3.0'),
    highriseBackground:image('assets/environment/highrise-background-v1.jpg?v=1.0'),
    highriseRooftopGround:image('assets/environment/highrise-rooftop-ground-v1.jpg?v=1.0'),
    highriseStructure:image('assets/environment/highrise-structure-v1.jpg?v=1.0'),
    skyShelterBackground:image('assets/environment/sky-shelter-background-v1.jpg?v=1.0'),
    skyShelterRooftopGround:image('assets/environment/sky-shelter-rooftop-ground-v1.jpg?v=1.0'),
    skyShelterStructureAtlas:image('assets/environment/sky-shelter-structure-materials-2x2-v1.jpg?v=1.0'),
    skyShelterBoundariesAtlas:image('assets/environment/sky-shelter-boundaries-2x2-v1.png?v=1.0'),
    skyShelterOuterPitWallsAtlas:image('assets/environment/sky-shelter-outer-pit-walls-2x2-v1.jpg?v=1.0'),
    waterShelterOceanBackground:image('assets/environment/water-shelter-ocean-background-v1.jpg?v=1.0'),
    waterShelterSurfaceAtlas:image('assets/environment/water-shelter-surface-materials-2x2-v1.jpg?v=2.0'),
    waterShelterStructureAtlas:image('assets/environment/water-shelter-structure-materials-2x2-v1.jpg?v=2.0'),
    waterShelterFloodedRoomAtlas:image('assets/environment/water-shelter-flooded-room-materials-2x2-v5.jpg?v=5.0'),
    forestBackdropTile:image('assets/environment/forest-backdrop-tile-v1.jpg?v=1.4'),
    forestTreeRootSprite:image('assets/environment/forest-tree-root-v1.png?v=1.5'),
    forestTerrainAtlas:image('assets/environment/forest-terrain-materials-2x2-v1.jpg?v=1.0'),
    forestArchitectureAtlas:image('assets/environment/forest-architecture-materials-2x2-v1.jpg?v=1.0'),
    environmentBoundaryAtlas:image('assets/environment/environment-boundaries-2x2-v1.png?v=1.0'),
    bunkerStructureAtlas:image('assets/environment/bunker-structure-materials-2x2-v3.jpg?v=4.0'),
    bunkerCavePlainTexture:image('assets/environment/bunker-cave-plain-seamless-v1.png?v=4.0'),
    bunkerCaveClimbTexture:image('assets/environment/bunker-cave-climb-v1.png?v=1.0'),
    bunkerRoomAtlas:image('assets/environment/bunker-room-materials-2x2-v1.jpg?v=2.0'),
    bunkerSideDoorAtlas:image('assets/environment/bunker-side-door-materials-2x2-v2.jpg?v=2.0'),
    bunkerCivilDefenseDoorAtlas:image('assets/environment/bunker-modern-cross-door-wall-states-v2.png?v=6.0'),
    bunkerLoungeGymAtlas:image('assets/environment/bunker-lounge-gym-materials-2x2-v1.jpg?v=2.0'),
    bunkerModernRoomStrips:image('assets/environment/bunker-modern-room-strips-v1.jpg?v=3.0')
  };
  assets.generatedEnemySheets={
    spinner:image('assets/fighter/normalized/enemy-spinner-strip-padded.webp?v=6.0'),
    grappler:image('assets/fighter/normalized/enemy-grappler-strip-padded.webp?v=2.0'),
    axe:image('assets/fighter/normalized/enemy-axe-strip-padded.webp?v=2.0'),
    assassin:image('assets/fighter/normalized/enemy-assassin-strip-padded-v2.webp?v=3.0'),
    suit:image('assets/fighter/normalized/enemy-suit-strip-padded-v6.webp?v=6.0'),
    breaker:image('assets/fighter/normalized/enemy-breaker-strip-padded.webp?v=2.0'),
    whip:image('assets/fighter/normalized/enemy-whip-strip-padded.webp?v=2.3'),
    barbarian:image('assets/fighter/normalized/enemy-barbarian-strip-normalized-v2.webp?v=2.0')
  };

  assets.fighterShadows={
    heroKickSheet:image('assets/fighter/normalized/shadows/hero-kick-clean-strip.webp?v=1.0'),
    heroKick1Sheet:image('assets/fighter/normalized/shadows/hero-kick1-v2-strip.webp?v=1.0'),
    heroKick2Sheet:image('assets/fighter/normalized/shadows/hero-kick2-v2-strip.webp?v=1.0'),
    heroKick3Sheet:image('assets/fighter/normalized/shadows/hero-kick3-v2-strip.webp?v=2.0'),
    heroJumpKickSheet:image('assets/fighter/normalized/shadows/hero-jump-kick-v2-strip.webp?v=1.0'),
    heroJumpKickChainSheet:image('assets/fighter/normalized/shadows/hero-jump-kick-chain-explosive-4-strip-v2.webp?v=2.0'),
    heroCombatSheet:image('assets/fighter/normalized/shadows/hero-combat-strip.webp?v=1.0'),
    heroWalkSheet:image('assets/fighter/normalized/shadows/hero-run-8-reviewed-strip.webp?v=1.0'),
    heroPunchComboSheet:image('assets/fighter/normalized/shadows/hero-punch-combo-strip.webp?v=1.0'),
    heroHurtSheet:image('assets/fighter/normalized/shadows/hero-hurt-5-strip.webp?v=1.0'),
    enemyKnockdownSheet:image('assets/fighter/normalized/shadows/enemy-knockdown-strip.webp?v=1.0'),
    heavyEnemySheet:image('assets/fighter/normalized/shadows/enemy-heavy-slam-strip.webp?v=1.0'),
    heavyEnemyDeathSheet:image('assets/fighter/normalized/shadows/enemy-heavy-death-v2.webp?v=1.0'),
    skinnyEnemySheet:image('assets/fighter/normalized/shadows/enemy-skinny-hit-strip.webp?v=1.0'),
    heavyEnemyWalkSheet:image('assets/fighter/normalized/shadows/enemy-heavy-walk-4-natural-strip.webp?v=1.0'),
    skinnyEnemyWalkSheet:image('assets/fighter/normalized/shadows/enemy-skinny-walk-4-natural-strip.webp?v=1.0'),
    skinnySlideSheet:image('assets/fighter/normalized/shadows/enemy-skinny-slide-strip.webp?v=1.0'),
    heroGrabSheet:image('assets/fighter/normalized/shadows/hero-grab-3-spaced-strip.webp?v=1.0'),
    heroGrabKneeSheet:image('assets/fighter/normalized/shadows/hero-grab-knee-3-spaced-strip.webp?v=1.0'),
    heroOverChestThrowSheet:image('assets/fighter/normalized/shadows/hero-over-chest-throw-4-strip-v2.webp?v=6.0'),
    heroJumpTransitionSheet:image('assets/fighter/normalized/shadows/hero-jump-transition-strip.webp?v=1.0'),
    heroRisingPunchSheet:image('assets/fighter/normalized/shadows/hero-rising-punch-4-strip-v2.webp?v=2.0'),
    spinnerSpinSheet:image('assets/fighter/normalized/shadows/enemy-spinner-spin-4-strip-v2.webp?v=2.0'),
    suitDaggerSheet:image('assets/fighter/normalized/shadows/enemy-suit-dagger-combo-4-strip-v1.webp?v=1.0'),
    suitBackflipSheet:image('assets/fighter/normalized/shadows/enemy-suit-backflip-4-strip-v1.webp?v=1.0'),
    grapplerWrestlingSheet:image('assets/fighter/normalized/shadows/enemy-grappler-wrestling-4-strip-v1.webp?v=1.0'),
    heavyCounterGrabSheet:image('assets/fighter/normalized/shadows/enemy-heavy-countergrab.webp?v=1.0'),
    grapplerCounterGrabSheet:image('assets/fighter/normalized/shadows/enemy-grappler-countergrab.webp?v=1.0'),
    assassinRunSheet:image('assets/fighter/normalized/shadows/enemy-assassin-run-2-strip-v3.webp?v=3.0'),
    enemyMoveSheets:{
      spinner:image('assets/fighter/normalized/shadows/enemy-spinner-move-2-strip-v1.webp?v=1.0'),
      grappler:image('assets/fighter/normalized/shadows/enemy-grappler-move-2-strip-v1.webp?v=1.0'),
      axe:image('assets/fighter/normalized/shadows/enemy-axe-move-2-strip-v1.webp?v=1.0'),
      suit:image('assets/fighter/normalized/shadows/enemy-suit-move-3-strip-v1.webp?v=1.0'),
      breaker:image('assets/fighter/normalized/shadows/enemy-breaker-move-2-strip-v1.webp?v=1.0'),
      whip:image('assets/fighter/normalized/shadows/enemy-whip-move-2-strip-v1.webp?v=1.0')
    },
    barbarianReviveSheet:image('assets/fighter/normalized/shadows/enemy-barbarian-revive-4-strip.webp?v=1.0'),
    barbarianSprintSheet:image('assets/fighter/normalized/shadows/enemy-barbarian-sprint-2-strip-v2.webp?v=2.0'),
    heroBackThrowFrames:[1,2,3,4].map(frame=>image(`assets/fighter/normalized/shadows/hero-back-throw-${frame}.webp?v=2.0`)),
    generatedEnemySheets:{
      spinner:image('assets/fighter/normalized/shadows/enemy-spinner-strip-padded.webp?v=2.0'),
      grappler:image('assets/fighter/normalized/shadows/enemy-grappler-strip-padded.webp?v=1.0'),
      axe:image('assets/fighter/normalized/shadows/enemy-axe-strip-padded.webp?v=1.0'),
      assassin:image('assets/fighter/normalized/shadows/enemy-assassin-strip-padded-v2.webp?v=2.0'),
      suit:image('assets/fighter/normalized/shadows/enemy-suit-strip-padded-v6.webp?v=6.0'),
      breaker:image('assets/fighter/normalized/shadows/enemy-breaker-strip-padded.webp?v=1.0'),
      whip:image('assets/fighter/normalized/shadows/enemy-whip-strip-padded.webp?v=1.0'),
      barbarian:image('assets/fighter/normalized/shadows/enemy-barbarian-strip-normalized-v2.webp?v=2.0')
    }
  };

  assets.imageReady=value=>imageStates.get(value)==='loaded'||!!(value?.complete&&(value.naturalWidth||value.width));
  assets.imageFailed=value=>imageStates.get(value)==='failed';
  assets.runtimeUsesLocalPaths=isDouyin;
  const assetImages=[];
  const collectImages=value=>{
    if(imageStates.has(value)){assetImages.push(value);return}
    if(Array.isArray(value)){value.forEach(collectImages);return}
    if(value&&typeof value==='object')Object.values(value).forEach(collectImages)
  };
  Object.values(assets).forEach(collectImages);
  assets.whenReady=new Promise(resolve=>{
    const started=Date.now();
    const check=()=>{
      const loaded=assetImages.filter(value=>imageStates.get(value)==='loaded').length;
      const failed=assetImages.filter(value=>imageStates.get(value)==='failed').length;
      const loading=assetImages.length-loaded-failed;
      if(!loading||Date.now()-started>=12000){resolve({total:assetImages.length,loaded,failed,loading});return}
      setTimeout(check,50)
    };
    check()
  });
  window.TieJieAssets=assets;
})();
