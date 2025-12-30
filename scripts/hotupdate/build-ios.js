#!/usr/bin/env node

/**
 * 生成 iOS IPA 包工具
 * 使用方法: node scripts/hotupdate/build-ios.js [options]
 * 
 * 选项:
 *   --build-path <path>        构建输出路径 默认: build/ios
 *   --channel <channel>        渠道名称 默认: 从 Config.ts 读取
 *   --help                     显示帮助信息
 * 
 * 注意: iOS构建需要在macOS上使用Xcode完成，此脚本主要用于发布已构建的IPA文件
 */

const fs = require('fs');
const path = require('path');
const { readGameChannel, updateGameChannel } = require('./read-config');

// 配置
const CONFIG = {
    // 项目路径
    PROJECT_PATH: path.resolve(__dirname, '..'),
    // 发布目录（与Android共用）
    PUBLISH_DIR: path.resolve(__dirname, '..', '安卓包'),
    // 默认构建配置
    DEFAULT_BUILD_CONFIG: {
        buildPath: 'build/ios',
        channel: '',
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
            case '--channel':
                config.channel = args[++i];
                break;
            case '--help':
                showHelp();
                process.exit(0);
                break;
        }
    }
    
    // 渠道处理逻辑
    if (config.channel) {
        // 如果指定了渠道，更新 Config.ts 中的 gameChannel
        const currentChannel = readGameChannel();
        if (currentChannel !== config.channel) {
            console.log(`\n📝 检测到渠道变更: ${currentChannel || '(未配置)'} -> ${config.channel}`);
            console.log('   正在更新 Config.ts 中的 gameChannel...');
            const updated = updateGameChannel(config.channel);
            if (updated) {
                console.log('   ✅ Config.ts 已更新，代码将使用新的渠道配置\n');
            } else {
                console.warn('   ⚠️  更新 Config.ts 失败，请手动修改 gameChannel\n');
            }
        } else {
            console.log(`📋 渠道已匹配: ${config.channel}`);
        }
    } else {
        // 如果没有指定渠道，从 Config.ts 读取
        const gameChannel = readGameChannel();
        if (gameChannel) {
            config.channel = gameChannel;
            console.log(`📋 从 Config.ts 读取到渠道: ${gameChannel}`);
        } else {
            config.channel = 'Default';
        }
    }
    
    return config;
}

// 显示帮助信息
function showHelp() {
    console.log(`
生成 iOS IPA 包工具

使用方法:
  node scripts/hotupdate/build-ios.js [options]

选项:
  --build-path <path>           构建输出路径 默认: build/ios
  --channel <channel>           渠道名称 默认: 从 Config.ts 读取
  --help                        显示帮助信息

注意:
  iOS构建需要在macOS上使用Xcode完成，此脚本主要用于发布已构建的IPA文件到发布目录。

示例:
  # 发布iOS包（渠道从 Config.ts 读取）
  node scripts/hotupdate/build-ios.js

  # 指定构建路径和渠道
  node scripts/hotupdate/build-ios.js --build-path build/ios --channel Test
`);
}

// 查找IPA文件
function findIPA(dir) {
    if (!fs.existsSync(dir)) {
        return null;
    }
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const ipa = findIPA(filePath);
                if (ipa) return ipa;
            } else if (file.endsWith('.ipa')) {
                return filePath;
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

// 发布IPA到发布目录
function publishIPA(ipaPath, config) {
    if (!ipaPath || !fs.existsSync(ipaPath)) {
        return null;
    }
    
    try {
        // 确定发布目录结构: 安卓包/{channel}/ios/
        const channel = config.channel || 'Default';
        const publishDir = path.join(CONFIG.PUBLISH_DIR, channel, 'ios');
        
        // 确保发布目录存在
        if (!fs.existsSync(publishDir)) {
            fs.mkdirSync(publishDir, { recursive: true });
        }
        
        // 生成IPA文件名（包含渠道信息）
        const channelSuffix = channel && channel !== 'Default' ? `-${channel}` : '';
        const ipaFileName = path.basename(ipaPath).replace('.ipa', `${channelSuffix}.ipa`);
        const publishPath = path.join(publishDir, ipaFileName);
        
        // 复制IPA文件
        fs.copyFileSync(ipaPath, publishPath);
        
        return {
            publishPath,
            publishDir,
            channel
        };
    } catch (error) {
        console.error(`❌ 发布IPA失败: ${error.message}`);
        return null;
    }
}

// 主函数
function main() {
    console.log('📱 iOS 包发布工具');
    console.log('========================================\n');
    
    const config = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   构建路径: ${config.buildPath}`);
    console.log(`   渠道: ${config.channel}`);
    console.log('');
    
    const buildPath = path.resolve(CONFIG.PROJECT_PATH, config.buildPath);
    
    if (!fs.existsSync(buildPath)) {
        console.error(`❌ 错误: 构建路径不存在: ${buildPath}`);
        console.error('请先使用Xcode构建iOS项目');
        process.exit(1);
    }
    
    console.log('🔍 查找 IPA 文件...');
    const ipaPath = findIPA(buildPath);
    
    if (!ipaPath) {
        console.warn('⚠️  未找到 IPA 文件');
        console.warn(`   搜索路径: ${buildPath}`);
        console.warn('   提示: 请先使用Xcode构建并导出IPA文件');
        process.exit(1);
    }
    
    const stats = fs.statSync(ipaPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ 找到 IPA 文件: ${ipaPath}`);
    console.log(`   IPA 大小: ${sizeInMB} MB`);
    console.log('');
    
    // 发布IPA到发布目录
    console.log('📦 发布IPA到发布目录...');
    const publishResult = publishIPA(ipaPath, config);
    if (publishResult) {
        console.log(`✅ IPA已发布到: ${publishResult.publishPath}`);
        console.log(`   渠道: ${publishResult.channel}`);
    } else {
        console.error('❌ IPA发布失败');
        process.exit(1);
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

module.exports = { publishIPA, findIPA };
