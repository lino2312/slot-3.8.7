# 压缩包热更新方案使用说明

## 概述

本方案实现了基于zip压缩包的热更新功能，相比传统的文件逐个下载方式，压缩包方式具有以下优势：

1. **减少HTTP请求次数**：只需下载一个压缩包文件，而不是多个小文件
2. **提高下载速度**：压缩包通常比原始文件小，传输更快
3. **简化服务器管理**：只需管理压缩包文件，无需管理大量小文件
4. **更好的断点续传**：单个大文件的断点续传更可靠

## 功能特性

- ✅ 支持下载zip压缩包
- ✅ 支持解压到指定目录
- ✅ 支持下载进度回调
- ✅ 自动更新搜索路径
- ✅ 支持版本检查
- ✅ 支持断点续传（通过原生Downloader）

## 配置说明

### 1. 在 Config.ts 中配置

```typescript
export const Config = {
    // ... 其他配置
    
    // 热更新基础URL
    hotupdateBaseUrl: "https://update.fastpay11.com/GameXVersion3",
    
    // 是否使用压缩包热更新
    useZipHotUpdate: true,  // true: 使用zip压缩包，false: 使用传统文件下载
    
    // 压缩包后缀名（可选，默认.zip）
    zipHotUpdateSuffix: '.zip',
    
    // 热更新版本号
    hotupdate_version: '1.0.0',
};
```

### 2. 压缩包URL规则

压缩包URL的构建规则如下：

- **主包（build-in/main）**: `{hotupdateBaseUrl}/{version}/update.zip`
- **子包**: `{hotupdateBaseUrl}/{version}/assets/{bundleName}/{bundleName}.zip`

例如：
- 主包: `https://update.fastpay11.com/GameXVersion3/1.0.0/update.zip`
- 子包: `https://update.fastpay11.com/GameXVersion3/1.0.0/assets/hall/hall.zip`

## 使用方式

### 基本使用

压缩包热更新已经集成到 `HotUpdate.ts` 中，只需在 `Config.ts` 中设置 `useZipHotUpdate: true` 即可自动使用。

### 手动调用（可选）

如果需要手动控制压缩包下载：

```typescript
import { zipHotUpdateManager } from 'db://assets/scripts/hotupdate/ZipHotUpdateManager';

// 初始化
zipHotUpdateManager.init({
    enableLog: true,
    storageDirPath: undefined // 使用默认路径
});

// 下载并解压
const bundleName = 'build-in';
const zipUrl = zipHotUpdateManager.getZipUrl(bundleName, '1.0.0');

zipHotUpdateManager.downloadAndExtract(
    zipUrl,
    bundleName,
    (progress, downloadedBytes, totalBytes) => {
        console.log(`下载进度: ${(progress * 100).toFixed(2)}%`);
    }
).then((success) => {
    if (success) {
        console.log('下载并解压成功');
        // 获取解压路径
        const extractPath = zipHotUpdateManager.getBundleExtractPath(bundleName);
        // 更新搜索路径...
    }
});
```

## 原生端实现

### Android 实现

需要在 `AppActivity.java` 中添加解压方法：

```java
package org.cocos2dx.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class AppActivity extends CocosActivity {
    
    /**
     * 解压zip文件
     * @param zipPath zip文件路径
     * @param extractDir 解压目标目录
     * @return 是否成功
     */
    public static boolean unzipFile(String zipPath, String extractDir) {
        try {
            File zipFile = new File(zipPath);
            if (!zipFile.exists()) {
                android.util.Log.e("AppActivity", "Zip file not exists: " + zipPath);
                return false;
            }
            
            File destDir = new File(extractDir);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            
            ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(zipFile));
            ZipEntry zipEntry = zipInputStream.getNextEntry();
            
            byte[] buffer = new byte[1024];
            while (zipEntry != null) {
                String fileName = zipEntry.getName();
                File newFile = new File(destDir, fileName);
                
                if (zipEntry.isDirectory()) {
                    newFile.mkdirs();
                } else {
                    // 确保父目录存在
                    new File(newFile.getParent()).mkdirs();
                    
                    FileOutputStream fileOutputStream = new FileOutputStream(newFile);
                    int len;
                    while ((len = zipInputStream.read(buffer)) > 0) {
                        fileOutputStream.write(buffer, 0, len);
                    }
                    fileOutputStream.close();
                }
                
                zipEntry = zipInputStream.getNextEntry();
            }
            
            zipInputStream.closeEntry();
            zipInputStream.close();
            
            android.util.Log.d("AppActivity", "Unzip success: " + extractDir);
            return true;
        } catch (Exception e) {
            android.util.Log.e("AppActivity", "Unzip error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
```

