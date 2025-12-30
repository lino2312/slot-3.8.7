#!/usr/bin/env node

/**
 * 批量构建所有Bundle的热更新包
 * 
 * 使用方法:
 *   node scripts/hotupdate/build-all-bundles.js [options]
 * 
 * 选项:
 *   --version <version>      版本号 [可选，默认从 Config.ts 读取]
 *   --source <path>          源文件目录路径 (build输出目录) [必需]
 *   --output-dir <path>      输出目录 [可选，默认: hotupdate-packages/{version}]
 *   --bundles <list>         要构建的Bundle列表，用逗号分隔 [可选，默认: 所有]
 *   --config <path>          配置文件路径 [可选]
 *   --parallel               并行构建 [可选]
 *   --help                   显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/build-all-bundles.js --source build/android/assets
 *   # 版本号会自动从 Config.ts 中读取，如需手动指定：
 *   node scripts/hotupdate/build-all-bundles.js --version 1.0.1 --source build/android/assets --bundles build-in,hall
 */

const fs = require('fs');
const path = require('path');
const { readHotUpdateVersion } = require('./read-config');
const { readGameChannel } = require('./read-config');
const { buildBundle } = require('./build-hotupdate');
const { getBuildConfigName, loadBuildConfig, CHANNEL_BUILD_CONFIG_MAP } = require('./lib/config');

/**
 * 判断是否为子游戏bundle
 * 子游戏：JungleDelight, ThePanda, Diamond777, Crazy777I, GemsFrotuneI, GemsFrotuneII, Super777I, MoneyComing
 */
function isSubGame(bundleName) {
    const subGames = ['JungleDelight', 'ThePanda', 'Diamond777', 'Crazy777I', 'GemsFrotuneI', 'GemsFrotuneII', 'Super777I', 'MoneyComing'];
    return subGames.includes(bundleName);
}

// 导出 isSubGame 函数供其他脚本使用
module.exports.isSubGame = isSubGame;

// 读取配置文件
function loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
        console.error(`❌ 错误: 配置文件不存在: ${configPath}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        version: null,
        channel: null,
        source: null,
        outputDir: null,
        bundles: null,
        config: path.join(__dirname, '../../settings/hotupdate/hot-update-template-config.json'),
        parallel: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--version':
                options.version = args[++i];
                break;
            case '--channel':
                options.channel = args[++i];
                break;
            case '--source':
                options.source = args[++i];
                break;
            case '--output-dir':
                options.outputDir = args[++i];
                break;
            case '--bundles':
                options.bundles = args[++i].split(',').map(s => s.trim());
                break;
            case '--config':
                options.config = args[++i];
                break;
            case '--parallel':
                options.parallel = true;
                break;
            case '--help':
                console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
                process.exit(0);
                break;
        }
    }

    // 如果没有指定source，尝试自动检测
    if (!options.source) {
        let channelToUse = options.channel;
        
        // 如果没有指定 channel，尝试从 Config.ts 读取 gameChannel
        if (!channelToUse) {
            channelToUse = readGameChannel();
        }
        
        if (channelToUse) {
            const buildConfigName = getBuildConfigName(channelToUse);
            if (buildConfigName) {
                try {
                    const buildConfig = loadBuildConfig(buildConfigName, 'android');
                    if (buildConfig && buildConfig.outputName) {
                        // 构建输出路径: build/{outputName}/assets/
                        const autoSource = path.join(process.cwd(), 'build', buildConfig.outputName, 'assets');
                        if (fs.existsSync(autoSource)) {
                            options.source = autoSource;
                            console.log(`📋 通过渠道 ${channelToUse} 自动检测到构建输出路径: ${options.source}`);
                        } else {
                            console.warn(`⚠️  警告: 构建输出目录不存在: ${autoSource}`);
                            console.warn(`   请确保已运行构建脚本生成该目录`);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️  警告: 无法读取构建配置: ${error.message}`);
                }
            } else {
                console.warn(`⚠️  警告: 渠道 ${channelToUse} 没有对应的构建配置`);
            }
        }
        
        // 如果自动检测失败，报错
        if (!options.source) {
            console.error('❌ 错误: 无法自动检测构建输出路径');
            console.error('');
            console.error('   请使用以下方式之一:');
            console.error('   1. 指定渠道: --channel test');
            console.error('   2. 手动指定源目录: --source build/android-test/assets');
            console.error('');
            console.error('   或者确保:');
            console.error('   1. Config.ts 中配置了 gameChannel');
            console.error('   2. builder.json 中有对应的构建配置');
            console.error('   3. 构建输出目录存在');
            process.exit(1);
        }
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
        options.outputDir = path.join(process.cwd(), 'hotupdate-packages', options.version);
    }

    return options;
}

/**
 * 获取要构建的Bundle列表
 */
function getBundlesToBuild(options) {
    const config = loadConfig(options.config);
    const remoteBundles = Object.keys(config.remote_bundles || {});

    if (options.bundles) {
        // 使用指定的Bundle列表
        const invalidBundles = options.bundles.filter(b => !remoteBundles.includes(b));
        if (invalidBundles.length > 0) {
            console.warn(`⚠️  警告: 以下Bundle不在配置中: ${invalidBundles.join(', ')}`);
        }
        return options.bundles.filter(b => remoteBundles.includes(b));
    } else {
        // 使用所有远程Bundle
        return remoteBundles;
    }
}

/**
 * 获取Bundle的源路径
 */
