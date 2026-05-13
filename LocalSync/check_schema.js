const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'FeishuSyncLocal', '.env') });

const pool = new Pool({ 
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME 
});

async function check() {
    try {
        const docs = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cloud_docs'");
        console.log("--- cloud_docs columns ---");
        console.table(docs.rows);

        const files = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploaded_files'");
        console.log("--- uploaded_files columns ---");
        console.table(files.rows);
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        await pool.end();
    }
}

check();
