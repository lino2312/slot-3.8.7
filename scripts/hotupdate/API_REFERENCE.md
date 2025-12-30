# 热更新系统 API 参考

## ZipHotUpdateManager

压缩包热更新管理器，负责下载、解压和管理热更新文件。

### 初始化

```typescript
zipHotUpdateManager.init(config: ZipHotUpdateManagerConfig): void
```

**参数**:
- `config.enableLog?: boolean` - 是否启用日志（会被Config.hotUpdateLogEnabled覆盖）
- `config.storageDirPath?: string` - 本地存储路径（可选，默认使用writablePath）

**示例**:
```typescript
zipHotUpdateManager.init({
    enableLog: true,
    storageDirPath: "/custom/path"  // 可选
});
```

---

### 智能更新

```typescript
smartUpdate(
    bundleName: string | GGHotUpdateInstanceEnum,
    version: string,
    baseUrl: string,
    onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void,
    onFileProgress?: (filePath: string, progress: number) => void
): Promise<boolean>
```

**功能**: 智能选择更新方式（首次完整zip，后续增量更新）

**参数**:
- `bundleName` - Bundle名称（'build-in' 或子游戏名称）
- `version` - 版本号
- `baseUrl` - 服务器基础URL
- `onProgress` - 总体进度回调（0-1）
- `onFileProgress` - 单个文件进度回调（可选）

**返回**: `Promise<boolean>` - true表示成功，false表示失败

**示例**:
```typescript
const success = await zipHotUpdateManager.smartUpdate(
    'build-in',
    '1.0.0',
    'https://update.example.com',
    (progress, downloaded, total) => {
        console.log(`进度: ${(progress * 100).toFixed(2)}%`);
    }
);
```

---

### 检查是否首次更新

```typescript
isFirstUpdate(bundleName: string | GGHotUpdateInstanceEnum): boolean
```

**功能**: 检查指定Bundle是否为首次更新

**参数**:
- `bundleName` - Bundle名称

**返回**: `boolean` - true表示首次更新，false表示非首次

**示例**:
```typescript
const isFirst = zipHotUpdateManager.isFirstUpdate('JungleDelight');
if (isFirst) {
    console.log('首次更新，将下载完整zip');
}
```

---

### 检查本地Manifest

```typescript
hasLocalManifest(bundleName: string | GGHotUpdateInstanceEnum): boolean
```

**功能**: 检查本地是否存在manifest文件

**参数**:
- `bundleName` - Bundle名称

**返回**: `boolean` - true表示存在，false表示不存在

---

### 获取本地Manifest

```typescript
getLocalManifest(bundleName: string | GGHotUpdateInstanceEnum): ProjectManifest | null
```

**功能**: 读取并解析本地manifest文件

**参数**:
- `bundleName` - Bundle名称

**返回**: `ProjectManifest | null` - manifest对象或null

**示例**:
```typescript
const manifest = zipHotUpdateManager.getLocalManifest('build-in');
if (manifest) {
    console.log('本地版本:', manifest.version);
}
```

---

### 更新搜索路径

```typescript
updateSearchPath(bundleName: string | GGHotUpdateInstanceEnum): void
```

**功能**: 更新Cocos Creator的搜索路径，使更新后的文件生效

**参数**:
- `bundleName` - Bundle名称

**示例**:
```typescript
zipHotUpdateManager.updateSearchPath('build-in');
```

---

### 清除缓存

```typescript
clearCache(): void
```

**功能**: 清除所有热更新缓存文件

**示例**:
```typescript
zipHotUpdateManager.clearCache();
```

---

### 获取URL和路径

```typescript
// 获取压缩包URL
getZipUrl(bundleName: string, version: string, baseUrl: string): string

// 获取Bundle解压路径
getBundleExtractPath(bundleName: string): string

// 获取压缩包本地路径
getZipLocalPath(bundleName: string): string
```

---

## HotUpdate

主热更新流程管理器。

### 初始化

```typescript
initHotUpdate(): void
```

**功能**: 初始化热更新系统（根据Config.useZipHotUpdate选择模式）

---

### 检查版本

```typescript
checkVersion(): Promise<EventCode>
```

**功能**: 检查版本并执行更新

**返回**: `Promise<EventCode>` - 更新结果代码

**EventCode值**:
- `EventCode.ALREADY_UP_TO_DATE` - 已是最新版本
- `EventCode.UPDATE_FINISHED` - 更新完成
- `EventCode.ERROR_UPDATING` - 更新失败
- `EventCode.UPDATE_FAILED` - 更新失败

**示例**:
```typescript
const code = await hotUpdate.checkVersion();
if (code === EventCode.UPDATE_FINISHED) {
    console.log('更新完成');
}
```

---

### 进度回调

```typescript
onProgressCallback?: (progress: number, downloadedBytes: number, totalBytes: number) => void
```

