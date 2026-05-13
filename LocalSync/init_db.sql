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
    tags JSONB DEFAULT '[]'::jsonb,
    published_data JSONB,
    download_count INTEGER DEFAULT 0,
    sync_time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT,
    mime_type TEXT,
    file_size BIGINT,
    file_path TEXT, -- Store path instead of BYTEA
    tags JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    download_count INTEGER DEFAULT 0,
    upload_time TIMESTAMP DEFAULT NOW(),
    extracted_text TEXT,
    kb_status TEXT DEFAULT 'none'
);
