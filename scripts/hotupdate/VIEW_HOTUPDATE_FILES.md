# 查看热更新文件指南

## 在 Mumu 模拟器中查看热更新文件

> **重要提示**: 发布版本（production builds）无法使用 `adb root`，需要使用其他方法查看文件。

### 1. 连接 Mumu 模拟器

```bash
# 查看连接的设备
adb devices

# 如果 mumu 模拟器未连接，可能需要先启动模拟器
# 或者使用 mumu 模拟器自带的 adb 工具
```

### 1.1 检查设备类型

```bash
# 检查是否为调试版本（可以使用 run-as）
adb shell "run-as com.game.testGame ls /data/data/com.game.testGame/files/" 2>&1 | head -1

# 如果返回 "run-as: Package 'com.game.testGame' is not debuggable"
# 说明是发布版本，需要使用其他方法
```

### 2. 查找应用包名

```bash
# 查看所有已安装的应用包名
adb shell pm list packages | grep -i game

# 或者根据应用名称查找（需要知道应用名称）
# 例如：com.game.testGame
```

### 3. 查看热更新文件位置

热更新文件存储在应用的内部存储目录：
```
/data/data/{packageName}/files/gg-hot-update-zip/
```

**主包文件**：
- `/data/data/{packageName}/files/gg-hot-update-zip/build-in/`
  - `project.manifest`
  - `cc.config.json`
  - `native/...`
  - 其他文件

**子包文件**（如 hall）：
- `/data/data/{packageName}/files/gg-hot-update-zip/assets/hall/`
  - `project.manifest`
  - `cc.config.json`
  - `native/...`
  - 其他文件

**子游戏文件**（如 Super777I）：
- `/data/data/{packageName}/files/gg-hot-update-zip/assets/Super777I/`
  - `project.manifest`
  - `cc.config.json`
  - `native/...`
  - 其他文件

### 4. 常用命令

#### 查看热更新目录是否存在

```bash
# 替换 {packageName} 为实际包名
adb shell "ls -la /data/data/{packageName}/files/gg-hot-update-zip/"
```

#### 查看主包文件

```bash
adb shell "ls -la /data/data/{packageName}/files/gg-hot-update-zip/build-in/"
```

#### 查看 hall bundle 文件

```bash
adb shell "ls -la /data/data/{packageName}/files/gg-hot-update-zip/assets/hall/"
```

#### 查看 manifest 文件内容

```bash
# 主包 manifest
adb shell "cat /data/data/{packageName}/files/gg-hot-update-zip/build-in/project.manifest"

# hall bundle manifest
adb shell "cat /data/data/{packageName}/files/gg-hot-update-zip/assets/hall/project.manifest"
```

#### 查看 cc.config.json 文件

```bash
# 主包配置
adb shell "cat /data/data/{packageName}/files/gg-hot-update-zip/build-in/cc.config.json"

# hall bundle 配置
adb shell "cat /data/data/{packageName}/files/gg-hot-update-zip/assets/hall/cc.config.json"
```

#### 将文件复制到本地

```bash
# 复制整个热更新目录到本地
adb pull /data/data/{packageName}/files/gg-hot-update-zip/ ./hotupdate-files-from-device/

# 复制特定文件
adb pull /data/data/{packageName}/files/gg-hot-update-zip/build-in/project.manifest ./
```

#### 查看搜索路径

```bash
# 进入应用 shell（需要 root 权限或应用有调试权限）
adb shell "run-as {packageName} ls -la /data/data/{packageName}/files/"
```

### 5. 使用 run-as（仅适用于调试版本）

**注意**: 只有调试版本（debuggable）的应用才能使用 `run-as`。发布版本无法使用此方法。

```bash
# 检查应用是否为调试版本
adb shell "run-as {packageName} ls /data/data/{packageName}/files/" 2>&1

# 如果是调试版本，可以进入应用目录
adb shell "run-as {packageName} sh"

# 然后可以执行命令
cd files/gg-hot-update-zip/
ls -la
cat build-in/project.manifest
exit
```

### 6. 发布版本（Production Builds）的查看方法

**重要**: 发布版本无法使用 `adb root`（会提示 "adbd cannot run as root in production builds"），需要使用以下方法：

