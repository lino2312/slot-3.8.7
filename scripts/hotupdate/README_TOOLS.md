# 热更新自动化工具使用指南

本目录包含了一套完整的热更新自动化工具，帮助您快速构建、验证和管理热更新包。

## 📦 工具列表

### 1. generate-manifest.js
生成热更新 Manifest 文件（包含完整文件结构和目录信息）

### 2. package-zip.js
打包热更新 Zip 文件

### 3. generate-file-list.js
生成文件列表（完整文件结构、散文件列表、文本列表）

### 4. build-hotupdate.js
构建单个Bundle的热更新包（包含manifest、zip和文件列表）

### 5. build-all-bundles.js
批量构建所有Bundle的热更新包

### 6. verify-update.js
验证热更新文件的完整性和正确性

### 7. clean-cache.js
清理热更新缓存和构建输出

### 8. check-hotupdate-files.sh
在 Mumu 模拟器中查看热更新下载的文件（需要 adb）

**使用方法**:
```bash
# 使用默认包名
./scripts/hotupdate/check-hotupdate-files.sh

# 指定包名
./scripts/hotupdate/check-hotupdate-files.sh com.game.testGame

# 显示 manifest 内容
./scripts/hotupdate/check-hotupdate-files.sh com.game.testGame --show-manifest
```

**注意**: 发布版本无法使用 `adb root`，脚本会自动检测并使用 `run-as`（仅调试版本）或提示查看日志。

### 9. view-hotupdate-logs.sh
通过应用日志查看热更新文件路径（适用于发布版本）⭐

**使用方法**:
```bash
# 实时查看热更新相关日志
./scripts/hotupdate/view-hotupdate-logs.sh
```

**适用场景**: 
- 发布版本（无法使用 `adb root`）
- 需要查看热更新文件的实际路径
- 调试热更新问题

**详细说明**: 查看 `VIEW_HOTUPDATE_FILES.md`

---

## 🚀 快速开始

### 安装依赖（可选）

如果使用 Node.js archiver 打包（推荐），需要安装：

```bash
npm install archiver
```

如果不安装，工具会尝试使用系统的 `zip` 命令。

### 基本使用流程

```bash
# 1. 构建所有Bundle的热更新包
node scripts/hotupdate/build-all-bundles.js \
  --version 1.0.0 \
  --source build/android/assets

# 2. 验证生成的文件
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip

# 3. 清理缓存（可选）
node scripts/hotupdate/clean-cache.js --all
```

---

## 📖 详细文档

### generate-manifest.js

生成热更新的 manifest 文件，包含所有文件的MD5和大小信息。

**使用方法**:
```bash
node scripts/hotupdate/generate-manifest.js \
  --version 1.0.0 \
  --bundle build-in \
  --source build/android/assets
```

**参数**:
- `--version <version>` - 版本号（可选，默认从 Config.ts 读取）
- `--bundle <bundle>` - Bundle名称（必需）
- `--source <path>` - 源文件目录（必需）
- `--output <path>` - 输出manifest路径（可选）
- `--config <path>` - 配置文件路径（可选）

**注意**: 版本号会自动从 `Config.ts` 的 `hotupdate_version` 配置中读取，无需手动指定。

**示例**:
```bash
# 生成主包manifest（版本号从 Config.ts 读取）
node scripts/hotupdate/generate-manifest.js \
  --bundle build-in \
  --source build/android/assets \
  --output build/android/assets/project.manifest

# 生成子游戏manifest
node scripts/hotupdate/generate-manifest.js \
  --bundle hall \
  --source build/android/assets/assets/hall

# 手动指定版本号（覆盖 Config.ts 中的配置）
node scripts/hotupdate/generate-manifest.js \
  --version 1.0.1 \
  --bundle build-in \
  --source build/android/assets
```

---

### package-zip.js

将目录打包成zip文件。

**使用方法**:
```bash
node scripts/hotupdate/package-zip.js \
  --bundle build-in \
  --source build/android/assets \
  --version 1.0.0
```

**参数**:
- `--bundle <bundle>` - Bundle名称（必需）
- `--source <path>` - 源文件目录（必需）
- `--output <path>` - 输出zip路径（可选）
- `--version <version>` - 版本号（用于生成默认路径）
- `--exclude <pattern>` - 排除文件模式（可选，多个用逗号分隔）

**示例**:
```bash
# 打包主包
node scripts/hotupdate/package-zip.js \
  --bundle build-in \
  --source build/android/assets \
  --version 1.0.0

# 打包子游戏
node scripts/hotupdate/package-zip.js \
  --bundle hall \
  --source build/android/assets/assets/hall \
  --output dist/hall.zip
```

---

### build-hotupdate.js

构建单个Bundle的完整热更新包（包含manifest和zip）。

**使用方法**:
```bash
node scripts/hotupdate/build-hotupdate.js \
  --version 1.0.0 \
  --bundle build-in \
  --source build/android/assets
```

