import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

class MemoryStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    if (this.sql.includes('FROM auth_throttle WHERE key_hash')) {
      return this.db.throttles.get(this.values[0]) || null;
    }
    if (this.sql.includes('FROM app_settings')) {
      return { registration_open: 1, registration_mode: 'test' };
    }
    if (this.sql.includes('SELECT id FROM users')) {
      return this.db.users.find(user => user.username === this.values[0]) || null;
    }
    if (this.sql.includes('password_salt')) {
      return this.db.users.find(user => user.username === this.values[0]) || null;
    }
    if (this.sql.includes('FROM sessions s JOIN users u')) {
      const session = this.db.sessions.find(item => item.token_hash === this.values[0]);
      const user = session && this.db.users.find(item => item.id === session.user_id);
      return session && user ? { ...user, session_id: session.id, expires_at: session.expires_at } : null;
    }
    if (this.sql.includes('FROM users WHERE id = ?')) {
      return this.db.users.find(user => user.id === this.values[0]) || null;
    }
    if (this.sql.includes('FROM stage_runs WHERE user_id')) {
      return this.db.stageRuns.get(this.values[0]) || null;
    }
    if (this.sql.includes('FROM stage_completions WHERE user_id')) {
      return this.db.stageCompletions.get(`${this.values[0]}:${this.values[1]}`) || null;
    }
    if (this.sql.includes('FROM feedback WHERE user_id')) {
      return null;
    }
    return null;
  }

  async all() {
    if (this.sql.includes('FROM users WHERE enabled = 1 AND best_stage > 0')) {
      return { results: this.db.users.filter(user => user.enabled === 1 && user.best_stage > 0).sort((a, b) => b.best_stage - a.best_stage).slice(0, 10).map(user => ({ name: user.display_name || user.username, bestStage: user.best_stage, hp: user.stat_hp, atk: user.stat_atk, def: user.stat_def, skillMask: user.skill_mask })) };
    }
    return { results: [] };
  }

  async run() {
    let changes = 1;
    if (this.sql.startsWith('INSERT INTO users')) {
      const [id, username, password_salt, password_hash, password_iterations, mode, created_at, updated_at, last_seen_at, client_version] = this.values;
      this.db.users.push({ id, username, password_salt, password_hash, password_iterations, enabled: 1, mode, created_at, updated_at, last_seen_at, client_version, display_name: '', best_stage: 0, gold: 0, chicken: 0, fruit: 0, stat_hp: 0, stat_atk: 0, stat_def: 0, stat_spd: 0, ascend_level: 0, skill_mask: 0, recruit_mask: 0, progress_updated_at: null });
    } else if (this.sql.startsWith('INSERT INTO sessions')) {
      assert.equal(this.values.length, 6, 'session INSERT must bind all six values');
      const [id, user_id, token_hash, expires_at, created_at, last_seen_at] = this.values;
      assert.ok(this.db.users.some(user => user.id === user_id), 'session user must exist');
      this.db.sessions.push({ id, user_id, token_hash, expires_at, created_at, last_seen_at });
    } else if (this.sql.startsWith('DELETE FROM feedback')) {
      this.db.feedback = this.db.feedback.filter(item => item.user_id !== this.values[0]);
    } else if (this.sql.startsWith('DELETE FROM sessions')) {
      this.db.sessions = this.db.sessions.filter(item => item.user_id !== this.values[0]);
    } else if (this.sql.startsWith('DELETE FROM users')) {
      this.db.users = this.db.users.filter(user => user.id !== this.values[0]);
    } else if (this.sql.startsWith('UPDATE users SET display_name')) {
      const [display_name, updated_at, id] = this.values;
      Object.assign(this.db.users.find(user => user.id === id), { display_name, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET chicken')) {
      const [cost, hp, atk, def, progress_updated_at, updated_at, id, requiredChicken] = this.values;
      const user = this.db.users.find(item => item.id === id);
      if (!user || user.chicken < requiredChicken) changes = 0;
      else Object.assign(user, { chicken: user.chicken - cost, stat_hp: user.stat_hp + hp, stat_atk: user.stat_atk + atk, stat_def: user.stat_def + def, progress_updated_at, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET fruit')) {
      const [cost, bit, progress_updated_at, updated_at, id, requiredFruit] = this.values;
      const user = this.db.users.find(item => item.id === id);
      if (!user || user.fruit < requiredFruit || (user.skill_mask & bit) !== 0) changes = 0;
      else Object.assign(user, { fruit: user.fruit - cost, skill_mask: user.skill_mask | bit, progress_updated_at, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET skill_mask =')) {
      const [skill_mask, progress_updated_at, updated_at, id] = this.values;
      Object.assign(this.db.users.find(user => user.id === id), { skill_mask, progress_updated_at, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET gold')) {
      const [price, bit, progress_updated_at, updated_at, id, requiredGold] = this.values;
      const user = this.db.users.find(item => item.id === id);
      if (!user || user.gold < requiredGold || (user.recruit_mask & bit) !== 0) changes = 0;
      else Object.assign(user, { gold: user.gold - price, recruit_mask: user.recruit_mask | bit, progress_updated_at, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET best_stage')) {
      const [best_stage, rewardGold, rewardChicken, rewardFruit, progress_updated_at, updated_at, id, previousBestStage] = this.values;
      const user = this.db.users.find(item => item.id === id);
      if (user && (user.best_stage || 0) === previousBestStage) Object.assign(user, { best_stage, gold: user.gold + rewardGold, chicken: user.chicken + rewardChicken, fruit: user.fruit + rewardFruit, progress_updated_at, updated_at });
      else changes = 0;
    } else if (this.sql.startsWith('UPDATE users SET password_hash')) {
      const [password_hash, password_iterations, id] = this.values;
      Object.assign(this.db.users.find(user => user.id === id), { password_hash, password_iterations });
    } else if (this.sql.startsWith('INSERT INTO feedback')) {
      const [id, user_id, category, content, stage, client_version, language, created_at] = this.values;
      this.db.feedback.push({ id, user_id, category, content, stage, client_version, language, created_at });
    } else if (this.sql.startsWith('INSERT INTO auth_throttle')) {
      const [key_hash, now, cutoff] = this.values;
      const current = this.db.throttles.get(key_hash);
      this.db.throttles.set(key_hash, !current || current.window_started_at < cutoff ? { window_started_at: now, attempts: 1 } : { ...current, attempts: current.attempts + 1 });
    } else if (this.sql.startsWith('DELETE FROM auth_throttle')) {
      this.db.throttles.delete(this.values[0]);
    } else if (this.sql.startsWith('INSERT INTO stage_runs')) {
      const [user_id, stage, token_hash, started_at, expires_at, reward_gold, reward_chicken, reward_fruit] = this.values;
      this.db.stageRuns.set(user_id, { stage, token_hash, started_at, expires_at, reward_gold, reward_chicken, reward_fruit });
    } else if (this.sql.startsWith('INSERT INTO stage_completions')) {
      const [user_id, stage, token_hash, reward_gold, reward_chicken, reward_fruit, completed_at] = this.values;
      this.db.stageCompletions.set(`${user_id}:${stage}`, { token_hash, reward_gold, reward_chicken, reward_fruit, completed_at });
    } else if (this.sql.startsWith('DELETE FROM stage_runs')) {
      this.db.stageRuns.delete(this.values[0]);
    } else if (this.sql.startsWith('DELETE FROM stage_completions')) {
      for (const key of this.db.stageCompletions.keys()) if (key.startsWith(`${this.values[0]}:`)) this.db.stageCompletions.delete(key);
    }
    return { success: true, meta: { changes } };
  }
}

class MemoryD1 {
  users = [];
  sessions = [];
  feedback = [];
  throttles = new Map();
  stageRuns = new Map();
  stageCompletions = new Map();

  prepare(sql) {
    return new MemoryStatement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map(statement => statement.run()));
  }
}

async function testPasswordHash(password, saltHex, pepper, iterations) {
  const salt = new Uint8Array(String(saltHex).match(/.{2}/g).map(byte => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(`${pepper}:${password}`), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return [...new Uint8Array(bits)].map(value => value.toString(16).padStart(2, '0')).join('');
}

test('register creates a verifiable session using the production schema', async () => {
  const DB = new MemoryD1();
  const PASSWORD_PEPPER = 'test-only-pepper-with-at-least-32-characters';
  const registration = await worker.fetch(new Request('https://example.test/v1/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'codex_probe', password: 'safe-test-password', clientVersion: 'test' }),
  }), { DB, PASSWORD_PEPPER });
  const grant = await registration.json();

  assert.equal(registration.status, 201);
  assert.equal(grant.allowed, true);
  assert.equal(grant.mode, 'test');
  assert.match(grant.token, /^[0-9a-f]{64}$/);
  assert.equal(DB.users.length, 1);
  assert.equal(DB.users[0].password_iterations, 10000);
  assert.equal(DB.sessions.length, 1);

  const verification = await worker.fetch(new Request('https://example.test/v1/verify', {
    method: 'POST',
    headers: { authorization: `Bearer ${grant.token}` },
  }), { DB, PASSWORD_PEPPER });
  const verified = await verification.json();
  assert.equal(verification.status, 200);
  assert.equal(verified.allowed, true);
  assert.equal(verified.username, 'codex_probe');

  const login = await worker.fetch(new Request('https://example.test/v1/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'codex_probe', password: 'safe-test-password' }),
  }), { DB, PASSWORD_PEPPER });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).allowed, true);
});

test('a valid legacy password logs in without a synchronous work-factor upgrade', async () => {
  const DB = new MemoryD1();
  const PASSWORD_PEPPER = 'test-only-pepper-with-at-least-32-characters';
  const password = 'safe-test-password';
  const password_salt = '00112233445566778899aabbccddeeff';
  DB.users.push({
    id: 'legacy-user', username: 'legacy_probe', password_salt,
    password_hash: await testPasswordHash(password, password_salt, PASSWORD_PEPPER, 10000),
    password_iterations: 10000, enabled: 1, mode: 'test',
  });

  const response = await worker.fetch(new Request('https://example.test/v1/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'legacy_probe', password }),
  }), { DB, PASSWORD_PEPPER });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).allowed, true);
  assert.equal(DB.users[0].password_iterations, 10000, 'legacy hash must not be downgraded or synchronously rehashed');
  assert.equal(DB.sessions.length, 1);
});

test('client saves cannot overwrite authoritative progression and a timed run awards server rewards once', async () => {
  const DB = new MemoryD1();
  const env = { DB, PASSWORD_PEPPER: 'test-only-pepper-with-at-least-32-characters' };
  const registration = await worker.fetch(new Request('https://example.test/v1/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'rank_probe', password: 'safe-test-password' }),
  }), env);
  const { token } = await registration.json();
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
  const progress = { v: 1, u: 42, g: 5, c: 2, f: 1, h: 3, a: 4, d: 5, b: 12, q: 13, m: 5 };
  const saved = await worker.fetch(new Request('https://example.test/v1/player/save', {
    method: 'POST', headers, body: JSON.stringify({ displayName: '荒铁', bestStage: 12, stats: [3, 4, 5], skillMask: 5, progress }),
  }), env);
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).ok, true);

  const player = await worker.fetch(new Request('https://example.test/v1/player/get', { method: 'POST', headers }), env);
  const playerData = await player.json();
  assert.equal(playerData.displayName, '荒铁');
  assert.deepEqual(playerData.stats, [0, 0, 0]);
  assert.equal(playerData.gold, 0);
  assert.equal(playerData.chicken, 0);
  assert.equal(playerData.fruit, 0);
  assert.equal(playerData.skillMask, 0);
  assert.deepEqual(playerData.progress, { v: 2, u: 0, g: 0, c: 0, f: 0, h: 0, a: 0, d: 0, s: 0, x: 0, b: 0, q: 1, m: 0, r: [] });
  assert.equal(playerData.bestStage, 0, 'generic progress save must not raise leaderboard stage');

  const started = await worker.fetch(new Request('https://example.test/v1/stage/start', {
    method: 'POST', headers, body: JSON.stringify({ stage: 1 }),
  }), env);
  const run = await started.json();
  assert.equal(run.ok, true);
  assert.equal(run.minimumSeconds, 15);

  const tooFast = await worker.fetch(new Request('https://example.test/v1/stage/complete', {
    method: 'POST', headers, body: JSON.stringify({ stage: 1, runToken: run.runToken }),
  }), env);
  assert.equal(tooFast.status, 429);
  assert.equal((await tooFast.json()).reason, 'stage-too-fast');

  DB.stageRuns.get(DB.users[0].id).started_at -= 46;
  const completed = await worker.fetch(new Request('https://example.test/v1/stage/complete', {
    method: 'POST', headers, body: JSON.stringify({ stage: 1, runToken: run.runToken }),
  }), env);
  assert.equal(completed.status, 200);
  const completion = await completed.json();
  assert.equal(completion.bestStage, 1);
  assert.ok(completion.rewards.gold > 0);
  assert.equal(completion.gold, completion.rewards.gold);
  assert.equal(completion.chicken, completion.rewards.chicken);
  assert.equal(completion.fruit, completion.rewards.fruit);

  const retried = await worker.fetch(new Request('https://example.test/v1/stage/complete', {
    method: 'POST', headers, body: JSON.stringify({ stage: 1, runToken: run.runToken }),
  }), env);
  const retriedData = await retried.json();
  assert.equal(retried.status, 200);
  assert.equal(retriedData.replayedReceipt, true);
  assert.equal(retriedData.gold, completion.gold, 'retry must not duplicate stage rewards');

  const ranking = await worker.fetch(new Request('https://example.test/v1/leaderboard', { method: 'POST', headers }), env);
  const rankData = await ranking.json();
  assert.equal(rankData.entries.length, 1);
  assert.equal(rankData.entries[0].bestStage, 1);

  const feedback = await worker.fetch(new Request('https://example.test/v1/feedback', {
    method: 'POST', headers, body: JSON.stringify({ category: 'bug', content: 'Stage 12 enemy became stuck in the wall.', stage: 12, language: 'en' }),
  }), env);
  assert.equal(feedback.status, 201);
  assert.equal(DB.feedback.length, 1);
});

