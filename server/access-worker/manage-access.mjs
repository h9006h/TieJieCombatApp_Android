import { execFileSync } from 'node:child_process';

const database = 'tiejie-access';
const [command, username, value] = process.argv.slice(2);

function usage(message = '') {
  if (message) console.error(message);
  console.error(`Usage:
  node manage-access.mjs list
  node manage-access.mjs leaderboard
  node manage-access.mjs feedback
  node manage-access.mjs disable <username>
  node manage-access.mjs enable <username>
  node manage-access.mjs mode <username> <test|normal>
  node manage-access.mjs registration <test|normal|closed>
  node manage-access.mjs purge-test --confirm`);
  process.exit(1);
}

function sqlString(input) {
  return `'${String(input).replaceAll("'", "''")}'`;
}

function normalizedUsername(input) {
  const normalized = String(input || '').trim().normalize('NFKC').toLowerCase();
  if (normalized.length < 3 || normalized.length > 24) usage('用户名必须为 3–24 位。');
  return normalized;
}

function execute(sql) {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(executable, [
    'wrangler', 'd1', 'execute', database, '--remote', '--command', sql,
  ], { stdio: 'inherit', cwd: new URL('.', import.meta.url) });
}

const now = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

switch (command) {
  case 'list':
    execute(`SELECT username, enabled, mode, created_at, last_seen_at
      FROM users ORDER BY created_at DESC;`);
    break;
  case 'leaderboard':
    execute(`SELECT COALESCE(NULLIF(display_name, ''), username) AS name, best_stage,
      stat_hp, stat_atk, stat_def, skill_mask, progress_updated_at
      FROM users WHERE enabled = 1 AND best_stage > 0
      ORDER BY best_stage DESC, progress_updated_at ASC LIMIT 10;`);
    break;
  case 'feedback':
    execute(`SELECT f.created_at, u.username, f.category, f.stage, f.language,
      f.client_version, f.content FROM feedback f JOIN users u ON u.id = f.user_id
      ORDER BY f.created_at DESC LIMIT 50;`);
    break;
  case 'disable':
  case 'enable': {
    const name = normalizedUsername(username);
    const enabled = command === 'enable' ? 1 : 0;
    execute(`${enabled ? '' : `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username = ${sqlString(name)});`}
      UPDATE users SET enabled = ${enabled}, updated_at = ${now}
      WHERE username = ${sqlString(name)};`);
    break;
  }
  case 'mode': {
    const name = normalizedUsername(username);
    if (!['test', 'normal'].includes(value)) usage('账号模式只能是 test 或 normal。');
    execute(`UPDATE users SET mode = ${sqlString(value)}, updated_at = ${now}
      WHERE username = ${sqlString(name)};`);
    break;
  }
  case 'registration':
    if (!['test', 'normal', 'closed'].includes(username)) {
      usage('注册策略只能是 test、normal 或 closed。');
    }
    execute(`INSERT INTO app_settings (id, registration_open, registration_mode, updated_at)
      VALUES (1, ${username === 'closed' ? 0 : 1}, ${sqlString(username === 'closed' ? 'test' : username)}, ${now})
      ON CONFLICT(id) DO UPDATE SET
        registration_open = excluded.registration_open,
        registration_mode = excluded.registration_mode,
        updated_at = excluded.updated_at;`);
    break;
  case 'purge-test':
    if (username !== '--confirm') usage('删除测试账号必须显式追加 --confirm。');
    execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE mode = 'test'); DELETE FROM users WHERE mode = 'test';");
    break;
  default:
    usage();
}
