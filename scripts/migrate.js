#!/usr/bin/env node

/**
 *  文件夹脚本从 2.4.13 升级到 3.8.7 的自动化脚本
 * 
 * 使用方法:
 *   node scripts/migrate.js [选项]
 * 
 * 选项:
 *   --dry-run         仅显示将要进行的更改，不实际修改文件
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

// 获取项目根目录（脚本在 scripts 目录下，所以需要向上一级）
const PROJECT_ROOT = path.resolve(__dirname, '..');
// 默认目标目录（当没有指定文件时使用）
const TARGET_DIR = path.join(PROJECT_ROOT, 'assets/scripts/game/slotgame');

// API 映射
const API_MAPPINGS = {
    // 基础类
    'cc.Node': 'Node',
    'cc.Component': 'Component',
    'cc.Label': 'Label',
    'cc.SpriteFrame': 'SpriteFrame',
    'cc.Prefab': 'Prefab',
    'cc.Vec2': 'Vec2',
    
    // 方法
    'cc.instantiate': 'instantiate',
    'cc.find': 'find',
    'cc.v2': 'v2',
    'cc.v3': 'v3',
    'cc.tween': 'tween',
    'cc.Tween': 'Tween',
    'cc.js.getClassName': 'js.getClassByName',
    
    // Spine 相关
    'cc.sp.Skeleton': 'sp.Skeleton',
    'cc.sp.SkeletonData': 'sp.SkeletonData',
    
    // 其他
    'cc._decorator': '_decorator',
};

    // 需要导入的模块
const REQUIRED_IMPORTS = new Set([
    'Node',
    'Component',
    'Label',
    'SpriteFrame',
    'Prefab',  // 用于类型注解
    'Vec2',    // 用于类型注解
    'Sprite',  // 用于 getComponent(Sprite) 和颜色设置
    'Color',   // 用于 new Color(...)
    'Vec3',    // 用于 new Vec3(...) 和 scale 设置
    'UITransform',  // 用于 convertToWorldSpaceAR 和 convertToNodeSpaceAR
    'instantiate',
    'find',
    'v2',      // 用于创建 Vec2 对象
    'v3',
    'tween',
    'js',
    '_decorator',
    'UIOpacity',
    'sp',  // Spine 动画支持
    'screen',  // 用于 screen.windowSize (替代 cc.winSize)
]);

// ==================== 工具函数 ====================

function getAllTsFiles(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath)) {
        return files;
    }
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...getAllTsFiles(fullPath));
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}


function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 处理对象字面量中的 before 和 after 部分，确保逗号格式正确
 * @param {string} before - scale 属性之前的内容
 * @param {string} after - scale 属性之后的内容
 * @returns {{beforePart: string, afterPart: string}} 处理后的 before 和 after 部分
 */
function formatObjectParts(before, after) {
    let beforePart = before.trim();
    let afterPart = after.trim();
    
    // 如果 before 不为空，确保以逗号结尾
    if (beforePart) {
        if (!beforePart.endsWith(',')) {
            beforePart = beforePart + ', ';
        } else {
            beforePart = beforePart + ' ';
        }
    }
    
    // 如果 after 不为空，确保以逗号开头
    if (afterPart) {
        if (!afterPart.startsWith(',')) {
            afterPart = ', ' + afterPart;
        } else {
            afterPart = ' ' + afterPart.substring(1).trim();
        }
    }
    
    return { beforePart, afterPart };
}

function getUsedImports(content) {
    const imports = new Set();
    
    // 检查使用的 API
    for (const [oldAPI, newAPI] of Object.entries(API_MAPPINGS)) {
        const regex = new RegExp(`\\b${escapeRegex(oldAPI)}\\b`, 'g');
        if (regex.test(content)) {
            imports.add(newAPI);
        }
    }
    
    // 检查装饰器
    if (content.includes('@ccclass') || content.includes('@property')) {
        imports.add('_decorator');
    }
    
    // 检查组件继承
    if (content.includes('extends Component') || content.includes('extends cc.Component')) {
        imports.add('Component');
    }
    
    // 检查节点类型
    if (content.includes('cc.Node') || content.includes(': Node') || content.includes('Node[]')) {
        imports.add('Node');
    }
    
    // 检查 Label (用于 getComponent(Label), getComponentInChildren(Label), : Label 等)
    if (content.includes('cc.Label') || content.includes('getComponent(Label)') || 
        content.includes('getComponent(cc.Label)') || content.includes('getComponentInChildren(Label)') ||
        content.includes('getComponentInChildren(cc.Label)') || content.includes(': Label') ||
        content.includes('Label[') || content.includes('Label)')) {
        imports.add('Label');
    }
    
    // 检查 SpriteFrame
    if (content.includes('cc.SpriteFrame') || content.includes('SpriteFrame[]')) {
        imports.add('SpriteFrame');
    }
    
    // 检查 Sprite（用于 getComponent(Sprite)）
    if (content.includes('cc.Sprite') || content.includes('getComponent(Sprite)') || content.includes('getComponent(cc.Sprite)')) {
        imports.add('Sprite');
    }
    
    // 检查 Color（用于 new Color(...)）
    if (content.includes('new Color(') || content.includes('new cc.Color(') || content.includes('Color(')) {
        imports.add('Color');
    }
    
    // 检查 Vec3（用于 new Vec3(...) 和 scale 设置）
    if (content.includes('new Vec3(') || content.includes('.scale = new Vec3(') || content.includes('scale: new Vec3(')) {
        imports.add('Vec3');
    }
    
    // 检查 instantiate
    if (content.includes('cc.instantiate') || content.includes('instantiate(')) {
        imports.add('instantiate');
    }
    
    // 检查 v2 (用于创建 Vec2 对象)
    if (content.includes('cc.v2') || content.includes('v2(')) {
        imports.add('v2');
    }
    
    // 检查 v3
    if (content.includes('cc.v3') || content.includes('v3(')) {
        imports.add('v3');
    }
    
    // 检查 Vec2 (用于类型注解)
    if (content.includes('cc.Vec2') || content.includes(': Vec2') || content.includes('Vec2)')) {
        imports.add('Vec2');
    }
    
    // 检查 tween
    if (content.includes('cc.tween') || content.includes('tween(')) {
        imports.add('tween');
    }
    
    // 检查 Tween（用于 Tween.stopAllByTarget 等静态方法）
    if (content.includes('Tween.') || content.includes('cc.Tween') || content.includes('Tween.stopAllByTarget')) {
        imports.add('Tween');
    }
    
    // 检查 js
    if (content.includes('cc.js') || content.includes('js.getClassByName')) {
        imports.add('js');
    }
    
    // 检查 opacity (需要 UIOpacity)
    if (content.includes('.opacity')) {
        imports.add('UIOpacity');
    }
    
    // 检查 convertToWorldSpaceAR 或 convertToNodeSpaceAR (需要 UITransform)
    if (content.includes('convertToWorldSpaceAR') || content.includes('convertToNodeSpaceAR')) {
        imports.add('UITransform');
    }
    
    // 检查 cc.winSize 或 screen.windowSize (需要 screen)
    if (content.includes('cc.winSize') || content.includes('screen.windowSize')) {
        imports.add('screen');
    }
    
    // 检查 getContentSize() 或 contentSize (需要 UITransform)
    if (content.includes('.getContentSize()') || content.includes('.contentSize') || 
        content.includes('getComponent(UITransform).contentSize')) {
        imports.add('UITransform');
    }
    
    // 检查 .height 或 .width 直接访问 (需要 UITransform)
    // 匹配 node.height 或 node.width 模式（排除已经使用 getComponent(UITransform) 的情况）
    if (content.includes('.height') || content.includes('.width')) {
        // 检查是否有直接的节点属性访问（如 node.height, this.node.parent.height）
        // 排除已经通过 getComponent(UITransform) 访问的情况
        if (!content.includes('getComponent(UITransform).contentSize.height') && 
            !content.includes('getComponent(UITransform).contentSize.width')) {
            // 使用正则匹配节点表达式后跟 .height 或 .width
            const heightWidthPattern = /[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*\.(height|width)\b/g;
            if (heightWidthPattern.test(content)) {
                imports.add('UITransform');
            }
        }
    }
    
    // 检查 Vec3 (用于 scale, position 等)
    if (content.includes('new Vec3') || content.includes('Vec3(') || content.includes(': Vec3') || 
        content.includes('Vec3.') || content.includes('getComponent(Vec3)')) {
        imports.add('Vec3');
    }
    
    // 检查 Sprite (用于 getComponent(Sprite), : Sprite 等)
    if (content.includes('getComponent(Sprite)') || content.includes('getComponent(cc.Sprite)') || 
        content.includes(': Sprite') || content.includes('new Sprite') || content.includes('Sprite.')) {
        imports.add('Sprite');
    }
    
    // 检查 SpriteFrame (用于类型注解和属性)
    if (content.includes(': SpriteFrame') || content.includes('SpriteFrame[]') || 
        content.includes('SpriteFrame[') || content.includes('getComponent(SpriteFrame)')) {
        imports.add('SpriteFrame');
    }
    
    // 检查 Color (用于 new Color(...))
    if (content.includes('new Color') || content.includes('Color(') || content.includes(': Color') || 
        content.includes('Color.') || content.includes('getComponent(Color)')) {
        imports.add('Color');
    }
    
    // 检查 Prefab (用于类型注解)
    if (content.includes('cc.Prefab') || content.includes(': Prefab') || content.includes('Prefab)')) {
        imports.add('Prefab');
    }
    
    // 检查 sp.Skeleton (Spine 动画)
    if (content.includes('sp.Skeleton') || content.includes('getComponent(sp.Skeleton)') || 
        content.includes('getComponent(cc.sp.Skeleton)') || content.includes('sp.SkeletonData')) {
        imports.add('sp');
    }
    
    return imports;
}

function findFileCaseInsensitive(dir, fileName) {
    if (!fs.existsSync(dir)) return null;
    
    const items = fs.readdirSync(dir);
    const lowerFileName = fileName.toLowerCase().replace(/_/g, '');
    
    for (const item of items) {
        const lowerItem = item.toLowerCase().replace(/_/g, '');
        if (lowerItem === lowerFileName) {
            return path.join(dir, item);
        }
    }
    return null;
}

function normalizePathPart(part) {
    // 将 Ts_frame_common 转换为 tsFrameCommon 等
    return part.toLowerCase().replace(/_/g, '');
}

function findFileInAssets(fileName, projectRoot) {
    if (!projectRoot) {
        projectRoot = PROJECT_ROOT;
    }
    const assetsDir = path.join(projectRoot, 'assets');
    if (!fs.existsSync(assetsDir)) return null;
    
    // 标准化文件名（去掉扩展名，统一大小写和下划线）
    const normalizeName = (name) => {
        return name.toLowerCase().replace(/[_-]/g, '').replace(/\.(ts|js)$/, '');
    };
    
    const targetNormalized = normalizeName(fileName);
    
    function searchRecursive(dir, targetNormalized) {
        if (!fs.existsSync(dir)) return null;
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                
                // 跳过 node_modules 和 .git 等目录
                if (item.startsWith('.') && item !== '.') {
                    continue;
                }
                
                try {
                    const stat = fs.statSync(itemPath);
                    const itemNormalized = normalizeName(item);
                    
                    // 检查文件名是否匹配（忽略大小写、下划线和扩展名）
                    if (stat.isFile() && itemNormalized === targetNormalized && (item.endsWith('.ts') || item.endsWith('.js'))) {
                        return itemPath;
                    } else if (stat.isDirectory() && !item.startsWith('.')) {
                        const found = searchRecursive(itemPath, targetNormalized);
                        if (found) return found;
                    }
                } catch (e) {
                    // 忽略单个文件的错误，继续搜索
                    continue;
                }
            }
        } catch (e) {
            // 忽略目录读取错误
        }
        return null;
    }
    
    return searchRecursive(assetsDir, targetNormalized);
}

