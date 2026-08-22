# Google Play 应用内容填写包：避难所格斗 / Shelter Combat

更新时间：2026-08-22

> 这份内容按当前项目实际功能准备：账号登录、服务器进度、排行榜、反馈、Google AdMob 激励广告、网络权限、震动权限。Google 审核不能保证 100% 通过，但下面填法能最大限度避免信息不一致导致的拒审。

## 0. 应用基本信息

- 应用名称：避难所格斗 / Shelter Combat
- 包名：`com.tiejiecombat.game`
- 类型：游戏
- 游戏类型：动作 / 格斗
- 是否政府应用：否
- 是否包含广告：是
- 广告 SDK：Google AdMob
- 是否需要登录：是
- 是否面向儿童：否
- 建议目标年龄：13–15、16–17、18+
- 账号删除网址：`https://tiejie-access.access-worker.workers.dev/account-deletion`

## 1. 设置隐私权政策

在 Play Console 的「设置隐私权政策」里填一个公开 URL。

建议你把本目录里的 `privacy-policy.html` 发布到公开网址，然后填该网址。

如果暂时没有单独网站，可以优先用 Cloudflare Pages / GitHub Pages / 你已有服务器发布。

隐私政策必须与数据安全表一致，里面已经写明：

- 账号注册和登录
- 服务器进度、排行榜、反馈
- Google AdMob 激励广告
- HTTPS 加密传输
- 账号和数据删除入口
- 网络权限和震动权限用途

## 2. 登录详细信息 / App access

选择：

- 应用是否有受限制内容或需要登录：是
- 提供登录凭据：是

建议创建审核账号：

```text
Username: google_test
Password: GpReview_9vK72!TieJie
```

给 Google 审核员的说明：

```text
Open the app and log in with the provided test account.

Username: google_test
Password: GpReview_9vK72!TieJie

After login, the reviewer can access the main menu, start a stage, select stages, view the skill tree, recruit allies, open the leaderboard, submit feedback, and use rewarded ad entry points. The app does not require any paid purchase to review core gameplay.

If the test account is not found, use the Register button with the same username and password. Registration is open for the test build.
```

中文备份说明：

```text
打开应用后使用以下测试账号登录：

用户名：google_test
密码：GpReview_9vK72!TieJie

登录后可进入主菜单、开始关卡、选择关卡、查看技能树、招募队友、查看排行榜、提交反馈并查看激励广告入口。审核核心玩法不需要任何付费购买。

如果提示账号不存在，可用同样账号密码点击注册。测试版本开放注册。
```

重要：提交审核前必须确认该账号真的能登录。

## 3. 广告

选择：

- 此应用是否包含广告：是
- 广告网络 / SDK：Google AdMob
- 广告类型：激励广告 / Rewarded ads

说明：

```text
The app uses Google AdMob rewarded ads. Ads are optional and are used to grant in-game resource rewards or keep stage loot after a failed run. Core gameplay is available without completing ads.
```

## 4. 内容分级

进入内容分级问卷，建议按实际选择：

- 应用类别：游戏
- 游戏类型：动作 / 格斗
- 暴力：
  - 有幻想或卡通风格暴力
  - 有近身格斗、击打、踢击、抓投、武器敌人
  - 无真实血腥表现，或选择轻微/无血腥（按实际画面）
- 血液/肢解：无
- 恐怖/惊吓：无
- 性内容/裸露：无
- 赌博：无
- 酒精/烟草/毒品：无
- 粗俗语言：无
- 用户生成内容公开展示：无
- 用户间互动/聊天：无
- 线上功能：有账号、排行榜、反馈，但没有玩家聊天

如果问是否模拟赌博、真钱奖励、抽奖：

- 否

## 5. 目标受众群体

建议选择：

- 13–15
- 16–17
- 18+

不要选择 12 岁以下。

原因：

- 游戏包含街头格斗和战斗动作。
- 游戏包含账号系统、排行榜、反馈和广告。
- 应用不是为儿童设计。

如果问「应用是否可能吸引儿童」：

- 建议选：否

说明文本：

