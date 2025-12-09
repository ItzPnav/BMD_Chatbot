
# 🛕 **BMD_Chatbot**

### *AI-Powered Temple Knowledge Assistant with Full RAG Pipeline*

<div align="center">
<img src="https://img.shields.io/badge/Tech-RAG%20Pipeline-blue?style=for-the-badge">
<img src="https://img.shields.io/badge/AI-Claude%20API-purple?style=for-the-badge">
<img src="https://img.shields.io/badge/Vector-Postgres%20pgvector-green?style=for-the-badge">
<img src="https://img.shields.io/badge/Models-bge--m3%20%7C%20bge--reranker-orange?style=for-the-badge">
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-yellow?style=for-the-badge">
<img src="https://img.shields.io/badge/Backend-Node%20Express-red?style=for-the-badge">
</div>

---

# 📌 **Overview**

**BMD_Chatbot** is an AI-powered RAG system designed for temple information processing, travel help, document-aware retrieval, and ChatGPT-like conversation with persistent history.

It uses:

* **bge-m3 embeddings**
* **bge-reranker cross encoder**
* **pgvector similarity**
* **Claude API**
* **React admin dashboard**
* **Dockerized infra**

Built for clarity, stability, and production-readiness.

---

# 📚 **Documentation Quick Links**

These are the recommended setup files for developers:

👉 **[SETUP_INSTRUCTIONS.md](setups/SETUP_INSTRUCTIONS.md)** – *Start here (exact installation order)*
👉 [SETUP_COMPLETE.md](setups/SETUP_COMPLETE.md)
👉 [SETUP_DOCKER.md](setups/SETUP_DOCKER.md)
👉 [SETUP_PGSQL.md](setups/SETUP_PGSQL.md)
👉 [SETUP_EMBEDDINGS.md](setups/SETUP_EMBEDDINGS.md)
👉 [SETUP_RERANKER.md](setups/SETUP_RERANKER.md)
👉 [SETUP_BACKEND.md](setups/SETUP_BACKEND.md)
👉 [SETUP_FRONTEND.md](setups/SETUP_FRONTEND.md)

---

# 🐋** Setup _backend + embeddings + reranker + pgsql + frontend_ Without the need of DOCKER**

👉 **[setup-backend-dockerless.md](setups/setup-backend-dockerless.md)** - _Use this document if you want to build the chatbot without Docker._


---
# 🧠 **Architecture**

```
        User Query
             ↓
      Frontend (React)
             ↓
       Backend (Express)
             ↓
 ┌────────────────────────────┐
 │     RAG Pipeline Layer     │
 ├────────────────────────────┤
 │ 1. Embedding (bge-m3)      │
 │ 2. pgvector similarity     │
 │ 3. Reranker (bge-reranker) │
 │ 4. Context Builder         │
 │ 5. Claude Answer           │
 └────────────────────────────┘
             ↓
         Chat Window
```

---

# 🚀 **Features**

### ✨ AI Temple Assistant

Temple details, history, deity extraction, clean structured answers.

### 📁 Document Upload & Processing

Upload `.txt` → chunk → embed → store.

### 🔍 Smart Search

Vector + reranker pipeline for higher accuracy.

### 💬 Chat System

Persistent chat sessions.

### 🧰 Admin Dashboard

Upload, manage, process files, generate embeddings.

### 🐳 Dockerized Infra

Single command brings up:

* Postgres + pgvector
* Embeddings server
* Reranker server
* Backend
* Frontend

---

# ⚙️ **Tech Stack**

| Layer      | Technology            |
| ---------- | --------------------- |
| Frontend   | React + Vite          |
| Backend    | Node.js + Express     |
| Database   | PostgreSQL + pgvector |
| Embeddings | bge-m3                |
| Reranker   | bge-reranker          |
| AI Model   | Claude API            |
| Infra      | Docker                |

---

# 📦 **Setup (Short Version)**

Full setup instructions: **[SETUP_ORDER.md](SETUP_ORDER.md)**

1. Download models → place in `infra/embeddings/models` & `infra/reranker/models`
2. Setup PostgreSQL (pgvector enabled)
3. Configure `.env` files
4. Start infra:

```
cd infra
docker compose up --build
```

5. Start backend:

```
cd backend
npm run dev
```

6. Start frontend:

```
cd frontend
npm run dev
```

---

# 🧪 **API Endpoints**

### Documents

```
POST /api/documents/upload
GET  /api/documents
POST /api/documents/process/:id
DELETE /api/documents/:id
```

### Chat

```
POST /api/chat
GET  /api/chat/sessions
POST /api/chat/sessions
```

### Health

```
GET /api/health
```

---

# 🛡️ Production Tips

* Use GPU inference containers
* Enable SSL reverse proxy
* Add database backups
* High availability using replicas
* Prebuild embeddings for large corpuses

---

# 🤝 Contributing

PRs & issues welcome!

---

# 📜 License

MIT License — use freely.

---

# ❤️ Credits

* BAAI for bge models
* HuggingFace inference engine
* PostgreSQL pgvector
* Claude API
* React + Vite

---

# 🚀 Made with passion by **Pnav**

Temple intelligence done right.