function resolveImportPath(importPath, currentFile) {
    // 跳过系统模块和 node_modules
    if (importPath === 'cc' || !importPath.startsWith('.')) {
        return { exists: true, original: importPath, isSystem: true };
    }
    
    // 处理相对路径导入
    const currentDir = path.dirname(currentFile);
    const projectRoot = PROJECT_ROOT;
    
    // 解析相对路径
    let resolvedPath;
    try {
        resolvedPath = path.resolve(currentDir, importPath);
    } catch (e) {
        return { exists: false, original: importPath, error: e.message };
    }
    
    // 检查文件是否存在（精确匹配）
    const possibleExtensions = ['.ts', '.js', ''];
    for (const ext of possibleExtensions) {
        const testPath = resolvedPath + ext;
        if (fs.existsSync(testPath)) {
            const relativePath = path.relative(projectRoot, testPath);
            if (relativePath.startsWith('assets')) {
                const dbPath = 'db://' + relativePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '');
                return { exists: true, dbPath: dbPath, original: importPath };
            }
            return { exists: true, original: importPath };
        }
    }
    
    // 如果精确匹配失败，尝试在 assets 目录下搜索文件名（处理大小写和下划线差异）
    const pathParts = importPath.split('/').filter(p => p && p !== '.');
    const fileName = pathParts[pathParts.length - 1]; // 获取文件名部分
    
    if (fileName) {
        // 先尝试精确搜索文件名
        let foundFile = findFileInAssets(fileName, projectRoot);
        
        // 如果没找到，尝试去掉扩展名再搜索
        if (!foundFile && fileName.includes('.')) {
            const nameWithoutExt = fileName.replace(/\.(ts|js)$/, '');
            foundFile = findFileInAssets(nameWithoutExt, projectRoot);
        }
        
        if (foundFile) {
            const relativePath = path.relative(projectRoot, foundFile);
            if (relativePath.startsWith('assets')) {
                const dbPath = 'db://' + relativePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '');
                return { exists: true, dbPath: dbPath, original: importPath };
            }
        }
    }
    
    return { exists: false, original: importPath };
}

function detectUsedClasses(content) {
    // 检测代码中使用的类名（通过 extends, getComponent, new 等）
    const usedClasses = new Set();
    
    // 检测 extends 语句
    const extendsMatch = content.match(/extends\s+(\w+)/);
    if (extendsMatch) {
        usedClasses.add(extendsMatch[1]);
    }
    
    // 检测 getComponent 调用
    const getComponentMatches = content.matchAll(/getComponent\((\w+)\)/g);
    for (const match of getComponentMatches) {
        usedClasses.add(match[1]);
    }
    
    // 检测 getComponentInChildren 调用
    const getComponentInChildrenMatches = content.matchAll(/getComponentInChildren\((\w+)\)/g);
    for (const match of getComponentInChildrenMatches) {
        usedClasses.add(match[1]);
    }
    
    // 检测直接使用的类名（如 Utils.xxx, SlotGameData.xxx, Tween.stopAllByTarget）
    const classUsageMatches = content.matchAll(/\b([A-Z][a-zA-Z0-9]+)\./g);
    for (const match of classUsageMatches) {
        const className = match[1];
        // 排除已知的系统类
        if (!['Node', 'Component', 'Label', 'Sprite', 'Button', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON', 'Promise', 'Error', 'RegExp', 'Map', 'Set', 'UIOpacity', 'UITransform', 'console', 'window', 'document', 'globalThis'].includes(className)) {
            usedClasses.add(className);
        }
    }
    
    // 特别检测 Tween 的使用（如 Tween.stopAllByTarget）
    if (content.includes('Tween.') || content.includes('Tween.stopAllByTarget') || content.includes('Tween.stopAll')) {
        usedClasses.add('Tween');
    }
    
    // 特别检测 Label 的使用（如 getComponent(Label), getComponentInChildren(Label), : Label）
    if (content.includes('getComponent(Label)') || content.includes('getComponentInChildren(Label)') ||
        content.includes(': Label') || content.includes('Label[') || content.includes('Label)')) {
        usedClasses.add('Label');
    }
    
    // 特别检测 Vec2 的使用
    if (content.includes('cc.Vec2') || content.includes(': Vec2') || content.includes('Vec2)')) {
        usedClasses.add('Vec2');
    }
    
    // 特别检测 Vec3 的使用
    if (content.includes('new Vec3') || content.includes(': Vec3') || content.includes('Vec3)')) {
        usedClasses.add('Vec3');
    }
    
    // 特别检测 v2 的使用
    if (content.includes('cc.v2') || content.includes('v2(')) {
        usedClasses.add('v2');
    }
    
    // 检测类型注解中的类（如 : SlotGameData, : Utils, : SlotSpinMsgData）
    // 匹配模式：: ClassName, : ClassName =, : ClassName[], : ClassName | OtherType 等
    const typeMatches = content.matchAll(/:\s*(\w+)(?:\s*[=\[\|\&]|\s*[,;\)\]\}]|$)/g);
    for (const match of typeMatches) {
        const className = match[1];
        if (className && className[0] === className[0].toUpperCase() && 
            !['Node', 'Component', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Function', 'Promise', 'Any', 'Void', 'Null', 'Undefined'].includes(className)) {
            usedClasses.add(className);
        }
    }
    
    // 检测静态属性类型注解（如 static curRollServerData: SlotSpinMsgData）
    const staticTypeMatches = content.matchAll(/(?:static|public|private|protected)\s+\w+\s*:\s*(\w+)/g);
    for (const match of staticTypeMatches) {
        const className = match[1];
        if (className && className[0] === className[0].toUpperCase() && 
            !['Node', 'Component', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Function', 'Promise', 'Any', 'Void', 'Null', 'Undefined'].includes(className)) {
            usedClasses.add(className);
        }
    }
    
    // 检测函数参数类型注解（如 function(param: SlotSpinMsgData)）
    const paramTypeMatches = content.matchAll(/(?:\(|,)\s*\w+\s*:\s*(\w+)/g);
    for (const match of paramTypeMatches) {
        const className = match[1];
        if (className && className[0] === className[0].toUpperCase() && 
            !['Node', 'Component', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Function', 'Promise', 'Any', 'Void', 'Null', 'Undefined'].includes(className)) {
            usedClasses.add(className);
        }
    }
    
    // 检测 import 语句中引用的类（可能被删除但仍在代码中使用）
    const importMatches = content.matchAll(/import\s+(?:(\w+)|(?:\{([^}]+)\}))\s+from/g);
    for (const match of importMatches) {
        if (match[1]) {
            usedClasses.add(match[1]);
        } else if (match[2]) {
            const names = match[2].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
            names.forEach(name => {
                if (name) usedClasses.add(name);
            });
        }
    }
    
    return Array.from(usedClasses);
}

function checkExportType(filePath) {
    // 检查文件的导出方式：'default' | 'named' | 'both' | 'none'
    if (!fs.existsSync(filePath)) return { type: 'none', exports: [] };
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = [];
        
        // 检查默认导出
        const defaultMatch = content.match(/export\s+default\s+(?:class|function|const|let|var|interface|enum)\s+(\w+)/);
        const hasDefault = defaultMatch !== null;
        if (hasDefault && defaultMatch[1]) {
            exports.push({ name: defaultMatch[1], type: 'default' });
        }
        
        // 检查命名导出（排除 export default）
        // 匹配 export class/function/const/let/var/interface/enum/type ClassName
        const namedClassMatches = content.matchAll(/export\s+(?!default\s)(?:class|function|const|let|var|interface|enum|type)\s+(\w+)/g);
        for (const match of namedClassMatches) {
            if (match[1] && !exports.find(e => e.name === match[1])) {
                exports.push({ name: match[1], type: 'named' });
            }
        }
        
        // 检查 export { ... } 语法
        const namedExportMatches = content.matchAll(/export\s+\{([^}]+)\}/g);
        for (const match of namedExportMatches) {
            const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
            names.forEach(name => {
                if (name && !exports.find(e => e.name === name)) {
                    exports.push({ name, type: 'named' });
                }
            });
        }
        
        const hasDefaultExport = exports.some(e => e.type === 'default');
        const hasNamedExport = exports.some(e => e.type === 'named');
        
        let exportType = 'none';
        if (hasDefaultExport && hasNamedExport) exportType = 'both';
        else if (hasDefaultExport) exportType = 'default';
        else if (hasNamedExport) exportType = 'named';
        
        return { type: exportType, exports };
    } catch (e) {
        return { type: 'none', exports: [] };
    }
}

function findClassFile(className, projectRoot) {
    // 尝试查找类文件
    const possibleNames = [
        className,
        className + 'Component',
        className.replace(/Component$/, ''),
        // 特殊映射
        className === 'SlotGameData' ? 'SlotsGameData' : null,
        className === 'Utils' ? 'MyUtils' : null,
        className === 'SlotGameMsgMgr' ? 'SlotsGameMsgMgr' : null,
    ].filter(Boolean);
    
    for (const name of possibleNames) {
        const found = findFileInAssets(name, projectRoot);
        if (found) {
            return found;
        }
    }
    return null;
}

