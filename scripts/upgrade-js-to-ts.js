#!/usr/bin/env node

/**
 * Cocos Creator 2.4.15 JavaScript 脚本升级到 3.8.7 TypeScript 脚本
 * 
 * 功能：
 * 1. 将 cc.Class 格式的 JavaScript 文件转换为 TypeScript ES6 class
 * 2. 应用所有 2.4.13 → 3.8.7 的迁移规则
 * 
 * 使用方法:
 *   node scripts/upgrade-js-to-ts.js [选项] [目录]
 * 
 * 选项:
 *   --dry-run         仅显示将要进行的更改，不实际修改文件
 *   --help, -h        显示此帮助信息
 * 
 * 示例:
 *   node scripts/upgrade-js-to-ts.js --dry-run
 *   node scripts/upgrade-js-to-ts.js assets/scripts/SlotBase
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

// 获取项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TARGET_DIR = path.join(PROJECT_ROOT, 'assets/scripts/SlotBase');

// API 映射（从 migrate.js 复制）
const API_MAPPINGS = {
    'cc.Node': 'Node',
    'cc.Component': 'Component',
    'cc.Label': 'Label',
    'cc.SpriteFrame': 'SpriteFrame',
    'cc.Prefab': 'Prefab',
    'cc.Vec2': 'Vec2',
    'cc.instantiate': 'instantiate',
    'cc.find': 'find',
    'cc.v2': 'v2',
    'cc.v3': 'v3',
    'cc.tween': 'tween',
    'cc.Tween': 'Tween',
    'cc.js.getClassName': 'js.getClassByName',
    'cc.sp.Skeleton': 'sp.Skeleton',
    'cc.sp.SkeletonData': 'sp.SkeletonData',
    'cc._decorator': '_decorator',
};

// ==================== 工具函数 ====================

function getAllJsFiles(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath)) {
        return files;
    }
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...getAllJsFiles(fullPath));
        } else if (item.endsWith('.js') && !item.endsWith('.d.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatObjectParts(before, after) {
    let beforePart = before.trim();
    let afterPart = after.trim();
    
    if (beforePart) {
        if (!beforePart.endsWith(',')) {
            beforePart = beforePart + ', ';
        } else {
            beforePart = beforePart + ' ';
        }
    }
    
    if (afterPart) {
        if (!afterPart.startsWith(',')) {
            afterPart = ', ' + afterPart;
        } else {
            afterPart = ' ' + afterPart.substring(1).trim();
        }
    }
    
    return { beforePart, afterPart };
}

// ==================== JS 到 TS 转换 ====================

/**
 * 将 JavaScript cc.Class 代码转换为 TypeScript ES6 class
 */
