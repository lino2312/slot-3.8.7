# 自动化构建脚本

## Android 打包工具

### Node.js 版本

使用 Node.js 脚本进行构建，支持跨平台。

#### 使用方法

```bash
# 基本构建
node scripts/build-android.js

# 调试模式构建
node scripts/build-android.js --debug

# 签名构建
node scripts/build-android.js --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456

# 查看帮助
node scripts/build-android.js --help
```

#### 选项说明

- `--platform <platform>`: 构建平台 (android, android-instant) 默认: android
- `--build-path <path>`: 构建输出路径 默认: build/android
- `--output-name <name>`: 输出名称 默认: android
- `--debug`: 是否调试模式 默认: false
- `--md5-cache`: 是否启用 MD5 缓存 默认: false
- `--skip-compress-texture`: 是否跳过纹理压缩 默认: false
- `--source-maps`: 是否生成 source maps 默认: false
- `--sign`: 是否签名 APK 默认: false
- `--keystore <path>`: Keystore 文件路径
- `--keystore-password <pwd>`: Keystore 密码
- `--alias <alias>`: Key alias
- `--alias-password <pwd>`: Alias 密码

### Shell 版本

使用 Shell 脚本进行构建，适用于 macOS/Linux。

#### 使用方法

```bash
# 基本构建
./scripts/build-android.sh

# 调试模式构建
./scripts/build-android.sh --debug

# 签名构建
./scripts/build-android.sh --sign \
  --keystore ./keystore.jks \
  --keystore-password 123456 \
  --alias mykey \
  --alias-password 123456

# 查看帮助
./scripts/build-android.sh --help
```

#### 选项说明

与 Node.js 版本相同。

## 配置

### Cocos Creator 路径

如果 Cocos Creator 安装路径不同，请修改脚本中的 `COCOS_CREATOR_PATH` 配置：

**Node.js 版本** (`scripts/build-android.js`):
```javascript
const CONFIG = {
    COCOS_CREATOR_PATH: '/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator',
    // ...
};
```

**Shell 版本** (`scripts/build-android.sh`):
```bash
COCOS_CREATOR_PATH="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator"
```

### Windows 系统

在 Windows 系统上，Cocos Creator 路径通常是：
```
C:\Program Files\CocosCreator\3.8.7\CocosCreator.exe
```

## 常见问题

### 1. 找不到 Cocos Creator

确保 Cocos Creator 已安装，并修改脚本中的路径配置。

### 2. 构建失败

- 检查项目配置是否正确
- 查看构建日志了解详细错误信息
- 确保有足够的磁盘空间

### 3. 签名失败

- 确保 keystore 文件路径正确
- 检查密码是否正确
- 确保 alias 存在

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: Build Android

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Android
        run: |
          node scripts/build-android.js --debug
      - name: Upload APK
        uses: actions/upload-artifact@v2
        with:
          name: android-apk
          path: build/android/**/*.apk
```

### Jenkins 示例

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'node scripts/build-android.js --sign --keystore ./keystore.jks --keystore-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_ALIAS} --alias-password ${ALIAS_PASSWORD}'
            }
        }
        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'build/android/**/*.apk', fingerprint: true
            }
        }
    }
}
```

