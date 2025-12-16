# 🚀 BMD Chatbot — Team Runbook (bge-small, 384-dim)

> **Audience:** Internal dev team
>
> **Purpose:** This document explains **exactly how to run, understand, and maintain** the BMD Chatbot using **bge-small embeddings (384-dim)**.
>
> This is the **authoritative guide**. Follow this and the system will work.

---

## 1️⃣ What this project is (quick context)

BMD Chatbot is a **RAG-based chatbot** with:

- PostgreSQL + **pgvector** for knowledge storage
- Sentence-transformer embeddings (**bge-small** on server)
- Reranker for result refinement
- Claude (Anthropic) for final answers

The system is already:
- Designed
- Built
- Deployed
- Tested

👉 **This document covers only RUNNING & MAINTAINING it**.

---

## 2️⃣ Embedding model decision (IMPORTANT)

We use **different models for different environments**.

### 🖥️ Local Development (author machine)
- Model: `bge-m3`
- Vector size: `1024`
- Purpose: local testing only

### 🌐 Team Server (THIS DOCUMENT)
- Model: `bge-small-en-v1.5`
- Vector size: `384`
- Purpose: production / team usage

⚠️ **Never mix vector sizes with the wrong database schema.**
The backend will refuse to start if mismatched.

---

## 3️⃣ Server requirements

Minimum recommended:

- OS: Linux (Ubuntu preferred)
- RAM: **4 GB**
- CPU: 2 cores
- Disk: Enough for documents + embeddings
- Node.js: **18+**
- PostgreSQL: **14+**

No Docker is used on the team server.

---

## 4️⃣ Database setup (MANDATORY)

### 4.1 Install pgvector

Ensure pgvector is available:

```bash
sudo apt install postgresql-14-pgvector
```

Verify inside psql:

```sql
CREATE EXTENSION vector;
```

---

### 4.2 Database creation & schema

Run the following **ONCE**.

```bash
psql -U app_owner -f infra/postgres/vector-384/setup_bmd_db.sql
```

This will:
- Create `bmd_chatbot` database
- Create all tables
- Create vector indexes
- Create similarity search function

✅ Nothing else is needed on DB side.

---

### 4.3 IMPORTANT DB rule

Whenever **any** of these change:
- embedding model
- vector dimension
- chunk size

You **MUST** regenerate embeddings:

```sql
TRUNCATE embeddings;
```

Then re-run embedding generation from admin UI.

---

## 5️⃣ Backend environment configuration

### 5.1 Required env file

Create this file:

```text
backend/.env.server
```

### 5.2 `.env.server` (server-ready)

```env
PORT=4455
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_USER=app_owner
DB_PASSWORD=ChangeMe123!
DB_NAME=bmd_chatbot

EMBEDDINGS_SERVICE_URL=http://localhost:8088
RERANKER_SERVICE_URL=http://localhost:8091

ANTHROPIC_API_KEY=sk-REPLACE_ME
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

EMBEDDING_DIM=384

CHUNK_SIZE=400
CHUNK_OVERLAP=80
SEARCH_TOP_K=8
SEARCH_THRESHOLD=0.25
RERANK_TOP_K=3

DATA_DIR=./data
```

⚠️ This file is **gitignored** and must not be committed.

---

## 6️⃣ Embeddings service (bge-small)

### 6.1 Model used

- HuggingFace model: `BAAI/bge-small-en-v1.5`
- Dimension: `384`
- CPU only

### 6.2 How it runs

The embeddings service:
- Runs as a **standalone Python service**
- Listens on `http://localhost:8088`
- Exposes `/embed` and `/health`

Backend communicates with it via HTTP.

---

## 7️⃣ Reranker service

- Model: `BAAI/bge-reranker-base`
- Port: `8091`
- Independent of embedding dimension

Used to improve final context quality.

---

## 8️⃣ Backend startup

### 8.1 Install dependencies

```bash
cd backend
npm install
```

### 8.2 Start backend (server)

```bash
npm run start
```

This command:
- Loads `.env.server`
- Starts backend on port `4455`
- Verifies DB vector dimension
- Logs active configuration

If env + DB mismatch → backend **will refuse to start** (by design).

---

## 9️⃣ Backend structure (high-level)

```text
backend/
├── server.js              # App entry point
├── src/
│   ├── config/
│   │   └── database.js    # DB pool + vector dimension guard
│   ├── controllers/       # Route handlers
│   ├── services/
│   │   ├── embeddingService.js
│   │   ├── rerankerService.js
│   │   ├── documentService.js
│   │   └── chatHistoryService.js
│   ├── routes/            # API routes
│   └── utils/
│       └── vectorUtils.js # chunking + vector helpers
```

You normally only touch:
- `.env.server`
- DB (if needed)
- Admin UI (for embeddings)

---

## 🔟 Key design decisions (WHAT CHANGED)

### ✅ Embeddings
- Switched to **bge-small** for low RAM usage
- Vector size reduced to **384**

### ✅ Safety
- Backend checks DB vector dimension at startup
- Prevents silent corruption

### ✅ Configuration
- Environment-based config (`.env.server`)
- No hardcoded values

### ✅ Logging
- Human-readable startup logs
- Request-level clarity

---

## 1️⃣1️⃣ How to verify system is running

### Health check

```bash
curl http://localhost:4455/api/health
```

Expected:

```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "embeddings": "connected",
    "reranker": "connected"
  }
}
```

---

## 1️⃣2️⃣ What NOT to worry about

- Resilience
- Autoscaling
- Failover
- Load balancing

Those are **maintenance concerns** and intentionally out of scope.

---

## 1️⃣3️⃣ Final note

This chatbot has been:
- Architected
- Implemented
- Handed over

The remaining responsibility is **operation & maintenance**, not development.

If this document is followed, the system will run correctly.

---

✅ **End of runbook**

