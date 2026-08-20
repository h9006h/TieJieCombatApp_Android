-- Progression becomes server-authoritative. Existing account credentials and
-- sessions are preserved, but the single-user test progression is reset so no
-- previously client-supplied balances survive the trust-boundary change.
ALTER TABLE users ADD COLUMN gold INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN chicken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN fruit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN stat_spd INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN ascend_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN recruit_mask INTEGER NOT NULL DEFAULT 0;

ALTER TABLE stage_runs ADD COLUMN reward_gold INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stage_runs ADD COLUMN reward_chicken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stage_runs ADD COLUMN reward_fruit INTEGER NOT NULL DEFAULT 0;

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

UPDATE users SET
  best_stage = 0,
  stat_hp = 0,
  stat_atk = 0,
  stat_def = 0,
  skill_mask = 0,
  progress_blob = '',
  progress_updated_at = NULL,
  gold = 0,
  chicken = 0,
  fruit = 0,
  stat_spd = 0,
  ascend_level = 0,
  recruit_mask = 0;

DELETE FROM stage_runs;
