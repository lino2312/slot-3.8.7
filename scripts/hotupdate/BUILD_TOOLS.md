# Android/iOS 打包工具使用指南

本目录包含Android和iOS打包工具，支持自动从 `Config.ts` 读取渠道配置，并将构建产物自动发布到 `安卓包` 目录。

## 📦 工具列表

### 1. build-android.js
使用Cocos Creator构建Android项目

### 2. build-apk.js
使用Gradle生成Android APK包

### 3. build-ios.js
发布iOS IPA包到发布目录

---

## 🚀 快速开始

### Android 打包

```bash
# 基本构建（渠道从 Config.ts 读取）
node scripts/hotupdate/build-android.js

# 指定渠道构建
node scripts/hotupdate/build-android.js --channel test

# 生成APK（使用Gradle）
node scripts/hotupdate/build-apk.js
```

### iOS 打包

```bash
# 发布iOS包（渠道从 Config.ts 读取）
node scripts/hotupdate/build-ios.js
```

---

## 📖 详细文档

### build-android.js

使用Cocos Creator构建Android项目，支持自动发布到发布目录。

**使用方法**:
```bash
node scripts/hotupdate/build-android.js [options]
```

**参数**:
- `--channel <channel>` - 渠道名称（可选，默认从 Config.ts 读取）
- `--platform <platform>` - 构建平台（默认: android）
- `--build-path <path>` - 构建输出路径（默认: build/android）
- `--output-name <name>` - 输出名称（默认: android）
- `--debug` - 调试模式（默认: false）
- `--sign` - 是否签名APK（默认: false）
- `--no-publish` - 不发布到发布目录（默认: false）
- `--help` - 显示帮助信息

**功能**:
- ✅ 自动从 `Config.ts` 读取 `gameChannel` 作为渠道
- ✅ 使用 `--channel` 时自动更新 `Config.ts` 中的 `gameChannel`
- ✅ 自动更新 `gg-hot-update.json` 中的热更新版本号
- ✅ 自动发布APK到 `安卓包/{channel}/{variant}/` 目录
- ✅ 支持渠道图标自动替换

**示例**:
```bash
# 构建并发布（使用 Config.ts 中的渠道）
node scripts/hotupdate/build-android.js

# 指定渠道构建
node scripts/hotupdate/build-android.js --channel MIGame

# 调试模式构建
node scripts/hotupdate/build-android.js --debug

# 签名构建
node scripts/hotupdate/build-android.js --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456

# 只构建，不发布
node scripts/hotupdate/build-android.js --no-publish
```

---

### build-apk.js

使用Gradle生成Android APK包，支持签名和自动发布。

**重要**: 此脚本**不包含** Cocos Creator 的构建流程，只负责从已构建的项目中生成 APK。

**前提条件**: 必须先使用 Cocos Creator 构建项目（在编辑器中构建，或使用 `build-android.js`）。

**使用方法**:
```bash
node scripts/hotupdate/build-apk.js [options]
```

**参数**:
- `--build-path <path>` - 构建输出路径（默认: build/android）
- `--variant <variant>` - 构建变体（debug/release，默认: release）
- `--channel <channel>` - 渠道名称（可选，默认从 Config.ts 读取）
- `--no-publish` - 不发布到发布目录（默认: false）
- `--sign` - 是否签名APK（默认: false）
- `--keystore <path>` - Keystore文件路径
- `--keystore-password <pwd>` - Keystore密码
- `--alias <alias>` - Key alias
- `--alias-password <pwd>` - Alias密码
- `--help` - 显示帮助信息

**功能**:
- ✅ 自动从 `Config.ts` 读取 `gameChannel` 作为渠道
- ✅ 使用 `--channel` 时自动更新 `Config.ts` 中的 `gameChannel`
- ✅ 自动查找并构建APK（使用 Gradle）
- ✅ 支持APK签名
- ✅ 自动发布APK到 `安卓包/{channel}/{variant}/` 目录

**注意**: 
- ⚠️ 如果 `build/android/proj` 目录不存在，脚本会提示错误
- ⚠️ 需要先使用 Cocos Creator 构建项目，或使用 `build-android.js` 构建

**示例**:
```bash
# 生成Release APK（渠道从 Config.ts 读取）
node scripts/hotupdate/build-apk.js

# 生成Debug APK
node scripts/hotupdate/build-apk.js --variant debug

# 指定渠道
node scripts/hotupdate/build-apk.js --channel test

# 生成并签名APK
node scripts/hotupdate/build-apk.js --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456

# 只构建，不发布
node scripts/hotupdate/build-apk.js --no-publish
```

---

### build-ios.js

发布iOS IPA包到发布目录。

**使用方法**:
```bash
node scripts/hotupdate/build-ios.js [options]
```

**参数**:
- `--build-path <path>` - 构建输出路径（默认: build/ios）
- `--channel <channel>` - 渠道名称（可选，默认从 Config.ts 读取）
- `--help` - 显示帮助信息

**功能**:
- ✅ 自动从 `Config.ts` 读取 `gameChannel` 作为渠道
- ✅ 使用 `--channel` 时自动更新 `Config.ts` 中的 `gameChannel`
- ✅ 自动查找IPA文件
- ✅ 自动发布IPA到 `安卓包/{channel}/ios/` 目录

