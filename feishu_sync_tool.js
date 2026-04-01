/**
 * 飞书-云数据库同步工具 (OpenClaw 工具版)
 * 依赖安装：npm install @larksuiteoapi/node-sdk pg node-cron
 */

const lark = require('@larksuiteoapi/node-sdk');
const { Client } = require('pg');
const cron = require('node-cron');

// --- 配置参数 ---
const FEISHU_CONFIG = {
    appId: 'cli_a92247114d78dbd7',
    appSecret: 'qOPOJ3I7iRWvR3ujWM5e0RVm08C1R2FX',
};

const DB_CONFIG = {
    host: '39.101.68.12',
    port: 5432,
    user: 'postgres',
    password: 'Ht20070218',
    database: 'openclaw_data',
};

const SYNC_TARGETS = {
    bitableAppToken: 'GFmNb1VsfayFomstonkcwv7Hnnc',
    tableId: 'tblK4kCznuCkmjyU',
    cloudDocToken: 'McyAwkOjjiYzYakkT8AccJ67n7c', // 这是一个 Wiki Token
};

// --- 初始化客户端 ---
const larkClient = new lark.Client(FEISHU_CONFIG);
const dbClient = new Client(DB_CONFIG);

/**
 * 同步多维表格记录
 */
async function syncBitable() {
    console.log('--- 开始同步多维表格 ---');
    try {
        const records = await larkClient.bitable.appTableRecord.list({
            path: {
                app_token: SYNC_TARGETS.bitableAppToken,
                table_id: SYNC_TARGETS.tableId,
            },
        });

        for (const item of records.data.items) {
            // 将飞书字段映射为数据库 JSONB 字段
            const query = `
                INSERT INTO bitable_records (record_id, fields, sync_time)
                VALUES ($1, $2, NOW())
                ON CONFLICT (record_id) DO UPDATE 
                SET fields = $2, sync_time = NOW();
            `;
            await dbClient.query(query, [item.record_id, JSON.stringify(item.fields)]);
        }
        console.log(`成功同步 ${records.data.items.length} 条记录。`);
    } catch (err) {
        console.error('多维表格同步失败:', err);
    }
}

/**
 * 同步云文档内容
 */
async function syncCloudDoc() {
    console.log('--- 开始同步云文档 ---');
    try {
        const doc = await larkClient.docx.document.get({
            path: {
                document_id: SYNC_TARGETS.cloudDocToken,
            },
        });
        
        const query = `
            INSERT INTO cloud_docs (doc_id, title, content, sync_time)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (doc_id) DO UPDATE 
            SET content = $3, sync_time = NOW();
        `;
        // 为简化演示，此处存储文档元数据。如需详细内容，需遍历 block 接口。
        await dbClient.query(query, [SYNC_TARGETS.cloudDocToken, doc.data.document.title, JSON.stringify(doc.data)]);
        console.log('云文档同步成功。');
    } catch (err) {
        console.error('云文档同步失败:', err);
    }
}

/**
 * 主程序入口
 */
async function main() {
    await dbClient.connect();
    console.log('成功连接至云数据库 (39.101.68.12)。');
    
    // 首次立即同步
    await syncBitable();
    await syncCloudDoc();

    // 设置每小时定时同步任务 (1小时一次)
    cron.schedule('0 * * * *', async () => {
        const now = new Date().toLocaleString();
        console.log(`[${now}] 正在执行每小时自动同步...`);
        await syncBitable();
        await syncCloudDoc();
    });
}

main().catch(console.error);
