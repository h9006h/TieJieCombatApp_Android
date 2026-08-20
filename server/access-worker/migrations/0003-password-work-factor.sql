-- Existing hashes were generated with 10,000 iterations. Successful logins
-- automatically upgrade each account to the current work factor.
ALTER TABLE users ADD COLUMN password_iterations INTEGER NOT NULL DEFAULT 10000;
