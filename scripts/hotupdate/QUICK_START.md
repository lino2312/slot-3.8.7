# 热更新系统快速开始

## 5分钟快速上手

### 1. 配置检查

在 `assets/scripts/config/Config.ts` 中确认配置：

```typescript
export const Config = {
    // 设置游戏渠道（决定使用哪个环境配置）
    gameChannel: "test",  // 或 "D105", "D101" 等
    
    // 热更新地址从ENV_CONFIG中自动读取，无需在此配置
    hotupdateBaseUrl: "",  // 留空，由ENV_CONFIG提供
    
    hotupdate_version: '1.0.0',
    useZipHotUpdate: true,        // 启用压缩包热更新
    hotUpdateLogEnabled: true,    // 启用日志（开发时建议开启）
};
```

**重要**：热更新地址在 `ENV_CONFIG` 中配置，根据 `gameChannel` 自动选择：

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

切换环境只需修改 `gameChannel`，系统会自动使用对应环境的热更新地址。

### 2. 服务器文件结构

确保服务器文件结构如下：

```
{baseUrl}/
└── {version}/
    ├── update.zip                    # 主包压缩包
    ├── project.manifest              # 主包清单文件
    └── assets/
        ├── hall/
        │   ├── hall.zip
        │   └── project.manifest
        └── {subGameName}/
            ├── {subGameName}.zip
            └── project.manifest
```

### 3. 游戏启动时初始化

热更新系统会在 `HotUpdate.ts` 中自动初始化，无需手动调用。

### 4. 测试更新

1. **修改版本号**：
   ```typescript
   hotupdate_version: '1.0.1'  // 改为新版本
   ```

2. **上传文件到服务器**：
   - 上传新版本的 `update.zip` 和 `project.manifest`
   - 如果有子游戏更新，上传对应的zip和manifest

3. **运行游戏**：
   - 游戏启动时会自动检查更新
   - 查看控制台日志确认更新流程

### 5. 查看日志

启用日志后，控制台会显示：

```
[HotUpdate] 开始初始化热更新系统
[HotUpdate] 开始检查版本
[HotUpdate] 发现新版本，准备更新
[HotUpdate] 更新进度: 45.23%
[HotUpdate] 压缩包热更新成功
```

---

## 常见场景

### 场景1: 首次安装后更新

1. 用户首次安装游戏
2. 启动游戏，系统检测到本地无manifest
3. **自动下载完整zip包**
4. 解压并更新搜索路径
5. 重启游戏

### 场景2: 小版本更新（1-5个文件）

1. 用户已有旧版本
2. 启动游戏，系统检测到新版本
3. **只下载变更的文件**（增量更新）
4. 更新完成，无需重启（或根据配置重启）

### 场景3: 大版本更新（>5个文件或>10MB）

1. 用户已有旧版本
2. 启动游戏，系统检测到新版本
3. 计算变更文件，发现超过阈值
4. **自动回退到下载完整zip包**
5. 解压并更新

### 场景4: 进入子游戏

1. 用户点击进入子游戏
2. `SlotGameLoding` 检查子游戏版本
3. 如有更新，**在子游戏加载界面更新**
4. 更新完成后加载子游戏

---

## 配置选项速查

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `gameChannel` | string | "test" | 游戏渠道号，决定使用哪个环境配置 |
| `useZipHotUpdate` | boolean | true | 是否使用压缩包热更新 |
| `hotUpdateLogEnabled` | boolean | true | 是否启用详细日志 |
| `hotupdate_version` | string | '1.0.0' | 当前版本号 |
| `hotupdateBaseUrl` | string | "" | 热更新服务器地址（从ENV_CONFIG中自动读取） |
| `up_type` | number | 1 | 1-热更新，2-强制更新 |

**注意**：`hotupdateBaseUrl` 不需要在 `Config` 中配置，系统会根据 `gameChannel` 从 `ENV_CONFIG` 中自动读取对应环境的热更新地址。

---

## 调试技巧

### 1. 启用详细日志

```typescript
hotUpdateLogEnabled: true
```

### 2. 查看更新状态

在控制台搜索：
- `[HotUpdate]` - 主更新流程
- `[SlotGameLoding]` - 子游戏更新

### 3. 清除缓存测试

```typescript
import { zipHotUpdateManager } from 'db://assets/scripts/hotupdate/ZipHotUpdateManager';
zipHotUpdateManager.clearCache();
```

### 4. 检查本地文件

- Android: `/data/data/{packageName}/files/gg-hot-update-zip/`
- iOS: `{Documents}/gg-hot-update-zip/`

---

## 故障排查

### 问题：更新失败

**检查清单**：
- [ ] 服务器文件是否存在
- [ ] 版本号是否正确
- [ ] 网络连接是否正常
- [ ] 查看错误日志

### 问题：更新后没有生效

**检查清单**：
- [ ] 搜索路径是否已更新
- [ ] 是否需要重启游戏
- [ ] 文件是否正确解压

### 问题：日志太多

**解决方案**：
```typescript
hotUpdateLogEnabled: false  // 关闭详细日志
```

---

## 下一步

- 查看 [完整文档](./HOT_UPDATE_GUIDE.md) 了解详细功能
- 查看代码注释了解实现细节
- 根据项目需求调整配置

---

**提示**: 开发阶段建议开启 `hotUpdateLogEnabled`，生产环境可以关闭以提升性能。

