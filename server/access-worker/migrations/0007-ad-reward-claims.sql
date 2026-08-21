CREATE TABLE IF NOT EXISTS ad_reward_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  grant_key TEXT NOT NULL,
  placement TEXT NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_chicken INTEGER NOT NULL DEFAULT 0,
  reward_fruit INTEGER NOT NULL DEFAULT 0,
  test_mode INTEGER NOT NULL DEFAULT 0 CHECK (test_mode IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'expired')),
  transaction_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  granted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_reward_grant_once
ON ad_reward_claims(user_id, grant_key);

CREATE INDEX IF NOT EXISTS idx_ad_reward_user_created
ON ad_reward_claims(user_id, created_at DESC);
