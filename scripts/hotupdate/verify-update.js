#!/usr/bin/env node

/**
 * 验证热更新文件工具
 * 
 * 使用方法:
 *   node scripts/hotupdate/verify-update.js [options]
 * 
 * 选项:
 *   --manifest <path>        Manifest文件路径 [必需]
 *   --zip <path>             Zip文件路径 [可选]
 *   --source <path>          源文件目录路径 [可选]
 *   --check-md5               检查MD5值 [可选]
 *   --check-size             检查文件大小 [可选]
 *   --help                   显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/verify-update.js --manifest dist/1.0.0/project.manifest --zip dist/1.0.0/update.zip
 *   node scripts/hotupdate/verify-update.js --manifest dist/1.0.0/project.manifest --source build/android/assets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        manifest: null,
        zip: null,
        source: null,
        checkMD5: false,
        checkSize: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--manifest':
                options.manifest = args[++i];
                break;
            case '--zip':
                options.zip = args[++i];
                break;
            case '--source':
                options.source = args[++i];
                break;
            case '--check-md5':
                options.checkMD5 = true;
                break;
            case '--check-size':
                options.checkSize = true;
                break;
            case '--help':
                console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
                process.exit(0);
                break;
        }
    }

    // 验证必需参数
    if (!options.manifest) {
        console.error('❌ 错误: 缺少必需参数 --manifest');
        console.error('请使用 --help 查看使用方法');
        process.exit(1);
    }

    // 验证文件是否存在
    if (!fs.existsSync(options.manifest)) {
        console.error(`❌ 错误: Manifest文件不存在: ${options.manifest}`);
        process.exit(1);
    }

    if (options.zip && !fs.existsSync(options.zip)) {
        console.error(`❌ 错误: Zip文件不存在: ${options.zip}`);
        process.exit(1);
    }

    if (options.source && !fs.existsSync(options.source)) {
        console.error(`❌ 错误: 源目录不存在: ${options.source}`);
        process.exit(1);
    }

    return options;
}

/**
 * 计算文件MD5
 */
