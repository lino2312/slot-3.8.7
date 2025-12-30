# Hall 与子游戏热更新逻辑对比分析

## 一、整体流程对比

### Hall Bundle 更新流程

```
1. GameLaunch.ts 启动
   ↓
2. HotUpdate.ts 检查更新（bundleName = 'build-in'）
   ↓
3. 下载主包 zip: ${baseUrl}/${version}/update.zip
   ↓
4. 解压到: {localRootDir}/build-in/
   ↓
5. _extractBundlesFromMainZip() 从主包中提取 hall
   - 源路径: build-in/assets/hall/
   - 目标路径: {localRootDir}/assets/hall/
   - 复制目录内容
   ↓
6. updateSearchPath('hall') 更新搜索路径
   ↓
7. GameLaunch.ts 加载 hall bundle
```

### 子游戏更新流程

```
1. SlotGameLoding.ts 启动
   ↓
2. 检查子游戏更新（bundleName = 'Crazy777I'）
   ↓
3. 下载子游戏 zip: ${baseUrl}/${version}/assets/Crazy777I/Crazy777I.zip
   ↓
4. 解压到: {localRootDir}/assets/Crazy777I/
   ↓
5. updateSearchPath('Crazy777I') 更新搜索路径
   ↓
6. SlotGameLoding.ts 加载子游戏 bundle
```

## 二、关键代码位置

### 1. Hall 提取逻辑（关键差异点）

**位置**: `ZipHotUpdateManager.ts` 第 1261-1338 行

```typescript
private _extractBundlesFromMainZip(mainExtractPath: string): void {
    const bundlesToExtract = ['hall', 'resources'];
    
    for (const bundleName of bundlesToExtract) {
        // 主包zip中bundle的路径
        const bundleInMainPath = path.join(mainExtractPath, 'assets', bundleName);
        // bundle的目标路径
        const bundleTargetPath = this.getBundleExtractPath(bundleName);
        
        // 检查主包zip中是否包含该bundle
        if (native.fileUtils.isDirectoryExist(bundleInMainPath)) {
            // 检查目标bundle是否已经有manifest（说明已经更新过）
            const targetManifestPath = this._getLocalManifestPath(bundleName);
            const hasExistingManifest = native.fileUtils.isFileExist(targetManifestPath);
            
            if (hasExistingManifest) {
                // 已有manifest，跳过提取（可能已单独更新）
                continue;
            }
            
            // 复制bundle目录到目标位置
            this._copyDirectory(bundleInMainPath, bundleTargetPath);
            
            // 提取后，更新该bundle的搜索路径
            this.updateSearchPath(bundleName);
        }
    }
}
```

**调用时机**: 只在主包 zip 解压完成后调用（第 728 行）

```typescript
// 如果主包zip中包含其他bundle（如hall），需要提取它们
if (bundleName === GGHotUpdateInstanceEnum.BuildIn || bundleName === 'build-in') {
    this._extractBundlesFromMainZip(extractPath);
}
```

### 2. 子游戏下载解压逻辑

**位置**: `ZipHotUpdateManager.ts` 第 561-746 行

```typescript
downloadAndExtract(zipUrl: string, bundleName: string, onProgress?: ...): Promise<boolean> {
    const zipLocalPath = this.getZipLocalPath(bundleName);
    const extractPath = this.getBundleExtractPath(bundleName);
    
    // 下载 zip
    // 解压到 extractPath
    // 解压完成后调用 updateSearchPath(bundleName)
}
```

**关键点**: 子游戏直接解压到目标目录，没有额外的提取步骤。

## 三、路径结构对比

### Hall 的路径结构

```
主包 zip 内容:
build-in/
  ├── assets/
  │   ├── hall/          ← 主包 zip 中包含 hall
  │   │   ├── cc.config.json
  │   │   ├── project.manifest
  │   │   └── ...
  │   └── resources/
  └── ...

解压后:
{localRootDir}/
  ├── build-in/         ← 主包解压目录
  └── assets/
      └── hall/         ← 从主包提取到这里的 hall
          ├── cc.config.json
          ├── project.manifest
          └── ...
```

### 子游戏的路径结构

```
子游戏 zip 内容:
Crazy777I/
  ├── cc.config.json
  ├── project.manifest
  └── ...

解压后:
{localRootDir}/
  └── assets/
      └── Crazy777I/    ← 直接解压到这里
          ├── cc.config.json
          ├── project.manifest
          └── ...
```

## 四、可能的问题点分析

### 问题 1: 子游戏 zip 文件结构可能不正确

**现象**: 子游戏解压后找不到 `cc.config.json`

**可能原因**:
1. 生成的子游戏 zip 文件结构不正确
   - 期望: `Crazy777I/cc.config.json`
   - 实际: `assets/Crazy777I/cc.config.json` 或其他结构

2. zip 文件包含额外的路径前缀
   - 例如: `hotupdate-packages/1.0.0/assets/Crazy777I/cc.config.json`