function cleanAndFixImports(content, filePath) {
    const lines = content.split('\n');
    const validImports = [];
    const removedImports = [];
    const fixedImports = [];
    const addedImports = [];
    let hasChanges = false;
    const existingImports = new Map(); // 存储已存在的导入
    
    // 第一遍：处理现有导入
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // 匹配 import 语句（支持多行导入）
        const importMatch = trimmedLine.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/);
        if (importMatch) {
            const importPath = importMatch[2];
            const importSpec = importMatch[1];
            
            // 跳过 'cc' 模块导入（这些是系统模块）
            if (importPath === 'cc') {
                validImports.push(line);
                continue;
            }
            
            // 解析导入路径
            const resolved = resolveImportPath(importPath, filePath);
            
            if (!resolved.exists && !resolved.isSystem) {
                // 导入路径不存在，尝试通过文件名搜索
                const pathParts = importPath.split('/').filter(p => p && p !== '.');
                const fileName = pathParts[pathParts.length - 1];
                
                if (fileName) {
                    const foundFile = findFileInAssets(fileName, PROJECT_ROOT);
                    if (foundFile) {
                        const relativePath = path.relative(PROJECT_ROOT, foundFile);
                        if (relativePath.startsWith('assets')) {
                            const dbPath = 'db://' + relativePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '');
                            const newImport = line.replace(importPath, dbPath);
                            fixedImports.push({ 
                                line: i + 1, 
                                old: trimmedLine, 
                                new: newImport.trim() 
                            });
                            validImports.push(newImport);
                            hasChanges = true;
                            continue;
                        }
                    }
                }
                
                // 如果还是找不到，删除这行
                removedImports.push({ 
                    line: i + 1, 
                    import: trimmedLine, 
                    reason: resolved.error || '文件不存在' 
                });
                hasChanges = true;
                continue;
            }
            
            // 如果可以使用 db:// 路径且路径在 assets 目录下
            if (resolved.dbPath && !importPath.startsWith('db://')) {
                let newImport = line.replace(importPath, resolved.dbPath);
                fixedImports.push({ 
                    line: i + 1, 
                    old: trimmedLine, 
                    new: newImport.trim() 
                });
                validImports.push(newImport);
                hasChanges = true;
            } else {
                // 即使路径已经是 db://，也要检查导入语法是否正确
                if (importPath.startsWith('db://')) {
                    // 将 db://assets/... 转换为实际文件路径
                    let filePath = importPath.replace('db://', '');
                    if (!path.isAbsolute(filePath)) {
                        filePath = path.join(PROJECT_ROOT, filePath);
                    }
                    // 尝试添加 .ts 扩展名
                    if (!fs.existsSync(filePath)) {
                        filePath = filePath + '.ts';
                    }
                    const exportInfo = checkExportType(filePath);
                    let needsFix = false;
                    let newImport = line;
                    
                    // 提取导入的类名
                    let importedClasses = [];
                    if (importSpec.includes('{')) {
                        // 命名导入
                        const match = importSpec.match(/\{([^}]+)\}/);
                        if (match) {
                            const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
                            importedClasses = names.map(name => ({ name, isNamed: true }));
                        }
                    } else {
                        // 默认导入
                        const name = importSpec.trim().split(/\s+as\s+/)[0].trim();
                        if (name) {
                            importedClasses = [{ name, isNamed: false }];
                        }
                    }
                    
                    const fixedClasses = [];
                    for (const imported of importedClasses) {
                        // 检查这个类在文件中的导出类型（精确匹配或大小写不敏感匹配）
                        let classExport = exportInfo.exports.find(e => e.name === imported.name);
                        
                        // 如果精确匹配失败，尝试大小写不敏感匹配
                        if (!classExport) {
                            classExport = exportInfo.exports.find(e => 
                                e.name.toLowerCase() === imported.name.toLowerCase() ||
                                e.name.toLowerCase().replace(/[_-]/g, '') === imported.name.toLowerCase().replace(/[_-]/g, '')
                            );
                        }
                        
                        if (classExport) {
                            // 如果导入语法不匹配，需要修复
                            if (classExport.type === 'named' && !imported.isNamed) {
                                fixedClasses.push({ name: classExport.name, type: 'named' });
                                needsFix = true;
                            } else if (classExport.type === 'default' && imported.isNamed) {
                                fixedClasses.push({ name: classExport.name, type: 'default' });
                                needsFix = true;
                            } else {
                                // 语法正确，但可能需要更新类名（如果大小写不同）
                                if (classExport.name !== imported.name) {
                                    fixedClasses.push({ name: classExport.name, type: classExport.type });
                                    needsFix = true;
                                } else {
                                    fixedClasses.push({ name: classExport.name, type: classExport.type });
                                }
                            }
                        } else {
                            // 没有找到匹配的导出，保持原样（可能是接口、类型等）
                            fixedClasses.push(imported);
                        }
                    }
                    
                    if (needsFix && fixedClasses.length > 0) {
                        const defaultExports = fixedClasses.filter(c => c.type === 'default');
                        const namedExports = fixedClasses.filter(c => c.type === 'named');
                        
                        if (defaultExports.length > 0 && namedExports.length > 0) {
                            // 混合导出，需要分开
                            const importLines = [];
                            defaultExports.forEach(exp => {
                                importLines.push(`import ${exp.name} from "${importPath}";`);
                            });
                            if (namedExports.length === 1) {
                                importLines.push(`import { ${namedExports[0].name} } from "${importPath}";`);
                            } else {
                                const names = namedExports.map(e => e.name).join(', ');
                                importLines.push(`import { ${names} } from "${importPath}";`);
                            }
                            fixedImports.push({ 
                                line: i + 1, 
                                old: trimmedLine, 
                                new: importLines.join('\n'),
                                reason: '修复导入语法（混合导出）'
                            });
                            importLines.forEach(imp => validImports.push(imp));
                        } else if (defaultExports.length > 0) {
                            newImport = `import ${defaultExports[0].name} from "${importPath}";`;
                            fixedImports.push({ 
                                line: i + 1, 
                                old: trimmedLine, 
                                new: newImport.trim(),
                                reason: `修复为默认导入 (${defaultExports[0].name} 是默认导出)`
                            });
                            validImports.push(newImport);
                        } else if (namedExports.length > 0) {
                            if (namedExports.length === 1) {
                                newImport = `import { ${namedExports[0].name} } from "${importPath}";`;
                            } else {
                                const names = namedExports.map(e => e.name).join(', ');
                                newImport = `import { ${names} } from "${importPath}";`;
                            }
                            fixedImports.push({ 
                                line: i + 1, 
                                old: trimmedLine, 
                                new: newImport.trim(),
                                reason: `修复为命名导入 (${namedExports.map(e => e.name).join(', ')} 是命名导出)`
                            });
                            validImports.push(newImport);
                        } else {
                            validImports.push(line);
                        }
                        hasChanges = true;
                    } else {
                        validImports.push(line);
                    }
                } else {
                    validImports.push(line);
                }
            }
            
            // 记录已存在的导入
            const importedNames = importSpec.split(',').map(s => s.trim().replace(/\s+as\s+\w+/, '').replace(/^\w+\s+/, '').replace(/^\{|\}$/g, ''));
            importedNames.forEach(name => {
                if (name) existingImports.set(name, resolved.dbPath || importPath);
            });
        } else {
            // 非 import 语句，保留原样
            validImports.push(line);
        }
    }
    
    // 第二遍：检测代码中使用的类，添加缺失的导入
    // 使用原始内容检测，而不是已经处理过的导入
    const usedClasses = detectUsedClasses(content);
    
    // 构建已导入模块的映射（模块路径 -> 导入的变量名）
    const importedModules = new Map(); // path -> { defaultName, namedNames: Set }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/);
        if (importMatch) {
            const importPath = importMatch[2];
            const importSpec = importMatch[1];
            
            if (importPath !== 'cc' && (importPath.startsWith('db://') || importPath.startsWith('.'))) {
                const resolvedPath = importPath.startsWith('db://') 
                    ? path.join(PROJECT_ROOT, importPath.replace('db://', '')) + '.ts'
                    : resolveImportPath(importPath, filePath);
                
                const actualPath = importPath.startsWith('db://')
                    ? resolvedPath
                    : (resolvedPath.exists && resolvedPath.dbPath 
                        ? path.join(PROJECT_ROOT, resolvedPath.dbPath.replace('db://', '')) + '.ts'
                        : null);
                
                if (actualPath && fs.existsSync(actualPath)) {
                    if (!importedModules.has(importPath)) {
                        importedModules.set(importPath, { defaultName: null, namedNames: new Set(), filePath: actualPath });
                    }
                    const moduleInfo = importedModules.get(importPath);
                    
                    if (importSpec.includes('{')) {
                        // 命名导入
                        const match = importSpec.match(/\{([^}]+)\}/);
                        if (match) {
                            const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
                            names.forEach(name => {
                                if (name) moduleInfo.namedNames.add(name);
                            });
                        }
                    } else {
                        // 默认导入
                        const name = importSpec.trim().split(/\s+as\s+/)[0].trim();
                        if (name) moduleInfo.defaultName = name;
                    }
                }
            }
        }
    }
    
    // 按路径分组，处理同一文件的多个导出
    const importsByPath = new Map();
    const importsToAddToExisting = new Map(); // path -> Set of classNames to add
    
    for (const className of usedClasses) {
        if (!existingImports.has(className) && className !== 'cc') {
            // 首先检查是否在已导入的模块中
            let foundInExistingImport = false;
            for (const [importPath, moduleInfo] of importedModules) {
                const exportInfo = checkExportType(moduleInfo.filePath);
                const classExport = exportInfo.exports.find(e => e.name === className);
                
                if (classExport && classExport.type === 'named') {
                    // 找到！这个类型在已导入的模块中，需要添加到命名导入
                    if (!importsToAddToExisting.has(importPath)) {
                        importsToAddToExisting.set(importPath, new Set());
                    }
                    importsToAddToExisting.get(importPath).add(className);
                    foundInExistingImport = true;
                    break;
                }
            }
            
            if (foundInExistingImport) {
                continue; // 已经在已导入模块中找到，跳过后续搜索
            }
            
            // 如果不在已导入模块中，尝试在整个项目中搜索
            const foundFile = findClassFile(className, PROJECT_ROOT);
            if (foundFile) {
                const relativePath = path.relative(PROJECT_ROOT, foundFile);
                if (relativePath.startsWith('assets')) {
                    const dbPath = 'db://' + relativePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '');
                    
                    // 检查导出类型
                    const exportInfo = checkExportType(foundFile);
                    
                    // 检查这个类是否真的在这个文件中导出
                    const classExport = exportInfo.exports.find(e => e.name === className);
                    if (!classExport && exportInfo.type !== 'none') {
                        // 类名不匹配，尝试查找类似的导出
                        const similarExport = exportInfo.exports.find(e => 
                            e.name.toLowerCase() === className.toLowerCase() ||
                            e.name.toLowerCase().replace(/[_-]/g, '') === className.toLowerCase().replace(/[_-]/g, '')
                        );
                        if (similarExport) {
                            // 使用找到的导出名称
                            const actualClassName = similarExport.name;
                            if (!importsByPath.has(dbPath)) {
                                importsByPath.set(dbPath, { classes: [], exportInfo, filePath: foundFile });
                            }
                            const pathInfo = importsByPath.get(dbPath);
                            if (!pathInfo.classes.find(c => c.name === actualClassName)) {
                                pathInfo.classes.push({ name: actualClassName, type: similarExport.type });
                            }
                        }
                    } else if (classExport) {
                        // 检查是否已经有这个路径的导入
                        if (!importsByPath.has(dbPath)) {
                            importsByPath.set(dbPath, { classes: [], exportInfo, filePath: foundFile });
                        }
                        const pathInfo = importsByPath.get(dbPath);
                        if (!pathInfo.classes.find(c => c.name === className)) {
                            pathInfo.classes.push({ name: className, type: classExport.type });
                        }
                    } else if (exportInfo.type === 'default') {
                        // 默认导出，使用类名
                        if (!importsByPath.has(dbPath)) {
                            importsByPath.set(dbPath, { classes: [], exportInfo, filePath: foundFile });
                        }
                        const pathInfo = importsByPath.get(dbPath);
                        if (!pathInfo.classes.find(c => c.name === className)) {
                            pathInfo.classes.push({ name: className, type: 'default' });
                        }
                    }
                }
            }
        }
    }
    
    // 更新已存在的导入，添加缺失的命名导出
    for (let i = 0; i < validImports.length; i++) {
        const line = validImports[i];
        const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/);
        if (importMatch) {
            const importPath = importMatch[2];
            const importSpec = importMatch[1];
            
            if (importsToAddToExisting.has(importPath)) {
                const classesToAdd = importsToAddToExisting.get(importPath);
                const newNames = Array.from(classesToAdd);
                
                if (newNames.length > 0) {
                    let newImportSpec = importSpec;
                    
                    if (importSpec.includes('{')) {
                        // 已有命名导入，添加新的
                        const match = importSpec.match(/\{([^}]+)\}/);
                        if (match) {
                            const existingNames = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
                            const allNames = [...new Set([...existingNames, ...newNames])].sort();
                            if (importSpec.includes(',')) {
                                // 混合导入（默认 + 命名）
                                const defaultPart = importSpec.replace(/\s*,\s*\{[^}]+\}/, '').trim();
                                newImportSpec = `${defaultPart}, { ${allNames.join(', ')} }`;
                            } else {
                                newImportSpec = `{ ${allNames.join(', ')} }`;
                            }
                        }
                    } else {
                        // 只有默认导入，添加命名导入
                        const defaultName = importSpec.trim().split(/\s+as\s+/)[0].trim();
                        newImportSpec = `${defaultName}, { ${newNames.join(', ')} }`;
                    }
                    
                    const newImport = `import ${newImportSpec} from "${importPath}";`;
                    validImports[i] = newImport;
                    hasChanges = true;
                    
                    newNames.forEach(className => {
                        addedImports.push({ className, path: importPath, exportType: 'named', reason: '添加到已存在的导入' });
                    });
                }
            }
        }
    }
    
    // 生成导入语句
    for (const [dbPath, pathInfo] of importsByPath) {
        const { classes, exportInfo } = pathInfo;
        
        // 检查是否已经有这个路径的导入
        const hasPathImport = Array.from(existingImports.values()).some(p => p === dbPath);
        if (!hasPathImport && classes.length > 0) {
            // 按导出类型分组
            const defaultExports = classes.filter(c => c.type === 'default');
            const namedExports = classes.filter(c => c.type === 'named');
            
            // 生成导入语句
            const importLines = [];
            
            // 默认导出
            if (defaultExports.length > 0) {
                defaultExports.forEach(exp => {
                    importLines.push(`import ${exp.name} from "${dbPath}";`);
                    addedImports.push({ className: exp.name, path: dbPath, exportType: 'default' });
                });
            }
            
            // 命名导出
            if (namedExports.length > 0) {
                if (namedExports.length === 1) {
                    importLines.push(`import { ${namedExports[0].name} } from "${dbPath}";`);
                    addedImports.push({ className: namedExports[0].name, path: dbPath, exportType: 'named' });
                } else {
                    const names = namedExports.map(e => e.name).join(', ');
                    importLines.push(`import { ${names} } from "${dbPath}";`);
                    namedExports.forEach(exp => {
                        addedImports.push({ className: exp.name, path: dbPath, exportType: 'named' });
                    });
                }
            }
            
            // 在第一个非 import 行之前插入
            const firstNonImportIndex = validImports.findIndex((line, idx) => {
                return !line.trim().startsWith('import') && !line.trim().startsWith('//') && line.trim() !== '';
            });
            if (firstNonImportIndex > 0) {
                importLines.reverse().forEach(importLine => {
                    validImports.splice(firstNonImportIndex, 0, importLine);
                });
            } else {
                importLines.forEach(importLine => {
                    validImports.push(importLine);
                });
            }
            
            hasChanges = true;
        }
    }
    
    return {
        content: validImports.join('\n'),
        removed: removedImports,
        fixed: fixedImports,
        added: addedImports,
        hasChanges: hasChanges
    };
}

