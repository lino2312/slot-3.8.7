# Diamond777 脚本升级工具使用说明

## 📋 概述

这个工具专门用于将 Diamond777 文件夹下的脚本从 Cocos Creator 2.4.13 升级到 3.8.7。

## 🚀 快速使用

### 1. 预览模式（推荐先运行）

查看将要进行的更改，不实际修改文件：

```bash
node scripts/migrate-diamond777.js --dry-run
```

### 2. 执行升级（带备份）

自动升级并创建备份文件：

```bash
node scripts/migrate-diamond777.js --backup
```

### 3. 执行升级（不带备份）

直接升级，不创建备份（不推荐）：

```bash
node scripts/migrate-diamond777.js
```

## 📝 主要升级内容

### 1. 装饰器导入更新

**2.4.x:**
```typescript
const {ccclass, property} = cc._decorator;
```

**3.8.x:**
```typescript
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;
```

### 2. @ccclass 装饰器

**2.4.x:**
```typescript
@ccclass
export default class MyComponent extends Component {
```

**3.8.x:**
```typescript
@ccclass('MyComponent')
export default class MyComponent extends Component {
```

### 3. 类型引用更新

**2.4.x:**
```typescript
@property(cc.Node)
ndMain: cc.Node = null;
```

**3.8.x:**
```typescript
import { Node } from 'cc';

@property(Node)
ndMain: Node = null;
```

### 4. API 调用更新

**2.4.x:**
```typescript
const node = cc.instantiate(prefab);
cc.tween(this.node).to(1, { position: cc.v3(100, 100, 0) }).start();
```

**3.8.x:**
```typescript
import { instantiate, tween, v3 } from 'cc';

const node = instantiate(prefab);
tween(this.node).to(1, { position: v3(100, 100, 0) }).start();
```

### 5. 节点透明度处理

**2.4.x:**
```typescript
this.node.opacity = 255;
```

**3.8.x:**
```typescript
import { UIOpacity } from 'cc';

this.node.getComponent(UIOpacity).opacity = 255;
```

脚本会尝试自动替换，但建议手动检查。

### 6. module.exports 转换

**2.4.x:**
```typescript
module.exports = Cfg;
```

**3.8.x:**
```typescript
export default Cfg;
```

## ⚠️ 注意事项

### 需要手动检查的内容

1. **节点透明度 (opacity)**
   - 脚本会尝试自动替换 `node.opacity` 为 `node.getComponent(UIOpacity).opacity`
   - 但需要确保节点上已添加 `UIOpacity` 组件
   - 建议在 Cocos Creator 编辑器中检查相关节点

2. **@ccclass 参数**
   - 脚本会自动从类名提取并添加到 `@ccclass` 装饰器
   - 如果提取失败，需要手动添加

3. **导入语句**
   - 脚本会自动添加必要的导入
   - 但建议检查导入是否完整

4. **cc.js.getClassName**
   - 脚本会尝试替换为直接使用类名字符串
   - 需要手动验证替换是否正确

## 📊 升级流程

```
1. 备份项目（使用 Git 或手动备份）
   ↓
2. 运行预览模式 (--dry-run)
   ↓
3. 检查预览结果和警告
   ↓
4. 执行升级 (--backup)
   ↓
5. 检查修改的文件
   ↓
6. 在 Cocos Creator 中打开项目
   ↓
7. 检查节点上的 UIOpacity 组件
   ↓
8. 运行项目并测试
   ↓
9. 修复手动问题
   ↓
10. 完成升级
```

## 🔧 常见问题

### Q1: 升级后编译错误

**可能原因:**
- 导入语句不完整
- 类型引用错误
- 装饰器参数缺失

**解决方法:**
- 检查脚本输出的警告信息
- 手动添加缺失的导入
- 检查 `@ccclass` 装饰器是否正确

### Q2: 节点透明度不工作

**可能原因:**
- 节点上缺少 `UIOpacity` 组件

**解决方法:**
- 在 Cocos Creator 编辑器中为相关节点添加 `UIOpacity` 组件
- 或使用代码动态添加：
  ```typescript
  if (!node.getComponent(UIOpacity)) {
      node.addComponent(UIOpacity);
  }
  node.getComponent(UIOpacity).opacity = 255;
  ```

### Q3: 某些 API 没有被替换

**可能原因:**
- API 不在映射列表中
- 使用了特殊的调用方式

**解决方法:**
- 查看脚本输出的警告
- 手动查找并替换
- 参考 Cocos Creator 3.8 官方文档

## 📚 相关文档

- [Cocos Creator 3.8 升级指南](https://docs.cocos.com/creator/3.8/manual/zh/release-notes/upgrade-guide-v3.0.html)
- [Cocos Creator 3.8 API 文档](https://docs.cocos.com/creator/3.8/api/zh/)

## 💡 提示

- 首次运行建议使用 `--dry-run` 查看效果
- 使用 `--backup` 创建备份，方便回滚
- 升级后仔细检查脚本提示的警告信息
- 在 Cocos Creator 编辑器中验证节点组件配置
