# 热更新打包结构说明

## 问题：为什么 update.zip 这么大？

### 原因分析

如果 `update.zip` 包含了所有子包的文件，可能是因为：

1. **打包脚本包含了 `assets/` 目录**
   - `assets/` 目录下包含所有子包（hall、Crazy777I等）
   - 如果主包打包时包含了 `assets/`，就会包含所有子包内容

2. **主包和子包应该分开**
   - 主包（update.zip）：只包含主包自己的文件
   - 子包（hall.zip、Crazy777I.zip等）：各自单独打包

## 正确的打包结构

### 主包（update.zip）应该包含：

```
update.zip
├── project.manifest      # 主包清单
├── version.manifest      # 主包版本
├── src/                  # 主包源代码
├── jsb-adapter/         # JSB适配器
└── gg.config.json        # 配置文件

❌ 不应该包含：
└── assets/              # 子包目录（应该排除）
```

### 子包（hall.zip、Crazy777I.zip等）应该包含：

```
hall.zip
├── project.manifest      # hall子包清单
├── version.manifest      # hall子包版本
└── assets/               # hall子包资源
    ├── scripts/
    ├── textures/
    └── ...
```

## 目录结构说明

### 源目录结构

```
hotupdate-assets/1.0.66/android/
├── project.manifest      # 主包清单
├── version.manifest      # 主包版本
├── src/                  # 主包源代码
├── jsb-adapter/         # JSB适配器
├── gg.config.json        # 配置文件
└── assets/              # 子包目录
    ├── hall/            # hall子包
    │   ├── project.manifest
    │   ├── version.manifest
    │   └── assets/
    ├── Crazy777I/       # Crazy777I子包
    │   ├── project.manifest
    │   ├── version.manifest
    │   └── assets/
    └── ...
```

### 打包后的结构

```
hotupdate-packages/1.0.66/android/
├── update.zip           # 主包（不包含assets/）
├── hall.zip             # hall子包
├── Crazy777I.zip        # Crazy777I子包
└── ...
```

## 为什么主包不应该包含子包？

### 1. 按需加载

- 用户可能不需要所有子包
- 只下载需要的子包，节省流量和存储

### 2. 减小主包体积

- 主包通常只需要核心文件
- 子包可以很大（游戏资源），不应该都打包到主包

### 3. 独立更新

- 子包可以独立更新，不需要更新主包
- 如果主包包含子包，子包更新需要重新打包主包

### 4. 符合 Cocos Creator 设计

- Cocos Creator 的 Bundle 机制就是按需加载
- 主包和子包是分离的

## 打包脚本修改

### 修改前（错误）

```bash
# 会包含所有文件，包括 assets/ 下的子包
zip -r update.zip .
```

### 修改后（正确）

```bash
# 排除 assets/ 目录，子包会单独打包
zip -r update.zip . -x "assets/*"
```

## 文件大小对比

### 假设场景

- 主包文件：50 MB
- hall子包：200 MB
- Crazy777I子包：150 MB
- 其他子包：300 MB

### 错误打包（包含所有子包）

```
update.zip: 700 MB  ❌ 太大！
```

### 正确打包（主包和子包分开）

```
update.zip: 50 MB   ✅ 合理
hall.zip: 200 MB
Crazy777I.zip: 150 MB
其他子包: 300 MB
```

**优势**：
- 用户只需下载需要的子包
- 主包体积小，下载快
- 子包可以独立更新

## 使用场景

### 场景1：用户只玩主游戏

```
下载：update.zip (50 MB)
不下载子包
总下载：50 MB
```

### 场景2：用户玩主游戏 + hall子包

```
下载：update.zip (50 MB) + hall.zip (200 MB)
总下载：250 MB
```

### 场景3：用户玩所有游戏

```
下载：update.zip + 所有子包
总下载：700 MB（和错误打包一样，但可以按需下载）
```

## 总结

1. ✅ **主包（update.zip）应该排除 `assets/` 目录**
2. ✅ **子包应该单独打包成各自的 zip 文件**
3. ✅ **这样可以减小主包体积，支持按需下载**
4. ✅ **符合 Cocos Creator 的 Bundle 设计理念**

如果 `update.zip` 很大，检查打包脚本是否正确排除了 `assets/` 目录。