function migrateFile(filePath, dryRun = false) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    const warnings = [];
    
    // 1. 更新装饰器导入
    if (content.includes('cc._decorator')) {
        newContent = newContent.replace(/const\s*{\s*ccclass\s*,\s*property\s*}\s*=\s*cc\._decorator;?/g, 
            "import { _decorator } from 'cc';\nconst { ccclass, property } = _decorator;");
        modified = true;
    }
    
    // 2. 更新 @ccclass 装饰器（添加类名参数）
    if (content.includes('@ccclass') && !content.includes("@ccclass('")) {
        // 尝试从类定义中提取类名
        const classMatch = content.match(/export\s+(?:default\s+)?class\s+(\w+)/);
        if (classMatch) {
            const className = classMatch[1];
            newContent = newContent.replace(/@ccclass\s*\n/g, `@ccclass('${className}')\n`);
            modified = true;
        } else {
            warnings.push('无法自动添加 @ccclass 参数，需要手动检查');
        }
    }
    
    // 3. 更新 API 调用
    for (const [oldAPI, newAPI] of Object.entries(API_MAPPINGS)) {
        if (oldAPI === 'cc._decorator') continue; // 已经处理过了
        
        const regex = new RegExp(`\\b${escapeRegex(oldAPI)}\\b`, 'g');
        if (regex.test(newContent)) {
            newContent = newContent.replace(regex, newAPI);
            modified = true;
        }
    }
    
    // 3.1. 特殊处理：cc.winSize -> screen.windowSize
    // screen.windowSize 是 Size 对象，可以直接访问 .width 和 .height，不需要 getComponent
    if (newContent.includes('cc.winSize')) {
        // 先处理错误的模式：cc.winSize.getComponent(UITransform).contentSize.height -> screen.windowSize.height
        // 匹配 cc.winSize.getComponent(UITransform).contentSize.height 或 .width
        newContent = newContent.replace(
            /\bcc\.winSize\.getComponent\s*\(\s*UITransform\s*\)\.contentSize\.(height|width)\b/g,
            'screen.windowSize.$1'
        );
        
        // 再处理正常的模式：cc.winSize.height -> screen.windowSize.height
        // 匹配 cc.winSize.height 或 cc.winSize.width
        newContent = newContent.replace(
            /\bcc\.winSize\.(height|width)\b/g,
            'screen.windowSize.$1'
        );
        
        // 最后处理单独的 cc.winSize（作为变量或参数使用）
        // 但要避免替换已经处理过的部分
        newContent = newContent.replace(/\bcc\.winSize\b/g, 'screen.windowSize');
        
        modified = true;
        warnings.push('✅ 已将 cc.winSize 替换为 screen.windowSize（screen.windowSize 可直接访问 .width 和 .height）');
    }
    
    // 3.2. 清理已存在的错误用法：screen.windowSize.getComponent(...).contentSize.height -> screen.windowSize.height
    // 修复之前可能错误生成的代码
    if (newContent.includes('screen.windowSize.getComponent')) {
        const beforeFix = newContent;
        // 匹配 screen.windowSize.getComponent(UITransform).contentSize.height 或 .width
        newContent = newContent.replace(
            /\bscreen\.windowSize\.getComponent\s*\(\s*UITransform\s*\)\.contentSize\.(height|width)\b/g,
            'screen.windowSize.$1'
        );
        if (beforeFix !== newContent) {
            modified = true;
            warnings.push('✅ 已修复错误的 screen.windowSize.getComponent(...) 用法，改为直接访问 .height/.width');
        }
    }
    
    // 4. 添加必要的导入
    const usedImports = getUsedImports(newContent);
    const existingImports = newContent.match(/^import\s+.*from\s+['"]cc['"];?/m);
    
    if (usedImports.size > 0) {
        if (existingImports) {
            // 更新现有导入
            const importLine = existingImports[0];
            const importMatch = importLine.match(/import\s+{\s*([^}]+)\s*}\s*from\s+['"]cc['"]/);
            
            if (importMatch) {
                const existingImportsList = importMatch[1].split(',').map(i => i.trim());
                const allImports = [...new Set([...existingImportsList, ...Array.from(usedImports)])].sort();
                const newImportLine = `import { ${allImports.join(', ')} } from 'cc';`;
                newContent = newContent.replace(importLine, newImportLine);
                modified = true;
            }
        } else {
            // 添加新导入（在文件开头，装饰器导入之后）
            const importsArray = Array.from(usedImports).sort();
            const importLine = `import { ${importsArray.join(', ')} } from 'cc';`;
            
            // 查找第一个 import 语句的位置
            const firstImportMatch = newContent.match(/^import\s+/m);
            if (firstImportMatch) {
                // 在第一个 import 之前插入
                const insertPos = firstImportMatch.index;
                newContent = newContent.substring(0, insertPos) + importLine + '\n' + newContent.substring(insertPos);
            } else {
                // 如果没有 import，在文件开头添加
                newContent = importLine + '\n' + newContent;
            }
            modified = true;
        }
    }
    
    // 5. 处理 node.opacity（需要特殊处理）
    // 在 3.8 中，node.opacity 需要使用 UIOpacity 组件
    if (newContent.includes('.opacity')) {
        // 5.1. 修复 tween(node).to(..., {opacity: ...}) 模式
        // 将 tween(node).to(..., {opacity: ...}) 改为使用 UIOpacity 组件
        // 使用多行模式匹配，因为 tween 调用可能跨多行
        let hasTweenOpacityFix = false;
        const lines = newContent.split('\n');
        const newLines = [];
        const processedTweens = new Set(); // 记录已处理的 tween 行号，避免重复处理
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const indent = line.match(/^(\s*)/)?.[1] || '';
            
            // 检测 tween(nodeVar) 开始
            const tweenMatch = line.match(/^(\s*)tween\(([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\)/);
            if (tweenMatch && !processedTweens.has(i)) {
                const nodeExpr = tweenMatch[2];
                let hasOpacity = false;
                let tweenEndIndex = i;
                
                // 向前查找，检查这个 tween 调用中是否包含 opacity
                // 查找范围：从当前行到找到 .start() 或遇到下一个 tween/函数定义
                for (let j = i; j < lines.length && j < i + 20; j++) {
                    const checkLine = lines[j];
                    // 检查是否包含 {opacity: ...} 模式
                    if (checkLine.includes('opacity') && (checkLine.includes('{opacity:') || checkLine.match(/\{.*opacity\s*:/))) {
                        hasOpacity = true;
                    }
                    // 找到 .start() 表示 tween 调用结束
                    if (checkLine.includes('.start()')) {
                        tweenEndIndex = j;
                        break;
                    }
                    // 如果遇到新的 tween 或函数定义，停止查找
                    if (j > i && (checkLine.match(/^\s*tween\(/) || checkLine.match(/^\s*\w+\s*\([^)]*\)\s*\{/))) {
                        break;
                    }
                }
                
                if (hasOpacity) {
                    // 检查是否同时包含 scale 和 opacity
                    let hasScale = false;
                    for (let j = i; j <= tweenEndIndex; j++) {
                        const checkLine = lines[j];
                        if (checkLine.includes('scale') && (checkLine.includes('{scale:') || checkLine.match(/\{.*scale\s*:/))) {
                            hasScale = true;
                            break;
                        }
                    }
                    
                    // 检查是否已经在使用 UIOpacity（在当前 tween 块中）
                    let alreadyUsingUIOpacity = false;
                    for (let j = i; j <= tweenEndIndex; j++) {
                        if (lines[j].includes('getComponent(UIOpacity)') || lines[j].includes('addComponent(UIOpacity)')) {
                            alreadyUsingUIOpacity = true;
                            break;
                        }
                    }
                    
                    if (!alreadyUsingUIOpacity) {
                        hasTweenOpacityFix = true;
                        
                        // 直接内联使用 getComponent(UIOpacity)，不生成变量
                        if (hasScale) {
                            // 如果同时有 scale 和 opacity，需要拆分成两个 tween
                            warnings.push(`修复 tween scale + opacity: 拆分为两个 tween，分别处理 scale (node) 和 opacity (UIOpacity)`);
                            
                            // 提取 tween 的各个部分（delay, to, call 等）
                            let delayValue = '';
                            let toDuration = '';
                            let toProps = '';
                            let callContent = '';
                            let hasCall = false;
                            
                            for (let j = i; j <= tweenEndIndex; j++) {
                                const tweenLine = lines[j];
                                
                                // 提取 delay
                                const delayMatch = tweenLine.match(/\.delay\s*\(\s*([^)]+)\s*\)/);
                                if (delayMatch) {
                                    delayValue = delayMatch[1];
                                }
                                
                                // 提取 to 的参数（包含 scale 和 opacity）
                                const toMatch = tweenLine.match(/\.to\s*\(\s*([^,]+)\s*,\s*\{([^}]+)\}\s*\)/);
                                if (toMatch) {
                                    toDuration = toMatch[1];
                                    toProps = toMatch[2];
                                    
                                    // 分离 scale 和 opacity
                                    // scale 可能是 new Vec3(...) 或数字，需要更精确的匹配
                                    // 先尝试匹配 new Vec3(...)
                                    let scaleValue = '';
                                    const scaleVec3Match = toProps.match(/scale\s*:\s*(new\s+Vec3\s*\([^)]+\))/);
                                    if (scaleVec3Match) {
                                        scaleValue = scaleVec3Match[1].trim();
                                    } else {
                                        // 如果不是 Vec3，匹配数字
                                        const scaleNumMatch = toProps.match(/scale\s*:\s*([0-9.]+)/);
                                        if (scaleNumMatch) {
                                            scaleValue = scaleNumMatch[1].trim();
                                        }
                                    }
                                    
                                    const opacityMatch = toProps.match(/opacity\s*:\s*([^,}]+)/);
                                    
                                    if (scaleValue && opacityMatch) {
                                        const opacityValue = opacityMatch[1].trim();
                                        
                                        // 创建第一个 tween（处理 opacity）
                                        newLines.push(`${indent}tween(${nodeExpr}.getComponent(UIOpacity))`);
                                        if (delayValue) {
                                            newLines.push(`${indent}    .delay(${delayValue})`);
                                        }
                                        newLines.push(`${indent}    .to(${toDuration}, { opacity: ${opacityValue} })`);
                                        
                                        // 检查是否有 call
                                        for (let k = j + 1; k <= tweenEndIndex; k++) {
                                            if (lines[k].includes('.call(')) {
                                                hasCall = true;
                                                // 提取 call 的内容（可能跨多行）
                                                let callStart = k;
                                                let callEnd = k;
                                                let callParenCount = 0;
                                                let foundCallStart = false;
                                                
                                                for (let m = k; m <= tweenEndIndex; m++) {
                                                    const callLine = lines[m];
                                                    if (!foundCallStart && callLine.includes('.call(')) {
                                                        foundCallStart = true;
                                                        callParenCount = (callLine.match(/\(/g) || []).length - (callLine.match(/\)/g) || []).length;
                                                    } else if (foundCallStart) {
                                                        callParenCount += (callLine.match(/\(/g) || []).length - (callLine.match(/\)/g) || []).length;
                                                    }
                                                    
                                                    if (foundCallStart && callParenCount === 0) {
                                                        callEnd = m;
                                                        break;
                                                    }
                                                }
                                                
                                                // 添加 call 到第一个 tween
                                                for (let m = callStart; m <= callEnd; m++) {
                                                    newLines.push(lines[m]);
                                                }
                                                
                                                // 跳过已处理的 call 行
                                                for (let m = callStart; m <= callEnd; m++) {
                                                    processedTweens.add(m);
                                                }
                                                break;
                                            }
                                        }
                                        
                                        if (hasCall) {
                                            newLines.push(`${indent}    .start();`);
                                        } else {
                                            newLines.push(`${indent}    .start();`);
                                        }
                                        
                                        // 创建第二个 tween（处理 scale）
                                        newLines.push(`${indent}tween(${nodeExpr})`);
                                        if (delayValue) {
                                            newLines.push(`${indent}    .delay(${delayValue})`);
                                        }
                                        newLines.push(`${indent}    .to(${toDuration}, { scale: ${scaleValue} })`);
                                        newLines.push(`${indent}    .start();`);
                                        
                                        // 标记已处理的行
                                        for (let m = i; m <= tweenEndIndex; m++) {
                                            processedTweens.add(m);
                                        }
                                        
                                        break;
                                    }
                                }
                            }
                            
                            continue; // 跳过原始行，因为已经添加了修改后的行
                        } else {
                            // 只有 opacity，直接将目标改为 UIOpacity 组件（直接内联使用）
                            warnings.push(`修复 tween opacity: tween(${nodeExpr}).to(..., {opacity: ...}) 改为使用 UIOpacity 组件`);
                            
                            // 修改 tween 调用，将目标从 node 改为直接使用 getComponent(UIOpacity)
                            const modifiedLine = line.replace(`tween(${nodeExpr})`, `tween(${nodeExpr}.getComponent(UIOpacity))`);
                            newLines.push(modifiedLine);
                            
                            // 只标记 tween 开始行为已处理，后续行需要正常添加
                            processedTweens.add(i);
                            continue; // 跳过原始行，因为已经添加了修改后的行
                        }
                    }
                }
            }
            
            // 如果这行没有被处理过，直接添加
            if (!processedTweens.has(i)) {
                newLines.push(line);
            }
        }
        
        if (hasTweenOpacityFix) {
            newContent = newLines.join('\n');
            modified = true;
        }
        
        // 5.3. 修复所有 node.opacity = 数字 的情况
        // 将 node.opacity = 数字 改为 node.getComponent(UIOpacity).opacity = 数字
        // 匹配所有可能的节点表达式：this.node, node, this.ndXxx, ndXxx, this.list[0], this.list[parseInt(...)] 等
        if (newContent.includes('.opacity = ')) {
            // 使用更灵活的正则，匹配节点表达式.opacity = 数字
            // 支持：this.node, node, this.list[0], this.list[parseInt(...)] 等复杂数组访问
            // 匹配模式：非空白字符序列（可能包含点、括号、数组访问等）.opacity = 数字
            const opacityPattern = /([^\s]+(?:\.\w+(?:\[[^\]]*\])*)*)\.opacity\s*=\s*([0-9]+)\s*;?/g;
            let hasOpacityFix = false;
            
            newContent = newContent.replace(opacityPattern, (match, nodeExpr, opacityValue) => {
                // 检查是否已经在使用 getComponent(UIOpacity)
                if (nodeExpr.includes('getComponent(UIOpacity)') || nodeExpr.includes('addComponent(UIOpacity)')) {
                    return match; // 已经正确，跳过
                }
                
                hasOpacityFix = true;
                
                // 保留前导空格和缩进（从 match 中提取，因为 nodeExpr 可能不包含前导空格）
                const trimmedNodeExpr = nodeExpr.trim();
                const matchStartIndex = match.indexOf(nodeExpr);
                const leadingSpaces = match.substring(0, matchStartIndex);
                
                warnings.push(`修复 opacity 设置: ${trimmedNodeExpr}.opacity = ${opacityValue} 改为 ${trimmedNodeExpr}.getComponent(UIOpacity).opacity = ${opacityValue}`);
                
                // 保留原有的分号（如果有）
                const hasSemicolon = match.trim().endsWith(';');
                return `${leadingSpaces}${trimmedNodeExpr}.getComponent(UIOpacity).opacity = ${opacityValue}${hasSemicolon ? ';' : ''}`;
            });
            
            if (hasOpacityFix) {
                modified = true;
            }
        }
        
        // 5.4. 替换读取操作（如果还有遗漏的）
        // 将 node.opacity（读取）改为 node.getComponent(UIOpacity).opacity
        // 匹配读取操作：node.opacity（但不是赋值），如 if (node.opacity > 0), node.opacity > 255 等
        // 使用更灵活的正则，匹配节点表达式.opacity（非赋值），支持复杂数组访问
        const opacityReadPattern = /([^\s]+(?:\.\w+(?:\[[^\]]*\])*)*)\.opacity(?!\s*=)/g;
        if (opacityReadPattern.test(newContent)) {
            let hasOpacityReadFix = false;
            
            newContent = newContent.replace(opacityReadPattern, (match, nodeExpr) => {
                // 检查是否已经在使用 getComponent(UIOpacity)
                if (nodeExpr.includes('getComponent(UIOpacity)') || nodeExpr.includes('addComponent(UIOpacity)')) {
                    return match; // 已经正确，跳过
                }
                
                hasOpacityReadFix = true;
                
                // 保留前导空格和缩进（从 match 中提取）
                const trimmedNodeExpr = nodeExpr.trim();
                const matchStartIndex = match.indexOf(nodeExpr);
                const leadingSpaces = match.substring(0, matchStartIndex);
                
                warnings.push(`修复 opacity 读取: ${trimmedNodeExpr}.opacity 改为 ${trimmedNodeExpr}.getComponent(UIOpacity).opacity`);
                return `${leadingSpaces}${trimmedNodeExpr}.getComponent(UIOpacity).opacity`;
            });
            
            if (hasOpacityReadFix) {
                modified = true;
            }
        }
        
        modified = true;
    }
    
    // 6. 处理 cc.js.getClassName
    if (newContent.includes('cc.js.getClassName')) {
        // 尝试替换为直接使用类名
        newContent = newContent.replace(/cc\.js\.getClassName\((\w+)\)/g, (match, className) => {
            return `'${className}'`;
        });
        modified = true;
    }
    
    // 6.0.5. 修复 cc.log → console.log (Cocos Creator 3.8.7)
    // 将 cc.log(...) 统一替换为 console.log(...)
    if (newContent.includes('cc.log')) {
        newContent = newContent.replace(/cc\.log\(/g, 'console.log(');
        modified = true;
        warnings.push('修复日志输出: cc.log(...) → console.log(...)');
    }
    
    // 6.0.6. 修复 cc.Tween → Tween (Cocos Creator 3.8.7)
    // 将 cc.Tween 统一替换为 Tween
    if (newContent.includes('cc.Tween')) {
        newContent = newContent.replace(/cc\.Tween/g, 'Tween');
        modified = true;
        warnings.push('修复 Tween 使用: cc.Tween → Tween');
        // 确保 Tween 被添加到导入列表
        const usedImports = getUsedImports(newContent);
        if (usedImports.has('Tween')) {
            // 检查是否已经有 Tween 导入
            const existingImports = newContent.match(/^import\s+.*from\s+['"]cc['"];?/m);
            if (existingImports) {
                const importLine = existingImports[0];
                if (!importLine.includes('Tween')) {
                    const importMatch = importLine.match(/import\s+\{([^}]+)\}\s+from\s+['"]cc['"]/);
                    if (importMatch) {
                        const existingImportsList = importMatch[1].split(',').map(i => i.trim());
                        if (!existingImportsList.includes('Tween')) {
                            const allImports = [...new Set([...existingImportsList, 'Tween'])].sort();
                            const newImportLine = `import { ${allImports.join(', ')} } from 'cc';`;
                            newContent = newContent.replace(importLine, newImportLine);
                            modified = true;
                            warnings.push('添加 Tween 导入');
                        }
                    }
                }
            }
        }
    }
    
    // 6.0.7. 修复 convertToWorldSpaceAR 和 convertToNodeSpaceAR (Cocos Creator 3.8.7)
    // 在 3.8 中，这些方法需要通过 UITransform 组件调用
    // 直接内联使用，不生成变量
    if (newContent.includes('convertToWorldSpaceAR') || newContent.includes('convertToNodeSpaceAR')) {
        let hasConvertFix = false;
        
        // 修复 convertToWorldSpaceAR：直接内联替换
        const worldSpacePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.convertToWorldSpaceAR\(/g;
        newContent = newContent.replace(worldSpacePattern, (match, nodeExpr) => {
            // 检查是否已经在使用 UITransform
            if (nodeExpr.includes('getComponent(UITransform)')) {
                return match; // 已经正确，跳过
            }
            
            hasConvertFix = true;
            warnings.push(`修复 convertToWorldSpaceAR: ${nodeExpr}.convertToWorldSpaceAR(...) 改为 ${nodeExpr}.getComponent(UITransform).convertToWorldSpaceAR(...)`);
            return `${nodeExpr}.getComponent(UITransform).convertToWorldSpaceAR(`;
        });
        
        // 修复 convertToNodeSpaceAR：直接内联替换
        const nodeSpacePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.convertToNodeSpaceAR\(/g;
        newContent = newContent.replace(nodeSpacePattern, (match, nodeExpr) => {
            // 检查是否已经在使用 UITransform
            if (nodeExpr.includes('getComponent(UITransform)')) {
                return match; // 已经正确，跳过
            }
            
            hasConvertFix = true;
            warnings.push(`修复 convertToNodeSpaceAR: ${nodeExpr}.convertToNodeSpaceAR(...) 改为 ${nodeExpr}.getComponent(UITransform).convertToNodeSpaceAR(...)`);
            return `${nodeExpr}.getComponent(UITransform).convertToNodeSpaceAR(`;
        });
        
        if (hasConvertFix) {
            modified = true;
        }
    }
    
    // 6.0.8. 修复 v3 只有两个参数的情况 (Cocos Creator 3.8.7)
    // 将 v3(x, y) 改为 v3(x, y, z)，如果 x 和 y 来自同一个变量，则添加 .z，否则添加 0
    if (newContent.includes('v3(')) {
        let hasV3Fix = false;
        
        // 匹配 v3(...) 调用，然后检查参数数量
        const v3Pattern = /v3\s*\(([^)]*)\)/g;
        
        newContent = newContent.replace(v3Pattern, (match, params) => {
            // 计算参数数量（通过逗号数量，但要考虑嵌套括号）
            const trimmedParams = params.trim();
            if (!trimmedParams) {
                return match; // 没有参数，跳过
            }
            
            // 检查逗号数量（简单情况：如果没有嵌套括号，逗号数量 = 参数数量 - 1）
            // 但为了安全，我们检查是否只有两个参数（一个逗号，且逗号前后都有内容）
            const commaMatches = trimmedParams.match(/,/g);
            const commaCount = commaMatches ? commaMatches.length : 0;
            
            // 如果逗号数量不是1，说明不是两个参数，跳过
            if (commaCount !== 1) {
                return match;
            }
            
            // 分割参数
            const paramParts = trimmedParams.split(',').map(p => p.trim());
            if (paramParts.length !== 2) {
                return match; // 不是两个参数，跳过
            }
            
            const xParam = paramParts[0];
            const yParam = paramParts[1];
            
            hasV3Fix = true;
            
            // 提取变量名（如果 x 和 y 都来自同一个变量，如 posStart.x 和 posStart.y）
            const xMatch = xParam.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*x$/);
            const yMatch = yParam.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*y$/);
            
            if (xMatch && yMatch && xMatch[1] === yMatch[1]) {
                // 如果 x 和 y 来自同一个变量，添加 .z
                const varName = xMatch[1];
                warnings.push(`修复 v3 参数: v3(${xParam}, ${yParam}) 改为 v3(${xParam}, ${yParam}, ${varName}.z)`);
                return `v3(${xParam}, ${yParam}, ${varName}.z)`;
            } else {
                // 否则添加 0 作为第三个参数
                warnings.push(`修复 v3 参数: v3(${xParam}, ${yParam}) 改为 v3(${xParam}, ${yParam}, 0)`);
                return `v3(${xParam}, ${yParam}, 0)`;
            }
        });
        
        if (hasV3Fix) {
            modified = true;
        }
    }
    
    // 6.0.10. 修复 setPosition(v2(...)) (Cocos Creator 3.8.7)
    // 将 setPosition(v2(x, y)) 改为 setPosition(v3(x, y, 0))
    if (newContent.includes('setPosition') && (newContent.includes('v2(') || newContent.includes('cc.v2('))) {
        let hasSetPositionFix = false;
        
        // 匹配 setPosition(v2(x, y)) 或 setPosition(cc.v2(x, y))
        // 支持各种格式：setPosition(v2(x, y))、setPosition(v2(x, 0))、setPosition(cc.v2(x, y)) 等
        const setPositionV2Pattern = /\.setPosition\s*\(\s*(?:cc\.)?v2\s*\(([^)]+)\)\s*\)/g;
        
        newContent = newContent.replace(setPositionV2Pattern, (match, params) => {
            hasSetPositionFix = true;
            const trimmedParams = params.trim();
            warnings.push(`修复 setPosition: setPosition(v2(${trimmedParams})) 改为 setPosition(v3(${trimmedParams}, 0))`);
            return `.setPosition(v3(${trimmedParams}, 0))`;
        });
        
        if (hasSetPositionFix) {
            modified = true;
        }
    }
    
    // 6.0.9. 修复 getContentSize() (Cocos Creator 3.8.7)
    // 将 node.getContentSize() 改为 node.getComponent(UITransform).contentSize
    if (newContent.includes('.getContentSize()')) {
        let hasGetContentSizeFix = false;
        
        // 匹配 node.getContentSize() 模式
        // 支持各种使用场景：赋值、方法调用参数、属性访问等
        const getContentSizePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.getContentSize\(\)/g;
        
        newContent = newContent.replace(getContentSizePattern, (match, nodeExpr) => {
            // 检查是否已经在使用 getComponent(UITransform)
            if (nodeExpr.includes('getComponent(UITransform)') || nodeExpr.includes('addComponent(UITransform)')) {
                return match; // 已经正确，跳过
            }
            
            hasGetContentSizeFix = true;
            warnings.push(`修复 getContentSize: ${nodeExpr}.getContentSize() 改为 ${nodeExpr}.getComponent(UITransform).contentSize`);
            
            return `${nodeExpr}.getComponent(UITransform).contentSize`;
        });
        
        if (hasGetContentSizeFix) {
            modified = true;
        }
    }
    
    // 6.0.11. 修复 node.height 和 node.width 直接访问 (Cocos Creator 3.8.7)
    // 将 node.height 改为 node.getComponent(UITransform).contentSize.height
    // 将 node.width 改为 node.getComponent(UITransform).contentSize.width
    if (newContent.includes('.height') || newContent.includes('.width')) {
        let hasHeightWidthFix = false;
        
        // 匹配 node.height 或 node.width（包括 node.parent.height 等）
        // 排除已经在使用 getComponent(UITransform) 的情况
        const heightPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.height\b/g;
        const widthPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.width\b/g;
        
        newContent = newContent.replace(heightPattern, (match, nodeExpr) => {
            // 检查是否已经在使用 getComponent(UITransform)
            if (nodeExpr.includes('getComponent(UITransform)') || nodeExpr.includes('addComponent(UITransform)') || 
                nodeExpr.includes('contentSize')) {
                return match; // 已经正确，跳过
            }
            
            hasHeightWidthFix = true;
            warnings.push(`修复 height 访问: ${nodeExpr}.height 改为 ${nodeExpr}.getComponent(UITransform).contentSize.height`);
            return `${nodeExpr}.getComponent(UITransform).contentSize.height`;
        });
        
        newContent = newContent.replace(widthPattern, (match, nodeExpr) => {
            // 检查是否已经在使用 getComponent(UITransform)
            if (nodeExpr.includes('getComponent(UITransform)') || nodeExpr.includes('addComponent(UITransform)') || 
                nodeExpr.includes('contentSize')) {
                return match; // 已经正确，跳过
            }
            
            hasHeightWidthFix = true;
            warnings.push(`修复 width 访问: ${nodeExpr}.width 改为 ${nodeExpr}.getComponent(UITransform).contentSize.width`);
            return `${nodeExpr}.getComponent(UITransform).contentSize.width`;
        });
        
        if (hasHeightWidthFix) {
            modified = true;
        }
    }
    
    // 6.1. 处理 js.getClassByName (修复 viewScript 类型错误)
    // 在 Cocos Creator 3.8 中，getComponent 需要字符串类名，而不是类型
    if (newContent.includes('js.getClassByName')) {
        // 匹配 js.getClassByName(ClassName) 并替换为 'ClassName'
        newContent = newContent.replace(/js\.getClassByName\((\w+)\)/g, (match, className) => {
            warnings.push(`修复 js.getClassByName(${className}) 为字符串 '${className}' (viewScript 需要字符串类型)`);
            return `'${className}'`;
        });
        modified = true;
    }
    
    // 6.2. 处理 getComponent(Sprite).spriteFrame 类型错误
    // 在 Cocos Creator 3.8 中，getComponent 返回 Component | null，需要类型断言
    if (newContent.includes('getComponent') && (newContent.includes('Sprite') || newContent.includes('cc.Sprite'))) {
        // 先替换 cc.Sprite 为 Sprite（如果还没有导入 Sprite，会在后续步骤中添加）
        if (newContent.includes('getComponent(cc.Sprite)')) {
            newContent = newContent.replace(/getComponent\(cc\.Sprite\)/g, 'getComponent(Sprite)');
            modified = true;
        }
        
        // 匹配 getComponent(Sprite).spriteFrame = xxx 并添加类型断言
        // 匹配模式：xxx.getComponent(Sprite).spriteFrame = xxx
        // 如果已经有类型断言，跳过
        if (newContent.includes('getComponent(Sprite).spriteFrame') && !newContent.includes('getComponent(Sprite) as Sprite')) {
            // 使用更精确的正则表达式，匹配节点表达式（包括 children[0] 等）
            // 匹配：任意节点表达式.getComponent(Sprite).spriteFrame = 
            newContent = newContent.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.getComponent\(Sprite\)\.spriteFrame\s*=/g, (match, nodeExpr) => {
                // 检查是否已经有类型断言
                if (match.includes(' as Sprite')) {
                    return match;
                }
                warnings.push(`修复 getComponent(Sprite).spriteFrame 类型错误，添加类型断言`);
                return `(${nodeExpr}.getComponent(Sprite) as Sprite).spriteFrame =`;
            });
            modified = true;
        }
    }
    
    // 7. 处理 module.exports (xxxx_Cfg.ts)
    if (newContent.includes('module.exports')) {
        // 转换为 ES6 export
        newContent = newContent.replace(/module\.exports\s*=\s*(\w+);?/g, 'export default $1;');
        modified = true;
    }
    
    // 7.1. 修复颜色创建方式 (Cocos Creator 3.8.7)
    // 将 new cc.Color(...) 替换为 new Color(...)
    if (newContent.includes('new cc.Color')) {
        newContent = newContent.replace(/new cc\.Color\(/g, 'new Color(');
        modified = true;
        warnings.push('修复颜色创建方式: new cc.Color(...) → new Color(...)');
    }
    
    // 7.2.0. 修复变量类型声明：如果变量被赋值为 node.scale，确保类型是 Vec3
    // 匹配模式：private/let/var variableName = 0; 且后续有 variableName = node.scale
    if (newContent.includes('= 0;') && newContent.includes('.scale')) {
        // 查找所有变量声明：private/let/var variableName = 0;
        const varDeclPattern = /(private|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*0\s*;/g;
        const scaleAssignPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.scale\s*;/g;
        
        // 收集所有被赋值为 node.scale 的变量名
        const scaleVariables = new Set();
        let match;
        while ((match = scaleAssignPattern.exec(newContent)) !== null) {
            scaleVariables.add(match[1]);
        }
        
        // 修复变量声明
        if (scaleVariables.size > 0) {
            newContent = newContent.replace(varDeclPattern, (match, keyword, varName) => {
                if (scaleVariables.has(varName)) {
                    // 检查是否已经有类型声明
                    if (!match.includes(':')) {
                        warnings.push(`修复变量类型: ${keyword} ${varName} = 0; 改为 ${keyword} ${varName}: Vec3 = null;`);
                        return `${keyword} ${varName}: Vec3 = null;`;
                    }
                }
                return match;
            });
            if (scaleVariables.size > 0) {
                modified = true;
            }
        }
    }
    
    // 7.2.1. 修复 scaleX 和 scaleY 设置问题 (Cocos Creator 3.8.7)
    // 将 node.scaleY = 数字 改为 node.setScale(1, 数字)
    // 将 node.scaleX = 数字 改为 node.setScale(数字, 1)
    if (newContent.includes('.scaleY = ') || newContent.includes('.scaleX = ')) {
        let hasScaleXYFix = false;
        
        // 修复 scaleY
        const scaleYPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.scaleY\s*=\s*([0-9.]+)\s*;?/g;
        newContent = newContent.replace(scaleYPattern, (match, nodeExpr, scaleValue) => {
            hasScaleXYFix = true;
            warnings.push(`修复 scaleY 设置: ${nodeExpr}.scaleY = ${scaleValue} 改为 ${nodeExpr}.setScale(1, ${scaleValue})`);
            const hasSemicolon = match.trim().endsWith(';');
            return `${nodeExpr}.setScale(1, ${scaleValue})${hasSemicolon ? ';' : ''}`;
        });
        
        // 修复 scaleX
        const scaleXPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.scaleX\s*=\s*([0-9.]+)\s*;?/g;
        newContent = newContent.replace(scaleXPattern, (match, nodeExpr, scaleValue) => {
            hasScaleXYFix = true;
            warnings.push(`修复 scaleX 设置: ${nodeExpr}.scaleX = ${scaleValue} 改为 ${nodeExpr}.setScale(${scaleValue}, 1)`);
            const hasSemicolon = match.trim().endsWith(';');
            return `${nodeExpr}.setScale(${scaleValue}, 1)${hasSemicolon ? ';' : ''}`;
        });
        
        if (hasScaleXYFix) {
            modified = true;
        }
    }
    
    // 7.2.2. 修复 scale 设置问题 (Cocos Creator 3.8.7)
    // 将 node.scale = 数字 改为 node.scale = new Vec3(数字, 数字, 数字)
    // 匹配所有可能的 scale 赋值模式，包括 this.node.scale = 0; element.scale = 1; 等
    if (newContent.includes('.scale = ')) {
        // 匹配 node.scale = 数字 模式（支持 this.node, element, ndIcon 等各种节点表达式）
        // 匹配模式：任意节点表达式.scale = 数字（可选分号）
        const scalePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.scale\s*=\s*([0-9.]+)(?:\s*;|\s*$)/g;
        let hasScaleFix = false;
        
        newContent = newContent.replace(scalePattern, (match, nodeExpr, scaleValue) => {
            // 检查是否已经在使用 Vec3 或 v3（在同一行中）
            if (match.includes('new Vec3') || match.includes('v3(')) {
                return match; // 已经正确，跳过
            }
            
            hasScaleFix = true;
            warnings.push(`修复 scale 设置: ${nodeExpr}.scale = ${scaleValue} 改为 ${nodeExpr}.scale = new Vec3(${scaleValue}, ${scaleValue}, ${scaleValue})`);
            // 保留原有的分号（如果有）
            const hasSemicolon = match.trim().endsWith(';');
            return `${nodeExpr}.scale = new Vec3(${scaleValue}, ${scaleValue}, ${scaleValue})${hasSemicolon ? ';' : ''}`;
        });
        
        if (hasScaleFix) {
            modified = true;
        }
        
        // 修复 node.scale = variable 的情况（variable 是变量名，不是数字）
        // 如果 variable 不是 new Vec3 或 v3，可能需要修复，但这里我们只处理明显错误的情况
        // 例如：node.scale = variableName（variableName 可能是 number 类型变量）
        // 注意：这个修复比较保守，只修复明显是 number 类型变量的情况
        const scaleVariablePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.scale\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;?/g;
        let hasScaleVariableFix = false;
        
        newContent = newContent.replace(scaleVariablePattern, (match, nodeExpr, varName) => {
            // 检查是否已经在使用 Vec3 或 v3
            if (match.includes('new Vec3') || match.includes('v3(') || match.includes('Vec3(')) {
                return match; // 已经正确，跳过
            }
            
            // 检查变量名是否是常见的 Vec3 变量名（如 scaleValue, scaleVec 等）
            // 如果变量名包含 scale 且可能是 Vec3，跳过
            // 这里我们保守处理，只修复明显是 number 类型的情况
            // 实际上，如果 variable 是从 node.scale 赋值的，它应该是 Vec3，不需要修复
            // 但如果 variable 是 number 类型，需要修复
            
            // 检查上下文：如果变量被赋值为 node.scale，则它是 Vec3，不需要修复
            // 这个检查比较复杂，我们先跳过，让用户手动修复类型声明
            
            // 暂时跳过变量赋值的情况，因为无法确定变量类型
            // 如果需要修复，可以添加更复杂的逻辑
            return match;
        });
        
        if (hasScaleVariableFix) {
            modified = true;
        }
    }
    
    // 修复 tween 中的 scale 设置
    // 将 { scale: 数字 } 改为 { scale: new Vec3(数字, 数字, 数字) }
    // 将 { scale: 变量*数字 } 改为 { scale: new Vec3(变量.x * 数字, 变量.y * 数字, 变量.z * 数字) }
    // 将 { scaleY: 数字 } 改为 { scale: new Vec3(1, 数字) }
    // 将 { scaleX: 数字 } 改为 { scale: new Vec3(数字, 1) }
    if (newContent.includes('scale:') || newContent.includes('scaleY:') || newContent.includes('scaleX:')) {
        // 先修复 scaleY
        const tweenScaleYPattern = /\{\s*([^}]*?)\s*scaleY\s*:\s*([0-9.]+)\s*([^}]*?)\s*\}/g;
        let hasTweenScaleYFix = false;
        
        newContent = newContent.replace(tweenScaleYPattern, (match, before, scaleValue, after) => {
            // 检查是否已经在使用 Vec3
            if (match.includes('new Vec3')) {
                return match; // 已经正确，跳过
            }
            
            hasTweenScaleYFix = true;
            
            // 处理 before 和 after 部分，确保逗号正确
            const { beforePart, afterPart } = formatObjectParts(before, after);
            
            warnings.push(`修复 tween scaleY: { scaleY: ${scaleValue}${afterPart ? ', ...' : ''} } 改为 { scale: new Vec3(1, ${scaleValue})${afterPart ? ', ...' : ''} }`);
            // 确保格式正确：如果 beforePart 为空，在 { 和 scale 之间添加空格
            if (beforePart) {
                return `{ ${beforePart}scale: new Vec3(1, ${scaleValue})${afterPart} }`;
            } else {
                return `{ scale: new Vec3(1, ${scaleValue})${afterPart} }`;
            }
        });
        
        if (hasTweenScaleYFix) {
            modified = true;
        }
        
        // 修复 scaleX
        const tweenScaleXPattern = /\{\s*([^}]*?)\s*scaleX\s*:\s*([0-9.]+)\s*([^}]*?)\s*\}/g;
        let hasTweenScaleXFix = false;
        
        newContent = newContent.replace(tweenScaleXPattern, (match, before, scaleValue, after) => {
            // 检查是否已经在使用 Vec3
            if (match.includes('new Vec3')) {
                return match; // 已经正确，跳过
            }
            
            hasTweenScaleXFix = true;
            
            // 处理 before 和 after 部分，确保逗号正确
            const { beforePart, afterPart } = formatObjectParts(before, after);
            
            warnings.push(`修复 tween scaleX: { scaleX: ${scaleValue}${afterPart ? ', ...' : ''} } 改为 { scale: new Vec3(${scaleValue}, 1)${afterPart ? ', ...' : ''} }`);
            // 确保格式正确：如果 beforePart 为空，在 { 和 scale 之间添加空格
            if (beforePart) {
                return `{ ${beforePart}scale: new Vec3(${scaleValue}, 1)${afterPart} }`;
            } else {
                return `{ scale: new Vec3(${scaleValue}, 1)${afterPart} }`;
            }
        });
        
        if (hasTweenScaleXFix) {
            modified = true;
        }
        
        // 清理可能生成的错误格式：{, scale: ...} 或 {, scaleX: ...} 或 {, scaleY: ...}
        const fixLeadingCommaPattern = /\{\s*,\s*([^}]+)\}/g;
        newContent = newContent.replace(fixLeadingCommaPattern, (match, content) => {
            warnings.push(`清理多余逗号: ${match} 改为 { ${content.trim()} }`);
            modified = true;
            return `{ ${content.trim()} }`;
        });
        
        // 继续处理 scale 的情况
        // 先修复 scale: 变量*数字 的情况（如 scale: scaleTmp*1.2）
        const tweenScaleCalcPattern = /\{\s*scale\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\*\s*([0-9.]+)\s*\}/g;
        let hasTweenScaleCalcFix = false;
        
        newContent = newContent.replace(tweenScaleCalcPattern, (match, varName, multiplier) => {
            // 检查是否已经在使用 Vec3
            if (match.includes('new Vec3')) {
                return match; // 已经正确，跳过
            }
            
            hasTweenScaleCalcFix = true;
            warnings.push(`修复 tween scale 计算: { scale: ${varName}*${multiplier} } 改为 { scale: new Vec3(${varName}.x * ${multiplier}, ${varName}.y * ${multiplier}, ${varName}.z * ${multiplier}) }`);
            return `{ scale: new Vec3(${varName}.x * ${multiplier}, ${varName}.y * ${multiplier}, ${varName}.z * ${multiplier}) }`;
        });
        
        if (hasTweenScaleCalcFix) {
            modified = true;
        }
        
        // 再修复 { scale: 数字 } 的情况，支持同时包含其他属性如 { scale: 0, opacity: 0 }
        // 使用更灵活的正则，匹配 scale 属性，无论它在对象中的位置
        // 优化：使用更精确的正则，确保能匹配 {scale:1.2} 这种无空格的情况
        const tweenScalePattern = /\{\s*([^}]*?)\s*scale\s*:\s*([0-9.]+)\s*([^}]*?)\s*\}/g;
        let hasTweenScaleFix = false;
        
        // 先尝试匹配并修复，使用更精确的检查
        newContent = newContent.replace(tweenScalePattern, (match, before, scaleValue, after) => {
            // 检查是否已经在使用 Vec3 或 v3（更严格的检查）
            if (match.includes('new Vec3') || match.includes('v3(') || match.includes('Vec3(')) {
                return match; // 已经正确，跳过
            }
            
            // 检查是否是 scaleX 或 scaleY（这些应该已经被前面的逻辑处理了）
            if (match.includes('scaleX') || match.includes('scaleY')) {
                return match; // 应该已经被处理，跳过
            }
            
            hasTweenScaleFix = true;
            
            // 处理 before 和 after 部分，确保逗号正确
            const { beforePart, afterPart } = formatObjectParts(before, after);
            
            warnings.push(`修复 tween scale 设置: { scale: ${scaleValue}${afterPart ? ', ...' : ''} } 改为 { scale: new Vec3(${scaleValue}, ${scaleValue}, ${scaleValue})${afterPart ? ', ...' : ''} }`);
            // 确保格式正确：如果 beforePart 为空，在 { 和 scale 之间添加空格
            if (beforePart) {
                return `{ ${beforePart}scale: new Vec3(${scaleValue}, ${scaleValue}, ${scaleValue})${afterPart} }`;
            } else {
                return `{ scale: new Vec3(${scaleValue}, ${scaleValue}, ${scaleValue})${afterPart} }`;
            }
        });
        
        if (hasTweenScaleFix) {
            modified = true;
        }
        
        // 修复 tween 中 { scale: variable } 的情况（variable 是变量名，可能是 number 类型）
        // 如果 variable 不是 new Vec3 或 v3，且看起来是 number 类型变量，需要修复
        const tweenScaleVariablePattern = /\{\s*([^}]*?)\s*scale\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([^}]*?)\s*\}/g;
        let hasTweenScaleVariableFix = false;
        
        newContent = newContent.replace(tweenScaleVariablePattern, (match, before, varName, after) => {
            // 检查是否已经在使用 Vec3 或 v3
            if (match.includes('new Vec3') || match.includes('v3(') || match.includes('Vec3(')) {
                return match; // 已经正确，跳过
            }
            
            // 检查是否是 scaleX 或 scaleY
            if (match.includes('scaleX') || match.includes('scaleY')) {
                return match; // 应该已经被处理，跳过
            }
            
            // 检查变量名是否是数字（不应该匹配到这里，因为上面已经处理了数字）
            if (/^\d+\.?\d*$/.test(varName)) {
                return match; // 是数字，应该已经被上面的逻辑处理
            }
            
            // 检查变量名是否是常见的 Vec3 变量名模式
            // 如果变量名包含 scale 且可能是 Vec3 类型（如 startBtnScale, collectBtnScale），跳过
            // 这些变量通常是从 node.scale 赋值的，应该是 Vec3 类型
            // 但如果变量名看起来是 number 类型（如 scaleValue, scaleNum），需要修复
            
            // 保守处理：如果变量名以 Scale 结尾（如 startBtnScale），假设它是 Vec3，跳过
            if (varName.endsWith('Scale') && varName.length > 5) {
                return match; // 可能是 Vec3 类型变量，跳过
            }
            
            // 检查上下文：查找变量声明，看是否是 number 类型
            // 这个检查比较复杂，我们先保守处理，只修复明显的情况
            
            // 暂时跳过，因为无法确定变量类型
            // 如果需要修复，可以添加更复杂的逻辑来检查变量声明
            return match;
        });
        
        if (hasTweenScaleVariableFix) {
            modified = true;
        }
    }
    
    // 7.3. 修复 zIndex 设置问题 (Cocos Creator 3.8.7)
    // 将 node.zIndex = value 改为 node.setSiblingIndex(value)
    // 匹配模式: this.ndCollect.zIndex = 1000 或 node.zIndex = value 或 node.zIndex = variable
    if (newContent.includes('.zIndex = ')) {
        // 先修复数字值的情况
        const zIndexNumberPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.zIndex\s*=\s*([0-9]+)\s*;?/g;
        let hasZIndexFix = false;
        
        newContent = newContent.replace(zIndexNumberPattern, (match, nodeExpr, zIndexValue) => {
            // 检查是否已经在使用 setSiblingIndex
            if (match.includes('setSiblingIndex')) {
                return match; // 已经正确，跳过
            }
            
            hasZIndexFix = true;
            warnings.push(`修复 zIndex 设置: ${nodeExpr}.zIndex = ${zIndexValue} 改为 ${nodeExpr}.setSiblingIndex(${zIndexValue})`);
            // 保留原有的分号（如果有）
            const hasSemicolon = match.trim().endsWith(';');
            return `${nodeExpr}.setSiblingIndex(${zIndexValue})${hasSemicolon ? ';' : ''}`;
        });
        
        // 再修复变量值的情况
        const zIndexVariablePattern = /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z0-9_$\[\]]+)*)\.zIndex\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;?/g;
        
        newContent = newContent.replace(zIndexVariablePattern, (match, nodeExpr, zIndexVar) => {
            // 检查是否已经在使用 setSiblingIndex
            if (match.includes('setSiblingIndex')) {
                return match; // 已经正确，跳过
            }
            
            hasZIndexFix = true;
            warnings.push(`修复 zIndex 设置: ${nodeExpr}.zIndex = ${zIndexVar} 改为 ${nodeExpr}.setSiblingIndex(${zIndexVar})`);
            // 保留原有的分号（如果有）
            const hasSemicolon = match.trim().endsWith(';');
            return `${nodeExpr}.setSiblingIndex(${zIndexVar})${hasSemicolon ? ';' : ''}`;
        });
        
        if (hasZIndexFix) {
            modified = true;
        }
    }
    
    // 7.4. 修复 Node 上直接设置 color 的问题
    // 将 node.color = new Color(...) 改为 node.getComponent(Sprite).color = new Color(...)
    // 匹配模式: this.ndIcon.color = new Color(...) 或 node.color = new Color(...)
    // 但排除已经是 getComponent(Sprite).color 的情况
    if (newContent.includes('.color = new Color(')) {
        // 匹配 node.color = new Color(...) 模式，但不匹配 getComponent(Sprite).color
        const colorPattern = /(\w+(?:\.\w+)*)\.color\s*=\s*new\s+Color\(([^)]+)\);?/g;
        let hasColorFix = false;
        
        newContent = newContent.replace(colorPattern, (match, nodeExpr, colorParams) => {
            // 检查是否已经在使用 getComponent(Sprite)
            if (nodeExpr.includes('getComponent(Sprite)') || nodeExpr.includes('getComponent(cc.Sprite)')) {
                return match; // 已经正确，跳过
            }
            
            // 检查是否是 Node 类型的变量（通过常见的命名模式判断）
            // 常见的 Node 变量命名：this.ndXxx, this.node, ndXxx, node, 或者通过 @property(Node) 声明的属性
            const isNodeVar = /^(this\.)?(nd|node|Node)[A-Z]?/i.test(nodeExpr) || 
                             nodeExpr.includes('this.') || 
                             newContent.match(new RegExp(`@property\\(Node\\)\\s+${nodeExpr.split('.').pop()}`));
            
            if (isNodeVar) {
                hasColorFix = true;
                warnings.push(`修复颜色设置: ${nodeExpr}.color 改为 ${nodeExpr}.getComponent(Sprite).color (Node 需要通过 Sprite 组件设置颜色)`);
                return `${nodeExpr}.getComponent(Sprite).color = new Color(${colorParams});`;
            }
            
            return match; // 如果不是 Node 类型，保持原样
        });
        
        if (hasColorFix) {
            modified = true;
        }
    }
    
    // 8. 在修复代码后，再次检查并添加缺失的导入（特别是 Vec3, Sprite, Color 等）
    const finalUsedImports = getUsedImports(newContent);
    const finalExistingImports = newContent.match(/^import\s+.*from\s+['"]cc['"];?/m);
    
    if (finalUsedImports.size > 0) {
        if (finalExistingImports) {
            // 更新现有导入
            const importLine = finalExistingImports[0];
            const importMatch = importLine.match(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]cc['"]/);
            
            if (importMatch) {
                const existingImportsList = importMatch[1].split(',').map(i => i.trim());
                const allImports = [...new Set([...existingImportsList, ...Array.from(finalUsedImports)])].sort();
                const newImportLine = `import { ${allImports.join(', ')} } from 'cc';`;
                if (newImportLine !== importLine) {
                    newContent = newContent.replace(importLine, newImportLine);
                    modified = true;
                    const addedImports = Array.from(finalUsedImports).filter(imp => !existingImportsList.includes(imp));
                    if (addedImports.length > 0) {
                        warnings.push(`➕ 添加缺失的导入: ${addedImports.join(', ')}`);
                    }
                }
            }
        } else {
            // 添加新导入（在文件开头，装饰器导入之后）
            const importsArray = Array.from(finalUsedImports).sort();
            const importLine = `import { ${importsArray.join(', ')} } from 'cc';`;
            
            // 查找第一个 import 语句的位置
            const firstImportMatch = newContent.match(/^import\s+/m);
            if (firstImportMatch) {
                const insertIndex = newContent.indexOf(firstImportMatch[0]);
                newContent = newContent.slice(0, insertIndex) + importLine + '\n' + newContent.slice(insertIndex);
            } else {
                // 如果没有 import，在文件开头添加
                newContent = importLine + '\n' + newContent;
            }
            modified = true;
            warnings.push(`➕ 添加缺失的导入: ${importsArray.join(', ')}`);
        }
    }
    
    // 9. 清理和修复导入语句（删除错误导入，使用 db:// 方式重新导入，添加缺失的导入）
    const importResult = cleanAndFixImports(newContent, filePath);
    if (importResult.hasChanges) {
        newContent = importResult.content;
        modified = true;
        
        // 添加警告信息
        importResult.removed.forEach(item => {
            warnings.push(`❌ 删除无效导入 (第${item.line}行): ${item.import} - ${item.reason}`);
        });
        importResult.fixed.forEach(item => {
            warnings.push(`✅ 修复导入路径 (第${item.line}行): ${item.old} → ${item.new}`);
        });
        importResult.added.forEach(item => {
            warnings.push(`➕ 添加缺失导入: ${item.className} from ${item.path}`);
        });
    }
    
    return {
        content: newContent,
        modified,
        warnings
    };
}

// ==================== 主函数 ====================

function main() {
    const args = process.argv.slice(2);
    
    let dryRun = false;
    let targetFile = null;
    let targetDir = TARGET_DIR;
    
    // 解析参数
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--dry-run':
                dryRun = true;
                break;
            case '--file':
            case '-f':
                // 支持 --file 或 -f 参数指定文件
                if (i + 1 < args.length) {
                    targetFile = args[i + 1];
                    i++; // 跳过下一个参数，因为已经被使用
                } else {
                    console.error('❌ 错误: --file 参数需要指定文件路径');
                    process.exit(1);
                }
                break;
            case '--help':
            case '-h':
                console.log(`
脚本升级工具 (2.4.13 → 3.8.7)

使用方法:
  node scripts/migrate.js [选项] [文件路径]

选项:
  --dry-run         仅显示将要进行的更改，不实际修改文件
  --file, -f <路径> 指定要处理的单个文件路径（相对或绝对路径）
  --help, -h        显示此帮助信息

示例:
  # 处理默认目录
  node scripts/migrate.js --dry-run
  node scripts/migrate.js

  # 处理单个文件
  node scripts/migrate.js --file assets/scripts/SlotBase/LMSlots_Help_Base.ts
  node scripts/migrate.js -f assets/scripts/SlotBase/LMSlots_Help_Base.ts --dry-run
                `);
                process.exit(0);
                break;
            default:
                // 如果参数不是选项，且没有使用 --file，则将其视为文件路径
                if (!targetFile && !arg.startsWith('--') && !arg.startsWith('-')) {
                    targetFile = arg;
                }
                break;
        }
    }
    
    console.log('🚀 开始升级脚本 (2.4.13 → 3.8.7)...\n');
    
    let files = [];
    
    // 如果指定了文件，处理单个文件
    if (targetFile) {
        // 处理相对路径和绝对路径
        // 如果路径是绝对路径，直接使用；否则相对于 PROJECT_ROOT 解析
        const resolvedPath = path.isAbsolute(targetFile) 
            ? targetFile 
            : path.resolve(PROJECT_ROOT, targetFile);
        
        if (!fs.existsSync(resolvedPath)) {
            console.error(`❌ 错误: 文件不存在: ${resolvedPath}`);
            console.error(`💡 提示: 路径已相对于项目根目录解析: ${PROJECT_ROOT}`);
            process.exit(1);
        }
        
        const stat = fs.statSync(resolvedPath);
        if (stat.isDirectory()) {
            console.error(`❌ 错误: 指定路径是目录，不是文件: ${resolvedPath}`);
            console.log('💡 提示: 如果要对目录进行处理，请使用默认模式或移除 --file 参数');
            process.exit(1);
        }
        
        if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
            console.error(`❌ 错误: 文件必须是 .ts 或 .js 文件: ${resolvedPath}`);
            process.exit(1);
        }
        
        files = [resolvedPath];
        console.log(`📁 目标文件: ${resolvedPath}`);
    } else {
        // 处理默认目录
        console.log(`📁 目标目录: ${targetDir}`);
        if (!fs.existsSync(targetDir)) {
            console.error(`❌ 错误: 目录不存在: ${targetDir}`);
            process.exit(1);
        }
        
        files = getAllTsFiles(targetDir);
        console.log(`📄 找到 ${files.length} 个 TypeScript 文件`);
    }
    
    console.log(`🔍 模式: ${dryRun ? '预览模式 (不会修改文件)' : '执行模式'}`);
    console.log('');
    
    let processedCount = 0;
    let modifiedCount = 0;
    const errors = [];
    const allWarnings = [];
    
    // 处理每个文件
    for (const filePath of files) {
        try {
            const result = migrateFile(filePath, dryRun);
            processedCount++;
            
            if (result.modified || result.warnings.length > 0) {
                modifiedCount++;
                const relativePath = path.relative(process.cwd(), filePath);
                
                if (dryRun) {
                    console.log(`✏️  [预览] 将修改: ${relativePath}`);
                    if (result.warnings.length > 0) {
                        result.warnings.forEach(w => {
                            const icon = w.startsWith('❌') ? '❌' : w.startsWith('✅') ? '✅' : '⚠️';
                            console.log(`   ${icon}  ${w}`);
                            allWarnings.push({ file: relativePath, warning: w });
                        });
                    }
                } else {
                    // 写入文件
                    fs.writeFileSync(filePath, result.content, 'utf8');
                    console.log(`✅ 已更新: ${relativePath}`);
                    if (result.warnings.length > 0) {
                        result.warnings.forEach(w => {
                            const icon = w.startsWith('❌') ? '❌' : w.startsWith('✅') ? '✅' : '⚠️';
                            console.log(`   ${icon}  ${w}`);
                            allWarnings.push({ file: relativePath, warning: w });
                        });
                    }
                }
            }
        } catch (error) {
            errors.push({ file: filePath, error: error.message });
            console.error(`❌ 处理文件失败: ${filePath}`);
            console.error(`   错误: ${error.message}`);
        }
    }
    
    // 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('📊 升级统计:');
    console.log(`   处理文件数: ${processedCount}`);
    console.log(`   修改文件数: ${modifiedCount}`);
    if (targetFile) {
        console.log(`   模式: 单文件处理`);
    } else {
        console.log(`   模式: 目录批量处理`);
    }
    
    if (allWarnings.length > 0) {
        console.log(`\n⚠️  警告数量: ${allWarnings.length}`);
        allWarnings.forEach(({ file, warning }) => {
            console.log(`   - ${file}: ${warning}`);
        });
    }
    
    if (errors.length > 0) {
        console.log(`\n❌ 错误数量: ${errors.length}`);
        errors.forEach(({ file, error }) => {
            console.log(`   - ${file}: ${error}`);
        });
    }
    
    if (dryRun) {
        console.log('\n💡 提示: 这是预览模式，文件未被修改。');
        console.log('   使用不带 --dry-run 参数的命令来实际执行升级。');
    } else {
        console.log('\n✨ 升级完成！');
        console.log('\n⚠️  重要提示:');
        console.log('   1. 请仔细检查修改后的代码');
        console.log('   2. 特别注意 .opacity 的使用，需要改为 UIOpacity 组件');
        console.log('   3. 检查 @ccclass 装饰器是否正确添加了类名参数');
        console.log('   4. 运行项目并测试所有功能');
    }
    
    console.log('');
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { migrateFile, getAllTsFiles };
