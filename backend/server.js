import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chatRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import pool from './src/config/database.js';
import embeddingService from './src/services/embeddingService.js';
import rerankerService from './src/services/rerankerService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4455;

// Middleware
app.use(cors());

app.use(express.json({
  strict: false,    // allow invalid JSON
  type: 'application/json',
  limit: '5mb'
}));


// -----------------------------------------------------------
// CLEAN LOGGING MIDDLEWARE
// -----------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const time = Date.now() - start;

    let label = "API";
    const url = req.url;

    if (url.startsWith("/api/documents/upload")) label = "UPLOAD";
    else if (url.startsWith("/api/documents/process")) label = "EMBEDDINGS";
    else if (url.startsWith("/api/documents/search")) label = "SEARCH";
    else if (url.startsWith("/api/documents")) label = "DOCUMENTS";
    else if (url.startsWith("/api/chat")) label = "CHAT";

    console.log(
      `📌 [${label}] ${req.method} ${req.url} | ${res.statusCode} | ${time}ms`
    );
  });

  next();
});


app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.warn("⚠️ Ignored invalid JSON body");
    return res.status(400).json({ error: "Invalid JSON" });
  }
  next();
});


app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// FIXED: Mount chat routes at /api (NOT /api/chat)
app.use('/api', chatRoutes);

// Document routes stay the same
app.use('/api/documents', documentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'BMD Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      chat: '/api/chat',
      documents: '/api/documents',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const dbHealthy = true;

    const embeddingsHealthy = await embeddingService.healthCheck();
    const rerankerHealthy = await rerankerService.healthCheck();

    const allHealthy = dbHealthy && embeddingsHealthy && rerankerHealthy;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        embeddings: embeddingsHealthy ? 'connected' : 'disconnected',
        reranker: rerankerHealthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                  BMD Chatbot API Server                       ║
║                                                               ║
║        Server running on port ${PORT}                            ║
║        Environment: ${process.env.NODE_ENV || 'development'}                               ║
║                                                               ║
║        Endpoints:                                             ║
║        • http://localhost:${PORT}/api/chat                       ║
║        • http://localhost:${PORT}/api/documents                  ║
║        • http://localhost:${PORT}/api/health                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end();
  process.exit(0);
});
