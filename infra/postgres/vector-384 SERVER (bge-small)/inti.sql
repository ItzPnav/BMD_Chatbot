-- =====================================================
-- BMD Chatbot — Postgres Init (bge-small | 384 dims)
-- =====================================================

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Documents table
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- Embeddings table (384-dim for bge-small)
-- =====================================================
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- Indexes
-- =====================================================

-- Vector similarity index (tuned for small vectors)
CREATE INDEX IF NOT EXISTS embeddings_vector_idx
ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX IF NOT EXISTS embeddings_document_id_idx
ON embeddings(document_id);

CREATE INDEX IF NOT EXISTS documents_category_idx
ON documents(category);

-- =====================================================
-- Similarity search function (384-dim safe)
-- =====================================================
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.25,
    match_count INT DEFAULT 5,
    filter_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    chunk_id INTEGER,
    document_id INTEGER,
    filename VARCHAR,
    chunk_text TEXT,
    similarity FLOAT,
    category VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS chunk_id,
        e.document_id,
        d.filename,
        e.chunk_text,
        1 - (e.embedding <=> query_embedding) AS similarity,
        d.category
    FROM embeddings e
    JOIN documents d ON e.document_id = d.id
    WHERE
        (filter_category IS NULL OR d.category = filter_category)
        AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMIT;