function convertJsToTs(jsContent, filePath) {
    let tsContent = jsContent;
    const warnings = [];
    let modified = false;
    
    // 检查是否是 cc.Class 格式
    if (!jsContent.includes('cc.Class')) {
        warnings.push('⚠️  文件不包含 cc.Class，可能已经是 TypeScript 格式或使用其他格式');
        return { content: tsContent, warnings, modified: false };
    }
    
    // 1. 提取类名（从文件名）
    const fileName = path.basename(filePath, '.js');
    const className = fileName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    
    // 2. 提取 extends
    let extendsClass = 'Component';
    const extendsMatch = jsContent.match(/extends:\s*cc\.(\w+)/);
    if (extendsMatch) {
        extendsClass = extendsMatch[1];
    }
    
    // 3. 提取 properties 并转换为 @property 装饰器
    let propertiesCode = '';
    const neededImports = new Set(['Component', '_decorator']);
    if (extendsClass !== 'Component') {
        neededImports.add(extendsClass);
    }
    
    // 使用括号匹配来准确提取 properties 对象内容
    const propertiesStart = jsContent.indexOf('properties:');
    if (propertiesStart !== -1) {
        let braceCount = 0;
        let inProps = false;
        let propsEnd = propertiesStart;
        
        // 找到 properties 对象的结束位置
        for (let i = propertiesStart + 'properties:'.length; i < jsContent.length; i++) {
            if (jsContent[i] === '{') {
                braceCount++;
                inProps = true;
            } else if (jsContent[i] === '}') {
                braceCount--;
                if (inProps && braceCount === 0) {
                    propsEnd = i;
                    break;
                }
            }
        }
        
        if (propsEnd > propertiesStart) {
            const propertiesContent = jsContent.substring(
                propertiesStart + 'properties:'.length + 1,
                propsEnd
            );
            
            // 解析每个属性
            const propRegex = /(\w+)\s*:\s*\{/g;
            let propMatch;
            const propInfos = [];
            
            while ((propMatch = propRegex.exec(propertiesContent)) !== null) {
                propInfos.push({
                    name: propMatch[1],
                    startIndex: propMatch.index,
                });
            }
            
            // 提取每个属性的完整内容
            for (let i = 0; i < propInfos.length; i++) {
                const prop = propInfos[i];
                const propStartInContent = prop.startIndex + prop.name.length + 2;
                const propStartAbsolute = propertiesStart + 'properties:'.length + 1 + propStartInContent;
                
                // 找到这个属性对象的结束位置
                let propBraceCount = 0;
                let propEndAbsolute = propStartAbsolute;
                for (let j = propStartAbsolute; j < propsEnd + propertiesStart + 'properties:'.length + 1; j++) {
                    if (jsContent[j] === '{') {
                        propBraceCount++;
                    } else if (jsContent[j] === '}') {
                        propBraceCount--;
                        if (propBraceCount === 0) {
                            propEndAbsolute = j;
                            break;
                        }
                    }
                }
                
                // 提取属性内容
                const propContent = jsContent.substring(propStartAbsolute - 2, propEndAbsolute + 1);
                
                // 提取 type
                let typeAnnotation = 'any';
                let propertyDecorator = '@property\n';
                const typeMatch = propContent.match(/type:\s*\[?cc\.(\w+)\]?/);
                if (typeMatch) {
                    const ccType = typeMatch[1];
                    const typeMap = {
                        'Prefab': 'Prefab',
                        'SpriteFrame': 'SpriteFrame',
                        'SpriteAtlas': 'SpriteAtlas',
                        'Font': 'Font',
                        'Node': 'Node',
                        'Component': 'Component',
                    };
                    const mappedType = typeMap[ccType] || ccType;
                    neededImports.add(mappedType);
                    
                    if (propContent.includes('type: [cc.')) {
                        typeAnnotation = `${mappedType}[]`;
                        propertyDecorator = `@property([${mappedType}])\n`;
                    } else {
                        typeAnnotation = mappedType;
                        propertyDecorator = `@property(${mappedType})\n`;
                    }
                }
                
                // 提取 default
                let defaultValue = 'null';
                const defaultMatch = propContent.match(/default:\s*([^,\n}]+)/);
                if (defaultMatch) {
                    defaultValue = defaultMatch[1].trim();
                    if (defaultValue === '[]') {
                        defaultValue = '[]';
                    } else if (defaultValue === 'null' || defaultValue === 'undefined') {
                        defaultValue = 'null';
                    }
                }
                
                // 生成 @property 装饰器和属性声明
                propertiesCode += `    ${propertyDecorator}    ${prop.name}: ${typeAnnotation} = ${defaultValue};\n\n`;
            }
        }
    }
    
    // 4. 提取方法 - 使用括号匹配来准确提取方法体
    let methodsCode = '';
    const processedMethods = new Set();
    
    // 辅助函数：使用括号匹配找到方法体的结束位置
    function extractMethodBody(content, startIndex) {
        let braceCount = 0;
        let methodStart = -1;
        let methodEnd = -1;
        
        // startIndex 应该指向方法定义的 { 的位置
        // 我们需要找到方法体的结束位置，即方法定义开始后的第一个 }，且该 } 后面跟着 , 或 }（对于最后一个方法）
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            
            // 跳过字符串中的大括号
            if (char === '"' || char === "'" || char === '`') {
                const quote = char;
                i++; // 跳过开始引号
                while (i < content.length && content[i] !== quote) {
                    if (content[i] === '\\' && i + 1 < content.length) {
                        i += 2; // 跳过转义字符
                    } else {
                        i++;
                    }
                }
                continue;
            }
            
            if (char === '{') {
                if (methodStart === -1) {
                    methodStart = i + 1; // 方法体开始位置（跳过 {）
                }
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                // 当 braceCount 回到 0 时，说明找到了方法体的结束位置
                if (braceCount === 0 && methodStart !== -1) {
                    // 检查后面是否跟着 , 或 }（跳过空白字符、换行等）
                    let j = i + 1;
                    while (j < content.length && (content[j] === ' ' || content[j] === '\t' || content[j] === '\n' || content[j] === '\r')) {
                        j++;
                    }
                    // 如果后面跟着 , 或 }，说明这是方法的结束
                    if (j < content.length && (content[j] === ',' || content[j] === '}')) {
                        methodEnd = i; // 方法体结束位置（在 } 之前）
                        break;
                    }
                    // 如果不是方法的结束，说明这是方法内部的 }，继续查找
                }
            }
        }
        
        if (methodStart !== -1 && methodEnd !== -1) {
            const body = content.substring(methodStart, methodEnd);
            return body;
        }
        return null;
    }
    
    // 提取生命周期方法（格式：methodName() { ... } 或 methodName: function() { ... }）
    const lifecycleMethods = ['onLoad', 'start', 'update', 'onDestroy', 'onEnable', 'onDisable'];
    
    for (const methodName of lifecycleMethods) {
        // 先尝试匹配 methodName() { ... } 格式
        let methodPattern = new RegExp(`${methodName}\\s*\\(([^)]*)\\)\\s*\\{`, 'm');
        let methodMatch = jsContent.match(methodPattern);
        
        // 如果没找到，尝试 methodName: function() { ... } 格式
        if (!methodMatch) {
            methodPattern = new RegExp(`${methodName}\\s*:\\s*function\\s*\\(([^)]*)\\)\\s*\\{`, 'm');
            methodMatch = jsContent.match(methodPattern);
        }
        
        if (methodMatch) {
            const params = (methodMatch[1] || '').trim();
            // methodMatch[0] 是完整匹配，如 "onLoad() {"，我们需要找到 { 的位置
            const methodStartIndex = methodMatch.index + methodMatch[0].indexOf('{'); // 指向 { 的位置
            
            const methodBody = extractMethodBody(jsContent, methodStartIndex);
            
            if (methodBody !== null) {
                methodsCode += `    ${methodName}(${params}) {\n`;
                // 处理方法体，保持原有缩进并添加类级别的缩进
                const trimmedBody = methodBody.trim();
                if (trimmedBody) {
                    // 修复：在数字后直接跟标识符的情况，添加换行符
                    // 例如：opacity = 0this.node.y 应该变成 opacity = 0\nthis.node.y
                    let fixedBody = methodBody.replace(/(\d+)([a-zA-Z_$])/g, '$1\n$2');
                    
                    // 处理所有类型的换行符（\r\n, \n, \r）
                    const bodyLines = fixedBody.split(/\r?\n/).map(line => {
                        if (line.trim()) {
                            return '        ' + line;
                        }
                        return line;
                    }).join('\n');
                    methodsCode += bodyLines + '\n';
                }
                methodsCode += `    }\n\n`;
                processedMethods.add(methodName);
            }
        }
    }
    
    // 提取其他方法（格式：methodName: function(...) { ... }）
    // 注意：使用 lastIndex 来避免全局正则的问题
    const otherMethodsPattern = /(\w+)\s*:\s*function\s*\(([^)]*)\)\s*\{/g;
    let otherMethodMatch;
    const methodMatches = [];
    
    // 先收集所有匹配，避免 exec 的副作用
    while ((otherMethodMatch = otherMethodsPattern.exec(jsContent)) !== null) {
        const methodName = otherMethodMatch[1];
        if (!processedMethods.has(methodName)) {
            methodMatches.push({
                name: methodName,
                params: (otherMethodMatch[2] || '').trim(),
                startIndex: otherMethodMatch.index + otherMethodMatch[0].indexOf('{'),
                match: otherMethodMatch
            });
        }
    }
    
    // 处理每个方法
    for (const methodInfo of methodMatches) {
        processedMethods.add(methodInfo.name);
        
        const methodBody = extractMethodBody(jsContent, methodInfo.startIndex);
        
        if (methodBody !== null) {
            methodsCode += `    ${methodInfo.name}(${methodInfo.params}) {\n`;
            // 处理方法体，保持原有缩进
            // 注意：不要 trim，保留原始的方法体内容（包括首尾空白）
            if (methodBody.trim()) {
                // 修复：在数字后直接跟标识符的情况，添加换行符
                // 例如：opacity = 0this.node.y 应该变成 opacity = 0\nthis.node.y
                let fixedBody = methodBody.replace(/(\d+)([a-zA-Z_$])/g, '$1\n$2');
                
                // 处理所有类型的换行符（\r\n, \n, \r）
                const bodyLines = fixedBody.split(/\r?\n/).map(line => {
                    if (line.trim()) {
                        return '        ' + line;
                    }
                    return line;
                }).join('\n');
                methodsCode += bodyLines + '\n';
            }
            methodsCode += `    }\n\n`;
        }
    }
    
    // 5. 构建 TypeScript 代码
    const importsArray = Array.from(neededImports).sort();
    tsContent = `import { ${importsArray.join(', ')} } from 'cc';\n`;
    tsContent += `const { ccclass, property } = _decorator;\n\n`;
    tsContent += `@ccclass('${className}')\n`;
    tsContent += `export default class ${className} extends ${extendsClass} {\n\n`;
    tsContent += propertiesCode;
    tsContent += methodsCode;
    // 清理末尾的注释和多余内容
    tsContent = tsContent.replace(/\s*\/\/\s*update\s*\([^)]*\)\s*\{[^}]*\}/g, '');
    tsContent = tsContent.replace(/\s*\/\/\s*[^\n]*\n\s*\}/g, '\n}');
    tsContent += `}\n`;
    
    modified = true;
    warnings.push(`✅ 已将 cc.Class 转换为 ES6 class`);
    
    return { content: tsContent, warnings, modified };
}