test('upgrades, skills, and recruits are validated and spent atomically by the server', async () => {
  const DB = new MemoryD1();
  const env = { DB, PASSWORD_PEPPER: 'test-only-pepper-with-at-least-32-characters' };
  const registration = await worker.fetch(new Request('https://example.test/v1/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'economy_probe', password: 'safe-test-password' }),
  }), env);
  const { token } = await registration.json();
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
  Object.assign(DB.users[0], { mode: 'normal', chicken: 3, fruit: 3, gold: 2500 });

  const rejectedUpgrade = await worker.fetch(new Request('https://example.test/v1/player/upgrade', {
    method: 'POST', headers, body: JSON.stringify({ hp: 4, atk: 0, def: 0 }),
  }), env);
  assert.equal(rejectedUpgrade.status, 409);
  assert.equal(DB.users[0].chicken, 3);

  const upgraded = await worker.fetch(new Request('https://example.test/v1/player/upgrade', {
    method: 'POST', headers, body: JSON.stringify({ hp: 1, atk: 1, def: 1 }),
  }), env);
  const upgradedData = await upgraded.json();
  assert.equal(upgraded.status, 200);
  assert.equal(upgradedData.chicken, 0);
  assert.deepEqual(upgradedData.stats, [1, 1, 1]);

  const missingPrerequisite = await worker.fetch(new Request('https://example.test/v1/player/skill', {
    method: 'POST', headers, body: JSON.stringify({ skillId: 'legFlame', enabled: true }),
  }), env);
  assert.equal(missingPrerequisite.status, 409);
  assert.equal((await missingPrerequisite.json()).reason, 'skill-prerequisite');

  const legArts = await worker.fetch(new Request('https://example.test/v1/player/skill', {
    method: 'POST', headers, body: JSON.stringify({ skillId: 'legArts', enabled: true }),
  }), env);
  assert.equal(legArts.status, 200);
  assert.equal((await legArts.json()).fruit, 2);
  const legFlame = await worker.fetch(new Request('https://example.test/v1/player/skill', {
    method: 'POST', headers, body: JSON.stringify({ skillId: 'legFlame', enabled: true }),
  }), env);
  assert.equal(legFlame.status, 200);
  assert.equal((await legFlame.json()).fruit, 0);

  const recruited = await worker.fetch(new Request('https://example.test/v1/player/recruit', {
    method: 'POST', headers, body: JSON.stringify({ type: 'assassin' }),
  }), env);
  const recruitedData = await recruited.json();
  assert.equal(recruited.status, 200);
  assert.equal(recruitedData.gold, 0);
  assert.deepEqual(recruitedData.recruits, ['assassin']);
});

