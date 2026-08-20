const LEGACY_PASSWORD_ITERATIONS = 10000;
const CURRENT_PASSWORD_ITERATIONS = 600000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_FAILURES = 5;
const STAGE_RUN_LIFETIME_SECONDS = 6 * 60 * 60;
const MAX_UPGRADES_PER_REQUEST = 100;
const STAGE_ENEMY_COUNT = 14;
const SKILLS = [
  { id: 'risingPunch', cost: 1 },
  { id: 'lifeSteal', cost: 3, requires: 'risingPunch' },
  { id: 'downRisingPunch', cost: 3, requires: 'risingPunch' },
  { id: 'blueFlame', cost: 3 },
  { id: 'legArts', cost: 1 },
  { id: 'legFlame', cost: 2, requires: 'legArts' },
  { id: 'launchKick', cost: 3, requires: 'legFlame' },
  { id: 'launchKickChain', cost: 4, requires: 'launchKick' },
  { id: 'grapple', cost: 1 },
  { id: 'invincibleGrapple', cost: 3, requires: 'grapple' },
  { id: 'starAbsorb', cost: 4, requires: 'grapple' },
];
const RECRUITS = [
  { type: 'assassin', price: 2500 }, { type: 'axe', price: 10000 },
  { type: 'suit', price: 35000 }, { type: 'skinny', price: 80000 },
  { type: 'heavy', price: 180000 }, { type: 'spinner', price: 390000 },
  { type: 'grappler', price: 800000 }, { type: 'whip', price: 1500000 },
  { type: 'barbarian', price: 2900000 },
];

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function requestOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return '';
  const configured = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  const allowed = new Set([new URL(request.url).origin, 'https://localhost', 'capacitor://localhost', 'http://localhost', ...configured]);
  return allowed.has(origin) ? origin : null;
}

