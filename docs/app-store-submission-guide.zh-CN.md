# Open Auth 应用上架指导文档

> 本文档覆盖四个目标市场的上架流程、材料准备和注意事项。

---

## 目录

1. [通用准备事项](#1-通用准备事项)
2. [海外 iOS — Apple App Store](#2-海外-ios--apple-app-store)
3. [海外 Android — Google Play](#3-海外-android--google-play)
4. [国内 iOS — Apple App Store（中国区）](#4-国内-ios--apple-app-store中国区)
5. [国内 Android — 各大应用市场](#5-国内-android--各大应用市场)
6. [截图与素材规范](#6-截图与素材规范)
7. [审核员测试账号](#7-审核员测试账号)
8. [术语合规自查清单](#8-术语合规自查清单)
9. [被拒后的申诉策略](#9-被拒后的申诉策略)
10. [构建与提交命令](#10-构建与提交命令)

---

## 1. 通用准备事项

### 1.1 应用基本信息

| 字段 | 值 |
|------|-----|
| 应用名称 | Open Auth |
| Bundle ID (iOS) | `com.openauth.app` |
| Package Name (Android) | `com.openauth.app` |
| 版本号 | 1.0.0 |
| 分类 | 工具 / Utilities |
| 内容分级 | 4+（iOS）/ 所有人（Android） |
| 支持语言 | English |
| 最低系统版本 | iOS 15.0 / Android 6.0 (API 23) |

### 1.2 核心定位话术

> **一句话定位：** Open Auth 是一款安全授权工具，让用户在移动端审批 AI Agent 发起的操作请求，类似于 Google Authenticator 但用于操作授权。

所有市场的描述都应围绕以下关键词：
- ✅ 授权工具、安全审批、双因素确认、端到端加密、AI Agent 管理
- ❌ **绝对不能出现：** 钱包、加密货币、区块链、Token、DeFi、NFT、交易签名

### 1.3 法律文件（所有市场必需）

| 文件 | 要求 | 建议托管地址 |
|------|------|-------------|
| 隐私政策 | 必须有可访问的 URL | `https://openauth.dev/privacy` |
| 服务条款 | 必须有可访问的 URL | `https://openauth.dev/terms` |
| 数据安全说明 | Google Play 必需 | 在 Play Console 填写 |

### 1.4 构建产物

使用 EAS Build 生成发布包：

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

---

## 2. 海外 iOS — Apple App Store

### 2.1 开发者账号

- 类型：Apple Developer Program（$99/年）
- 必须完成 D-U-N-S 编号申请（如使用企业账号）
- 账号地区：美国或其他海外地区

### 2.2 App Store Connect 填写

| 字段 | 内容 |
|------|------|
| App Name | Open Auth |
| Subtitle | Secure authorization for AI agents |
| Primary Category | Utilities |
| Secondary Category | Productivity |
| Price | Free |
| Content Rating | 4+ |
| App Privacy | 见下方 |

### 2.3 应用描述（英文）

**短描述（Promotional Text，170字符）：**

```
Your personal authorization hub. Review and approve AI agent requests securely
with end-to-end encryption. Like 2FA, but for agent operations.
```

**完整描述：**

```
Open Auth puts you in control of your AI agents. When an agent needs
authorization to perform an action — sending a report, archiving data,
deploying a service — Open Auth delivers the request to your phone for
your approval.

KEY FEATURES:
• Instant authorization requests delivered to your phone
• End-to-end encrypted communication — only you can see request details
• Simple approve/reject with one tap
• Pair multiple AI agents with QR code or short code
• Complete history of all authorization decisions
• PIN and biometric protection (Face ID / Touch ID)
• Secure credential backup and recovery

HOW IT WORKS:
1. Pair your AI agent using a short code or QR scan
2. Receive authorization requests in real-time
3. Review the details and approve or reject
4. Your decision is encrypted and sent back instantly

Open Auth is a utility tool for secure human-in-the-loop authorization,
similar to how Google Authenticator works for two-factor authentication.
```

### 2.4 App Privacy（数据使用声明）

| 数据类型 | 是否收集 | 用途 |
|---------|---------|------|
| 联系信息 | 否 | — |
| 健康数据 | 否 | — |
| 财务信息 | 否 | — |
| 位置信息 | 否 | — |
| 用户内容 | 否 | — |
| 标识符 | 是（设备 Token） | 推送通知 |
| 使用数据 | 否 | — |
| 诊断数据 | 否 | — |

勾选 **"Data Not Linked to You"** — 推送 Token 不与用户身份关联。

### 2.5 审核备注（Review Notes）

```
DEMO MODE INSTRUCTIONS:
To test the full app experience, please use PIN: 000000 during initial setup.
This will load demo data with 3 sample agents and 20 authorization history
records. You will see a pending authorization request from "Assistant Pro"
that you can approve or reject.

After handling the first request, additional sample requests will appear
at 30-second and 90-second intervals (maximum 2 additional requests).

The app is an authorization utility tool similar to Google Authenticator,
but designed for approving AI agent operations instead of login codes.

No real network connections are made in demo mode — all data is local.
```

### 2.6 注意事项

- **Guideline 2.1 (App Completeness)**：确保 Demo 模式体验完整，审核员能操作所有功能
- **Guideline 4.3 (Spam)**：确保 8 个页面都有实质内容
- **Guideline 5.1 (Legal)**：隐私政策 URL 必须可访问
- 不使用 `UIBackgroundModes` 中不需要的模式，避免触发额外审查

---

## 3. 海外 Android — Google Play

### 3.1 开发者账号

- Google Play Console（$25 一次性费用）
- 需要完成身份验证

### 3.2 商品详情

| 字段 | 内容 |
|------|------|
| App Name | Open Auth - Secure Agent Authorization |
| Short Description | Approve AI agent requests securely with end-to-end encryption |
| Category | Tools |
| Content Rating | Everyone |
| Target Audience | 18+ (非儿童应用) |
| Price | Free |

**完整描述：** 与 iOS 版本相同。

### 3.3 数据安全声明

Google Play 要求填写 Data Safety 表单：

| 问题 | 回答 |
|------|------|
| 是否收集数据 | 是（推送 Token） |
| 是否分享数据 | 否 |
| 数据是否加密传输 | 是（E2EE） |
| 用户是否可以请求删除数据 | 是（Reset All Data） |
| 是否收集设备标识符 | 是（FCM Token，仅用于推送） |

### 3.4 审核说明

Google Play 的审核说明在 **App Content > App Access** 中填写：

```
This app requires initial setup (PIN creation) before use.

For testing: Use PIN 000000 during first-time setup to enter demo mode
with pre-loaded sample data. This provides 3 sample agents and 20
authorization history records to demonstrate the full app experience.

No login credentials required. No network connection required in demo mode.
```

### 3.5 注意事项

- **Target API Level**：确保 `targetSdkVersion` 满足当年 Google Play 的最低要求（2026 年要求 API 35+）
- **64-bit 要求**：EAS Build 默认生成 arm64 和 x86_64，满足要求
- **签名**：使用 Google Play App Signing（上传密钥 + Google 签名密钥）

---

## 4. 国内 iOS — Apple App Store（中国区）

### 4.1 开发者账号

- 需要使用**中国区 Apple Developer** 账号
- 或使用海外账号但指定中国区可用
- 企业账号需要提供营业执照和 D-U-N-S 编号

### 4.2 与海外 iOS 的区别

| 差异点 | 海外 iOS | 国内 iOS |
|--------|---------|---------|
| 账号地区 | 任意 | 中国区或指定中国可用 |
| 推送服务 | APNs | APNs（相同） |
| 审核语言 | 英文 | 建议补充中文描述 |
| ICP 备案 | 不需要 | 2024 年起必须提供 |
| 实名认证 | 不需要 | 可能被要求 |

### 4.3 ICP 备案要求（重要）

自 2024 年起，Apple 要求中国区上架的 APP 提供 **ICP 备案号**：

1. 准备材料：营业执照、域名证书、服务器信息
2. 通过云服务商（阿里云、腾讯云等）提交 ICP 备案
3. 备案域名建议使用：`openauth.dev` 或 `openauth.cn`
4. 备案完成后在 App Store Connect 填写备案号

### 4.4 应用描述（中文）

**副标题：**

```
安全的 AI Agent 授权管理工具
```

**完整描述：**

```
Open Auth 让您掌控 AI Agent 的每一个操作。当 Agent 需要执行发送报告、
归档数据、部署服务等操作时，Open Auth 会将请求推送到您的手机，由您决定
是否批准。

主要功能：
• 实时接收 Agent 授权请求，一键审批
• 端到端加密通信，只有您能看到请求详情
• 通过二维码或短码快速配对 AI Agent
• 完整的授权历史记录
• PIN 和生物识别（Face ID / Touch ID）双重保护
• 安全的凭证备份与恢复

使用方法：
1. 使用短码或扫码与您的 AI Agent 配对
2. 实时接收授权请求
3. 查看详情后批准或拒绝
4. 您的决定通过加密通道即时回传

Open Auth 是一款安全授权工具，类似 Google Authenticator 的双因素验证，
但专为 AI Agent 的操作授权设计。
```

### 4.5 审核备注

```
演示模式使用说明：
首次设置时输入 PIN: 000000 即可进入演示模式。
演示模式包含 3 个示例 Agent 和 20 条授权历史记录。
进入后会看到来自 "Assistant Pro" 的待处理授权请求，可以体验批准或拒绝操作。
演示模式下不会发起任何网络请求，所有数据均为本地模拟。
```

### 4.6 注意事项

- **加密合规**：APP 使用 AES-256-GCM 加密，提交时需在 App Store Connect 的 **"Export Compliance"** 中声明使用了加密技术，选择 "Yes, but the app is exempt"（属于授权/鉴权类加密豁免）
- **隐私政策**：中国区要求隐私政策必须有中文版本
- **分类一致**：与海外版保持一致，使用"工具"分类

---

## 5. 国内 Android — 各大应用市场

### 5.1 目标市场清单

| 市场 | 优先级 | 开发者费用 | 审核周期 |
|------|--------|-----------|---------|
| 华为应用市场（AppGallery） | P0 | 免费 | 1-3 工作日 |
| 小米应用商店 | P0 | 免费 | 1-3 工作日 |
| OPPO 软件商店 | P1 | 免费 | 1-3 工作日 |
| vivo 应用商店 | P1 | 免费 | 1-3 工作日 |
| 应用宝（腾讯） | P1 | 免费 | 1-5 工作日 |
| 360 手机助手 | P2 | 免费 | 1-3 工作日 |
| 豌豆荚 | P2 | 免费 | 1-3 工作日 |

### 5.2 通用要求（所有国内安卓市场）

| 要求 | 详情 |
|------|------|
| 软件著作权 | **必须** — 需提前申请（耗时 1-2 个月） |
| 营业执照 | 企业开发者必须提供 |
| 应用备案 | 2024 年起需要工信部 APP 备案 |
| 隐私政策 | 必须有中文版，符合《个人信息保护法》 |
| 签名证书 | 各市场独立签名或统一签名 |
| APK/AAB 格式 | 大部分接受 APK，华为支持 AAB |
| 适配要求 | 需适配鸿蒙 Next（华为市场加分） |

### 5.3 软件著作权申请

这是国内安卓市场上架的**前置条件**：

1. **申请渠道**：中国版权保护中心（https://www.ccopyright.com.cn）
2. **所需材料**：
   - 软件名称：Open Auth 安全授权工具
   - 源代码文档（前后各 30 页）
   - 软件说明书（操作手册，含截图）
3. **费用**：官方免费（普通通道 30-60 工作日），加急约 ¥500-2000
4. **建议**：开发启动时同步申请，避免上架时等待

### 5.4 APP 备案（工信部）

2024 年起所有 APP 需完成工信部备案：

1. 通过各市场的备案入口提交（华为、小米等均提供备案通道）
2. 所需材料：营业执照、法人身份证、APP 基本信息
3. 备案号格式：`京ICP备XXXXXXXX号-XA`
4. 备案完成后才能正式上架

### 5.5 各市场特殊要求

#### 华为应用市场（AppGallery）

```
开发者注册：https://developer.huawei.com
特殊要求：
- 支持 HMS Core（建议但非必须）
- 推送使用华为推送服务替代 FCM
- 隐私声明需符合华为隐私审核标准
- 鸿蒙适配为加分项
```

⚠️ **推送适配**：国内安卓不支持 FCM/GCM，需要使用各厂商推送通道：
- 华为：HMS Push Kit
- 小米：MiPush
- OPPO：Push Service
- vivo：Push
- 建议使用统一推送聚合服务（如极光推送、个推）

#### 小米应用商店

```
开发者注册：https://dev.mi.com
特殊要求：
- 需要提供应用安全检测报告（小米会自动检测）
- 隐私政策弹窗必须在首次启动时展示
- 需要声明所有权限用途
```

#### OPPO / vivo / 应用宝

```
注册地址：
- OPPO: https://open.oppomobile.com
- vivo: https://dev.vivo.com.cn
- 应用宝: https://open.tencent.com

通用要求：
- 上传 APK + 截图 + 描述 + 著作权证书
- 部分市场要求应用安全扫描报告
```

### 5.6 应用描述（中文，国内安卓版）

```
应用名称：Open Auth - 安全授权工具
一句话简介：AI Agent 安全授权管理，端到端加密保护

完整描述与国内 iOS 版本相同（见 4.4 节）。
```

### 5.7 国内合规注意事项

1. **《个人信息保护法》合规**
   - 首次启动必须弹出隐私政策同意弹窗
   - 用户不同意时不能强制收集信息
   - 需要列明所有收集的信息类型和用途

2. **权限声明**
   - 摄像头（扫码配对）：需声明用途
   - 通知权限：需声明用途
   - 生物识别：需声明用途
   - 不申请不必要的权限（如电话、通讯录、位置）

3. **数据存储**
   - 如涉及中国用户数据，建议服务器部署在境内
   - Relay 服务器建议国内部署一套

---

## 6. 截图与素材规范

### 6.1 截图内容策略

**核心原则：只展示 `generic-approval` 类型的请求，绝不展示 Digital Signer 相关内容。**

建议截图序列（6-8 张）：

| 序号 | 页面 | 展示内容 |
|------|------|---------|
| 1 | 欢迎页 | "Authorize with Confidence" 品牌页 |
| 2 | Home | 3 个 Agent 列表（demo 数据） |
| 3 | 授权请求 | "Send weekly summary report" 低风险请求 |
| 4 | 授权请求 | 点击 Approve 按钮 |
| 5 | History | 按日期分组的历史记录 |
| 6 | Agent 详情 | Agent 信息 + 统计数据 |
| 7 | Settings | 安全设置页面 |
| 8 | 配对页 | 短码 + QR 码配对界面 |

### 6.2 截图尺寸要求

| 市场 | 尺寸 | 格式 |
|------|------|------|
| App Store (6.7") | 1290 × 2796 px | PNG/JPEG |
| App Store (6.5") | 1284 × 2778 px | PNG/JPEG |
| App Store (5.5") | 1242 × 2208 px | PNG/JPEG |
| Google Play | 最小 320px，最大 3840px，16:9 或 9:16 | PNG/JPEG |
| 国内安卓 | 1080 × 1920 px（推荐） | PNG/JPEG |

### 6.3 图标规范

| 市场 | 尺寸 | 格式 | 要求 |
|------|------|------|------|
| App Store | 1024 × 1024 px | PNG | 无透明度，无圆角（系统自动裁） |
| Google Play | 512 × 512 px | PNG | 32-bit，含 alpha 通道 |
| 国内安卓 | 512 × 512 px | PNG | 各市场可能有微小差异 |

---

## 7. 审核员测试账号

### 7.1 Demo 模式说明

所有市场提交时都需要告知审核员如何体验完整功能：

```
测试方式：
1. 安装并打开应用
2. 滑过 3 页欢迎引导
3. 在 PIN 设置页面输入：000000
4. 确认 "PIN too simple" 的警告提示
5. 跳过生物识别设置
6. 进入主页后可以看到 3 个预置的 Agent 和待处理请求
7. 所有功能均可正常操作，数据为本地模拟

注意：
- 无需联网，所有操作在本地完成
- 无需注册或登录任何账号
- 如需重新体验，在 Settings → Reset All Data 后重新开始
```

### 7.2 各市场审核备注格式

| 市场 | 填写位置 | 语言 |
|------|---------|------|
| App Store（海外） | App Store Connect → Version → Review Notes | 英文 |
| App Store（中国区） | 同上 | 中文+英文 |
| Google Play | App Content → App Access | 英文 |
| 华为 | 版本审核 → 审核备注 | 中文 |
| 小米/OPPO/vivo | 提交审核时的备注字段 | 中文 |

---

## 8. 术语合规自查清单

上架前务必逐项检查，确保 UI 中无违规术语：

| 检查项 | 状态 |
|--------|------|
| 所有页面无 "cryptocurrency / crypto / 加密货币" | ☐ |
| 所有页面无 "wallet / 钱包" | ☐ |
| 所有页面无 "blockchain / 区块链" | ☐ |
| 所有页面无 "token / NFT / DeFi" | ☐ |
| 所有页面无 "ETH / BTC / USDC" 等币种名 | ☐ |
| `evm-signer` 显示为 "Digital Signer" | ☐ |
| `sign_transaction` 显示为 "Sign Transaction" | ☐ |
| `chainId` 显示为 "Network" + 名称 | ☐ |
| 助记词显示为 "Recovery Phrase" | ☐ |
| 私钥显示为 "Signing Credentials" | ☐ |
| 截图中无任何 Digital Signer 请求 | ☐ |
| 应用描述中无金融相关词汇 | ☐ |
| 错误消息中无技术术语泄露 | ☐ |

---

## 9. 被拒后的申诉策略

### 9.1 Apple App Store 常见拒绝原因及应对

| 拒绝原因 | 应对策略 |
|---------|---------|
| Guideline 2.1 — 功能不完整 | 提供 demo PIN，确保审核员能体验所有功能 |
| Guideline 3.1.1 — 疑似金融 APP | 申诉强调：工具类应用，类似 Google Authenticator；不处理任何金融交易；不存储或转移任何资产 |
| Guideline 4.3 — 内容太少 | 确保 8 个页面都有实质内容，demo 数据足够丰富 |
| Guideline 5.1 — 隐私政策问题 | 确保隐私政策 URL 可访问，内容完整 |

### 9.2 申诉模板（英文）

```
Dear App Review Team,

Thank you for reviewing Open Auth. I'd like to clarify that this app is
a utility tool for secure operation authorization, similar in concept to
Google Authenticator.

Key points:
1. The app does NOT process financial transactions of any kind
2. The app does NOT store, transfer, or manage cryptocurrency or digital assets
3. The "Digital Signer" capability is a generic digital signature utility,
   used for verifying the authenticity of requests (similar to how HTTPS
   certificates work)
4. The app is categorized as Utilities, alongside similar tools like
   Google Authenticator, Microsoft Authenticator, and Duo Mobile

The core function is human-in-the-loop authorization: when an AI agent
needs permission to perform an operation (like sending a report or
archiving files), this app lets the user approve or deny the request.

I've provided demo mode access (PIN: 000000) for your review.

Thank you for your consideration.
```

### 9.3 国内市场被拒常见原因

| 拒绝原因 | 应对策略 |
|---------|---------|
| 缺少软件著作权 | 提前申请，预留 1-2 个月 |
| 缺少 APP 备案 | 通过市场提供的备案通道完成 |
| 隐私政策不合规 | 补充中文隐私政策，增加首启弹窗 |
| 权限使用说明不足 | 在权限申请时增加明确用途说明 |
| 功能体验不完整 | 确保 demo 模式数据充足 |

---

## 10. 构建与提交命令

### 10.1 生产构建

```bash
cd app/

# iOS 生产包
eas build --platform ios --profile production

# Android 生产包（APK，适用于国内市场）
eas build --platform android --profile production

# Android App Bundle（AAB，适用于 Google Play）
eas build --platform android --profile production --output-format aab
```

### 10.2 提交到 App Store

```bash
# 自动提交到 App Store Connect
eas submit --platform ios --profile production
```

### 10.3 提交到 Google Play

```bash
# 自动提交到 Google Play（需要配置 service account key）
eas submit --platform android --profile production
```

### 10.4 国内安卓市场

国内安卓市场通常需要手动上传 APK：

1. 通过 `eas build` 获取 APK 文件
2. 登录各市场开发者后台
3. 手动上传 APK + 填写信息 + 上传截图
4. 提交审核

建议使用自动化工具批量上传（如 fastlane 配合各市场插件）。

---

## 附录：上架时间线建议

```
第 1-2 周: 申请软件著作权 + ICP 备案 + APP 备案（并行）
第 1 周:   准备隐私政策（中英文）+ 服务条款
第 2 周:   制作应用图标 + 截图 + 商店描述
第 3 周:   提交海外 iOS + Google Play（审核 1-3 天）
第 4 周:   提交国内 iOS（需 ICP 备案号）
第 6-8 周: 软件著作权下发后，提交国内安卓各市场
```

> ⚠️ 软件著作权是国内安卓上架的最大瓶颈，务必尽早启动申请。
