
# 🔰 BMD_Chatbot — Setup Order Guide  
### *Follow these steps in sequence to avoid errors and ensure a clean installation.*

This guide lists the **exact order** in which all setup steps must be completed when installing the BMD_Chatbot system.

---

# ✅ **1. Clone Repository**
```
git clone https://github.com/yourusername/BMD_Chatbot.git
cd BMD_Chatbot
```

---

# ✅ **2. Download Required AI Models**
Before anything else, download models manually:

### Embeddings Model (bge-m3)
Place inside:
```
infra/embeddings/models/bge-m3/
```

### Reranker Model (bge-reranker)
Place inside:
```
infra/reranker/models/bge-reranker/
```

⚠️ Ensure files like `config.json`, `model.safetensors`, and `tokenizer.json` exist.

---

# ✅ **3. PostgreSQL + pgvector Setup**
Follow full instructions in **SETUP_PGSQL.md**

Steps:
1. Install PostgreSQL
2. Create database `bmd_chatbot`
3. Enable extension:
```
CREATE EXTENSION vector;
```
4. Create required tables

---

# ✅ **4. Configure Environment Variables**
Create `.env` in `backend/`:
```
PORT=4455
DATABASE_URL=postgres://postgres:postgres@postgres:5432/bmd_chatbot
EMBEDDINGS_SERVICE_URL=http://embeddings:80
RERANKER_SERVICE_URL=http://reranker:80
ANTHROPIC_API_KEY=your_key_here
```

Create `.env` in `frontend/`:
```
VITE_BACKEND_URL=http://localhost:4455
```

---

# ✅ **5. Docker Setup (Infrastructure)**
Run infrastructure services first — DB, embeddings, reranker.

Inside the `infra` folder:

```
cd infra
docker compose up --build
```

Wait until:
- 🟢 postgres is healthy  
- 🟢 embeddings server shows "Model loaded"  
- 🟢 reranker server shows "Running"  

---

# ✅ **6. Backend Setup**
```
cd backend
npm install
npm run dev
```

Verify backend health:
```
http://localhost:4455/api/health
```

---

# ✅ **7. Frontend Setup**
```
cd frontend
npm install
npm run dev
```

Open:
```
http://localhost:5173
```

---

# ✅ **8. Verify Full System Connectivity**
Check these:

### Embeddings:
```
curl http://localhost:8088/health
```

### Reranker:
```
curl http://localhost:8091/health
```

### Backend:
```
http://localhost:4455/api/health
```

### Frontend:
```
http://localhost:5173
```

If all good → SYSTEM READY.

---

# 🎉 **Setup Complete**
You now have a fully working local RAG-based AI assistant.

For advanced details, refer to:
- SETUP_DOCKER.md  
- SETUP_PGSQL.md  
- SETUP_EMBEDDINGS.md  
- SETUP_RERANKER.md  
- SETUP_BACKEND.md  
- SETUP_FRONTEND.md  
- SETUP_COMPLETE.md  
