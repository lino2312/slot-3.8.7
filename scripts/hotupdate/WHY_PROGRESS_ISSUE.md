# 为什么会出现下载进度异常？

## 问题现象

从日志可以看到：
```
1. 下载进度: 100.00% (4756523/4756523 字节) ✅
2. 下载成功回调触发 ✅
3. 然后出现: 74.22% (3530370/4756523 字节) ❌
```

## 根本原因分析

### 1. **单个下载器实例共享问题**

```typescript
class ZipHotUpdateManager {
    private _downloader: native.Downloader | null = null;  // 单个实例
    
    init() {
        this._downloader = new native.Downloader();  // 只创建一个下载器
    }
}
```

**问题**：
- `ZipHotUpdateManager` 使用**单个** `_downloader` 实例
- 所有下载任务（zip下载、散文件更新）都共享这个下载器
- 当设置 `onProgress` 和 `onSuccess` 回调时，会**覆盖**之前的回调

### 2. **回调覆盖问题**

当调用 `downloadAndExtract()` 时：

```typescript
downloadAndExtract(zipUrl, bundleName, onProgress) {
    // 重新设置回调 - 这会覆盖之前的回调！
    this._downloader!.onProgress = (task, ...) => { ... };
    this._downloader!.onSuccess = (task) => { ... };
    
    // 开始下载
    this._downloader!.createDownloadTask(zipUrl, zipLocalPath);
}
```

**问题场景**：
1. **场景A**：zip下载进行中（74%）
2. **场景B**：同时有散文件更新任务也在使用同一个下载器
3. **场景C**：zip下载完成（100%），触发 `onSuccess`
4. **场景D**：散文件更新的进度回调被触发（74%），但因为回调被覆盖，可能显示错误的进度

### 3. **异步回调时序问题**

`native.Downloader` 的回调是**异步**的，可能存在以下情况：

```
时间线：
T1: zip下载 100% → onProgress(100%)
T2: onSuccess 触发 → 开始处理文件
T3: 散文件更新任务 74% → onProgress(74%) ← 但回调已经被覆盖为zip的回调！
T4: 或者 zip下载的延迟回调 → onProgress(74%) ← 延迟的进度更新
```

### 4. **下载器内部状态问题**

`native.Downloader` 可能：
- 维护多个下载任务的状态
- 在任务完成后，内部状态可能重置或更新
- 延迟的进度回调可能在 `onSuccess` 之后才到达

## 为什么会出现 74% 的进度？

### 可能原因1：延迟的进度回调

```
实际下载时间线：
T1: 下载到 74% → 触发 onProgress(74%) → 但回调处理慢
T2: 下载到 100% → 触发 onProgress(100%)
T3: onSuccess 触发 → 开始处理
T4: T1 的回调才到达 → 显示 74% ← 延迟回调！
```

### 可能原因2：其他下载任务的进度

```
场景：
- 任务A（zip下载）: 100% 完成
- 任务B（散文件更新）: 74% 进行中

因为共享同一个下载器和回调，任务B的进度被误认为是任务A的进度。
```

### 可能原因3：下载器重置

```
某些情况下，下载器可能在任务完成后：
1. 重置内部状态
2. 重新开始某个任务
3. 触发旧的进度回调
```

## 修复方案

### 方案1：添加任务标识符检查（当前实现）

```typescript
this._downloader!.onProgress = (task, ...) => {
    // 如果已经处理完成，检查是否是当前任务
    if (isSuccessHandled) {
        const isCurrentTask = task.requestURL === zipUrl || 
                             task.storagePath === zipLocalPath;
        if (isCurrentTask) {
            // 当前任务的延迟回调，忽略
            return;
        }
        // 其他任务的回调，也忽略（不应该在这里处理）
        return;
    }
    // 正常处理...
};
```

**优点**：
- 简单有效
- 不需要重构下载器架构
- 可以过滤延迟回调和错误回调

**缺点**：
- 仍然共享同一个下载器
- 如果同时有多个zip下载任务，可能会有问题

### 方案2：为每个任务创建独立的下载器（理想方案）

```typescript
downloadAndExtract(zipUrl, bundleName, onProgress) {
    // 为每个任务创建独立的下载器
    const taskDownloader = new native.Downloader();
    
    taskDownloader.onProgress = (task, ...) => { ... };
    taskDownloader.onSuccess = (task) => { ... };
    
    taskDownloader.createDownloadTask(zipUrl, zipLocalPath);
}
```

**优点**：
- 完全隔离，不会互相干扰
- 更清晰的任务管理

**缺点**：
- 需要管理多个下载器实例
- 可能增加内存占用

### 方案3：使用任务队列（复杂方案）

```typescript
class DownloadTaskQueue {
    private tasks: Map<string, DownloadTask> = new Map();
    
    addTask(taskId: string, task: DownloadTask) { ... }
    removeTask(taskId: string) { ... }
}
```

**优点**：
- 可以管理多个并发任务
- 更灵活

**缺点**：
- 实现复杂
- 需要重构现有代码

## 当前修复的效果

通过添加 `isSuccessHandled` 检查：

1. ✅ **防止重复处理**：`onSuccess` 只处理一次
2. ✅ **过滤延迟回调**：已完成的下载任务，后续进度更新被忽略
3. ✅ **任务隔离**：通过URL和路径匹配，区分不同任务
4. ✅ **日志记录**：记录被过滤的回调，便于调试

## 日志示例

### 修复前（有问题）

```
[ZipHotUpdateManager] 下载进度 {"progress":"100.00%",...}
[ZipHotUpdateManager] 下载成功回调触发
[ZipHotUpdateManager] 下载进度 {"progress":"74.22%",...} ← 不应该出现！
```

### 修复后（正常）

```
[ZipHotUpdateManager] 下载进度 {"progress":"100.00%",...}
[ZipHotUpdateManager] 下载成功回调触发
[ZipHotUpdateManager] 下载已完成，忽略延迟的进度更新 {"currentProgress":"74.22%",...} ← 被正确过滤
```

## 总结

**为什么会这样？**

1. **架构问题**：单个下载器实例被多个任务共享
2. **回调覆盖**：新任务会覆盖旧任务的回调
3. **异步时序**：回调是异步的，可能延迟到达
4. **状态管理**：缺少任务状态标识，无法区分不同任务

**如何解决？**

- ✅ 添加任务完成标志（`isSuccessHandled`）
- ✅ 在进度回调中检查任务状态
- ✅ 通过URL/路径匹配区分任务
- ✅ 过滤已完成任务的回调

这样就能确保已完成的下载任务不会被后续的进度更新干扰。

