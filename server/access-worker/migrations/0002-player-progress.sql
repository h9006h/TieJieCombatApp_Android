ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN best_stage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN stat_hp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN stat_atk INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN stat_def INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN skill_mask INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN progress_blob TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN progress_updated_at TEXT;

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