**功能**: 设置更新进度回调

**参数**:
- `progress` - 进度百分比（0-100）
- `downloadedBytes` - 已下载字节数
- `totalBytes` - 总字节数

**示例**:
```typescript
hotUpdate.onProgressCallback = (progress, downloaded, total) => {
    progressBar.progress = progress / 100;
    label.string = `${progress.toFixed(2)}%`;
};
```

---

### 版本管理

```typescript
// 获取本地版本号
getLocalVersion(): string

// 保存本地版本号
saveLocalVersion(version: string): void
```

**示例**:
```typescript
const localVersion = hotUpdate.getLocalVersion();
console.log('本地版本:', localVersion);

hotUpdate.saveLocalVersion('1.0.1');
```

---

## SlotGameLoding

子游戏加载和更新管理器。

### 自动更新

子游戏的更新在 `onLoad()` 方法中自动触发，无需手动调用。

**更新流程**:
1. 检查 `Config.useZipHotUpdate`
2. 如果启用，调用 `_checkSlotGameUpdateWithZip()`
3. 否则使用传统GG热更新

---

## 配置接口

### ZipHotUpdateManagerConfig

```typescript
interface ZipHotUpdateManagerConfig {
    enableLog?: boolean;        // 是否启用日志
    storageDirPath?: string;     // 存储路径
}
```

---

## 类型定义

### ProjectManifest

```typescript
interface ProjectManifest {
    version: string;              // 版本号
    assets: {                     // 资源列表
        [path: string]: {
            md5: string;          // MD5值
            size: number;          // 文件大小
        }
    };
    searchPaths?: string[];        // 搜索路径
}
```

### GGHotUpdateInstanceEnum

```typescript
enum GGHotUpdateInstanceEnum {
    BuildIn = "build-in"          // 主包
}
```

---

## 原生平台API

### Android

```java
// PlatformAndroidApi.java
public static boolean unzipFile(String zipPath, String extractDir)
```

### iOS

```objective-c
// NativeHelper.h
+ (BOOL)unzipFile:(NSString *)zipPath toPath:(NSString *)extractDir;
```

---

## 使用示例

### 完整更新流程

```typescript
import { HotUpdate } from 'db://assets/scripts/hotupdate/HotUpdate';
import { EventCode } from 'db://gg-hot-update/scripts/hotupdate/GGHotUpdateType';

// 1. 初始化
const hotUpdate = new HotUpdate();
hotUpdate.initHotUpdate();

// 2. 设置进度回调
hotUpdate.onProgressCallback = (progress, downloaded, total) => {
    console.log(`更新进度: ${progress}%`);
};

// 3. 检查并更新
const code = await hotUpdate.checkVersion();

// 4. 处理结果
switch (code) {
    case EventCode.ALREADY_UP_TO_DATE:
        console.log('已是最新版本');
        break;
    case EventCode.UPDATE_FINISHED:
        console.log('更新完成');
        break;
    default:
        console.error('更新失败');
}
```

### 手动更新指定Bundle

```typescript
import { zipHotUpdateManager } from 'db://assets/scripts/hotupdate/ZipHotUpdateManager';
import { Config } from 'db://assets/scripts/config/Config';

// 初始化
zipHotUpdateManager.init({
    enableLog: Config.hotUpdateLogEnabled
});

// 更新指定Bundle
// 注意：Config.hotupdateBaseUrl 从 ENV_CONFIG 中自动读取，根据 Config.gameChannel 选择对应环境
const success = await zipHotUpdateManager.smartUpdate(
    'hall',
    Config.hotupdate_version,
    Config.hotupdateBaseUrl,  // 从 ENV_CONFIG[Config.gameChannel] 中自动获取
    (progress) => {
        console.log(`hall更新进度: ${(progress * 100).toFixed(2)}%`);
    }
);

if (success) {
    zipHotUpdateManager.updateSearchPath('hall');
    console.log('hall更新成功');
}
```

### 清除缓存并重新更新

```typescript
import { zipHotUpdateManager } from 'db://assets/scripts/hotupdate/ZipHotUpdateManager';

// 清除所有缓存
zipHotUpdateManager.clearCache();

// 重新更新
await zipHotUpdateManager.smartUpdate(
    'build-in',
    '1.0.0',
    'https://update.example.com'
);
```

---

## 注意事项

1. **初始化顺序**: 确保在使用前先调用 `init()`
2. **搜索路径**: 更新完成后必须调用 `updateSearchPath()` 使文件生效
3. **版本号**: 确保服务器上的版本号与配置一致
4. **网络**: 更新需要网络连接，注意处理网络错误
5. **存储空间**: 确保设备有足够的存储空间
6. **权限**: Android需要存储权限，iOS需要文件访问权限

---

**更多信息**: 查看 [完整指南](./HOT_UPDATE_GUIDE.md) 和 [快速开始](./QUICK_START.md)

