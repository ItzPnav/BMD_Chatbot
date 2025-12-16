-- Create new database for BMD Chatbot
CREATE DATABASE bmd_chatbot;

-- Connect to the new database
\c bmd_chatbot

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

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived ON chat_sessions(archived);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

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
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create a view for document statistics
CREATE OR REPLACE VIEW document_stats AS
SELECT 
    d.id,
    d.filename,
    d.category,
    d.upload_date,
    COUNT(e.id) AS chunk_count,
    AVG(LENGTH(e.chunk_text)) AS avg_chunk_length
FROM documents d
LEFT JOIN embeddings e ON d.id = e.document_id
GROUP BY d.id, d.filename, d.category, d.upload_date;

-- Create feedback_ratings table for like/dislike functionality
CREATE TABLE feedback_ratings (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, rating_type)
);

-- Create indexes for feedback_ratings
CREATE INDEX idx_feedback_ratings_message_id ON feedback_ratings(message_id);
CREATE INDEX idx_feedback_ratings_session_id ON feedback_ratings(session_id);
CREATE INDEX idx_feedback_ratings_rating_type ON feedback_ratings(rating_type);
CREATE INDEX idx_feedback_ratings_created_at ON feedback_ratings(created_at);

-- Grant permissions to app_owner
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_owner;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_owner;

COMMIT;
