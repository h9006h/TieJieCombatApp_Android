CREATE TABLE IF NOT EXISTS stage_runs (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stage_runs_expires_at ON stage_runs(expires_at);
