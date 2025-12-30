#!/usr/bin/env node

/**
 * 通用工具函数模块
 */

const fs = require('fs');
const path = require('path');
const { PROJECT_PATH, CHANNEL_BUILD_CONFIG_MAP } = require('./config');

const PUBLISH_DIR = path.join(PROJECT_PATH, 'scripts', '安卓包');

/**
 * 渠道图标映射
 */
const CHANNEL_ICONS = {
    'test': 'ic_launcher_1',
    'MIGame': 'd105',
    'YonoHot': 'd108',
};

/**
 * 查找 APK 文件
 */
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
            continue;
        }
    }
    return null;
}

/**
 * 发布 APK 到发布目录
 */
function publishAPK(apkPath, channel, variant = 'release', outputName = 'android') {
    if (!apkPath || !fs.existsSync(apkPath)) {
        return null;
    }
    
    try {
        const publishDir = path.join(PUBLISH_DIR, channel, variant);
        
        if (!fs.existsSync(publishDir)) {
            fs.mkdirSync(publishDir, { recursive: true });
        }
        
        const channelSuffix = channel && channel !== 'Default' ? `-${channel}` : '';
        const apkFileName = `${outputName}${channelSuffix}-${variant}.apk`;
        const publishPath = path.join(publishDir, apkFileName);
        
        fs.copyFileSync(apkPath, publishPath);
        
        // 复制 output-metadata.json（如果存在）
        const metadataPath = path.join(path.dirname(apkPath), 'output-metadata.json');
        if (fs.existsSync(metadataPath)) {
            const publishMetadataPath = path.join(publishDir, 'output-metadata.json');
            fs.copyFileSync(metadataPath, publishMetadataPath);
        }
        
        return {
            success: true,
            publishPath: publishPath,
            channel: channel,
            variant: variant
        };
    } catch (error) {
        console.error(`❌ 发布APK失败: ${error.message}`);
        return null;
    }
}

/**
 * 修改 AndroidManifest.xml 中的图标
 */
