#!/usr/bin/env node

/**
 * 构建热更新包完整流程工具
 * 
 * 使用方法:
 *   node scripts/hotupdate/build-hotupdate.js [options]
 * 
 * 选项:
 *   --version <version>      版本号 [可选，默认从 Config.ts 读取]
 *   --bundle <bundle>        Bundle名称 (例如: build-in, hall) [必需]
 *   --source <path>          源文件目录路径 [必需]
 *   --output-dir <path>     输出目录 [可选，默认: hotupdate-packages/{version}]
 *   --skip-manifest          跳过生成manifest [可选]
 *   --skip-zip               跳过打包zip [可选]
 *   --config <path>          配置文件路径 [可选]
 *   --help                   显示帮助信息
 * 
 * 示例:
 *   node scripts/hotupdate/build-hotupdate.js --bundle build-in --source build/android/assets
 *   node scripts/hotupdate/build-hotupdate.js --bundle hall --source build/android/assets/assets/hall
 *   # 版本号会自动从 Config.ts 中读取，如需手动指定：
 *   node scripts/hotupdate/build-hotupdate.js --version 1.0.1 --bundle build-in --source build/android/assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readHotUpdateVersion } = require('./read-config');

const generateManifest = require('./generate-manifest');
const packageZip = require('./package-zip');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        version: null,
        bundle: null,
        source: null,
        outputDir: null,
        skipManifest: false,
        skipZip: false,
        config: path.join(__dirname, '../../settings/hotupdate/hot-update-template-config.json')
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--version':
                options.version = args[++i];
                break;
            case '--bundle':
                options.bundle = args[++i];
                break;
            case '--source':
                options.source = args[++i];
                break;
            case '--output-dir':
                options.outputDir = args[++i];
                break;
            case '--skip-manifest':
                options.skipManifest = true;
                break;
            case '--skip-zip':
                options.skipZip = true;
                break;
            case '--config':
                options.config = args[++i];
                break;
            case '--help':
                console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
                process.exit(0);
                break;
        }
    }

    // 验证必需参数
    if (!options.bundle || !options.source) {
        console.error('❌ 错误: 缺少必需参数');
        console.error('请使用 --help 查看使用方法');
        process.exit(1);
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
 * 构建单个Bundle的热更新包
 */
