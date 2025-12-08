
# 📄 **FULL SETUP of EMBEDDINGS  — Embeddings Microservice Setup (bge-m3)**

# 🧬 **BGE-M3 Embeddings Service Setup Guide**

*(Used by BMD_Chatbot for semantic search and RAG retrieval)*

This guide explains how to install, configure, and run the **bge-m3 embeddings microservice** locally using Docker and HuggingFace’s `text-embeddings-inference` server.

This service generates **1024-dimensional dense embeddings**, which your backend stores in **pgvector** and uses for similarity search.

---

# 🌐 Official Reference Links (Required Reading)

### 🔗 HuggingFace bge-m3 model

[https://huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)

### 🔗 Text Embeddings Inference Server (Docker Image)

[https://huggingface.co/docs/text-embeddings-inference/index](https://huggingface.co/docs/text-embeddings-inference/index)

### 🔗 Model Architecture Explanation

[https://huggingface.co/blog/bge-m3](https://huggingface.co/blog/bge-m3)

---

# 📁 **Folder Structure**

Place your embeddings model inside:

```
BMD_Chatbot/
└── infra/
    └── embeddings/
        └── models/
            └── bge-m3/
                ├── config.json
                ├── model.safetensors
                ├── tokenizer.json
                ├── special_tokens_map.json
                └── other model files...
```

⚠️ **The folder must contain the full HuggingFace model**.

If missing files → the embeddings server will fail to boot.

---

# 🧩 **About bge-m3 (Why This Model?)**

bge-m3 is a **multi-function embedding model**:

* 🔹 Dense Embeddings (Semantic search)
* 🔹 Sparse Embeddings (BM25-like signals)
* 🔹 Multi-vector Embeddings
* 🔹 1024-dim embedding size
* 🔹 Excellent for retrieval-augmented generation (RAG)

It gives **state-of-the-art recall** across languages.

---

# 🐳 **Running Embeddings Service with Docker**

The embeddings service runs using HuggingFace's official container:

```
ghcr.io/huggingface/text-embeddings-inference:cpu-1.4
```

Read more:
[https://github.com/huggingface/text-embeddings-inference](https://github.com/huggingface/text-embeddings-inference)

---

# ⚙️ **Embeddings Service Configuration (docker-compose.yml)**

Your `infra/docker-compose.yml` should include:

```yaml
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
```

---

# 🚀 **Starting the Embeddings Service**

From inside:

```
BMD_Chatbot/infra
```

Run:

```bash
docker compose up --build
```

Watch logs:

```bash
docker logs -f bmd_embeddings
```

You should see:

```
Model loaded from /data
Running on port 80
```

---

# 🌐 **Embeddings API Documentation**

Official docs:
[https://huggingface.co/docs/text-embeddings-inference/quickstart](https://huggingface.co/docs/text-embeddings-inference/quickstart)

### 💡 Your local embeddings API runs at:

```
http://localhost:8088
```

### Main endpoint:

```
POST /embed
```

---

# 🧪 **Test the Embeddings API**

Use curl:

```bash
curl -X POST http://localhost:8088/embed   -H "Content-Type: application/json"   -d '{"input": ["hello world"]}'
```

Expected response:

```json
{
  "embedding": [[0.0123, -0.0044, ... 1024 dims ...]]
}
```

---

# 🔄 **How Your Backend Uses This Service**

Inside `backend/src/services/embeddingService.js`, the backend sends:

```js
POST http://localhost:8088/embed
```

It receives the embedding vector, converts it to pgvector format, and stores it.

---

# 🧱 **Embedding Dimensions**

bge-m3 outputs **1024-dimensional vectors**.

Your table must use:

```sql
embedding vector(1024)
```

If you use a different model → update dimension.

---

# ⚠️ **Common Errors & Fixes**

---

## ❌ `Model file not found: config.json`

Fix: Ensure model path is correct inside:

```
infra/embeddings/models/bge-m3/
```

---

## ❌ `embedding_service timeout` in backend

Fix: Service may be loading slowly.

Increase timeout or restart:

```bash
docker restart bmd_embeddings
```

---

## ❌ `vector dimensions mismatch`

Check:

```sql
SELECT dimensions(embedding) FROM embeddings LIMIT 1;
```

Must equal **1024**.

---

## ❌ `HTTP 500` from embeddings API

Likely because:

* model didn't load
* folder empty
* corrupted safetensors file
* docker volume mount incorrect

Check logs:

```bash
docker logs bmd_embeddings
```

---

# 📦 **Production Deployment Recommendations**

✔ Use GPU version of container for high throughput
✔ Increase NUM_THREADS for CPU serving
✔ Move model folder to mounted SSD
✔ Restart service nightly for memory cleanup
✔ Enable container auto-restart (done already)
