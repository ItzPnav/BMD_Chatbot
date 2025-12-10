# 📁 BMD Chatbot - Project Structure Guide

A comprehensive guide to understanding the folder structure and navigation for new developers working on the **BMD_Chatbot** project.

---

## 📊 Project Overview

**BMD_Chatbot** is an AI-powered RAG (Retrieval Augmented Generation) system that:
- Processes temple knowledge documents
- Uses Claude API for intelligent responses
- Implements pgvector for semantic search
- Provides a React-based admin dashboard
- Maintains persistent chat history

### Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + pgvector
- **AI**: Claude API + BGE Embeddings + BGE Reranker
- **Infrastructure**: Docker (optional)

---

## 🗂️ Root Directory Structure

```
BMD chatbot/
├── backend/              # Node.js Express server
├── frontend/             # React + Vite application
├── infra/                # Docker & infrastructure files
├── docs/                 # Documentation files
├── setups/               # Setup & installation guides
├── README.md             # Project overview
├── package-lock.json     # Root dependencies lock
├── .git/                 # Git version control
├── backend_start.bat     # Quick start backend (Windows)
├── frontend_start.bat    # Quick start frontend (Windows)
├── kill_port_4455.bat    # Kill backend process (Windows)
├── psql_conn.bat         # PostgreSQL connection (Windows)
└── backend_struct.txt    # Backend structure outline
```

---

## 🔧 Backend Directory (`/backend`)

The backend is a Node.js Express server that handles:
- Chat API endpoints
- Document processing
- Vector embeddings
- RAG pipeline
- Database queries

### Structure

```
backend/
├── server.js              # Main Express server entry point
├── setup-db.js            # Database initialization script
├── package.json           # Node dependencies & scripts
├── .env                   # Environment variables (API keys, DB config)
├── node_modules/          # Installed npm packages
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.js    # PostgreSQL connection setup
│   │   ├── env.js         # Environment variable loading
│   │   └── ...            # Other config modules
│   ├── controllers/        # Request handlers
│   │   ├── chatController.js      # Chat message handling
│   │   ├── documentController.js  # Document upload/delete
│   │   ├── feedbackController.js  # User feedback (thumbs up/down)
│   │   └── ...
│   ├── routes/            # API endpoint definitions
│   │   ├── chat.js        # Chat-related routes (/api/chat/*)
│   │   ├── documents.js   # Document routes (/api/documents/*)
│   │   ├── admin.js       # Admin routes
│   │   └── ...
│   ├── services/          # Business logic & external API calls
│   │   ├── chatService.js         # RAG pipeline logic
│   │   ├── embeddingService.js    # BGE embedding calls
│   │   ├── rerankerService.js     # BGE reranker calls
│   │   ├── claudeService.js       # Claude API integration
│   │   └── ...
│   └── utils/             # Helper functions
│       ├── vectors.js     # Vector utilities
│       ├── parsePDF.js    # PDF parsing
│       └── ...
├── data/
│   ├── documents/         # Uploaded documents folder
│   │   ├── History/       # Temple history documents
│   │   ├── Manuals/       # Setup manuals
│   │   ├── Packages/      # Package info documents
│   │   └── Other/         # Miscellaneous documents
│   └── history/           # Sample temple history files
├── test-*.js              # Testing files
│   ├── test-claude.js     # Test Claude API
│   ├── test-embed.js      # Test embeddings
│   ├── test-search.js     # Test vector search
│   ├── testPgvector.js    # Test pgvector
│   └── ...
└── test.pdf               # Sample PDF for testing
```

### Key Backend Files to Know

| File | Purpose |
|------|---------|
| `server.js` | Main Express app, starts on port 4455 |
| `setup-db.js` | Creates tables, initializes pgvector |
| `src/services/chatService.js` | Core RAG logic (search + rerank + Claude) |
| `src/controllers/chatController.js` | Handles `/api/chat` requests |
| `src/routes/chat.js` | Defines chat endpoint routes |
| `.env` | Store API keys, DB credentials (never commit) |

---

## 💻 Frontend Directory (`/frontend`)

A modern React application with Vite for fast development and admin dashboard.

### Structure

