PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  registration_open INTEGER NOT NULL DEFAULT 1 CHECK (registration_open IN (0, 1)),
  registration_mode TEXT NOT NULL DEFAULT 'test' CHECK (registration_mode IN ('test', 'normal')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 10000,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  mode TEXT NOT NULL CHECK (mode IN ('test', 'normal')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,
  client_version TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  best_stage INTEGER NOT NULL DEFAULT 0,
  stat_hp INTEGER NOT NULL DEFAULT 0,
  stat_atk INTEGER NOT NULL DEFAULT 0,
  stat_def INTEGER NOT NULL DEFAULT 0,
  skill_mask INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  chicken INTEGER NOT NULL DEFAULT 0,
  fruit INTEGER NOT NULL DEFAULT 0,
  stat_spd INTEGER NOT NULL DEFAULT 0,
  ascend_level INTEGER NOT NULL DEFAULT 0,
  recruit_mask INTEGER NOT NULL DEFAULT 0,
  progress_blob TEXT NOT NULL DEFAULT '',
  progress_updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_leaderboard ON users(enabled, best_stage DESC, progress_updated_at ASC);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'other')),
  content TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0,
  client_version TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_throttle (
  key_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_runs (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_chicken INTEGER NOT NULL DEFAULT 0,
  reward_fruit INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stage_runs_expires_at ON stage_runs(expires_at);

CREATE TABLE IF NOT EXISTS stage_completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  reward_gold INTEGER NOT NULL,
  reward_chicken INTEGER NOT NULL,
  reward_fruit INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, stage)
);

INSERT INTO app_settings (id, registration_open, registration_mode, updated_at)
VALUES (1, 1, 'test', CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;
