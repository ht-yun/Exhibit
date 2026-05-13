
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'FeishuSyncLocal', 'exhibit.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, original_name, category, status, download_count FROM uploaded_files", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Uploaded Files Rows:");
        console.table(rows);
    }
    db.close();
});