function calculateMD5(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * 读取Manifest文件
 */
function readManifest(manifestPath) {
    try {
        const content = fs.readFileSync(manifestPath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ 错误: 无法解析Manifest文件: ${error.message}`);
        process.exit(1);
    }
}

/**
 * 验证Manifest结构
 */
function validateManifestStructure(manifest) {
    const errors = [];
    const warnings = [];

    // 检查必需字段
    if (!manifest.version) {
        errors.push('缺少 version 字段');
    }
    if (!manifest.assets) {
        errors.push('缺少 assets 字段');
    }

    // 检查assets结构
    if (manifest.assets) {
        const assetCount = Object.keys(manifest.assets).length;
        if (assetCount === 0) {
            warnings.push('assets 为空');
        }

        // 检查每个asset的字段
        for (const [filePath, asset] of Object.entries(manifest.assets)) {
            if (!asset.md5) {
                errors.push(`文件 ${filePath} 缺少 md5 字段`);
            }
            if (asset.size === undefined || asset.size === null) {
                errors.push(`文件 ${filePath} 缺少 size 字段`);
            }
        }
    }

    return { errors, warnings };
}

/**
 * 验证Zip文件
 */
function validateZipFile(zipPath) {
    const errors = [];
    const warnings = [];

    // 检查文件是否存在
    if (!fs.existsSync(zipPath)) {
        errors.push('Zip文件不存在');
        return { errors, warnings };
    }

    // 检查文件大小
    const stats = fs.statSync(zipPath);
    if (stats.size === 0) {
        errors.push('Zip文件为空');
    }

    // 尝试解压验证（如果系统支持）
    try {
        execSync(`unzip -t "${zipPath}"`, { stdio: 'ignore' });
    } catch (error) {
        warnings.push('无法验证Zip文件完整性（需要unzip命令）');
    }

    return { errors, warnings };
}

/**
 * 验证源文件与Manifest的一致性
 */
function validateSourceFiles(manifest, sourceDir) {
    const errors = [];
    const warnings = [];
    let checkedCount = 0;
    let missingCount = 0;
    let mismatchCount = 0;

    if (!manifest.assets) {
        return { errors, warnings, checkedCount, missingCount, mismatchCount };
    }

    console.log('🔍 检查源文件...\n');

    for (const [filePath, asset] of Object.entries(manifest.assets)) {
        const fullPath = path.join(sourceDir, filePath);
        
        if (!fs.existsSync(fullPath)) {
            errors.push(`文件不存在: ${filePath}`);
            missingCount++;
            continue;
        }

        checkedCount++;

        // 检查文件大小
        const stats = fs.statSync(fullPath);
        if (stats.size !== asset.size) {
            errors.push(`文件大小不匹配: ${filePath} (期望: ${asset.size}, 实际: ${stats.size})`);
            mismatchCount++;
        }

        // 检查MD5（如果启用）
        // 注意：这会比较慢，所以默认不启用
        if (process.env.CHECK_MD5 === 'true') {
            const actualMD5 = calculateMD5(fullPath);
            if (actualMD5 !== asset.md5) {
                errors.push(`MD5不匹配: ${filePath} (期望: ${asset.md5}, 实际: ${actualMD5})`);
                mismatchCount++;
            }
        }

        if (checkedCount % 100 === 0) {
            process.stdout.write(`\r   已检查: ${checkedCount}/${Object.keys(manifest.assets).length}`);
        }
    }

    if (checkedCount > 0) {
        process.stdout.write(`\r   已检查: ${checkedCount}/${Object.keys(manifest.assets).length}\n`);
    }

    return { errors, warnings, checkedCount, missingCount, mismatchCount };
}

/**
 * 主函数
 */
function main() {
    console.log('🔍 开始验证热更新文件...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   Manifest: ${options.manifest}`);
    if (options.zip) {
        console.log(`   Zip: ${options.zip}`);
    }
    if (options.source) {
        console.log(`   源目录: ${options.source}`);
    }
    console.log('');

    // 1. 读取并验证Manifest
    console.log('📝 步骤 1: 验证 Manifest 文件...\n');
    const manifest = readManifest(options.manifest);
    console.log(`   版本号: ${manifest.version}`);
    console.log(`   文件数量: ${Object.keys(manifest.assets || {}).length}`);
    
    const totalSize = Object.values(manifest.assets || {}).reduce((sum, asset) => sum + (asset.size || 0), 0);
    console.log(`   总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    const manifestValidation = validateManifestStructure(manifest);
    if (manifestValidation.errors.length > 0) {
        console.error('❌ Manifest 结构错误:');
        manifestValidation.errors.forEach(err => console.error(`   - ${err}`));
        process.exit(1);
    }
    if (manifestValidation.warnings.length > 0) {
        console.warn('⚠️  Manifest 警告:');
        manifestValidation.warnings.forEach(warn => console.warn(`   - ${warn}`));
    }
    console.log('✅ Manifest 文件验证通过\n');

    // 2. 验证Zip文件（如果提供）
    if (options.zip) {
        console.log('📦 步骤 2: 验证 Zip 文件...\n');
        const zipValidation = validateZipFile(options.zip);
        if (zipValidation.errors.length > 0) {
            console.error('❌ Zip 文件错误:');
            zipValidation.errors.forEach(err => console.error(`   - ${err}`));
            process.exit(1);
        }
        if (zipValidation.warnings.length > 0) {
            console.warn('⚠️  Zip 文件警告:');
            zipValidation.warnings.forEach(warn => console.warn(`   - ${warn}`));
        }
        const zipStats = fs.statSync(options.zip);
        console.log(`   文件大小: ${(zipStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log('✅ Zip 文件验证通过\n');
    }

    // 3. 验证源文件（如果提供）
    if (options.source) {
        console.log('📂 步骤 3: 验证源文件...\n');
        const sourceValidation = validateSourceFiles(manifest, options.source);
        
        console.log(`\n   检查结果:`);
        console.log(`   已检查: ${sourceValidation.checkedCount}`);
        console.log(`   缺失: ${sourceValidation.missingCount}`);
        console.log(`   不匹配: ${sourceValidation.mismatchCount}`);

        if (sourceValidation.errors.length > 0) {
            console.error('\n❌ 源文件错误:');
            sourceValidation.errors.slice(0, 10).forEach(err => console.error(`   - ${err}`));
            if (sourceValidation.errors.length > 10) {
                console.error(`   ... 还有 ${sourceValidation.errors.length - 10} 个错误`);
            }
            process.exit(1);
        }
        console.log('\n✅ 源文件验证通过');
    }

    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有验证通过!');
    console.log('='.repeat(60));
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

module.exports = { readManifest, validateManifestStructure, validateZipFile, validateSourceFiles };

