#!/usr/bin/env node

/**
 * 清理热更新缓存工具
 * 
 * 使用方法:
 *   node scripts/hotupdate/clean-cache.js [options]
 * 
 * 选项:
 *   --local                清理本地构建缓存 [可选]
 *   --packages            清理打包输出目录 [可选]
 *   --all                 清理所有缓存 [可选]
 *   --version <version>    清理指定版本的缓存 [可选]
 *   --dry-run             只显示将要删除的文件，不实际删除 [可选]
 *   --help                显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/clean-cache.js --all
 *   node scripts/hotupdate/clean-cache.js --version 1.0.0
 *   node scripts/hotupdate/clean-cache.js --packages --dry-run
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        local: false,
        packages: false,
        all: false,
        version: null,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--local':
                options.local = true;
                break;
            case '--packages':
                options.packages = true;
                break;
            case '--all':
                options.all = true;
                break;
            case '--version':
                options.version = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
                console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
                process.exit(0);
                break;
        }
    }

    // 如果指定了--all，则清理所有
    if (options.all) {
        options.local = true;
        options.packages = true;
    }

    // 如果都没有指定，默认清理packages
    if (!options.local && !options.packages) {
        options.packages = true;
    }

    return options;
}

/**
 * 递归删除目录
 */
function removeDir(dirPath, dryRun = false) {
    if (!fs.existsSync(dirPath)) {
        return { deleted: false, size: 0 };
    }

    let totalSize = 0;
    let fileCount = 0;

    function calculateSize(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                calculateSize(fullPath);
            } else {
                totalSize += stat.size;
                fileCount++;
            }
        }
    }

    calculateSize(dirPath);

    if (!dryRun) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }

    return { deleted: true, size: totalSize, fileCount };
}

/**
 * 清理本地构建缓存
 */
function cleanLocalCache(dryRun = false) {
    const cacheDirs = [
        path.join(process.cwd(), 'hotupdate-assets'),
        path.join(process.cwd(), 'build', 'hotupdate')
    ];

    console.log('🧹 清理本地构建缓存...\n');

    let totalSize = 0;
    let totalFiles = 0;

    for (const cacheDir of cacheDirs) {
        if (fs.existsSync(cacheDir)) {
            const { size, fileCount } = removeDir(cacheDir, dryRun);
            totalSize += size;
            totalFiles += fileCount;
            if (dryRun) {
                console.log(`   [DRY RUN] 将删除: ${cacheDir} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
            } else {
                console.log(`   ✓ 已删除: ${cacheDir} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
            }
        } else {
            console.log(`   - 不存在: ${cacheDir}`);
        }
    }

    return { totalSize, totalFiles };
}

/**
 * 清理打包输出目录
 */
function cleanPackages(version = null, dryRun = false) {
    const packagesDir = path.join(process.cwd(), 'hotupdate-packages');
    
    console.log('📦 清理打包输出目录...\n');

    if (!fs.existsSync(packagesDir)) {
        console.log(`   - 目录不存在: ${packagesDir}`);
        return { totalSize: 0, totalFiles: 0 };
    }

    let totalSize = 0;
    let totalFiles = 0;

    if (version) {
        // 清理指定版本
        const versionDir = path.join(packagesDir, version);
        if (fs.existsSync(versionDir)) {
            const { size, fileCount } = removeDir(versionDir, dryRun);
            totalSize += size;
            totalFiles += fileCount;
            if (dryRun) {
                console.log(`   [DRY RUN] 将删除: ${versionDir} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
            } else {
                console.log(`   ✓ 已删除: ${versionDir} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
            }
        } else {
            console.log(`   - 版本目录不存在: ${versionDir}`);
        }
    } else {
        // 清理所有版本
        const items = fs.readdirSync(packagesDir);
        for (const item of items) {
            const itemPath = path.join(packagesDir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                const { size, fileCount } = removeDir(itemPath, dryRun);
                totalSize += size;
                totalFiles += fileCount;
                if (dryRun) {
                    console.log(`   [DRY RUN] 将删除: ${itemPath} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
                } else {
                    console.log(`   ✓ 已删除: ${itemPath} (${fileCount} 个文件, ${(size / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
        }
    }

    return { totalSize, totalFiles };
}

/**
 * 主函数
 */
function main() {
    console.log('🧹 开始清理热更新缓存...\n');

    const options = parseArgs();
    
    if (options.dryRun) {
        console.log('⚠️  DRY RUN 模式: 只显示将要删除的文件，不会实际删除\n');
    }

    console.log('📋 清理选项:');
    if (options.local) {
        console.log('   ✓ 本地构建缓存');
    }
    if (options.packages) {
        console.log('   ✓ 打包输出目录');
        if (options.version) {
            console.log(`   版本: ${options.version}`);
        }
    }
    console.log('');

    let totalSize = 0;
    let totalFiles = 0;

    // 清理本地缓存
    if (options.local) {
        const localResult = cleanLocalCache(options.dryRun);
        totalSize += localResult.totalSize;
        totalFiles += localResult.totalFiles;
        console.log('');
    }

    // 清理打包输出
    if (options.packages) {
        const packagesResult = cleanPackages(options.version, options.dryRun);
        totalSize += packagesResult.totalSize;
        totalFiles += packagesResult.totalFiles;
        console.log('');
    }

    // 总结
    console.log('='.repeat(60));
    if (options.dryRun) {
        console.log('📊 预览结果:');
    } else {
        console.log('✅ 清理完成!');
    }
    console.log('='.repeat(60));
    console.log(`   删除文件数: ${totalFiles}`);
    console.log(`   释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (options.dryRun) {
        console.log('\n💡 提示: 使用 --dry-run=false 或移除 --dry-run 参数来实际执行清理');
    }
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

module.exports = { cleanLocalCache, cleanPackages };

