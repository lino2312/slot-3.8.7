#!/usr/bin/env node

/**
 * 生成文件列表工具
 * 生成完整的文件结构列表，包括文件夹、zip文件和散文件
 * 
 * 使用方法:
 *   node scripts/hotupdate/generate-file-list.js [options]
 * 
 * 选项:
 *   --bundle <bundle>        Bundle名称 (例如: build-in, hall) [必需]
 *   --source <path>          源文件目录路径 [必需]
 *   --output-dir <path>      输出目录 [可选，默认: hotupdate-packages/{version}/file-list]
 *   --version <version>      版本号 [可选，默认从 Config.ts 读取]
 *   --help                   显示帮助信息
 */

const fs = require('fs');
const path = require('path');
const { readHotUpdateVersion } = require('./read-config');
const { getAllFiles } = require('./generate-manifest');

/**
 * 解析命令行参数
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        bundle: null,
        source: null,
        outputDir: null,
        version: null,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--bundle':
                options.bundle = args[++i];
                break;
            case '--source':
                options.source = args[++i];
                break;
            case '--output-dir':
                options.outputDir = args[++i];
                break;
            case '--version':
                options.version = args[++i];
                break;
            case '--help':
                showHelp();
                process.exit(0);
                break;
        }
    }

    // 验证必需参数
    if (!options.bundle || !options.source) {
        console.error('❌ 错误: 缺少必需参数');
        console.error('请使用 --help 查看使用方法');
        process.exit(1);
    }

    // 如果没有指定版本号，从 Config.ts 读取
    if (!options.version) {
        options.version = readHotUpdateVersion();
        if (!options.version) {
            console.error('❌ 错误: 无法从 Config.ts 读取热更新版本号');
            console.error('请在 Config.ts 中配置 hotupdate_version，或使用 --version 参数指定');
            process.exit(1);
        }
        console.log(`📋 从 Config.ts 读取到版本号: ${options.version}`);
    }

    // 验证源目录是否存在
    if (!fs.existsSync(options.source)) {
        console.error(`❌ 错误: 源目录不存在: ${options.source}`);
        process.exit(1);
    }

    // 设置默认输出目录
    if (!options.outputDir) {
        options.outputDir = path.join(process.cwd(), 'hotupdate-packages', options.version, 'file-list');
    }

    return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
    console.log(`
生成文件列表工具

使用方法:
  node scripts/hotupdate/generate-file-list.js [options]

选项:
  --bundle <bundle>           Bundle名称 (例如: build-in, hall) [必需]
  --source <path>             源文件目录路径 [必需]
  --output-dir <path>         输出目录 [可选，默认: hotupdate-packages/{version}/file-list]
  --version <version>         版本号 [可选，默认从 Config.ts 读取]
  --help                      显示帮助信息

示例:
  # 生成文件列表（版本号从 Config.ts 读取）
  node scripts/hotupdate/generate-file-list.js \
    --bundle build-in \
    --source build/android-test/assets

  # 指定版本号
  node scripts/hotupdate/generate-file-list.js \
    --bundle build-in \
    --source build/android-test/assets \
    --version 1.0.0
`);
}

/**
 * 生成文件列表
 */
function generateFileList(files, directories, outputDir, bundleName) {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. 生成完整文件结构列表（包括文件夹）
    const fileStructure = {
        directories: directories.map(d => ({
            path: d.path,
            type: 'directory'
        })),
        files: files.map(f => ({
            path: f.path,
            size: f.size,
            type: 'file'
        }))
    };

    const structurePath = path.join(outputDir, 'file-structure.json');
    fs.writeFileSync(structurePath, JSON.stringify(fileStructure, null, 2), 'utf8');
    console.log(`✅ 文件结构列表已生成: ${structurePath}`);

    // 2. 生成散文件列表（用于增量更新）
    const fileList = {
        files: files.map(f => ({
            path: f.path,
            size: f.size
        }))
    };

    const fileListPath = path.join(outputDir, 'file-list.json');
    fs.writeFileSync(fileListPath, JSON.stringify(fileList, null, 2), 'utf8');
    console.log(`✅ 散文件列表已生成: ${fileListPath}`);

    // 3. 生成文本格式的文件列表（便于查看）
    const textList = [];
    textList.push('# 目录结构');
    textList.push('');
    for (const dir of directories) {
        textList.push(`${dir.path}/`);
    }
    textList.push('');
    textList.push('# 文件列表');
    textList.push('');
    for (const file of files) {
        const sizeKB = (file.size / 1024).toFixed(2);
        textList.push(`${file.path} (${sizeKB} KB)`);
    }

    const textListPath = path.join(outputDir, 'file-list.txt');
    fs.writeFileSync(textListPath, textList.join('\n'), 'utf8');
    console.log(`✅ 文本文件列表已生成: ${textListPath}`);

    return {
        structurePath,
        fileListPath,
        textListPath,
        fileCount: files.length,
        directoryCount: directories.length
    };
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始生成文件列表...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   版本号: ${options.version}`);
    console.log(`   Bundle: ${options.bundle}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出目录: ${options.outputDir}`);
    console.log('');

    // 获取所有文件和目录
    console.log('📂 扫描文件和目录...');
    const { files, directories } = getAllFiles(options.source);
    console.log(`   找到 ${files.length} 个文件，${directories.length} 个目录\n`);

    if (files.length === 0) {
        console.error('❌ 错误: 源目录中没有找到文件');
        process.exit(1);
    }

    // 生成文件列表
    console.log('🔨 生成文件列表...');
    const result = generateFileList(files, directories, options.outputDir, options.bundle);

    console.log('\n✅ 文件列表生成成功!');
    console.log(`   文件数量: ${result.fileCount}`);
    console.log(`   目录数量: ${result.directoryCount}`);
    console.log(`   输出目录: ${options.outputDir}`);
    console.log('');
    console.log('📁 生成的文件:');
    console.log(`   - 文件结构: ${result.structurePath}`);
    console.log(`   - 散文件列表: ${result.fileListPath}`);
    console.log(`   - 文本列表: ${result.textListPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('\n❌ 错误:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

module.exports = { generateFileList };

