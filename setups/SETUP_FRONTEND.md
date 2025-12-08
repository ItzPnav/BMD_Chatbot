
# 📄 **SETUP_FRONTEND.md — Frontend Setup Guide (React + Vite)**


# 🎯 **Overview**

The BMD_Chatbot frontend is a React (Vite) application that provides:

* Admin Dashboard (Upload Files, Manage Files, Generate Embeddings, Analytics)
* Chatbot UI (Chat Window, History, Sessions)
* Smooth UI animations & Markdown rendering
* API integration with the backend (`4455`)
* File management interface for documents + embeddings pipeline

This guide will walk you through installation, configuration, environment setup, development mode, and production build.

---

# 📁 **Folder Structure**

```
BMD_Chatbot/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── assets/
    │   ├── services/
    │   ├── styles/
    │   ├── App.jsx
    │   └── index.jsx
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── .env
```

---

# 🧰 **Prerequisites**

Install:

### ✔ Node.js (v18+ recommended)

[https://nodejs.org/en](https://nodejs.org/en)

Verify:

```bash
node -v
npm -v
```

### ✔ Backend must be running

Backend URL defaults to:

```
http://localhost:4455
```

---

# 🛠️ **1. Install Frontend Dependencies**

Navigate to frontend folder:

```bash
cd BMD_Chatbot/frontend
npm install
```

This installs:

* React
* Vite
* Axios
* Zustand (if used)
* Markdown renderer
* Tailwind (if included)
* Custom UI components

---

# 🔐 **2. Create Frontend `.env` File**

Inside `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:4455
```

⚠️ Vite requires **VITE_ prefix** for exposes variables to the app.

---

# ▶️ **3. Run Development Server**

Start dev mode:

```bash
npm run dev
```

Frontend launches at:

```
http://localhost:5173
```

---

# 🔄 **4. Auto-Reload**

Vite automatically reloads when:

* Editing components
* Updating CSS modules
* Changing services API
* Editing environment files

---

# 🌐 **5. API Integration Explained**

Your frontend calls backend routes using:

```
/src/services/api.js
```

Key operations:

### ✔ Upload Files

→ `POST /api/documents/upload`

### ✔ Get All Files

→ `GET /api/documents`

### ✔ Generate Embeddings

→ `POST /api/documents/process/:id`

### ✔ Delete Files

→ `DELETE /api/documents/:id`

### ✔ Create Chat Session

→ `POST /api/chat/session`

### ✔ Send user query

→ `POST /api/chat`

---

# 🧬 **6. Markdown Rendering**

AI responses are parsed using:

```
src/components/ui/MarkdownRenderer.jsx
```

Supports:

* Headings
* Bold
* Italics
* Bullet points
* Code blocks
* Paragraph formatting

Customize via:

```
src/components/ui/MarkdownRenderer.module.css
```

---

# 🖼️ **7. Assets & Icons**

Icons live in:

```
frontend/src/assets/icons/
```

Including:

* TrashIcon
* RefreshIcon
* SendIcon
* MicIcon
* ChatIcon

---

# 🛡️ **8. Building for Production**

Run:

```bash
npm run build
```

This generates:

```
dist/
```

If running inside Docker, your `docker-compose.yml` already builds the frontend.

---

# 🚀 **9. Serve Production Build**

Use any static server:

### Option A — Vite Preview

```bash
npm run preview
```

### Option B — Node server (serve)

```bash
npm install -g serve
serve -s dist
```

### Option C — Docker integrated (recommended)

Inside `docker-compose.yml`:

```yaml
frontend:
  container_name: bmd_frontend
  build: ../frontend
  ports:
    - "5173:5173"
```

---

# 💄 **10. Styling System**

Your frontend uses:

* CSS Modules (`*.module.css`)
* Global theme in `/styles/variables.css`
* Light/dark mode ready
* Component-level styles for:

  * AdminDashboard
  * ChatPopup
  * ChatWindow
  * Buttons
  * Tables

---

# 🧪 **11. Testing**

Your project includes:

```
/test/setup.js
```

Run tests (if configured):

```bash
npm test
```

---

# 🔧 **12. Troubleshooting**

---

### ❌ Backend CORS Error

Fix backend:

```js
app.use(cors({ origin: "*" }));
```

---

### ❌ Frontend cannot reach backend

Check env:

```
VITE_BACKEND_URL=http://localhost:4455
```

Restart dev server.

---

### ❌ “No data available” in Manage Files

Backend returning wrong format
OR
Frontend using wrong service (`api` vs `adminAPI`)

---

### ❌ Icons not loading

Check import paths:

```js
import { TrashIcon } from "../../assets/icons";
```

---

### ❌ 404 on refresh

Use:

```js
server: { historyApiFallback: true }
```

in:

```
vite.config.js
```

---

# 🎉 **Frontend Setup Complete!**

You now have:

* Fully connected frontend
* Admin dashboard UI
* Realtime chat interface
* Modern Vite dev environment
* Markdown AI renderer
* Complete config for Docker + production