#### 方法1: 通过应用日志查看路径信息（推荐）⭐

应用日志中会输出热更新文件的路径信息：

**快速查看脚本**:
```bash
# 使用便捷脚本（推荐）
./scripts/hotupdate/view-hotupdate-logs.sh
```

**手动查看**:
```bash
# 实时查看日志
adb logcat | grep -E "ZipHotUpdateManager|localRootDirPath|extractPath"

# 或者查看特定标签
adb logcat -s ZipHotUpdateManager:* | grep -E "初始化完成|搜索路径已更新|检查解压目录"

# 查看最近的日志（不清空）
adb logcat -d | grep -E "ZipHotUpdateManager|localRootDirPath|extractPath" | tail -50
```

日志中会显示：
- `localRootDirPath`: 热更新文件存储的根目录（例如：`/data/data/com.game.testGame/files/gg-hot-update-zip`）
- `extractPath`: 每个 bundle 的解压路径（例如：`/data/data/com.game.testGame/files/gg-hot-update-zip/assets/hall`）
- `searchPath`: 搜索路径（例如：`/data/data/com.game.testGame/files/gg-hot-update-zip/assets/hall/`）
- `hasConfigFile`: 配置文件是否存在
- `configFilePath`: 配置文件的完整路径

#### 方法2: 使用文件管理器应用

在应用内部添加一个调试功能，将热更新文件路径输出到日志或文件：

```typescript
// 在应用代码中添加（仅用于调试）
console.log('热更新文件路径:', zipHotUpdateManager.getLocalRootDirPath());
console.log('hall bundle 路径:', zipHotUpdateManager.getBundleExtractPath('hall'));
```

#### 方法3: 通过应用内文件浏览器（需要应用支持）

如果应用有文件浏览功能，可以导航到热更新目录查看。

#### 方法4: 使用 Android Studio 的 Device File Explorer

1. 打开 Android Studio
2. 连接设备
3. 打开 View → Tool Windows → Device File Explorer
4. 导航到 `/data/data/{packageName}/files/gg-hot-update-zip/`
5. 注意：发布版本可能无法访问此目录

#### 方法5: 在应用内添加调试接口

在应用代码中添加一个调试接口，将热更新文件信息输出到可访问的位置（如 SD 卡）：

```typescript
// 示例：将热更新文件信息复制到 SD 卡（需要权限）
function exportHotUpdateInfo() {
    const hotUpdatePath = zipHotUpdateManager.getLocalRootDirPath();
    const exportPath = path.join(native.fileUtils.getWritablePath(), '../sdcard/hotupdate-info.txt');
    
    const info = {
        localRootDirPath: hotUpdatePath,
        bundles: []
    };
    
    // 遍历所有 bundle 并记录信息
    // ...
    
    native.fileUtils.writeStringToFile(exportPath, JSON.stringify(info, null, 2));
}
```

#### 方法6: 使用模拟器的文件管理器

某些模拟器（如 Mumu）可能提供文件管理器功能，可以直接浏览应用数据目录。

### 6.1 为什么发布版本无法使用 adb root？

这是 Android 的安全机制：
- **调试版本（Debug）**: 可以在 `AndroidManifest.xml` 中设置 `android:debuggable="true"`，允许使用 `run-as`
- **发布版本（Release）**: `android:debuggable="false"`，无法使用 `run-as` 和 `adb root`

这是正常的安全限制，目的是保护用户数据。

### 7. 查看日志中的路径信息

在应用日志中查找以下信息：
- `[ZipHotUpdateManager] 初始化完成` - 会显示 `localRootDirPath`
- `[ZipHotUpdateManager] 搜索路径已更新` - 会显示 `searchPath` 和 `extractPath`
- `[ZipHotUpdateManager] 检查解压目录` - 会显示 `extractPath` 和文件存在情况

### 8. 快速检查脚本

创建一个快速检查脚本 `check-hotupdate-files.sh`：

