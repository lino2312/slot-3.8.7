# 渠道配置说明

## 概述

所有构建脚本（Android、iOS、热更新）都会自动从 `Config.ts` 的 `gameChannel` 配置中读取渠道信息，实现统一的渠道管理。

## 配置方式

### 在 Config.ts 中配置渠道

```typescript
export const Config = {
    // 游戏渠道号（决定使用哪个环境配置和发布目录）
    gameChannel: "D105",  // 当前渠道
    // gameChannel: "test",  // 其他渠道（注释掉）
    
    // 其他配置...
};
```

### 渠道与环境的对应关系

渠道号对应 `ENV_CONFIG` 中的环境配置：

```typescript
const ENV_CONFIG = {
    test: {
        hotupdateBaseUrl: "http://192.168.0.101:3000",  // 测试环境
        // ...
    },
    D105: {
        hotupdateBaseUrl: "https://updateaws.fastpay11.com/GameXd105V3",  // D105环境
        // ...
    },
    D101: {
        hotupdateBaseUrl: "https://update.fastpay11.com/GameXdemo1V3",  // D101环境
        // ...
    },
    // ... 其他渠道
};
```

## 自动读取渠道的脚本

以下脚本会自动从 `Config.ts` 读取 `gameChannel`：

### 1. build-android.js
- **用途**: 构建Android包
- **渠道读取**: 自动从 `Config.gameChannel` 读取
- **发布目录**: `安卓包/{gameChannel}/{variant}/`
- **使用方式**:
  ```bash
  # 自动使用 Config.ts 中的 gameChannel
  node scripts/hotupdate/build-android.js
  
  # 手动指定渠道（覆盖 Config.ts）
  node scripts/hotupdate/build-android.js --channel Test
  ```

### 2. build-apk.js
- **用途**: 生成Android APK包
- **渠道读取**: 自动从 `Config.gameChannel` 读取
- **发布目录**: `安卓包/{gameChannel}/{variant}/`
- **使用方式**:
  ```bash
  # 自动使用 Config.ts 中的 gameChannel
  node scripts/hotupdate/build-apk.js
  
  # 手动指定渠道
  node scripts/hotupdate/build-apk.js --channel D101
  ```

### 3. build-ios.js
- **用途**: 发布iOS IPA包
- **渠道读取**: 自动从 `Config.gameChannel` 读取
- **发布目录**: `安卓包/{gameChannel}/ios/`
- **使用方式**:
  ```bash
  # 自动使用 Config.ts 中的 gameChannel
  node scripts/hotupdate/build-ios.js
  
  # 手动指定渠道
  node scripts/hotupdate/build-ios.js --channel Test
  ```

## 发布目录结构

根据 `Config.gameChannel` 的值，包会发布到对应的渠道目录：

```
安卓包/
├── D105/                    # D105渠道（Config.gameChannel = "D105"）
│   ├── debug/
│   │   └── android-D105-debug.apk
│   ├── release/
│   │   ├── android-D105-release.apk
│   │   └── output-metadata.json
│   └── ios/
│       └── app-D105.ipa
├── test/                    # test渠道（Config.gameChannel = "test"）
│   ├── release/
│   │   └── test-release.apk
│   └── ios/
│       └── app-test.ipa
├── D101/                    # D101渠道
│   ├── release/
│   │   └── android-D101-release.apk
│   └── ios/
│       └── app-D101.ipa
└── Default/                 # 默认渠道（未配置或读取失败时）
    ├── release/
    │   └── android-release.apk
    └── ios/
        └── app.ipa
```

## 工作流程

1. **配置渠道**: 在 `Config.ts` 中设置 `gameChannel`
2. **运行构建**: 执行构建脚本（不指定 `--channel` 参数）
3. **自动读取**: 脚本自动从 `Config.ts` 读取 `gameChannel`
4. **自动发布**: 包自动发布到 `安卓包/{gameChannel}/` 目录

## 渠道优先级和处理逻辑

1. **命令行参数** (`--channel`) - 最高优先级
   - **重要**: 如果指定了 `--channel`，脚本会**自动更新** `Config.ts` 中的 `gameChannel`
   - 这确保了代码运行时使用正确的渠道配置（如热更新地址等）
   - 避免配置不一致的问题
2. **Config.ts** (`gameChannel`) - 默认使用
   - 如果未指定 `--channel`，从 `Config.ts` 读取
3. **Default** - 如果都未配置，使用 Default

### 自动更新机制

当使用 `--channel` 参数时，脚本会自动检测并更新 `Config.ts` 中的 `gameChannel`：

```bash
# 当前 Config.ts 中 gameChannel = "D105"

# 使用 --channel Test 构建
node scripts/hotupdate/build-android.js --channel Test

# 输出:
# 📝 检测到渠道变更: D105 -> Test
#    正在更新 Config.ts 中的 gameChannel...
#    ✅ Config.ts 已更新，代码将使用新的渠道配置
#    ✅ 已更新 Config.ts 中的 gameChannel: D105 -> Test
#    备份文件: Config.ts.backup
```

**好处**:
- ✅ 代码运行时自动使用正确的渠道配置
- ✅ 热更新地址等配置自动匹配
- ✅ 避免手动修改配置的遗漏
- ✅ 自动备份原配置文件

## 示例场景

### 场景1: 构建D105渠道包

```typescript
// Config.ts
gameChannel: "D105"
```

```bash
# 构建Android包
node scripts/hotupdate/build-android.js
# → 发布到: 安卓包/D105/release/

# 构建APK
node scripts/hotupdate/build-apk.js
# → 发布到: 安卓包/D105/release/

# 发布iOS包
node scripts/hotupdate/build-ios.js
# → 发布到: 安卓包/D105/ios/
```

### 场景2: 临时构建其他渠道

```bash
# 即使 Config.ts 中是 D105，也可以临时构建 Test 渠道
node scripts/hotupdate/build-android.js --channel Test
# → 发布到: 安卓包/Test/release/
```

### 场景3: 切换渠道

```typescript
// 修改 Config.ts
gameChannel: "test"  // 从 D105 改为 test
```

```bash
# 重新构建，自动使用新的渠道
node scripts/hotupdate/build-android.js
# → 发布到: 安卓包/test/release/
```

## 优势

1. **统一管理**: 所有渠道配置集中在 `Config.ts`
2. **自动识别**: 无需每次手动指定渠道参数
3. **灵活覆盖**: 支持命令行参数临时覆盖
4. **目录清晰**: 每个渠道有独立的发布目录
5. **文件标识**: APK/IPA文件名包含渠道信息

## 注意事项

1. 确保 `Config.ts` 中的 `gameChannel` 值与 `ENV_CONFIG` 中的键名一致
2. 如果 `gameChannel` 在 `ENV_CONFIG` 中不存在，热更新地址可能为空
3. 发布目录会自动创建，无需手动创建
4. 文件名会自动包含渠道信息，避免不同渠道的包混淆

---

**相关文件**:
- `assets/scripts/config/Config.ts` - 渠道配置
- `scripts/hotupdate/read-config.js` - 配置读取工具
- `scripts/hotupdate/build-android.js` - Android构建脚本
- `scripts/hotupdate/build-apk.js` - APK生成脚本
- `scripts/hotupdate/build-ios.js` - iOS发布脚本

