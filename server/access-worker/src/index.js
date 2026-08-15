const PASSWORD_ITERATIONS = 10000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
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

function bytesToHex(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
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

async function passwordHash(password, saltHex, pepper) {
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
    iterations: PASSWORD_ITERATIONS,
  }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

function randomHex(byteLength) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function readBody(request) {
  try {
    return await request.json();
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
    verifiedAt: new Date().toISOString(),
    recheckAfterSeconds: 6 * 60 * 60,
    offlineGraceSeconds: 24 * 60 * 60,
  };
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
  const hash = await passwordHash(password, salt, env.PASSWORD_PEPPER);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO users (
        id, username, password_salt, password_hash, mode,
        created_at, updated_at, last_seen_at, client_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      user.username,
      salt,
      hash,
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
  const user = await env.DB.prepare(`
    SELECT id, username, password_salt, password_hash, enabled, mode
    FROM users WHERE username = ?
  `).bind(username).first();
  if (!user) return json({ allowed: false, reason: 'login-failed' }, 401);
  const hash = await passwordHash(password, user.password_salt, env.PASSWORD_PEPPER);
  if (hash !== user.password_hash) return json({ allowed: false, reason: 'login-failed' }, 401);
  if (user.enabled !== 1) return json({ allowed: false, reason: 'disabled' }, 403);

  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE users SET last_seen_at = ?, updated_at = ?, client_version = ? WHERE id = ?
  `).bind(now, now, String(body?.clientVersion || '').slice(0, 48), user.id).run();
  return json(await createSession(env, user));
}

async function verify(request, env) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return json({ allowed: false, reason: 'invalid-session' }, 401);
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.enabled, u.mode, s.id AS session_id, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).bind(tokenHash).first();
  if (!user || Date.parse(user.expires_at) <= Date.now()) {
    return json({ allowed: false, reason: 'invalid-session' }, 401);
  }
  if (user.enabled !== 1) return json({ allowed: false, reason: 'disabled' }, 403);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(now, user.session_id),
    env.DB.prepare('UPDATE users SET last_seen_at = ?, updated_at = ? WHERE id = ?').bind(now, now, user.id),
  ]);
  return json(publicUser(user));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders });
    if (request.method !== 'POST') return json({ error: 'not-found' }, 404);
    const path = new URL(request.url).pathname;
    try {
      if (path === '/v1/register') return await register(request, env);
      if (path === '/v1/login') return await login(request, env);
      if (path === '/v1/verify') return await verify(request, env);
      return json({ error: 'not-found' }, 404);
    } catch (error) {
      console.error(error);
      return json({ allowed: false, reason: 'server-error' }, 500);
    }
  },
};