function withCors(response, origin) {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function accountDeletionPage() {
  const nonce = randomHex(16);
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>铁街格斗账号删除</title><style nonce="${nonce}">:root{color-scheme:dark;font-family:system-ui,"Microsoft YaHei",sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#050708;color:#ead9b8}.card{width:min(520px,100%);padding:28px;border:1px solid #805238;border-left:6px solid #8f3d25;background:#11181b}h1{margin-top:0}p,li{color:#b8c0bd;line-height:1.65}label{display:grid;gap:6px;margin:14px 0;font-weight:700}input,button{width:100%;padding:12px;font:inherit}input{border:1px solid #596a69;background:#05090b;color:#ffe0ad}button{margin-top:10px;border:1px solid #c86448;background:#7b291f;color:#fff1db;font-weight:800}button:disabled{opacity:.5}#status{min-height:24px;margin-top:14px}.ok{color:#84d39d}.error{color:#ff9a88}</style></head><body><main class="card"><h1>铁街格斗账号删除</h1><p>此页面可在不安装游戏的情况下永久删除账号。删除后将无法恢复。</p><ul><li>删除用户名、密码凭据和所有登录会话</li><li>删除关卡、资源、属性、技能、队友与排行榜记录</li><li>删除该账号提交的反馈和关卡校验记录</li></ul><form id="delete-form"><label>用户名<input id="username" autocomplete="username" minlength="3" maxlength="24" required></label><label>密码<input id="password" type="password" autocomplete="current-password" minlength="8" maxlength="64" required></label><button id="submit" type="submit">永久删除我的账号</button></form><p id="status" role="status"></p></main><script nonce="${nonce}">const form=document.querySelector('#delete-form'),button=document.querySelector('#submit'),status=document.querySelector('#status');form.addEventListener('submit',async event=>{event.preventDefault();if(!confirm('账号及全部游戏数据将永久删除，确定继续吗？'))return;button.disabled=true;status.className='';status.textContent='正在验证并删除……';try{const response=await fetch('/v1/account/delete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:document.querySelector('#username').value,password:document.querySelector('#password').value})}),result=await response.json();if(!response.ok||!result.ok)throw new Error(result.reason==='too-many-attempts'?'尝试次数过多，请15分钟后再试':result.reason==='login-failed'?'用户名或密码错误':'删除失败，请稍后重试');form.hidden=true;status.className='ok';status.textContent='账号及关联数据已永久删除。'}catch(error){status.className='error';status.textContent=error.message}finally{button.disabled=false}});</script></body></html>`;
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
    'content-security-policy': `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  } });
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validUsername(value) {
  return /^[a-z0-9_\u4e00-\u9fff]{3,24}$/u.test(value);
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 64;
}

function normalizeDisplayName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function validDisplayName(value) {
  return [...value].length >= 1 && [...value].length <= 12 && /^[\p{L}\p{N}_· -]+$/u.test(value);
}

function boundedInteger(value, maximum = 999999) {
  return Math.max(0, Math.min(maximum, Math.floor(Number(value) || 0)));
}

function strictBoundedInteger(value, maximum) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= maximum ? number : null;
}

function bitForIndex(index) {
  return 1 << index;
}

function randomUnit() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

function stageRewards(user, stage) {
  const gold = STAGE_ENEMY_COUNT * (8 + Math.floor(stage * 1.6)) + 28;
  const expectedChicken = (30 + boundedInteger(user.stat_hp, 9999) + boundedInteger(user.stat_atk, 9999)
    + boundedInteger(user.stat_def, 9999) + boundedInteger(user.ascend_level, 9999) * 3) * 0.08;
  const chickenWhole = Math.floor(expectedChicken);
  const chicken = Math.max(1, chickenWhole + (randomUnit() < expectedChicken - chickenWhole ? 1 : 0));
  const fruitChance = Math.min(0.18, 0.025 + stage * 0.002);
  let fruit = 1;
  for (let index = 1; index < STAGE_ENEMY_COUNT; index += 1) {
    if (randomUnit() < fruitChance) fruit += 1;
  }
  return { gold, chicken, fruit };
}

function minimumStageSeconds(stage, env) {
  const configured = Number(env.MIN_STAGE_SECONDS);
  if (Number.isFinite(configured) && configured >= 0) return Math.floor(configured);
  return Math.min(180, 45 + Math.max(0, stage - 1) * 3);
}

function bytesToHex(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

function constantTimeHexEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function hexToBytes(value) {
  const pairs = String(value).match(/.{2}/g);
  if (!pairs) throw new Error('Invalid hexadecimal value');
  return new Uint8Array(pairs.map(byte => parseInt(byte, 16)));
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
}

async function loginThrottleKey(request, username) {
  const source = request.headers.get('cf-connecting-ip') || 'unknown';
  return sha256(`login:${source}:${username}`);
}

async function loginIsThrottled(env, keyHash) {
  const row = await env.DB.prepare(
    'SELECT window_started_at, attempts FROM auth_throttle WHERE key_hash = ?',
  ).bind(keyHash).first();
  const now = Math.floor(Date.now() / 1000);
  return !!row && now - Number(row.window_started_at) < LOGIN_WINDOW_SECONDS && Number(row.attempts) >= LOGIN_MAX_FAILURES;
}

async function recordLoginFailure(env, keyHash) {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - LOGIN_WINDOW_SECONDS;
  await env.DB.prepare(`
    INSERT INTO auth_throttle (key_hash, window_started_at, attempts) VALUES (?, ?, 1)
    ON CONFLICT(key_hash) DO UPDATE SET
      window_started_at = CASE WHEN auth_throttle.window_started_at < ? THEN excluded.window_started_at ELSE auth_throttle.window_started_at END,
      attempts = CASE WHEN auth_throttle.window_started_at < ? THEN 1 ELSE auth_throttle.attempts + 1 END
  `).bind(keyHash, now, cutoff, cutoff).run();
}

async function passwordHash(password, saltHex, pepper, iterations = CURRENT_PASSWORD_ITERATIONS) {
  if (typeof pepper !== 'string' || pepper.length < 32) {
    throw new Error('PASSWORD_PEPPER is not configured');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${pepper}:${password}`),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: hexToBytes(saltHex),
    iterations,
  }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

function randomHex(byteLength) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function readBody(request) {
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 4096) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function publicUser(user, token) {
  return {
    allowed: true,
    ...(token ? { token } : {}),
    mode: user.mode === 'test' ? 'test' : 'normal',
    username: user.username,
    displayName: user.display_name || user.username,
    verifiedAt: new Date().toISOString(),
    recheckAfterSeconds: 6 * 60 * 60,
    offlineGraceSeconds: 0,
  };
}

function publicPlayer(user) {
  const bestStage = boundedInteger(user.best_stage, 99999);
  const skillMask = boundedInteger(user.skill_mask, (1 << SKILLS.length) - 1);
  const recruitMask = boundedInteger(user.recruit_mask, (1 << RECRUITS.length) - 1);
  const updatedAt = user.progress_updated_at || '';
  return {
    ok: true,
    displayName: user.display_name || user.username,
    bestStage,
    gold: boundedInteger(user.gold),
    chicken: boundedInteger(user.chicken),
    fruit: boundedInteger(user.fruit),
    stats: [boundedInteger(user.stat_hp, 9999), boundedInteger(user.stat_atk, 9999), boundedInteger(user.stat_def, 9999)],
    speed: boundedInteger(user.stat_spd, 9999),
    ascend: boundedInteger(user.ascend_level, 9999),
    skillMask,
    recruitMask,
    recruits: RECRUITS.filter((_, index) => (recruitMask & bitForIndex(index)) !== 0).map(item => item.type),
    progress: {
      v: 2,
      u: Date.parse(updatedAt) || 0,
      g: boundedInteger(user.gold),
      c: boundedInteger(user.chicken),
      f: boundedInteger(user.fruit),
      h: boundedInteger(user.stat_hp, 9999),
      a: boundedInteger(user.stat_atk, 9999),
      d: boundedInteger(user.stat_def, 9999),
      s: boundedInteger(user.stat_spd, 9999),
      x: boundedInteger(user.ascend_level, 9999),
      b: bestStage,
      q: bestStage + 1,
      m: skillMask,
      r: RECRUITS.filter((_, index) => (recruitMask & bitForIndex(index)) !== 0).map(item => item.type),
    },
    updatedAt,
  };
}

async function readPlayer(env, userId) {
  return env.DB.prepare(`
    SELECT id, username, mode, display_name, best_stage, gold, chicken, fruit,
      stat_hp, stat_atk, stat_def, stat_spd, ascend_level, skill_mask, recruit_mask,
      progress_updated_at FROM users WHERE id = ?
  `).bind(userId).first();
}

async function authenticate(request, env) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.enabled, u.mode, u.best_stage,
      u.gold, u.chicken, u.fruit, u.stat_hp, u.stat_atk, u.stat_def, u.stat_spd,
      u.ascend_level, u.skill_mask, u.recruit_mask, u.progress_blob,
      u.progress_updated_at, s.id AS session_id, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).bind(tokenHash).first();
  if (!user || user.enabled !== 1 || Date.parse(user.expires_at) <= Date.now()) return null;
  return user;
}

