#!/bin/bash

# 自动化 Android 打包工具 (Shell 版本)
# 使用方法: ./scripts/build-android.sh [options]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
COCOS_CREATOR_PATH="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator"
PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_PATH="build/android"
OUTPUT_NAME="android"
PLATFORM="android"
DEBUG="false"
MD5_CACHE="false"
SKIP_COMPRESS_TEXTURE="false"
SOURCE_MAPS="false"
SIGN="false"
KEYSTORE=""
KEYSTORE_PASSWORD=""
ALIAS=""
ALIAS_PASSWORD=""
CHANNEL=""  # 渠道名称，如 MIGame, YonoHot

# 获取渠道对应的图标名称
get_channel_icon() {
    local channel="$1"
    case "$channel" in
        "MIGame")
            echo "d105"
            ;;
        "YonoHot")
            echo "d108"
            ;;
        *)
            echo ""
            ;;
    esac
}

# 显示帮助信息
show_help() {
    cat << EOF
自动化 Android 打包工具 (Shell 版本)

使用方法:
  ./scripts/build-android.sh [options]

选项:
  --channel <channel>           渠道名称 (MIGame, YonoHot) 默认: 空
  --platform <platform>         构建平台 (android, android-instant) 默认: android
  --build-path <path>           构建输出路径 默认: build/android
  --output-name <name>          输出名称 默认: android
  --debug                       是否调试模式 默认: false
  --md5-cache                   是否启用 MD5 缓存 默认: false
  --skip-compress-texture       是否跳过纹理压缩 默认: false
  --source-maps                 是否生成 source maps 默认: false
  --sign                        是否签名 APK 默认: false
  --keystore <path>             Keystore 文件路径
  --keystore-password <pwd>     Keystore 密码
  --alias <alias>               Key alias
  --alias-password <pwd>        Alias 密码
  --help                        显示帮助信息

示例:
  # 基本构建
  ./scripts/build-android.sh

  # 指定渠道构建
  ./scripts/build-android.sh --channel MIGame

  # 调试模式构建
  ./scripts/build-android.sh --debug

  # 签名构建
  ./scripts/build-android.sh --sign --keystore ./keystore.jks --keystore-password 123456 --alias mykey --alias-password 123456
EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --channel)
                CHANNEL="$2"
                shift 2
                ;;
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            --build-path)
                BUILD_PATH="$2"
                shift 2
                ;;
            --output-name)
                OUTPUT_NAME="$2"
                shift 2
                ;;
            --debug)
                DEBUG="true"
                shift
                ;;
            --md5-cache)
                MD5_CACHE="true"
                shift
                ;;
            --skip-compress-texture)
                SKIP_COMPRESS_TEXTURE="true"
                shift
                ;;
            --source-maps)
                SOURCE_MAPS="true"
                shift
                ;;
            --sign)
                SIGN="true"
                shift
                ;;
            --keystore)
                KEYSTORE="$2"
                shift 2
                ;;
            --keystore-password)
                KEYSTORE_PASSWORD="$2"
                shift 2
                ;;
            --alias)
                ALIAS="$2"
                shift 2
                ;;
            --alias-password)
                ALIAS_PASSWORD="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}未知参数: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# 检查 Cocos Creator 是否存在
check_cocos_creator() {
    if [ ! -f "$COCOS_CREATOR_PATH" ]; then
        echo -e "${RED}错误: 找不到 Cocos Creator，路径: $COCOS_CREATOR_PATH${NC}"
        echo "请修改脚本中的 COCOS_CREATOR_PATH 配置"
        exit 1
    fi
}