```
frontend/
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
├── vitest.config.js       # Test configuration
├── package.json           # React dependencies
├── env.example            # Example environment variables
├── public/                # Static assets
│   └── favicon.ico
├── src/
│   ├── index.jsx          # React app entry point
│   ├── App.jsx            # Main App component
│   ├── App.css            # Global styles
│   ├── assets/            # Images, icons, static files
│   │   ├── icons/         # SVG icon components
│   │   │   ├── ThumbsUpIcon.jsx
│   │   │   ├── ThumbsDownIcon.jsx
│   │   │   ├── SendIcon.jsx
│   │   │   └── ...
│   │   └── ...
│   ├── components/        # Reusable React components
│   │   ├── ui/            # Shared UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Icon.jsx
│   │   │   ├── Table.jsx
│   │   │   └── MarkdownRenderer.jsx
│   │   ├── FloatingChatButton/      # Chat launcher button
│   │   │   ├── FloatingChatButton.jsx
│   │   │   └── FloatingChatButton.module.css
│   │   ├── ChatPopup/               # Chat popup window
│   │   │   ├── ChatPopup.jsx        # Main popup container
│   │   │   ├── ChatWindow.jsx       # Message display & input
│   │   │   ├── ChatPopup.module.css
│   │   │   └── ...
│   │   ├── FullscreenLayout/        # Full-page chat view
│   │   │   ├── FullscreenLayout.jsx # Full-screen chat component
│   │   │   ├── FullscreenLayout.module.css
│   │   │   └── ...
│   │   └── AdminDashboard/          # Admin panel
│   │       ├── AdminDashboard.jsx   # Main dashboard
│   │       ├── ManageFiles.jsx      # Document management
│   │       ├── Analytics.jsx        # Analytics & statistics
│   │       ├── ChatManagement.jsx   # Chat history management
│   │       ├── AdminDashboard.module.css
│   │       └── ...
│   ├── services/          # API communication & utilities
│   │   ├── api.js         # Centralized API client (fetch wrapper)
│   │   └── localStorageKeys.js # Local storage utilities
│   ├── styles/            # Global styles
│   │   └── variables.css  # CSS variables (colors, spacing, etc.)
│   └── test/              # Test files
│       └── ...
└── node_modules/          # React & dependencies
```

### Key Frontend Files to Know

| File/Folder | Purpose |
|-------------|---------|
| `src/App.jsx` | Main app entry, routes to chat or admin |
| `src/services/api.js` | All backend API calls (sendMessage, getSessions, etc.) |
| `src/components/FloatingChatButton/` | Floating chat widget on any page |
| `src/components/ChatPopup/` | Chat popup window component |
| `src/components/FullscreenLayout/` | Full-page chat view |
| `src/components/AdminDashboard/` | Admin panel for document & analytics management |

### Frontend Components Breakdown

#### **FloatingChatButton**
- Small floating button to open chat
- Can be embedded on any website
- Opens ChatPopup on click

#### **ChatPopup**
- Compact chat window (420px max-width)
- Message history
- Send/receive messages
- Feedback buttons (thumbs up/down)
- File attachment support

#### **FullscreenLayout**
- Full-page chat experience
- Larger conversation area
- Session management
- Sidebar with chat list
- Better for desktop use

#### **AdminDashboard**
- File/document management
- Embeddings generation
- Chat history review
- Analytics & statistics
- User feedback analysis

---

## 🏗️ Infrastructure Directory (`/infra`)

Contains Docker configurations and deployment files.

### Structure

```
infra/
├── docker-compose.yml     # Complete stack orchestration
├── postgres/
│   ├── Dockerfile         # PostgreSQL + pgvector image
│   ├── init.sql           # Database initialization
│   └── setup_bmd_db.sql   # BMD-specific table schemas
└── reranker/
    ├── Dockerfile         # Python reranker service
    ├── app.py             # Reranker Flask API
    └── requirements.txt   # Python dependencies
```

### Docker Services (from docker-compose.yml)

1. **PostgreSQL**: Database with pgvector extension
2. **Reranker**: BGE reranker service (Flask)
3. **Backend**: Node.js Express API
4. **Frontend**: React development server

---

## 📚 Documentation Directory (`/docs`)

Contains project documentation and resources.

### Structure

```
docs/
├── BMD/                   # Project-specific documentation
│   ├── Pdf/               # PDF resources
│   └── word/              # Word documents
└── ...
```

---

## 🚀 Setup Directory (`/setups`)

Installation and configuration guides.

### Key Files

```
setups/
├── SETUP_INSTRUCTIONS.md       # ⭐ START HERE - Full setup guide
├── SETUP_COMPLETE.md           # Complete system setup checklist
├── SETUP_DOCKER.md             # Docker-based setup
├── SETUP_BACKEND.md            # Backend installation
├── SETUP_FRONTEND.md           # Frontend installation
├── SETUP_PGSQL.md              # PostgreSQL setup
├── SETUP_EMBEDDINGS.md         # BGE embeddings setup
├── SETUP_RERANKER.md           # BGE reranker setup
├── setup-backend-dockerless.md # Non-Docker backend setup
└── PROJECT_STRUCTURE.md        # THIS FILE
```

---

## 📝 Key Configuration Files

### Backend Environment (`.env`)

