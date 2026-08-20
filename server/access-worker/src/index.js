const LEGACY_PASSWORD_ITERATIONS = 10000;
const CURRENT_PASSWORD_ITERATIONS = 600000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PROGRESS_BYTES = 768;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_FAILURES = 5;
const STAGE_RUN_LIFETIME_SECONDS = 6 * 60 * 60;

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
  const allowed = new Set(['https://localhost', 'capacitor://localhost', 'http://localhost', ...configured]);
  return allowed.has(origin) ? origin : null;
}

function withCors(response, origin) {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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

async function authenticate(request, env) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.enabled, u.mode, u.best_stage,
      u.stat_hp, u.stat_atk, u.stat_def, u.skill_mask, u.progress_blob,
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
  if (storedIterations < CURRENT_PASSWORD_ITERATIONS) {
    const upgradedHash = await passwordHash(password, user.password_salt, env.PASSWORD_PEPPER, CURRENT_PASSWORD_ITERATIONS);
    await env.DB.prepare('UPDATE users SET password_hash = ?, password_iterations = ? WHERE id = ?')
      .bind(upgradedHash, CURRENT_PASSWORD_ITERATIONS, user.id).run();
  }
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
  let progress = null;
  try { progress = user.progress_blob ? JSON.parse(user.progress_blob) : null; } catch {}
  return json({
    ok: true,
    displayName: user.display_name || user.username,
    bestStage: boundedInteger(user.best_stage),
    stats: [boundedInteger(user.stat_hp, 9999), boundedInteger(user.stat_atk, 9999), boundedInteger(user.stat_def, 9999)],
    skillMask: boundedInteger(user.skill_mask, 4095),
    progress,
    updatedAt: user.progress_updated_at || '',
  });
}

async function savePlayer(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const displayName = normalizeDisplayName(body?.displayName || user.display_name || user.username);
  if (!validDisplayName(displayName)) return json({ ok: false, reason: 'invalid-display-name' }, 400);
  const bestStage = boundedInteger(user.best_stage);
  const submittedProgress = body?.progress && typeof body.progress === 'object' ? body.progress : {};
  const safeProgress = { ...submittedProgress, b: bestStage, q: Math.min(bestStage + 1, Math.max(1, boundedInteger(submittedProgress.q) || 1)) };
  const progressBlob = JSON.stringify(safeProgress);
  if (new TextEncoder().encode(progressBlob).length > MAX_PROGRESS_BYTES) {
    return json({ ok: false, reason: 'progress-too-large' }, 413);
  }
  const stats = Array.isArray(body?.stats) ? body.stats : [];
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE users SET display_name = ?, best_stage = ?, stat_hp = ?, stat_atk = ?, stat_def = ?,
      skill_mask = ?, progress_blob = ?, progress_updated_at = ?, updated_at = ? WHERE id = ?
  `).bind(
    displayName,
    bestStage,
    boundedInteger(stats[0], 9999),
    boundedInteger(stats[1], 9999),
    boundedInteger(stats[2], 9999),
    boundedInteger(body?.skillMask, 4095),
    progressBlob,
    now,
    now,
    user.id,
  ).run();
  return json({ ok: true, displayName, bestStage, updatedAt: now });
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
  await env.DB.prepare(`
    INSERT INTO stage_runs (user_id, stage, token_hash, started_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET stage = excluded.stage, token_hash = excluded.token_hash,
      started_at = excluded.started_at, expires_at = excluded.expires_at
  `).bind(user.id, stage, tokenHash, now, now + STAGE_RUN_LIFETIME_SECONDS).run();
  return json({ ok: true, stage, runToken: token, minimumSeconds: minimumStageSeconds(stage, env) });
}

async function completeStage(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, reason: 'invalid-session' }, 401);
  const body = await readBody(request);
  const stage = boundedInteger(body?.stage, 100000);
  const runToken = String(body?.runToken || '');
  if (!/^[0-9a-f]{64}$/.test(runToken)) return json({ ok: false, reason: 'invalid-stage-run' }, 400);
  const run = await env.DB.prepare(
    'SELECT stage, token_hash, started_at, expires_at FROM stage_runs WHERE user_id = ?',
  ).bind(user.id).first();
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await sha256(runToken);
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
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET best_stage = ?, progress_updated_at = ?, updated_at = ? WHERE id = ? AND best_stage = ?')
      .bind(stage, updatedAt, updatedAt, user.id, stage - 1),
    env.DB.prepare('DELETE FROM stage_runs WHERE user_id = ?').bind(user.id),
  ]);
  return json({ ok: true, bestStage: stage, nextStage: stage + 1, updatedAt });
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
    const origin = requestOrigin(request, env);
    if (origin === null) return json({ error: 'origin-not-allowed' }, 403);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204, headers: jsonHeaders }), origin);
    if (request.method !== 'POST') return withCors(json({ error: 'not-found' }, 404), origin);
    const path = new URL(request.url).pathname;
    try {
      let response;
      if (path === '/v1/register') response = await register(request, env);
      else if (path === '/v1/login') response = await login(request, env);
      else if (path === '/v1/verify') response = await verify(request, env);
      else if (path === '/v1/player/get') response = await getPlayer(request, env);
      else if (path === '/v1/player/save') response = await savePlayer(request, env);
      else if (path === '/v1/stage/start') response = await startStage(request, env);
      else if (path === '/v1/stage/complete') response = await completeStage(request, env);
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
