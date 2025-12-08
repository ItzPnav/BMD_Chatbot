# 🐳 **BMD_Chatbot — Full Docker Infrastructure Setup Guide**

Welcome to the **complete Docker setup guide** for the **BMD_Chatbot** project — an AI-powered RAG system combining PostgreSQL, pgvector, embeddings, reranking, and an intelligent backend + frontend stack.

This documentation ensures that **any developer**, on **any OS**, can bring the full system online smoothly.

---

# 📁 **Project Structure**

Your repository should look like this:

```
BMD_Chatbot/
├── backend/
├── frontend/
└── infra/
    ├── docker-compose.yml
    ├── embeddings/
    │   └── models/
    │       └── bge-m3/
    ├── reranker/
    │   └── models/
    │       └── bge-reranker/
    └── pgsql/
        └── data/
```

### 📌 Notes:

* `infra/` holds all infrastructure services.
* Models **must** be placed under `embeddings/models/` and `reranker/models/`.
* PostgreSQL data persists under `pgsql/data` so you don't lose DB content.

---

# 🔧 **Prerequisites**

Install the following:

---

## 🐋 Docker & Docker Compose

Download & install:

👉 [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Verify installation:

```bash
docker --version
docker compose version
```

---

## 🧰 Optional: cURL (useful for testing API endpoints)

macOS: `brew install curl`
Ubuntu: `sudo apt install curl`
Windows (PowerShell): included by default

---

# 🧠 **Before Running Docker — Add Your Models**

This project **requires local HuggingFace models**.

---

## 📌 Embeddings Model — `bge-m3`

Place your model files at:

```
infra/embeddings/models/bge-m3/
```

This folder must contain:

```
config.json
model.safetensors
tokenizer.json
special_tokens_map.json
```

---

## 📌 Reranker Model — `bge-reranker`

Place your model files at:

```
infra/reranker/models/bge-reranker/
```

Same required files as above.

---

# ⚙️ **Docker Compose — Master Orchestration File**

Create this file:

```
infra/docker-compose.yml
```

Paste the following FULL production-ready configuration:

---

# 🧩 **docker-compose.yml**

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15
    container_name: bmd_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bmd_chatbot
    ports:
      - "5432:5432"
    volumes:
      - ./pgsql/data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  embeddings:
    image: ghcr.io/huggingface/text-embeddings-inference:cpu-1.4
    container_name: bmd_embeddings
    restart: always
    ports:
      - "8088:80"
    volumes:
      - ./embeddings/models/bge-m3:/data
    environment:
      MODEL_ID: /data
      NUM_THREADS: 4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 10s
      retries: 5

  reranker:
    image: ghcr.io/huggingface/text-embeddings-inference:cpu-1.4
    container_name: bmd_reranker
    restart: always
    ports:
      - "8091:80"
    volumes:
      - ./reranker/models/bge-reranker:/data
    environment:
      MODEL_ID: /data
      TASK: rerank
      NUM_THREADS: 4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 10s
      retries: 5

  backend:
    container_name: bmd_backend
    build: ../backend
    restart: always
    ports:
      - "4455:4455"
    environment:
      PORT: 4455
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/bmd_chatbot
      EMBEDDINGS_SERVICE_URL: http://embeddings:80
      RERANKER_SERVICE_URL: http://reranker:80
      ANTHROPIC_API_KEY: "ADD_YOUR_KEY"
    depends_on:
      postgres:
        condition: service_healthy
      embeddings:
        condition: service_healthy
      reranker:
        condition: service_healthy

  frontend:
    container_name: bmd_frontend
    build: ../frontend
    restart: always
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

# ▶️ **Run Everything**

Navigate to:

```
cd BMD_Chatbot/infra
```

Then:

```bash
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

# 🧪 **Testing Each Service**

---

## 🔍 PostgreSQL

```
psql -U postgres -h localhost -p 5432
```

---

## 🧬 Embeddings API

```
curl -X POST http://localhost:8088/embed   -H "Content-Type: application/json"   -d '{"input":["hello world"]}'
```

---

## 🎯 Reranker API

```
curl -X POST http://localhost:8091/rerank   -H "Content-Type: application/json"   -d '{"query":"hello","documents":["hello world"]}'
```

---

## 🟦 Backend API

```
http://localhost:4455/api/health
```

---

# 🛑 Stop Everything

```
docker compose down
```

---

# 🔄 Rebuild

```
docker compose up --build
```

---

# 🗑️ Remove Everything (DB + containers)

```
docker compose down -v
```