function modifyAndroidManifestIcon(buildConfigName, buildOutputPath) {
    if (!buildConfigName) {
        return;
    }
    
    const iconName = CHANNEL_ICONS[buildConfigName];
    if (!iconName) {
        console.warn(`⚠️  构建配置 "${buildConfigName}" 没有配置图标映射`);
        console.warn(`   当前已配置的构建配置: ${Object.keys(CHANNEL_ICONS).join(', ')}`);
        return;
    }
    
    console.log(`📝 使用图标映射: ${buildConfigName} -> ${iconName}`);
    
    // 查找 AndroidManifest.xml 文件
    const manifestPaths = [
        path.join(buildOutputPath, 'proj', 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(buildOutputPath, 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(PROJECT_PATH, 'native', 'engine', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(PROJECT_PATH, 'native', 'engine', 'android', 'app', 'AndroidManifest.xml'),
        path.join(PROJECT_PATH, 'native', 'app', 'src', 'main', 'AndroidManifest.xml'),
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
        return;
    }
    
    try {
        let manifestContent = fs.readFileSync(manifestFile, 'utf8');
        const originalContent = manifestContent;
        
        manifestContent = manifestContent.replace(
            /android:icon="@mipmap\/[^"]+"/g,
            `android:icon="@mipmap/${iconName}"`
        );
        
        if (manifestContent !== originalContent) {
            fs.writeFileSync(manifestFile, manifestContent, 'utf8');
            console.log(`✅ 已更新 AndroidManifest.xml 图标: ${iconName}`);
        }
    } catch (error) {
        console.warn(`⚠️  更新 AndroidManifest.xml 失败: ${error.message}`);
    }
}

/**
 * 更新热更新版本配置
 */
function updateHotUpdateVersion(version) {
    const configPath = path.join(PROJECT_PATH, 'profiles', 'v2', 'packages', 'gg-hot-update.json');
    
    if (!fs.existsSync(configPath)) {
        console.warn(`⚠️  警告: 找不到热更新配置文件: ${configPath}`);
        return;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        const originalContent = configContent;
        
        const backupPath = configPath + '.backup';
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        
        // 更新默认配置
        if (config.builder && config.builder.options && config.builder.options.android) {
            config.builder.options.android.packageVersion = version;
        }
        
        // 更新所有任务配置
        if (config.builder && config.builder.taskOptionsMap) {
            for (const taskId in config.builder.taskOptionsMap) {
                const task = config.builder.taskOptionsMap[taskId];
                if (task && task.enable) {
                    task.packageVersion = version;
                }
            }
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
        console.log(`✅ 热更新配置文件已更新: ${configPath}`);
    } catch (error) {
        console.error(`❌ 更新热更新版本配置失败: ${error.message}`);
        throw error;
    }
}

/**
 * 渠道到应用名称的映射
 */
const CHANNEL_APP_NAME_MAP = {
    'D105': 'MIGame',
    'D108': 'YonoHot',
    'test': 'test',
};

/**
 * 从 build.gradle 读取 applicationId（包名）
 */
function readPackageNameFromBuildGradle(buildOutputPath) {
    const buildGradlePaths = [
        path.join(buildOutputPath, 'proj', 'app', 'build.gradle'),
        path.join(buildOutputPath, 'proj', 'app', 'build.gradle.kts'),
    ];
    
    for (const buildGradlePath of buildGradlePaths) {
        if (!fs.existsSync(buildGradlePath)) {
            continue;
        }
        
        try {
            const content = fs.readFileSync(buildGradlePath, 'utf8');
            
            // 匹配 applicationId "com.game.testGame" 或 applicationId 'com.game.testGame'
            const applicationIdMatch = content.match(/applicationId\s+['"]([^'"]+)['"]/);
            if (applicationIdMatch && applicationIdMatch[1]) {
                return applicationIdMatch[1];
            }
            
            // 如果没有找到 applicationId，尝试查找 defaultConfig 中的 applicationId
            const defaultConfigMatch = content.match(/defaultConfig\s*\{[\s\S]*?applicationId\s+['"]([^'"]+)['"]/);
            if (defaultConfigMatch && defaultConfigMatch[1]) {
                return defaultConfigMatch[1];
            }
        } catch (error) {
            console.warn(`⚠️  读取 build.gradle 失败: ${buildGradlePath} - ${error.message}`);
        }
    }
    
    return null;
}

/**
 * 修改 Nbhelper.java 中的包名导入
 * 使用构建时的实际包名（从 build.gradle 读取）
 */
function modifyNbhelperPackage(buildOutputPath, channel) {
    // 从 build.gradle 读取实际的包名
    const packageName = readPackageNameFromBuildGradle(buildOutputPath);
    
    if (!packageName) {
        console.warn(`⚠️  无法从 build.gradle 读取包名，跳过修改 Nbhelper.java`);
        return;
    }
    
    console.log(`📋 从 build.gradle 读取到包名: ${packageName}`);
    
    // 查找 Nbhelper.java 文件
    const nbhelperPaths = [
        path.join(buildOutputPath, 'proj', 'app', 'src', 'main', 'java', 'com', 'cocos', 'game', 'Nbhelper.java'),
        path.join(buildOutputPath, 'proj', 'app', 'src', 'com', 'cocos', 'game', 'Nbhelper.java'),
        path.join(PROJECT_PATH, 'native', 'engine', 'android', 'app', 'src', 'com', 'cocos', 'game', 'Nbhelper.java'),
    ];
    
    let nbhelperFile = null;
    for (const nbhelperPath of nbhelperPaths) {
        if (fs.existsSync(nbhelperPath)) {
            nbhelperFile = nbhelperPath;
            break;
        }
    }
    
    if (!nbhelperFile) {
        console.warn(`⚠️  未找到 Nbhelper.java 文件`);
        return;
    }
    
    try {
        let content = fs.readFileSync(nbhelperFile, 'utf8');
        const originalContent = content;
        
        // 替换 import 语句
        // 匹配: import com.game.testGame.R; 或 import com.game.miGame.R; 或任何包名的 R
        const importPattern = /import\s+[\w.]+\.R\s*;/g;
        const newImport = `import ${packageName}.R;`;
        
        content = content.replace(importPattern, newImport);
        
        if (content !== originalContent) {
            fs.writeFileSync(nbhelperFile, content, 'utf8');
            console.log(`✅ 已更新 Nbhelper.java 包名导入: ${packageName}.R`);
        } else {
            console.log(`ℹ️  Nbhelper.java 中的包名导入已经是: ${packageName}.R`);
        }
    } catch (error) {
        console.warn(`⚠️  更新 Nbhelper.java 失败: ${error.message}`);
    }
}

/**
 * 修改 strings.xml 中的 app_name
 */
function modifyStringsAppName(buildOutputPath, channel) {
    const appName = CHANNEL_APP_NAME_MAP[channel] || channel;
    
    // 查找 strings.xml 文件
    const stringsPaths = [
        path.join(buildOutputPath, 'proj', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
        path.join(buildOutputPath, 'proj', 'res', 'values', 'strings.xml'),
        path.join(PROJECT_PATH, 'native', 'engine', 'android', 'res', 'values', 'strings.xml'),
    ];
    
    let stringsFile = null;
    for (const stringsPath of stringsPaths) {
        if (fs.existsSync(stringsPath)) {
            stringsFile = stringsPath;
            break;
        }
    }
    
    if (!stringsFile) {
        console.warn(`⚠️  未找到 strings.xml 文件`);
        return;
    }
    
    try {
        let content = fs.readFileSync(stringsFile, 'utf8');
        const originalContent = content;
        
        // 替换 app_name
        // 匹配: <string name="app_name" translatable="false">test</string>
        const appNamePattern = /<string\s+name="app_name"\s+translatable="false">[^<]+<\/string>/g;
        const newAppName = `<string name="app_name" translatable="false">${appName}</string>`;
        
        content = content.replace(appNamePattern, newAppName);
        
        if (content !== originalContent) {
            fs.writeFileSync(stringsFile, content, 'utf8');
            console.log(`✅ 已更新 strings.xml app_name: ${appName}`);
        }
    } catch (error) {
        console.warn(`⚠️  更新 strings.xml 失败: ${error.message}`);
    }
}

module.exports = {
    findAPK,
    publishAPK,
    modifyAndroidManifestIcon,
    updateHotUpdateVersion,
    modifyNbhelperPackage,
    modifyStringsAppName,
    CHANNEL_ICONS,
};

