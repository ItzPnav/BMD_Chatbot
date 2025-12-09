import db from './src/config/database.js';

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');

    // Create chat_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        archived BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('✅ chat_sessions table created');

    // Create chat_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ chat_messages table created');

    // Create feedback_ratings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback_ratings (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
        session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
        rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, rating_type)
      )
    `);
    console.log('✅ feedback_ratings table created');

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived ON chat_sessions(archived)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_feedback_ratings_message_id ON feedback_ratings(message_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_feedback_ratings_session_id ON feedback_ratings(session_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_feedback_ratings_rating_type ON feedback_ratings(rating_type)`);

    console.log('✅ All tables and indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