```bash
#!/bin/bash

# 设置包名（根据实际情况修改）
PACKAGE_NAME="com.game.testGame"

echo "=== 检查热更新文件 ==="
echo "包名: $PACKAGE_NAME"
echo ""

# 检查主目录
echo "1. 检查热更新主目录:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/" 2>/dev/null || echo "目录不存在或无法访问"
echo ""

# 检查主包
echo "2. 检查主包文件:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/build-in/" 2>/dev/null || echo "主包目录不存在"
echo ""

# 检查 hall bundle
echo "3. 检查 hall bundle:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall/" 2>/dev/null || echo "hall bundle 目录不存在"
echo ""

# 检查 manifest 文件
echo "4. 检查 manifest 文件:"
adb shell "test -f /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/build-in/project.manifest && echo '主包 manifest 存在' || echo '主包 manifest 不存在'"
adb shell "test -f /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall/project.manifest && echo 'hall manifest 存在' || echo 'hall manifest 不存在'"
echo ""

# 检查配置文件
echo "5. 检查配置文件:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/build-in/cc.config*.json" 2>/dev/null || echo "主包配置文件不存在"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall/cc.config*.json" 2>/dev/null || echo "hall 配置文件不存在"
```

使用方法：
```bash
chmod +x check-hotupdate-files.sh
./check-hotupdate-files.sh
```

### 9. 常见问题

#### 问题1: 无法访问 /data/data/ 目录

**原因**: 
- 发布版本无法使用 `adb root`（会提示 "adbd cannot run as root in production builds"）
- 应用没有调试权限（`android:debuggable="false"`）

**解决方法**:
1. **调试版本**: 使用 `run-as` 命令（见方法5）
2. **发布版本**: 使用应用日志查看路径信息（见方法1）
3. **开发阶段**: 使用调试版本进行测试
4. **生产环境**: 通过应用日志或应用内调试接口查看

#### 问题2: "adbd cannot run as root in production builds"

**原因**: 这是 Android 的安全限制，发布版本不允许 root 访问

**解决方法**:
- **不要使用 `adb root`**，这在发布版本中不可用
- 使用 `run-as`（仅调试版本）
- 或通过应用日志查看路径信息
- 或在应用内添加调试功能

#### 问题2: 找不到文件

**可能原因**:
- 热更新还未下载
- 文件路径不正确
- 应用包名不正确

**解决方法**:
- 查看应用日志确认 `localRootDirPath`
- 确认应用包名是否正确
- 确认热更新是否已成功下载

#### 问题3: 文件权限问题

**解决方法**:
```bash
# 使用 run-as（调试版本）
adb shell "run-as {packageName} ls -la /data/data/{packageName}/files/gg-hot-update-zip/"

# 或使用 root 权限
adb root
adb shell "ls -la /data/data/{packageName}/files/gg-hot-update-zip/"
```

### 10. 查看应用日志中的路径信息

在应用运行时，查看日志输出：
```bash
# 实时查看日志
adb logcat | grep -E "ZipHotUpdateManager|GameLaunch|hotupdate"

# 或者查看特定标签
adb logcat -s ZipHotUpdateManager:* GameLaunch:*
```

日志中会显示：
- `localRootDirPath`: 热更新文件存储的根目录
- `extractPath`: 每个 bundle 的解压路径
- `searchPath`: 搜索路径

### 11. 示例：查看 hall bundle 的完整信息

```bash
# 1. 确认包名（假设是 com.game.testGame）
PACKAGE_NAME="com.game.testGame"

# 2. 查看目录结构
adb shell "find /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall -type f | head -20"

# 3. 查看 manifest
adb shell "cat /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall/project.manifest | head -50"

# 4. 查看配置文件
adb shell "cat /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall/cc.config.json | head -50"

# 5. 统计文件数量
adb shell "find /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/hall -type f | wc -l"
```

### 12. 注意事项

1. **包名**: 不同渠道的包名可能不同，需要确认正确的包名
2. **权限**: 访问 `/data/data/` 目录需要 root 权限或应用有调试权限
3. **路径**: 热更新文件路径是 `{getWritablePath()}/gg-hot-update-zip/`，在 Android 上通常是 `/data/data/{packageName}/files/gg-hot-update-zip/`
4. **调试版本**: 如果是调试版本，可以使用 `run-as` 命令，无需 root 权限

