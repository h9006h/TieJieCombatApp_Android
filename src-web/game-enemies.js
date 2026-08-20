(() => {
  'use strict';

  const enemyCatalog={
    skinny:{name:'长发小瘦子',hp:72,spd:108,dmg:16,grab:true,tag:'滑铲'},
    heavy:{name:'胖打手',hp:120,spd:62,dmg:26,grab:true,tag:'千斤坠·反擒拿'},
    spinner:{name:'旋风腿客',hp:94,spd:112,dmg:23,grab:true,tag:'空中旋转'},
    grappler:{name:'擒拿手',hp:110,spd:92,dmg:24,grab:true,tag:'反抓投'},
    axe:{name:'斧头帮',hp:116,spd:78,dmg:31,grab:true,tag:'重斧'},
    assassin:{name:'刺客',hp:82,spd:128,dmg:28,grab:true,tag:'瞬移捅刀'},
    suit:{name:'西装打手',hp:105,spd:96,dmg:24,grab:true,tag:'三连斩'},
    breaker:{name:'断电工',hp:76,spd:74,dmg:14,grab:true,tag:'关灯'},
    whip:{name:'金发鞭女',hp:96,spd:106,dmg:24,grab:true,tag:'长鞭直线压制'},
    barbarian:{name:'荒铁蛮士',hp:168,spd:72,dmg:32,grab:true,tag:'冲撞升棍·濒死暴走'}
  };
  const stageThemes=['街区','沙漠','草地','高楼','水中避难所','森林','码头','工厂','屋顶','夜市','地下车库'];
  const enemyOrder=['skinny','heavy','spinner','grappler','axe','assassin','suit','breaker','whip','barbarian','heavy'];
  const enemyNames={
    skinny:['长发·阿隼','滑铲仔·小狐','街巷瘦狼'],
    heavy:['铁肚·阿山','肥熊·铁掌','肉山·老梁'],
    spinner:['旋腿·小北','风车腿·高启','空旋客·银牙'],
    grappler:['擒拿手·老段','锁臂·韩叔','摔跤王·巴图'],
    axe:['斧头帮·阿奎','短斧·三泰','斧王·老秦'],
    assassin:['影刺·无声','瞬刀·灰雀','夜行刺客'],
    suit:['西装·阿诚','黑领带·周平','经理人·冷锋'],
    breaker:['断电工·老马','电闸手·灰灯','配电员·黑线'],
    whip:['金发鞭女·维拉','长鞭·金蔷薇','鞭影女王·莉娅'],
    barbarian:['荒铁·赫山','双辫蛮士·砾牙','铸肩客·乌岩']
  };
  const enemyAnimationProfiles={
    spinner:{walk:[0,1,0,1],walkRate:2.35},
    grappler:{walk:[0,1,0,1],walkRate:2.6},
    axe:{walk:[0,1,0,1],walkRate:2.8},
    assassin:{walk:[0,1,0,1],walkRate:2.05,runRate:1.35},
    suit:{walk:[0,1,0,1],walkRate:2.35},
    breaker:{walk:[0,1,0,1],walkRate:2.75},
    whip:{walk:[0,1,0,1],walkRate:2.45},
    barbarian:{walk:[0,1,0,1],walkRate:2.15}
  };

  const makeGate=(start,end,types,boss=false)=>({
    start,end,boss,
    enemies:types.map((type,i)=>({type,dx:260+i*185,y:boss?555:570,elite:boss&&i===types.length-1}))
  });
  const trialMaps=[
    {name:'铁街旧巷',theme:'街区',boss:'街口霸主·铁肚岳山',gates:[makeGate(120,1120,['skinny','skinny']),makeGate(1120,2200,['skinny','heavy','suit']),makeGate(2200,3300,['spinner','skinny','axe']),makeGate(3300,4520,['assassin','spinner','grappler']),makeGate(4520,6040,['heavy','axe','heavy'],true)]},
    {name:'敦煌荒壁',theme:'沙漠',boss:'沙暴斧王·老秦',gates:[
      {start:120,end:1120,boss:false,enemies:[{type:'skinny',dx:270,y:570},{type:'axe',dx:590,y:570}]},
      {start:1120,end:2200,boss:false,enemies:[{type:'spinner',dx:230,y:350},{type:'skinny',dx:520,y:350},{type:'suit',dx:820,y:570}]},
      {start:2200,end:3300,boss:false,enemies:[{type:'spinner',dx:260,y:570},{type:'axe',dx:520,y:570},{type:'grappler',dx:830,y:570}]},
      {start:3300,end:4520,boss:false,enemies:[{type:'assassin',dx:280,y:225},{type:'grappler',dx:620,y:225},{type:'whip',dx:930,y:570}]},
      {start:4520,end:6040,boss:true,enemies:[{type:'axe',dx:250,y:225},{type:'spinner',dx:570,y:225},{type:'axe',dx:920,y:570,elite:true}]}
    ]},
    {name:'长城烽燧',theme:'草地',boss:'烽台鞭影·莉娅',gates:[makeGate(120,1120,['whip','skinny']),makeGate(1120,2200,['spinner','suit','whip']),makeGate(2200,3300,['grappler','whip','skinny']),makeGate(3300,4520,['spinner','assassin','whip']),makeGate(4520,6040,['whip','spinner','whip'],true)]},
    {name:'天空避难所',theme:'高楼',boss:'天台影刺·无声',gates:[makeGate(120,1120,['breaker','suit','skinny']),makeGate(1120,2200,['assassin','breaker','spinner']),makeGate(2200,3300,['breaker','grappler','axe']),makeGate(3300,4520,['assassin','assassin','heavy']),makeGate(4520,6040,['suit','assassin','assassin'],true)]},
    {name:'水中避难所',theme:'水中避难所',boss:'馆主锁臂·韩叔',gates:[makeGate(120,1120,['grappler','skinny']),makeGate(1120,2200,['suit','grappler','whip']),makeGate(2200,3300,['heavy','axe','spinner']),makeGate(3300,4520,['suit','assassin','grappler']),makeGate(4520,6040,['grappler','heavy','grappler'],true)]},
    {name:'迂回密林',theme:'森林',boss:'密林蛮王·巴图',gates:[
      {start:120,end:1120,boss:false,enemies:[{type:'axe',dx:250,y:570},{type:'skinny',dx:560,y:570}]},
      {start:1120,end:2200,boss:false,enemies:[{type:'grappler',dx:260,y:350},{type:'axe',dx:620,y:570},{type:'suit',dx:860,y:570}]},
      {start:2200,end:3300,boss:false,enemies:[{type:'heavy',dx:260,y:570},{type:'spinner',dx:570,y:265},{type:'axe',dx:880,y:570}]},
      {start:3300,end:4520,boss:false,enemies:[{type:'assassin',dx:260,y:570},{type:'suit',dx:620,y:570},{type:'grappler',dx:1220,y:165}]},
      {start:4520,end:6040,boss:true,enemies:[{type:'axe',dx:270,y:165},{type:'barbarian',dx:590,y:570},{type:'barbarian',dx:930,y:570,elite:true}]}
    ]}
  ];

  window.TieJieEnemyData={enemyCatalog,stageThemes,enemyOrder,enemyNames,enemyAnimationProfiles,trialMaps};
})();