function getBundleSourcePath(bundleName, baseSource, version) {
    if (bundleName === 'build-in') {
        return baseSource;
    } else {
        // 首先尝试从构建输出目录查找
        const buildOutputPath = path.join(baseSource, 'assets', bundleName);
        if (fs.existsSync(buildOutputPath)) {
            return buildOutputPath;
        }
        
        // 如果构建输出目录中不存在，尝试从 hotupdate-assets 目录查找
        if (version) {
            const hotupdateAssetsPath = path.join(process.cwd(), 'hotupdate-assets', version, 'android', 'assets', bundleName);
            if (fs.existsSync(hotupdateAssetsPath)) {
                console.log(`   ℹ️  Bundle ${bundleName} 在 hotupdate-assets/${version}/android/assets/ 中找到`);
                return hotupdateAssetsPath;
            }
        }
        
        // 返回默认路径（即使不存在，让调用者处理错误）
        return buildOutputPath;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始批量构建热更新包...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   版本号: ${options.version}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出目录: ${options.outputDir}`);
    console.log('');

    // 获取要构建的Bundle列表
    const bundles = getBundlesToBuild(options);
    console.log(`📦 将构建 ${bundles.length} 个Bundle: ${bundles.join(', ')}\n`);

    const results = [];
    const errors = [];

    // 构建每个Bundle
    for (const bundleName of bundles) {
        try {
            const bundleSource = getBundleSourcePath(bundleName, options.source, options.version);
            
            // 检查源目录是否存在
            if (!fs.existsSync(bundleSource)) {
                console.warn(`⚠️  警告: Bundle ${bundleName} 的源目录不存在: ${bundleSource}`);
                // 尝试从 hotupdate-assets 查找
                if (options.version) {
                    const hotupdateAssetsPath = path.join(process.cwd(), 'hotupdate-assets', options.version, 'android', 'assets', bundleName);
                    if (fs.existsSync(hotupdateAssetsPath)) {
                        console.log(`   ℹ️  在 hotupdate-assets/${options.version}/android/assets/ 中找到，使用该路径`);
                        
                        const result = await buildBundle({
                            version: options.version,
                            bundle: bundleName,
                            source: hotupdateAssetsPath,
                            outputDir: options.outputDir,
                            skipManifest: false,
                            skipZip: isSubGame(bundleName), // 子游戏跳过zip打包，只生成散文件
                            config: options.config
                        });
                        
                        results.push({
                            bundle: bundleName,
                            success: true,
                            manifestPath: result.manifestPath,
                            zipPath: result.zipPath,
                            isSubGame: isSubGame(bundleName)
                        });
                        continue;
                    }
                }
                errors.push({ bundle: bundleName, error: '源目录不存在' });
                continue;
            }

            // 子游戏只生成散文件（不生成zip），其他bundle生成zip和散文件
            // 子游戏使用散文件更新策略
            const result = await buildBundle({
                version: options.version,
                bundle: bundleName,
                source: bundleSource,
                outputDir: options.outputDir,
                skipManifest: false,
                skipZip: isSubGame(bundleName), // 子游戏跳过zip打包，只生成散文件
                config: options.config
            });

            results.push({
                bundle: bundleName,
                success: true,
                manifestPath: result.manifestPath,
                zipPath: result.zipPath,
                isSubGame: isSubGame(bundleName)
            });
        } catch (error) {
            console.error(`\n❌ Bundle ${bundleName} 构建失败: ${error.message}`);
            errors.push({ bundle: bundleName, error: error.message });
        }
    }

    // 输出总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 构建总结');
    console.log('='.repeat(60));
    console.log(`\n✅ 成功: ${results.length} 个`);
    if (results.length > 0) {
        console.log('\n成功构建的Bundle:');
        results.forEach(r => {
            console.log(`   ✓ ${r.bundle}${r.isSubGame ? ' (子游戏)' : ''}`);
            if (r.zipPath) {
                const stats = fs.statSync(r.zipPath);
                console.log(`      Zip: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            }
        });
    }

    if (errors.length > 0) {
        console.log(`\n❌ 失败: ${errors.length} 个`);
        console.log('\n失败的Bundle:');
        errors.forEach(e => {
            console.log(`   ✗ ${e.bundle}: ${e.error}`);
        });
        
        // 检查是否有其他bundle在源目录中但不在配置中
        if (options.source && fs.existsSync(options.source)) {
            const assetsDir = path.join(options.source, 'assets');
            if (fs.existsSync(assetsDir)) {
                const actualBundles = fs.readdirSync(assetsDir).filter(item => {
                    const itemPath = path.join(assetsDir, item);
                    return fs.statSync(itemPath).isDirectory();
                });
                
                const configuredBundles = bundles.filter(b => b !== 'build-in');
                const unconfiguredBundles = actualBundles.filter(b => !configuredBundles.includes(b));
                
                if (unconfiguredBundles.length > 0) {
                    console.log(`\n⚠️  发现 ${unconfiguredBundles.length} 个其他Bundle在源目录中但未在配置中:`);
                    unconfiguredBundles.forEach(b => {
                        console.log(`   - ${b} (位于 ${path.join(assetsDir, b)})`);
                    });
                    console.log(`\n💡 提示: 如果这些Bundle需要构建，请:`);
                    console.log(`   1. 将它们添加到配置文件的 remote_bundles 中`);
                    console.log(`   2. 或使用 --bundles 参数指定要构建的Bundle列表`);
                }
            }
        }
    }

    console.log(`\n📤 上传到服务器:`);
    console.log(`   请根据 ENV_CONFIG 中配置的 hotupdateBaseUrl 上传文件`);
    console.log(`   路径: {hotupdateBaseUrl}/${options.version}/`);
    console.log(`   注意: hotupdateBaseUrl 从 Config.ts 的 ENV_CONFIG 中读取`);

    // 如果有错误，退出码为1
    if (errors.length > 0) {
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { getBundlesToBuild, getBundleSourcePath, isSubGame };

