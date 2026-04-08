@echo off
chcp 65001 >nul
setlocal
echo ======================================================
echo    Feishu Project Deployment (Windows)
echo ======================================================

set "PROJECT_ROOT=%~dp0"
set "PORTAL_DIR=%~dp0FeishuDisplayPortal"
set "SYNC_DIR=%~dp0FeishuSyncLocal"

:: 1. 检查环境变量配置
if not exist "%SYNC_DIR%\.env" (
    echo [警告] 未发现 FeishuSyncLocal/.env 配置文件！
    echo 请先根据工程中的 .env.example 完善配置。
)

:: 2. 安装/全局 PM2
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [状态] 正在安装 PM2 进程管理器...
    call npm i pm2 -g
) else (
    echo [状态] PM2 已安装。
)

:: 3. 补齐依赖项
echo [状态] 正在检查依赖项 (FeishuSyncLocal)...
cd /d "%SYNC_DIR%"
call npm install --silent

echo [状态] 正在检查依赖项 (FeishuDisplayPortal)...
cd /d "%PORTAL_DIR%"
call npm install --silent

:: 4. 启动应用
echo [状态] 正在启动所有服务...
cd /d "%PROJECT_ROOT%"
pm2 start ecosystem.config.js --env production

:: 5. 保存列表及显示状态
pm2 save
pm2 list

echo ======================================================
echo    服务启动完成！
echo    看板 (Sync): http://localhost:3000
echo    展示 (Portal): http://localhost:4000
echo ======================================================
pause