**参数**:
- `--version <version>` - 版本号（可选，默认从 Config.ts 读取）
- `--bundle <bundle>` - Bundle名称（必需）
- `--source <path>` - 源文件目录（必需）
- `--output-dir <path>` - 输出目录（可选）
- `--skip-manifest` - 跳过生成manifest
- `--skip-zip` - 跳过打包zip
- `--config <path>` - 配置文件路径（可选）

**注意**: 
- 版本号会自动从 `Config.ts` 的 `hotupdate_version` 配置中读取，无需手动指定
- 热更新服务器地址从 `Config.ts` 的 `ENV_CONFIG` 中读取，工具脚本不需要指定

**示例**:
```bash
# 构建主包（版本号从 Config.ts 读取）
node scripts/hotupdate/build-hotupdate.js \
  --bundle build-in \
  --source build/android/assets

# 构建子游戏
node scripts/hotupdate/build-hotupdate.js \
  --bundle hall \
  --source build/android/assets/assets/hall

# 手动指定版本号（覆盖 Config.ts 中的配置）
node scripts/hotupdate/build-hotupdate.js \
  --version 1.0.1 \
  --bundle build-in \
  --source build/android/assets
```

---

### build-all-bundles.js

批量构建所有Bundle的热更新包。

**使用方法**:
```bash
# 通过渠道自动检测构建输出路径（推荐）
node scripts/hotupdate/build-all-bundles.js --channel test

# 或手动指定源目录
node scripts/hotupdate/build-all-bundles.js --source build/android-test/assets
```

**参数**:
- `--version <version>` - 版本号（可选，默认从 Config.ts 读取）
- `--channel <channel>` - 渠道号（可选，用于自动检测构建输出路径）
- `--source <path>` - 源文件目录（可选，会自动检测）
- `--output-dir <path>` - 输出目录（可选，默认: hotupdate-packages/{version}）
- `--bundles <list>` - 要构建的Bundle列表，用逗号分隔（可选，默认: 所有）
- `--config <path>` - 配置文件路径（可选）
- `--parallel` - 并行构建（可选，暂未实现）

**注意**: 
- 版本号会自动从 `Config.ts` 的 `hotupdate_version` 配置中读取，无需手动指定
- 热更新服务器地址从 `Config.ts` 的 `ENV_CONFIG` 中读取，工具脚本不需要指定
- 构建输出路径检测优先级：`--source` > `--channel` > `Config.ts` 中的 `gameChannel`

**示例**:
```bash
# 通过渠道自动检测构建输出路径（推荐）
node scripts/hotupdate/build-all-bundles.js --channel test

# 自动检测（从 Config.ts 读取 gameChannel）
node scripts/hotupdate/build-all-bundles.js

# 手动指定源目录（如果自动检测失败）
node scripts/hotupdate/build-all-bundles.js \
  --source build/android-test/assets

# 只构建指定的Bundle
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --bundles build-in,hall

# 手动指定版本号（覆盖 Config.ts 中的配置）
node scripts/hotupdate/build-all-bundles.js \
  --channel test \
  --version 1.0.1
```

---

### verify-update.js

验证热更新文件的完整性和正确性。

**使用方法**:
```bash
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip
```

**参数**:
- `--manifest <path>` - Manifest文件路径（必需）
- `--zip <path>` - Zip文件路径（可选）
- `--source <path>` - 源文件目录路径（可选）
- `--check-md5` - 检查MD5值（可选，较慢）
- `--check-size` - 检查文件大小（可选）

**示例**:
```bash
# 验证manifest和zip
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip

# 验证manifest和源文件
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --source build/android/assets

# 完整验证（包括MD5检查）
CHECK_MD5=true node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --source build/android/assets
```

---

### clean-cache.js

清理热更新缓存和构建输出。

**使用方法**:
```bash
node scripts/hotupdate/clean-cache.js --all
```

**参数**:
- `--local` - 清理本地构建缓存
- `--packages` - 清理打包输出目录
- `--all` - 清理所有缓存
- `--version <version>` - 清理指定版本的缓存
- `--dry-run` - 只显示将要删除的文件，不实际删除

**示例**:
```bash
# 清理所有缓存
node scripts/hotupdate/clean-cache.js --all

# 清理指定版本
node scripts/hotupdate/clean-cache.js --version 1.0.0

# 预览将要删除的文件
node scripts/hotupdate/clean-cache.js --all --dry-run

# 只清理打包输出
node scripts/hotupdate/clean-cache.js --packages
```

---

## 🔄 完整工作流程

### 场景1: 首次构建热更新包

