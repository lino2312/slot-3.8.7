# 渠道构建配置说明

本系统支持根据 `Config.ts` 中的 `gameChannel` 自动选择对应的构建配置。

## 📋 渠道映射关系

| gameChannel | 构建配置名称 | 说明 |
|------------|------------|------|
| D105 | MIGame | D105渠道使用MIGame构建配置 |
| D108 | YonoHot | D108渠道使用YonoHot构建配置 |
| test | test | test渠道使用test构建配置 |

## 📁 构建配置文件位置

**所有构建配置都存储在 `profiles/v2/packages/builder.json` 文件中**。

`builder.json` 文件包含：
- `common`: 通用构建配置
- `BuildTaskManager.taskMap`: 所有构建任务的配置，每个任务包含完整的构建参数

### 构建任务命名规则

构建任务的 `taskName` 格式为：`{platform}-{构建配置名称}`

例如：
- `android-MIGame` - MIGame (D105) Android配置
- `android-YonoHot` - YonoHot (D108) Android配置
- `android-test` - test Android配置
- `web-mobile-MIGame` - MIGame (D105) Web配置
- `web-mobile-YonoHot` - YonoHot (D108) Web配置
- `web-mobile-test` - test Web配置

## 🚀 使用方法

### Android 构建

```bash
# 方式1: 从 Config.ts 读取渠道（推荐）
# Config.ts 中 gameChannel = "D105"
node scripts/hotupdate/build-android.js
# 自动使用 MIGame 构建配置

# 方式2: 指定渠道
node scripts/hotupdate/build-android.js --channel D105
# 自动使用 MIGame 构建配置，并更新 Config.ts

node scripts/hotupdate/build-android.js --channel D108
# 自动使用 YonoHot 构建配置，并更新 Config.ts

node scripts/hotupdate/build-android.js --channel test
# 自动使用 test 构建配置，并更新 Config.ts
```

### Web 构建

```bash
# 方式1: 从 Config.ts 读取渠道（推荐）
node scripts/hotupdate/build-web.js

# 方式2: 指定渠道
node scripts/hotupdate/build-web.js --channel D105
node scripts/hotupdate/build-web.js --channel D108
node scripts/hotupdate/build-web.js --channel test
```

## 🔄 自动映射流程

1. **读取渠道**: 从 `Config.ts` 的 `gameChannel` 读取，或从命令行 `--channel` 参数获取
2. **映射配置**: 根据渠道映射表，找到对应的构建配置名称
3. **加载配置**: 从 `profiles/v2/packages/builder.json` 的 `BuildTaskManager.taskMap` 中查找对应的构建任务配置
4. **执行构建**: 使用 Cocos Creator 的 `taskName` 参数执行构建

## ⚙️ 配置映射代码

映射关系定义在构建脚本中：

```javascript
// build-android.js 和 build-web.js
const CHANNEL_BUILD_CONFIG_MAP = {
    'D105': 'MIGame',      // D105 使用 MIGame 构建配置
    'D108': 'YonoHot',      // D108 使用 YonoHot 构建配置
    'test': 'test',         // test 使用 test 构建配置
};
```

## 📝 添加新渠道

如果需要添加新渠道：

1. **在 Cocos Creator 中创建构建任务**:
   - 打开 Cocos Creator
   - 项目 -> 构建发布
   - 配置新的构建任务，确保 `taskName` 格式为：`{platform}-{构建配置名称}`
   - 例如：`android-NewChannel` 或 `web-mobile-NewChannel`
   - 保存后，配置会自动写入 `profiles/v2/packages/builder.json`

2. **更新映射关系**:
   在 `build-android.js` 和 `build-web.js` 中添加映射：
   ```javascript
   CHANNEL_BUILD_CONFIG_MAP: {
       'D105': 'MIGame',
       'D108': 'YonoHot',
       'test': 'test',
       'NewChannel': 'NewChannel',  // 新增
   }
   ```

3. **验证配置**:
   运行构建脚本，确认能正确找到配置：
   ```bash
   node scripts/hotupdate/build-android.js --channel NewChannel
   ```

## ⚠️ 注意事项

1. **配置文件必须存在**: 如果找不到对应的构建配置文件，脚本会报错并退出
2. **taskName 必须匹配**: Cocos Creator 构建配置中的 `taskName` 必须与文件名中的构建配置名称匹配
3. **渠道名称区分大小写**: `D105` 和 `d105` 是不同的渠道
4. **自动更新 Config.ts**: 使用 `--channel` 参数时，会自动更新 `Config.ts` 中的 `gameChannel`

## 🔍 故障排查

### 问题1: 找不到构建配置

```
❌ 错误: 在 builder.json 中找不到 taskName 为 "android-MIGame" 的构建配置
```

**解决方案**: 
- 检查 `profiles/v2/packages/builder.json` 文件是否存在
- 确认在 Cocos Creator 中已经创建了对应的构建任务
- 确认构建任务的 `taskName` 格式正确：`{platform}-{构建配置名称}`
- 查看错误信息中列出的可用 `taskName`，确认是否拼写错误

### 问题2: 构建配置名称不匹配

**解决方案**: 
- 检查 `builder.json` 中构建任务的 `taskName` 是否与映射表匹配
- Android: `taskName` 应该是 `android-{构建配置名称}`
- Web: `taskName` 应该是 `web-mobile-{构建配置名称}`
- 确认渠道映射表中的构建配置名称与 `taskName` 中的名称一致

### 问题3: 渠道映射未找到

```
📦 使用构建配置: D105 (未找到映射，直接使用渠道名)
```

**解决方案**: 
- 在 `CHANNEL_BUILD_CONFIG_MAP` 中添加映射关系

---

**最后更新**: 2024年

