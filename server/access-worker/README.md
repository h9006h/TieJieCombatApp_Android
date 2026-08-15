# TieJie Access Worker

铁街格斗登录与授权服务，部署到 Cloudflare Workers，使用 D1 数据库 `tiejie-access`。

## 本地准备

```powershell
npm install
npx wrangler login
npx wrangler d1 execute tiejie-access --remote --file schema.sql
```

## 管理账号

```powershell
node manage-access.mjs list
node manage-access.mjs disable <username>
node manage-access.mjs enable <username>
node manage-access.mjs mode <username> normal
node manage-access.mjs registration test
node manage-access.mjs registration normal
node manage-access.mjs registration closed
```

`node manage-access.mjs purge-test --confirm` 会永久删除所有测试账号及其会话，只能在明确确认后执行。