async function createSession(env, user) {
  // Hex is an opaque client token and avoids the failing base64 path in the
  // currently deployed Worker. Each SQL placeholder is bound independently.
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(sessionId, user.id, tokenHash, expiresAt, now, now).run();
  return publicUser(user, token);
}

async function register(request, env) {
  const body = await readBody(request);
  const username = normalizeUsername(body?.username);
  const password = body?.password;
  if (!validUsername(username) || !validPassword(password)) {
    return json({ allowed: false, reason: 'invalid-credentials' }, 400);
  }

  const settings = await env.DB.prepare(
    'SELECT registration_open, registration_mode FROM app_settings WHERE id = 1',
  ).first();
  if (!settings || settings.registration_open !== 1) {
    return json({ allowed: false, reason: 'registration-closed' }, 403);
  }
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  ).bind(username).first();
  if (existing) return json({ allowed: false, reason: 'username-taken' }, 409);

  const user = {
    id: crypto.randomUUID(),
    username,
    mode: settings.registration_mode === 'test' ? 'test' : 'normal',
  };
  const salt = randomHex(16);
  const hash = await passwordHash(password, salt, env.PASSWORD_PEPPER, CURRENT_PASSWORD_ITERATIONS);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO users (
        id, username, password_salt, password_hash, password_iterations, mode,
        created_at, updated_at, last_seen_at, client_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      user.username,
      salt,
      hash,
      CURRENT_PASSWORD_ITERATIONS,
      user.mode,
      now,
      now,
      now,
      String(body?.clientVersion || '').slice(0, 48),
    ).run();
  } catch (error) {
    if (/unique|constraint/i.test(String(error))) {
      return json({ allowed: false, reason: 'username-taken' }, 409);
    }
    throw error;
  }

  try {
    return json(await createSession(env, user), 201);
  } catch (error) {
    // Do not strand an unusable account when session creation fails.
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run().catch(() => {});
    throw error;
  }
}

