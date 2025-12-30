#!/usr/bin/env node

/**
 * 自动化 Web 打包工具
 * 使用方法: node scripts/hotupdate/build-web.js [options]
 * 
 * 选项:
 *   --channel <channel>        渠道名称 (D105, D108, test) 默认: 从 Config.ts 读取
 *                              D105 -> MIGame, D108 -> YonoHot, test -> test
 *   --build-path <path>        构建输出路径 默认: build/web-mobile
 *   --output-name <name>       输出名称 默认: web-mobile
 *   --help                     显示帮助信息
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readGameChannel, updateGameChannel } = require('./read-config');

// 配置
const CONFIG = {
    // Cocos Creator 路径 (macOS)
    COCOS_CREATOR_PATH: '/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator',
    // 项目路径（从 scripts/hotupdate 向上两级到项目根目录）
    PROJECT_PATH: path.resolve(__dirname, '../..'),
    // 默认构建配置
    DEFAULT_BUILD_CONFIG: {
        channel: '',
        platform: 'web-mobile',
        buildPath: 'build/web-mobile',
        outputName: 'web-mobile',
    },
    // 渠道映射：gameChannel -> 构建配置名称
    CHANNEL_BUILD_CONFIG_MAP: {
        'D105': 'MIGame',      // D105 使用 MIGame 构建配置
        'D108': 'YonoHot',      // D108 使用 YonoHot 构建配置
        'test': 'test',         // test 使用 test 构建配置
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
            case '--build-path':
                config.buildPath = args[++i];
                break;
            case '--output-name':
                config.outputName = args[++i];
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
            const { updateGameChannel } = require('./read-config');
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
        }
    }
    
    // 根据 gameChannel 映射到构建配置名称
    const buildConfigName = CONFIG.CHANNEL_BUILD_CONFIG_MAP[config.channel];
    if (buildConfigName) {
        config.buildConfigName = buildConfigName;
        console.log(`📦 使用构建配置: ${buildConfigName} (对应渠道: ${config.channel})`);
    } else {
        // 如果没有映射，直接使用 channel 作为构建配置名称
        config.buildConfigName = config.channel;
        console.log(`📦 使用构建配置: ${config.channel} (未找到映射，直接使用渠道名)`);
    }
    
    return config;
}

// 显示帮助信息
function showHelp() {
    console.log(`
自动化 Web 打包工具

使用方法:
  node scripts/hotupdate/build-web.js [options]

选项:
  --channel <channel>           渠道名称 (D105, D108, test) 默认: 从 Config.ts 读取
                                 D105 -> MIGame, D108 -> YonoHot, test -> test
  --build-path <path>           构建输出路径 默认: build/web-mobile
  --output-name <name>          输出名称 默认: web-mobile
  --help                        显示帮助信息

示例:
  # 基本构建（渠道从 Config.ts 读取）
  node scripts/hotupdate/build-web.js

  # 指定渠道构建
  node scripts/hotupdate/build-web.js --channel D105
  node scripts/hotupdate/build-web.js --channel D108
  node scripts/hotupdate/build-web.js --channel test
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

// 从 builder.json 读取渠道构建配置
function loadChannelConfig(buildConfigName, platform = 'web-mobile') {
    if (!buildConfigName) {
        return null;
    }
    
    // builder.json 路径
    const builderJsonPath = path.join(CONFIG.PROJECT_PATH, 'profiles', 'v2', 'packages', 'builder.json');
    
    if (!fs.existsSync(builderJsonPath)) {
        console.error(`❌ 错误: 找不到 builder.json 文件: ${builderJsonPath}`);
        process.exit(1);
    }
    
    try {
        const builderContent = fs.readFileSync(builderJsonPath, 'utf8');
        const builderConfig = JSON.parse(builderContent);
        
        // 构建 taskName: {platform}-{buildConfigName}
        const taskName = `${platform}-${buildConfigName}`;
        
        // 在 BuildTaskManager.taskMap 中查找对应的任务配置
        if (!builderConfig.BuildTaskManager || !builderConfig.BuildTaskManager.taskMap) {
            console.error(`❌ 错误: builder.json 中没有 BuildTaskManager.taskMap`);
            process.exit(1);
        }
        
        const taskMap = builderConfig.BuildTaskManager.taskMap;
        
        // 查找匹配的构建任务（通过 options.taskName 匹配）
        let foundTask = null;
        for (const taskId in taskMap) {
            const task = taskMap[taskId];
            if (task.options && task.options.taskName === taskName) {
                foundTask = task;
                break;
            }
        }
        
        if (!foundTask || !foundTask.options) {
            console.error(`❌ 错误: 在 builder.json 中找不到 taskName 为 "${taskName}" 的构建配置`);
            console.error(`   请确保在 Cocos Creator 中配置了对应的构建任务`);
            console.error(`   可用 taskName: ${Object.values(taskMap).map(t => t.options?.taskName).filter(Boolean).join(', ')}`);
            process.exit(1);
        }
        
        console.log(`✅ 从 builder.json 读取构建配置: ${taskName}`);
        return foundTask.options;
        
    } catch (error) {
        console.error(`❌ 读取 builder.json 失败: ${error.message}`);
        process.exit(1);
    }
}

// 构建构建参数字符串
function buildBuildParams(config) {
    // 如果指定了构建配置名称，使用 taskName 格式：web-mobile-{构建配置名}
    if (config.buildConfigName) {
        const taskName = `${config.platform}-${config.buildConfigName}`;
        console.log(`✅ 使用任务名称: ${taskName}`);
        return `taskName=${taskName}`;
    }
    
    // 兼容旧方式：如果指定了渠道，使用 taskName 格式：web-mobile-{渠道名}
    if (config.channel) {
        const taskName = `${config.platform}-${config.channel}`;
        console.log(`✅ 使用任务名称: ${taskName}`);
        return `taskName=${taskName}`;
    }
    
    // 默认使用参数字符串方式
    const params = [
        `platform=${config.platform}`,
        `buildPath=${config.buildPath}`,
        `outputName=${config.outputName}`,
    ];
    
    return params.join(',');
}

// 主函数
async function main() {
    console.log('🌐 开始构建 Web 项目...');
    console.log('========================================\n');
    
    const config = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   平台: ${config.platform}`);
    console.log(`   构建路径: ${config.buildPath}`);
    console.log(`   输出名称: ${config.outputName}`);
    console.log(`   渠道: ${config.channel}`);
    console.log(`   构建配置: ${config.buildConfigName}`);
    console.log('');
    
    // 检查 Cocos Creator
    checkCocosCreator();
    
    // 读取渠道配置
    const channelConfig = loadChannelConfig(config.buildConfigName || config.channel, config.platform);
    
    // 构建参数字符串
    const buildParams = buildBuildParams(config);
    
    console.log('🔨 开始构建...');
    console.log(`   构建参数: ${buildParams}`);
    console.log('');
    
    let buildCommandFailed = false;
    let buildError = null;
    
    try {
        // 调用 Cocos Creator 构建
        // Cocos Creator 命令行格式：CocosCreator --project <项目路径> --build <构建参数>
        // 注意：参数需要用空格分隔，而不是用引号包裹整个命令
        const command = `${CONFIG.COCOS_CREATOR_PATH} --project ${CONFIG.PROJECT_PATH} --build ${buildParams}`;
        
        console.log('执行命令:', command);
        console.log('');
        
        execSync(command, {
            stdio: 'inherit',
            cwd: CONFIG.PROJECT_PATH,
            shell: true,
        });
        
    } catch (error) {
        buildCommandFailed = true;
        buildError = error;
        console.error('\n⚠️  Cocos Creator 命令执行失败');
    }
    
    console.log('');
    console.log('========================================');
    
    // 检查构建是否实际成功（即使命令返回非零退出码）
    const buildPath = path.resolve(CONFIG.PROJECT_PATH, config.buildPath);
    const buildOutputExists = fs.existsSync(buildPath);
    
    if (buildOutputExists) {
        console.log('✅ Web 构建完成！');
        console.log('========================================');
        console.log(`📦 构建输出: ${buildPath}`);
        
        if (buildCommandFailed) {
            console.warn('\n⚠️  注意: Cocos Creator 命令返回了错误，但构建输出目录已生成');
            console.warn('   请检查构建输出是否完整');
        }
    } else {
        console.log('❌ Web 构建失败！');
        console.log('========================================');
        
        if (buildError) {
            console.error('\n错误详情:', buildError.message);
            if (buildError.stdout) {
                console.error('标准输出:', buildError.stdout.toString());
            }
            if (buildError.stderr) {
                console.error('错误输出:', buildError.stderr.toString());
            }
        }
        
        console.error(`\n构建输出目录不存在: ${buildPath}`);
        console.error('\n请检查:');
        console.error('  1. Cocos Creator 路径是否正确:', CONFIG.COCOS_CREATOR_PATH);
        console.error('  2. 项目路径是否正确:', CONFIG.PROJECT_PATH);
        console.error('  3. taskName 是否在 builder.json 中存在:', buildParams);
        console.error('  4. Cocos Creator 是否有权限访问项目目录');
        console.error('  5. 尝试手动运行命令验证:');
        console.error(`     "${CONFIG.COCOS_CREATOR_PATH}" --project "${CONFIG.PROJECT_PATH}" --build "${buildParams}"`);
        
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 构建过程出错:', error);
        process.exit(1);
    });
}

module.exports = { main };