async function buildBundle(options) {
    console.log('\n' + '='.repeat(60));
    console.log(`📦 构建 Bundle: ${options.bundle}`);
    console.log('='.repeat(60) + '\n');

    const bundleName = options.bundle === 'build-in' ? 'update' : options.bundle;
    let manifestPath, zipPath;
    let files = [], directories = [];

    // 1. 生成manifest
    if (!options.skipManifest) {
        console.log('📝 步骤 1/3: 生成 Manifest 文件...\n');
        
        // manifest 文件应该直接放在源目录的根目录
        // 因为 source 目录已经是 bundle 的根目录了（例如 build/android/assets/assets/hall/）
        // 注意：对于子游戏，source 应该是 bundle 的根目录，例如：
        // - build/android-test/assets/assets/hall/ (包含 cc.config.json, native/, 等)
        // - build/android-test/assets/assets/Super777I/ (包含 cc.config.json, native/, 等)
        manifestPath = path.join(options.source, 'project.manifest');
        
        // 验证源目录结构（用于调试）
        const expectedConfigFile = path.join(options.source, 'cc.config.json');
        const hasConfigFile = fs.existsSync(expectedConfigFile);
        if (!hasConfigFile) {
            // 尝试查找 cc.config.*.json
            const files = fs.readdirSync(options.source);
            const configFiles = files.filter(f => f.startsWith('cc.config') && f.endsWith('.json'));
            if (configFiles.length > 0) {
                console.log(`   ℹ️  找到配置文件: ${configFiles.join(', ')}`);
            } else {
                console.warn(`   ⚠️  警告: 源目录中未找到 cc.config.json 或 cc.config.*.json`);
                console.warn(`      源目录: ${options.source}`);
                console.warn(`      目录内容: ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}`);
            }
        } else {
            console.log(`   ✓ 找到配置文件: cc.config.json`);
        }

        // 调用generate-manifest
        const { generateManifest: genManifest, getAllFiles, calculateMD5 } = require('./generate-manifest');
        const fileResult = getAllFiles(options.source);
        files = fileResult.files;
        directories = fileResult.directories;
        const { manifest } = genManifest(options.version, files, directories, options.bundle);
        
        // 确保目录存在
        const manifestDir = path.dirname(manifestPath);
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`✅ Manifest 已生成: ${manifestPath}`);
        
        // 将manifest文件复制到输出目录
        let outputManifestPath;
        if (options.bundle === 'build-in') {
            outputManifestPath = path.join(options.outputDir, 'project.manifest');
        } else {
            outputManifestPath = path.join(options.outputDir, 'assets', bundleName, 'project.manifest');
        }
        
        // 确保输出目录存在
        const outputManifestDir = path.dirname(outputManifestPath);
        if (!fs.existsSync(outputManifestDir)) {
            fs.mkdirSync(outputManifestDir, { recursive: true });
        }
        
        // 复制manifest文件到输出目录
        fs.copyFileSync(manifestPath, outputManifestPath);
        console.log(`✅ Manifest 已复制到输出目录: ${outputManifestPath}`);
        
        // 生成 version.manifest 文件（只包含版本号，用于快速版本检查）
        // 主包的 version.manifest 只放在根目录（版本文件夹外面），以便始终指向最新版本
        // 子包的 version.manifest 放在各自的版本文件夹里（GGHotUpdateInstance 需要使用）
        let outputVersionManifestPath;
        let rootVersionManifestPath = null; // 根目录的 version.manifest（仅主包）
        
        if (options.bundle === 'build-in') {
            // 主包的 version.manifest 只生成在根目录（版本文件夹外面）
            // 根目录：hotupdate-packages/version.manifest（始终指向最新版本）
            // 不再在版本文件夹里生成，因为根目录的已经足够
            const rootDir = path.dirname(options.outputDir);
            rootVersionManifestPath = path.join(rootDir, 'version.manifest');
        } else {
            // 子包的 version.manifest 放在各自的目录里（GGHotUpdateInstance 需要使用）
            // 例如：hotupdate-packages/1.0.0/assets/hall/version.manifest
            outputVersionManifestPath = path.join(options.outputDir, 'assets', bundleName, 'version.manifest');
        }
        
        // 生成 version.manifest（只包含版本号）
        const versionManifest = {
            version: options.version
        };
        
        if (options.bundle === 'build-in') {
            // 主包：只生成根目录的 version.manifest
            if (rootVersionManifestPath) {
                // 确保根目录存在
                const rootDir = path.dirname(rootVersionManifestPath);
                if (!fs.existsSync(rootDir)) {
                    fs.mkdirSync(rootDir, { recursive: true });
                }
                fs.writeFileSync(rootVersionManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');
                console.log(`✅ 根目录 Version Manifest 已生成: ${rootVersionManifestPath}`);
                console.log(`   💡 提示：根目录的 version.manifest 应该始终指向最新版本，服务器上需要手动更新此文件\n`);
            }
        } else {
            // 子包：生成版本文件夹里的 version.manifest
            // 确保输出目录存在
            const outputVersionManifestDir = path.dirname(outputVersionManifestPath);
            if (!fs.existsSync(outputVersionManifestDir)) {
                fs.mkdirSync(outputVersionManifestDir, { recursive: true });
            }
            fs.writeFileSync(outputVersionManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');
            console.log(`✅ Version Manifest 已生成: ${outputVersionManifestPath}\n`);
        }
        
        // 更新manifestPath为输出目录的路径
        manifestPath = outputManifestPath;
    } else {
        console.log('⏭️  跳过生成 Manifest\n');
        // manifest 文件应该直接放在源目录的根目录
        manifestPath = path.join(options.source, 'project.manifest');
        // 即使跳过manifest，也需要获取文件列表用于生成文件列表
        const { getAllFiles } = require('./generate-manifest');
        const fileResult = getAllFiles(options.source);
        files = fileResult.files;
        directories = fileResult.directories;
    }

    // 2. 打包zip（子游戏跳过zip打包）
    // 判断是否为子游戏
    const { isSubGame } = require('./build-all-bundles');
    const isSubGameBundle = isSubGame(options.bundle);
    
    // 如果是子游戏，自动跳过zip打包
    if (isSubGameBundle && !options.skipZip) {
        console.log('ℹ️  子游戏跳过zip打包，只生成散文件\n');
        options.skipZip = true;
    }
    
    if (!options.skipZip) {
        console.log('📦 步骤 2/3: 打包 Zip 文件...\n');
        
        if (options.bundle === 'build-in') {
            zipPath = path.join(options.outputDir, 'update.zip');
        } else {
            zipPath = path.join(options.outputDir, 'assets', bundleName, `${bundleName}.zip`);
        }

        // 确保输出目录存在
        const zipDir = path.dirname(zipPath);
        if (!fs.existsSync(zipDir)) {
            fs.mkdirSync(zipDir, { recursive: true });
        }

        // 调用package-zip
        const { packageWithArchiver, packageWithZipCommand } = require('./package-zip');
        
        // 检查工具
        let useArchiver = false;
        try {
            require.resolve('archiver');
            useArchiver = true;
        } catch (e) {
            try {
                execSync('which zip', { stdio: 'ignore' });
            } catch (e2) {
                console.error('❌ 错误: 未找到zip打包工具');
                console.error('请安装 archiver: npm install archiver');
                process.exit(1);
            }
        }

        // 验证打包前的源目录结构
        console.log(`\n📦 打包前验证:`);
        console.log(`   源目录: ${options.source}`);
        console.log(`   输出zip: ${zipPath}`);
        
        // 列出源目录的根文件（前10个）用于验证
        try {
            const sourceFiles = fs.readdirSync(options.source);
            const rootFiles = sourceFiles.slice(0, 10);
            console.log(`   源目录根文件（前10个）: ${rootFiles.join(', ')}${sourceFiles.length > 10 ? '...' : ''}`);
            
            // 检查关键文件
            const hasManifest = sourceFiles.includes('project.manifest');
            const hasConfig = sourceFiles.some(f => f.startsWith('cc.config') && f.endsWith('.json'));
            console.log(`   包含 project.manifest: ${hasManifest ? '✓' : '✗'}`);
            console.log(`   包含 cc.config.json: ${hasConfig ? '✓' : '✗'}`);
        } catch (error) {
            console.warn(`   ⚠️  无法列出源目录内容: ${error.message}`);
        }
        
        if (useArchiver) {
            await packageWithArchiver(options.source, zipPath, []);
        } else {
            packageWithZipCommand(options.source, zipPath, []);
        }
        
        // 验证打包后的zip内容（可选，用于调试）
        if (fs.existsSync(zipPath) && process.env.DEBUG_ZIP_CONTENT) {
            console.log(`\n🔍 验证zip内容（调试模式）:`);
            try {
                const { execSync } = require('child_process');
                const zipList = execSync(`unzip -l "${zipPath}" | head -20`, { encoding: 'utf8' });
                console.log(zipList);
            } catch (error) {
                // 忽略错误
            }
        }

        const stats = fs.statSync(zipPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Zip 已打包: ${zipPath} (${sizeMB} MB)\n`);
    } else {
        console.log('⏭️  跳过打包 Zip\n');
    }

    // 3. 生成文件列表（完整文件结构、散文件列表）
    console.log('📋 步骤 3/4: 生成文件列表...\n');
    const fileListDir = path.join(options.outputDir, 'file-list');
    const { generateFileList } = require('./generate-file-list');
    const fileListResult = generateFileList(files, directories, fileListDir, options.bundle);
    console.log('');

    // 4. 生成散文件目录结构（用于非首次更新的单个文件下载）
    console.log('📁 步骤 4/4: 生成散文件目录结构...\n');
    
    // 散文件目录路径：
    // 主包: {outputDir}/files/
    // 子包（包括子游戏）: {outputDir}/assets/{bundleName}/files/
    let filesDir;
    if (options.bundle === 'build-in') {
        filesDir = path.join(options.outputDir, 'files');
    } else {
        // 所有子包（包括子游戏）都使用 files/ 目录
        filesDir = path.join(options.outputDir, 'assets', bundleName, 'files');
    }
    
    // 确保files数组不为空
    if (!files || files.length === 0) {
        console.warn('⚠️  警告: 文件列表为空，无法生成散文件目录');
        console.warn('   尝试重新扫描源目录...');
        const { getAllFiles } = require('./generate-manifest');
        const fileResult = getAllFiles(options.source);
        files = fileResult.files;
        directories = fileResult.directories;
        console.log(`   重新扫描到 ${files.length} 个文件`);
    }
    
    let filesResult = null;
    if (files && files.length > 0) {
        const { generateFiles } = require('./generate-files');
        filesResult = generateFiles(files, options.source, filesDir, options.bundle);
        console.log(`✅ 散文件目录已生成: ${filesResult.fileCount} 个文件，总大小: ${(filesResult.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
    } else {
        console.error('❌ 错误: 无法获取文件列表，跳过散文件目录生成\n');
    }

    return {
        manifestPath,
        zipPath: options.skipZip ? null : zipPath,
        fileListDir,
        fileListResult,
        filesDir,
        filesResult
    };
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始构建热更新包...\n');

    const options = parseArgs();
    console.log('📋 配置信息:');
    console.log(`   版本号: ${options.version}`);
    console.log(`   Bundle: ${options.bundle}`);
    console.log(`   源目录: ${options.source}`);
    console.log(`   输出目录: ${options.outputDir}`);
    console.log('');

    try {
        const result = await buildBundle(options);

        console.log('\n' + '='.repeat(60));
        console.log('✅ 构建完成!');
        console.log('='.repeat(60));
        console.log(`\n📁 输出文件:`);
        if (result.manifestPath) {
            console.log(`   Manifest: ${result.manifestPath}`);
        }
        if (result.zipPath) {
            console.log(`   Zip: ${result.zipPath}`);
        }
        if (result.fileListDir) {
            console.log(`   文件列表目录: ${result.fileListDir}`);
            console.log(`     - 文件结构: ${result.fileListResult.structurePath}`);
            console.log(`     - 散文件列表: ${result.fileListResult.fileListPath}`);
            console.log(`     - 文本列表: ${result.fileListResult.textListPath}`);
        }
        if (result.filesDir) {
            console.log(`   散文件目录: ${result.filesDir}`);
            console.log(`     - 文件数量: ${result.filesResult.fileCount}`);
            console.log(`     - 总大小: ${(result.filesResult.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`     - 文件索引: ${result.filesResult.indexPath}`);
        }
        console.log(`\n📤 上传到服务器:`);
        console.log(`   请根据 ENV_CONFIG 中配置的 hotupdateBaseUrl 上传文件`);
        
        // 判断是否为子游戏
        const { isSubGame } = require('./build-all-bundles');
        const isSubGameBundle = isSubGame(options.bundle);
        
        if (options.bundle === 'build-in') {
            console.log(`   Zip文件: {hotupdateBaseUrl}/${options.version}/update.zip`);
            console.log(`   Manifest: {hotupdateBaseUrl}/${options.version}/project.manifest`);
            console.log(`   散文件: {hotupdateBaseUrl}/${options.version}/files/...`);
        } else {
            const bundleName = options.bundle === 'build-in' ? 'update' : options.bundle;
            if (isSubGameBundle) {
                console.log(`   ⚠️  子游戏不生成zip文件，只使用散文件更新`);
                console.log(`   Manifest: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/project.manifest`);
                console.log(`   散文件: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/files/...`);
            } else {
                console.log(`   Zip文件: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/${bundleName}.zip`);
                console.log(`   Manifest: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/project.manifest`);
                console.log(`   散文件: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/files/...`);
            }
        }
        console.log(`   注意: hotupdateBaseUrl 从 Config.ts 的 ENV_CONFIG 中读取`);
        console.log(`\n💡 使用说明:`);
        if (isSubGameBundle) {
            console.log(`   - 子游戏只使用散文件更新（不生成zip）`);
            console.log(`   - 根据 manifest 对比，从 files/ 目录下载变更的散文件`);
            console.log(`   - 散文件路径: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/files/{filePath}`);
        } else {
            console.log(`   - 首次更新: 下载 zip 文件并解压`);
            console.log(`   - 后续更新: 根据 manifest 对比，从 files/ 目录下载变更的散文件`);
            console.log(`   - 散文件路径: {hotupdateBaseUrl}/${options.version}/assets/${bundleName}/files/{filePath}`);
        }
    } catch (error) {
        console.error('\n❌ 构建失败:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { buildBundle };