async function login(request, env) {
  const body = await readBody(request);
  const username = normalizeUsername(body?.username);
  const password = body?.password;
  if (!validUsername(username) || !validPassword(password)) {
    return json({ allowed: false, reason: 'invalid-credentials' }, 400);
  }
  const throttleKey = await loginThrottleKey(request, username);
  if (await loginIsThrottled(env, throttleKey)) return json({ allowed: false, reason: 'too-many-attempts' }, 429);
  const user = await env.DB.prepare(`
    SELECT id, username, password_salt, password_hash, password_iterations, enabled, mode
    FROM users WHERE username = ?
  `).bind(username).first();
  if (!user) { await recordLoginFailure(env, throttleKey); return json({ allowed: false, reason: 'login-failed' }, 401); }
  const storedIterations = boundedInteger(user.password_iterations || LEGACY_PASSWORD_ITERATIONS, CURRENT_PASSWORD_ITERATIONS);
  const hash = await passwordHash(password, user.password_salt, env.PASSWORD_PEPPER, storedIterations);
  if (!constantTimeHexEqual(hash, user.password_hash)) { await recordLoginFailure(env, throttleKey); return json({ allowed: false, reason: 'login-failed' }, 401); }
  if (user.enabled !== 1) return json({ allowed: false, reason: 'disabled' }, 403);

  const now = new Date().toISOString();
  // Do not synchronously rehash legacy accounts here. The current Worker CPU
  // budget cannot complete the 600,000-round upgrade in the same request, so a
  // valid password would otherwise end in HTTP 500. Existing hashes are never
  // downgraded; new registrations still use CURRENT_PASSWORD_ITERATIONS. Move
  // legacy rehashing to a separately provisioned migration when more CPU is
  // available.
  await env.DB.prepare(`
    UPDATE users SET last_seen_at = ?, updated_at = ?, client_version = ? WHERE id = ?
  `).bind(now, now, String(body?.clientVersion || '').slice(0, 48), user.id).run();
  await env.DB.prepare('DELETE FROM auth_throttle WHERE key_hash = ?').bind(throttleKey).run();
  return json(await createSession(env, user));
}

async function verify(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ allowed: false, reason: 'invalid-session' }, 401);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(now, user.session_id),
    env.DB.prepare('UPDATE users SET last_seen_at = ?, updated_at = ? WHERE id = ?').bind(now, now, user.id),
  ]);
  return json(publicUser(user));
}

async function getPlayer(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  return json(publicPlayer(user));
}

async function savePlayer(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const displayName = normalizeDisplayName(body?.displayName || user.display_name || user.username);
  if (!validDisplayName(displayName)) return json({ ok: false, reason: 'invalid-display-name' }, 400);
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?')
    .bind(displayName, now, user.id).run();
  const fresh = await readPlayer(env, user.id);
  return json(publicPlayer(fresh));
}

