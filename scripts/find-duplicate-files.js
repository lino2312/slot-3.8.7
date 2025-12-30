#!/usr/bin/env node

/**
 * 查找项目中重名的文件
 * 列出所有文件名相同但路径不同的文件
 * 
 * 使用方法:
 *   node scripts/find-duplicate-files.js [选项]
 * 
 * 选项:
 *   --ext <扩展名>    只检查指定扩展名的文件（如：.ts, .js）
 *   --ignore-dir <目录> 忽略指定目录（可以多次使用）
 *   --output <文件>   将结果输出到指定文件（可选）
 *   --help           显示帮助信息
 */

const fs = require('fs');
const path = require('path');

// 获取项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 默认忽略的目录
const DEFAULT_IGNORE_DIRS = [
    'node_modules',
    '.git',
    'build',
    'temp',
    'library',
    'settings',
    'extensions',
    'hotupdate-assets',
    '.vscode',
    '.idea',
];

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
    extensions: [],
    ignoreDirs: [...DEFAULT_IGNORE_DIRS],
    outputFile: null,
    help: false,
};

let i = 0;
while (i < args.length) {
    const arg = args[i];
    switch (arg) {
        case '--ext':
            if (i + 1 < args.length) {
                const ext = args[i + 1];
                options.extensions.push(ext.startsWith('.') ? ext : '.' + ext);
                i += 2;
            } else {
                console.error('❌ 错误: --ext 参数需要指定扩展名');
                process.exit(1);
            }
            break;
        case '--ignore-dir':
            if (i + 1 < args.length) {
                options.ignoreDirs.push(args[i + 1]);
                i += 2;
            } else {
                console.error('❌ 错误: --ignore-dir 参数需要指定目录名');
                process.exit(1);
            }
            break;
        case '--output':
        case '-o':
            if (i + 1 < args.length) {
                options.outputFile = args[i + 1];
                i += 2;
            } else {
                console.error('❌ 错误: --output 参数需要指定输出文件路径');
                process.exit(1);
            }
            break;
        case '--help':
        case '-h':
            options.help = true;
            i++;
            break;
        default:
            console.error(`❌ 未知参数: ${arg}`);
            console.log('使用 --help 查看帮助信息');
            process.exit(1);
    }
}

if (options.help) {
    console.log(`
查找项目中重名的文件

使用方法:
  node scripts/find-duplicate-files.js [选项]

选项:
  --ext <扩展名>       只检查指定扩展名的文件（如：.ts, .js）
                      可以多次使用来指定多个扩展名
  --ignore-dir <目录>  忽略指定目录（可以多次使用）
  --output, -o <文件>  将结果输出到指定文件（可选）
  --help, -h          显示此帮助信息

示例:
  # 查找所有重名文件
  node scripts/find-duplicate-files.js

  # 只查找 .ts 和 .js 文件
  node scripts/find-duplicate-files.js --ext .ts --ext .js

  # 将结果输出到文件
  node scripts/find-duplicate-files.js --output duplicate-files.txt

  # 查找 .ts 文件并输出到文件
  node scripts/find-duplicate-files.js --ext .ts --output ts-duplicates.txt

  # 忽略特定目录
  node scripts/find-duplicate-files.js --ignore-dir dist --ignore-dir cache
    `);
    process.exit(0);
}

/**
 * 检查路径是否应该被忽略
 */
function shouldIgnore(filePath) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const parts = relativePath.split(path.sep);
    
    // 检查是否在忽略的目录中
    for (const part of parts) {
        if (options.ignoreDirs.includes(part)) {
            return true;
        }
    }
    
    return false;
}

/**
 * 检查文件扩展名是否匹配
 */
function matchesExtension(filePath) {
    if (options.extensions.length === 0) {
        return true; // 没有指定扩展名，匹配所有文件
    }
    
    const ext = path.extname(filePath);
    return options.extensions.includes(ext);
}

/**
 * 递归获取所有文件
 */
