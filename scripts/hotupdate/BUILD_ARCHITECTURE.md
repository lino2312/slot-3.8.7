# 打包脚本架构设计

## 📐 架构概览

```
scripts/hotupdate/
├── lib/                          # 核心工具库
│   ├── config.js                # 配置管理（读取 Config.ts、builder.json）
│   ├── builder.js                # 构建工具（Cocos Creator 构建）
│   └── utils.js                  # 通用工具函数
│
├── build/                        # 平台构建脚本
│   ├── android.js                # Android 构建
│   ├── ios.js                    # iOS 构建
│   └── web.js                    # Web 构建
│
└── post/                         # 后处理脚本
    ├── android.js                # Android 后处理（图标、发布等）
    └── ios.js                    # iOS 后处理（发布等）
```

## 🎯 设计原则

1. **职责分离**：构建脚本只负责构建，后处理脚本负责后续操作
2. **配置集中**：所有配置从 Config.ts 和 builder.json 读取
3. **工具复用**：通用功能提取到 lib 中
4. **简单清晰**：每个脚本只做一件事

## 📦 模块说明

### lib/config.js
- 读取 Config.ts 中的配置（gameChannel、hotupdate_version 等）
- 更新 Config.ts 中的配置
- 读取 builder.json 中的构建配置
- 渠道映射（gameChannel -> buildConfigName）

### lib/builder.js
- 执行 Cocos Creator 构建命令
- 等待构建完成
- 检查构建结果

### lib/utils.js
- 查找 APK/IPA 文件
- 发布到发布目录
- 修改 AndroidManifest.xml
- 其他通用工具函数

### build/android.js
- 解析命令行参数
- 调用 lib/builder.js 执行构建
- 提示运行后处理脚本

### build/ios.js
- 解析命令行参数
- 调用 lib/builder.js 执行构建
- 提示运行后处理脚本

### build/web.js
- 解析命令行参数
- 调用 lib/builder.js 执行构建

### post/android.js
- 修改 AndroidManifest.xml 图标
- 检查构建结果
- 发布 APK 到发布目录

### post/ios.js
- 检查构建结果
- 发布 IPA 到发布目录

## 🔄 工作流程

### Android 构建流程
```bash
# 1. 构建
node scripts/hotupdate/build/android.js --channel test

# 2. 后处理（可选）
node scripts/hotupdate/build/post-android.js --channel test
```

### iOS 构建流程
```bash
# 1. 构建
node scripts/hotupdate/build/ios.js --channel test

# 2. 后处理（可选）
node scripts/hotupdate/post/ios.js --channel test
```

## 📝 配置说明

### 渠道配置
- `Config.ts` 中的 `gameChannel` 是游戏运行时使用的渠道
- `builder.json` 中的构建配置名称（如 `MIGame`、`YonoHot`、`test`）
- 渠道映射：`D105 -> MIGame`、`D108 -> YonoHot`、`test -> test`

### 构建配置
- 从 `builder.json` 读取，通过 `taskName` 匹配（如 `android-MIGame`）
- 支持 `configPath` 方式（从配置文件读取）

### 发布目录
- Android: `安卓包/{channel}/{variant}/`
- iOS: `安卓包/{channel}/ios/`

