# 完整构建流程指南

本指南将帮助您完成从原始包到热更新包的完整构建流程。

## 📋 构建流程概览

```
1. 构建Android原始包 (APK)
   ↓
2. 构建热更新包 (manifest + zip)
   ↓
3. 上传到服务器
```

---

## 🚀 完整流程

### 重要说明

- **`build-android.js`**: 包含完整的构建流程（Cocos Creator 构建 + APK生成）
- **`build-apk.js`**: 仅生成APK，需要先构建项目（不包含 Cocos Creator 构建流程）

### 步骤1: 构建Android原始包

#### 方式1: 使用 build-android.js（包含完整构建流程，推荐）

`build-android.js` **包含** Cocos Creator 的构建流程，会自动调用 Cocos Creator 构建项目。

```bash
# 基本构建（使用 Config.ts 中的渠道和版本）
node scripts/hotupdate/build-android.js

# 指定渠道构建
node scripts/hotupdate/build/android.js --channel D105

# 调试模式构建
node scripts/hotupdate/build-android.js --debug

node scripts/hotupdate/build-android.js --debug
```

**功能**:
- ✅ 自动调用 Cocos Creator 构建项目
- ✅ 自动更新 `gg-hot-update.json` 中的热更新版本号
- ✅ 自动发布APK到发布目录

**输出位置**: 
- 构建资源: `build/android/`
- APK文件: `安卓包/{channel}/{variant}/`

#### 方式2: 手动构建 + build-apk.js（仅生成APK）

`build-apk.js` **不包含** Cocos Creator 的构建流程，只负责从已构建的项目中生成 APK。

**前提条件**: 必须先使用 Cocos Creator 构建项目，或使用 `build-android.js` 构建。

```bash
# 方式2a: 先手动在 Cocos Creator 中构建项目
# （在 Cocos Creator 编辑器中：项目 -> 构建发布 -> Android -> 构建）

# 方式2b: 然后使用 build-apk.js 生成APK
node scripts/hotupdate/build-apk.js

# 生成Debug APK
node scripts/hotupdate/build-apk.js --variant debug

# 指定渠道
node scripts/hotupdate/build-apk.js --channel D105
```

**注意**: 如果 `build/android/proj` 目录不存在，`build-apk.js` 会提示错误：
```
❌ 错误: 项目目录不存在: build/android/proj
请先使用 Cocos Creator 构建 Android 项目
```

**输出位置**: 
- APK文件: `build/android/app/build/outputs/apk/release/` 或 `debug/`
- 发布位置: `安卓包/{channel}/{variant}/`

---

### 步骤2: 构建热更新包

构建完Android包后，使用构建输出的 `assets` 目录来生成热更新包。

**重要**: 新架构的输出路径为 `build/{outputName}/assets/`，例如：
- `build/android-test/assets/`
- `build/android-MIGame/assets/`
- `build/android-YonoHot/assets/`

#### 方式1: 构建所有Bundle（推荐）

```bash
# 通过渠道自动检测构建输出路径（推荐）
node scripts/hotupdate/build-all-bundles.js --channel test

# 自动检测（从 Config.ts 读取 gameChannel）
node scripts/hotupdate/build-all-bundles.js

# 手动指定源目录（如果自动检测失败）
node scripts/hotupdate/build-all-bundles.js \
  --source build/android-test/assets

# 手动指定版本号
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --version 1.0.0

# 只构建指定的Bundle
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --bundles build-in,hall
```

**输出位置**: `hotupdate-packages/{version}/`

#### 方式2: 构建单个Bundle

```bash
# 构建主包
node scripts/hotupdate/build-hotupdate.js \
  --bundle build-in \
  --source build/android-test/assets

# 构建子游戏
node scripts/hotupdate/build-hotupdate.js \
  --bundle hall \
  --source build/android-test/assets/assets/hall
```

**输出位置**: `hotupdate-packages/{version}/{bundle}/`

---

### 步骤3: 验证热更新包（可选）

```bash
# 验证所有Bundle
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip

# 验证单个Bundle
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/build-in/project.manifest \
  --zip hotupdate-packages/1.0.0/build-in/update.zip
```

---

### 步骤4: 上传到服务器

将生成的热更新包上传到服务器：

```
服务器目录结构:
{hotupdateBaseUrl}/
├── project.manifest
├── version.manifest
└── update.zip

或按Bundle分类:
{hotupdateBaseUrl}/
├── build-in/
│   ├── project.manifest
│   ├── version.manifest
│   └── update.zip
└── hall/
    ├── project.manifest
    ├── version.manifest
    └── update.zip
```

