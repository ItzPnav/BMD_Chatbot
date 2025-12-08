# BMD Chatbot Frontend

Modern, responsive React frontend for the BMD Chatbot web application. Features a glassmorphic UI design with a floating chat interface and comprehensive admin dashboard.

## Features

- 🎨 **Modern Glass UI** - Frosted glass design with smooth animations
- 💬 **Chat Interface** - Popup and fullscreen chat modes
- 📊 **Admin Dashboard** - File management, embeddings generation, chat management, and analytics
- 📱 **Responsive Design** - Mobile-first approach with adaptive layouts
- ♿ **Accessible** - Keyboard navigation and ARIA labels throughout
- 🎯 **Theme System** - CSS variables for consistent theming

## Tech Stack

- **React 18+** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Recharts** - Chart library for analytics
- **CSS Modules** - Scoped styling

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env.local
```

3. Configure API URL in `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:4455
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # SVG icons and images
│   │   └── icons/      # Icon components
│   ├── components/     # React components
│   │   ├── FloatingChatButton/
│   │   ├── ChatPopup/
│   │   ├── FullscreenLayout/
│   │   ├── AdminDashboard/
│   │   └── ui/         # Reusable UI components
│   ├── services/       # API and utilities
│   │   ├── api.js      # API client
│   │   └── localStorageKeys.js
│   ├── styles/         # Global styles
│   │   ├── variables.css
│   │   └── globals.css
│   ├── App.jsx         # Main app component
│   └── index.js        # Entry point
├── package.json
└── vite.config.js
```

## API Endpoints

The frontend expects the following API endpoints:

### Chat Endpoints
- `GET /api/chats` - Get all chats
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats` - Create new chat
- `POST /api/message` - Send message (or `POST /api/chat` as fallback)

### Admin Endpoints
- `GET /api/admin/files` - List all files (fallback: `GET /api/documents`)
- `POST /api/admin/files` - Upload file (fallback: `POST /api/documents/upload`)
- `DELETE /api/admin/files/:id` - Delete file (fallback: `DELETE /api/documents/:id`)
- `PUT /api/admin/files/:id` - Replace file
- `POST /api/admin/embeddings` - Generate embeddings
- `GET /api/admin/chats` - Get all chats for admin (fallback: `GET /api/chats`)

### File Upload Path

**Important:** The backend must save uploaded files to:
```
C:\pnav\projects\BMD chatbot restart\docs
```

This path is documented in the upload UI and should be configured in the backend.

## Features Overview

### Chat Interface

- **Floating Button**: Fixed bottom-right circular button to open chat
- **Popup Mode**: Glass modal with compact chat history and conversation view
- **Fullscreen Mode**: Split layout with chat list and conversation
- **Features**:
  - Message timestamps
  - Delivery status indicators
  - Enter to send, Shift+Enter for newline
  - Attachment support (UI ready)

### Admin Dashboard

#### Upload Files
- File picker with category selection
- Progress indicators
- Success/error notifications
- File path documentation

#### Manage Files
- Table view of all uploaded files
- Pagination (25 items per page)
- Actions: Delete, Replace
- Status indicators (Processed/Not processed)
- File metadata display

#### Generate Embeddings
- List unprocessed files
- Bulk selection with checkboxes
- Generate embeddings for selected files
- Status tracking

#### Chat Management
- List all chats with search
- View full conversation
- Actions: Export, Pin, Delete
- Chat metadata display

#### Analytics Dashboard
- Time-series chart for chat count
- User activity timeline (bar chart)
- Message distribution (pie chart)
- **Note**: Currently uses mock data. Replace data source in `Analytics.jsx` when real API is available.

## Theme Colors

The app uses CSS variables defined in `src/styles/variables.css`:

- `--rich-black`: #001219ff
- `--midnight-green`: #005f73ff
- `--dark-cyan`: #0a9396ff
- `--tiffany-blue`: #94d2bdff
- `--vanilla`: #e9d8a6ff
- `--gamboge`: #ee9b00ff
- `--alloy-orange`: #ca6702ff
- `--rust`: #bb3e03ff
- `--rufous`: #ae2012ff
- `--auburn`: #9b2226ff

## LocalStorage Keys

The app uses the following localStorage keys:

- `bmd_ui_state` - UI state (open/closed, fullscreen)
- `bmd_recent_chats` - Cached chat list (expires after 30 minutes)
- `bmd_admin_last_filter` - Admin filter preferences
- `bmd_admin_last_selected_chat` - Last selected chat in admin

## Accessibility

- All interactive elements are keyboard accessible
- ARIA labels on icon buttons
- Focus indicators with theme colors
- Semantic HTML structure
- Screen reader friendly

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Testing

Run the smoke test:
```bash
npm test
```

## Development Notes

- Components are modular and reusable
- API layer includes retry logic and error handling
- Mock data fallbacks for development
- Responsive breakpoint: 768px (mobile)
- Smooth animations using CSS transitions

## Troubleshooting

### API Connection Issues
- Verify `VITE_API_BASE_URL` in `.env.local`
- Check backend server is running on port 4455
- Review browser console for CORS errors

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (16+ required)

## License

ISC

