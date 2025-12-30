# 热更新打包指南

本文档说明如何打包热更新资源，包括传统文件方式和压缩包方式。

## 目录结构

```
hotupdate-assets/
├── {version}/
│   ├── android/
│   │   ├── project.manifest      # 主包清单文件
│   │   ├── version.manifest       # 主包版本文件
│   │   ├── assets/                # 主包资源
│   │   └── assets/                # 子包资源目录
│   │       ├── hall/
│   │       │   ├── project.manifest
│   │       │   ├── version.manifest
│   │       │   └── ...            # hall子包资源
│   │       ├── Crazy777I/
│   │       │   ├── project.manifest
│   │       │   ├── version.manifest
│   │       │   └── ...            # Crazy777I子包资源
│   │       └── ...
│   └── ios/                       # iOS平台（结构同android）
└── ...
```

## 一、Cocos Creator 构建热更新资源

### 1. 构建项目

1. 打开 Cocos Creator 编辑器
2. 菜单：`项目` -> `构建发布`
3. 选择平台（Android/iOS）
4. 配置构建参数：
   - **发布路径**：建议设置为 `hotupdate-assets/{version}/{platform}/`
   - **MD5 缓存**：勾选（用于文件校验）
   - **内联所有 SpriteFrame**：根据需要选择
   - **合并图集中的 SpriteFrame**：根据需要选择

### 2. 构建配置示例

#### Android 构建配置

```
发布路径: hotupdate-assets/1.0.66/android/
MD5 缓存: ✓
内联所有 SpriteFrame: ✗
合并图集中的 SpriteFrame: ✗
```

#### iOS 构建配置

```
发布路径: hotupdate-assets/1.0.66/ios/
MD5 缓存: ✓
内联所有 SpriteFrame: ✗
合并图集中的 SpriteFrame: ✗
```

### 3. 构建子包（Bundle）

如果项目使用了子包（Bundle），需要单独构建每个子包：

1. 在构建面板中，选择 **资源服务器地址**
2. 对于每个子包，设置对应的发布路径：
   - `hall` 子包：`hotupdate-assets/{version}/{platform}/assets/hall/`
   - `Crazy777I` 子包：`hotupdate-assets/{version}/{platform}/assets/Crazy777I/`
   - 其他子包类似

### 4. 构建输出

构建完成后，会在发布路径下生成：
- `project.manifest` - 项目清单文件（包含所有资源信息）
- `version.manifest` - 版本清单文件（包含版本信息）
- `assets/` - 资源目录
- 其他必要文件

## 二、打包压缩包（Zip 方式）

### 1. 手动打包

#### 主包压缩包

```bash
# 进入版本目录
cd hotupdate-assets/1.0.66/android/

# 打包主包（包含 project.manifest, version.manifest 和 assets 目录）
zip -r update.zip project.manifest version.manifest assets/

# 或者使用 7z（压缩率更高）
7z a -tzip update.zip project.manifest version.manifest assets/
```

#### 子包压缩包

```bash
# 打包 hall 子包
cd hotupdate-assets/1.0.66/android/assets/hall/
zip -r ../../hall.zip project.manifest version.manifest assets/

# 打包 Crazy777I 子包
cd hotupdate-assets/1.0.66/android/assets/Crazy777I/
zip -r ../../Crazy777I.zip project.manifest version.manifest assets/
```

### 2. 自动化打包脚本

创建打包脚本 `package-hotupdate.sh`：

