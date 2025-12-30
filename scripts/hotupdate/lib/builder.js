#!/usr/bin/env node

/**
 * 构建工具模块
 * 负责执行 Cocos Creator 构建命令
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PROJECT_PATH } = require('./config');

// Cocos Creator 路径
const COCOS_CREATOR_PATH = '/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator';

/**
 * 检查 Cocos Creator 是否存在
 */
function checkCocosCreator() {
    if (!fs.existsSync(COCOS_CREATOR_PATH)) {
        console.error(`❌ 错误: 找不到 Cocos Creator，路径: ${COCOS_CREATOR_PATH}`);
        console.error('   请修改脚本中的 COCOS_CREATOR_PATH 配置');
        process.exit(1);
    }
}

/**
 * 查找构建配置文件
 */
function findBuildConfigFile(configFileName, platform, channel) {
    const configsDir = path.join(__dirname, '..', 'configs');
    const fileName = `${configFileName}_${platform}_${channel}.json`;
    const configPath = path.join(configsDir, fileName);
    
    if (fs.existsSync(configPath)) {
        return configPath;
    }
    
    return null;
}

/**
 * 构建构建参数字符串
 */
function buildBuildParams(config) {
    const { buildConfigName, platform, configFileName } = config;
    
    // 优先使用 configPath 方式
    if (buildConfigName && configFileName) {
        const configPath = findBuildConfigFile(configFileName, platform, buildConfigName);
        if (configPath) {
            console.log(`✅ 使用构建配置文件: ${configPath}`);
            return `configPath=${configPath}`;
        }
    }
    
    // 回退到 taskName 方式
    if (buildConfigName) {
        const taskName = `${platform}-${buildConfigName}`;
        console.log(`✅ 使用任务名称: ${taskName}`);
        return `taskName=${taskName}`;
    }
    
    return null;
}

/**
 * 执行构建命令
 */
function executeBuild(config) {
    checkCocosCreator();
    
    const buildParams = buildBuildParams(config);
    if (!buildParams) {
        console.error('❌ 错误: 无法确定构建参数');
        process.exit(1);
    }
    
    const command = `${COCOS_CREATOR_PATH} --project ${PROJECT_PATH} --build "${buildParams}"`;
    
    console.log('执行构建命令:');
    console.log(command);
    console.log('');
    console.log('⏳ 正在执行构建，请耐心等待...');
    console.log('   构建可能需要几分钟时间，请勿中断');
    console.log('');
    
    let buildCommandFailed = false;
    let buildError = null;
    
    try {
        execSync(command, {
            cwd: PROJECT_PATH,
            stdio: 'inherit',
            shell: true,
            timeout: 600000, // 10分钟超时
        });
    } catch (error) {
        buildCommandFailed = true;
        buildError = error;
        
        if (error.signal === 'SIGTERM' || (error.message && error.message.includes('timeout'))) {
            console.log('');
            console.log('⚠️  构建超时，但可能仍在后台进行中');
            console.log('   请检查构建输出目录是否已生成');
        } else {
            console.log('');
            console.log('⚠️  构建命令执行失败:', error.message);
            if (error.code !== undefined) {
                console.log(`   退出码: ${error.code}`);
            }
        }
    }
    
    return { buildCommandFailed, buildError };
}

/**
 * 等待构建完成
 */
function waitForBuild(outputPath, maxWait = 30) {
    console.log('');
    console.log('⏳ 等待构建完成（最多 30 秒）...');
    
    let waitCount = 0;
    while (waitCount < maxWait) {
        if (fs.existsSync(outputPath)) {
            const hasDataDir = fs.existsSync(path.join(outputPath, 'data'));
            const hasProjDir = fs.existsSync(path.join(outputPath, 'proj'));
            if (hasDataDir || hasProjDir) {
                console.log('✅ 构建输出目录已生成');
                return true;
            }
        }
        waitCount++;
        if (waitCount % 5 === 0) {
            process.stdout.write('.');
        }
        
        try {
            require('child_process').execSync('sleep 1', { stdio: 'ignore' });
        } catch (e) {
            const start = Date.now();
            while (Date.now() - start < 1000) {}
        }
    }
    
    console.log('');
    return false;
}

/**
 * 检查构建是否成功
 */
function checkBuildSuccess(outputPath) {
    if (!fs.existsSync(outputPath)) {
        return { success: false, message: `构建输出目录不存在: ${outputPath}` };
    }
    
    const hasDataDir = fs.existsSync(path.join(outputPath, 'data'));
    const hasProjDir = fs.existsSync(path.join(outputPath, 'proj'));
    
    if (hasDataDir || hasProjDir) {
        return { success: true, hasDataDir, hasProjDir };
    }
    
    return { success: false, message: '构建输出目录存在但未找到构建产物' };
}

module.exports = {
    executeBuild,
    waitForBuild,
    checkBuildSuccess,
    buildBuildParams,
};