**注意**: `hotupdateBaseUrl` 会根据 `Config.ts` 中的 `gameChannel` 从 `ENV_CONFIG` 中自动读取。

---

## 📝 完整示例

### 示例1: 构建D105渠道的完整包（新架构，推荐方式）

```bash
# 1. 确保 Config.ts 中配置正确
# gameChannel: "D105"
# hotupdate_version: "1.0.0"

# 2. 构建Android项目
node scripts/hotupdate/build/android.js --channel D105

# 3. 后处理（修改图标、包名、应用名等）
node scripts/hotupdate/post/android.js --channel D105

# 4. 生成APK
node scripts/hotupdate/build/apk.js --channel D105

# 5. 构建热更新包（通过渠道自动检测构建输出路径）
node scripts/hotupdate/build-all-bundles.js --channel D105

# 6. 验证（可选）
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip
```

### 示例1b: 手动构建 + 生成APK

```bash
# 1. 在 Cocos Creator 中手动构建项目
# （项目 -> 构建发布 -> Android -> 构建）
# 输出到: build/{outputName}/

# 2. 使用 build/apk.js 生成APK
node scripts/hotupdate/build/apk.js --channel test

# 3. 构建热更新包（通过渠道自动检测构建输出路径）
node scripts/hotupdate/build-all-bundles.js --channel test
```

### 示例2: 构建Test渠道的完整包

```bash
# 1. 构建Android项目（会自动更新 Config.ts 中的 gameChannel）
node scripts/hotupdate/build/android.js --channel test

# 2. 后处理
node scripts/hotupdate/post/android.js --channel test

# 3. 生成APK
node scripts/hotupdate/build/apk.js --channel test

# 4. 构建热更新包（通过渠道自动检测构建输出路径）
node scripts/hotupdate/build-all-bundles.js --channel test

# 5. 上传到服务器（test渠道的热更新地址）
```

---

## ⚙️ 配置检查清单

在开始构建前，请确保：

- [ ] `Config.ts` 中的 `gameChannel` 配置正确
- [ ] `Config.ts` 中的 `hotupdate_version` 配置正确
- [ ] `ENV_CONFIG` 中对应渠道的 `hotupdateBaseUrl` 配置正确
- [ ] Cocos Creator 项目已正确配置
- [ ] Android 构建环境已准备好（JDK、Android SDK等）

---

## 🔍 常见问题

### Q: 构建热更新包时提示找不到源文件？

**A**: 确保先构建了Android包，然后使用以下方式之一：
```bash
# 方式1: 通过渠道自动检测（推荐）
node scripts/hotupdate/build-all-bundles.js --channel test

# 方式2: 手动指定源目录
node scripts/hotupdate/build-all-bundles.js \
  --source build/android-test/assets

# 注意: 源目录必须是 assets 目录，例如 build/android-test/assets
```

### Q: 热更新包的版本号不对？

**A**: 检查 `Config.ts` 中的 `hotupdate_version` 配置，或使用 `--version` 参数手动指定：
```bash
# 通过渠道自动检测，手动指定版本号
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --version 1.0.1

# 或手动指定源目录和版本号
node scripts/hotupdate/build-all-bundles.js \
  --version 1.0.1 \
  --source build/android-test/assets
```

### Q: 如何知道热更新包的输出位置？

**A**: 默认输出到 `hotupdate-packages/{version}/`，可以通过 `--output-dir` 参数自定义：
```bash
# 通过渠道自动检测，自定义输出目录
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --output-dir my-hotupdate-packages

# 或手动指定源目录和输出目录
node scripts/hotupdate/build-all-bundles.js \
  --source build/android-test/assets \
  --output-dir my-hotupdate-packages
```

### Q: 构建的APK在哪里？

**A**: 
- 构建输出: `build/android/app/build/outputs/apk/release/`
- 发布位置: `安卓包/{channel}/release/`

---

## 📚 相关文档

- [打包工具文档](./BUILD_TOOLS.md) - Android/iOS打包详细说明
- [热更新工具文档](./README_TOOLS.md) - 热更新构建工具详细说明
- [渠道配置说明](./CHANNEL_CONFIG.md) - 渠道配置详细说明
- [热更新完整指南](./HOT_UPDATE_GUIDE.md) - 热更新系统完整文档

---

**最后更新**: 2024年

