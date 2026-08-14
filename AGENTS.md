# TieJieCombat App project

- This is the independent Android/iOS packaging project for 铁街格斗.
- `src-web/` is the app-owned web game source snapshot. It must not be symlinked to the original Web/Douyin repository.
- `www/` is generated release output. Build it with `npm run build:web`; never edit it by hand.
- Android work belongs in `android/`; future iOS work belongs in `ios/`.
- Never commit signing keys, service-account files, ad-network secrets, store credentials, or source maps.
- Release builds must load bundled local assets and must not download executable JavaScript.
- Preserve character color, scale, frame timing, world coordinates and collision behavior unless the user explicitly requests a gameplay change.
