import http from 'node:http';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const toolDir=dirname(fileURLToPath(import.meta.url));
const projectDir=join(toolDir,'..','..');
const webDir=join(projectDir,'src-web');
const gameFile=join(webDir,'game.js');
const backupDir=join(webDir,'backups','frame-size-adjuster');
const port=4318;

const groups={
  heroIdle:['主角·待机','fighter/normalized/hero-kick-clean-strip.webp'],heroWalk:['主角·行走','fighter/normalized/hero-run-8-reviewed-strip.webp'],heroCombat:['主角·战斗架势','fighter/normalized/hero-combat-strip.webp'],heroPunch:['主角·三段拳','fighter/normalized/hero-punch-combo-strip.webp'],heroHurt:['主角·受伤','fighter/normalized/hero-hurt-5-strip.webp'],heroKnockdown:['主角·倒地','fighter/normalized/enemy-knockdown-strip.webp'],heroJumpTransition:['主角·起跳/落地','fighter/normalized/hero-jump-transition-strip.webp'],heroBackThrow1:['主角·背摔一','fighter/normalized/hero-back-throw-1.webp'],heroBackThrow2:['主角·背摔二','fighter/normalized/hero-back-throw-2.webp'],heroBackThrow3:['主角·背摔三','fighter/normalized/hero-back-throw-3.webp'],heroBackThrow4:['主角·背摔四','fighter/normalized/hero-back-throw-4.webp'],heroGrab:['主角·抓取','fighter/normalized/hero-grab-3-spaced-strip.webp'],heroGrabKnee:['主角·膝撞','fighter/normalized/hero-grab-knee-3-spaced-strip.webp'],heroOverChestThrow:['主角·过胸摔','fighter/normalized/hero-over-chest-throw-4-strip-v2.webp'],heroKick1:['主角·腿法一段','fighter/normalized/hero-kick1-v2-strip.webp'],heroKick2:['主角·腿法二段','fighter/normalized/hero-kick2-v2-strip.webp'],heroKick3:['主角·腿法三段','fighter/normalized/hero-kick3-v2-strip.webp'],heroJumpKick:['主角·空中踢','fighter/normalized/hero-jump-kick-v2-strip.webp'],heroJumpKickChain:['主角·弹射飞连腿','fighter/normalized/hero-jump-kick-chain-explosive-4-strip-v2.webp'],heroRisingPunch:['主角·升龙拳','fighter/normalized/hero-rising-punch-4-strip-v2.webp'],
  skinnyBase:['瘦子·基础','fighter/normalized/enemy-skinny-hit-strip.webp'],skinnyWalk:['瘦子·行走','fighter/normalized/enemy-skinny-walk-4-natural-strip.webp'],skinnySlide:['瘦子·滑铲','fighter/normalized/enemy-skinny-slide-strip.webp'],heavyBase:['胖打手·基础','fighter/normalized/enemy-heavy-slam-strip.webp'],heavyWalk:['胖打手·行走','fighter/normalized/enemy-heavy-walk-4-natural-strip.webp'],heavyDeath:['胖打手·倒地','fighter/normalized/enemy-heavy-death-v2.webp'],heavyCounterGrab:['胖打手·反擒拿','fighter/normalized/enemy-heavy-countergrab.webp'],spinnerBase:['旋风腿客·基础','fighter/normalized/enemy-spinner-strip-padded.webp'],spinnerSpin:['旋风腿客·旋转','fighter/normalized/enemy-spinner-spin-4-strip-v2.webp'],grapplerBase:['擒拿手·基础','fighter/normalized/enemy-grappler-strip-padded.webp'],grapplerWrestling:['擒拿手·摔技','fighter/normalized/enemy-grappler-wrestling-4-strip-v1.webp'],grapplerCounterGrab:['擒拿手·反擒拿','fighter/normalized/enemy-grappler-countergrab.webp'],axeBase:['斧头帮·基础','fighter/normalized/enemy-axe-strip-padded.webp'],assassinBase:['刺客·基础','fighter/normalized/enemy-assassin-strip-padded-v2.webp'],suitBase:['西装打手·基础','fighter/normalized/enemy-suit-strip-padded-v6.webp'],suitDagger:['西装打手·匕首','fighter/normalized/enemy-suit-dagger-combo-4-strip-v1.webp'],suitBackflip:['西装打手·后空翻','fighter/normalized/enemy-suit-backflip-4-strip-v1.webp'],breakerBase:['断电工·基础','fighter/normalized/enemy-breaker-strip-padded.webp'],whipBase:['金发鞭女·基础','fighter/normalized/enemy-whip-strip-padded.webp'],barbarianBase:['荒铁蛮士·基础','fighter/normalized/enemy-barbarian-strip-normalized-v2.webp'],barbarianRevive:['荒铁蛮士·复活','fighter/normalized/enemy-barbarian-revive-4-strip.webp'],barbarianSprint:['荒铁蛮士·冲刺','fighter/normalized/enemy-barbarian-sprint-4-strip-v1.webp']
};

