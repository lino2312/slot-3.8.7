#!/usr/bin/env node

/**
 * 生成散文件目录结构工具
 * 用于非首次更新的单个文件下载
 * 
 * 使用方法:
 *   node scripts/hotupdate/generate-files.js [options]
 * 
 * 选项:
 *   --bundle <bundle>        Bundle名称 (例如: build-in, hall) [必需]
 *   --source <path>          源文件目录路径 [必需]
 *   --output-dir <path>      输出目录 [可选，默认: hotupdate-packages/{version}/files]
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
        const bundleName = options.bundle === 'build-in' ? 'update' : options.bundle;
        if (options.bundle === 'build-in') {
            options.outputDir = path.join(process.cwd(), 'hotupdate-packages', options.version, 'files');
        } else {
            options.outputDir = path.join(process.cwd(), 'hotupdate-packages', options.version, 'assets', bundleName, 'files');
        }
    }

    return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
    console.log(`
生成散文件目录结构工具

使用方法:
  node scripts/hotupdate/generate-files.js [options]

选项:
  --bundle <bundle>           Bundle名称 (例如: build-in, hall) [必需]
  --source <path>             源文件目录路径 [必需]
  --output-dir <path>         输出目录 [可选，默认: hotupdate-packages/{version}/files]
  --version <version>          版本号 [可选，默认从 Config.ts 读取]
  --help                      显示帮助信息

示例:
  # 生成散文件目录（版本号从 Config.ts 读取）
  node scripts/hotupdate/generate-files.js \
    --bundle build-in \
    --source build/android-test/assets

  # 指定版本号
  node scripts/hotupdate/generate-files.js \
    --bundle build-in \
    --source build/android-test/assets \
    --version 1.0.0
`);
}

/**
 * 生成散文件目录结构
 */
function generateFiles(files, sourceDir, outputDir, bundleName) {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let copiedCount = 0;
    let totalSize = 0;

    console.log(`📋 开始复制 ${files.length} 个文件到散文件目录...`);

    for (const file of files) {
        try {
            const sourceFile = path.join(sourceDir, file.path);
            const targetFile = path.join(outputDir, file.path);
            const targetDir = path.dirname(targetFile);

            // 确保目标目录存在
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // 复制文件
            fs.copyFileSync(sourceFile, targetFile);
            copiedCount++;
            totalSize += file.size;

            if (copiedCount % 100 === 0) {
                process.stdout.write(`\r   已复制: ${copiedCount}/${files.length}`);
            }
        } catch (error) {
            console.error(`\n⚠️  警告: 复制文件失败 ${file.path}: ${error.message}`);
        }
    }

    process.stdout.write(`\r   已复制: ${copiedCount}/${files.length}\n`);

    // 生成文件索引（用于快速查找）
    const fileIndex = {
        version: bundleName === 'build-in' ? 'update' : bundleName,
        files: files.map(f => ({
            path: f.path,
            size: f.size
        }))
    };

    const indexPath = path.join(outputDir, 'file-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(fileIndex, null, 2), 'utf8');

    return {
        outputDir,
        indexPath,
        fileCount: copiedCount,
        totalSize
    };
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始生成散文件目录结构...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   版本号: ${options.version}`);
    console.log(`   Bundle: ${options.bundle}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出目录: ${options.outputDir}`);
    console.log('');

    // 获取所有文件
    console.log('📂 扫描文件...');
    const { files } = getAllFiles(options.source);
    console.log(`   找到 ${files.length} 个文件\n`);

    if (files.length === 0) {
        console.error('❌ 错误: 源目录中没有找到文件');
        process.exit(1);
    }

    // 生成散文件目录
    console.log('🔨 生成散文件目录结构...');
    const result = generateFiles(files, options.source, options.outputDir, options.bundle);

    console.log('\n✅ 散文件目录生成成功!');
    console.log(`   文件数量: ${result.fileCount}`);
    console.log(`   总大小: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   输出目录: ${result.outputDir}`);
    console.log(`   文件索引: ${result.indexPath}`);
    console.log('');
    console.log('📤 上传到服务器:');
    console.log(`   请将 ${result.outputDir} 目录下的所有文件按路径结构上传到服务器`);
    console.log(`   例如: {hotupdateBaseUrl}/${options.version}/files/native/...`);
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

module.exports = { generateFiles };