test('CORS only accepts the bundled Capacitor origin or configured origins', async () => {
  const rejected = await worker.fetch(new Request('https://example.test/v1/verify', {
    method: 'POST', headers: { origin: 'https://evil.example' },
  }), {});
  assert.equal(rejected.status, 403);

  const preflight = await worker.fetch(new Request('https://example.test/v1/verify', {
    method: 'OPTIONS', headers: { origin: 'https://localhost' },
  }), {});
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://localhost');

  const configured = await worker.fetch(new Request('https://example.test/v1/verify', {
    method: 'OPTIONS', headers: { origin: 'https://game.example' },
  }), { ALLOWED_ORIGINS: 'https://game.example' });
  assert.equal(configured.headers.get('access-control-allow-origin'), 'https://game.example');
});

test('login is throttled after five failures for the same source and username', async () => {
  const DB = new MemoryD1();
  const env = { DB, PASSWORD_PEPPER: 'test-only-pepper-with-at-least-32-characters' };
  await worker.fetch(new Request('https://example.test/v1/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'throttle_probe', password: 'safe-test-password' }),
  }), env);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const failed = await worker.fetch(new Request('https://example.test/v1/login', {
      method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.8' },
      body: JSON.stringify({ username: 'throttle_probe', password: 'wrong-password' }),
    }), env);
    assert.equal(failed.status, 401);
  }
  const blocked = await worker.fetch(new Request('https://example.test/v1/login', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.8' },
    body: JSON.stringify({ username: 'throttle_probe', password: 'wrong-password' }),
  }), env);
  assert.equal(blocked.status, 429);
  assert.equal((await blocked.json()).reason, 'too-many-attempts');
});