# 读取渠道构建配置
load_channel_config() {
    if [ -z "$CHANNEL" ]; then
        echo -e "${YELLOW}未指定渠道，使用默认配置${NC}"
        return
    fi
    
    local config_file="$PROJECT_PATH/scripts/channels/buildConfig_android_${CHANNEL}.json"
    
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}错误: 找不到渠道配置文件: $config_file${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}读取渠道配置: $config_file${NC}"
    
    # 使用 Python 或 jq 解析 JSON（优先使用 Python，因为 macOS 通常自带）
    if command -v python3 &> /dev/null; then
        # 使用 Python 解析 JSON
        local build_path=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(data.get('buildPath', 'build/android').replace('project://', ''))")
        local output_name=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(data.get('outputName', 'android'))")
        local debug_val=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(str(data.get('debug', False)).lower())")
        local md5_cache_val=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(str(data.get('md5Cache', False)).lower())")
        local skip_compress=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(str(data.get('skipCompressTexture', False)).lower())")
        local source_maps_val=$(python3 -c "import json, sys; data = json.load(open('$config_file')); print(str(data.get('sourceMaps', False)).lower())")
        
        # 更新配置
        if [ -n "$build_path" ] && [ "$build_path" != "None" ]; then
            BUILD_PATH="$build_path"
        fi
        if [ -n "$output_name" ] && [ "$output_name" != "None" ]; then
            OUTPUT_NAME="$output_name"
        fi
        if [ -n "$debug_val" ] && [ "$debug_val" != "None" ]; then
            DEBUG="$debug_val"
        fi
        if [ -n "$md5_cache_val" ] && [ "$md5_cache_val" != "None" ]; then
            MD5_CACHE="$md5_cache_val"
        fi
        if [ -n "$skip_compress" ] && [ "$skip_compress" != "None" ]; then
            SKIP_COMPRESS_TEXTURE="$skip_compress"
        fi
        if [ -n "$source_maps_val" ] && [ "$source_maps_val" != "None" ]; then
            SOURCE_MAPS="$source_maps_val"
        fi
        
        # 读取签名配置
        local keystore_path=$(python3 -c "import json, sys; data = json.load(open('$config_file')); android = data.get('packages', {}).get('android', {}); print(android.get('keystorePath', '') or '')" 2>/dev/null || echo "")
        local keystore_pwd=$(python3 -c "import json, sys; data = json.load(open('$config_file')); android = data.get('packages', {}).get('android', {}); print(android.get('keystorePassword', '') or '')" 2>/dev/null || echo "")
        local keystore_alias=$(python3 -c "import json, sys; data = json.load(open('$config_file')); android = data.get('packages', {}).get('android', {}); print(android.get('keystoreAlias', '') or '')" 2>/dev/null || echo "")
        local keystore_alias_pwd=$(python3 -c "import json, sys; data = json.load(open('$config_file')); android = data.get('packages', {}).get('android', {}); print(android.get('keystoreAliasPassword', '') or '')" 2>/dev/null || echo "")
        local use_debug_keystore=$(python3 -c "import json, sys; data = json.load(open('$config_file')); android = data.get('packages', {}).get('android', {}); print(str(android.get('useDebugKeystore', True)).lower())" 2>/dev/null || echo "true")
        
        if [ -n "$keystore_path" ] && [ "$keystore_path" != "None" ] && [ -n "$keystore_path" ]; then
            KEYSTORE="$keystore_path"
            SIGN="true"
        fi
        if [ -n "$keystore_pwd" ] && [ "$keystore_pwd" != "None" ]; then
            KEYSTORE_PASSWORD="$keystore_pwd"
        fi
        if [ -n "$keystore_alias" ] && [ "$keystore_alias" != "None" ]; then
            ALIAS="$keystore_alias"
        fi
        if [ -n "$keystore_alias_pwd" ] && [ "$keystore_alias_pwd" != "None" ]; then
            ALIAS_PASSWORD="$keystore_alias_pwd"
        fi
        if [ "$use_debug_keystore" = "false" ]; then
            SIGN="true"
        fi
        
    elif command -v jq &> /dev/null; then
        # 使用 jq 解析 JSON
        BUILD_PATH=$(jq -r '.buildPath // "build/android"' "$config_file" | sed 's|project://||')
        OUTPUT_NAME=$(jq -r '.outputName // "android"' "$config_file")
        DEBUG=$(jq -r '.debug // false' "$config_file" | tr '[:upper:]' '[:lower:]')
        MD5_CACHE=$(jq -r '.md5Cache // false' "$config_file" | tr '[:upper:]' '[:lower:]')
        SKIP_COMPRESS_TEXTURE=$(jq -r '.skipCompressTexture // false' "$config_file" | tr '[:upper:]' '[:lower:]')
        SOURCE_MAPS=$(jq -r '.sourceMaps // false' "$config_file" | tr '[:upper:]' '[:lower:]')
    else
        echo -e "${YELLOW}警告: 未找到 python3 或 jq，无法解析配置文件，使用默认配置${NC}"
    fi
    
    echo -e "${GREEN}渠道配置加载完成:${NC}"
    echo "  Build Path: $BUILD_PATH"
    echo "  Output Name: $OUTPUT_NAME"
    echo "  Debug: $DEBUG"
}

