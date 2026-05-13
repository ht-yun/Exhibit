@echo off
setlocal enabledelayedexpansion

echo ==== 1. 创建必要的目录 ====
if not exist "uploads" (
    mkdir uploads
    echo 已创建 uploads/ 目录
)
if not exist "logs" (
    mkdir logs
    echo 已创建 logs/ 目录
)

echo ==== 2. 安装管理端依赖 (FeishuSyncLocal) ====
cd FeishuSyncLocal
call npm install --production
if %ERRORLEVEL% neq 0 (
    echo [错误] FeishuSyncLocal 依赖安装失败
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo ==== 3. 安装展示端依赖 (FeishuDisplayPortal) ====
cd FeishuDisplayPortal
call npm install --production
if %ERRORLEVEL% neq 0 (
    echo [错误] FeishuDisplayPortal 依赖安装失败
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo ==== 4. 检查 PM2 状态 ====
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [提示] 未检测到 PM2，正在全局安装...
    call npm install -g pm2
)

echo ==== 5. 部署完成 ====
echo 您可以执行以下命令启动服务:
echo npx pm2 start ecosystem.config.js
echo.
echo 注意: 请确保您已根据服务器环境修改了各个 .env 文件中的数据库连接配置。
pause
