const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const originalPort = process.env.PORT; // 备份端口
require("dotenv").config({ path: path.join(__dirname, '.env') }); // 加载环境变量
if (originalPort) process.env.PORT = originalPort; // 恢复端口

const app = express();
const pool = new Pool({ 
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 2
});

// 静态服务上传的文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


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

// 增强型查询包装器
async function queryWithRetry(text, params, retries = 2) {
    try {
        return await pool.query(text, params);
    } catch (err) {
        if (retries > 0 && err.message.includes('terminated')) {
            console.warn(`[DB Retry] 展示端查询中断，正在重试... (剩余: ${retries})`);
            await new Promise(r => setTimeout(r, 2000));
            return queryWithRetry(text, params, retries - 1);
        }
        throw err;
    }
}

// 系统健康检查接口
app.get("/api/health", async (req, res) => {
    try {
        await queryWithRetry("SELECT 1");
        res.json({ status: "ok", database: "connected", time: new Date() });
    } catch (e) {
        res.status(503).json({ status: "error", database: "disconnected", detail: e.message });
    }
});

// 获取所有已发布的云文档基础信息
app.get("/api/docs", async (req, res) => {
    try {
        const r = await queryWithRetry("SELECT doc_id, title, published_data, tags, download_count, sync_time FROM cloud_docs WHERE published_data IS NOT NULL ORDER BY sync_time DESC");
        
        const formatted = r.rows.map(row => ({
            doc_id: row.doc_id,
            title: row.title || "未命名文档",
            content: extractPreview(row.published_data),
            tags: row.tags,
            download_count: row.download_count || 0,
            sync_time: row.sync_time
        }));

        res.json(formatted);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// 单点获取已发布的云文档详情
app.get("/api/doc/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const r = await pool.query("SELECT doc_id, title, published_data, tags, download_count, sync_time FROM cloud_docs WHERE doc_id = $1 AND published_data IS NOT NULL", [id]); 
        if (r.rows.length === 0) return res.status(404).json({ error: "文档未找到或未发布" });
        
        const row = r.rows[0];
        res.json({
            doc_id: row.doc_id,
            title: row.title || "未命名文档",
            content: row.published_data, // 详情页需要完整 JSON
            tags: row.tags,
            download_count: row.download_count || 0,
            sync_time: row.sync_time
        }); 
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 获取已上传文件列表 (物料资料)
app.get("/api/files", async (req, res) => {
    try {
        const r = await pool.query("SELECT * FROM uploaded_files ORDER BY upload_time DESC");
        res.json(r.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 下载文件并增加计数 (同步管理端逻辑)
app.get("/api/files/:id/download", async (req, res) => {
    try {
        const { id } = req.params;
        const r = await pool.query("UPDATE uploaded_files SET download_count = download_count + 1 WHERE id = $1 RETURNING *", [id]);
        if (r.rows.length === 0) return res.status(404).send("File not found");
        
        const file = r.rows[0];
        const filePath = path.join(__dirname, "../uploads", file.filename);
        if (fs.existsSync(filePath)) {
            res.download(filePath, file.original_name);
        } else {
            res.status(404).send("File physical content not found");
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 云文档下载/点击统计
app.post("/api/doc/:id/track", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE cloud_docs SET download_count = download_count + 1 WHERE doc_id = $1", [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// =========== AI 对话 ===========

// 中文分词函数：用 pg_trgm 做模糊匹配 + ILIKE 做关键词匹配
async function searchKnowledgeBase(query, limit = 8) {
    // 尝试用全文搜索（pg_trgm + weighted match），降级到 ILIKE OR 匹配
    try {
        const r = await pool.query(
            `SELECT doc_id, title, published_data, sync_time
             FROM cloud_docs
             WHERE published_data IS NOT NULL
               AND (
                 title ILIKE $1
                 OR published_data::text ILIKE $1
                 OR tags::text ILIKE $1
               )
             ORDER BY download_count DESC, sync_time DESC
             LIMIT $2`,
            [`%${query}%`, limit]
        );
        return r.rows;
    } catch (e) {
        console.error('[AI Search] 检索失败:', e.message);
        return [];
    }
}

// 从 published_data JSON 中提取关键文本片段
function extractSnippets(publishedData, query, maxLen = 2000) {
    try {
        const blocks = publishedData?.blocks || [];
        const parts = [];
        for (const block of blocks) {
            if (block.text_content) {
                parts.push(block.text_content);
            }
        }
        const full = parts.join('\n');
        if (full.length <= maxLen) return full;
        // 找关键词附近的片段
        const idx = full.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, idx - Math.floor(maxLen / 2));
        return full.substring(start, start + maxLen);
    } catch (e) {
        return '';
    }
}

// AI 对话接口
app.post("/api/chat", express.json(), async (req, res) => {
    try {
        const question = (req.body.question || '').trim();
        if (!question) return res.status(400).json({ error: '问题不能为空' });
        if (question.length > 500) return res.status(400).json({ error: '问题长度不能超过500字符' });

        // 1. 检索知识库
        const matches = await searchKnowledgeBase(question, 8);

        // 2. 构建上下文
        const sources = [];
        let knowledgeContext = '';
        if (matches.length > 0) {
            for (const doc of matches) {
                const snippet = extractSnippets(doc.published_data, question, 1500);
                if (snippet) {
                    knowledgeContext += `\n--- 文档: ${doc.title} ---\n${snippet}\n`;
                    sources.push({ doc_id: doc.doc_id, title: doc.title });
                }
            }
        }

        // 3. 构建 AI prompt
        const systemPrompt = knowledgeContext
            ? `你是知识库助手。请根据以下知识库内容回答用户问题。如果知识库内容不足以回答，可以结合你的知识补充说明，但要明确区分哪些来自知识库、哪些是你的知识。\n\n知识库内容:\n${knowledgeContext}`
            : '你是知识库助手。知识库中暂无与用户问题直接相关的内容，请根据你的知识回答用户问题，并说明答案来源。';

        // 4. 调用 AI API
        const aiApiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
        const aiApiKey = process.env.AI_API_KEY || '';
        const aiModel = process.env.AI_MODEL || 'gpt-4o-mini';

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const aiRes = await fetch(aiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiApiKey}`
            },
            body: JSON.stringify({
                model: aiModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                max_tokens: 1500
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!aiRes.ok) {
            const errText = await aiRes.text().catch(() => '');
            console.error('[AI Chat] API 返回错误:', aiRes.status, errText);
            return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试' });
        }

        const aiData = await aiRes.json();
        const answer = aiData.choices?.[0]?.message?.content || '';

        res.json({ answer, sources });
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'AI 服务响应超时，请稍后重试' });
        }
        console.error('[AI Chat] 错误:', err);
        res.status(500).json({ error: '服务内部错误，请稍后重试' });
    }
});

// AI 服务健康检查
app.get("/api/chat/health", async (req, res) => {
    const aiApiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1';
    const aiApiKey = process.env.AI_API_KEY || '';
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const aiRes = await fetch(aiApiUrl.replace('/chat/completions', '/models'), {
            headers: { 'Authorization': `Bearer ${aiApiKey}` },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (aiRes.ok) {
            res.json({ status: 'ok', service: 'available' });
        } else {
            res.json({ status: 'warning', service: 'unavailable', code: aiRes.status });
        }
    } catch (e) {
        res.json({ status: 'error', service: 'unreachable', detail: e.message });
    }
});


app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(dashboardHTML());
});

app.get("/doc/:id", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(viewerHTML());
});

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log(`外部展示端已启动: http://0.0.0.0:${port}`));
