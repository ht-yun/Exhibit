const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const app = express();
const pool = new Pool({ host: "39.101.68.12", port: 5432, user: "postgres", password: "Ht20070218", database: "openclaw_data" });

function dashboardHTML() {
    return fs.readFileSync(path.join(__dirname, "dashboard_index.html"), "utf8");
}
function viewerHTML() {
    return fs.readFileSync(path.join(__dirname, "doc_viewer.html"), "utf8");
}

// 获取所有已发布的云文档基础信息
app.get("/api/docs", async (req, res) => {
    try {
        const r = await pool.query("SELECT doc_id, doc_id AS title, published_data AS content, tags, sync_time FROM cloud_docs WHERE published_data IS NOT NULL ORDER BY sync_time DESC");
        res.json(r.rows);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// 单点获取已发布的云文档详情
app.get("/api/doc/:id", async (req, res) => {
    try {
        const r = await pool.query("SELECT doc_id, doc_id AS title, published_data AS content, tags, sync_time FROM cloud_docs WHERE doc_id = $1 AND published_data IS NOT NULL", [req.params.id]); 
        if (r.rows.length === 0) return res.status(404).json({ error: "文档未找到或未发布" });
        res.json(r.rows[0]); 
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

app.listen(4000, () => console.log("外部展示端已启动: http://localhost:4000"));
