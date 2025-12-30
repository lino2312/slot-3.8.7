# 热更新服务器部署指南

## 服务器目录结构

### 共用模式（推荐）

如果 `zipHotUpdateUseCommonPackage: true`，所有压缩包放在**同一级目录**：

```
https://update.fastpay11.com/GameXVersion3/temp/
└── 1.0.66/
    ├── update.zip                    # 主包（必需）
    ├── version.manifest              # 主包版本文件（可选，用于版本检查）
    └── assets/
        ├── hall/
        │   └── hall.zip              # hall子包
        ├── Crazy777I/
        │   └── Crazy777I.zip         # Crazy777I子包
        ├── Diamond777/
        │   └── Diamond777.zip        # Diamond777子包
        └── ...                       # 其他子包
```

### 分开模式

如果 `zipHotUpdateUseCommonPackage: false`，按平台分开：

```
https://update.fastpay11.com/GameXVersion3/temp/
└── 1.0.66/
    ├── android/
    │   ├── update.zip
    │   └── assets/
    │       ├── hall/
    │       │   └── hall.zip
    │       └── ...
    └── ios/
        ├── update.zip
        └── assets/
            ├── hall/
            │   └── hall.zip
            └── ...
```

## URL 规则

### 共用模式 URL

根据代码中的 `getZipUrl` 方法：

```typescript
// 主包
{baseUrl}/{version}/update.zip
// 示例: https://update.fastpay11.com/GameXVersion3/temp/1.0.66/update.zip

// 子包
{baseUrl}/{version}/assets/{bundleName}/{bundleName}.zip
// 示例: https://update.fastpay11.com/GameXVersion3/temp/1.0.66/assets/hall/hall.zip
```

### 分开模式 URL

```typescript
// 主包
{baseUrl}/{version}/{platform}/update.zip
// 示例: https://update.fastpay11.com/GameXVersion3/temp/1.0.66/android/update.zip

// 子包
{baseUrl}/{version}/{platform}/assets/{bundleName}/{bundleName}.zip
// 示例: https://update.fastpay11.com/GameXVersion3/temp/1.0.66/android/assets/hall/hall.zip
```

## 部署步骤

### 1. 准备压缩包

打包完成后，压缩包在：
```
hotupdate-packages/1.0.66/android/
├── update.zip
├── hall.zip
├── Crazy777I.zip
└── ...
```

### 2. 上传到服务器

#### 方式A：使用 FTP/SFTP 上传

```bash
# 上传主包
scp hotupdate-packages/1.0.66/android/update.zip \
    user@server:/path/to/GameXVersion3/temp/1.0.66/

# 上传子包
scp hotupdate-packages/1.0.66/android/hall.zip \
    user@server:/path/to/GameXVersion3/temp/1.0.66/assets/hall/

scp hotupdate-packages/1.0.66/android/Crazy777I.zip \
    user@server:/path/to/GameXVersion3/temp/1.0.66/assets/Crazy777I/
```

#### 方式B：使用 rsync 同步

```bash
# 同步所有文件
rsync -avz hotupdate-packages/1.0.66/android/ \
    user@server:/path/to/GameXVersion3/temp/1.0.66/
```

#### 方式C：使用 Web 管理面板

通过服务器的 Web 管理面板（如 cPanel、宝塔面板等）上传文件。

### 3. 目录结构要求

**重要**：必须按照以下结构组织文件：

```
服务器根目录/
└── GameXVersion3/temp/          # Config.hotupdateBaseUrl 对应的路径
    └── 1.0.66/                  # 版本号目录
        ├── update.zip           # 主包（必需）
        └── assets/              # 子包目录（必需）
            ├── hall/
            │   └── hall.zip
            ├── Crazy777I/
            │   └── Crazy777I.zip
            └── ...
```

**注意**：
- ✅ 主包 `update.zip` 直接在版本号目录下
- ✅ 子包在 `assets/{bundleName}/` 目录下
- ✅ 子包文件名必须是 `{bundleName}.zip`

