-- =====================================================
-- BMD Chatbot — Full DB Setup (bge-small | 384 dims)
-- =====================================================

-- Create database
CREATE DATABASE bmd_chatbot;
\c bmd_chatbot

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Documents
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
-- Embeddings (384-dim)
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

CREATE INDEX IF NOT EXISTS embeddings_vector_idx
ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX IF NOT EXISTS embeddings_document_id_idx
ON embeddings(document_id);

CREATE INDEX IF NOT EXISTS documents_category_idx
ON documents(category);

-- =====================================================
-- Chat sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- Chat messages
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at
ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived
ON chat_sessions(archived);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
ON chat_messages(created_at);

-- =====================================================
-- Feedback (like / dislike)
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback_ratings (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, rating_type)
);

CREATE INDEX IF NOT EXISTS idx_feedback_message_id
ON feedback_ratings(message_id);

CREATE INDEX IF NOT EXISTS idx_feedback_session_id
ON feedback_ratings(session_id);

CREATE INDEX IF NOT EXISTS idx_feedback_rating_type
ON feedback_ratings(rating_type);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at
ON feedback_ratings(created_at);

-- =====================================================
-- Similarity search function (384-dim)
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
