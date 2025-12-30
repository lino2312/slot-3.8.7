# Cocos Creator 3.8 热更新系统完整指南

## 目录

1. [概述](#概述)
2. [系统架构](#系统架构)
3. [配置说明](#配置说明)
4. [更新策略](#更新策略)
5. [Bundle更新位置](#bundle更新位置)
6. [日志系统](#日志系统)
7. [原生平台支持](#原生平台支持)
8. [使用方法](#使用方法)
9. [常见问题](#常见问题)

---

## 概述

本热更新系统支持两种更新模式：

1. **压缩包热更新（推荐）**：使用zip压缩包进行热更新，首次更新下载完整zip，后续更新只下载变更文件
2. **传统文件下载**：使用GG插件进行传统的文件下载方式

### 主要特性

- ✅ 支持zip压缩包热更新，加快下载速度
- ✅ 智能增量更新：首次更新下载完整zip，后续只更新变更文件
- ✅ 支持多Bundle并行更新
- ✅ 完整的日志系统，便于调试和监控
- ✅ 支持Android和iOS原生平台
- ✅ 自动管理搜索路径
- ✅ 支持进度回调和错误处理

---

## 系统架构

### 核心组件

```
热更新系统
├── HotUpdate.ts              # 主更新流程（主包和其他非游戏Bundle）
├── SlotGameLoding.ts         # 子游戏更新流程
├── ZipHotUpdateManager.ts    # 压缩包热更新管理器
└── Config.ts                 # 配置管理
```

### 文件结构

```
assets/scripts/
├── config/
│   └── Config.ts                    # 配置文件
├── hotupdate/
│   ├── HotUpdate.ts                 # 主更新入口
│   └── ZipHotUpdateManager.ts       # 压缩包管理器
└── game/slotgame/
    └── SlotGameLoding.ts            # 子游戏加载和更新

native/engine/
├── android/app/src/com/cocos/game/
│   └── PlatformAndroidApi.java      # Android原生支持
└── ios/
    ├── NativeHelper.h               # iOS头文件
    └── NativeHelper.mm               # iOS实现
```

---

## 配置说明

### Config.ts 配置项

在 `assets/scripts/config/Config.ts` 中配置热更新相关参数：

```typescript
export const Config = {
    // 游戏渠道号（用于选择对应的环境配置）
    gameChannel: "test", // 或 "D105", "D101" 等
    
    // 热更新基础URL（从ENV_CONFIG中自动读取，根据gameChannel选择对应环境）
    // 不需要在Config中硬编码，系统会根据gameChannel自动从ENV_CONFIG中获取
    hotupdateBaseUrl: "", // 留空，由ENV_CONFIG提供
    
    // 更新类型：1-热更新，2-强制更新
    up_type: 1,
    
    // 热更新版本号
    hotupdate_version: '1.0.0',
    
    // 压缩包热更新配置
    useZipHotUpdate: true,              // true: 使用zip压缩包，false: 使用传统文件下载
    zipHotUpdateSuffix: '.zip',         // 压缩包后缀名（可选，默认.zip）
    
    // 热更新日志开关
    hotUpdateLogEnabled: true,          // true: 启用详细日志，false: 关闭详细日志
};
```

### 环境配置（ENV_CONFIG）

热更新地址从 `ENV_CONFIG` 中读取，根据 `Config.gameChannel` 自动选择对应环境的配置：

```typescript
const ENV_CONFIG = {
    test: {
        hotupdateBaseUrl: "http://192.168.0.101:3000",  // 测试环境
        // ... 其他配置
    },
    D105: {
        hotupdateBaseUrl: "https://updateaws.fastpay11.com/GameXd105V3",  // D105环境
        // ... 其他配置
    },
    // ... 其他环境配置
};
```

**工作原理**：
- 当 `Config.gameChannel = "test"` 时，自动使用 `ENV_CONFIG.test.hotupdateBaseUrl`
- 当 `Config.gameChannel = "D105"` 时，自动使用 `ENV_CONFIG.D105.hotupdateBaseUrl`
- 系统通过 `Object.assign(Config, env)` 自动合并环境配置

**优势**：
- ✅ 不同环境使用不同的热更新地址
- ✅ 无需在代码中硬编码地址
- ✅ 切换环境只需修改 `gameChannel`
- ✅ 配置集中管理，易于维护

### Bundle配置

在 `settings/hotupdate/hot-update-template-config.json` 中配置Bundle：

```json
{
    "local_bundles": {
        "build-in": {
            "files": ["src/", "jsb-adapter/", "assets/internal/", "assets/main/", "assets/resources/", "assets/common/"]
        }
    },
    "remote_bundles": {
        "build-in": {
            "files": ["src/", "jsb-adapter/", "assets/internal/", "assets/main/", "assets/resources/", "assets/common/", "hall"]
        },
        "hall": {
            "files": ["assets/hall/"]
        },
        "JungleDelight": {
            "files": ["assets/JungleDelight/"]
        }
        // ... 其他子游戏
    }
}
```

---

## 更新策略

### 智能更新逻辑

系统会根据以下规则自动选择更新方式：

#### 1. 首次更新
- **判断条件**：本地不存在 `project.manifest` 文件
- **更新方式**：下载完整zip压缩包
- **优势**：一次性下载所有文件，速度快

#### 2. 增量更新
- **判断条件**：本地存在 `project.manifest` 文件
- **更新方式**：
  - 下载远程 `project.manifest`
  - 与本地manifest对比，找出变更文件
  - 只下载变更的文件
- **优势**：节省流量和时间

#### 3. 大更新回退
如果增量更新的文件数量或总大小超过阈值，系统会自动回退到下载完整zip：
- 文件数量阈值：> 5个文件
- 文件大小阈值：> 10MB

### 更新流程

```
开始更新
    ↓
检查本地manifest是否存在
    ↓
存在？ ──否──→ 下载完整zip包
    │
   是
    ↓
下载远程manifest
    ↓
对比版本和文件
    ↓
需要更新？
    ├─ 否 → 已是最新版本
    └─ 是 → 计算变更文件
            ↓
        变更文件数量/大小
            ↓
        超过阈值？
        ├─ 是 → 下载完整zip包
        └─ 否 → 下载变更文件
            ↓
        更新完成
```

---

## Bundle更新位置

### 更新位置分配

不同的Bundle在不同的位置进行更新：

#### 1. 主包（build-in）
- **更新位置**：`HotUpdate.ts`
- **触发时机**：游戏启动时
- **更新方式**：通过 `checkVersion()` 方法

#### 2. 其他Bundle（如hall等）
- **更新位置**：`HotUpdate.ts` 的 `_updateOtherBundles()` 方法
- **触发时机**：主包更新完成后，并行更新
- **更新方式**：并行调用 `zipHotUpdateManager.smartUpdate()`

#### 3. 子游戏Bundle
- **更新位置**：`SlotGameLoding.ts` 的 `_checkSlotGameUpdateWithZip()` 方法
- **触发时机**：进入子游戏时
- **更新方式**：按需更新，只在需要时下载

### 子游戏列表

以下Bundle在 `SlotGameLoding.ts` 中更新：
- JungleDelight
- ThePanda
- Diamond777
- Crazy777I
- GemsFrotuneI
- GemsFrotuneII
- Super777I
- MoneyComing

### 更新顺序

```
游戏启动
    ↓
HotUpdate.checkVersion()
    ↓
更新主包（build-in）
    ↓
更新其他Bundle（hall等，并行）
    ↓
进入子游戏
    ↓
SlotGameLoding 检查并更新子游戏
```

---

## 日志系统

### 日志开关

通过 `Config.hotUpdateLogEnabled` 控制日志输出：

```typescript
// 启用详细日志
hotUpdateLogEnabled: true

// 关闭详细日志（只显示关键信息和错误）
hotUpdateLogEnabled: false
```

### 日志级别

系统提供三种日志级别：

1. **普通日志** (`_log()`)
   - 受日志开关控制
   - 包含详细的更新进度、状态变化等信息
   - 示例：初始化信息、版本检查、下载进度

2. **警告日志** (`_warn()`)
   - 受日志开关控制
   - 包含非致命性警告信息
   - 示例：manifest读取失败、部分bundle更新失败

3. **错误日志** (`_error()`)
   - **始终输出**（不受开关控制）
   - 包含错误和异常信息
   - 示例：下载失败、解析失败、更新失败

### 日志格式

所有日志都带有前缀标识：

```
[HotUpdate] 主更新流程日志
[SlotGameLoding] 子游戏更新日志
```

### 日志示例

```javascript
// 普通日志（受开关控制）
[HotUpdate] 开始初始化热更新系统 { isNative: true, useZipHotUpdate: true }
[HotUpdate] 开始检查版本 { bundleName: "build-in", version: "1.0.0" }
[HotUpdate] 更新进度 { progress: "45.23%", downloaded: "12.5 MB", total: "27.6 MB" }

// 警告日志（受开关控制）
[HotUpdate] 部分bundle更新失败，但继续执行 { totalBundles: 3, completedCount: 2 }

// 错误日志（始终输出）
[HotUpdate] 压缩包热更新失败 { bundleName: "build-in", version: "1.0.0" }
[SlotGameLoding] 子游戏更新异常 { bundleName: "JungleDelight", error: "..." }
```

### 性能优化

为了避免日志过多影响性能：

- 频繁的进度日志（如每1%的进度）受开关控制
- 关键错误和警告始终输出，确保问题可追踪
- 开发环境（DEV）下自动启用详细日志

---

## 原生平台支持

### Android平台

#### 实现位置
`native/engine/android/app/src/com/cocos/game/PlatformAndroidApi.java`

#### 核心方法
```java
public static boolean unzipFile(String zipPath, String extractDir)
```

#### 使用方式
```typescript
// 在ZipHotUpdateManager中自动调用
jsb.reflection.callStaticMethod(
    "com/cocos/game/PlatformAndroidApi",
    "unzipFile",
    "(Ljava/lang/String;Ljava/lang/String;)Z",
    zipPath,
    extractDir
);
```

### iOS平台

#### 实现位置
- `native/engine/ios/NativeHelper.h` - 头文件
- `native/engine/ios/NativeHelper.mm` - 实现文件

#### 核心方法
```objective-c
+ (BOOL)unzipFile:(NSString *)zipPath toPath:(NSString *)extractDir;
```

#### 使用方式
```typescript
// 在ZipHotUpdateManager中自动调用
jsb.reflection.callStaticMethod(
    "NativeHelper",
    "unzipFile:toPath:",
    zipPath,
    extractDir
);
```

### 依赖库

- **Android**: 使用Java标准库 `java.util.zip`
- **iOS**: 使用第三方库 `SSZipArchive`（需要添加到项目依赖）

---

## 使用方法

### 1. 初始化热更新

在游戏启动时初始化：

```typescript
// 在游戏启动脚本中
import { HotUpdate } from 'db://assets/scripts/hotupdate/HotUpdate';

const hotUpdate = new HotUpdate();
hotUpdate.initHotUpdate();
```

### 2. 检查版本并更新

```typescript
// 检查版本
const eventCode = await hotUpdate.checkVersion();

switch (eventCode) {
    case EventCode.ALREADY_UP_TO_DATE:
        console.log('已是最新版本');
        break;
    case EventCode.UPDATE_FINISHED:
        console.log('更新完成，游戏将重启');
        break;
    case EventCode.ERROR_UPDATING:
        console.error('更新失败');
        break;
}
```

### 3. 子游戏更新

子游戏更新在 `SlotGameLoding.ts` 中自动处理，无需手动调用。

### 4. 进度回调

```typescript
// 在HotUpdate中设置进度回调
hotUpdate.onProgressCallback = (progress: number, downloadedBytes: number, totalBytes: number) => {
    console.log(`更新进度: ${progress}%`);
    // 更新UI进度条
};
```

### 5. 手动清除缓存

```typescript
import { zipHotUpdateManager } from 'db://assets/scripts/hotupdate/ZipHotUpdateManager';

// 清除所有热更新缓存
zipHotUpdateManager.clearCache();
```

---

## 常见问题

### Q1: 如何切换更新模式？

**A**: 在 `Config.ts` 中修改 `useZipHotUpdate`：

```typescript
// 使用压缩包热更新
useZipHotUpdate: true

// 使用传统文件下载
useZipHotUpdate: false
```

### Q2: 首次更新为什么下载完整zip？

**A**: 这是设计如此。首次更新时本地没有文件，下载完整zip比逐个下载文件更高效。后续更新会自动使用增量更新。

### Q3: 如何判断是否首次更新？

**A**: 系统通过检查本地是否存在 `project.manifest` 文件来判断。如果不存在，则认为是首次更新。

### Q4: 日志太多怎么办？

**A**: 在 `Config.ts` 中设置 `hotUpdateLogEnabled: false` 关闭详细日志。错误日志仍会输出。

### Q5: 如何添加新的Bundle？

**A**: 
1. 在 `hot-update-template-config.json` 中添加Bundle配置
2. 如果是子游戏，在 `SlotGameLoding.ts` 中会自动处理
3. 如果是其他Bundle，在 `HotUpdate.ts` 的 `_updateOtherBundles()` 方法中添加

### Q6: 更新失败怎么办？

**A**: 
- 系统会自动重试（最多3次）
- 如果仍然失败，会输出错误日志
- 可以手动清除缓存后重试：`zipHotUpdateManager.clearCache()`

### Q7: 如何查看更新进度？

**A**: 
- 启用日志：`hotUpdateLogEnabled: true`
- 设置进度回调：`hotUpdate.onProgressCallback`
- 查看控制台日志输出

### Q8: iOS解压失败？

**A**: 
- 确保项目中已添加 `SSZipArchive` 依赖
- 检查 `NativeHelper.mm` 是否正确实现
- 查看原生日志确认错误信息

### Q9: Android解压失败？

**A**: 
- 检查 `PlatformAndroidApi.java` 中的 `unzipFile` 方法
- 确认文件路径权限
- 查看logcat日志

### Q10: 如何测试热更新？

**A**: 
1. 确认 `Config.gameChannel` 设置正确（决定使用哪个环境配置）
2. 确认 `ENV_CONFIG` 中对应环境已配置 `hotupdateBaseUrl`
3. 修改 `Config.hotupdate_version` 为更高版本
4. 在服务器上放置对应版本的文件
5. 运行游戏，观察更新流程
6. 启用详细日志查看详细信息

### Q11: 如何切换热更新服务器地址？

**A**: 
- **方法1（推荐）**：修改 `Config.gameChannel`，系统会自动使用对应环境的 `hotupdateBaseUrl`
- **方法2**：在 `ENV_CONFIG` 中修改对应环境的 `hotupdateBaseUrl` 配置
- 无需修改 `Config.hotupdateBaseUrl`（它从 `ENV_CONFIG` 自动读取）

---

## 文件路径说明

### 本地存储路径

- **默认路径**: `{writablePath}/gg-hot-update-zip/`
- **主包路径**: `{writablePath}/gg-hot-update-zip/build-in/`
- **子包路径**: `{writablePath}/gg-hot-update-zip/assets/{bundleName}/`

### 远程文件路径

- **主包zip**: `{baseUrl}/{version}/update.zip`
- **子包zip**: `{baseUrl}/{version}/assets/{bundleName}/{bundleName}.zip`
- **主包manifest**: `{baseUrl}/{version}/project.manifest`
- **子包manifest**: `{baseUrl}/{version}/assets/{bundleName}/project.manifest`

---

## 版本历史

- **v1.0.0**: 初始版本，支持压缩包热更新和增量更新
- 支持多Bundle并行更新
- 完整的日志系统
- Android和iOS原生支持

---

## 技术支持

如有问题，请查看：
1. 控制台日志输出
2. 原生平台日志（Android: logcat, iOS: Xcode控制台）
3. 检查配置文件是否正确
4. 确认服务器文件路径和版本号

---

**最后更新**: 2024年

