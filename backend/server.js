// backend/server.js

import express from 'express';
import cors from 'cors';

import chatRoutes from './src/routes/chatRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

import pool from './src/config/database.js';
import embeddingService from './src/services/embeddingService.js';
import rerankerService from './src/services/rerankerService.js';

const app = express();
const PORT = process.env.PORT || 4455;

/* ======================================================
   🚀 STARTUP SUMMARY (READ THIS FIRST)
   ====================================================== */

console.log("\n═══════════════════════════════════════════════");
console.log("🚀 BMD Chatbot Backend Starting");
console.log("═══════════════════════════════════════════════");
console.log(`🧩 Environment        : ${process.env.NODE_ENV}`);
console.log(`🧠 Embedding Dimension: ${process.env.EMBEDDING_DIM}`);
console.log(`🔍 Search Top-K        : ${process.env.SEARCH_TOP_K}`);
console.log(`🎯 Search Threshold   : ${process.env.SEARCH_THRESHOLD}`);
console.log(`📦 Embeddings Service : ${process.env.EMBEDDINGS_SERVICE_URL}`);
console.log(`📊 Reranker Service   : ${process.env.RERANKER_SERVICE_URL}`);
console.log("═══════════════════════════════════════════════\n");

/* ======================================================
   🧩 MIDDLEWARE
   ====================================================== */

app.use(cors());

app.use(express.json({
  strict: false,
  limit: '5mb'
}));

app.use(express.urlencoded({ extended: true }));

/* ======================================================
   📌 CLEAN REQUEST LOGGING (ONE LINE PER REQUEST)
   ====================================================== */

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    let tag = "API";
    const url = req.originalUrl;

    if (url.startsWith("/api/chat")) tag = "CHAT";
    else if (url.startsWith("/api/documents/upload")) tag = "UPLOAD";
    else if (url.startsWith("/api/documents/process")) tag = "EMBEDDINGS";
    else if (url.startsWith("/api/documents")) tag = "DOCUMENTS";
    else if (url.startsWith("/api/admin")) tag = "ADMIN";
    else if (url.startsWith("/api/health")) tag = "HEALTH";

    console.log(
      `📌 [${tag}] ${req.method} ${url} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

/* ======================================================
   🧯 INVALID JSON HANDLER
   ====================================================== */

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.warn("⚠️ Invalid JSON body received");
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  next();
});

/* ======================================================
   🛣️ ROUTES
   ====================================================== */

// Chat routes mounted at /api
app.use('/api', chatRoutes);

// Document routes
app.use('/api/documents', documentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

/* ======================================================
   🏠 ROOT
   ====================================================== */

app.get('/', (req, res) => {
  res.json({
    service: 'BMD Chatbot API',
    status: 'running',
    environment: process.env.NODE_ENV,
    endpoints: {
      chat: '/api/chat',
      documents: '/api/documents',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

/* ======================================================
   ❤️ HEALTH CHECK
   ====================================================== */

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    const embeddingsHealthy = await embeddingService.healthCheck();
    const rerankerHealthy = await rerankerService.healthCheck();

    const healthy = embeddingsHealthy && rerankerHealthy;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "healthy" : "degraded",
      services: {
        database: "connected",
        embeddings: embeddingsHealthy ? "connected" : "down",
        reranker: rerankerHealthy ? "connected" : "down"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

/* ======================================================
   ❌ 404 HANDLER
   ====================================================== */

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ======================================================
   🚨 GLOBAL ERROR HANDLER
   ====================================================== */

app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

/* ======================================================
   ▶️ START SERVER
   ====================================================== */

app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════════");
  console.log(`✅ Server is live`);
  console.log(`🌐 URL        : http://localhost:${PORT}`);
  console.log(`🧪 Health     : http://localhost:${PORT}/api/health`);
  console.log("═══════════════════════════════════════════════\n");
});

/* ======================================================
   🛑 GRACEFUL SHUTDOWN
   ====================================================== */

process.on('SIGTERM', async () => {
  console.log("🛑 SIGTERM received — shutting down gracefully...");
  await pool.end();
  process.exit(0);
});
