# 压缩包热更新常见问题

## Q: 都压缩成zip，热更新还能用吗？

### 答案：取决于使用哪种热更新方式

#### ✅ **可以使用** - 如果使用压缩包热更新方式

如果配置了 `useZipHotUpdate: true`，那么：

1. **工作流程**：
   ```
   服务器（zip压缩包）
      ↓ 下载
   客户端（下载zip到临时目录）
      ↓ 解压
   客户端（解压到本地目录，恢复原始文件结构）
      ↓ 更新搜索路径
   游戏（使用解压后的文件）
   ```

2. **为什么可以用**：
   - 压缩包下载后会**解压**到本地目录
   - 解压后的文件结构和原始结构**完全一致**
   - 游戏通过**搜索路径**访问解压后的文件
   - 所以功能**完全正常**

3. **配置方式**：
   ```typescript
   // Config.ts
   export const Config = {
       useZipHotUpdate: true,  // 启用压缩包热更新
       // ...
   };
   ```

#### ❌ **不能使用** - 如果使用传统热更新方式

如果配置了 `useZipHotUpdate: false`，使用传统的 GGHotUpdate：

1. **为什么不能用**：
   - 传统方式需要**直接访问单个文件**
   - 文件在zip里无法直接访问
   - 需要逐个文件下载，不能打包成zip

2. **配置方式**：
   ```typescript
   // Config.ts
   export const Config = {
       useZipHotUpdate: false,  // 使用传统文件下载方式
       // ...
   };
   ```

## 压缩包热更新的工作原理

### 1. 下载阶段
```typescript
// 下载zip压缩包
zipHotUpdateManager.downloadAndExtract(
    "https://update.fastpay11.com/GameXVersion3/1.0.66/update.zip",
    "build-in",
    onProgress
);
```

### 2. 解压阶段
```typescript
// 解压到本地目录
// 解压前：/data/user/0/com.cocos.game/files/zip-hot-update/downloads/build-in.zip
// 解压后：/data/user/0/com.cocos.game/files/zip-hot-update/build-in/
//   ├── project.manifest
//   ├── version.manifest
//   ├── assets/
//   ├── src/
//   └── jsb-adapter/
```

### 3. 更新搜索路径
```typescript
// 将解压目录添加到搜索路径
native.fileUtils.setSearchPaths([
    "/data/user/0/com.cocos.game/files/zip-hot-update/build-in/",
    // ... 其他搜索路径
]);
```

### 4. 游戏使用
```typescript
// 游戏通过搜索路径访问文件
// 实际访问：/data/user/0/com.cocos.game/files/zip-hot-update/build-in/assets/...
// 对游戏来说，和原始文件结构完全一样
```

## 文件结构对比

### 服务器上的压缩包结构
```
update.zip
├── project.manifest
├── version.manifest
├── assets/
│   ├── scripts/
│   ├── textures/
│   └── ...
├── src/
└── jsb-adapter/
```

### 客户端解压后的结构（完全一致）
```
/data/user/0/com.cocos.game/files/zip-hot-update/build-in/
├── project.manifest
├── version.manifest
├── assets/
│   ├── scripts/
│   ├── textures/
│   └── ...
├── src/
└── jsb-adapter/
```

**结论**：解压后的文件结构和原始结构**完全一致**，所以热更新功能**完全正常**。

## 优势

使用压缩包热更新的优势：

1. ✅ **减少HTTP请求**：只需下载1个zip文件，而不是数千个小文件
2. ✅ **提高下载速度**：压缩后体积更小，传输更快
3. ✅ **简化服务器管理**：只需管理压缩包，不需要管理大量小文件
4. ✅ **更好的断点续传**：单个大文件的断点续传更可靠
5. ✅ **文件结构完整**：解压后和原始结构完全一致，功能不受影响

## 注意事项

1. **必须启用压缩包热更新**：
   ```typescript
   useZipHotUpdate: true  // 必须设置为 true
   ```

2. **需要原生端支持解压**：
   - Android：需要在 `PlatformAndroidApi.java` 中实现 `unzipFile` 方法
   - iOS：需要在原生代码中实现解压功能

3. **压缩包结构必须正确**：
   - 必须包含 `project.manifest` 和 `version.manifest`
   - 文件路径必须保持相对路径结构

## 总结

**压缩成zip后，热更新完全可以用！**

前提是：
- ✅ 配置 `useZipHotUpdate: true`
- ✅ 原生端实现了解压功能
- ✅ 压缩包结构正确

解压后的文件结构和原始结构完全一致，游戏功能不受任何影响。

