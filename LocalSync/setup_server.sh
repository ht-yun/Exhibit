#!/bin/bash

# 服务器环境初始化脚本 - 用于 Exhibit 飞书同步项目

echo "==== 1. 创建必要的目录 ===="
mkdir -p uploads
mkdir -p logs
chmod -R 777 uploads logs # 确保 Node 进程有写权限
echo "目录就绪: uploads/, logs/"

echo "==== 2. 安装管理端依赖 (FeishuSyncLocal) ===="
cd FeishuSyncLocal
npm install --production
cd ..

echo "==== 3. 安装展示端依赖 (FeishuDisplayPortal) ===="
cd FeishuDisplayPortal
npm install --production
cd ..

echo "==== 4. 检查 PM2 状态 ===="
if ! command -v pm2 &> /dev/null
then
    echo "警告: 未检测到 PM2，正在全局安装..."
    npm install -g pm2
fi

echo "==== 5. 部署完成 ===="
echo "您可以执行以下命令启动服务:"
echo "pm2 start ecosystem.config.js"
echo ""
echo "注意: 请确保您已根据服务器环境修改了各个 .env 文件中的数据库连接配置。"
