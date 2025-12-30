#!/usr/bin/env node

/**
 * 配置管理模块
 * 负责读取和更新 Config.ts、builder.json 等配置文件
 */

const fs = require('fs');
const path = require('path');

const PROJECT_PATH = path.resolve(__dirname, '../../..');
const CONFIG_TS_PATH = path.join(PROJECT_PATH, 'assets', 'scripts', 'config', 'Config.ts');
const BUILDER_JSON_PATH = path.join(PROJECT_PATH, 'profiles', 'v2', 'packages', 'builder.json');
const BUILD_CONFIG_DIR = path.join(PROJECT_PATH, 'scripts', 'hotupdate', 'configs');

/**
 * 渠道到构建配置名称的映射
 */
const CHANNEL_BUILD_CONFIG_MAP = {
    'D105': 'MIGame',
    'D108': 'YonoHot',
    'test': 'test',
};

/**
 * 从 Config.ts 读取热更新版本号
 * 注意: 为了保持兼容性，统一使用 read-config.js 中的函数
 */
function readHotUpdateVersion() {
    // 统一使用 read-config.js 中的函数，保持兼容性
    const { readHotUpdateVersion: readVersion } = require('../read-config');
    return readVersion();
}

/**
 * 从 Config.ts 读取游戏渠道号
 */
function readGameChannel() {
    if (!fs.existsSync(CONFIG_TS_PATH)) {
        return null;
    }
    
    try {
        const configContent = fs.readFileSync(CONFIG_TS_PATH, 'utf8');
        const lines = configContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//')) {
                continue;
            }
            const match = trimmed.match(/gameChannel\s*:\s*['"]([^'"]+)['"]/);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * 更新 Config.ts 中的 gameChannel
 */
function updateGameChannel(channel) {
    if (!fs.existsSync(CONFIG_TS_PATH)) {
        console.error(`❌ 错误: Config.ts 文件不存在: ${CONFIG_TS_PATH}`);
        return false;
    }
    
    try {
        let configContent = fs.readFileSync(CONFIG_TS_PATH, 'utf8');
        const originalContent = configContent;
        const lines = configContent.split('\n');
        let found = false;
        let foundIndex = -1;
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (trimmed.startsWith('//')) {
                continue;
            }
            
            const match = trimmed.match(/gameChannel\s*:\s*['"]([^'"]+)['"]/);
            if (match) {
                found = true;
                foundIndex = i;
                currentChannel = match[1];
                break;
            }
        }
        
        if (!found || foundIndex === -1) {
            console.error('❌ 错误: 在 Config.ts 中未找到 gameChannel 配置');
            return false;
        }
        
        if (currentChannel === channel) {
            return true;
        }
        
        const originalLine = lines[foundIndex];
        const quoteStyle = originalLine.includes("'") ? "'" : '"';
        lines[foundIndex] = originalLine.replace(
            /gameChannel\s*:\s*['"]([^'"]+)['"]/,
            `gameChannel: ${quoteStyle}${channel}${quoteStyle}`
        );
        
        configContent = lines.join('\n');
        const backupPath = CONFIG_TS_PATH + '.backup';
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        fs.writeFileSync(CONFIG_TS_PATH, configContent, 'utf8');
        
        console.log(`✅ 已更新 Config.ts 中的 gameChannel: ${currentChannel} -> ${channel}`);
        console.log(`   备份文件: ${backupPath}`);
        
        return true;
    } catch (error) {
        console.error(`❌ 错误: 更新 Config.ts 失败: ${error.message}`);
        return false;
    }
}

/**
 * 将 gameChannel 映射到构建配置名称
 */
function getBuildConfigName(channel) {
    return CHANNEL_BUILD_CONFIG_MAP[channel] || channel;
}

/**
 * 从 builder.json 读取构建配置
 */
function loadBuildConfig(buildConfigName, platform = 'android') {
    if (!buildConfigName) {
        return null;
    }
    
    if (!fs.existsSync(BUILDER_JSON_PATH)) {
        console.error(`❌ 错误: 找不到 builder.json 文件: ${BUILDER_JSON_PATH}`);
        return null;
    }
    
    try {
        const builderContent = fs.readFileSync(BUILDER_JSON_PATH, 'utf8');
        const builderConfig = JSON.parse(builderContent);
        
        const taskName = `${platform}-${buildConfigName}`;
        
        if (!builderConfig.BuildTaskManager || !builderConfig.BuildTaskManager.taskMap) {
            console.error(`❌ 错误: builder.json 中没有 BuildTaskManager.taskMap`);
            return null;
        }
        
        const taskMap = builderConfig.BuildTaskManager.taskMap;
        
        for (const taskId in taskMap) {
            const task = taskMap[taskId];
            if (task.options && task.options.taskName === taskName) {
                return task.options;
            }
        }
        
        console.error(`❌ 错误: 在 builder.json 中找不到 taskName 为 "${taskName}" 的构建配置`);
        return null;
    } catch (error) {
        console.error(`❌ 读取 builder.json 失败: ${error.message}`);
        return null;
    }
}

/**
 * 查找构建配置文件
 */
function findBuildConfigFile(configFileName, platform, channel) {
    const buildConfigName = getBuildConfigName(channel);
    const fileName = `${configFileName}_${platform}_${buildConfigName}.json`;
    const filePath = path.join(BUILD_CONFIG_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    
    return null;
}

/**
 * 更新构建配置文件中的热更新版本号
 */
function updateBuildConfigPackageVersion(channel, platform, version) {
    const buildConfigName = getBuildConfigName(channel);
    const configFileName = 'buildConfig'; // 默认配置文件名
    const configPath = findBuildConfigFile(configFileName, platform, channel);
    
    if (!configPath) {
        console.warn(`⚠️  警告: 找不到构建配置文件: ${configFileName}_${platform}_${buildConfigName}.json`);
        return false;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // 更新 packages.gg-hot-update.packageVersion
        if (!config.packages) {
            config.packages = {};
        }
        if (!config.packages['gg-hot-update']) {
            config.packages['gg-hot-update'] = {};
        }
        
        const oldVersion = config.packages['gg-hot-update'].packageVersion;
        config.packages['gg-hot-update'].packageVersion = version;
        
        // 保存文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        if (oldVersion !== version) {
            console.log(`✅ 已更新构建配置文件中的热更新版本: ${oldVersion || '(未设置)'} -> ${version}`);
            console.log(`   配置文件: ${configPath}`);
        } else {
            console.log(`ℹ️  构建配置文件中的热更新版本已是最新: ${version}`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ 更新构建配置文件失败: ${error.message}`);
        return false;
    }
}

module.exports = {
    PROJECT_PATH,
    CONFIG_TS_PATH,
    BUILDER_JSON_PATH,
    BUILD_CONFIG_DIR,
    CHANNEL_BUILD_CONFIG_MAP,
    readHotUpdateVersion,
    readGameChannel,
    updateGameChannel,
    getBuildConfigName,
    loadBuildConfig,
    findBuildConfigFile,
    updateBuildConfigPackageVersion,
};

