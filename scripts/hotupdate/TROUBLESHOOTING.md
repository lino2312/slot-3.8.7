# 热更新故障排查指南

## 错误：解析远程版本清单错误

### 错误信息
```
[GameLaunch] 检查更新失败：解析远程版本清单错误
[GameLaunch] 检查更新失败，已达到最大重试次数
```

### 原因分析

这个错误通常发生在以下情况：

1. **version.manifest 文件不存在**
   - 服务器上没有 `version.manifest` 文件
   - URL 路径不正确

2. **version.manifest 文件格式错误**
   - 文件内容不是有效的 JSON
   - 文件编码问题

3. **网络请求失败**
   - 服务器不可访问
   - 网络连接问题
   - CORS 跨域问题

4. **URL 配置错误**
   - `hotupdateBaseUrl` 配置不正确
   - 版本号不匹配

### 解决方案

#### 1. 检查 version.manifest 文件是否存在

**URL 规则**：
```
{hotupdateBaseUrl}/{version}/version.manifest
```

**示例**：
- 如果 `hotupdateBaseUrl = "https://update.fastpay11.com/GameXVersion3/temp"`
- 如果 `hotupdate_version = "1.0.66"`
- 那么 URL 应该是：`https://update.fastpay11.com/GameXVersion3/temp/1.0.66/version.manifest`

**检查方法**：
```bash
# 在浏览器中访问
https://update.fastpay11.com/GameXVersion3/temp/1.0.66/version.manifest

# 或使用 curl
curl -I https://update.fastpay11.com/GameXVersion3/temp/1.0.66/version.manifest
```

应该返回 `200 OK` 和文件内容。

#### 2. 上传 version.manifest 文件

**文件位置**：
```
服务器: {baseUrl}/{version}/version.manifest
本地: hotupdate-assets/{version}/{platform}/version.manifest
```

**上传步骤**：
```bash
# 上传 version.manifest 到服务器
scp hotupdate-assets/1.0.66/android/version.manifest \
    user@server:/path/to/GameXVersion3/temp/1.0.66/version.manifest
```

#### 3. 检查 version.manifest 文件格式

**正确的格式**：
```json
{
    "version": "1.0.66",
    "packageUrl": "https://update.fastpay11.com/GameXVersion3/temp/1.0.66",
    "remoteVersionUrl": "https://update.fastpay11.com/GameXVersion3/temp/1.0.66/version.manifest",
    "remoteManifestUrl": "https://update.fastpay11.com/GameXVersion3/temp/1.0.66/project.manifest"
}
```

**检查方法**：
```bash
# 查看文件内容
cat hotupdate-assets/1.0.66/android/version.manifest

# 验证 JSON 格式
cat hotupdate-assets/1.0.66/android/version.manifest | python -m json.tool
```

#### 4. 检查配置

**Config.ts 配置**：
```typescript
export const Config = {
    hotupdateBaseUrl: "https://update.fastpay11.com/GameXVersion3/temp",
    hotupdate_version: '1.0.66',  // 必须和服务器上的版本号一致
    // ...
};
```

**验证 URL**：
```typescript
// 主包 version.manifest URL
const versionManifestUrl = `${Config.hotupdateBaseUrl}/${Config.hotupdate_version}/version.manifest`;
console.log('version.manifest URL:', versionManifestUrl);
```

#### 5. 添加调试日志

在 `GGHotUpdateInstance.ts` 中，检查请求的 URL 和响应：

```typescript
// 在 fetch 之前添加日志
console.log('[GGHotUpdate] 请求 version.manifest URL:', this._versionManifesetRemoteUrl);

fetch(this._versionManifesetRemoteUrl)
    .then((resp: Response) => {
        console.log('[GGHotUpdate] 响应状态:', resp.status, resp.statusText);
        if (!resp.ok) {
            console.error('[GGHotUpdate] HTTP 错误:', resp.status, resp.statusText);
        }
        return resp.text();
    })
    .then((versionManifestText: string | null) => {
        console.log('[GGHotUpdate] 响应内容:', versionManifestText);
        // ...
    })
    .catch((error) => {
        console.error('[GGHotUpdate] 请求失败:', error);
        // ...
    });
```

### 完整检查清单

- [ ] 服务器上存在 `version.manifest` 文件
- [ ] `version.manifest` 文件路径正确
- [ ] `version.manifest` 文件格式正确（有效 JSON）
- [ ] `hotupdateBaseUrl` 配置正确
- [ ] `hotupdate_version` 和服务器版本号一致
- [ ] 服务器可访问（网络正常）
- [ ] 服务器配置了正确的 MIME 类型
- [ ] 没有 CORS 跨域问题（如果是跨域）

### 快速修复脚本

```bash
#!/bin/bash
# 上传 version.manifest 和 project.manifest 到服务器

VERSION="1.0.66"
SERVER="user@server"
REMOTE_PATH="/path/to/GameXVersion3/temp/${VERSION}"

echo "上传清单文件..."
echo "版本: ${VERSION}"

# 上传 version.manifest
if [ -f "hotupdate-assets/${VERSION}/android/version.manifest" ]; then
    echo "上传 version.manifest..."
    scp "hotupdate-assets/${VERSION}/android/version.manifest" \
        "${SERVER}:${REMOTE_PATH}/version.manifest"
    echo "✓ version.manifest 上传完成"
else
    echo "✗ version.manifest 文件不存在"
fi

# 上传 project.manifest
if [ -f "hotupdate-assets/${VERSION}/android/project.manifest" ]; then
    echo "上传 project.manifest..."
    scp "hotupdate-assets/${VERSION}/android/project.manifest" \
        "${SERVER}:${REMOTE_PATH}/project.manifest"
    echo "✓ project.manifest 上传完成"
else
    echo "✗ project.manifest 文件不存在"
fi

echo "完成！"
```

### 常见问题

#### Q1: 为什么需要 version.manifest？

**A**: `version.manifest` 用于版本检查，告诉客户端当前服务器上的版本号，客户端通过比较本地版本和远程版本来判断是否需要更新。

#### Q2: version.manifest 和 project.manifest 的区别？

**A**:
- `version.manifest`: 只包含版本信息，用于快速版本检查
- `project.manifest`: 包含所有资源的详细信息（文件列表、MD5、大小等），用于下载更新

#### Q3: 如果使用压缩包热更新，还需要 version.manifest 吗？

**A**: 如果使用压缩包热更新（`useZipHotUpdate: true`），可能不需要 `version.manifest`，因为压缩包热更新有自己的版本检查逻辑。但如果使用传统热更新（`useZipHotUpdate: false`），必须要有 `version.manifest`。

### 总结

1. ✅ **确保服务器上有 version.manifest 文件**
2. ✅ **确保文件路径和 URL 配置一致**
3. ✅ **确保文件格式正确（有效 JSON）**
4. ✅ **确保版本号匹配**

按照以上步骤检查，应该能解决"解析远程版本清单错误"的问题。