```bash
#!/bin/bash

# 热更新打包脚本
# 用法: ./package-hotupdate.sh {version} {platform}
# 示例: ./package-hotupdate.sh 1.0.66 android

VERSION=$1
PLATFORM=$2

if [ -z "$VERSION" ] || [ -z "$PLATFORM" ]; then
    echo "用法: $0 {version} {platform}"
    echo "示例: $0 1.0.66 android"
    exit 1
fi

BASE_DIR="hotupdate-assets/${VERSION}/${PLATFORM}"
OUTPUT_DIR="hotupdate-packages/${VERSION}/${PLATFORM}"

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

echo "开始打包热更新资源..."
echo "版本: ${VERSION}"
echo "平台: ${PLATFORM}"
echo "源目录: ${BASE_DIR}"
echo "输出目录: ${OUTPUT_DIR}"

# 打包主包
if [ -d "${BASE_DIR}" ]; then
    echo "打包主包..."
    cd "${BASE_DIR}"
    zip -r "../../${OUTPUT_DIR}/update.zip" project.manifest version.manifest assets/ 2>/dev/null
    cd - > /dev/null
    echo "主包打包完成: ${OUTPUT_DIR}/update.zip"
fi

# 打包子包
if [ -d "${BASE_DIR}/assets" ]; then
    for bundle_dir in "${BASE_DIR}/assets"/*; do
        if [ -d "$bundle_dir" ]; then
            bundle_name=$(basename "$bundle_dir")
            echo "打包子包: ${bundle_name}..."
            
            cd "$bundle_dir"
            if [ -f "project.manifest" ] && [ -f "version.manifest" ]; then
                zip -r "../../../${OUTPUT_DIR}/${bundle_name}.zip" project.manifest version.manifest assets/ 2>/dev/null
                echo "子包打包完成: ${OUTPUT_DIR}/${bundle_name}.zip"
            fi
            cd - > /dev/null
        fi
    done
fi

echo "打包完成！"
echo "输出目录: ${OUTPUT_DIR}"
ls -lh "${OUTPUT_DIR}"
```

### 3. Windows 打包脚本

创建 `package-hotupdate.bat`：

```batch
@echo off
REM 热更新打包脚本（Windows）
REM 用法: package-hotupdate.bat {version} {platform}
REM 示例: package-hotupdate.bat 1.0.66 android

set VERSION=%1
set PLATFORM=%2

if "%VERSION%"=="" (
    echo 用法: %0 {version} {platform}
    echo 示例: %0 1.0.66 android
    exit /b 1
)

if "%PLATFORM%"=="" (
    echo 用法: %0 {version} {platform}
    echo 示例: %0 1.0.66 android
    exit /b 1
)

set BASE_DIR=hotupdate-assets\%VERSION%\%PLATFORM%
set OUTPUT_DIR=hotupdate-packages\%VERSION%\%PLATFORM%

REM 创建输出目录
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo 开始打包热更新资源...
echo 版本: %VERSION%
echo 平台: %PLATFORM%
echo 源目录: %BASE_DIR%
echo 输出目录: %OUTPUT_DIR%

REM 打包主包
if exist "%BASE_DIR%" (
    echo 打包主包...
    cd /d "%BASE_DIR%"
    "C:\Program Files\7-Zip\7z.exe" a -tzip "..\..\%OUTPUT_DIR%\update.zip" project.manifest version.manifest assets\
    cd /d "%~dp0"
    echo 主包打包完成: %OUTPUT_DIR%\update.zip
)

REM 打包子包
if exist "%BASE_DIR%\assets" (
    for /d %%d in ("%BASE_DIR%\assets\*") do (
        set BUNDLE_DIR=%%d
        for %%f in ("%%d") do set BUNDLE_NAME=%%~nxf
        
        echo 打包子包: !BUNDLE_NAME!...
        cd /d "!BUNDLE_DIR!"
        if exist "project.manifest" if exist "version.manifest" (
            "C:\Program Files\7-Zip\7z.exe" a -tzip "..\..\..\%OUTPUT_DIR%\!BUNDLE_NAME!.zip" project.manifest version.manifest assets\
            echo 子包打包完成: %OUTPUT_DIR%\!BUNDLE_NAME!.zip
        )
        cd /d "%~dp0"
    )
)

echo 打包完成！
echo 输出目录: %OUTPUT_DIR%
dir "%OUTPUT_DIR%"
```

## 三、压缩包结构要求

### 主包压缩包结构

```
update.zip
├── project.manifest          # 必须
├── version.manifest          # 必须
└── assets/                   # 必须
    ├── scripts/
    ├── textures/
    ├── audio/
    └── ...
```

### 子包压缩包结构

```
hall.zip (或其他子包名.zip)
├── project.manifest          # 必须
├── version.manifest          # 必须
└── assets/                   # 必须（子包资源）
    ├── scripts/
    ├── textures/
    └── ...
```

**重要提示**：
- 压缩包内的文件路径必须保持相对路径结构
- `project.manifest` 和 `version.manifest` 必须在压缩包根目录
- `assets/` 目录必须在压缩包根目录

## 四、服务器部署

### 1. 目录结构

将打包好的压缩包上传到服务器，目录结构如下：

