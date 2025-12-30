# Cocos Creator 3.8 热更新系统文档

欢迎使用热更新系统！本系统支持压缩包热更新和智能增量更新，帮助您快速实现游戏的热更新功能。

## 📚 文档导航

### 🚀 [快速开始](./QUICK_START.md)
5分钟快速上手，包含基本配置和使用示例。

**适合人群**: 首次使用、需要快速集成的开发者

**包含内容**:
- 配置检查清单
- 服务器文件结构
- 测试更新流程
- 常见场景说明
- 故障排查

### 🛠️ [自动化工具](./README_TOOLS.md)
完整的热更新构建和管理工具集。

**适合人群**: 需要构建热更新包、管理版本的开发者

**包含工具**:
- `generate-manifest.js` - 生成manifest文件
- `package-zip.js` - 打包zip文件
- `build-hotupdate.js` - 构建单个Bundle
- `build-all-bundles.js` - 批量构建所有Bundle
- `verify-update.js` - 验证更新文件
- `clean-cache.js` - 清理缓存

### 📦 [打包工具](./BUILD_TOOLS.md)
Android和iOS打包工具。

**适合人群**: 需要构建和发布Android APK、iOS IPA的开发者

**包含工具**:
- `build-android.js` - Android包构建
- `build-apk.js` - Android APK生成
- `build-ios.js` - iOS IPA发布
- `CHANNEL_CONFIG.md` - 渠道配置说明

---

### 📖 [完整指南](./HOT_UPDATE_GUIDE.md)
系统完整文档，包含所有功能和详细说明。

**适合人群**: 需要深入了解系统、进行定制开发的开发者

**包含内容**:
- 系统架构
- 配置说明
- 更新策略详解
- Bundle更新位置
- 日志系统
- 原生平台支持
- 常见问题解答

---

### 🔧 [API参考](./API_REFERENCE.md)
所有API的详细说明和使用示例。

**适合人群**: 需要调用API、进行二次开发的开发者

**包含内容**:
- ZipHotUpdateManager API
- HotUpdate API
- SlotGameLoding 说明
- 类型定义
- 使用示例

---

## 🎯 快速选择

### 我想...

- **快速集成热更新** → 查看 [快速开始](./QUICK_START.md)
- **构建热更新包** → 查看 [自动化工具](./README_TOOLS.md)
- **了解系统原理** → 查看 [完整指南](./HOT_UPDATE_GUIDE.md) 的"系统架构"和"更新策略"章节
- **查看API用法** → 查看 [API参考](./API_REFERENCE.md)
- **解决具体问题** → 查看 [完整指南](./HOT_UPDATE_GUIDE.md) 的"常见问题"章节
- **配置日志系统** → 查看 [完整指南](./HOT_UPDATE_GUIDE.md) 的"日志系统"章节
- **了解Bundle更新位置** → 查看 [完整指南](./HOT_UPDATE_GUIDE.md) 的"Bundle更新位置"章节

---

## ✨ 核心特性

- ✅ **压缩包热更新**: 使用zip压缩包，加快下载速度
- ✅ **智能增量更新**: 首次完整zip，后续只更新变更文件
- ✅ **多Bundle支持**: 支持主包、子游戏、其他Bundle独立更新
- ✅ **完整日志系统**: 可控制的详细日志，便于调试
- ✅ **原生平台支持**: Android和iOS原生解压支持
- ✅ **自动重试机制**: 更新失败自动重试
- ✅ **进度回调**: 实时更新进度，便于UI展示

---

## 📋 系统要求

- Cocos Creator 3.8+
- Android 5.0+ / iOS 9.0+
- 网络连接（更新时）
- 足够的存储空间

---

## 🛠️ 核心文件

