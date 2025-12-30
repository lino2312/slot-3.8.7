#!/bin/bash

# 热更新打包脚本
# 用法: ./package-hotupdate.sh {version} {platform}
# 示例: ./package-hotupdate.sh 1.0.66 android

VERSION=$1
PLATFORM=$2

if [ -z "$VERSION" ] || [ -z "$PLATFORM" ]; then
    echo "用法: $0 {version} {platform}"
    echo "示例: $0 1.0.66 android"
    exit 1
fi

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 获取项目根目录（脚本在 scripts/hotupdate/ 下，所以需要向上两级）
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BASE_DIR="${PROJECT_ROOT}/hotupdate-assets/${VERSION}/${PLATFORM}"
# 输出目录：生成服务器目录结构，方便一次性上传
OUTPUT_DIR="${PROJECT_ROOT}/hotupdate-packages/${VERSION}"
# 主包输出路径
MAIN_OUTPUT_DIR="${OUTPUT_DIR}"
# 子包输出路径（在 assets/{bundleName}/ 下）
BUNDLE_OUTPUT_BASE="${OUTPUT_DIR}/assets"

# 检查源目录是否存在
if [ ! -d "$BASE_DIR" ]; then
    echo "错误: 源目录不存在: $BASE_DIR"
    echo "请先使用 Cocos Creator 构建热更新资源"
    exit 1
fi

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

echo "=========================================="
echo "热更新打包工具"
echo "=========================================="
echo "版本: ${VERSION}"
echo "平台: ${PLATFORM}"
echo "源目录: ${BASE_DIR}"
echo "输出目录: ${OUTPUT_DIR} (服务器目录结构)"
echo "=========================================="
echo ""

# 检查是否有 zip 命令
if ! command -v zip &> /dev/null; then
    echo "错误: 未找到 zip 命令，请安装 zip 工具"
    exit 1
fi

# 打包主包
echo "正在打包主包..."
if [ -f "${BASE_DIR}/project.manifest" ] && [ -f "${BASE_DIR}/version.manifest" ]; then
    # 确保输出目录存在（服务器目录结构）
    mkdir -p "${MAIN_OUTPUT_DIR}"
    
    # 打包（直接在源目录打包）
    cd "${BASE_DIR}"
    
    # 打包主包文件（排除子包目录和不需要的文件）
    # 主包不应该包含 assets/ 下的子包，子包会单独打包
    zip -r "${MAIN_OUTPUT_DIR}/update.zip" . \
        -x "*.DS_Store" \
        -x "*.meta" \
        -x "__MACOSX/*" \
        -x "*.tmp" \
        -x "*.log" \
        -x "assets/*" \
        > /dev/null 2>&1
    ZIP_EXIT_CODE=$?
    cd "${OLDPWD}"
    
    if [ $ZIP_EXIT_CODE -eq 0 ] && [ -f "${MAIN_OUTPUT_DIR}/update.zip" ]; then
        SIZE=$(du -h "${MAIN_OUTPUT_DIR}/update.zip" | cut -f1)
        echo "✓ 主包打包完成: ${MAIN_OUTPUT_DIR}/update.zip (${SIZE})"
        
        # 复制清单文件到输出目录
        if [ -f "${BASE_DIR}/version.manifest" ]; then
            cp "${BASE_DIR}/version.manifest" "${MAIN_OUTPUT_DIR}/version.manifest"
            echo "  ✓ 已复制 version.manifest"
        fi
        if [ -f "${BASE_DIR}/project.manifest" ]; then
            cp "${BASE_DIR}/project.manifest" "${MAIN_OUTPUT_DIR}/project.manifest"
            echo "  ✓ 已复制 project.manifest"
        fi
    else
        echo "✗ 主包打包失败 (退出码: ${ZIP_EXIT_CODE})"
        if [ ! -d "${MAIN_OUTPUT_DIR}" ]; then
            echo "  错误: 输出目录不存在: ${MAIN_OUTPUT_DIR}"
        fi
    fi
else
    echo "⚠ 主包清单文件不存在，跳过主包打包"
fi

echo ""

