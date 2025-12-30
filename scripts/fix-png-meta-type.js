const fs = require('fs');
const path = require('path');

// 目标目录
const TARGET_DIR = path.join(__dirname, '../assets/games/ThePanda/image/plist');

// 递归查找所有 .png.meta 文件
function findPngMetaFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) {
        console.error(`目录不存在: ${dir}`);
        return files;
    }
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && item.endsWith('.png.meta')) {
            files.push(fullPath);
        } else if (stat.isDirectory()) {
            files.push(...findPngMetaFiles(fullPath));
        }
    }
    
    return files;
}

// 修复单个 meta 文件
function fixMetaFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const meta = JSON.parse(content);
        
        // 检查 userData.type 是否为 "raw"
        if (meta.userData && (meta.userData.type === 'raw' || meta.userData.type === 'sprite-frame')) {
            meta.userData.type = 'texture';
            
            // 保存文件（保持格式）
            const newContent = JSON.stringify(meta, null, 2);
            fs.writeFileSync(filePath, newContent + '\n', 'utf8');
            
            console.log(`✅ 已修复: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⏭️  跳过: ${path.basename(filePath)} (类型: ${meta.userData?.type || '未知'})`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
        return false;
    }
}

// 主函数
function main() {
    console.log(`开始处理目录: ${TARGET_DIR}\n`);
    
    const metaFiles = findPngMetaFiles(TARGET_DIR);
    
    if (metaFiles.length === 0) {
        console.log('未找到任何 .png.meta 文件');
        return;
    }
    
    console.log(`找到 ${metaFiles.length} 个 .png.meta 文件\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const filePath of metaFiles) {
        const result = fixMetaFile(filePath);
        if (result === true) {
            fixedCount++;
        } else if (result === false && fs.existsSync(filePath)) {
            skippedCount++;
        } else {
            errorCount++;
        }
    }
    
    console.log(`\n处理完成:`);
    console.log(`  ✅ 已修复: ${fixedCount} 个文件`);
    console.log(`  ⏭️  跳过: ${skippedCount} 个文件`);
    console.log(`  ❌ 错误: ${errorCount} 个文件`);
}

// 执行
main();
