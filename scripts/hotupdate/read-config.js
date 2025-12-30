#!/usr/bin/env node

/**
 * 从 Config.ts 读取和更新配置的工具函数
 * 
 * 使用方法:
 *   const { readHotUpdateVersion, readGameChannel, updateGameChannel } = require('./read-config');
 *   const version = readHotUpdateVersion();
 *   const channel = readGameChannel();
 *   updateGameChannel('D105');  // 更新渠道
 */

const fs = require('fs');
const path = require('path');

/**
 * 从 Config.ts 读取热更新版本号
 * @returns {string|null} 版本号，如果读取失败返回 null
 */
function readHotUpdateVersion() {
    const configPath = path.join(__dirname, '../../assets/scripts/config/Config.ts');
    
    if (!fs.existsSync(configPath)) {
        console.error(`❌ 错误: Config.ts 文件不存在: ${configPath}`);
        return null;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // 使用正则表达式匹配 hotupdate_version
        // 匹配: hotupdate_version: '1.0.0' 或 hotupdate_version: "1.0.0"
        const match = configContent.match(/hotupdate_version\s*:\s*['"]([^'"]+)['"]/);
        
        if (match && match[1]) {
            return match[1];
        }
        
        console.warn('⚠️  警告: 在 Config.ts 中未找到 hotupdate_version 配置');
        return null;
    } catch (error) {
        console.error(`❌ 错误: 读取 Config.ts 失败: ${error.message}`);
        return null;
    }
}

/**
 * 从 Config.ts 读取游戏渠道号
 * @returns {string|null} 渠道号，如果读取失败返回 null
 */
function readGameChannel() {
    const configPath = path.join(__dirname, '../../assets/scripts/config/Config.ts');
    
    if (!fs.existsSync(configPath)) {
        return null;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // 匹配 gameChannel: "D105" 或 gameChannel: 'test'
        // 优先匹配未注释的行
        const lines = configContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // 跳过注释行
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
 * 从 Config.ts 读取热更新基础URL
 * @returns {string|null} 基础URL，如果读取失败返回 null
 */
function readHotUpdateBaseUrl() {
    const configPath = path.join(__dirname, '../../assets/scripts/config/Config.ts');
    
    if (!fs.existsSync(configPath)) {
        return null;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // 先读取 gameChannel
        const gameChannel = readGameChannel();
        if (!gameChannel) {
            return null;
        }
        
        // 读取 ENV_CONFIG 中对应环境的 hotupdateBaseUrl
        const envConfigRegex = new RegExp(
            `${gameChannel}\\s*:\\s*\\{[\\s\\S]*?hotupdateBaseUrl\\s*:\\s*['"]([^'"]+)['"]`,
            'm'
        );
        const match = configContent.match(envConfigRegex);
        
        if (match && match[1]) {
            return match[1];
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * 更新 Config.ts 中的 gameChannel
 * @param {string} channel 新的渠道号
 * @returns {boolean} 是否更新成功
 */
function updateGameChannel(channel) {
    const configPath = path.join(__dirname, '../../assets/scripts/config/Config.ts');
    
    if (!fs.existsSync(configPath)) {
        console.error(`❌ 错误: Config.ts 文件不存在: ${configPath}`);
        return false;
    }
    
    try {
        let configContent = fs.readFileSync(configPath, 'utf8');
        const originalContent = configContent;
        
        // 查找并替换 gameChannel
        // 匹配: gameChannel: "D105" 或 gameChannel: 'test'
        // 需要处理注释掉的行
        const lines = configContent.split('\n');
        let found = false;
        let foundIndex = -1;
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // 跳过注释行
            if (trimmed.startsWith('//')) {
                continue;
            }
            
            // 匹配 gameChannel 行
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
            // 已经是目标渠道，无需更新
            return true;
        }
        
        // 替换 gameChannel 值（保持原有的引号风格）
        const originalLine = lines[foundIndex];
        const quoteStyle = originalLine.includes("'") ? "'" : '"';
        lines[foundIndex] = originalLine.replace(
            /gameChannel\s*:\s*['"]([^'"]+)['"]/,
            `gameChannel: ${quoteStyle}${channel}${quoteStyle}`
        );
        
        configContent = lines.join('\n');
        
        // 备份原文件
        const backupPath = configPath + '.backup';
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        
        // 写入新内容
        fs.writeFileSync(configPath, configContent, 'utf8');
        
        console.log(`✅ 已更新 Config.ts 中的 gameChannel: ${currentChannel} -> ${channel}`);
        console.log(`   备份文件: ${backupPath}`);
        
        return true;
    } catch (error) {
        console.error(`❌ 错误: 更新 Config.ts 失败: ${error.message}`);
        return false;
    }
}

// 如果直接运行，输出版本号
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === '--channel') {
        const channel = readGameChannel();
        if (channel) {
            console.log(channel);
        } else {
            process.exit(1);
        }
    } else {
        const version = readHotUpdateVersion();
        if (version) {
            console.log(version);
        } else {
            process.exit(1);
        }
    }
}

module.exports = {
    readHotUpdateVersion,
    readGameChannel,
    readHotUpdateBaseUrl,
    updateGameChannel
};