### iOS 实现

需要在原生代码中添加解压方法，创建 `NativeHelper.mm`：

```objective-c
#import "NativeHelper.h"
#import <Foundation/Foundation.h>
#import <SSZipArchive/SSZipArchive.h>  // 需要引入SSZipArchive库

@implementation NativeHelper

+ (BOOL)unzipFile:(NSString *)zipPath toPath:(NSString *)extractDir {
    @try {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        
        // 检查zip文件是否存在
        if (![fileManager fileExistsAtPath:zipPath]) {
            NSLog(@"Zip file not exists: %@", zipPath);
            return NO;
        }
        
        // 确保解压目录存在
        if (![fileManager fileExistsAtPath:extractDir]) {
            [fileManager createDirectoryAtPath:extractDir 
                   withIntermediateDirectories:YES 
                                    attributes:nil 
                                         error:nil];
        }
        
        // 使用SSZipArchive解压
        BOOL success = [SSZipArchive unzipFileAtPath:zipPath 
                                        toDestination:extractDir];
        
        if (success) {
            NSLog(@"Unzip success: %@", extractDir);
        } else {
            NSLog(@"Unzip failed: %@", extractDir);
        }
        
        return success;
    } @catch (NSException *exception) {
        NSLog(@"Unzip error: %@", exception.reason);
        return NO;
    }
}

@end
```

**注意**：iOS需要引入SSZipArchive库，可以通过CocoaPods安装：

```ruby
pod 'SSZipArchive'
```

或者使用其他解压库，如ZipArchive等。

## 服务器端准备

### 1. 压缩包结构

压缩包内的文件结构应该与热更新目录结构一致：

```
update.zip
├── project.manifest
├── version.manifest
├── assets/
│   ├── scripts/
│   ├── textures/
│   └── ...
└── ...
```

### 2. 版本管理

建议在服务器端维护一个版本清单文件，例如 `version.json`：

```json
{
    "version": "1.0.0",
    "zipUrl": "https://update.fastpay11.com/GameXVersion3/1.0.0/update.zip",
    "size": 1024000,
    "md5": "abc123...",
    "forceUpdate": false
}
```

客户端可以先检查版本，再决定是否下载压缩包。

## 注意事项

1. **原生平台支持**：压缩包热更新仅支持原生平台（Android/iOS），不支持Web平台
2. **原生解压实现**：必须在原生端实现解压功能，否则无法使用
3. **文件权限**：确保应用有写入权限，能够创建解压目录
4. **存储空间**：确保设备有足够的存储空间存放压缩包和解压后的文件
5. **网络环境**：大文件下载建议在WiFi环境下进行
6. **错误处理**：建议添加重试机制和错误提示

## 故障排查

### 问题1：解压失败

- 检查原生端解压方法是否正确实现
- 检查zip文件是否损坏
- 检查目标目录是否有写入权限

### 问题2：下载失败

- 检查网络连接
- 检查zipUrl是否正确
- 检查服务器是否可访问

### 问题3：搜索路径未更新

- 检查解压目录是否正确
- 检查搜索路径更新逻辑
- 查看控制台日志

## 性能优化建议

1. **压缩率**：使用高压缩率的压缩算法（如7z），但要注意解压时间
2. **分片下载**：对于超大压缩包，可以考虑分片下载
3. **增量更新**：只打包变更的文件，而不是全量打包
4. **后台下载**：在后台下载压缩包，不阻塞用户操作

## 与现有热更新方案的对比

| 特性 | 传统文件下载 | 压缩包下载 |
|------|------------|-----------|
| HTTP请求数 | 多（每个文件一次） | 1（单个压缩包） |
| 下载速度 | 较慢 | 较快（压缩后更小） |
| 服务器管理 | 复杂（需管理多个文件） | 简单（只需管理压缩包） |
| 断点续传 | 每个文件独立 | 单个文件更可靠 |
| 实现复杂度 | 低 | 中（需要原生解压） |

## 总结

压缩包热更新方案适合以下场景：
- 热更新文件较多
- 网络环境不稳定
- 需要减少服务器压力
- 对下载速度有要求

如果热更新文件较少（<10个），传统文件下载方式可能更简单直接。

