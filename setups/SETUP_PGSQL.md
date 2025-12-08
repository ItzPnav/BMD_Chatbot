# 🐘 **BMD_Chatbot — PostgreSQL + pgvector Setup Guide**

This guide provides **everything required** to install, configure, initialize, and verify PostgreSQL & pgvector for the **BMD_Chatbot RAG engine**.

It includes:

* Installing PostgreSQL
* Adding pgvector
* Creating the database
* Creating all tables
* Running sanity checks
* Troubleshooting
* Suggested best-practices for production

---

# 📌 **Why You Need PostgreSQL + pgvector**

The BMD_Chatbot uses:

* **PostgreSQL** → stores documents, chats, and metadata
* **pgvector extension** → stores AI embeddings for semantic search

Your final DB schema supports:

* RAG retrieval
* Chunked embeddings
* Fast vector similarity search
* Chat history persistence

---

# 🚀 **1. Installing PostgreSQL (All OS Supported)**

Download from:

👉 [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

Install version **15 or above**.

During installation:

* Username: `postgres`
* Password: `postgres` (you can change later)
* Port: `5432`

Verify installation:

```bash
psql --version
```

---

# 🧩 **2. Connect to PostgreSQL**

Open your terminal (Windows, macOS, Linux):

```bash
psql -U postgres -h localhost -p 5432
```

Enter password (default: postgres)

---

# 🧱 **3. Create the Database**

Inside `psql` shell:

```sql
CREATE DATABASE bmd_chatbot;
```

Switch to it:

```sql
\c bmd_chatbot;
```

---

# 🔌 **4. Install pgvector Extension**

Inside the database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Verify:

```sql
SELECT extname FROM pg_extension;
```

You should see:

```
vector
```

---

# 🧬 **5. Create Required Tables**

Paste these EXACT schemas:

---

## 📝 **Table 1 — documents**

Stores raw text files uploaded by admin.

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

---

## 🧠 **Table 2 — embeddings**

Stores chunked embeddings for vector search.

> ⚠️ Your bge-m3 model uses **1024-dimensional vectors**
> Update if using a different model.

```sql
CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT,
  chunk_index INT,
  embedding vector(1024)
);
```

Index for fast retrieval:

```sql
CREATE INDEX idx_embedding_vector
ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 💬 **Table 3 — chat_sessions**

Tracks sessions like ChatGPT.

```sql
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💭 **Table 4 — chat_messages**

Stores user + assistant messages.

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Index for retrieval:

```sql
CREATE INDEX idx_chat_session ON chat_messages(session_id);
```

---

# 🧪 **6. Verify Everything**

Check tables:

```sql
\dt
```

Expected:

```
documents
embeddings
chat_sessions
chat_messages
```

Count documents:

```sql
SELECT COUNT(*) FROM documents;
```

Check embeddings count:

```sql
SELECT COUNT(*) FROM embeddings;
```

Check pgvector:

```sql
SELECT '(1,2,3)'::vector;
```

---

# 🧗 **7. Useful PostgreSQL Commands**

Describe table:

```sql
\d documents
```

List databases:

```sql
\l
```

List extensions:

```sql
\dx
```

Export data:

```sql
\copy documents TO 'documents.csv' CSV HEADER;
```

Clear a table:

```sql
TRUNCATE embeddings RESTART IDENTITY CASCADE;
```

---

# 🩺 **8. Troubleshooting**

---

### ❌ Error: `extension "vector" not found`

Fix:

```sql
SHOW shared_preload_libraries;
```

If `pgvector` missing → reinstall Postgres with pgvector.

---

### ❌ Error: password authentication failed

Edit pg_hba.conf:

```
local all postgres trust
```

Restart Postgres.

---

### ❌ Embeddings too slow

Ensure IVFFlat index exists.

```sql
\d+ embeddings
```

---

### ❌ Wrong vector dimension

Your bge-m3 model = **1024 dimension**

Check embedding count:

```sql
SELECT dimensions(embedding) FROM embeddings LIMIT 1;
```

---

# 🔐 **9. Production Security Recommendations**

✔ Change default postgres password
✔ Use SSL connections
✔ Restrict inbound connections
✔ Set up a read-only DB user for production frontend
✔ Enable WAL archiving
✔ Use pgBouncer for connection pooling


