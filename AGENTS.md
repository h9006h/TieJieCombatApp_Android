# TieJieCombat App project

- This is the independent Android/iOS packaging project for 铁街格斗.
- `src-web/` is the app-owned web game source snapshot. It must not be symlinked to the original Web/Douyin repository.
- `www/` is generated release output. Build it with `npm run build:web`; never edit it by hand.
- Android work belongs in `android/`; future iOS work belongs in `ios/`.
- Never commit signing keys, service-account files, ad-network secrets, store credentials, or source maps.
- Release builds must load bundled local assets and must not download executable JavaScript.
- Preserve character color, scale, frame timing, world coordinates and collision behavior unless the user explicitly requests a gameplay change.

## Collaboration preferences

- 如果某项操作预计会明显消耗大量 Token，先向用户说明消耗主要来自哪里，并指出哪些步骤适合由用户亲自完成。优先给出简明、可执行的操作步骤，让用户可以选择接手；如果用户已经明确要求自动完成，或者任务无法安全拆分，则继续完成任务。
- 在文字说明中提供比结论更充分的解释，帮助用户学习相关专业知识。说明关键术语、工作原理、判断依据、取舍和验证方法；给出命令或修改方案时，也解释“为什么这样做”以及可能的影响，避免只报告操作结果。
