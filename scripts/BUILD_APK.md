# 生成 Android APK 包指南

## 概述

`build-apk.js` 脚本用于从 Cocos Creator 构建的项目中生成 Android APK 文件。

## 前置条件

1. **已完成 Cocos Creator 构建**
   - 必须先运行 `build-android.js` 生成项目文件
   - 确保 `build/android/proj` 目录存在

2. **Android SDK 环境**
   - 已安装 Android SDK
   - 配置了 `ANDROID_HOME` 或 `ANDROID_SDK_ROOT` 环境变量
   - 已安装 Java JDK 并配置 `JAVA_HOME`

3. **签名（可选）**
   - 如需签名 APK，需要准备 keystore 文件

## 快速开始

### 方式一：使用 npm 脚本（推荐）

```bash
# 生成 Release APK
npm run build:apk

# 生成 Debug APK
npm run build:apk:debug

# 查看帮助
npm run build:apk:help
```

### 方式二：直接使用脚本

```bash
# 生成 Release APK
node scripts/build-apk.js

# 生成 Debug APK
node scripts/build-apk.js --variant debug
```

## 常用命令

### 1. 基本生成 APK

```bash
# Release 版本
node scripts/build-apk.js

# Debug 版本
node scripts/build-apk.js --variant debug
```

### 2. 生成并签名 APK

```bash
node scripts/build-apk.js \
  --sign \
  --keystore ./keystore.jks \
  --keystore-password your_password \
  --alias your_alias \
  --alias-password your_alias_password
```

### 3. 指定构建路径

```bash
node scripts/build-apk.js --build-path build/android-release
```

## 参数说明

- `--build-path <path>`: 构建输出路径，默认: `build/android`
- `--variant <variant>`: 构建变体 (`debug` 或 `release`)，默认: `release`
- `--sign`: 是否签名 APK，默认: `false`
- `--keystore <path>`: Keystore 文件路径
- `--keystore-password <pwd>`: Keystore 密码
- `--alias <alias>`: Key alias
- `--alias-password <pwd>`: Alias 密码
- `--help`: 显示帮助信息

## 完整工作流程

### 步骤 1: 构建项目

```bash
# 构建 Android 项目（包含热更新版本）
node scripts/build-android.js --hotupdate-version 1.2.1
```

### 步骤 2: 生成 APK

```bash
# 生成 Release APK
node scripts/build-apk.js

# 或生成 Debug APK
node scripts/build-apk.js --variant debug
```

### 步骤 3: 签名 APK（可选）

```bash
node scripts/build-apk.js \
  --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456
```

## APK 输出位置

生成的 APK 文件可能位于以下位置之一：

### 1. 构建输出目录（如果 app 被复制）

```
build/android/proj/app/build/outputs/apk/{variant}/
```

### 2. Native 模板目录（app 模块直接引用）

由于 `settings.gradle` 中配置了 `project(':app').projectDir = new File(NATIVE_DIR, 'app')`，
app 模块直接引用 `native/engine/android/app`，所以 APK 可能在此目录生成：

```
native/engine/android/app/build/outputs/apk/{variant}/
```

例如：
- Release APK: `native/engine/android/app/build/outputs/apk/release/yonogame-release.apk`
- Debug APK: `native/engine/android/app/build/outputs/apk/debug/yonogame-debug.apk`
- 签名 APK: `native/engine/android/app/build/outputs/apk/release/yonogame-release-signed.apk`

**注意**: 脚本会自动在多个可能的位置搜索 APK 文件。

## 环境变量配置

### macOS/Linux

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
export JAVA_HOME=$(/usr/libexec/java_home)
```

### Windows

在系统环境变量中添加：

- `ANDROID_HOME`: `C:\Users\YourName\AppData\Local\Android\Sdk`
- `JAVA_HOME`: `C:\Program Files\Java\jdk-11`

## 故障排查

### 1. 找不到 proj 目录

**错误**: `构建项目目录不存在`

**解决**: 先运行 `node scripts/build-android.js` 生成项目文件

### 2. Gradle 构建失败

**错误**: Gradle 构建过程中出现错误

**解决**:
- 检查 Android SDK 是否正确安装
- 检查 `ANDROID_HOME` 环境变量是否正确
- 检查 `JAVA_HOME` 环境变量是否正确
- 查看 Gradle 构建日志了解详细错误

### 3. 签名失败

**错误**: APK 签名失败

**解决**:
- 确保 keystore 文件路径正确
- 检查密码是否正确
- 确保 alias 存在
- 检查 `apksigner` 工具是否可用（需要 Android SDK Build Tools）

### 4. 找不到 apksigner

**错误**: `apksigner` 命令未找到

**解决**:
- 确保已安装 Android SDK Build Tools
- 检查 `ANDROID_HOME/build-tools` 目录
- 确保 `ANDROID_HOME` 环境变量正确设置

## 自动化脚本示例

### 一键构建并生成 APK

创建 `scripts/build-all.sh`:

```bash
#!/bin/bash

# 构建项目
echo "步骤 1: 构建 Android 项目..."
node scripts/build-android.js --hotupdate-version 1.2.1

# 生成 APK
echo "步骤 2: 生成 APK..."
node scripts/build-apk.js

# 签名 APK（如果需要）
if [ "$1" == "--sign" ]; then
    echo "步骤 3: 签名 APK..."
    node scripts/build-apk.js \
        --sign \
        --keystore ./keystore.jks \
        --keystore-password $KEYSTORE_PASSWORD \
        --alias $KEYSTORE_ALIAS \
        --alias-password $ALIAS_PASSWORD
fi

echo "完成！"
```

## 更多信息

- 详细构建文档: `scripts/README.md`
- 快速开始: `scripts/QUICK_START.md`

