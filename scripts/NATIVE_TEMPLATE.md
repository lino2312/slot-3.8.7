# Native 模板说明

## 概述

Cocos Creator 在构建 Android 项目时，会使用 `native/engine/android` 目录中的文件作为模板。这个目录包含了 Android 项目的核心配置和源代码。

## 目录结构

```
native/engine/android/
├── app/                          # Android App 模块
│   ├── AndroidManifest.xml      # Android 清单文件
│   ├── build.gradle             # App 模块的 Gradle 配置
│   ├── proguard-rules.pro       # ProGuard 混淆规则
│   ├── src/                     # Java/Kotlin 源代码
│   │   └── com/cocos/game/      # 游戏相关 Java 类
│   │       ├── AppActivity.java
│   │       ├── PlatformAndroidApi.java
│   │       └── ...
│   └── debug/                   # Debug APK 输出目录
├── instantapp/                  # Android Instant App 模块（可选）
│   ├── AndroidManifest.xml
│   ├── build.gradle
│   └── src/
├── build.gradle                 # 根级 Gradle 配置
├── build-cfg.json               # 构建配置
├── CMakeLists.txt               # CMake 配置（用于 C++ 代码）
├── Pre-service.cmake            # CMake 预服务脚本
├── Post-service.cmake           # CMake 后服务脚本
└── res/                         # Android 资源文件
    ├── mipmap-*/                # 应用图标
    └── values/
        └── strings.xml          # 字符串资源
```

## 构建流程

### 1. 模板使用

当执行 Cocos Creator 构建时：

1. Cocos Creator 读取 `native/engine/android` 目录作为模板
2. 将模板文件复制到构建输出目录 `build/android/proj/`
3. 根据项目配置修改相关文件（如包名、版本号等）
4. 生成最终的 Android 项目

### 2. 项目结构映射

从 `build/android/proj/settings.gradle` 可以看到：

```gradle
project(':app').projectDir = new File(NATIVE_DIR, 'app')
```

这意味着：
- `NATIVE_DIR` 指向 `native/engine/android`
- `app` 模块直接使用 `native/engine/android/app` 目录
- 构建时不会复制，而是直接引用

## 重要文件说明

### build.gradle (根级)

根级 `build.gradle` 文件定义了：
- Android Gradle 插件版本
- 依赖仓库配置
- 全局构建配置

### app/build.gradle

App 模块的 `build.gradle` 定义了：
- 应用 ID (packageName)
- 版本信息 (versionCode, versionName)
- 依赖库
- 签名配置
- 构建变体配置

### build-cfg.json

构建配置文件，包含：
- 应用配置
- 构建选项
- 平台特定设置

### AndroidManifest.xml

Android 清单文件，定义：
- 应用权限
- Activity 配置
- 服务配置
- 其他应用元数据

## 自定义配置

### 修改应用图标

替换 `native/engine/android/res/mipmap-*/ic_launcher.png` 文件

### 修改应用名称

编辑 `native/engine/android/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">你的应用名称</string>
</resources>
```

### 添加 Java 代码

在 `native/engine/android/app/src/com/cocos/game/` 目录下添加 Java 类

### 修改 Gradle 配置

编辑 `native/engine/android/app/build.gradle` 来：
- 添加依赖库
- 修改构建配置
- 配置 ProGuard 规则

## 注意事项

1. **不要删除模板文件**: `native/engine/android` 目录是构建必需的，不要删除
2. **版本控制**: 建议将 `native/engine/android` 目录纳入版本控制
3. **构建前检查**: 确保模板文件完整，否则构建可能失败
4. **自定义修改**: 对模板文件的修改会影响所有后续构建

## 构建脚本集成

构建脚本 (`build-android.js`) 会自动：
1. 检查 Cocos Creator 是否正确安装
2. 调用 Cocos Creator 构建命令
3. Cocos Creator 内部会使用 `native/engine/android` 作为模板
4. 生成构建产物到 `build/android/` 目录

## 故障排查

### 问题：构建失败，提示找不到模板文件

**解决**:
- 检查 `native/engine/android` 目录是否存在
- 确保目录结构完整
- 检查文件权限

### 问题：构建后的项目缺少自定义配置

**解决**:
- 检查 `native/engine/android` 中的配置文件
- 确保修改已保存
- 清理构建缓存后重新构建

### 问题：Java 代码修改未生效

**解决**:
- 确保 Java 文件在 `native/engine/android/app/src/` 目录下
- 检查包名是否正确
- 重新构建项目

## 相关文档

- [Cocos Creator 原生开发文档](https://docs.cocos.com/creator/manual/zh/publish/publish-native.html)
- [Android 构建配置](https://docs.cocos.com/creator/manual/zh/publish/publish-native.html#android-%E6%9E%84%E5%BB%BA%E9%85%8D%E7%BD%AE)