**注意**: iOS构建需要在macOS上使用Xcode完成，此脚本主要用于发布已构建的IPA文件。

**示例**:
```bash
# 发布iOS包（渠道从 Config.ts 读取）
node scripts/hotupdate/build-ios.js

# 指定构建路径和渠道
node scripts/hotupdate/build-ios.js \
  --build-path build/ios \
  --channel Test
```

---

## 📁 发布目录结构

所有构建产物会自动发布到 `安卓包` 目录，按渠道和类型分类：

```
安卓包/
├── D105/                    # D105渠道（从 Config.ts 读取）
│   ├── debug/
│   │   └── android-D105-debug.apk
│   ├── release/
│   │   ├── android-D105-release.apk
│   │   └── output-metadata.json
│   └── ios/
│       └── app-D105.ipa
├── test/                    # test渠道
│   ├── release/
│   │   └── test-release.apk
│   └── ios/
│       └── app-test.ipa
└── Default/                 # 默认渠道
    ├── release/
    │   └── android-release.apk
    └── ios/
        └── app.ipa
```

---

## ⚙️ 渠道配置

### 自动读取和更新渠道

所有脚本都会自动从 `Config.ts` 的 `gameChannel` 配置中读取渠道：

```typescript
// Config.ts
export const Config = {
    gameChannel: "D105",  // 当前渠道
    // ...
};
```

### 渠道优先级和处理逻辑

1. **命令行参数** (`--channel`) - 最高优先级
   - 如果指定了 `--channel`，脚本会**自动更新** `Config.ts` 中的 `gameChannel`
   - 确保代码运行时使用正确的渠道配置（如热更新地址等）
2. **Config.ts** (`gameChannel`) - 默认使用
   - 如果未指定 `--channel`，从 `Config.ts` 读取
3. **Default** - 如果都未配置

### 自动更新机制

**重要**: 当使用 `--channel` 参数指定渠道时，脚本会自动更新 `Config.ts` 中的 `gameChannel`，确保：
- ✅ 代码运行时使用正确的渠道配置
- ✅ 热更新地址等配置自动匹配
- ✅ 避免配置不一致的问题

**示例**:
```bash
# 当前 Config.ts 中 gameChannel = "D105"

# 使用 --channel Test 构建
node scripts/hotupdate/build-android.js --channel Test

# 脚本会自动：
# 1. 检测到渠道变更: D105 -> Test
# 2. 更新 Config.ts 中的 gameChannel 为 "Test"
# 3. 构建并发布到: 安卓包/Test/release/
# 4. 代码运行时将使用 Test 渠道的配置（如热更新地址）
```

### 手动切换渠道

也可以直接修改 `Config.ts` 中的 `gameChannel`：

```typescript
// 切换到test渠道
gameChannel: "test"
```

然后运行构建脚本，会自动使用新的渠道。

---

## 🔄 完整工作流程

### Android 完整流程

```bash
# 1. 使用Cocos Creator构建项目
node scripts/hotupdate/build-android.js

# 2. 生成APK（如果需要）
node scripts/hotupdate/build-apk.js

# APK会自动发布到: 安卓包/{channel}/release/
```

### iOS 完整流程

```bash
# 1. 使用Xcode构建并导出IPA
# （在Xcode中完成）

# 2. 发布IPA到发布目录
node scripts/hotupdate/build-ios.js

# IPA会自动发布到: 安卓包/{channel}/ios/
```

---

## 📝 文件命名规则

### Android APK

- **格式**: `{outputName}-{channel}-{variant}.apk`
- **示例**: 
  - `android-D105-release.apk`
  - `test-test-debug.apk`

### iOS IPA

- **格式**: `{originalName}-{channel}.ipa`
- **示例**:
  - `app-D105.ipa`
  - `app-test.ipa`

---

## 💡 最佳实践

1. **统一渠道管理**: 在 `Config.ts` 中配置 `gameChannel`，所有脚本自动使用
2. **版本管理**: 热更新版本号也在 `Config.ts` 中配置，自动同步
3. **发布目录**: 所有包自动发布到 `安卓包` 目录，按渠道分类
4. **文件标识**: 文件名包含渠道信息，避免混淆

---

## 🔗 相关文档

- [渠道配置说明](./CHANNEL_CONFIG.md) - 详细的渠道配置说明
- [热更新工具](./README_TOOLS.md) - 热更新相关工具
- [热更新完整指南](./HOT_UPDATE_GUIDE.md) - 热更新系统完整文档

---

## ⚠️ 注意事项

1. **Android构建**: 需要先使用Cocos Creator构建项目，然后使用 `build-apk.js` 生成APK
2. **iOS构建**: 需要在macOS上使用Xcode构建并导出IPA，然后使用 `build-ios.js` 发布
3. **渠道配置**: 
   - 确保 `Config.ts` 中的 `gameChannel` 与 `ENV_CONFIG` 中的键名一致
   - 使用 `--channel` 参数时，脚本会自动更新 `Config.ts`，确保代码使用正确的渠道配置
4. **发布目录**: 发布目录会自动创建，无需手动创建
5. **配置备份**: 更新 `Config.ts` 时会自动创建备份文件 `Config.ts.backup`

---

**最后更新**: 2024年