async function upgradePlayer(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const hp = strictBoundedInteger(body?.hp, MAX_UPGRADES_PER_REQUEST);
  const atk = strictBoundedInteger(body?.atk, MAX_UPGRADES_PER_REQUEST);
  const def = strictBoundedInteger(body?.def, MAX_UPGRADES_PER_REQUEST);
  if (hp === null || atk === null || def === null || hp + atk + def < 1 || hp + atk + def > MAX_UPGRADES_PER_REQUEST) {
    return json({ ok: false, reason: 'invalid-upgrade' }, 400);
  }
  const cost = hp + atk + def;
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE users SET chicken = chicken - ?, stat_hp = stat_hp + ?, stat_atk = stat_atk + ?,
      stat_def = stat_def + ?, progress_updated_at = ?, updated_at = ?
    WHERE id = ? AND chicken >= ?
  `).bind(cost, hp, atk, def, now, now, user.id, cost).run();
  if (Number(result?.meta?.changes) !== 1) return json({ ok: false, reason: 'insufficient-chicken' }, 409);
  return json(publicPlayer(await readPlayer(env, user.id)));
}

function maskWithoutSkillAndDependents(mask, skillId) {
  const removed = new Set([skillId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const skill of SKILLS) {
      if (skill.requires && removed.has(skill.requires) && !removed.has(skill.id)) {
        removed.add(skill.id);
        changed = true;
      }
    }
  }
  return SKILLS.reduce((next, skill, index) => removed.has(skill.id) ? next & ~bitForIndex(index) : next, mask);
}

async function changeSkill(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const index = SKILLS.findIndex(item => item.id === body?.skillId);
  if (index < 0 || typeof body?.enabled !== 'boolean') return json({ ok: false, reason: 'invalid-skill' }, 400);
  const skill = SKILLS[index];
  const bit = bitForIndex(index);
  const currentMask = boundedInteger(user.skill_mask, (1 << SKILLS.length) - 1);
  const alreadyEnabled = (currentMask & bit) !== 0;
  if (!body.enabled) {
    if (user.mode !== 'test') return json({ ok: false, reason: 'skill-cannot-disable' }, 409);
    const nextMask = maskWithoutSkillAndDependents(currentMask, skill.id);
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE users SET skill_mask = ?, progress_updated_at = ?, updated_at = ? WHERE id = ?')
      .bind(nextMask, now, now, user.id).run();
    return json(publicPlayer(await readPlayer(env, user.id)));
  }
  if (alreadyEnabled) return json(publicPlayer(user));
  if (skill.requires) {
    const requiredIndex = SKILLS.findIndex(item => item.id === skill.requires);
    if ((currentMask & bitForIndex(requiredIndex)) === 0) return json({ ok: false, reason: 'skill-prerequisite' }, 409);
  }
  const cost = user.mode === 'test' ? 0 : skill.cost;
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE users SET fruit = fruit - ?, skill_mask = skill_mask | ?, progress_updated_at = ?, updated_at = ?
    WHERE id = ? AND fruit >= ? AND (skill_mask & ?) = 0
  `).bind(cost, bit, now, now, user.id, cost, bit).run();
  if (Number(result?.meta?.changes) !== 1) return json({ ok: false, reason: 'insufficient-fruit' }, 409);
  return json(publicPlayer(await readPlayer(env, user.id)));
}

