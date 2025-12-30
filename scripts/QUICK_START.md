# 快速开始 - Android 打包工具

## 快速使用

### 方式一：使用 npm 脚本（推荐）

```bash
# 基本构建
npm run build:android

# 调试模式构建
npm run build:android:debug

# 查看帮助
npm run build:android:help
```

### 方式二：直接使用脚本

```bash
# Node.js 版本
node scripts/build-android.js

# Shell 版本 (macOS/Linux)
./scripts/build-android.sh
```

## 常用命令示例

### 1. 基本构建（发布版本）

```bash
npm run build:android
```

### 2. 调试版本构建

```bash
npm run build:android:debug
# 或
node scripts/build-android.js --debug
```

### 3. 签名构建

```bash
node scripts/build-android.js \
  --sign \
  --keystore ./keystore.jks \
  --keystore-password your_password \
  --alias your_alias \
  --alias-password your_alias_password
```

### 4. 指定热更新版本构建

```bash
# 指定热更新版本
node build-android.js --hotupdate-version 1.2.1

# 签名构建并指定热更新版本
node build-android.js \
  --sign \
  --hotupdate-version 1.2.1 \
  --keystore ./keystore.jks \
  --keystore-password your_password \
  --alias your_alias \
  --alias-password your_alias_password
```

### 4. 自定义输出路径

```bash
node scripts/build-android.js \
  --build-path build/android-release \
  --output-name android-release
```

### 5. 启用 MD5 缓存（加快后续构建）

```bash
node scripts/build-android.js --md5-cache
```

### 6. 热更新版本说明

使用 `--hotupdate-version` 参数可以自动更新热更新配置文件中的版本号：

- 会自动更新 `profiles/v2/packages/gg-hot-update.json` 中的 `packageVersion`
- 会更新所有启用的构建任务的热更新版本
- 会自动创建配置文件备份（`.backup` 文件）

示例：
```bash
# 构建并设置热更新版本为 1.2.1
node scripts/build-android.js --hotupdate-version 1.2.1
```

### 7. 生成 APK 包

构建完成后，可以使用 `build-apk.js` 脚本生成 APK 文件：

```bash
# 生成 Release APK
npm run build:apk
# 或
node scripts/build-apk.js

# 生成 Debug APK
npm run build:apk:debug
# 或
node scripts/build-apk.js --variant debug

# 生成并签名 APK
node scripts/build-apk.js \
  --sign \
  --keystore ./keystore.jks \
  --keystore-password your_password \
  --alias your_alias \
  --alias-password your_alias_password

# 指定构建路径
node scripts/build-apk.js --build-path build/android-release
```

**注意**: 生成 APK 前需要先运行构建脚本生成项目文件。

### 8. Native 模板说明

Cocos Creator 构建 Android 项目时，会使用 `native/engine/android` 目录作为模板：

- **模板位置**: `native/engine/android/`
- **包含内容**: AndroidManifest.xml、build.gradle、Java 源代码、资源文件等
- **构建机制**: `settings.gradle` 中配置 `project(':app').projectDir = new File(NATIVE_DIR, 'app')`，app 模块直接引用模板目录
- **APK 位置**: 由于 app 模块直接引用模板，APK 可能在 `native/engine/android/app/build/outputs/apk/` 目录下生成

详细说明请查看 `scripts/NATIVE_TEMPLATE.md`

## 配置说明

### 修改 Cocos Creator 路径

如果 Cocos Creator 安装在不同位置，需要修改脚本：

**Node.js 版本** (`scripts/build-android.js`):
```javascript
COCOS_CREATOR_PATH: '/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator'
```

**Shell 版本** (`scripts/build-android.sh`):
```bash
COCOS_CREATOR_PATH="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator"
```

### Windows 系统

Windows 系统上，Cocos Creator 路径通常是：
```
C:\Program Files\CocosCreator\3.8.7\CocosCreator.exe
```

修改脚本中的路径配置即可。

## 构建输出

构建完成后，APK 文件通常位于：
```
build/android/proj/app/build/outputs/apk/
```

脚本会自动查找并显示 APK 文件路径。

## 故障排查

### 1. 找不到 Cocos Creator

**错误**: `错误: 找不到 Cocos Creator`

**解决**: 检查并修改脚本中的 `COCOS_CREATOR_PATH` 配置

### 2. 构建失败

**错误**: 构建过程中出现错误

**解决**: 
- 检查项目配置是否正确
- 查看 Cocos Creator 构建日志
- 确保有足够的磁盘空间
- 检查 Android SDK 是否正确配置

### 3. 签名失败

**错误**: 签名相关错误

**解决**:
- 确保 keystore 文件路径正确
- 检查密码是否正确
- 确保 alias 存在
- 检查 keystore 文件权限

## 高级用法

### 集成到 CI/CD

详见 `scripts/README.md` 中的 CI/CD 集成示例。

### 批量构建

可以创建脚本批量构建多个版本：

```bash
#!/bin/bash
# build-all.sh

# Debug 版本
node scripts/build-android.js --debug --output-name android-debug

# Release 版本
node scripts/build-android.js --output-name android-release

# 签名版本
node scripts/build-android.js \
  --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456 \
  --output-name android-signed
```

## 更多信息

详细文档请查看 `scripts/README.md`