# 修改 AndroidManifest.xml 中的图标
modify_android_manifest_icon() {
    if [ -z "$CHANNEL" ]; then
        return
    fi
    
    local icon_name=$(get_channel_icon "$CHANNEL")
    if [ -z "$icon_name" ]; then
        echo -e "${YELLOW}警告: 渠道 $CHANNEL 没有配置图标映射${NC}"
        return
    fi
    
    # 查找 AndroidManifest.xml 文件
    local manifest_paths=(
        "$PROJECT_PATH/$BUILD_PATH/proj/app/src/main/AndroidManifest.xml"
        "$PROJECT_PATH/$BUILD_PATH/app/src/main/AndroidManifest.xml"
        "$PROJECT_PATH/native/engine/android/app/src/main/AndroidManifest.xml"
        "$PROJECT_PATH/native/app/src/main/AndroidManifest.xml"
    )
    
    local manifest_file=""
    for path in "${manifest_paths[@]}"; do
        if [ -f "$path" ]; then
            manifest_file="$path"
            break
        fi
    done
    
    if [ -z "$manifest_file" ]; then
        echo -e "${YELLOW}警告: 未找到 AndroidManifest.xml 文件${NC}"
        echo "  尝试的路径:"
        for path in "${manifest_paths[@]}"; do
            echo "    $path"
        done
        return
    fi
    
    echo -e "${GREEN}修改 AndroidManifest.xml: $manifest_file${NC}"
    echo "  渠道: $CHANNEL"
    echo "  图标: $icon_name"
    
    # 备份原文件
    local backup_file="${manifest_file}.backup"
    cp "$manifest_file" "$backup_file"
    
    # 使用 sed 替换 android:icon 属性
    # 匹配模式: android:icon="@mipmap/xxx" 或 android:icon="@drawable/xxx"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS 使用 -i '' 而不是 -i
        sed -i '' "s/android:icon=\"@mipmap\/[^\"]*\"/android:icon=\"@mipmap\/${icon_name}\"/g" "$manifest_file"
        sed -i '' "s/android:icon=\"@drawable\/[^\"]*\"/android:icon=\"@mipmap\/${icon_name}\"/g" "$manifest_file"
    else
        # Linux 使用 -i
        sed -i "s/android:icon=\"@mipmap\/[^\"]*\"/android:icon=\"@mipmap\/${icon_name}\"/g" "$manifest_file"
        sed -i "s/android:icon=\"@drawable\/[^\"]*\"/android:icon=\"@mipmap\/${icon_name}\"/g" "$manifest_file"
    fi
    
    echo -e "${GREEN}✅ AndroidManifest.xml 图标已更新为 @mipmap/${icon_name}${NC}"
    echo "  备份文件: $backup_file"
}

