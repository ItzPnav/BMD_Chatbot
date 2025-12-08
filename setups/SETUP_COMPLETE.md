
# 📄 **SETUP_COMPLETE.md — Full System Setup (BMD_Chatbot)**

*Professional + Modern GitHub Style + Developer-Friendly Formatting*

---

# 🌟 **BMD_Chatbot — Complete Installation & Setup Guide**

Welcome to the **master setup guide** for the **BMD_Chatbot** project — a fully featured RAG-powered AI assistant with:

* Document ingestion
* Vector search (pgvector)
* Embedding service (bge-m3)
* Reranker service (bge-reranker)
* Claude AI context generation
* Dynamic chat UI
* Admin dashboard
* Docker-based infrastructure

This guide covers **everything** required to run the system on **any OS**.

---

# 🧱 **1. Repository Structure Overview**

```
BMD_Chatbot/
├── backend/
├── frontend/
├── infra/
│   ├── docker-compose.yml
│   ├── embeddings/
│   │   └── models/bge-m3/
│   ├── reranker/
│   │   └── models/bge-reranker/
│   └── pgsql/data/
├── SETUP_DOCKER.md
├── SETUP_PGSQL.md
├── SETUP_EMBEDDINGS.md
├── SETUP_RERANKER.md
├── SETUP_BACKEND.md
├── SETUP_FRONTEND.md
└── README.md
```

This is the expected production structure for the entire project.

---

# 🧰 **2. Prerequisites**

You need:

### ✔ Docker Desktop

[https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

### ✔ Node.js 18+

[https://nodejs.org/en](https://nodejs.org/en)

### ✔ PostgreSQL 15+ (automatically provisioned via Docker)

### ✔ Anthropic Claude API key

[https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

# 🐳 **3. Models Setup (Required Before Docker)**

You **must** download two HuggingFace models manually:

---

## 🧬 **Embeddings Model — bge-m3**

Download from:

[https://huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)

Place it here:

```
BMD_Chatbot/infra/embeddings/models/bge-m3/
```

Required files:

* config.json
* model.safetensors
* tokenizer.json
* special_tokens_map.json

---

## 🎯 **Reranker Model — bge-reranker**

Download from:

[https://huggingface.co/BAAI/bge-reranker-base](https://huggingface.co/BAAI/bge-reranker-base)

Place it here:

```
BMD_Chatbot/infra/reranker/models/bge-reranker/
```

Same required files.

---

# 🐘 **4. Database Setup (PostgreSQL + pgvector)**

The DB is auto-created via Docker, but schema must be created manually once.

Connect:

```bash
psql -U postgres -h localhost -p 5432
```

Create DB:

```sql
CREATE DATABASE bmd_chatbot;
```

Enable vector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Create tables:

(Full definition included in SETUP_PGSQL.md)

* documents
* embeddings
* chat_sessions
* chat_messages

---

# ⚙️ **5. Configure Environment Variables**

Inside:

```
backend/.env
```

Add:

```env
PORT=4455
DATABASE_URL=postgres://postgres:postgres@postgres:5432/bmd_chatbot

EMBEDDINGS_SERVICE_URL=http://embeddings:80
RERANKER_SERVICE_URL=http://reranker:80

ANTHROPIC_API_KEY=your_key_here

SEARCH_TOP_K=15
SEARCH_THRESHOLD=0.5
RERANK_TOP_K=3
```

Inside frontend `.env`:

```env
VITE_BACKEND_URL=http://localhost:4455
```

---

# 🐳 **6. Docker Setup**

All infrastructure is defined in:

```
infra/docker-compose.yml
```

Includes:

* postgres
* embeddings (bge-m3)
* reranker (bge-reranker)
* backend
* frontend

Start everything:

```
cd BMD_Chatbot/infra
docker compose up --build
```

---

# 🔍 **7. Health Checks**

Backend:

```
http://localhost:4455/api/health
```

Embeddings:

```
curl http://localhost:8088/health
```

Reranker:

```
curl http://localhost:8091/health
```

Postgres:

```
psql -U postgres -h localhost -p 5432
```

Frontend:

```
http://localhost:5173
```

---

# 🧠 **8. How the Full RAG Pipeline Works**

```
User Query
    ↓
Backend → embeddingService → bge-m3 (vector)
    ↓
Postgres (pgvector similarity search)
    ↓
Top-K Chunk Candidates
    ↓
rerankerService → bge-reranker (cross-encoder scoring)
    ↓
Refined Top-K Context
    ↓
Claude AI → Final Answer
    ↓
Chat UI → Markdown formatting → User sees answer
```

---

# 🔌 **9. Running Backend (Dev)**

```
cd backend
npm install
npm run dev
```

---

# 🎨 **10. Running Frontend (Dev)**

```
cd frontend
npm install
npm run dev
```

---

# 🎯 **11. Running Everything with Docker**

Recommended:

```
cd infra
docker compose up --build
```

This launches:

| Service    | Port |
| ---------- | ---- |
| PostgreSQL | 5432 |
| Embeddings | 8088 |
| Reranker   | 8091 |
| Backend    | 4455 |
| Frontend   | 5173 |

---

# 🧹 **12. Resetting the Database**

Clear docs:

```sql
TRUNCATE documents RESTART IDENTITY CASCADE;
```

Clear embeddings:

```sql
TRUNCATE embeddings RESTART IDENTITY CASCADE;
```

Clear chats:

```sql
TRUNCATE chat_sessions, chat_messages RESTART IDENTITY CASCADE;
```

---

# 🛠️ **13. Debugging Tips**

---

## ❌ Frontend shows empty file list

Likely API mismatch — confirm:

```
VITE_BACKEND_URL=http://localhost:4455
```

---

## ❌ Embeddings service not responding

Check logs:

```
docker logs bmd_embeddings
```

---

## ❌ Reranker service fails

Check model folder mounted correctly.

---

## ❌ Backend says "searchSimilar is not a function"

Your `documentService.js` is missing the method.

---

## ❌ Postgres connection refused

Check if Docker is running:

```
docker ps
```

---

## ❌ Claude errors

Your Anthropic API key is missing or invalid.
Test via:

[https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

# 🚀 **14. Production Deployment Recommendations**

✔ Reverse proxy with NGINX
✔ Serve frontend static build
✔ Run backend via PM2 or Docker
✔ Switch embeddings + reranker to GPU containers
✔ Enable database backups
✔ Add monitoring (Grafana / Prometheus)

---

# 🎉 **15. You’re Fully Set Up!**

Your entire BMD_Chatbot system — database, embeddings, reranker, backend, frontend — is fully operational.

This file now acts as the **master onboarding document** for any developer or teammate.