// ==================== 迁移逻辑（简化版，调用 migrate.js 的函数） ====================

/**
 * 应用迁移规则（这里我们直接调用 migrate.js 的 migrateFile 函数）
 * 为了简化，我们直接在这里实现核心迁移逻辑
 */
function applyMigrationRules(tsContent, filePath) {
    // 这里应该调用 migrate.js 的 migrateFile 函数
    // 但为了独立运行，我们暂时返回原内容
    // 实际使用时，可以 require('./migrate.js') 并调用其函数
    return { content: tsContent, modified: false, warnings: [] };
}

// ==================== 主函数 ====================

function main() {
    const args = process.argv.slice(2);
    
    let dryRun = false;
    let targetDir = DEFAULT_TARGET_DIR;
    
    // 解析参数
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--dry-run':
                dryRun = true;
                break;
            case '--help':
            case '-h':
                console.log(`
Cocos Creator 2.4.15 → 3.8.7 升级脚本

使用方法:
  node scripts/upgrade-js-to-ts.js [选项] [目录]

选项:
  --dry-run         仅显示将要进行的更改，不实际修改文件
  --help, -h        显示此帮助信息

目录:
  如果不指定目录，默认使用: ${DEFAULT_TARGET_DIR}

示例:
  node scripts/upgrade-js-to-ts.js --dry-run
  node scripts/upgrade-js-to-ts.js assets/scripts/SlotBase
                `);
                process.exit(0);
                break;
            default:
                // 如果不是选项，可能是目录路径
                if (!arg.startsWith('--')) {
                    if (path.isAbsolute(arg)) {
                        targetDir = arg;
                    } else {
                        targetDir = path.resolve(PROJECT_ROOT, arg);
                    }
                }
                break;
        }
    }
    
    console.log('🚀 开始升级 JavaScript 脚本 (2.4.15 → 3.8.7)...\n');
    console.log(`📁 目标目录: ${targetDir}`);
    console.log(`🔍 模式: ${dryRun ? '预览模式 (不会修改文件)' : '执行模式'}`);
    console.log('');
    
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ 错误: 目录不存在: ${targetDir}`);
        process.exit(1);
    }
    
    // 获取所有 JavaScript 文件
    const jsFiles = getAllJsFiles(targetDir);
    console.log(`📄 找到 ${jsFiles.length} 个 JavaScript 文件\n`);
    
    if (jsFiles.length === 0) {
        console.log('✅ 没有找到需要转换的 JavaScript 文件');
        return;
    }
    
    let convertedCount = 0;
    const errors = [];
    const allWarnings = [];
    
    // 加载 migrate.js 的迁移函数
    let migrateFile = null;
    try {
        const migrateModule = require('./migrate.js');
        if (migrateModule && migrateModule.migrateFile) {
            migrateFile = migrateModule.migrateFile;
            console.log('✅ 已加载 migrate.js 的迁移规则\n');
        } else {
            console.log('⚠️  警告: migrate.js 未导出 migrateFile 函数，将使用简化迁移规则\n');
        }
    } catch (e) {
        console.log(`⚠️  警告: 无法加载 migrate.js (${e.message})，将使用简化迁移规则\n`);
    }
    
    // 处理每个 JavaScript 文件
    for (const jsFilePath of jsFiles) {
        try {
            const jsContent = fs.readFileSync(jsFilePath, 'utf8');
            
            // 检查是否是 cc.Class 格式
            if (!jsContent.includes('cc.Class')) {
                console.log(`⏭️  跳过: ${path.relative(PROJECT_ROOT, jsFilePath)} (不是 cc.Class 格式)`);
                continue;
            }
            
            // 第一步：转换为 TypeScript
            const convertResult = convertJsToTs(jsContent, jsFilePath);
            
            if (!convertResult.modified) {
                console.log(`⏭️  跳过: ${path.relative(PROJECT_ROOT, jsFilePath)} (转换失败或不需要转换)`);
                continue;
            }
            
            // 第二步：应用迁移规则
            let finalContent = convertResult.content;
            let migrationWarnings = [];
            
            if (migrateFile) {
                // 使用 migrate.js 的完整迁移规则
                // migrateFile 需要文件路径，我们先写入临时文件，然后调用迁移
                const tempTsPath = jsFilePath.replace(/\.js$/, '.ts');
                const tempFileExists = fs.existsSync(tempTsPath);
                let tempFileContent = null;
                
                // 如果文件已存在，先备份内容
                if (tempFileExists) {
                    tempFileContent = fs.readFileSync(tempTsPath, 'utf8');
                }
                
                // 先写入临时文件（用于 migrateFile 读取）
                fs.writeFileSync(tempTsPath, finalContent, 'utf8');
                
                try {
                    // 调用迁移函数（它会读取文件并返回迁移后的内容）
                    const migrationResult = migrateFile(tempTsPath, dryRun);
                    finalContent = migrationResult.content;
                    migrationWarnings = migrationResult.warnings;
                } finally {
                    // 如果是在 dry-run 模式，恢复或删除临时文件
                    if (dryRun) {
                        if (tempFileContent !== null) {
                            // 恢复原文件内容
                            fs.writeFileSync(tempTsPath, tempFileContent, 'utf8');
                        } else {
                            // 删除临时文件
                            if (fs.existsSync(tempTsPath)) {
                                fs.unlinkSync(tempTsPath);
                            }
                        }
                    }
                }
            } else {
                // 简化版迁移：只做基本的 API 替换
                for (const [oldAPI, newAPI] of Object.entries(API_MAPPINGS)) {
                    const regex = new RegExp(`\\b${escapeRegex(oldAPI)}\\b`, 'g');
                    if (regex.test(finalContent)) {
                        finalContent = finalContent.replace(regex, newAPI);
                        migrationWarnings.push(`替换 API: ${oldAPI} → ${newAPI}`);
                    }
                }
            }
            
            // 生成新的 .ts 文件路径
            const tsFilePath = jsFilePath.replace(/\.js$/, '.ts');
            
            if (dryRun) {
                console.log(`✏️  [预览] 将转换: ${path.relative(PROJECT_ROOT, jsFilePath)} → ${path.relative(PROJECT_ROOT, tsFilePath)}`);
                convertResult.warnings.forEach(w => console.log(`   ${w}`));
                migrationWarnings.forEach(w => console.log(`   ${w}`));
            } else {
                // 写入 .ts 文件
                fs.writeFileSync(tsFilePath, finalContent, 'utf8');
                console.log(`✅ 已转换: ${path.relative(PROJECT_ROOT, jsFilePath)} → ${path.relative(PROJECT_ROOT, tsFilePath)}`);
                convertResult.warnings.forEach(w => console.log(`   ${w}`));
                migrationWarnings.forEach(w => console.log(`   ${w}`));
                
                // 可选：删除原 .js 文件（注释掉，保留原文件作为备份）
                // fs.unlinkSync(jsFilePath);
            }
            
            convertedCount++;
            allWarnings.push(...convertResult.warnings, ...migrationWarnings);
        } catch (error) {
            errors.push({ file: jsFilePath, error: error.message });
            console.error(`❌ 转换失败: ${path.relative(PROJECT_ROOT, jsFilePath)}`);
            console.error(`   错误: ${error.message}`);
        }
    }
    
    // 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('📊 升级统计:');
    console.log(`   处理文件数: ${jsFiles.length}`);
    console.log(`   转换文件数: ${convertedCount}`);
    console.log(`   错误数: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\n❌ 错误详情:');
        errors.forEach(({ file, error }) => {
            console.log(`   ${path.relative(PROJECT_ROOT, file)}: ${error}`);
        });
    }
    
    if (convertedCount > 0) {
        console.log(`\n✅ 已转换 ${convertedCount} 个 JavaScript 文件为 TypeScript`);
        if (migrateFile) {
            console.log(`\n✅ 已应用完整的 API 迁移规则`);
        } else {
            console.log(`\n⚠️  注意: 由于无法加载 migrate.js，只应用了基础 API 替换`);
            console.log(`   建议执行: node scripts/migrate.js --dry-run 进行完整的 API 迁移`);
        }
    }
    
    console.log('');
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { convertJsToTs, getAllJsFiles };