# 构建构建参数字符串
build_params() {
    # 如果指定了渠道，使用 taskName 格式：android-{渠道名}
    if [ -n "$CHANNEL" ]; then
        local task_name="android-${CHANNEL}"
        echo -e "${GREEN}使用任务名称: $task_name${NC}"
        echo "taskName=$task_name"
        return
    fi
    
    # 默认使用参数字符串方式
    local params="platform=$PLATFORM;buildPath=$BUILD_PATH;outputName=$OUTPUT_NAME;debug=$DEBUG;md5Cache=$MD5_CACHE;skipCompressTexture=$SKIP_COMPRESS_TEXTURE;sourceMaps=$SOURCE_MAPS"
    
    if [ "$SIGN" = "true" ] && [ -n "$KEYSTORE" ]; then
        params="$params;keystorePath=$(cd "$PROJECT_PATH" && cd "$(dirname "$KEYSTORE")" && pwd)/$(basename "$KEYSTORE")"
        if [ -n "$KEYSTORE_PASSWORD" ]; then
            params="$params;keystorePassword=$KEYSTORE_PASSWORD"
        fi
        if [ -n "$ALIAS" ]; then
            params="$params;keystoreAlias=$ALIAS"
        fi
        if [ -n "$ALIAS_PASSWORD" ]; then
            params="$params;keystoreAliasPassword=$ALIAS_PASSWORD"
        fi
    fi
    
    echo "$params"
}

# 查找 APK 文件
find_apk() {
    local dir="$1"
    local apk=$(find "$dir" -name "*.apk" -type f | head -n 1)
    echo "$apk"
}

# 执行构建
build() {
    echo "========================================"
    echo "开始构建 Android 包"
    echo "========================================"
    echo "项目路径: $PROJECT_PATH"
    
    # 加载渠道配置
    load_channel_config
    
    echo "构建配置:"
    echo "  渠道: ${CHANNEL:-未指定}"
    echo "  Platform: $PLATFORM"
    echo "  Build Path: $BUILD_PATH"
    echo "  Output Name: $OUTPUT_NAME"
    echo "  Debug: $DEBUG"
    echo "  MD5 Cache: $MD5_CACHE"
    echo "  Skip Compress Texture: $SKIP_COMPRESS_TEXTURE"
    echo "  Source Maps: $SOURCE_MAPS"
    echo "  Sign: $SIGN"
    if [ "$SIGN" = "true" ]; then
        echo "  Keystore: $KEYSTORE"
        echo "  Alias: $ALIAS"
    fi
    echo ""
    
    check_cocos_creator
    
    local params=$(build_params)
    
    # 检查是否使用 taskName
    if [[ "$params" == taskName=* ]]; then
        local task_name="${params#taskName=}"
        echo "  任务名称: $task_name"
    else
        echo "构建参数: $params"
    fi
    
    local command="\"$COCOS_CREATOR_PATH\" --project \"$PROJECT_PATH\" --build \"$params\""
    
    echo "执行命令: $command"
    echo ""
    
    # 执行构建
    eval "$command"
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}构建完成！${NC}"
    echo "========================================"
    
    # 修改 AndroidManifest.xml 中的图标
    modify_android_manifest_icon
    
    local output_path="$PROJECT_PATH/$BUILD_PATH"
    if [ -d "$output_path" ]; then
        echo "输出路径: $output_path"
        
        # 查找 APK 文件
        local apk=$(find_apk "$output_path")
        if [ -n "$apk" ]; then
            echo -e "${GREEN}找到 APK 文件: $apk${NC}"
            echo "APK 大小: $(du -h "$apk" | cut -f1)"
        else
            echo -e "${YELLOW}未找到 APK 文件，请检查构建输出目录${NC}"
        fi
    else
        echo -e "${YELLOW}构建输出目录不存在: $output_path${NC}"
    fi
}

# 主函数
main() {
    parse_args "$@"
    build
}

# 运行
main "$@"
