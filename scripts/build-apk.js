#!/usr/bin/env node

/**
 * 生成 Android APK 包工具
 * 使用方法: node scripts/build-apk.js [options]
 * 
 * 选项:
 *   --build-path <path>        构建输出路径 默认: build/android
 *   --variant <variant>        构建变体 (debug, release) 默认: release
 *   --sign                     是否签名 APK 默认: false
 *   --keystore <path>          Keystore 文件路径
 *   --keystore-password <pwd>  Keystore 密码
 *   --alias <alias>            Key alias
 *   --alias-password <pwd>     Alias 密码
 *   --help                     显示帮助信息
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    // 项目路径
    PROJECT_PATH: path.resolve(__dirname, '..'),
    // 默认构建配置
    DEFAULT_BUILD_CONFIG: {
        buildPath: 'build/android',
        variant: 'release',
        sign: false,
    }
};

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const config = { ...CONFIG.DEFAULT_BUILD_CONFIG };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--build-path':
                config.buildPath = args[++i];
                break;
            case '--variant':
                config.variant = args[++i];
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
生成 Android APK 包工具

使用方法:
  node scripts/build-apk.js [options]

选项:
  --build-path <path>           构建输出路径 默认: build/android
  --variant <variant>           构建变体 (debug, release) 默认: release
  --sign                        是否签名 APK 默认: false
  --keystore <path>             Keystore 文件路径
  --keystore-password <pwd>      Keystore 密码
  --alias <alias>               Key alias
  --alias-password <pwd>        Alias 密码
  --help                        显示帮助信息

示例:
  # 生成 Release APK
  node scripts/build-apk.js

  # 生成 Debug APK
  node scripts/build-apk.js --variant debug

  # 生成并签名 APK
  node scripts/build-apk.js --sign --keystore ./keystore.jks --keystore-password 123456 --alias mykey --alias-password 123456
`);
}

// 检查 proj 目录是否存在
function checkProjDir(buildPath) {
    const projPath = path.resolve(CONFIG.PROJECT_PATH, buildPath, 'proj');
    if (!fs.existsSync(projPath)) {
        throw new Error(`构建项目目录不存在: ${projPath}\n请先运行构建脚本生成项目文件`);
    }
    return projPath;
}

// 检查 Gradle Wrapper 是否存在
function checkGradleWrapper(projPath) {
    const gradlew = process.platform === 'win32' 
        ? path.join(projPath, 'gradlew.bat')
        : path.join(projPath, 'gradlew');
    
    if (!fs.existsSync(gradlew)) {
        throw new Error(`Gradle Wrapper 不存在: ${gradlew}`);
    }
    
    // 确保 gradlew 有执行权限
    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(gradlew, '755');
        } catch (e) {
            // 忽略权限设置错误
        }
    }
    
    return gradlew;
}

// 查找 APK 文件
function findAPK(buildPath, variant) {
    // 可能的 APK 输出路径
    // 注意: app 模块实际指向 native/engine/android/app，所以 APK 可能在以下位置
    const possiblePaths = [
        // 标准路径: proj/app/build/outputs/apk (如果 app 被复制到 proj)
        path.resolve(CONFIG.PROJECT_PATH, buildPath, 'proj', 'app', 'build', 'outputs', 'apk', variant),
        // 模板路径: native/engine/android/app/build/outputs/apk (app 模块直接引用模板)
        path.resolve(CONFIG.PROJECT_PATH, 'native', 'engine', 'android', 'app', 'build', 'outputs', 'apk', variant),
        // 项目根目录下的 native/app
        path.resolve(CONFIG.PROJECT_PATH, 'native', 'app', 'build', 'outputs', 'apk', variant),
        // proj 目录下直接查找
        path.resolve(CONFIG.PROJECT_PATH, buildPath, 'proj', 'build', 'outputs', 'apk', variant),
    ];
    
    // 递归查找 APK 文件
    const findAPKRecursive = (dir) => {
        if (!fs.existsSync(dir)) {
            return null;
        }
        
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    const apk = findAPKRecursive(filePath);
                    if (apk) return apk;
                } else if (file.endsWith('.apk')) {
                    return filePath;
                }
            }
        } catch (e) {
            // 忽略无法访问的目录
        }
        
        return null;
    };
    
    // 尝试所有可能的路径
    for (const apkDir of possiblePaths) {
        const apk = findAPKRecursive(apkDir);
        if (apk) return apk;
    }
    
    // 在整个 proj 目录下搜索
    const projPath = path.resolve(CONFIG.PROJECT_PATH, buildPath, 'proj');
    if (fs.existsSync(projPath)) {
        const apk = findAPKRecursive(projPath);
        if (apk) return apk;
    }
    
    return null;
}

// 签名 APK
function signAPK(apkPath, config) {
    if (!config.sign || !config.keystore) {
        return null;
    }
    
    const keystorePath = path.isAbsolute(config.keystore) 
        ? config.keystore 
        : path.resolve(CONFIG.PROJECT_PATH, config.keystore);
    
    if (!fs.existsSync(keystorePath)) {
        throw new Error(`Keystore 文件不存在: ${keystorePath}`);
    }
    
    const signedApkPath = apkPath.replace('.apk', '-signed.apk');
    const apksignerPath = path.join(
        process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '',
        'build-tools',
        'latest',
        'apksigner'
    );
    
    // 尝试查找 apksigner
    let apksigner = 'apksigner';
    if (fs.existsSync(apksignerPath)) {
        apksigner = apksignerPath;
    } else {
        // 尝试查找其他版本的 build-tools
        const buildToolsDir = path.join(
            process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '',
            'build-tools'
        );
        if (fs.existsSync(buildToolsDir)) {
            const versions = fs.readdirSync(buildToolsDir).sort().reverse();
            for (const version of versions) {
                const candidate = path.join(buildToolsDir, version, 'apksigner');
                if (fs.existsSync(candidate)) {
                    apksigner = candidate;
                    break;
                }
            }
        }
    }
    
    console.log('签名 APK...');
    console.log(`  Keystore: ${keystorePath}`);
    console.log(`  Alias: ${config.alias || '未指定'}`);
    
    const signCommand = [
        apksigner,
        'sign',
        '--ks', keystorePath,
        '--ks-pass', `pass:${config.keystorePassword || ''}`,
    ];
    
    if (config.alias) {
        signCommand.push('--ks-key-alias', config.alias);
    }
    
    if (config.aliasPassword) {
        signCommand.push('--key-pass', `pass:${config.aliasPassword}`);
    }
    
    signCommand.push('--out', signedApkPath, apkPath);
    
    try {
        execSync(signCommand.join(' '), {
            stdio: 'inherit',
            cwd: CONFIG.PROJECT_PATH,
        });
        console.log(`✅ APK 签名完成: ${signedApkPath}`);
        return signedApkPath;
    } catch (error) {
        console.error(`❌ APK 签名失败: ${error.message}`);
        console.error('提示: 请确保已安装 Android SDK 并配置 ANDROID_HOME 环境变量');
        throw error;
    }
}

// 执行构建
function buildAPK(config) {
    console.log('========================================');
    console.log('开始生成 Android APK');
    console.log('========================================');
    console.log('项目路径:', CONFIG.PROJECT_PATH);
    console.log('构建配置:', JSON.stringify(config, null, 2));
    console.log('');
    
    // 检查 proj 目录
    const projPath = checkProjDir(config.buildPath);
    console.log('✅ 构建项目目录存在:', projPath);
    
    // 检查 native 模板目录（app 模块可能直接引用）
    const nativeTemplatePath = path.join(CONFIG.PROJECT_PATH, 'native', 'engine', 'android');
    if (fs.existsSync(nativeTemplatePath)) {
        console.log('✅ Native 模板目录存在:', nativeTemplatePath);
        console.log('   注意: app 模块可能直接引用此目录，APK 可能在此目录下生成');
    }
    
    // 检查 Gradle Wrapper
    const gradlew = checkGradleWrapper(projPath);
    console.log('✅ Gradle Wrapper 存在:', gradlew);
    console.log('');
    
    // 构建 APK
    const variant = config.variant === 'debug' ? 'Debug' : 'Release';
    // 尝试构建所有模块的 APK，Gradle 会自动处理依赖
    const buildCommand = process.platform === 'win32'
        ? `"${gradlew}" assemble${variant}`
        : `"${gradlew}" assemble${variant}`;
    
    console.log('执行 Gradle 构建...');
    console.log(`命令: ${buildCommand}`);
    console.log(`变体: ${variant.toLowerCase()}`);
    console.log('');
    
    try {
        execSync(buildCommand, {
            stdio: 'inherit',
            cwd: projPath,
            env: {
                ...process.env,
                JAVA_HOME: process.env.JAVA_HOME,
                ANDROID_HOME: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT,
            },
        });
        
        console.log('');
        console.log('========================================');
        console.log('✅ APK 构建完成！');
        console.log('========================================');
        
        // 查找 APK 文件
        const apkPath = findAPK(config.buildPath, variant.toLowerCase());
        if (apkPath) {
            const stats = fs.statSync(apkPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ 找到 APK 文件: ${apkPath}`);
            console.log(`   APK 大小: ${sizeInMB} MB`);
            
            // 签名 APK（如果需要）
            if (config.sign) {
                try {
                    const signedApk = signAPK(apkPath, config);
                    if (signedApk) {
                        const signedStats = fs.statSync(signedApk);
                        const signedSizeInMB = (signedStats.size / (1024 * 1024)).toFixed(2);
                        console.log(`   签名 APK 大小: ${signedSizeInMB} MB`);
                    }
                } catch (error) {
                    console.warn('⚠️  APK 签名失败，但原始 APK 已生成');
                }
            }
        } else {
            console.warn('⚠️  未找到 APK 文件');
            console.warn('   请检查构建输出目录:', path.join(projPath, 'app', 'build', 'outputs', 'apk'));
        }
        
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ APK 构建失败！');
        console.error('========================================');
        console.error('错误信息:', error.message);
        console.error('');
        console.error('请检查:');
        console.error('1. Android SDK 是否正确安装');
        console.error('2. JAVA_HOME 环境变量是否正确设置');
        console.error('3. ANDROID_HOME 或 ANDROID_SDK_ROOT 环境变量是否正确设置');
        console.error('4. Gradle 构建日志中的详细错误信息');
        process.exit(1);
    }
}

// 主函数
function main() {
    const config = parseArgs();
    buildAPK(config);
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { buildAPK, parseArgs };