function extractConfig(source){
  const read=name=>{const match=source.match(new RegExp(`const ${name}=(\\{[^;]+\\});`));if(!match)throw new Error(`找不到 ${name}`);return JSON.parse(match[1])};
  return{scales:read('defaultEnemyFrameScales'),offsets:read('defaultEnemyFrameOffsets'),flips:read('defaultEnemyFrameFlips')};
}
function validate(next,current){
  const result={scales:{},offsets:{},flips:{}};
  for(const [key,defaults] of Object.entries(current.scales)){
    if(!Array.isArray(next.scales?.[key])||next.scales[key].length!==defaults.length)throw new Error(`${key} 的帧数量不正确`);
    result.scales[key]=next.scales[key].map(value=>{value=Number(value);if(!Number.isFinite(value)||value<.1||value>1.6)throw new Error(`${key} 的缩放超出 0.10–1.60`);return Math.round(value*100)/100});
    result.offsets[key]=defaults.map((_,index)=>{const pair=next.offsets?.[key]?.[index];if(!Array.isArray(pair)||pair.length!==2)throw new Error(`${key} 第 ${index+1} 帧偏移无效`);return pair.map(value=>{value=Math.round(Number(value));if(!Number.isFinite(value)||value< -160||value>160)throw new Error(`${key} 的偏移超出 -160–160`);return value})});
    result.flips[key]=defaults.map((_,index)=>!!next.flips?.[key]?.[index]);
  }
  return result;
}
function replaceConfig(source,name,value){const pattern=new RegExp(`const ${name}=\\{[^;]+\\};`);if(!pattern.test(source))throw new Error(`无法写回 ${name}`);return source.replace(pattern,`const ${name}=${JSON.stringify(value)};`)}
function stamp(){const d=new Date(),part=n=>String(n).padStart(2,'0');return`${d.getFullYear()}${part(d.getMonth()+1)}${part(d.getDate())}-${part(d.getHours())}${part(d.getMinutes())}${part(d.getSeconds())}`}
function json(res,status,data){const body=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store'});res.end(body)}
async function sendFile(res,path,type){try{const body=await readFile(path);res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(req.method==='GET'&&url.pathname==='/')return sendFile(res,join(toolDir,'index.html'),'text/html; charset=utf-8');
    if(req.method==='GET'&&url.pathname==='/api/config'){const source=await readFile(gameFile,'utf8'),config=extractConfig(source),available=Object.fromEntries(Object.entries(groups).filter(([key])=>config.scales[key]).map(([key,[label,path]])=>[key,{label,path:`/assets/${path}`} ]));return json(res,200,{...config,groups:available,projectDir,gameFile})}
    if(req.method==='POST'&&url.pathname==='/api/save'){
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2_000_000)throw new Error('提交内容过大')}
      const source=await readFile(gameFile,'utf8'),current=extractConfig(source),next=validate(JSON.parse(raw),current);await mkdir(backupDir,{recursive:true});const backup=join(backupDir,`game-${stamp()}.js`);await copyFile(gameFile,backup);
      let output=replaceConfig(source,'defaultEnemyFrameScales',next.scales);output=replaceConfig(output,'defaultEnemyFrameOffsets',next.offsets);output=replaceConfig(output,'defaultEnemyFrameFlips',next.flips);await writeFile(gameFile,output,'utf8');return json(res,200,{ok:true,backup:relative(projectDir,backup)})
    }
    if(req.method==='GET'&&url.pathname.startsWith('/assets/')){const requested=normalize(join(webDir,url.pathname.slice(1)));if(!requested.startsWith(normalize(join(webDir,'assets'))))return json(res,403,{error:'forbidden'});const ext=requested.split('.').pop().toLowerCase(),types={webp:'image/webp',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};await stat(requested);return sendFile(res,requested,types[ext]||'application/octet-stream')}
    res.writeHead(404);res.end('Not found')
  }catch(error){json(res,500,{error:error.message||String(error)})}
});

if(process.argv.includes('--check')){
  const config=extractConfig(await readFile(gameFile,'utf8'));let assets=0;
  for(const [key,[,path]]of Object.entries(groups)){if(!config.scales[key])continue;await stat(join(webDir,'assets',path));assets++}
  console.log(`配置检查通过：${Object.keys(config.scales).length} 组帧参数，${assets} 组预览素材。`);process.exit(0)
}
server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}`;console.log(`铁街人物帧大小生成器已启动：${url}`);if(process.env.TIEJIE_FRAME_TOOL_NO_OPEN!=='1')execFile('explorer.exe',[url],{windowsHide:true})});
server.on('error',error=>{if(error.code==='EADDRINUSE'){execFile('explorer.exe',[`http://127.0.0.1:${port}`],{windowsHide:true});process.exit(0)}throw error});
