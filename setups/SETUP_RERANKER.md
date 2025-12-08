
# 📄 **SETUP_RERANKER.md — Reranker Microservice (bge-reranker) Setup Guide**


# 🎯 **Overview**

The BMD_Chatbot uses a **second-stage re-ranking model** to refine semantic search results.
After embeddings retrieval (via bge-m3), this microservice applies a **cross-encoder model** to:

* Improve ranking accuracy
* Boost final answer relevance
* Ensure top-K context is best possible for Claude

Your reranker model:

```
bge-reranker
(local HuggingFace folder)
```

---

# 🌐 **Official Links**

### 🔗 HuggingFace Original Model (BAAI/bge-reranker-base)

[https://huggingface.co/BAAI/bge-reranker-base](https://huggingface.co/BAAI/bge-reranker-base)

### 🔗 HuggingFace Text-Inference Server (Reranker mode)

[https://huggingface.co/docs/text-embeddings-inference/rerank](https://huggingface.co/docs/text-embeddings-inference/rerank)

### 🔗 Docker Image

[https://github.com/huggingface/text-embeddings-inference](https://github.com/huggingface/text-embeddings-inference)

---

# 📁 **Folder Structure**

Place your reranker model at:

```
BMD_Chatbot/
└── infra/
    └── reranker/
        └── models/
            └── bge-reranker/
                ├── config.json
                ├── model.safetensors
                ├── tokenizer.json
                ├── special_tokens_map.json
                └── other model files...
```

⚠️ These files **must exist**.
If any is missing → model server will fail to start.

---

# 🧩 **How the Reranker Works in the RAG Pipeline**

```
User Query
    │
    ├── Step 1: Embedding search (bge-m3 → Postgres)
    │
    └── Step 2: Reranker compares:
          - Query text
          - Each retrieved chunk
          → Produces a relevance score
```

Reranker output shape:

```json
[
  {
    "text": "document chunk...",
    "score": 0.874,
    "metadata": {...}
  }
]
```

Backend takes the top-K (default: 3) → sends to Claude.

---

# 🐳 **Docker Setup for the Reranker Service**

In your `infra/docker-compose.yml` you must include:

```yaml
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
```

---

# 🚀 **Start the Reranker**

From:

```
cd BMD_Chatbot/infra
```

Run:

```bash
docker compose up --build
```

Check logs:

```bash
docker logs -f bmd_reranker
```

Expected:

```
loading rerank model...
running on port 80...
```

---

# 🌐 **API Endpoint Reference**

Local reranker runs at:

```
http://localhost:8091
```

### Primary endpoint:

```
POST /rerank
```

### Official API Docs:

[https://huggingface.co/docs/text-embeddings-inference/rerank](https://huggingface.co/docs/text-embeddings-inference/rerank)

---

# 🧪 **Test the Reranker Service**

Use curl:

```bash
curl -X POST http://localhost:8091/rerank   -H "Content-Type: application/json"   -d '{"query":"best temple","documents":["Temple A info","Temple B info"]}'
```

Expected output:

```json
[
  {"text": "Temple B info", "score": 0.93},
  {"text": "Temple A info", "score": 0.78}
]
```

---

# 🔄 **How Backend Uses the Reranker**

Your backend calls:

```js
const reranked = await rerankerService.rerank(query, documents)
```

Service request includes:

* query
* array of chunks
* top_k parameter

Used inside:

```
backend/src/controllers/chatController.js
```

This reranked output determines **final context quality** for Claude.

---

# 🧱 **Best Practices for Reranker Performance**

### ✔ Use SSD storage for model folder

### ✔ Increase NUM_THREADS if CPU is strong

### ✔ Warm up server after start by sending dummy request

### ✔ Use GPU container for high-load API servers

### ✔ Expose health endpoint via API gateway

---

# ⚠️ **Common Issues & Fixes**

---

### ❌ `Could not load model from /data`

Cause:

* Wrong volume mount
* Missing files
* Folder not readable

Fix:

* Ensure folder exists:
  `infra/reranker/models/bge-reranker/*`

---

### ❌ HTTP 500 errors from `/rerank`

Cause:

* Model not fully loaded before request
  Fix:
* Add healthcheck (already configured)
* Retry request after a few seconds

---

### ❌ Slow reranking

Reranking is heavier than embedding search.
Fixes:

* Increase CPU threads
* Use GPU
* Reduce context size before rerank step

---

# 🧠 **Production Tuning Tips**

✔ For high traffic: deploy multiple reranker replicas
✔ Use Nginx load balancing in front
✔ Cache reranker responses by query
✔ Pre-rerank cached documents if your dataset rarely changes

---

# 🎉 **Reranker Microservice Ready!**

Your **bge-reranker** service is now fully operational and integrated into the BMD RAG pipeline.

You can now enjoy:

* Cleaner context
* Higher accuracy
* Better answers
* Smarter semantic matching


