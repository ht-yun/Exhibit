-- 1. Client Encoding Setting
SET client_encoding TO 'UTF8';

-- 2. Create tables
CREATE TABLE IF NOT EXISTS bitable_records (
    record_id VARCHAR(100) PRIMARY KEY,
    fields JSONB NOT NULL,
    sync_time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cloud_docs (
    doc_id VARCHAR(100) PRIMARY KEY,
    title TEXT,
    content JSONB,
    sync_time TIMESTAMP DEFAULT NOW()
);