```bash
# 1. 构建游戏（使用Cocos Creator或命令行）
# 例如: node scripts/hotupdate/build/android.js --channel test
# 构建输出在 build/android-test/assets

# 2. 构建所有Bundle的热更新包（通过渠道自动检测构建输出路径）
node scripts/hotupdate/build-all-bundles.js --channel test

# 或手动指定源目录
node scripts/hotupdate/build-all-bundles.js \
  --source build/android-test/assets

# 3. 验证生成的文件
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.0/project.manifest \
  --zip hotupdate-packages/1.0.0/update.zip

# 4. 上传到服务器
# 根据 Config.ts 中 ENV_CONFIG 配置的 hotupdateBaseUrl 上传文件
# 路径: {hotupdateBaseUrl}/{version}/
```

### 场景2: 更新单个Bundle

```bash
# 只更新hall Bundle（版本号从 Config.ts 读取）
node scripts/hotupdate/build-hotupdate.js \
  --bundle hall \
  --source build/android/assets/assets/hall

# 验证
node scripts/hotupdate/verify-update.js \
  --manifest hotupdate-packages/1.0.1/assets/hall/project.manifest \
  --zip hotupdate-packages/1.0.1/assets/hall/hall.zip

# 上传到服务器
# 根据 ENV_CONFIG 中配置的 hotupdateBaseUrl 上传
# 路径: {hotupdateBaseUrl}/1.0.1/assets/hall/
```

### 场景3: 清理旧版本

```bash
# 清理1.0.0版本的所有文件
node scripts/hotupdate/clean-cache.js --version 1.0.0

# 或清理所有旧版本
node scripts/hotupdate/clean-cache.js --packages
```

---

## 📁 输出目录结构

构建完成后，文件会输出到 `hotupdate-packages/{version}/` 目录：

```
hotupdate-packages/
└── 1.0.0/
    ├── update.zip                    # 主包zip
    ├── project.manifest               # 主包manifest
    └── assets/
        ├── hall/
        │   ├── hall.zip
        │   └── project.manifest
        └── {subGame}/
            ├── {subGame}.zip
            └── project.manifest
```

---

## ⚙️ 配置说明

### Bundle配置

工具会读取 `settings/hotupdate/hot-update-template-config.json` 配置文件来获取Bundle列表。

如果需要自定义配置，可以使用 `--config` 参数指定配置文件路径。

### 版本号配置

**重要**：热更新版本号在 `Config.ts` 中配置，工具脚本会自动读取。

- 版本号在 `Config.ts` 的 `hotupdate_version` 字段中配置
- 所有工具脚本（`generate-manifest.js`、`build-hotupdate.js`、`build-all-bundles.js`）会自动从 `Config.ts` 读取版本号
- 构建脚本（`build-android.js`）会自动读取版本号并更新 `gg-hot-update.json` 中的 `packageVersion`
- 如需覆盖，可以使用 `--version` 参数手动指定

**示例**：
```typescript
// Config.ts
export const Config = {
    hotupdate_version: '1.0.0',  // 热更新版本号
    // ...
};
```

### 热更新服务器地址

**重要**：热更新服务器地址（`hotupdateBaseUrl`）在 `Config.ts` 的 `ENV_CONFIG` 中配置，工具脚本不需要指定。

- 系统会根据 `Config.gameChannel` 自动选择对应环境的热更新地址
- 工具脚本构建完成后会提示上传路径，使用 `{hotupdateBaseUrl}` 占位符
- 实际使用时，`{hotupdateBaseUrl}` 会被替换为 `ENV_CONFIG[gameChannel].hotupdateBaseUrl` 的值

**示例**：
```typescript
// Config.ts
const ENV_CONFIG = {
    test: {
        hotupdateBaseUrl: "http://192.168.0.101:3000",  // 测试环境
    },
    D105: {
        hotupdateBaseUrl: "https://updateaws.fastpay11.com/GameXd105V3",  // 生产环境
    },
};
```

---

## 🐛 故障排查

### 问题: zip命令未找到

**解决方案**:
1. 安装 archiver: `npm install archiver`
2. 或安装系统zip命令（Linux/Mac: `apt-get install zip` 或 `brew install zip`）

### 问题: Manifest生成失败

**检查**:
1. 源目录是否存在
2. 源目录是否有文件
3. 是否有文件读取权限

### 问题: 验证失败

**检查**:
1. Manifest文件格式是否正确
2. Zip文件是否完整
3. 源文件是否与manifest一致

---

## 💡 最佳实践

1. **版本管理**: 每次更新都使用新的版本号
2. **验证文件**: 构建后务必验证文件完整性
3. **清理缓存**: 定期清理旧版本的构建输出
4. **自动化**: 将构建流程集成到CI/CD中
5. **备份**: 重要版本的文件建议备份

---

## 📝 注意事项

1. 构建前确保游戏已经构建完成
2. 版本号格式建议使用语义化版本（如 1.0.0）
3. 上传到服务器前务必验证文件
4. 生产环境建议关闭详细日志以提升性能
5. 大文件打包可能需要较长时间，请耐心等待

---

**更多信息**: 查看 [热更新系统完整指南](../hotupdate/HOT_UPDATE_GUIDE.md)