### 4. 验证部署

#### 检查文件是否可访问

```bash
# 检查主包
curl -I https://update.fastpay11.com/GameXVersion3/temp/1.0.66/update.zip

# 检查子包
curl -I https://update.fastpay11.com/GameXVersion3/temp/1.0.66/assets/hall/hall.zip
```

应该返回 `200 OK` 状态码。

#### 检查文件大小

```bash
# 检查主包大小
curl -I https://update.fastpay11.com/GameXVersion3/temp/1.0.66/update.zip | grep Content-Length

# 应该和本地文件大小一致
ls -lh hotupdate-packages/1.0.66/android/update.zip
```

## 常见问题

### Q1: 所有压缩包必须在同一级目录吗？

**A**: 不是同一级目录，而是按照以下结构：

```
1.0.66/
├── update.zip              # 主包在版本号目录下
└── assets/                 # 子包在 assets/ 子目录下
    ├── hall/
    │   └── hall.zip
    └── ...
```

### Q2: 子包必须放在 assets/ 目录下吗？

**A**: 是的，根据代码中的 URL 规则：

```typescript
// 子包URL格式
{baseUrl}/{version}/assets/{bundleName}/{bundleName}.zip
```

所以子包必须放在 `assets/{bundleName}/` 目录下。

### Q3: 可以直接上传到服务器根目录吗？

**A**: 可以，但需要确保 URL 路径匹配。

如果 `hotupdateBaseUrl = "https://update.fastpay11.com/GameXVersion3/temp"`，那么：
- 文件应该放在服务器的 `/GameXVersion3/temp/` 路径下
- 或者配置服务器重定向到这个路径

### Q4: 需要配置 CORS 吗？

**A**: 如果服务器和游戏不在同一域名，可能需要配置 CORS：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

### Q5: 需要配置 MIME 类型吗？

**A**: 建议配置，确保服务器正确识别 zip 文件：

```
Content-Type: application/zip
```

## 自动化部署脚本

### 上传脚本示例

```bash
#!/bin/bash
# deploy-hotupdate.sh

VERSION=$1
SERVER="user@server"
REMOTE_PATH="/path/to/GameXVersion3/temp"

if [ -z "$VERSION" ]; then
    echo "用法: $0 {version}"
    exit 1
fi

LOCAL_DIR="hotupdate-packages/${VERSION}/android"
REMOTE_DIR="${REMOTE_PATH}/${VERSION}"

echo "上传热更新文件..."
echo "版本: ${VERSION}"
echo "本地目录: ${LOCAL_DIR}"
echo "远程目录: ${REMOTE_DIR}"

# 上传主包
echo "上传主包..."
scp "${LOCAL_DIR}/update.zip" "${SERVER}:${REMOTE_DIR}/"

# 上传子包
echo "上传子包..."
for zip_file in "${LOCAL_DIR}"/*.zip; do
    if [ -f "$zip_file" ]; then
        bundle_name=$(basename "$zip_file" .zip)
        if [ "$bundle_name" != "update" ]; then
            echo "  上传: ${bundle_name}.zip"
            ssh "${SERVER}" "mkdir -p ${REMOTE_DIR}/assets/${bundle_name}"
            scp "$zip_file" "${SERVER}:${REMOTE_DIR}/assets/${bundle_name}/${bundle_name}.zip"
        fi
    fi
done

echo "上传完成！"
```

## 总结

1. ✅ **主包和子包不是同一级目录**
   - 主包：`{version}/update.zip`
   - 子包：`{version}/assets/{bundleName}/{bundleName}.zip`

2. ✅ **必须按照代码中的 URL 规则组织目录结构**

3. ✅ **上传后验证文件可访问性**

4. ✅ **确保文件权限正确（可读）**

按照以上结构部署，热更新就能正常工作！