async function recruitPlayer(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const index = RECRUITS.findIndex(item => item.type === body?.type);
  if (index < 0) return json({ ok: false, reason: 'invalid-recruit' }, 400);
  const recruit = RECRUITS[index];
  const bit = bitForIndex(index);
  if ((boundedInteger(user.recruit_mask) & bit) !== 0) return json(publicPlayer(user));
  const price = user.mode === 'test' ? 0 : recruit.price;
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE users SET gold = gold - ?, recruit_mask = recruit_mask | ?, progress_updated_at = ?, updated_at = ?
    WHERE id = ? AND gold >= ? AND (recruit_mask & ?) = 0
  `).bind(price, bit, now, now, user.id, price, bit).run();
  if (Number(result?.meta?.changes) !== 1) return json({ ok: false, reason: 'insufficient-gold' }, 409);
  return json(publicPlayer(await readPlayer(env, user.id)));
}

async function startStage(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const stage = boundedInteger(body?.stage, 100000);
  const expectedStage = boundedInteger(user.best_stage, 99999) + 1;
  if (stage !== expectedStage) {
    return json({ ok: false, reason: 'stage-not-next', expectedStage }, 409);
  }
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const rewards = stageRewards(user, stage);
  await env.DB.prepare(`
    INSERT INTO stage_runs (user_id, stage, token_hash, started_at, expires_at, reward_gold, reward_chicken, reward_fruit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET stage = excluded.stage, token_hash = excluded.token_hash,
      started_at = excluded.started_at, expires_at = excluded.expires_at,
      reward_gold = excluded.reward_gold, reward_chicken = excluded.reward_chicken, reward_fruit = excluded.reward_fruit
  `).bind(user.id, stage, tokenHash, now, now + STAGE_RUN_LIFETIME_SECONDS, rewards.gold, rewards.chicken, rewards.fruit).run();
  return json({ ok: true, stage, runToken: token, minimumSeconds: minimumStageSeconds(stage, env) });
}

async function completeStage(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const stage = boundedInteger(body?.stage, 100000);
  const runToken = String(body?.runToken || '');
  if (!/^[0-9a-f]{64}$/.test(runToken)) return json({ ok: false, reason: 'invalid-stage-run' }, 400);
  const tokenHash = await sha256(runToken);
  const receipt = await env.DB.prepare(`
    SELECT token_hash, reward_gold, reward_chicken, reward_fruit, completed_at
    FROM stage_completions WHERE user_id = ? AND stage = ?
  `).bind(user.id, stage).first();
  if (receipt && constantTimeHexEqual(receipt.token_hash, tokenHash)) {
    return json({
      ...publicPlayer(await readPlayer(env, user.id)),
      nextStage: boundedInteger(user.best_stage, 99999) + 1,
      rewards: { gold: receipt.reward_gold, chicken: receipt.reward_chicken, fruit: receipt.reward_fruit },
      replayedReceipt: true,
    });
  }
  const run = await env.DB.prepare(
    'SELECT stage, token_hash, started_at, expires_at, reward_gold, reward_chicken, reward_fruit FROM stage_runs WHERE user_id = ?',
  ).bind(user.id).first();
  const now = Math.floor(Date.now() / 1000);
  if (!run || Number(run.stage) !== stage || !constantTimeHexEqual(run.token_hash, tokenHash) || Number(run.expires_at) < now) {
    return json({ ok: false, reason: 'invalid-stage-run' }, 409);
  }
  const minimumSeconds = minimumStageSeconds(stage, env);
  const elapsedSeconds = Math.max(0, now - Number(run.started_at));
  if (elapsedSeconds < minimumSeconds) {
    return json({ ok: false, reason: 'stage-too-fast', retryAfter: minimumSeconds - elapsedSeconds }, 429);
  }
  if (stage !== boundedInteger(user.best_stage, 99999) + 1) {
    return json({ ok: false, reason: 'stage-not-next', expectedStage: boundedInteger(user.best_stage, 99999) + 1 }, 409);
  }
  const updatedAt = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(`
      UPDATE users SET best_stage = ?, gold = gold + ?, chicken = chicken + ?, fruit = fruit + ?,
        progress_updated_at = ?, updated_at = ? WHERE id = ? AND best_stage = ?
    `).bind(stage, boundedInteger(run.reward_gold), boundedInteger(run.reward_chicken), boundedInteger(run.reward_fruit), updatedAt, updatedAt, user.id, stage - 1),
    env.DB.prepare(`
      INSERT INTO stage_completions (
        user_id, stage, token_hash, reward_gold, reward_chicken, reward_fruit, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(user.id, stage, tokenHash, boundedInteger(run.reward_gold), boundedInteger(run.reward_chicken), boundedInteger(run.reward_fruit), updatedAt),
    env.DB.prepare('DELETE FROM stage_runs WHERE user_id = ?').bind(user.id),
  ]);
  if (Number(results?.[0]?.meta?.changes) !== 1) {
    return json({ ok: false, reason: 'stage-not-next', expectedStage: boundedInteger(user.best_stage, 99999) + 1 }, 409);
  }
  return json({
    ...publicPlayer(await readPlayer(env, user.id)),
    nextStage: stage + 1,
    rewards: { gold: boundedInteger(run.reward_gold), chicken: boundedInteger(run.reward_chicken), fruit: boundedInteger(run.reward_fruit) },
  });
}

