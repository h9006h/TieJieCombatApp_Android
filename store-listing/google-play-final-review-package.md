# Google Play 最终审核填写包

应用：避难所格斗 / Shelter Combat  
包名：`com.tiejiecombat.game`  
更新时间：2026-08-22

## 一、隐私权政策

如果已部署最新 Cloudflare Worker，填写：

```text
https://tiejie-access.access-worker.workers.dev/privacy-policy
```

账号删除 URL：

```text
https://tiejie-access.access-worker.workers.dev/account-deletion
```

注意：这两个 URL 需要你部署 `server/access-worker/src/index.js` 最新代码后才会同时可用。`/account-deletion` 原来已有，`/privacy-policy` 是本次新增。

## 二、登录详细信息 / App access

选择：

```text
应用需要登录或存在受限制内容：是
提供测试账号：是
```

审核账号：

```text
Username: google_test
Password: GpReview_9vK72!TieJie
```

给审核员的英文说明：

```text
Open the app and log in with the provided test account.

Username: google_test
Password: GpReview_9vK72!TieJie

After login, the reviewer can access the main menu, start a stage, select stages, view the skill tree, recruit allies, open the leaderboard, submit feedback, and use rewarded ad entry points. The app does not require any paid purchase to review core gameplay.

If the test account is not found, use the Register button with the same username and password. Registration is open for the test build.

Account deletion is available inside the app from Settings > Delete account. A public account deletion page is also available at:
https://tiejie-access.access-worker.workers.dev/account-deletion
```

提交前必须确认该账号真实可登录。不要给该账号管理员权限。

## 三、广告

选择：

```text
此应用是否包含广告：是
广告 SDK：Google AdMob
广告类型：激励广告 / Rewarded ads
```

说明：

```text
The app uses Google AdMob rewarded ads. Ads are optional and are used to grant in-game resource rewards or keep stage loot after a failed run. Core gameplay is available without completing ads.
```

## 四、内容分级

建议按实际选择：

```text
应用类别：游戏
游戏类型：动作 / 格斗
暴力：有，幻想/卡通/街机风格暴力
血腥：无，或轻微；按实际画面选择
肢解：无
恐怖：无
性内容/裸露：无
赌博：无
真钱奖励：无
酒精/烟草/毒品：无
粗俗语言：无
公开用户生成内容：无
玩家聊天：无
线上功能：有账号、排行榜、反馈；无玩家聊天
```

## 五、目标受众群体

选择：

```text
13–15
16–17
18+
```

不要选择 12 岁以下。

如果问“应用是否可能吸引儿童”，建议：

```text
否
```

说明：

```text
This is a street fighting action game with combat, progression, accounts, leaderboard, feedback, and rewarded ads. It is not designed for children and is not targeted at children.
```

## 六、数据安全

总体问题：

```text
应用是否收集或共享用户数据：是
所有用户数据是否在传输过程中加密：是
用户是否可以请求删除数据：是
数据删除链接：https://tiejie-access.access-worker.workers.dev/account-deletion
是否允许用户创建账号：是
是否提供账号删除：是
```

### 个人信息 / Personal info

勾选：

```text
User IDs / 用户 ID
```

用途：

```text
App functionality / 应用功能
Account management / 账号管理
Fraud prevention, security, and compliance / 防欺诈、安全与合规
```

收集：是  
共享：否  
是否可选：否，账号登录和服务器进度需要。

### 应用活动 / App activity

勾选：

```text
App interactions / 应用互动
```

包含：

```text
关卡进度、资源、角色属性、技能、队友、排行榜成绩、关卡校验记录
```

用途：

```text
App functionality / 应用功能
Analytics / 分析
Fraud prevention, security, and compliance / 防欺诈、安全与合规
```

收集：是  
共享：否  
是否可选：否，服务器进度和玩法功能需要。

### 用户生成内容 / User-generated content

如果表单有这一项，勾选：

```text
Other user-generated content / 其他用户生成内容
```

包含：

```text
游戏内反馈内容
```

用途：

```text
App functionality / 应用功能
Developer communications / 开发者沟通
Analytics / 分析
```

收集：是  
共享：否  
是否可选：是，只有用户主动提交反馈时收集。

### 设备或其他 ID / Device or other IDs

勾选：

```text
Device or other IDs / 设备或其他 ID
Advertising ID / 广告 ID，如果单独出现
```

原因：Google AdMob 激励广告 SDK 可能收集广告标识符和设备标识符。

用途：

```text
Advertising or marketing / 广告或营销
Analytics / 分析
Fraud prevention, security, and compliance / 防欺诈、安全与合规
```

收集：是  
共享：是，与 Google AdMob / Google advertising services  
是否可选：激励广告是可选观看，但 AdMob SDK 数据处理需要声明。

### 位置信息 / Location

如果表单或 AdMob SDK 披露要求填写：

```text
Approximate location / 粗略位置信息：是
Collected by Google AdMob
Shared with Google AdMob / Google advertising services
Purpose: Advertising or marketing, analytics, fraud prevention/security
```

应用自身没有请求 Android 定位权限，不要选精确位置。

### 不要勾选

当前项目没有这些能力，不要勾选：

```text
精确位置
通讯录
照片和视频
音频文件
日历
健康与健身
财务信息
付款信息
通话记录
短信
邮件
浏览历史
崩溃日志/诊断数据，除非以后接入崩溃 SDK
```

## 七、政府应用

选择：

```text
否
```

说明：

```text
This is an independent action game and is not affiliated with any government entity.
```

## 八、商品详情多语言导入文件

优先上传：

```text
store-listing/google-play-store-listing-translations-simple.csv
```

如果 Google AI 导入不识别，再试：

```text
store-listing/google-play-store-listing-translations.csv
```

已包含这些 locale：

```text
en-IN
zh-CN
zh-TW
zh-HK
ja-JP
ko-KR
es-419
es-US
es-ES
pt-BR
pt-PT
fr-FR
fr-CA
de-DE
ru-RU
```

## 九、最终提交前必须确认

- [ ] 部署最新 Worker，确认隐私政策 URL 可打开。
- [ ] 确认账号删除 URL 可打开。
- [ ] 创建或确认测试账号 `google_test / GpReview_9vK72!TieJie` 可登录。
- [ ] 广告页面选择“包含广告”。
- [ ] 数据安全里声明 AdMob 的设备 ID / 广告 ID。
- [ ] 目标受众不选 12 岁以下。
- [ ] 内容分级声明格斗/街机风格暴力。
- [ ] 所有商品详情语言没有红色错误。
- [ ] 图标、置顶大图、截图已上传。