```env
# API Keys
CLAUDE_API_KEY=sk-xxxxx
TOGETHER_API_KEY=xxxxx

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bmd_db
DB_USER=postgres
DB_PASSWORD=postgres

# Services
RERANKER_URL=http://localhost:8000
EMBEDDINGS_MODEL=BAAI/bge-m3
RERANKER_MODEL=BAAI/bge-reranker-m3

# Server
NODE_ENV=development
PORT=4455
```

### Frontend Environment (`.env` or vite config)

```env
VITE_API_BASE_URL=http://localhost:4455
```

---

## 🔄 Data Flow & Architecture

### Chat Message Flow

```
User Message (Frontend)
    ↓
POST /api/chat
    ↓
chatController.sendMessage()
    ↓
chatService.handleQuery() [RAG Pipeline]
    ├─→ 1. Extract embedding (BGE-m3)
    ├─→ 2. Search pgvector (top-k results)
    ├─→ 3. Rerank results (BGE-reranker)
    ├─→ 4. Build context + prompt
    ├─→ 5. Call Claude API
    └─→ 6. Return response
    ↓
Response sent to Frontend
    ↓
Message rendered + stored in DB
```

### Document Upload Flow

```
File Upload (Admin Dashboard)
    ↓
POST /api/documents
    ↓
documentController.uploadFile()
    ↓
Parse PDF/Text
    ↓
Chunk document
    ↓
POST /api/embeddings
    ↓
Generate embeddings for each chunk
    ↓
Store in pgvector
    ↓
Done - Ready for RAG
```

---

## 🔐 Important Security Notes

1. **Never commit `.env`** - Use `.env.example` as template
2. **API Keys** - Store in environment variables only
3. **Database credentials** - Use strong passwords
4. **CORS** - Check backend CORS config for production

---

## 🚦 Getting Started Quick Commands

### Backend
```bash
cd backend
npm install
npm run dev           # Start development server
npm run setup-db      # Initialize database
npm test             # Run tests
```

### Frontend
```bash
cd frontend
npm install
npm run dev           # Start dev server (port 3000)
npm run build         # Build for production
npm run preview       # Preview production build
```

### Database
```bash
psql -U postgres      # Connect to PostgreSQL
\c bmd_db             # Switch to BMD database
SELECT * FROM documents;  # View documents
```

---

## 📖 Common Development Tasks

### Adding a New API Endpoint

1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add business logic in `backend/src/services/`
4. Test with `test-*.js` files
5. Update frontend API client in `frontend/src/services/api.js`

### Adding a New Page/Component

1. Create component in `frontend/src/components/`
2. Import in `App.jsx`
3. Add route (if needed)
4. Style with `.module.css`

### Managing Database

1. Connect: `psql -U postgres -d bmd_db`
2. View tables: `\dt`
3. Backup: `pg_dump bmd_db > backup.sql`
4. Restore: `psql bmd_db < backup.sql`

---

## 🐛 Troubleshooting File Locations

| Issue | Check These Files |
|-------|-------------------|
| Backend won't start | `backend/.env`, `backend/server.js`, port 4455 |
| Database connection error | `backend/src/config/database.js`, PostgreSQL running? |
| Frontend can't connect to API | `frontend/src/services/api.js`, CORS settings |
| Embeddings failing | `backend/src/services/embeddingService.js`, TOGETHER_API_KEY |
| Reranker not working | `infra/reranker/app.py`, reranker service running? |
| File upload issues | `backend/data/documents/`, file permissions |

---

## 📞 Quick Reference

### Port Assignments
- **Frontend Dev**: 3000
- **Backend API**: 4455
- **PostgreSQL**: 5432
- **Reranker API**: 8000

### Database Tables
- `documents` - Uploaded files metadata
- `document_chunks` - Text chunks with vectors
- `chat_sessions` - User chat sessions
- `chat_messages` - Individual messages
- `message_feedback` - Thumbs up/down ratings

### API Base Routes
- `/api/chat/` - Chat messages
- `/api/documents/` - Document management
- `/api/admin/` - Admin functions
- `/api/analytics/` - Statistics

---

## 🎯 Next Steps for New Developers

1. **Read** `setups/SETUP_INSTRUCTIONS.md` for full setup
2. **Explore** `backend/src/` to understand API structure
3. **Review** `frontend/src/components/` to see UI organization
4. **Check** `.env.example` files for configuration
5. **Run** `backend_start.bat` and `frontend_start.bat` to start dev
6. **Test** by opening frontend and using chat

---

## 📚 Additional Resources

- **Setup Guides**: `setups/` folder
- **README**: Root `README.md`
- **Main Documentation**: `docs/` folder
- **Code Comments**: Inline in source files
- **Tests**: `backend/test-*.js` and `frontend/src/test/`

---

**Last Updated**: December 10, 2025  
**For Questions**: Check issue tracker or contact team lead
