#!/usr/bin/env node

/**
 * 打包热更新 Zip 文件工具
 * 
 * 使用方法:
 *   node scripts/hotupdate/package-zip.js [options]
 * 
 * 选项:
 *   --bundle <bundle>        Bundle名称 (例如: build-in, hall) [必需]
 *   --source <path>          源文件目录路径 [必需]
 *   --output <path>          输出zip文件路径 [可选]
 *   --version <version>      版本号 (用于生成默认输出路径) [可选]
 *   --exclude <pattern>      排除文件模式 (支持多个，用逗号分隔) [可选]
 *   --help                   显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/package-zip.js --bundle build-in --source build/android/assets --version 1.0.0
 *   node scripts/hotupdate/package-zip.js --bundle hall --source build/android/assets/assets/hall --output dist/hall.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查是否安装了zip命令
function checkZipCommand() {
    try {
        execSync('which zip', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// 使用Node.js的zlib和archiver（如果可用）
function checkNodeZip() {
    try {
        require.resolve('archiver');
        return true;
    } catch (error) {
        return false;
    }
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        bundle: null,
        source: null,
        output: null,
        version: null,
        exclude: []
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
            case '--output':
                options.output = args[++i];
                break;
            case '--version':
                options.version = args[++i];
                break;
            case '--exclude':
                const excludeStr = args[++i];
                options.exclude = excludeStr.split(',').map(s => s.trim());
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

    // 验证源目录是否存在
    if (!fs.existsSync(options.source)) {
        console.error(`❌ 错误: 源目录不存在: ${options.source}`);
        process.exit(1);
    }

    // 生成默认输出路径
    if (!options.output) {
        if (options.version) {
            // 根据版本生成路径
            const bundleName = options.bundle === 'build-in' ? 'update' : options.bundle;
            const outputDir = path.join(process.cwd(), 'hotupdate-packages', options.version);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            if (options.bundle === 'build-in') {
                options.output = path.join(outputDir, 'update.zip');
            } else {
                options.output = path.join(outputDir, 'assets', bundleName, `${bundleName}.zip`);
                const outputDir2 = path.dirname(options.output);
                if (!fs.existsSync(outputDir2)) {
                    fs.mkdirSync(outputDir2, { recursive: true });
                }
            }
        } else {
            // 使用当前目录
            const bundleName = options.bundle === 'build-in' ? 'update' : options.bundle;
            options.output = path.join(process.cwd(), `${bundleName}.zip`);
        }
    }

    return options;
}

/**
 * 使用系统zip命令打包
 */
function packageWithZipCommand(source, output, exclude) {
    const outputDir = path.dirname(output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 切换到源目录内部，直接打包内容，不包含目录名
    const sourcePath = path.resolve(source);
    const outputPath = path.resolve(output);

    // 构建exclude参数
    let excludeArgs = '';
    if (exclude && exclude.length > 0) {
        excludeArgs = exclude.map(pattern => `-x "${pattern}"`).join(' ');
    }

    // 执行zip命令：在源目录内部执行，使用 . 匹配所有文件，不包含目录名
    // 注意：manifest文件需要包含在zip中，以便解压后能找到
    const command = `cd "${sourcePath}" && zip -r "${outputPath}" . ${excludeArgs} -x "*.DS_Store"`;
    
    console.log(`📦 使用系统zip命令打包...`);
    execSync(command, { stdio: 'inherit' });
}

/**
 * 使用Node.js archiver打包
 */
function packageWithArchiver(source, output, exclude) {
    const archiver = require('archiver');
    const outputDir = path.dirname(output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(output);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最高压缩级别
        });

        outputStream.on('close', () => {
            console.log(`\n✅ 打包完成: ${archive.pointer()} 字节`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(outputStream);

        // 添加文件
        const sourcePath = path.resolve(source);
        // 使用 directory 方法，第二个参数设为 false 表示不包含目录名
        archive.directory(sourcePath, false, (entry) => {
            // 排除文件
            if (exclude && exclude.length > 0) {
                for (const pattern of exclude) {
                    if (entry.name.includes(pattern)) {
                        return false;
                    }
                }
            }
            // 排除隐藏文件（但保留manifest文件，因为解压后需要用到）
            if (entry.name.startsWith('.') && !entry.name.includes('project.manifest')) {
                return false;
            }
            return true;
        });

        archive.finalize();
    });
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始打包 Zip 文件...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   Bundle: ${options.bundle}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出文件: ${options.output}`);
    if (options.exclude.length > 0) {
        console.log(`   排除模式: ${options.exclude.join(', ')}`);
    }
    console.log('');

    // 检查打包工具
    let useArchiver = false;
    if (checkNodeZip()) {
        useArchiver = true;
        console.log('📦 使用 Node.js archiver 打包...');
    } else if (checkZipCommand()) {
        console.log('📦 使用系统 zip 命令打包...');
    } else {
        console.error('❌ 错误: 未找到zip打包工具');
        console.error('请安装 archiver: npm install archiver');
        console.error('或安装系统zip命令');
        process.exit(1);
    }

    try {
        if (useArchiver) {
            await packageWithArchiver(options.source, options.output, options.exclude);
        } else {
            packageWithZipCommand(options.source, options.output, options.exclude);
        }

        // 获取文件大小
        const stats = fs.statSync(options.output);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('\n✅ 打包成功!');
        console.log(`   文件路径: ${options.output}`);
        console.log(`   文件大小: ${sizeMB} MB`);
    } catch (error) {
        console.error('\n❌ 打包失败:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ 错误:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    });
}

module.exports = { packageWithArchiver, packageWithZipCommand };

