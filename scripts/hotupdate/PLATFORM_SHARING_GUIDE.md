# iOS 和 Android 共用压缩包说明

## 问题：为什么要分开打包？

### 传统做法（分开打包）

传统上，iOS 和 Android 分开打包的原因：

1. **资源差异**：某些资源在不同平台可能有差异
   - 图片格式（iOS 可能使用 PVR，Android 使用 ETC）
   - 音频格式（iOS 可能使用 CAF，Android 使用 OGG）
   - 字体文件（平台特定字体）

2. **原生代码差异**：虽然热更新不包含原生代码，但某些配置可能不同

3. **历史原因**：早期 Cocos Creator 构建时平台差异较大

### 实际情况

**大部分情况下，iOS 和 Android 的资源是相同的！**

- ✅ **脚本文件**：TypeScript/JavaScript 代码完全相同
- ✅ **图片资源**：PNG/JPG 等通用格式相同
- ✅ **音频资源**：MP3 等通用格式相同
- ✅ **配置文件**：JSON 等配置文件相同
- ✅ **场景文件**：场景和预制体文件相同

**只有少数情况需要分开：**
- 使用了平台特定的资源格式
- 使用了平台特定的原生插件配置

## 解决方案：支持共用压缩包

### 配置选项

在 `Config.ts` 中添加了配置项：

```typescript
export const Config = {
    // ...
    useZipHotUpdate: true,
    zipHotUpdateUseCommonPackage: true, // true: 共用压缩包，false: 分开打包
};
```

### URL 规则

#### 共用模式（`zipHotUpdateUseCommonPackage: true`）

```
主包: {baseUrl}/{version}/update.zip
子包: {baseUrl}/{version}/assets/{bundleName}/{bundleName}.zip
```

**示例：**
- 主包: `https://update.fastpay11.com/GameXVersion3/1.0.66/update.zip`
- 子包: `https://update.fastpay11.com/GameXVersion3/1.0.66/assets/hall/hall.zip`

#### 分开模式（`zipHotUpdateUseCommonPackage: false`）

```
主包: {baseUrl}/{version}/{platform}/update.zip
子包: {baseUrl}/{version}/{platform}/assets/{bundleName}/{bundleName}.zip
```

**示例：**
- Android主包: `https://update.fastpay11.com/GameXVersion3/1.0.66/android/update.zip`
- iOS主包: `https://update.fastpay11.com/GameXVersion3/1.0.66/ios/update.zip`

## 使用建议

### 推荐：使用共用压缩包

**优点：**
1. ✅ **减少服务器存储**：只需存储一份压缩包
2. ✅ **简化维护**：只需维护一套资源
3. ✅ **降低出错概率**：不会出现 iOS 和 Android 版本不一致
4. ✅ **节省带宽**：CDN 缓存更高效

**适用场景：**
- 项目使用通用资源格式（PNG、MP3、JSON 等）
- 没有使用平台特定的资源格式
- 希望简化部署和维护流程

### 不推荐：分开打包

**适用场景：**
- 使用了平台特定的资源格式（PVR、CAF 等）
- iOS 和 Android 的资源确实有差异
- 需要针对不同平台优化资源

## 如何判断是否可以共用？

### 检查方法

1. **构建两个平台的热更新资源**
   ```bash
   # 构建 Android
   # 构建 iOS
   ```

2. **对比资源文件**
   ```bash
   # Linux/Mac
   diff -r hotupdate-assets/1.0.66/android hotupdate-assets/1.0.66/ios
   
   # 或者只对比关键文件
   diff hotupdate-assets/1.0.66/android/project.manifest \
        hotupdate-assets/1.0.66/ios/project.manifest
   ```

3. **检查文件大小和数量**
   ```bash
   # Android
   find hotupdate-assets/1.0.66/android -type f | wc -l
   du -sh hotupdate-assets/1.0.66/android
   
   # iOS
   find hotupdate-assets/1.0.66/ios -type f | wc -l
   du -sh hotupdate-assets/1.0.66/ios
   ```

### 判断标准

**可以共用，如果：**
- ✅ 文件数量相同或几乎相同（差异 < 5%）
- ✅ 文件大小相近（差异 < 10%）
- ✅ `project.manifest` 中的资源列表基本相同
- ✅ 没有平台特定的资源格式

**需要分开，如果：**
- ❌ 文件数量差异很大（> 10%）
- ❌ 文件大小差异很大（> 20%）
- ❌ 使用了平台特定的资源格式
- ❌ `project.manifest` 显示大量平台特定资源

## 打包方式

### 共用模式打包

```bash
# 使用任一平台构建的资源即可（推荐使用 Android）
cd hotupdate-assets/1.0.66/android/
zip -r ../../update.zip project.manifest version.manifest assets/
```

### 分开模式打包

```bash
# Android
cd hotupdate-assets/1.0.66/android/
zip -r ../../android/update.zip project.manifest version.manifest assets/

# iOS
cd hotupdate-assets/1.0.66/ios/
zip -r ../../ios/update.zip project.manifest version.manifest assets/
```

## 服务器部署

### 共用模式部署

```
https://update.fastpay11.com/GameXVersion3/
└── 1.0.66/
    ├── update.zip                    # 主包（iOS和Android共用）
    └── assets/
        ├── hall/
        │   └── hall.zip              # hall子包（共用）
        └── Crazy777I/
            └── Crazy777I.zip         # Crazy777I子包（共用）
```

### 分开模式部署

```
https://update.fastpay11.com/GameXVersion3/
└── 1.0.66/
    ├── android/
    │   ├── update.zip
    │   └── assets/
    │       └── ...
    └── ios/
        ├── update.zip
        └── assets/
            └── ...
```

## 代码实现

代码已经支持两种模式，通过配置自动切换：

```typescript
// Config.ts
export const Config = {
    useZipHotUpdate: true,
    zipHotUpdateUseCommonPackage: true, // 设置为 true 使用共用模式
};

// HotUpdate.ts 会自动根据配置选择 URL
const platform = Config.zipHotUpdateUseCommonPackage 
    ? null  // 共用模式，不指定平台
    : (sys.platform === sys.Platform.ANDROID ? 'android' : 'ios'); // 分开模式

const zipUrl = zipHotUpdateManager.getZipUrl(bundleName, version, platform);
```

## 迁移建议

### 从分开模式迁移到共用模式

1. **检查资源差异**
   ```bash
   diff -r hotupdate-assets/1.0.66/android hotupdate-assets/1.0.66/ios
   ```

2. **如果差异很小，可以迁移：**
   - 修改 `Config.ts`：`zipHotUpdateUseCommonPackage: true`
   - 使用任一平台（推荐 Android）的资源打包
   - 上传到服务器共用路径
   - 测试 iOS 和 Android 都能正常更新

3. **如果差异较大：**
   - 分析差异原因
   - 尝试统一资源格式
   - 如果无法统一，继续使用分开模式

## 总结

- ✅ **推荐使用共用模式**：简化维护，减少存储
- ✅ **大部分项目可以共用**：资源通常是通用的
- ✅ **代码已支持两种模式**：通过配置切换
- ✅ **可以随时切换**：根据实际情况选择

**建议：先尝试共用模式，如果遇到问题再切换到分开模式。**

