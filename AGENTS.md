# TieJieCombat App project

- This is the independent Android/iOS packaging project for 铁街格斗.
- `src-web/` is the app-owned web game source snapshot. It must not be symlinked to the original Web/Douyin repository.
- `www/` is generated release output. Build it with `npm run build:web`; never edit it by hand.
- Android work belongs in `android/`; future iOS work belongs in `ios/`.
- Never commit signing keys, service-account files, ad-network secrets, store credentials, or source maps.
- Release builds must load bundled local assets and must not download executable JavaScript.
- Preserve character color, scale, frame timing, world coordinates and collision behavior unless the user explicitly requests a gameplay change.
- Do not add or restore a browser-based character frame adjuster in this App project. Character frame adjustment is maintained only by the macOS tool at `../TieJieCombat/dist/tools/TieJieFrameAdjuster.app` and its source files in `../TieJieCombat/tools/`.

## Collaboration preferences

- 如果某项操作预计会明显消耗大量 Token，先向用户说明消耗主要来自哪里，并指出哪些步骤适合由用户亲自完成。优先给出简明、可执行的操作步骤，让用户可以选择接手；如果用户已经明确要求自动完成，或者任务无法安全拆分，则继续完成任务。
- 在文字说明中提供比结论更充分的解释，帮助用户学习相关专业知识。说明关键术语、工作原理、判断依据、取舍和验证方法；给出命令或修改方案时，也解释“为什么这样做”以及可能的影响，避免只报告操作结果。
- Codex 永远不要执行 Android 同步，也不要构建、安装或运行 APK/AAB，包括但不限于 `npm run sync:android`、`npx cap sync android`、`gradlew assemble*`、`gradlew bundle*` 和 ADB 安装命令。Codex 只修改、检查和验证源码；Android Studio 中的同步、编译、安装和设备运行始终由用户亲自完成。除非用户以后明确要求修改本规则本身，否则即使普通任务包含“完成”“验证”或“测试”，也不得推断获得了 Android 同步或打包授权。