# 打包子包
if [ -d "${BASE_DIR}/assets" ]; then
    echo "正在打包子包..."
    BUNDLE_COUNT=0
    
    for bundle_dir in "${BASE_DIR}/assets"/*; do
        if [ -d "$bundle_dir" ]; then
            bundle_name=$(basename "$bundle_dir")
            
            if [ -f "$bundle_dir/project.manifest" ] && [ -f "$bundle_dir/version.manifest" ]; then
                BUNDLE_COUNT=$((BUNDLE_COUNT + 1))
                echo "  打包子包: ${bundle_name}..."
                
                # 创建子包输出目录（服务器目录结构：assets/{bundleName}/）
                BUNDLE_OUTPUT_DIR="${BUNDLE_OUTPUT_BASE}/${bundle_name}"
                mkdir -p "${BUNDLE_OUTPUT_DIR}"
                
                # 打包（直接在源目录打包）
                cd "$bundle_dir"
                
                # 打包所有文件和目录（排除不需要的文件）
                # 输出到服务器目录结构：assets/{bundleName}/{bundleName}.zip
                zip -r "${BUNDLE_OUTPUT_DIR}/${bundle_name}.zip" . \
                    -x "*.DS_Store" \
                    -x "*.meta" \
                    -x "__MACOSX/*" \
                    -x "*.tmp" \
                    -x "*.log" \
                    > /dev/null 2>&1
                ZIP_EXIT_CODE=$?
                cd "${OLDPWD}"
                
                if [ $ZIP_EXIT_CODE -eq 0 ] && [ -f "${BUNDLE_OUTPUT_DIR}/${bundle_name}.zip" ]; then
                    SIZE=$(du -h "${BUNDLE_OUTPUT_DIR}/${bundle_name}.zip" | cut -f1)
                    echo "  ✓ ${bundle_name}.zip (${SIZE}) → ${BUNDLE_OUTPUT_DIR}/${bundle_name}.zip"
                else
                    echo "  ✗ ${bundle_name} 打包失败 (退出码: ${ZIP_EXIT_CODE})"
                fi
            else
                echo "  ⚠ ${bundle_name} 清单文件不存在，跳过"
            fi
        fi
    done
    
    if [ $BUNDLE_COUNT -eq 0 ]; then
        echo "  未找到可打包的子包"
    fi
else
    echo "未找到子包目录: ${BASE_DIR}/assets"
fi

echo ""
echo "=========================================="
echo "打包完成！"
echo "=========================================="
echo "输出目录: ${OUTPUT_DIR} (服务器目录结构)"
echo ""
echo "目录结构:"
echo "  ${OUTPUT_DIR}/"
if [ -f "${MAIN_OUTPUT_DIR}/update.zip" ]; then
    SIZE=$(du -h "${MAIN_OUTPUT_DIR}/update.zip" | cut -f1)
    echo "  ├── update.zip (${SIZE})"
fi
if [ -f "${MAIN_OUTPUT_DIR}/version.manifest" ]; then
    echo "  ├── version.manifest"
fi
if [ -f "${MAIN_OUTPUT_DIR}/project.manifest" ]; then
    echo "  ├── project.manifest"
fi
if [ -d "${BUNDLE_OUTPUT_BASE}" ]; then
    echo "  └── assets/"
    for bundle_dir in "${BUNDLE_OUTPUT_BASE}"/*; do
        if [ -d "$bundle_dir" ]; then
            bundle_name=$(basename "$bundle_dir")
            if [ -f "$bundle_dir/${bundle_name}.zip" ]; then
                SIZE=$(du -h "$bundle_dir/${bundle_name}.zip" | cut -f1)
                echo "      ├── ${bundle_name}/"
                echo "      │   └── ${bundle_name}.zip (${SIZE})"
            fi
        fi
    done
fi
echo ""
echo "下一步:"
echo "1. 检查压缩包和清单文件"
echo "2. 一次性上传整个目录到服务器:"
echo "   rsync -avz ${OUTPUT_DIR}/ user@server:/path/to/GameXVersion3/temp/${VERSION}/"
echo "   或使用 FTP/SFTP 上传整个 ${OUTPUT_DIR} 目录"
echo "3. 确保服务器URL可访问"
echo "=========================================="

