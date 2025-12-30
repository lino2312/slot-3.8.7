const imageminModule = require('imagemin');
const imagemin = imageminModule.default || imageminModule;
const imageminOptipngModule = require('imagemin-optipng');
const imageminOptipng = imageminOptipngModule.default || imageminOptipngModule;
const imageminJpegtranModule = require('imagemin-jpegtran');
const imageminJpegtran = imageminJpegtranModule.default || imageminJpegtranModule;
const glob = require('glob');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
let inputDir = null;
let compressionLevel = 3; // 默认压缩级别：3 (PNG优化级别 0-7，数字越大压缩越好但速度越慢)

// 解析参数
for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === '--level' || arg === '-l') {
		if (i + 1 < args.length) {
			const level = parseInt(args[i + 1]);
			if (!isNaN(level) && level >= 0 && level <= 7) {
				compressionLevel = level;
				i++;
			} else {
				console.error(`❌ 错误: 压缩级别必须是 0-7 之间的数字`);
				process.exit(1);
			}
		} else {
			console.error(`❌ 错误: --level 参数需要指定一个值 (0-7)`);
			process.exit(1);
		}
	} else if (arg === '--help' || arg === '-h') {
		console.log(`
图片无损压缩工具 (yasuowusun.js)

使用方法:
  node scripts/yasuowusun.js [目录路径] [选项]

选项:
  --level, -l <0-7>    设置 PNG 压缩级别 (0-7，默认: 3)
                       0 = 最快，压缩率最低
                       7 = 最慢，压缩率最高
                       推荐值: 3-5

  --help, -h           显示此帮助信息

示例:
  node scripts/yasuowusun.js assets/hall/image
  node scripts/yasuowusun.js assets/hall/image --level 5
  node scripts/yasuowusun.js assets/hall/image -l 7
		`);
		process.exit(0);
	} else if (!arg.startsWith('--') && !arg.startsWith('-')) {
		// 第一个非选项参数作为目录路径
		if (!inputDir) {
			inputDir = path.resolve(arg);
		}
	}
}

// 如果没有指定目录，使用默认值
if (!inputDir) {
	inputDir = path.join(process.cwd(), 'input');
}

// 检查目录是否存在
if (!fs.existsSync(inputDir)) {
	console.error(`❌ 错误: 目录不存在: ${inputDir}`);
	console.log('💡 提示: 请指定一个有效的目录路径，例如:');
	console.log('   node scripts/yasuowusun.js assets/hall/image');
	console.log('   node scripts/yasuowusun.js assets/hall/image --level 5');
	process.exit(1);
}

// 白名单：要忽略的文件或目录
const whiteList = ['**/ignore-directory/**', '**/ignore-file.png'];

console.log(`⚙️  压缩级别: ${compressionLevel} (0=最快, 7=最好压缩)`);

(async () => {
	try {
		// 使用 glob 来匹配 .png 和 .jpg 文件，** 表示任意目录层级
		const filesToCompress = glob.sync(`${inputDir}/**/*.{png,jpg,jpeg}`, { ignore: whiteList });
		
		if (filesToCompress.length === 0) {
			console.log(`⚠️  在目录 ${inputDir} 中没有找到 PNG 或 JPG 文件`);
			return;
		}

		console.log(`📁 找到 ${filesToCompress.length} 个图片文件，开始压缩...`);
		let totalFilesCompressed = 0;
		let totalBytesSaved = 0;

		for (const file of filesToCompress) {
			try {
				const ext = path.extname(file).toLowerCase();
				const originalSize = fs.statSync(file).size;
				
				let plugins = [];
				if (ext === '.png') {
					// PNG 压缩级别配置 (0-7)
					// 0 = 最快，压缩率最低
					// 7 = 最慢，压缩率最高
					plugins = [imageminOptipng({ optimizationLevel: compressionLevel })];
				} else if (ext === '.jpg' || ext === '.jpeg') {
					// JPEG 使用无损压缩 (jpegtran)，没有质量级别选项
					// 但可以启用渐进式 JPEG
					plugins = [imageminJpegtran({ progressive: true })];
				}

				const files = await imagemin([file], {
					destination: path.dirname(file), // 目标目录就是源文件所在的目录
					plugins: plugins
				});
				
				if (files.length > 0) {
					const newSize = fs.statSync(file).size;
					const saved = originalSize - newSize;
					totalBytesSaved += saved;
					totalFilesCompressed += files.length;
					
					const savedPercent = ((saved / originalSize) * 100).toFixed(1);
					const savedKB = (saved / 1024).toFixed(2);
					console.log(`✅ 已压缩: ${path.relative(process.cwd(), file)} (节省 ${savedKB}KB, ${savedPercent}%)`);
				}
			} catch (error) {
				console.error(`❌ 压缩失败: ${path.relative(process.cwd(), file)} - ${error.message}`);
			}
		}

		const savedMB = (totalBytesSaved / 1024 / 1024).toFixed(2);
		console.log(`\n✨ 压缩完成！共处理 ${totalFilesCompressed} 个文件，总共节省 ${savedMB}MB。`);
	} catch (error) {
		console.error('❌ 发生错误:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
})();
