#!/bin/bash

# 检查热更新文件的便捷脚本
# 使用方法: ./check-hotupdate-files.sh [packageName]

PACKAGE_NAME="${1:-com.game.testGame}"

echo "=== 检查热更新文件 ==="
echo "包名: $PACKAGE_NAME"
echo ""

# 检查基础目录
echo "1. 检查应用 files 目录:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/" 2>/dev/null || \
adb shell "ls -la /data/user/0/$PACKAGE_NAME/files/" 2>/dev/null || \
echo "目录不存在或无法访问（可能需要 root 权限或使用 run-as）"
echo ""

# 检查热更新主目录
echo "2. 检查热更新主目录:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/" 2>/dev/null || \
adb shell "ls -la /data/user/0/$PACKAGE_NAME/files/gg-hot-update-zip/" 2>/dev/null || \
echo "热更新目录不存在（可能还未下载）"
echo ""

# 检查主包
echo "3. 检查主包文件:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/build-in/" 2>/dev/null || \
adb shell "ls -la /data/user/0/$PACKAGE_NAME/files/gg-hot-update-zip/build-in/" 2>/dev/null || \
echo "主包目录不存在"
echo ""

# 检查 assets 目录
echo "4. 检查 assets 目录:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/" 2>/dev/null || \
adb shell "ls -la /data/user/0/$PACKAGE_NAME/files/gg-hot-update-zip/assets/" 2>/dev/null || \
echo "assets 目录不存在（可能还未下载子游戏）"
echo ""

# 检查 Crazy777I
echo "5. 检查 Crazy777I 子游戏:"
adb shell "ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/assets/Crazy777I/" 2>/dev/null || \
adb shell "ls -la /data/user/0/$PACKAGE_NAME/files/gg-hot-update-zip/assets/Crazy777I/" 2>/dev/null || \
echo "Crazy777I 目录不存在（可能还未下载或游戏未运行）"
echo ""

# 使用 run-as（如果可用）
echo "6. 尝试使用 run-as 访问（仅调试版本）:"
adb shell "run-as $PACKAGE_NAME ls -la /data/data/$PACKAGE_NAME/files/gg-hot-update-zip/" 2>&1 | head -5 || \
echo "无法使用 run-as（可能是发布版本或应用不可调试）"
echo ""

echo "=== 提示 ==="
echo "如果目录不存在，可能的原因："
echo "1. 热更新还未下载（需要运行游戏并触发热更新）"
echo "2. 应用包名不正确"
echo "3. 需要使用 root 权限或 run-as（调试版本）"
echo ""
echo "查看应用日志中的路径信息："
echo "  adb logcat | grep -E 'ZipHotUpdateManager|localRootDirPath'"
