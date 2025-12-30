# 子游戏不使用Zip热更新说明

## 修改内容

### 1. 打包脚本修改

#### `build-all-bundles.js`
- 子游戏自动跳过zip打包：`skipZip: isSubGame(bundleName)`
- 子游戏只生成散文件和manifest，不生成zip文件

#### `build-hotupdate.js`
- 自动检测子游戏，如果是子游戏自动设置 `skipZip: true`
- 更新输出信息，说明子游戏不使用zip

### 2. 热更新逻辑修改

#### `ZipHotUpdateManager.ts`
- 添加 `_isSubGame()` 方法判断是否为子游戏
- 修改 `smartUpdate()` 方法：
  - **子游戏**：只使用散文件更新（即使首次更新也不下载zip）
  - **其他bundle**：首次zip，后续散文件

## 子游戏更新流程

### 更新策略

```
子游戏更新流程：
1. 检查本地manifest
   ↓
2. 下载远程manifest
   ↓
3. 如果是首次更新：
   - 下载所有文件（从manifest获取文件列表）
   ↓
4. 如果是后续更新：
   - 比较manifest，下载差异文件
   ↓
5. 保存manifest
   ↓
6. 更新搜索路径
```

### 文件路径

**散文件URL路径**：
```
{baseUrl}/{version}/assets/{bundleName}/files/{filePath}
```

**示例**：
```
http://10.103.6.180:3000/1.0.0/assets/Crazy777I/files/cc.config.json
http://10.103.6.180:3000/1.0.0/assets/Crazy777I/files/native/...
```

**Manifest URL路径**：
```
{baseUrl}/{version}/assets/{bundleName}/project.manifest
```

**示例**：
```
http://10.103.6.180:3000/1.0.0/assets/Crazy777I/project.manifest
```

## 打包输出

### 子游戏打包输出

```
hotupdate-packages/{version}/
└── assets/
    └── {bundleName}/
        ├── project.manifest          ✅ 生成
        └── files/                     ✅ 生成
            ├── cc.config.json
            ├── native/
            └── ...
        ❌ {bundleName}.zip            ❌ 不生成
```

### 其他Bundle打包输出

```
hotupdate-packages/{version}/
├── update.zip                         ✅ 生成（主包）
├── project.manifest                   ✅ 生成（主包）
├── files/                             ✅ 生成（主包）
└── assets/
    └── {bundleName}/
        ├── {bundleName}.zip          ✅ 生成
        ├── project.manifest           ✅ 生成
        └── files/                     ✅ 生成
```

## 子游戏列表

以下Bundle被识别为子游戏，不使用zip更新：
- JungleDelight
- ThePanda
- Diamond777
- Crazy777I
- GemsFrotuneI
- GemsFrotuneII
- Super777I
- MoneyComing

## 优势

1. **更快的首次更新**：不需要下载完整的zip文件，只下载需要的文件
2. **更灵活的更新**：可以只更新部分文件
3. **减少服务器存储**：不需要生成和维护zip文件
4. **更小的下载量**：只下载变更的文件

## 注意事项

1. **首次更新**：子游戏首次更新时，会下载manifest中的所有文件（相当于完整下载）
2. **Manifest必需**：子游戏必须要有manifest文件，否则无法更新
3. **文件路径**：确保服务器上的文件路径与manifest中的路径一致
4. **散文件目录**：确保服务器上有 `files/` 目录，包含所有需要更新的文件

## 服务器文件结构

### 子游戏服务器结构

```
{hotupdateBaseUrl}/{version}/
└── assets/
    └── {bundleName}/
        ├── project.manifest          ✅ 必需
        └── files/                     ✅ 必需
            ├── cc.config.json
            ├── native/
            └── ...（所有需要更新的文件）
```

### 上传说明

1. 上传 `project.manifest` 到 `assets/{bundleName}/`
2. 上传所有文件到 `assets/{bundleName}/files/`
3. **不需要**上传zip文件

## 相关文件

- `scripts/hotupdate/build-all-bundles.js` - 批量构建脚本
- `scripts/hotupdate/build-hotupdate.js` - 单个Bundle构建脚本
- `assets/scripts/hotupdate/ZipHotUpdateManager.ts` - 热更新管理器
- `assets/scripts/game/slotgame/SlotGameLoding.ts` - 子游戏加载（使用传统热更新）

