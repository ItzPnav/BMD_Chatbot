import pg from 'pg';

const { Pool } = pg;

// --------------------------------------------------
// PostgreSQL connection pool
// --------------------------------------------------
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// --------------------------------------------------
// Connection lifecycle logs
// --------------------------------------------------
pool.on('connect', async (client) => {
  console.log('✅ Connected to PostgreSQL database');

  // ------------------------------------------------
  // 🔐 Embedding dimension safety check (CRITICAL)
  // ------------------------------------------------
  try {
    const { rows } = await client.query(`
      SELECT atttypmod - 4 AS dim
      FROM pg_attribute
      WHERE attrelid = 'embeddings'::regclass
        AND attname = 'embedding'
    `);

    if (!rows.length) {
      throw new Error('Could not determine embedding vector dimension');
    }

    const dbDim = rows[0].dim;
    const expectedDim = Number(process.env.EMBEDDING_DIM);

    if (!expectedDim) {
      throw new Error('EMBEDDING_DIM is not set in environment');
    }

    if (dbDim !== expectedDim) {
      throw new Error(
        `❌ Embedding dimension mismatch: DB=${dbDim}, ENV=${expectedDim}`
      );
    }

    console.log(`🧠 Embedding dimension verified: ${dbDim}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(1);
});

// --------------------------------------------------
// Query helper
// --------------------------------------------------
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// --------------------------------------------------
// Client helper (transactions etc.)
// --------------------------------------------------
export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  const timeout = setTimeout(() => {
    console.error('⚠️ A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
};

export default pool;
