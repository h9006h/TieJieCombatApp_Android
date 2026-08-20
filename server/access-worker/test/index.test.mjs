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
    if (this.sql.includes('FROM stage_runs WHERE user_id')) {
      return this.db.stageRuns.get(this.values[0]) || null;
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
    if (this.sql.startsWith('INSERT INTO users')) {
      const [id, username, password_salt, password_hash, password_iterations, mode, created_at, updated_at, last_seen_at, client_version] = this.values;
      this.db.users.push({ id, username, password_salt, password_hash, password_iterations, enabled: 1, mode, created_at, updated_at, last_seen_at, client_version });
    } else if (this.sql.startsWith('INSERT INTO sessions')) {
      assert.equal(this.values.length, 6, 'session INSERT must bind all six values');
      const [id, user_id, token_hash, expires_at, created_at, last_seen_at] = this.values;
      assert.ok(this.db.users.some(user => user.id === user_id), 'session user must exist');
      this.db.sessions.push({ id, user_id, token_hash, expires_at, created_at, last_seen_at });
    } else if (this.sql.startsWith('DELETE FROM users')) {
      this.db.users = this.db.users.filter(user => user.id !== this.values[0]);
    } else if (this.sql.startsWith('UPDATE users SET display_name')) {
      const [display_name, best_stage, stat_hp, stat_atk, stat_def, skill_mask, progress_blob, progress_updated_at, updated_at, id] = this.values;
      Object.assign(this.db.users.find(user => user.id === id), { display_name, best_stage, stat_hp, stat_atk, stat_def, skill_mask, progress_blob, progress_updated_at, updated_at });
    } else if (this.sql.startsWith('UPDATE users SET best_stage')) {
      const [best_stage, progress_updated_at, updated_at, id, previousBestStage] = this.values;
      const user = this.db.users.find(item => item.id === id);
      if (user && (user.best_stage || 0) === previousBestStage) Object.assign(user, { best_stage, progress_updated_at, updated_at });
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
      const [user_id, stage, token_hash, started_at, expires_at] = this.values;
      this.db.stageRuns.set(user_id, { stage, token_hash, started_at, expires_at });
    } else if (this.sql.startsWith('DELETE FROM stage_runs')) {
      this.db.stageRuns.delete(this.values[0]);
    }
    return { success: true };
  }
}

class MemoryD1 {
  users = [];
  sessions = [];
  feedback = [];
  throttles = new Map();
  stageRuns = new Map();

  prepare(sql) {
    return new MemoryStatement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map(statement => statement.run()));
  }
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
  assert.equal(DB.users[0].password_iterations, 600000);
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

test('player progress stays compact while leaderboard stage requires a timed run', async () => {
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
  assert.deepEqual(playerData.stats, [3, 4, 5]);
  assert.deepEqual(playerData.progress, { ...progress, b: 0, q: 1 });
  assert.equal(playerData.bestStage, 0, 'generic progress save must not raise leaderboard stage');

  const started = await worker.fetch(new Request('https://example.test/v1/stage/start', {
    method: 'POST', headers, body: JSON.stringify({ stage: 1 }),
  }), env);
  const run = await started.json();
  assert.equal(run.ok, true);
  assert.equal(run.minimumSeconds, 45);

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
  assert.equal((await completed.json()).bestStage, 1);

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
