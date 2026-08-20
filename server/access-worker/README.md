# TieJie Access Worker

铁街格斗登录与授权服务，部署到 Cloudflare Workers，使用 D1 数据库 `tiejie-access`。

## 本地准备

```powershell
npm install
npx wrangler login
npx wrangler d1 execute tiejie-access --remote --file schema.sql
```

已存在的数据库升级到玩家进度版本时，只执行一次：

```powershell
npx wrangler d1 execute tiejie-access --remote --file migrations/0002-player-progress.sql
npx wrangler d1 execute tiejie-access --remote --file migrations/0003-password-work-factor.sql
npx wrangler d1 execute tiejie-access --remote --file migrations/0004-auth-throttle.sql
npx wrangler d1 execute tiejie-access --remote --file migrations/0005-stage-run-validation.sql
```

## 服务端保存字段

`users` 当前保存账号标识、登录名、密码盐、密码哈希与迭代次数、启用状态、账号模式、创建/更新时间、最后访问时间、客户端版本；玩家数据只增加以下紧凑字段：

- `display_name`：排行榜角色名，最多 12 个字符。
- `best_stage`：最大通关数。
- `stat_hp/stat_atk/stat_def`：三项已保存属性加点。
- `skill_mask`：11 个可解锁技能压成一个整数位图。
- `progress_blob`：金币、鸡腿、果实、当前关、招募状态等短键 JSON，接口强制不超过 768 字节。
- `progress_updated_at`：多端同步冲突判断时间。

`sessions` 只保存会话 ID、用户 ID、令牌哈希、过期与访问时间，不保存明文令牌。`feedback` 保存反馈类型、正文、关卡、客户端版本、语言和提交时间，不采集广告 ID、设备序列号或通讯录等信息。

离线授权已关闭；本地仍可保存游戏进度，但账号授权和服务器进度同步必须连接 Worker。新密码使用 600,000 次 PBKDF2-HMAC-SHA256，旧账号在下一次成功登录时从 10,000 次自动升级。
登录失败按“来源 IP + 用户名”的 SHA-256 哈希键限流，15 分钟内最多失败 5 次；成功登录会立即清除限流记录，数据库不保存明文 IP。

排行榜最高关不再接受 `/v1/player/save` 上传的数值。正式挑战必须先调用 `/v1/stage/start` 获取一次性凭证，再由 `/v1/stage/complete` 按顺序结算；服务端按关卡要求至少 45 秒并逐关增加，最高 180 秒，可通过 Worker 环境变量 `MIN_STAGE_SECONDS` 覆盖统一阈值。凭证只保存哈希、最长 6 小时且成功后立即删除。

## 管理账号

```powershell
node manage-access.mjs list
node manage-access.mjs leaderboard
node manage-access.mjs feedback
node manage-access.mjs disable <username>
node manage-access.mjs enable <username>
node manage-access.mjs mode <username> normal
node manage-access.mjs registration test
node manage-access.mjs registration normal
node manage-access.mjs registration closed
```

`node manage-access.mjs purge-test --confirm` 会永久删除所有测试账号及其会话，只能在明确确认后执行。
