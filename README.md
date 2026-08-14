# 铁街格斗 App

这是与 Web/抖音工程互不影响的 Capacitor 移动端工程。游戏源码快照在 `src-web/`，Android Studio 工程在 `android/`，以后可从同一份源码生成 iOS 工程。

## 常用命令

```bash
npm run build:web
npm run sync:android
npm run open:android
```

`build:web` 会将核心 JavaScript 合并、压缩和变量混淆，生成带内容哈希的单一脚本，不生成 source map。`sync:android` 会先执行发布构建，再把本地资源同步到 Android 工程。

## Android Studio 试玩

1. 使用 Android Studio 打开本目录下的 `android/`。
2. 等待 Gradle Sync 完成。
3. 选择模拟器或已开启 USB 调试的 Android 手机。
4. 点击绿色运行按钮。

## 发布安全

- 不要提交签名文件、服务端密钥或广告平台私钥。
- 客户端混淆只能提高逆向成本，广告奖励、果实和付费结果仍应在服务端验证。
- 正式上传 Google Play 前确认最终应用 ID；首次上传后不能再更换。
