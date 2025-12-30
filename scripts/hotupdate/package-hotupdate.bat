@echo off
REM 热更新打包脚本（Windows）
REM 用法: package-hotupdate.bat {version} {platform}
REM 示例: package-hotupdate.bat 1.0.66 android

setlocal enabledelayedexpansion

set VERSION=%1
set PLATFORM=%2

if "%VERSION%"=="" (
    echo 用法: %0 {version} {platform}
    echo 示例: %0 1.0.66 android
    exit /b 1
)

if "%PLATFORM%"=="" (
    echo 用法: %0 {version} {platform}
    echo 示例: %0 1.0.66 android
    exit /b 1
)

set BASE_DIR=hotupdate-assets\%VERSION%\%PLATFORM%
set OUTPUT_DIR=hotupdate-packages\%VERSION%\%PLATFORM%

REM 检查源目录是否存在
if not exist "%BASE_DIR%" (
    echo 错误: 源目录不存在: %BASE_DIR%
    echo 请先使用 Cocos Creator 构建热更新资源
    exit /b 1
)

REM 创建输出目录
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo ==========================================
echo 热更新打包工具
echo ==========================================
echo 版本: %VERSION%
echo 平台: %PLATFORM%
echo 源目录: %BASE_DIR%
echo 输出目录: %OUTPUT_DIR%
echo ==========================================
echo.

REM 检查是否有 7z 命令
set "SEVEN_ZIP=C:\Program Files\7-Zip\7z.exe"
if not exist "%SEVEN_ZIP%" (
    set "SEVEN_ZIP=C:\Program Files (x86)\7-Zip\7z.exe"
)

if not exist "%SEVEN_ZIP%" (
    echo 错误: 未找到 7-Zip，请安装 7-Zip 并确保在默认路径
    echo 下载地址: https://www.7-zip.org/
    exit /b 1
)

REM 打包主包
echo 正在打包主包...
if exist "%BASE_DIR%\project.manifest" if exist "%BASE_DIR%\version.manifest" (
    cd /d "%BASE_DIR%"
    
    "%SEVEN_ZIP%" a -tzip "..\..\%OUTPUT_DIR%\update.zip" project.manifest version.manifest >nul 2>&1
    
    if exist "assets" (
        "%SEVEN_ZIP%" a -tzip "..\..\%OUTPUT_DIR%\update.zip" assets\* >nul 2>&1
    )
    
    if exist "src" (
        "%SEVEN_ZIP%" a -tzip "..\..\%OUTPUT_DIR%\update.zip" src\* >nul 2>&1
    )
    
    if exist "gg.config.json" (
        "%SEVEN_ZIP%" a -tzip "..\..\%OUTPUT_DIR%\update.zip" gg.config.json >nul 2>&1
    )
    
    cd /d "%~dp0"
    
    if exist "..\..\%OUTPUT_DIR%\update.zip" (
        for %%A in ("..\..\%OUTPUT_DIR%\update.zip") do set SIZE=%%~zA
        set /a SIZE_MB=!SIZE!/1024/1024
        echo ✓ 主包打包完成: %OUTPUT_DIR%\update.zip ^(!SIZE_MB! MB^)
    ) else (
        echo ✗ 主包打包失败
    )
) else (
    echo ⚠ 主包清单文件不存在，跳过主包打包
)

echo.

REM 打包子包
if exist "%BASE_DIR%\assets" (
    echo 正在打包子包...
    set BUNDLE_COUNT=0
    
    for /d %%d in ("%BASE_DIR%\assets\*") do (
        set BUNDLE_DIR=%%d
        for %%f in ("%%d") do set BUNDLE_NAME=%%~nxf
        
        if exist "!BUNDLE_DIR!\project.manifest" if exist "!BUNDLE_DIR!\version.manifest" (
            set /a BUNDLE_COUNT+=1
            echo   打包子包: !BUNDLE_NAME!...
            
            cd /d "!BUNDLE_DIR!"
            
            "%SEVEN_ZIP%" a -tzip "..\..\..\%OUTPUT_DIR%\!BUNDLE_NAME!.zip" project.manifest version.manifest >nul 2>&1
            
            if exist "assets" (
                "%SEVEN_ZIP%" a -tzip "..\..\..\%OUTPUT_DIR%\!BUNDLE_NAME!.zip" assets\* >nul 2>&1
            )
            
            cd /d "%~dp0"
            
            if exist "..\..\..\%OUTPUT_DIR%\!BUNDLE_NAME!.zip" (
                for %%A in ("..\..\..\%OUTPUT_DIR%\!BUNDLE_NAME!.zip") do set SIZE=%%~zA
                set /a SIZE_MB=!SIZE!/1024/1024
                echo   ✓ !BUNDLE_NAME!.zip ^(!SIZE_MB! MB^)
            ) else (
                echo   ✗ !BUNDLE_NAME! 打包失败
            )
        ) else (
            echo   ⚠ !BUNDLE_NAME! 清单文件不存在，跳过
        )
    )
    
    if !BUNDLE_COUNT! equ 0 (
        echo   未找到可打包的子包
    )
) else (
    echo 未找到子包目录: %BASE_DIR%\assets
)

echo.
echo ==========================================
echo 打包完成！
echo ==========================================
echo 输出目录: %OUTPUT_DIR%
echo.
echo 文件列表:
dir /b "%OUTPUT_DIR%"
echo.
echo 下一步:
echo 1. 检查压缩包文件
echo 2. 上传到服务器: %OUTPUT_DIR%\*.zip
echo 3. 确保服务器URL可访问
echo ==========================================

endlocal