```text
This is a street fighting action game with combat, progression, accounts, leaderboard, feedback, and rewarded ads. It is not designed for children and is not targeted at children.
```

## 6. 数据安全

### 总体问题

- 应用是否收集或共享用户数据：是
- 所有用户数据是否在传输过程中加密：是
- 用户是否可以请求删除数据：是
- 数据删除链接：`https://tiejie-access.access-worker.workers.dev/account-deletion`
- 是否允许用户创建账号：是
- 是否提供账号删除：是，应用内和网页均提供

### 数据类型逐项建议

#### 个人信息 / Personal info

勾选：

- 用户 ID / User IDs

用途：

- 应用功能
- 账号管理
- 防欺诈、安全与合规

是否收集：是

是否共享：通常选否；但如果表单把 AdMob 也算共享，广告相关数据在「设备或其他 ID」里处理。

是否可选：否，登录使用需要账号。

#### 应用活动 / App activity

勾选：

- 应用互动 / App interactions
- 其他用户生成内容 或 其他应用活动（如果有反馈内容选项，则反馈放到用户生成内容）

包含：

- 关卡进度
- 资源、属性、技能、队友
- 排行榜成绩
- 关卡校验记录

用途：

- 应用功能
- 分析
- 防欺诈、安全与合规

是否收集：是

是否共享：否

是否可选：否，核心游戏进度需要。

#### 用户生成内容 / User-generated content

如果 Play Console 有此分类，勾选：

- 其他用户生成内容 / Other user-generated content

包含：

- 游戏内反馈内容

用途：

- 应用功能
- 分析
- 开发者沟通 / 客服

是否收集：是

是否共享：否

是否可选：是，只有用户主动提交反馈时收集。

#### 设备或其他 ID / Device or other IDs

勾选：

- 设备或其他 ID
- 广告 ID（如果表单单独列出）

原因：

- Google AdMob 激励广告 SDK 可能收集广告标识符和设备标识符。

用途：

- 广告或营销
- 分析
- 防欺诈、安全与合规

是否收集：是

是否共享：是，与 Google AdMob / Google advertising services。

是否可选：广告本身是可选观看；但 SDK 数据处理按 Google AdMob 行为声明。

#### 位置信息 / Location

如果只使用 AdMob，Google SDK 可能处理粗略位置用于广告。按 Play Console/AdMob 提示：

- 如果表单问「粗略位置」且 AdMob 声明需要：选是
- 用途：广告或营销、分析、防欺诈
- 是否共享：是，与 Google AdMob
- 是否可选：广告相关

应用自身没有主动请求 Android 定位权限。

#### 崩溃日志 / Diagnostics

如果没有接 Firebase Crashlytics 或其它崩溃 SDK：

- 不勾选

如果之后接入崩溃分析，再补：

- 崩溃日志 / 诊断数据
- 用途：分析、应用功能

### 不应勾选

当前项目没有看到这些功能，通常不要勾：

- 精确位置信息
- 通讯录
- 照片和视频
- 音频文件
- 日历
- 健康与健身
- 财务信息
- 付款信息
- 通话记录
- 短信
- 邮件
- 浏览历史

## 7. 数据安全简短说明文本

如果需要填写说明，可用：

```text
The app uses an account system to save game progress, leaderboard records, feedback, and rewarded ad rewards. Data is transmitted over HTTPS. Users can delete their account and associated server data from within the app or through the public account deletion page.
```

## 8. 政府应用

选择：

- 否

说明：

```text
This is an independent action game and is not affiliated with any government entity.
```

## 9. 最终提交前检查

提交前确认：

- 隐私政策 URL 可以公网打开。
- 账号删除 URL 可以公网打开。
- 测试账号 `google_test / GpReview_9vK72!TieJie` 能登录。
- Google Play 商品详情所有语言都有应用名称、简短说明、完整说明、图标、置顶大图。
- 数据安全表声明了 AdMob 相关设备 ID / 广告 ID。
- 广告页面选择了“包含广告”。
- 目标受众没有选择 12 岁以下。
- 内容分级与格斗暴力一致。