```
https://update.fastpay11.com/GameXVersion3/
├── 1.0.66/
│   ├── update.zip                    # 主包压缩包
│   ├── version.manifest              # 主包版本文件（用于版本检查）
│   └── assets/
│       ├── hall/
│       │   └── hall.zip              # hall子包压缩包
│       ├── Crazy777I/
│       │   └── Crazy777I.zip          # Crazy777I子包压缩包
│       └── ...
└── 1.0.67/
    └── ...
```

### 2. URL 规则

根据代码中的 `getZipUrl` 方法，URL 规则为：

- **主包**: `{hotupdateBaseUrl}/{version}/update.zip`
  - 示例: `https://update.fastpay11.com/GameXVersion3/1.0.66/update.zip`

- **子包**: `{hotupdateBaseUrl}/{version}/assets/{bundleName}/{bundleName}.zip`
  - 示例: `https://update.fastpay11.com/GameXVersion3/1.0.66/assets/hall/hall.zip`

### 3. 版本清单文件（可选）

建议在服务器根目录放置版本清单文件 `version.json`：

```json
{
    "version": "1.0.66",
    "updateUrl": "https://update.fastpay11.com/GameXVersion3/1.0.66/update.zip",
    "size": 52428800,
    "md5": "abc123def456...",
    "forceUpdate": false,
    "releaseNotes": "修复了一些bug，优化了性能",
    "bundles": [
        {
            "name": "hall",
            "url": "https://update.fastpay11.com/GameXVersion3/1.0.66/assets/hall/hall.zip",
            "size": 10485760,
            "md5": "xyz789..."
        },
        {
            "name": "Crazy777I",
            "url": "https://update.fastpay11.com/GameXVersion3/1.0.66/assets/Crazy777I/Crazy777I.zip",
            "size": 20971520,
            "md5": "uvw456..."
        }
    ]
}
```

## 五、打包检查清单

打包完成后，请检查以下事项：

- [ ] 压缩包文件存在且可正常解压
- [ ] 压缩包内包含 `project.manifest` 文件
- [ ] 压缩包内包含 `version.manifest` 文件
- [ ] 压缩包内包含 `assets/` 目录
- [ ] 压缩包内的文件路径结构正确
- [ ] 压缩包大小合理（建议 < 100MB）
- [ ] 压缩包已上传到服务器
- [ ] 服务器URL可正常访问
- [ ] 版本号与 Config.ts 中的 `hotupdate_version` 一致

## 六、常见问题

### Q1: 压缩包解压后文件路径不对？

**A**: 确保压缩时使用的是相对路径，不要包含绝对路径。使用以下命令：

```bash
# 正确：在目录内压缩
cd hotupdate-assets/1.0.66/android/
zip -r update.zip project.manifest version.manifest assets/

# 错误：从外部压缩（会包含完整路径）
zip -r update.zip hotupdate-assets/1.0.66/android/*
```

### Q2: 压缩包太大怎么办？

**A**: 
1. 使用更高压缩率的工具（如 7z）
2. 只打包变更的文件（增量更新）
3. 优化资源文件（压缩图片、音频等）

### Q3: 如何做增量更新？

**A**: 
1. 对比新旧版本的 `project.manifest`
2. 只打包 MD5 不同的文件
3. 创建增量压缩包

### Q4: 压缩包下载后解压失败？

**A**: 
1. 检查压缩包是否完整（下载是否中断）
2. 检查原生端解压功能是否正常
3. 检查设备存储空间是否充足
4. 检查文件权限

## 七、自动化打包流程建议

### 1. CI/CD 集成

可以在 CI/CD 流程中集成自动打包：

```yaml
# .github/workflows/build-hotupdate.yml
name: Build Hot Update

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Cocos Project
        run: |
          # 构建项目（需要配置 Cocos Creator CLI）
          
      - name: Package Hot Update
        run: |
          chmod +x package-hotupdate.sh
          ./package-hotupdate.sh ${{ github.ref_name }} android
          
      - name: Upload to Server
        run: |
          # 上传压缩包到服务器
```

### 2. 版本管理

建议使用语义化版本号：
- 主版本号：重大更新
- 次版本号：功能更新
- 修订号：bug修复

例如：`1.0.66` -> `1.0.67` -> `1.1.0`

## 总结

1. **构建**：使用 Cocos Creator 构建热更新资源
2. **打包**：将资源打包成 zip 压缩包
3. **部署**：上传到服务器对应目录
4. **测试**：验证下载和解压功能

按照以上步骤，即可完成热更新资源的打包和部署。

