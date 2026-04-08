const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') }); // 加载环境变量

const app = express();
const pool = new Pool({ 
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME 
});


function dashboardHTML() {
    return fs.readFileSync(path.join(__dirname, "dashboard_index.html"), "utf8");
}
function viewerHTML() {
    return fs.readFileSync(path.join(__dirname, "doc_viewer.html"), "utf8");
}

// 辅助函数：从飞书文档 JSON 中提取纯文本摘要
function extractPreview(publishedData) {
    try {
        // published_data 结构通常由 get_document_content 返回的 blocks 组成
        // 这里假设同步脚本存入的是格式化后的内容或原始 blocks
        const blocks = publishedData.blocks || [];
        for (const block of blocks) {
            if (block.block_type === 2 && block.text_content) { // 2 = text/paragraph
                return block.text_content.substring(0, 150);
            }
        }
    } catch (e) {}
    return "飞书知识库在线文档";
}

// 获取所有已发布的云文档基础信息
app.get("/api/docs", async (req, res) => {
    try {
        const r = await pool.query("SELECT doc_id, title, published_data, tags, sync_time FROM cloud_docs WHERE published_data IS NOT NULL ORDER BY sync_time DESC");
        
        const formatted = r.rows.map(row => ({
            doc_id: row.doc_id,
            title: row.title || "未命名文档",
            content: extractPreview(row.published_data),
            tags: row.tags,
            sync_time: row.sync_time
        }));

        res.json(formatted);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// 单点获取已发布的云文档详情
app.get("/api/doc/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const r = await pool.query("SELECT doc_id, title, published_data, tags, sync_time FROM cloud_docs WHERE doc_id = $1 AND published_data IS NOT NULL", [id]); 
        if (r.rows.length === 0) return res.status(404).json({ error: "文档未找到或未发布" });
        
        const row = r.rows[0];
        res.json({
            doc_id: row.doc_id,
            title: row.title || "未命名文档",
            content: row.published_data, // 详情页需要完整 JSON
            tags: row.tags,
            sync_time: row.sync_time
        }); 
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(dashboardHTML());
});

app.get("/doc/:id", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(viewerHTML());
});

app.listen(4000, '0.0.0.0', () => console.log("外部展示端已启动: http://0.0.0.0:4000"));
