# 子游戏压缩包下载逻辑说明

## 问题描述

在子游戏下载过程中（进度64%），`onSuccess` 回调被提前触发，导致系统认为下载已完成，但实际上文件还在下载中。

## 问题原因

1. **下载器行为**：`native.Downloader` 的 `onSuccess` 回调可能在文件完全下载前就被触发
2. **缺少验证**：代码中没有验证文件完整性（文件大小检查）
3. **重复触发**：没有防重复触发机制，可能导致多次处理

## 修复方案

### 1. 添加防重复触发机制

```typescript
let isSuccessHandled = false; // 防重复触发标志

this._downloader!.onSuccess = (task: native.DownloadTask) => {
    // 防重复触发：如果已经处理过，直接返回
    if (isSuccessHandled) {
        this._log("下载成功回调已处理，忽略重复触发");
        return;
    }
    // ...
};
```

### 2. 添加文件完整性验证

```typescript
const verifyFileIntegrity = (filePath: string): boolean => {
    if (!native.fileUtils.isFileExist(filePath)) {
        return false;
    }
    
    const fileSize = native.fileUtils.getFileSize(filePath);
    // 允许1KB的误差（可能是文件系统或下载器的误差）
    const sizeDifference = Math.abs(fileSize - totalBytes);
    const isValid = sizeDifference <= 1024 || (totalBytes > 0 && fileSize >= totalBytes * 0.99);
    
    return isValid;
};
```

### 3. 轮询等待文件下载完成

```typescript
const findFile = async (): Promise<string | null> => {
    const maxRetries = 10; // 最大重试次数
    const retryInterval = 500; // 重试间隔（毫秒）
    
    // 首先检查文件是否存在且完整
    for (const filePath of possiblePaths) {
        if (native.fileUtils.isFileExist(filePath)) {
            if (verifyFileIntegrity(filePath)) {
                return filePath; // 文件完整，返回
            }
        }
    }
    
    // 如果文件不完整，轮询等待
    for (let retry = 0; retry < maxRetries; retry++) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        
        // 再次检查文件完整性
        for (const filePath of possiblePaths) {
            if (native.fileUtils.isFileExist(filePath)) {
                if (verifyFileIntegrity(filePath)) {
                    return filePath; // 文件完整，返回
                }
            }
        }
    }
    
    return null; // 超时，返回null
};
```

## 下载流程梳理

### 完整下载流程

1. **初始化下载任务**
   ```typescript
   this._downloader!.createDownloadTask(zipUrl, zipLocalPath);
   ```

2. **下载进度回调** (`onProgress`)
   - 更新 `totalBytes` 和 `downloadedBytes`
   - 调用进度回调函数
   - 记录下载进度日志

3. **下载成功回调** (`onSuccess`) - **可能提前触发**
   - 检查是否已处理（防重复触发）
   - 记录当前下载进度
   - 查找下载的文件（多个可能路径）
   - **验证文件完整性**（新增）
   - 如果文件不完整，轮询等待（最多10次，每次500ms）
   - 文件完整后，继续处理（解压等）

4. **文件完整性验证**（新增）
   - 检查文件是否存在
   - 验证文件大小是否匹配 `totalBytes`
   - 允许1KB误差或99%以上匹配

5. **处理下载完成的文件**
   - 验证文件完整性（再次验证）
   - 移动文件到预期位置（如果需要）
   - 解压文件
   - 更新搜索路径
   - 删除压缩包

### 关键改进点

1. **防重复触发**：使用 `isSuccessHandled` 标志防止多次处理
2. **文件完整性验证**：验证文件大小是否匹配预期大小
3. **轮询等待**：如果文件不完整，等待最多5秒（10次 × 500ms）
4. **详细日志**：记录下载进度、文件大小、验证结果等信息

## 日志输出示例

### 正常情况（文件完整）

```
[ZipHotUpdateManager] 下载成功回调触发 {"currentProgress":"100.00%","downloadedBytes":4756523,"totalBytes":4756523}
[ZipHotUpdateManager] 文件完整性验证 {"filePath":"...","fileSize":4756523,"expectedSize":4756523,"isValid":true}
[ZipHotUpdateManager] 找到下载的文件（已验证完整性）
```

### 提前触发情况（文件不完整）

```
[ZipHotUpdateManager] 下载成功回调触发 {"currentProgress":"64.15%","downloadedBytes":3051456,"totalBytes":4756523}
[ZipHotUpdateManager] 文件完整性验证 {"fileSize":3051456,"expectedSize":4756523,"isValid":false}
[ZipHotUpdateManager] 等待文件下载完成 {"retry":"1/10","currentProgress":"64.15%"}
[ZipHotUpdateManager] 等待文件下载完成 {"retry":"2/10","currentProgress":"75.20%"}
...
[ZipHotUpdateManager] 文件完整性验证 {"fileSize":4756523,"expectedSize":4756523,"isValid":true}
[ZipHotUpdateManager] 找到下载的文件（已验证完整性）
```

### 重复触发情况

```
[ZipHotUpdateManager] 下载成功回调触发 {"currentProgress":"64.15%",...}
[ZipHotUpdateManager] 下载成功回调已处理，忽略重复触发 {"currentProgress":"64.20%",...}
```

## 注意事项

1. **轮询超时**：如果文件在5秒内仍未完整，会返回错误
2. **文件大小误差**：允许1KB误差或99%以上匹配，以应对文件系统误差
3. **下载进度**：在轮询等待期间，`onProgress` 回调仍会继续更新进度
4. **错误处理**：如果文件完整性验证失败，会拒绝 Promise 并记录错误

## 相关文件

- `assets/scripts/hotupdate/ZipHotUpdateManager.ts` - 主要实现
- `assets/scripts/game/slotgame/SlotGameLoding.ts` - 子游戏加载逻辑