test('account deletion requires the password and removes all associated data', async () => {
  const DB = new MemoryD1();
  const env = { DB, PASSWORD_PEPPER: 'test-only-pepper-with-at-least-32-characters' };
  const registration = await worker.fetch(new Request('https://example.test/v1/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'delete_probe', password: 'safe-test-password' }),
  }), env);
  const { token } = await registration.json();
  const userId = DB.users[0].id;
  DB.feedback.push({ id: 'feedback-1', user_id: userId });
  DB.stageRuns.set(userId, { stage: 1 });
  DB.stageCompletions.set(`${userId}:1`, { stage: 1 });

  const rejected = await worker.fetch(new Request('https://example.test/v1/account/delete', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ password: 'wrong-password' }),
  }), env);
  assert.equal(rejected.status, 401);
  assert.equal(DB.users.length, 1);

  const deleted = await worker.fetch(new Request('https://example.test/v1/account/delete', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ password: 'safe-test-password' }),
  }), env);
  assert.equal(deleted.status, 200);
  assert.deepEqual(await deleted.json(), { ok: true, deleted: true });
  assert.equal(DB.users.length, 0);
  assert.equal(DB.sessions.length, 0);
  assert.equal(DB.feedback.length, 0);
  assert.equal(DB.stageRuns.size, 0);
  assert.equal(DB.stageCompletions.size, 0);
});

test('public account deletion page works without the app and same-origin requests are accepted', async () => {
  const page = await worker.fetch(new Request('https://example.test/account-deletion'), {});
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(await page.text(), /避难所格斗账号删除/);

  const preflight = await worker.fetch(new Request('https://example.test/v1/account/delete', {
    method: 'OPTIONS', headers: { origin: 'https://example.test' },
  }), {});
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://example.test');
});
