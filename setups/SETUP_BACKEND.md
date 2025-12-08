
# 📄 **SETUP_BACKEND.md — Full Backend Setup Guide (BMD_Chatbot API)**


# 🧠 **Overview**

The **backend API** of BMD_Chatbot is the heart of the entire RAG pipeline.

It performs:

* Document upload & storage
* Chunking + embeddings generation
* Semantic vector search
* Reranker scoring
* Chat history storage
* AI response generation via Claude
* Admin dashboard API
* Error handling & logging

This guide will walk you through **installing**, **configuring**, and **running** the backend in development & production environments.

---

# 📁 Folder Structure (Backend)

```
BMD_Chatbot/
└── backend/
    ├── src/
    │   ├── config/
    │   │   └── database.js
    │   ├── controllers/
    │   │   ├── chatController.js
    │   │   └── documentController.js
    │   ├── routes/
    │   ├── services/
    │   │   ├── embeddingService.js
    │   │   ├── rerankerService.js
    │   │   └── chatHistoryService.js
    │   └── utils/
    ├── package.json
    ├── server.js
    └── .env.example
```

---

# 🔧 **Prerequisites**

Install:

* Node.js LTS (18+ recommended)
  Download: [https://nodejs.org](https://nodejs.org)
* npm or yarn
* PostgreSQL (running with pgvector)
* Running embeddings service (bge-m3)
* Running reranker service (bge-reranker)
* Claude API key (Anthropic)

---

# 🔐 Create Your Backend `.env`

Inside:

```
BMD_Chatbot/backend/.env
```

Add:

```env
PORT=4455

# PostgreSQL
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bmd_chatbot

# Embeddings + Reranker URLs
EMBEDDINGS_SERVICE_URL=http://localhost:8088
RERANKER_SERVICE_URL=http://localhost:8091

# Claude API
ANTHROPIC_API_KEY=your_key_here

# Search tuning
SEARCH_TOP_K=15
SEARCH_THRESHOLD=0.5
RERANK_TOP_K=3
```

If running in Docker, use:

```env
DATABASE_URL=postgres://postgres:postgres@postgres:5432/bmd_chatbot
EMBEDDINGS_SERVICE_URL=http://embeddings:80
RERANKER_SERVICE_URL=http://reranker:80
```

---

# 📦 Install Dependencies

Inside the backend folder:

```bash
cd BMD_Chatbot/backend
npm install
```

This installs:

* express
* pg
* anthropic sdk
* multer
* cors
* dotenv
* pg-vector support
* axios/fetch utils

---

# 🏗️ Backend Start (Local Development)

Run:

```bash
npm run dev
```

or:

```bash
node server.js
```

The backend will start on:

```
http://localhost:4455
```

Check health:

```
http://localhost:4455/api/health
```

---

# 🧪 **Verify DB Connection**

If DB fails to connect, you will see:

```
❌ Database connection failed
```

Check your credentials.

To test manually:

```bash
psql -U postgres -h localhost -p 5432 -d bmd_chatbot
```

---

# 📡 **How Backend Talks to Microservices**

### 1️⃣ Embeddings Service

Backend calls:

```
POST http://localhost:8088/embed
```

Used in:

```js
embeddingService.generateEmbeddings()
```

### 2️⃣ Reranker Service

Backend calls:

```
POST http://localhost:8091/rerank
```

Used in:

```js
rerankerService.rerank()
```

### 3️⃣ PostgreSQL

Connected through `DATABASE_URL`.

---

# 🧠 **Core Backend Flow**

### **1. Document Upload**

* Saves file to disk
* Inserts metadata into DB

### **2. Document Processing**

* Reads text
* Splits into chunks
* Sends each chunk to embeddings service (bge-m3)
* Stores embedding vector in DB

### **3. Semantic Search**

* Creates embedding for query
* Finds similar chunks (pgvector `<->` operator)

### **4. Reranking**

* Sends top chunks to reranker (bge-reranker)
* Sorts by cross-encoder relevance score

### **5. AI Response Generation**

* Builds context
* Sends to Claude (Anthropic API)
* Stores conversation into chat history

---

# 🛠️ **Backend File Responsibilities**

### ✔ `chatController.js`

* Handles chat queries
* Runs RAG pipeline
* Calls Claude Sonnet 3.5/4.1
* Saves chat sessions/messages

### ✔ `documentController.js`

* Manages document upload
* Delete
* Processing embeddings
* Fetching processing status

### ✔ `documentService.js`

* DB logic for storing documents
* Chunking
* Embedding generation
* Vector search

### ✔ `embeddingService.js`

* Sends text to embeddings microservice
* Converts responses to pgvector format

### ✔ `rerankerService.js`

* Sends rerank request
* Handles fallback semantic ranking

---

# 🧰 **Backend Build for Production**

Before deploying:

```bash
npm install --production
```

Use PM2 or Docker:

```bash
pm2 start server.js
```

Or in docker-compose (already configured):

```yaml
backend:
  build: ../backend
  ports:
    - "4455:4455"
```

---

# 🧪 API Testing Endpoints

Try:

```
GET http://localhost:4455/api/health
GET http://localhost:4455/api/documents
POST /api/documents/upload
POST /api/documents/process/:id
POST /api/chat
```

---

# 🧹 Cleaning DB for Testing

Truncate all embeddings:

```sql
TRUNCATE embeddings RESTART IDENTITY CASCADE;
```

Remove all documents:

```sql
TRUNCATE documents RESTART IDENTITY CASCADE;
```

Reset chats:

```sql
TRUNCATE chat_sessions, chat_messages RESTART IDENTITY CASCADE;
```

---

# 🚨 Troubleshooting

---

### ❌ Backend cannot reach embeddings service

Check:

```bash
curl http://localhost:8088/health
```

If using Docker:

```
curl http://embeddings:80/health
```

---

### ❌ pgvector dimension mismatch

Your model is 1024 dims.

Check:

```sql
SELECT dimensions(embedding) FROM embeddings LIMIT 1;
```

---

### ❌ Claude not responding

Check your Anthropic API key:

[https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

### ❌ Document upload fails

Ensure folder permissions:

```
backend/data/documents/*
```

---

# 🎉 **Backend Setup Complete**

You now have a fully functional backend for the BMD_Chatbot:

* Connected to DB
* Connected to embeddings
* Connected to reranker
* Ready to generate AI responses via Claude
* Integrated with admin dashboard frontend