function getAllFiles(dirPath, fileMap = new Map()) {
    if (!fs.existsSync(dirPath)) {
        return fileMap;
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        // 跳过忽略的目录
        if (shouldIgnore(fullPath)) {
            continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            getAllFiles(fullPath, fileMap);
        } else if (stat.isFile()) {
            // 检查扩展名
            if (matchesExtension(fullPath)) {
                const fileName = path.basename(fullPath);
                
                if (!fileMap.has(fileName)) {
                    fileMap.set(fileName, []);
                }
                
                fileMap.get(fileName).push(fullPath);
            }
        }
    }
    
    return fileMap;
}

/**
 * 生成输出内容
 */
function generateOutput(duplicates) {
    const lines = [];
    
    lines.push('🔍 项目重名文件扫描结果');
    lines.push('生成时间: ' + new Date().toLocaleString('zh-CN'));
    lines.push('');
    
    if (options.extensions.length > 0) {
        lines.push(`📌 检查扩展名: ${options.extensions.join(', ')}`);
    }
    
    if (options.ignoreDirs.length > DEFAULT_IGNORE_DIRS.length) {
        const customIgnores = options.ignoreDirs.filter(dir => !DEFAULT_IGNORE_DIRS.includes(dir));
        if (customIgnores.length > 0) {
            lines.push(`📌 额外忽略目录: ${customIgnores.join(', ')}`);
        }
    }
    
    lines.push('');
    
    if (duplicates.length === 0) {
        lines.push('✅ 没有找到重名文件！');
    } else {
        lines.push(`📊 找到 ${duplicates.length} 个重名文件:\n`);
        lines.push('='.repeat(80));
        
        let totalFiles = 0;
        for (const dup of duplicates) {
            totalFiles += dup.count;
            lines.push(`\n📄 文件名: ${dup.fileName}`);
            lines.push(`   出现次数: ${dup.count}`);
            lines.push(`   文件路径:`);
            
            for (const filePath of dup.paths) {
                const relativePath = path.relative(PROJECT_ROOT, filePath);
                lines.push(`     - ${relativePath}`);
            }
        }
        
        lines.push('\n' + '='.repeat(80));
        lines.push(`\n📈 统计信息:`);
        lines.push(`   重名文件数: ${duplicates.length}`);
        lines.push(`   涉及文件总数: ${totalFiles}`);
        lines.push(`   重复文件数: ${totalFiles - duplicates.length}`);
    }
    
    return lines.join('\n');
}

/**
 * 主函数
 */
function main() {
    console.log('🔍 开始扫描项目中的重名文件...\n');
    
    if (options.extensions.length > 0) {
        console.log(`📌 只检查扩展名: ${options.extensions.join(', ')}`);
    }
    
    if (options.ignoreDirs.length > DEFAULT_IGNORE_DIRS.length) {
        const customIgnores = options.ignoreDirs.filter(dir => !DEFAULT_IGNORE_DIRS.includes(dir));
        if (customIgnores.length > 0) {
            console.log(`📌 额外忽略目录: ${customIgnores.join(', ')}`);
        }
    }
    
    if (options.outputFile) {
        console.log(`📝 结果将输出到: ${options.outputFile}`);
    }
    
    console.log('');
    
    // 获取所有文件
    const fileMap = getAllFiles(PROJECT_ROOT);
    
    // 找出重名文件
    const duplicates = [];
    for (const [fileName, filePaths] of fileMap.entries()) {
        if (filePaths.length > 1) {
            duplicates.push({
                fileName,
                paths: filePaths,
                count: filePaths.length
            });
        }
    }
    
    // 按文件名排序
    duplicates.sort((a, b) => a.fileName.localeCompare(b.fileName));
    
    // 生成输出内容
    const output = generateOutput(duplicates);
    
    // 输出到控制台
    console.log(output);
    
    // 如果指定了输出文件，写入文件
    if (options.outputFile) {
        try {
            const outputPath = path.isAbsolute(options.outputFile) 
                ? options.outputFile 
                : path.join(PROJECT_ROOT, options.outputFile);
            
            // 确保目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, output, 'utf8');
            console.log(`\n✅ 结果已保存到: ${path.relative(PROJECT_ROOT, outputPath)}`);
        } catch (error) {
            console.error(`\n❌ 保存文件失败: ${error.message}`);
            process.exit(1);
        }
    }
    
    console.log('');
}

// 运行主函数
main();

