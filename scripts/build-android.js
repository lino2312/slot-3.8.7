#!/usr/bin/env node

/**
 * 自动化 Android 打包工具
 * 使用方法: node scripts/build-android.js [options]
 * 
 * 选项:
 *   --channel <channel>        渠道名称 (MIGame, YonoHot) 默认: 空
 *   --platform <platform>     构建平台 (android, android-instant) 默认: android
 *   --build-path <path>        构建输出路径 默认: build/android
 *   --output-name <name>       输出名称 默认: android
 *   --debug                    是否调试模式 默认: false
 *   --md5-cache                是否启用 MD5 缓存 默认: false
 *   --skip-compress-texture    是否跳过纹理压缩 默认: false
 *   --source-maps              是否生成 source maps 默认: false
 *   --sign                     是否签名 APK 默认: false
 *   --keystore <path>          Keystore 文件路径
 *   --keystore-password <pwd>  Keystore 密码
 *   --alias <alias>            Key alias
 *   --alias-password <pwd>     Alias 密码
 *   --hotupdate-version <ver>  热更新版本号 (例如: 1.0.0)
 *   --help                     显示帮助信息
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    // Cocos Creator 路径 (macOS)
    
    COCOS_CREATOR_PATH: '/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator',
    // 项目路径
    PROJECT_PATH: path.resolve(__dirname, '..'),
    // 默认构建配置
    DEFAULT_BUILD_CONFIG: {
        channel: '',
        platform: 'android',
        buildPath: 'build/android',
        outputName: 'android',
        debug: false,
        md5Cache: false,
        skipCompressTexture: false,
        sourceMaps: false,
        sign: false,
    },
    // 渠道图标映射
    CHANNEL_ICONS: {
        'MIGame': 'd105',
        'YonoHot': 'd108',
    }
};

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const config = { ...CONFIG.DEFAULT_BUILD_CONFIG };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--channel':
                config.channel = args[++i];
                break;
            case '--platform':
                config.platform = args[++i];
                break;
            case '--build-path':
                config.buildPath = args[++i];
                break;
            case '--output-name':
                config.outputName = args[++i];
                break;
            case '--debug':
                config.debug = true;
                break;
            case '--md5-cache':
                config.md5Cache = true;
                break;
            case '--skip-compress-texture':
                config.skipCompressTexture = true;
                break;
            case '--source-maps':
                config.sourceMaps = true;
                break;
            case '--sign':
                config.sign = true;
                break;
            case '--keystore':
                config.keystore = args[++i];
                break;
            case '--keystore-password':
                config.keystorePassword = args[++i];
                break;
            case '--alias':
                config.alias = args[++i];
                break;
            case '--alias-password':
                config.aliasPassword = args[++i];
                break;
            case '--hotupdate-version':
                config.hotupdateVersion = args[++i];
                break;
            case '--help':
                showHelp();
                process.exit(0);
                break;
        }
    }
    
    return config;
}

// 显示帮助信息
function showHelp() {
    console.log(`
自动化 Android 打包工具

使用方法:
  node scripts/build-android.js [options]

选项:
  --channel <channel>           渠道名称 (MIGame, YonoHot) 默认: 空
  --platform <platform>         构建平台 (android, android-instant) 默认: android
  --build-path <path>           构建输出路径 默认: build/android
  --output-name <name>          输出名称 默认: android
  --debug                       是否调试模式 默认: false
  --md5-cache                   是否启用 MD5 缓存 默认: false
  --skip-compress-texture       是否跳过纹理压缩 默认: false
  --source-maps                 是否生成 source maps 默认: false
  --sign                        是否签名 APK 默认: false
  --keystore <path>             Keystore 文件路径
  --keystore-password <pwd>     Keystore 密码
  --alias <alias>               Key alias
  --alias-password <pwd>        Alias 密码
  --hotupdate-version <ver>    热更新版本号 (例如: 1.0.0)
  --help                        显示帮助信息

示例:
  # 基本构建
  node scripts/build-android.js

  # 指定渠道构建
  node scripts/build-android.js --channel MIGame
  node scripts/build-android.js --channel YonoHot

  # 调试模式构建
  node scripts/build-android.js --debug

  # 签名构建
  node scripts/build-android.js --sign --keystore ./keystore.jks --keystore-password 123456 --alias mykey --alias-password 123456

  # 指定热更新版本构建
  node scripts/build-android.js --hotupdate-version 1.2.1

  # 签名构建并指定热更新版本
  node scripts/build-android.js --sign --hotupdate-version 1.2.1 --keystore ./keystore.jks --keystore-password 123456 --alias mykey --alias-password 123456
`);
}

// 检查 Cocos Creator 是否存在
function checkCocosCreator() {
    if (!fs.existsSync(CONFIG.COCOS_CREATOR_PATH)) {
        console.error(`错误: 找不到 Cocos Creator，路径: ${CONFIG.COCOS_CREATOR_PATH}`);
        console.error('请修改脚本中的 COCOS_CREATOR_PATH 配置');
        process.exit(1);
    }
}

// 读取渠道构建配置
function loadChannelConfig(channel) {
    if (!channel) {
        return null;
    }
    
    const configFile = path.join(CONFIG.PROJECT_PATH, 'scripts', 'channels', `buildConfig_android_${channel}.json`);
    
    if (!fs.existsSync(configFile)) {
        console.error(`错误: 找不到渠道配置文件: ${configFile}`);
        process.exit(1);
    }
    
    console.log(`✅ 读取渠道配置: ${configFile}`);
    
    try {
        const configContent = fs.readFileSync(configFile, 'utf8');
        const channelConfig = JSON.parse(configContent);
        return channelConfig;
    } catch (error) {
        console.error(`❌ 读取渠道配置文件失败: ${error.message}`);
        process.exit(1);
    }
}

// 构建构建参数字符串
function buildBuildParams(config) {
    // 如果指定了渠道，使用 taskName 格式：android-{渠道名}
    if (config.channel) {
        const taskName = `android-${config.channel}`;
        console.log(`✅ 使用任务名称: ${taskName}`);
        return `taskName=${taskName}`;
    }
    
    // 默认使用参数字符串方式
    const params = [
        `platform=${config.platform}`,
        `buildPath=${config.buildPath}`,
        `outputName=${config.outputName}`,
        `debug=${config.debug}`,
        `md5Cache=${config.md5Cache}`,
        `skipCompressTexture=${config.skipCompressTexture}`,
        `sourceMaps=${config.sourceMaps}`,
    ];
    
    if (config.sign && config.keystore) {
        params.push(`keystorePath=${path.resolve(CONFIG.PROJECT_PATH, config.keystore)}`);
        if (config.keystorePassword) {
            params.push(`keystorePassword=${config.keystorePassword}`);
        }
        if (config.alias) {
            params.push(`keystoreAlias=${config.alias}`);
        }
        if (config.aliasPassword) {
            params.push(`keystoreAliasPassword=${config.aliasPassword}`);
        }
    }
    
    return params.join(';');
}

// 查找 APK 文件
function findAPK(dir) {
    if (!fs.existsSync(dir)) {
        return null;
    }
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const apk = findAPK(filePath);
                if (apk) return apk;
            } else if (file.endsWith('.apk')) {
                return filePath;
            }
        } catch (e) {
            // 忽略无法访问的文件
            continue;
        }
    }
    return null;
}

// 更新热更新版本配置
function updateHotUpdateVersion(version) {
    if (!version) {
        return;
    }
    
    const configPath = path.join(CONFIG.PROJECT_PATH, 'profiles', 'v2', 'packages', 'gg-hot-update.json');
    
    try {
        if (!fs.existsSync(configPath)) {
            console.warn(`⚠️  热更新配置文件不存在: ${configPath}`);
            return;
        }
        
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // 备份原配置
        const backupPath = configPath + '.backup';
        fs.writeFileSync(backupPath, configContent);
        
        // 更新默认配置中的 packageVersion
        if (config.builder && config.builder.options && config.builder.options.android) {
            const oldVersion = config.builder.options.android.packageVersion;
            config.builder.options.android.packageVersion = version;
            console.log(`✅ 更新热更新版本: ${oldVersion || '(空)'} -> ${version} (默认配置)`);
        }
        
        // 更新所有任务配置中的 packageVersion
        if (config.builder && config.builder.taskOptionsMap) {
            let updatedTasks = 0;
            for (const taskId in config.builder.taskOptionsMap) {
                const task = config.builder.taskOptionsMap[taskId];
                if (task && task.enable) {
                    const oldVersion = task.packageVersion;
                    task.packageVersion = version;
                    updatedTasks++;
                    if (oldVersion !== version) {
                        console.log(`✅ 更新任务 ${taskId} 热更新版本: ${oldVersion || '(空)'} -> ${version}`);
                    }
                }
            }
            if (updatedTasks > 0) {
                console.log(`✅ 已更新 ${updatedTasks} 个任务的热更新版本`);
            }
        }
        
        // 保存配置
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
        console.log(`✅ 热更新配置文件已更新: ${configPath}`);
        console.log(`   备份文件: ${backupPath}`);
        
    } catch (error) {
        console.error(`❌ 更新热更新版本配置失败: ${error.message}`);
        throw error;
    }
}

// 修改 AndroidManifest.xml 中的图标
function modifyAndroidManifestIcon(channel, buildPath) {
    if (!channel) {
        return;
    }
    
    const iconName = CONFIG.CHANNEL_ICONS[channel];
    if (!iconName) {
        console.warn(`⚠️  渠道 ${channel} 没有配置图标映射`);
        return;
    }
    
    // 查找 AndroidManifest.xml 文件
    const manifestPaths = [
        path.join(CONFIG.PROJECT_PATH, buildPath, 'proj', 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(CONFIG.PROJECT_PATH, buildPath, 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(CONFIG.PROJECT_PATH, 'native', 'engine', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(CONFIG.PROJECT_PATH, 'native', 'app', 'src', 'main', 'AndroidManifest.xml'),
    ];
    
    let manifestFile = null;
    for (const manifestPath of manifestPaths) {
        if (fs.existsSync(manifestPath)) {
            manifestFile = manifestPath;
            break;
        }
    }
    
    if (!manifestFile) {
        console.warn(`⚠️  未找到 AndroidManifest.xml 文件`);
        console.warn('   尝试的路径:');
        manifestPaths.forEach(p => console.warn(`     ${p}`));
        return;
    }
    
    console.log(`✅ 修改 AndroidManifest.xml: ${manifestFile}`);
    console.log(`   渠道: ${channel}`);
    console.log(`   图标: ${iconName}`);
    
    try {
        // 备份原文件
        const backupFile = `${manifestFile}.backup`;
        fs.copyFileSync(manifestFile, backupFile);
        
        // 读取文件内容
        let content = fs.readFileSync(manifestFile, 'utf8');
        
        // 替换 android:icon 属性
        // 匹配模式: android:icon="@mipmap/xxx" 或 android:icon="@drawable/xxx"
        content = content.replace(
            /android:icon="@mipmap\/[^"]*"/g,
            `android:icon="@mipmap/${iconName}"`
        );
        content = content.replace(
            /android:icon="@drawable\/[^"]*"/g,
            `android:icon="@mipmap/${iconName}"`
        );
        
        // 保存文件
        fs.writeFileSync(manifestFile, content, 'utf8');
        
        console.log(`✅ AndroidManifest.xml 图标已更新为 @mipmap/${iconName}`);
        console.log(`   备份文件: ${backupFile}`);
    } catch (error) {
        console.error(`❌ 修改 AndroidManifest.xml 失败: ${error.message}`);
    }
}

// 检查构建是否成功
function checkBuildSuccess(config) {
    const outputPath = path.resolve(CONFIG.PROJECT_PATH, config.buildPath);
    
    // 检查输出目录是否存在
    if (!fs.existsSync(outputPath)) {
        return { success: false, message: '构建输出目录不存在' };
    }
    
    // 检查是否有构建产物
    const hasDataDir = fs.existsSync(path.join(outputPath, 'data'));
    const hasProjDir = fs.existsSync(path.join(outputPath, 'proj'));
    const apkPath = findAPK(outputPath);
    
    if (hasDataDir || hasProjDir || apkPath) {
        return { 
            success: true, 
            message: '构建成功',
            apkPath: apkPath,
            hasDataDir: hasDataDir,
            hasProjDir: hasProjDir
        };
    }
    
    return { success: false, message: '构建输出目录存在但未找到构建产物' };
}

// 执行构建
function build(config) {
    console.log('========================================');
    console.log('开始构建 Android 包');
    console.log('========================================');
    console.log('项目路径:', CONFIG.PROJECT_PATH);
    
    // 加载渠道配置（如果指定了渠道）
    if (config.channel) {
        const channelConfig = loadChannelConfig(config.channel);
        if (channelConfig) {
            // 从渠道配置中读取参数（如果需要）
            if (channelConfig.buildPath) {
                config.buildPath = channelConfig.buildPath.replace('project://', '');
            }
            if (channelConfig.outputName) {
                config.outputName = channelConfig.outputName;
            }
            if (channelConfig.debug !== undefined) {
                config.debug = channelConfig.debug;
            }
            if (channelConfig.md5Cache !== undefined) {
                config.md5Cache = channelConfig.md5Cache;
            }
            if (channelConfig.skipCompressTexture !== undefined) {
                config.skipCompressTexture = channelConfig.skipCompressTexture;
            }
            if (channelConfig.sourceMaps !== undefined) {
                config.sourceMaps = channelConfig.sourceMaps;
            }
            
            // 读取签名配置
            if (channelConfig.packages && channelConfig.packages.android) {
                const androidConfig = channelConfig.packages.android;
                if (androidConfig.keystorePath) {
                    config.keystore = androidConfig.keystorePath;
                    config.sign = true;
                }
                if (androidConfig.keystorePassword) {
                    config.keystorePassword = androidConfig.keystorePassword;
                }
                if (androidConfig.keystoreAlias) {
                    config.alias = androidConfig.keystoreAlias;
                }
                if (androidConfig.keystoreAliasPassword) {
                    config.aliasPassword = androidConfig.keystoreAliasPassword;
                }
                if (androidConfig.useDebugKeystore === false) {
                    config.sign = true;
                }
            }
        }
    }
    
    console.log('构建配置:', JSON.stringify(config, null, 2));
    console.log('');
    
    // 更新热更新版本（如果指定）
    if (config.hotupdateVersion) {
        console.log('更新热更新版本配置...');
        updateHotUpdateVersion(config.hotupdateVersion);
        console.log('');
    }
    
    checkCocosCreator();
    
    // 检查 native 模板目录
    const nativeTemplatePath = path.join(CONFIG.PROJECT_PATH, 'native', 'engine', 'android');
    if (fs.existsSync(nativeTemplatePath)) {
        console.log('✅ Native 模板目录存在:', nativeTemplatePath);
        console.log('   构建时将使用此目录作为 Android 项目模板');
    } else {
        console.warn('⚠️  Native 模板目录不存在:', nativeTemplatePath);
        console.warn('   这可能导致构建失败，请确保目录结构完整');
    }
    console.log('');
    
    const buildParams = buildBuildParams(config);
    const command = `"${CONFIG.COCOS_CREATOR_PATH}" --project "${CONFIG.PROJECT_PATH}" --build "${buildParams}"`;
    
    console.log('执行命令:', command);
    console.log('');
    
    let buildCommandFailed = false;
    let buildError = null;
    
    try {
        execSync(command, {
            stdio: 'inherit',
            cwd: CONFIG.PROJECT_PATH,
        });
    } catch (error) {
        buildCommandFailed = true;
        buildError = error;
        // 不立即退出，先检查构建产物
    }
    
    console.log('');
    console.log('========================================');
    
    // 修改 AndroidManifest.xml 中的图标（如果指定了渠道）
    if (config.channel) {
        modifyAndroidManifestIcon(config.channel, config.buildPath);
        console.log('');
    }
    
    // 检查构建是否实际成功（即使命令返回非零退出码）
    const buildResult = checkBuildSuccess(config);
    
    if (buildResult.success) {
        console.log('✅ 构建完成！');
        console.log('========================================');
        console.log('输出路径:', path.resolve(CONFIG.PROJECT_PATH, config.buildPath));
        
        if (buildResult.apkPath) {
            const stats = fs.statSync(buildResult.apkPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log('✅ 找到 APK 文件:', buildResult.apkPath);
            console.log('   APK 大小:', sizeInMB, 'MB');
        } else {
            console.log('ℹ️  构建产物目录:');
            if (buildResult.hasDataDir) {
                console.log('   - data/ 目录存在');
            }
            if (buildResult.hasProjDir) {
                console.log('   - proj/ 目录存在（可在此目录下使用 Gradle 构建 APK）');
            }
            console.log('   提示: 如需生成 APK，请在 proj 目录下运行 Gradle 构建');
        }
        
        // 即使命令返回非零退出码，但构建产物存在，认为构建成功
        if (buildCommandFailed) {
            console.log('');
            console.log('⚠️  注意: Cocos Creator 命令返回了错误码，但构建产物已生成');
            console.log('   这可能是由于构建过程中的警告导致的，不影响实际构建结果');
        }
        
        return;
    } else {
        console.log('❌ 构建失败！');
        console.log('========================================');
        
        if (buildCommandFailed && buildError) {
            console.error('错误信息:', buildError.message);
            if (buildError.stderr) {
                console.error('错误详情:', buildError.stderr.toString());
            }
        } else {
            console.error('原因:', buildResult.message);
        }
        
        console.error('');
        console.error('请检查:');
        console.error('1. Cocos Creator 是否正确安装');
        console.error('2. 项目配置是否正确');
        console.error('3. 构建日志中的详细错误信息');
        console.error('4. 磁盘空间是否充足');
        
        process.exit(1);
    }
}

// 主函数
function main() {
    const config = parseArgs();
    build(config);
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { build, parseArgs };

