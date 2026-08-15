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
    return null;
  }

  async run() {
    if (this.sql.startsWith('INSERT INTO users')) {
      const [id, username, password_salt, password_hash, mode, created_at, updated_at, last_seen_at, client_version] = this.values;
      this.db.users.push({ id, username, password_salt, password_hash, enabled: 1, mode, created_at, updated_at, last_seen_at, client_version });
    } else if (this.sql.startsWith('INSERT INTO sessions')) {
      assert.equal(this.values.length, 6, 'session INSERT must bind all six values');
      const [id, user_id, token_hash, expires_at, created_at, last_seen_at] = this.values;
      assert.ok(this.db.users.some(user => user.id === user_id), 'session user must exist');
      this.db.sessions.push({ id, user_id, token_hash, expires_at, created_at, last_seen_at });
    } else if (this.sql.startsWith('DELETE FROM users')) {
      this.db.users = this.db.users.filter(user => user.id !== this.values[0]);
    }
    return { success: true };
  }
}

class MemoryD1 {
  users = [];
  sessions = [];

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
  assert.equal(DB.sessions.length, 1);

  const verification = await worker.fetch(new Request('https://example.test/v1/verify', {
    method: 'POST',
    headers: { authorization: `Bearer ${grant.token}` },
  }), { DB, PASSWORD_PEPPER });
  const verified = await verification.json();
  assert.equal(verification.status, 200);
  assert.equal(verified.allowed, true);
  assert.equal(verified.username, 'codex_probe');
});
