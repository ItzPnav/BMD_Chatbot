-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table to store original documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create embeddings table with vector support
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on document_id for faster joins
CREATE INDEX IF NOT EXISTS embeddings_document_id_idx ON embeddings(document_id);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category);

-- 🔥 FIXED FUNCTION WITH CORRECT THRESHOLD (0.15)
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(1024),
    match_threshold FLOAT DEFAULT 0.15,
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
    ORDER BY e.embedding <=> query_embedding   -- lower distance = more similar
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bmd_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bmd_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO bmd_user;

COMMIT;