async function deleteAccount(request, env) {
  const body = await readBody(request);
  const password = body?.password;
  if (!validPassword(password)) return json({ ok: false, reason: 'login-failed' }, 401);

  const sessionUser = await authenticate(request, env);
  const username = sessionUser?.username || normalizeUsername(body?.username);
  if (!validUsername(username)) return json({ ok: false, reason: 'login-failed' }, 401);
  const throttleKey = await loginThrottleKey(request, username);
  if (await loginIsThrottled(env, throttleKey)) return json({ ok: false, reason: 'too-many-attempts' }, 429);

  const user = await env.DB.prepare(`
    SELECT id, username, password_salt, password_hash, password_iterations, enabled
    FROM users WHERE username = ?
  `).bind(username).first();
  if (!user || user.enabled !== 1 || (sessionUser && sessionUser.id !== user.id)) {
    await recordLoginFailure(env, throttleKey);
    return json({ ok: false, reason: 'login-failed' }, 401);
  }
  const iterations = boundedInteger(user.password_iterations || LEGACY_PASSWORD_ITERATIONS, CURRENT_PASSWORD_ITERATIONS);
  const hash = await passwordHash(password, user.password_salt, env.PASSWORD_PEPPER, iterations);
  if (!constantTimeHexEqual(hash, user.password_hash)) {
    await recordLoginFailure(env, throttleKey);
    return json({ ok: false, reason: 'login-failed' }, 401);
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM feedback WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM stage_runs WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM stage_completions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM auth_throttle WHERE key_hash = ?').bind(throttleKey),
  ]);
  return json({ ok: true, deleted: true });
}

async function leaderboard(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const result = await env.DB.prepare(`
    SELECT COALESCE(NULLIF(display_name, ''), username) AS name, best_stage AS bestStage,
      stat_hp AS hp, stat_atk AS atk, stat_def AS def, skill_mask AS skillMask
    FROM users WHERE enabled = 1 AND best_stage > 0
    ORDER BY best_stage DESC, progress_updated_at ASC LIMIT 10
  `).all();
  return json({ ok: true, entries: result?.results || [] });
}

async function submitFeedback(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const category = ['bug', 'idea', 'other'].includes(body?.category) ? body.category : 'other';
  const content = String(body?.content || '').trim();
  if ([...content].length < 10 || [...content].length > 800) return json({ ok: false, reason: 'invalid-feedback' }, 400);
  const recent = await env.DB.prepare(
    "SELECT created_at FROM feedback WHERE user_id = ? AND datetime(created_at) > datetime('now', '-60 seconds') LIMIT 1",
  ).bind(user.id).first();
  if (recent) return json({ ok: false, reason: 'feedback-rate-limited' }, 429);
  await env.DB.prepare(`
    INSERT INTO feedback (id, user_id, category, content, stage, client_version, language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(), user.id, category, content, boundedInteger(body?.stage),
    String(body?.clientVersion || '').slice(0, 48), String(body?.language || '').slice(0, 16), new Date().toISOString(),
  ).run();
  return json({ ok: true }, 201);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/account-deletion') return accountDeletionPage();
    const origin = requestOrigin(request, env);
    if (origin === null) return json({ error: 'origin-not-allowed' }, 403);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204, headers: jsonHeaders }), origin);
    if (request.method !== 'POST') return withCors(json({ error: 'not-found' }, 404), origin);
    try {
      let response;
      if (path === '/v1/register') response = await register(request, env);
      else if (path === '/v1/login') response = await login(request, env);
      else if (path === '/v1/verify') response = await verify(request, env);
      else if (path === '/v1/player/get') response = await getPlayer(request, env);
      else if (path === '/v1/player/save') response = await savePlayer(request, env);
      else if (path === '/v1/player/upgrade') response = await upgradePlayer(request, env);
      else if (path === '/v1/player/skill') response = await changeSkill(request, env);
      else if (path === '/v1/player/recruit') response = await recruitPlayer(request, env);
      else if (path === '/v1/stage/start') response = await startStage(request, env);
      else if (path === '/v1/stage/complete') response = await completeStage(request, env);
      else if (path === '/v1/account/delete') response = await deleteAccount(request, env);
      else if (path === '/v1/leaderboard') response = await leaderboard(request, env);
      else if (path === '/v1/feedback') response = await submitFeedback(request, env);
      else response = json({ error: 'not-found' }, 404);
      return withCors(response, origin);
    } catch (error) {
      console.error(error);
      return withCors(json({ allowed: false, reason: 'server-error' }, 500), origin);
    }
  },
};
