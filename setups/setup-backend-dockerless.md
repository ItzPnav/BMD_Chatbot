# # 🚀 **BMD Chatbot – Complete Setup WITHOUT Docker**

### *Backend + Embeddings + Reranker + PostgreSQL + Frontend (Production Guide)*

This guide explains **EVERYTHING** required to deploy the full chatbot **without Docker** on a Linux server.

---

# # 📂 **1. Server Requirements**

### Recommended:

* **Ubuntu 20.04+ / 22.04**
* **4+ GB RAM** (8GB ideal for bge-m3)
* **10+ GB disk space**

### Must have:

```
Node.js 18+
Python 3.10+
PostgreSQL 15+ with pgvector
Nginx (for frontend)
Git
```

Install basics:

```bash
sudo apt update
sudo apt install -y git curl build-essential python3 python3-venv python3-pip nginx
```

---

# # 📌 2. **Clone Your Repository**

```bash
sudo mkdir -p /opt/BMD_Chatbot
sudo chown $USER:$USER /opt/BMD_Chatbot

cd /opt
git clone <YOUR_REPO_URL> BMD_Chatbot
cd BMD_Chatbot
```

---

# # 📌 3. **Install PostgreSQL + pgvector (Without Docker)**

## 3.1 Install Postgres

```bash
sudo apt install -y postgresql postgresql-contrib
```

## 3.2 Create database

Enter Postgres shell:

```bash
sudo -u postgres psql
```

Then run:

```sql
CREATE DATABASE bmd_chatbot;
\c bmd_chatbot;
```

## 3.3 Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 3.4 Create Required Tables

Paste these EXACT schemas:

### **documents**

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  filename TEXT,
  file_type TEXT,
  content TEXT,
  category TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### **embeddings**

```sql
CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT,
  chunk_index INT,
  embedding vector(1024)
);
```

Add vector index:

```sql
CREATE INDEX idx_embedding_vector
ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### **chat_sessions**

```sql
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **chat_messages**

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Exit Postgres:

```sql
\q
```

---

# # 🧬 4. **Install Embeddings Service (bge-m3)**

We run this WITHOUT Docker using Python.

## 4.1 Create virtual environment

```bash
cd /opt/BMD_Chatbot
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install text-embeddings-inference
deactivate
```

## 4.2 Place bge-m3 model files

Expected path:

```
/opt/BMD_Chatbot/infra/embeddings/models/bge-m3/
```

Should contain:

* config.json
* model.safetensors
* tokenizer.json
* special_tokens_map.json

---

# # ⚙️ 4.3 Create systemd service for embeddings

Create file:

```bash
sudo nano /etc/systemd/system/bmd-embeddings.service
```

Paste:

```ini
[Unit]
Description=BMD Embeddings Service (bge-m3)
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/BMD_Chatbot
ExecStart=/opt/BMD_Chatbot/venv/bin/tei \
  --model-path /opt/BMD_Chatbot/infra/embeddings/models/bge-m3 \
  --port 8088
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bmd-embeddings
sudo systemctl start bmd-embeddings
```

Test:

```bash
curl http://localhost:8088/health
```

---

# # 🎯 5. **Install Reranker Service (bge-reranker)**

Same process.

## 5.1 Place model files

Expected path:

```
/opt/BMD_Chatbot/infra/reranker/models/bge-reranker/
```

## 5.2 Systemd service

```bash
sudo nano /etc/systemd/system/bmd-reranker.service
```

Paste:

```ini
[Unit]
Description=BMD Reranker Service (bge-reranker)
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/BMD_Chatbot
ExecStart=/opt/BMD_Chatbot/venv/bin/tei \
  --model-path /opt/BMD_Chatbot/infra/reranker/models/bge-reranker \
  --task rerank \
  --port 8091
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bmd-reranker
sudo systemctl start bmd-reranker
```

Test it:

```bash
curl http://localhost:8091/health
```

---

# # 🧠 6. **Setup Backend**

## 6.1 Create backend `.env`

File:
`/opt/BMD_Chatbot/backend/.env`

```env
PORT=4455

DATABASE_URL=postgres://postgres:postgres@localhost:5432/bmd_chatbot

EMBEDDINGS_SERVICE_URL=http://localhost:8088
RERANKER_SERVICE_URL=http://localhost:8091

ANTHROPIC_API_KEY=YOUR_REAL_KEY

SEARCH_TOP_K=15
SEARCH_THRESHOLD=0.5
RERANK_TOP_K=3
```

## 6.2 Install backend dependencies

```bash
cd /opt/BMD_Chatbot/backend
npm install
```

## 6.3 Systemd service for backend

Create:

```bash
sudo nano /etc/systemd/system/bmd-backend.service
```

Paste:

```ini
[Unit]
Description=BMD Backend (Node.js)
After=network.target bmd-embeddings.service bmd-reranker.service postgresql.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/BMD_Chatbot/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bmd-backend
sudo systemctl start bmd-backend
```

Check backend:

```bash
curl http://localhost:4455/api/health
```

---

# # 💻 7. **Setup Frontend (React)**

## 7.1 Create `.env`

`/opt/BMD_Chatbot/frontend/.env`

```env
VITE_BACKEND_URL=http://YOUR_DOMAIN/api
```

(local testing: `http://localhost/api`)

## 7.2 Build frontend

```bash
cd /opt/BMD_Chatbot/frontend
npm install
npm run build
```

Output folder:
`/opt/BMD_Chatbot/frontend/dist`

---

# # 🌐 8. **Configure Nginx**

Create site:

```bash
sudo nano /etc/nginx/sites-available/bmd_chatbot
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    root /opt/BMD_Chatbot/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4455;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/bmd_chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

# # 🛠️ 9. **Deploying New Code (Without Docker)**

Every time you update your repo:

```bash
cd /opt/BMD_Chatbot
git pull

cd backend
npm install

cd ../frontend
npm install
npm run build

sudo systemctl restart bmd-backend
sudo systemctl restart nginx
```

(Embeddings + reranker restart **not required** unless models changed.)

---

# # 🎉 Your Chatbot Is Fully Running WITHOUT Docker

You now have:

* PostgreSQL (native service)
* Embeddings service (systemd)
* Reranker service (systemd)
* Backend API (systemd)
* Frontend built & served by Nginx
* Full RAG pipeline running locally
* Lightning fast performance

Everything is **permanent**, **auto-starts on reboot**, and **production ready**.