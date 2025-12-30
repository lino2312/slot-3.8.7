#!/usr/bin/env node

/**
 * 生成热更新 Manifest 文件工具
 * 
 * 使用方法:
 *   node scripts/hotupdate/generate-manifest.js [options]
 * 
 * 选项:
 *   --version <version>      版本号 [可选，默认从 Config.ts 读取]
 *   --bundle <bundle>        Bundle名称 (例如: build-in, hall) [必需]
 *   --source <path>          源文件目录路径 [必需]
 *   --output <path>          输出manifest文件路径 [可选，默认: source/project.manifest]
 *   --config <path>          配置文件路径 [可选，默认: settings/hotupdate/hot-update-template-config.json]
 *   --help                   显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/generate-manifest.js --bundle build-in --source build/android/assets
 *   # 版本号会自动从 Config.ts 中读取，如需手动指定：
 *   node scripts/hotupdate/generate-manifest.js --version 1.0.1 --bundle build-in --source build/android/assets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readHotUpdateVersion } = require('./read-config');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        version: null,
        bundle: null,
        source: null,
        output: null,
        config: path.join(__dirname, '../../settings/hotupdate/hot-update-template-config.json')
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--version':
                options.version = args[++i];
                break;
            case '--bundle':
                options.bundle = args[++i];
                break;
            case '--source':
                options.source = args[++i];
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--config':
                options.config = args[++i];
                break;
            case '--help':
                console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
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

    // 设置默认输出路径
    if (!options.output) {
        options.output = path.join(options.source, 'project.manifest');
    }

    return options;
}

/**
 * 计算文件的MD5值
 */
function calculateMD5(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * 递归获取目录下所有文件和文件夹
 */
function getAllFiles(dirPath, basePath = '') {
    const files = [];
    const directories = [];
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(basePath, item).replace(/\\/g, '/'); // 统一使用正斜杠
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 跳过隐藏目录和node_modules
            if (item.startsWith('.') || item === 'node_modules') {
                continue;
            }
            // 记录目录
            directories.push({
                path: relativePath,
                fullPath: fullPath,
                isDirectory: true
            });
            // 递归获取子目录中的文件
            const subResult = getAllFiles(fullPath, relativePath);
            files.push(...subResult.files);
            directories.push(...subResult.directories);
        } else if (stat.isFile()) {
            // 跳过隐藏文件和manifest文件
            if (!item.startsWith('.') && item !== 'project.manifest' && item !== 'version.manifest') {
                files.push({
                    path: relativePath,
                    fullPath: fullPath,
                    size: stat.size,
                    isDirectory: false
                });
            }
        }
    }

    return { files, directories };
}

/**
 * 生成manifest对象（包含完整文件结构）
 */
function generateManifest(version, files, directories, bundleName) {
    const assets = {};
    let totalSize = 0;

    console.log(`📦 处理 ${files.length} 个文件...`);

    for (const file of files) {
        try {
            const md5 = calculateMD5(file.fullPath);
            assets[file.path] = {
                md5: md5,
                size: file.size
            };
            totalSize += file.size;

            if (files.indexOf(file) % 100 === 0) {
                process.stdout.write(`\r   已处理: ${files.indexOf(file) + 1}/${files.length}`);
            }
        } catch (error) {
            console.error(`\n⚠️  警告: 无法处理文件 ${file.path}: ${error.message}`);
        }
    }

    process.stdout.write(`\r   已处理: ${files.length}/${files.length}\n`);

    // 添加目录信息（用于完整文件结构）
    const directoriesMap = {};
    for (const dir of directories) {
        directoriesMap[dir.path] = {
            isDirectory: true
        };
    }

    const manifest = {
        version: version,
        packageUrl: '',
        remoteManifestUrl: '',
        remoteVersionUrl: '',
        versionUrl: '',
        engineVersion: '3.8.0',
        assets: assets,
        directories: directoriesMap, // 添加目录信息
        searchPaths: []
    };

    return {
        manifest,
        totalSize,
        fileCount: files.length,
        directoryCount: directories.length
    };
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始生成 Manifest 文件...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   版本号: ${options.version}`);
    console.log(`   Bundle: ${options.bundle}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出文件: ${options.output}\n`);

    // 获取所有文件和目录
    console.log('📂 扫描文件和目录...');
    const { files, directories } = getAllFiles(options.source);
    console.log(`   找到 ${files.length} 个文件，${directories.length} 个目录\n`);

    if (files.length === 0) {
        console.error('❌ 错误: 源目录中没有找到文件');
        process.exit(1);
    }

    // 生成manifest
    console.log('🔨 生成 Manifest...');
    const { manifest, totalSize, fileCount, directoryCount } = generateManifest(options.version, files, directories, options.bundle);

    // 确保输出目录存在
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(options.output, JSON.stringify(manifest, null, 2), 'utf8');

    console.log('\n✅ Manifest 生成成功!');
    console.log(`   文件路径: ${options.output}`);
    console.log(`   版本号: ${manifest.version}`);
    console.log(`   文件数量: ${fileCount}`);
    console.log(`   目录数量: ${directoryCount}`);
    console.log(`   总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

// 运行
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

module.exports = { generateManifest, getAllFiles, calculateMD5 };