```
assets/scripts/
├── config/
│   └── Config.ts                    # 配置文件
├── hotupdate/
│   ├── HotUpdate.ts                 # 主更新流程
│   └── ZipHotUpdateManager.ts       # 压缩包管理器
└── game/slotgame/
    └── SlotGameLoding.ts            # 子游戏更新

scripts/hotupdate/
├── generate-manifest.js             # 生成manifest工具
├── package-zip.js                   # 打包zip工具
├── build-hotupdate.js                # 构建单个Bundle工具
├── build-all-bundles.js             # 批量构建工具
├── verify-update.js                 # 验证工具
├── clean-cache.js                    # 清理缓存工具
├── read-config.js                    # 配置读取工具
├── build-android.js                  # Android构建脚本
├── build-apk.js                      # APK生成脚本
├── build-ios.js                      # iOS发布脚本
├── CHANNEL_CONFIG.md                 # 渠道配置说明
└── BUILD_TOOLS.md                    # 打包工具文档

native/engine/
├── android/app/src/com/cocos/game/
│   └── PlatformAndroidApi.java      # Android原生支持
└── ios/
    ├── NativeHelper.h               # iOS头文件
    └── NativeHelper.mm               # iOS实现
```

---

## ⚙️ 基本配置

在 `assets/scripts/config/Config.ts` 中配置：

```typescript
export const Config = {
    // 游戏渠道号（决定使用哪个环境配置）
    gameChannel: "test",  // 或 "D105", "D101" 等
    
    // 热更新地址从ENV_CONFIG中自动读取，无需在此配置
    hotupdateBaseUrl: "",  // 留空，由ENV_CONFIG提供
    
    // 当前版本号
    hotupdate_version: '1.0.0',
    
    // 使用压缩包热更新
    useZipHotUpdate: true,
    
    // 启用详细日志
    hotUpdateLogEnabled: true,
};
```

**环境配置**：热更新地址在 `ENV_CONFIG` 中按环境配置，系统根据 `gameChannel` 自动选择：

```typescript
const ENV_CONFIG = {
    test: {
        hotupdateBaseUrl: "http://192.168.0.101:3000",  // 测试环境
    },
    D105: {
        hotupdateBaseUrl: "https://updateaws.fastpay11.com/GameXd105V3",  // 生产环境
    },
    // ... 其他环境
};
```

---

## 🎮 使用流程

1. **配置**: 
   - 在 `Config.ts` 中设置 `gameChannel`（选择环境）和版本号
   - 在 `ENV_CONFIG` 中配置对应环境的热更新地址
2. **初始化**: 系统在游戏启动时自动初始化
3. **检查更新**: 调用 `hotUpdate.checkVersion()` 检查并更新
4. **子游戏**: 进入子游戏时自动检查并更新

---

## 📝 更新策略

### 首次更新
- 下载完整zip压缩包
- 解压到本地目录
- 更新搜索路径

### 增量更新
- 下载远程manifest
- 对比本地manifest
- 只下载变更文件
- 如果变更文件过多，回退到完整zip

---

## 🔍 日志系统

通过 `Config.hotUpdateLogEnabled` 控制日志输出：

- `true`: 启用详细日志（开发推荐）
- `false`: 只显示关键信息和错误（生产推荐）

日志前缀：
- `[HotUpdate]` - 主更新流程
- `[SlotGameLoding]` - 子游戏更新

---

## 🐛 故障排查

### 更新失败
1. 检查服务器文件是否存在
2. 检查版本号是否正确
3. 查看错误日志
4. 检查网络连接

### 更新后未生效
1. 确认搜索路径已更新
2. 检查是否需要重启游戏
3. 验证文件是否正确解压

### 更多问题
查看 [完整指南](./HOT_UPDATE_GUIDE.md) 的"常见问题"章节

---

## 📞 技术支持

遇到问题？
1. 查看控制台日志
2. 查看原生平台日志（Android: logcat, iOS: Xcode）
3. 检查配置文件
4. 查看文档中的常见问题

---

## 📄 版本历史

- **v1.0.0**: 初始版本
  - 支持压缩包热更新
  - 支持智能增量更新
  - 支持多Bundle并行更新
  - 完整的日志系统
  - Android和iOS原生支持

---

## 📖 相关文档

- [Cocos Creator 官方文档](https://docs.cocos.com/)
- [热更新最佳实践](https://docs.cocos.com/creator/manual/zh/advanced-topics/hot-update.html)

---

**最后更新**: 2024年

**维护者**: 开发团队