**验证方法**:
```bash
# 检查生成的 zip 文件结构
unzip -l hotupdate-packages/1.0.0/assets/Crazy777I/Crazy777I.zip
```

### 问题 2: 解压路径不匹配

**Hall 的解压路径**:
- 解压路径: `{localRootDir}/build-in/`
- Hall 提取路径: `{localRootDir}/assets/hall/`
- 搜索路径: `{localRootDir}/assets/hall/`

**子游戏的解压路径**:
- 解压路径: `{localRootDir}/assets/Crazy777I/`
- 搜索路径: `{localRootDir}/assets/Crazy777I/`

**对比**: 两者路径结构一致，但 hall 有额外的提取步骤。

### 问题 3: 搜索路径更新时机

**Hall**:
1. 主包解压完成
2. 提取 hall 到目标目录
3. `updateSearchPath('hall')` ← 在提取后调用
4. GameLaunch 加载 bundle

**子游戏**:
1. 子游戏 zip 解压完成
2. `updateSearchPath('Crazy777I')` ← 在解压后调用（第 732 行）
3. SlotGameLoding 加载 bundle

**对比**: 两者都在解压/提取后更新搜索路径，时机一致。

### 问题 4: zip 文件内容验证

**Hall 的验证**:
- 在 `_extractBundlesFromMainZip` 中验证:
  - `copiedConfigPath` 是否存在
  - `copiedManifestPath` 是否存在

**子游戏的验证**:
- 在 `downloadAndExtract` 中验证:
  - `manifestPath` 是否存在（第 717-724 行）
  - 但没有验证 `cc.config.json`

**差异**: 子游戏缺少 `cc.config.json` 的显式验证。

## 五、建议的修复方案

### 方案 1: 验证 zip 文件结构

在 `build-hotupdate.js` 中确保生成的 zip 文件结构正确：

```javascript
// 确保 zip 文件不包含额外的路径前缀
// 子游戏 zip 应该直接包含 bundle 根目录的内容
```

### 方案 2: 增强解压后的验证

在 `downloadAndExtract` 方法中，解压完成后验证关键文件：

```typescript
// 解压完成后验证
const configPath = path.join(extractPath, 'cc.config.json');
const manifestPath = this._getLocalManifestPath(bundleName);

if (!native.fileUtils.isFileExist(configPath)) {
    this._error("解压后缺少 cc.config.json", `bundleName:${bundleName}  extractPath:${extractPath}`);
}

if (!native.fileUtils.isFileExist(manifestPath)) {
    this._error("解压后缺少 project.manifest", `bundleName:${bundleName}  manifestPath:${manifestPath}`);
}
```

### 方案 3: 统一解压逻辑

考虑让子游戏也使用类似 hall 的提取逻辑（如果子游戏 zip 中包含嵌套路径）：

```typescript
// 如果解压后的目录结构是 assets/Crazy777I/，需要提取到正确位置
const extractedSubPath = path.join(extractPath, 'assets', bundleName);
if (native.fileUtils.isDirectoryExist(extractedSubPath)) {
    // 提取到正确位置
    const targetPath = this.getBundleExtractPath(bundleName);
    this._copyDirectory(extractedSubPath, targetPath);
}
```

## 六、调试建议

### 1. 检查生成的 zip 文件结构

```bash
# 查看子游戏 zip 内容
cd hotupdate-packages/1.0.0/assets/Crazy777I/
unzip -l Crazy777I.zip | head -20

# 查看 hall zip 内容（如果单独生成）
unzip -l hall.zip | head -20
```

### 2. 检查解压后的目录结构

在 Android 设备上：
```bash
adb shell
run-as com.game.testGame
ls -la /data/user/0/com.game.testGame/files/gg-hot-update-zip/assets/Crazy777I/
ls -la /data/user/0/com.game.testGame/files/gg-hot-update-zip/assets/hall/
```

### 3. 添加详细日志

在 `downloadAndExtract` 方法中，解压后立即打印目录内容：

```typescript
// 解压成功后
this._logDirectoryContents(extractPath, bundleName);

// 验证关键文件
const configPath = path.join(extractPath, 'cc.config.json');
const hasConfig = native.fileUtils.isFileExist(configPath);
this._log("解压后文件验证", {
    bundleName,
    extractPath,
    configPath,
    hasConfig,
    configExists: hasConfig
});
```

## 七、总结

**Hall 能正常工作的原因**:
1. 从主包 zip 中提取，路径结构清晰
2. 有专门的提取逻辑 `_extractBundlesFromMainZip`
3. 提取后验证关键文件存在
4. 提取后立即更新搜索路径

**子游戏可能失败的原因**:
1. zip 文件结构可能不正确（包含额外路径前缀）
2. 解压后缺少 `cc.config.json` 的显式验证
3. 解压路径可能与预期不符

**建议优先检查**:
1. 生成的子游戏 zip 文件结构
2. 解压后的目录内容
3. `cc.config.json` 是否存在

