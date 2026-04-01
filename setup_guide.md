# 飞书-OpenClaw 数据同步配置指南

请按照以下步骤完成系统部署。

## 步骤 1：云服务器数据库设置
1.  登录您的云服务器 (39.101.68.12) 的远程桌面 (RDP)。
2.  复制 [server_setup.ps1](file:///C:/Users/liyunliang/.gemini/antigravity/brain/8888d68a-6cdc-406e-aebe-8f7d5b9fad36/server_setup.ps1) 的内容，在服务器上保存为 `setup.ps1`。
3.  右键点击 `setup.ps1` -> **使用 PowerShell 运行** (管理员身份)。
4.  脚本将自动安装 PostgreSQL 16 并开启 5432 防火墙端口。

## 步骤 2：飞书应用配置
1.  进入 [飞书开放平台](https://open.feishu.cn/app)。
2.  点击 **创建自建应用**。
3.  **权限管理**：开启以下权限：
    - `bitable:app` (查看、编辑多维表格)
    - `docx:document:readonly` (读取云文档内容)
    - `im:message:send_as_bot` (可选：用于机器人发送通知)
4.  **机器人能力**：开启应用机器人功能。
5.  **凭据获取**：复制 `App ID` 和 `App Secret`。
6.  **版本管理**：创建一个版本并发布（自建应用通常会自动审核通过）。

## 步骤 3：获取多维表格与云文档 Token
在本地工具中，您需要填入以下三个核心标识符：
1.  **多维表格 App Token**: 打开表格，在浏览器 URL 中可以看到：`https://.../base/`**[这里就是 App Token]**`?table=...`
2.  **表格 Table ID**: 在同一 URL 的末尾：`?table=`**[这里就是 Table ID]**
3.  **云文档 Token**: 打开文档，URL 中：`https://.../docx/`**[这里就是 Doc Token]**

## 步骤 4：数据库初始化 (重要)
在云服务器数据库安装完成后：
1.  登录数据库（可以使用自带的 `psql` 或 DBeaver）。
2.  创建一个名为 `openclaw_data` 的数据库。
3.  执行 **[init_db.sql](file:///C:/Users/liyunliang/.gemini/antigravity/brain/8888d68a-6cdc-406e-aebe-8f7d5b9fad36/init_db.sql)** 中的 SQL 语句来创建表结构。

## 步骤 5：本地同步工具配置
1.  在您的**本地电脑**创建一个新文件夹，并在终端中打开。
2.  运行命令：`npm init -y` 和 `npm install @larksuiteoapi/node-sdk pg node-cron`。
3.  将 **[feishu_sync_tool.js](file:///C:/Users/liyunliang/.gemini/antigravity/brain/8888d68a-6cdc-406e-aebe-8f7d5b9fad36/feishu_sync_tool.js)** 复制到该文件夹中。
4.  打开该文件，根据步骤 3 填入您的 `App Token` 和 `Table ID`。
5.  启动同步任务：`node feishu_sync_tool.js`。

## 步骤 6：验证数据
1.  观察终端输出，确认为 "Syncing... Done"。
2.  使用数据库工具（如 DBeaver）连接 `39.101.68.12:5432`，账号 `postgres`，密码 `Ht20070218`，即可查看已同步的数据。
