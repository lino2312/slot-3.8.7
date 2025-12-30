#!/bin/bash

# 通过应用日志查看热更新文件路径
# 适用于发布版本（无法使用 adb root）

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 通过日志查看热更新文件路径 ===${NC}"
echo ""
echo -e "${YELLOW}提示: 此方法适用于发布版本（无法使用 adb root）${NC}"
echo ""

# 检查 adb 是否可用
if ! command -v adb &> /dev/null; then
    echo -e "${RED}错误: 未找到 adb 命令${NC}"
    exit 1
fi

# 检查设备连接
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}错误: 未检测到已连接的设备${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 设备已连接${NC}"
echo ""
echo -e "${BLUE}正在查看应用日志...${NC}"
echo -e "${YELLOW}（按 Ctrl+C 停止）${NC}"
echo ""

# 实时查看日志，过滤热更新相关信息
adb logcat -c  # 清空日志
adb logcat | grep --line-buffered -E "ZipHotUpdateManager|localRootDirPath|extractPath|searchPath|检查解压目录|初始化完成|搜索路径已更新" | while read line; do
    # 高亮显示关键信息
    if echo "$line" | grep -q "localRootDirPath"; then
        echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -q "extractPath"; then
        echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -q "searchPath"; then
        echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -q "hasConfigFile"; then
        echo -e "${YELLOW}$line${NC}"
    elif echo "$line" | grep -q "ERROR"; then
        echo -e "${RED}$line${NC}"
    else
        echo "$line"
    fi
done

