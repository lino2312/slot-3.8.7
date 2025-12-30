# Cocos Creator 3.8 中 sp.Skeleton 使用指南

## 📋 导入方式

在 Cocos Creator 3.8 中，`sp.Skeleton` 需要从 `cc` 模块导入 `sp`：

```typescript
import { sp } from 'cc';
```

或者与其他模块一起导入：

```typescript
import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;
```

## 🎯 使用方式

### 1. 获取 Skeleton 组件

```typescript
// 方式 1: 从节点获取
let skeleton = this.node.getComponent(sp.Skeleton);

// 方式 2: 从指定节点获取
let skeleton = someNode.getComponent(sp.Skeleton);
```

### 2. 常用 API

```typescript
import { sp } from 'cc';

// 获取组件
let skeleton = this.node.getComponent(sp.Skeleton);

if (skeleton) {
    // 设置皮肤
    skeleton.setSkin('skin-name');
    
    // 播放动画
    skeleton.setAnimation(0, 'animation-name', false); // 第三个参数是是否循环
    
    // 设置时间缩放
    skeleton.timeScale = 1.0;
    
    // 暂停/恢复
    skeleton.paused = true;  // 暂停
    skeleton.paused = false; // 恢复
    
    // 清除所有轨道
    skeleton.clearTracks();
    
    // 设置完成回调
    skeleton.setCompleteListener(() => {
        console.log('动画播放完成');
        skeleton.setCompleteListener(null); // 清除回调
    });
    
    // 设置事件回调
    skeleton.setEventListener((entry, event) => {
        console.log('动画事件:', event.data.name);
    });
}
```

### 3. 完整示例

```typescript
import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MySpineComponent')
export class MySpineComponent extends Component {
    
    @property(Node)
    spineNode: Node = null;
    
    onLoad() {
        // 获取 Skeleton 组件
        let skeleton = this.spineNode.getComponent(sp.Skeleton);
        
        if (skeleton) {
            // 设置皮肤
            skeleton.setSkin('default');
            
            // 播放动画
            skeleton.setAnimation(0, 'idle', true); // 循环播放 idle 动画
            
            // 设置完成回调
            skeleton.setCompleteListener(() => {
                console.log('动画播放完成');
                skeleton.setCompleteListener(null);
            });
        }
    }
    
    playAnimation(animName: string, loop: boolean = false) {
        let skeleton = this.spineNode.getComponent(sp.Skeleton);
        if (skeleton) {
            skeleton.setAnimation(0, animName, loop);
        }
    }
    
    setSkin(skinName: string) {
        let skeleton = this.spineNode.getComponent(sp.Skeleton);
        if (skeleton) {
            skeleton.setSkin(skinName);
        }
    }
}
```

## 📝 与 2.4 版本的差异

### Cocos Creator 2.4.x

```typescript
// 2.4 版本
let skeleton = this.node.getComponent(cc.Skeleton);
skeleton.setAnimation(0, 'animation', false);
```

### Cocos Creator 3.8.x

```typescript
// 3.8 版本
import { sp } from 'cc';

let skeleton = this.node.getComponent(sp.Skeleton);
skeleton.setAnimation(0, 'animation', false);
```

## ⚠️ 注意事项

1. **导入位置**: `sp` 必须从 `cc` 模块导入，不能单独导入
2. **组件类型**: 使用 `sp.Skeleton` 而不是 `cc.Skeleton`
3. **资源类型**: Spine 资源类型为 `sp.SkeletonData`
4. **回调清理**: 使用完回调后记得设置为 `null`，避免内存泄漏

## 🔗 相关资源

- [Cocos Creator 3.8 Spine 文档](https://docs.cocos.com/creator/3.8/manual/zh/spine/)
- [sp.Skeleton API 文档](https://docs.cocos.com/creator/3.8/api/zh/classes/sp.Skeleton.html)
