# PeerScript

A full-stack real-time collaborative code editor built with MERN stack + Socket.io

## Live Demo
https://peer-script.vercel.app/

## Project Structure
```
peerscript/
├── frontend/      # React + Vite application
└── backend/       # Node.js + Express + Socket.io server
```

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, CodeMirror 6, Yjs, Socket.io Client
- **Backend**: Node.js, Express 5, Socket.io, Yjs, MongoDB, JWT
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas

## Features
- Conflict-free real-time collaborative editing (Yjs CRDT over Socket.io)
- Live cursors and selections of other users in the editor
- Live HTML/CSS/JS preview
- Built-in chat with persistent usernames
- User authentication (JWT)
- Auto-save to MongoDB
- Code formatting & export

## How It Works
Each project lives in a room identified by a unique room ID. The three files (HTML/CSS/JS) are shared Yjs CRDT documents, so concurrent edits from multiple users merge without conflicts instead of overwriting each other. Sync runs over the room's Socket.io connection (authenticated via JWT when logged in): the server holds an authoritative copy of each active room's document, relays updates and cursor presence between members, and persists the code to MongoDB so it is restored when someone joins later. The live preview is rendered client-side in a sandboxed iframe.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation
```bash
# Clone repository
git clone https://github.com/Harshagrawal526/PeerScript.git
cd PeerScript

# Install dependencies (both frontend + backend)
npm run install:all

# Set up environment variables (see below)

# Run development servers
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

Visit `http://localhost:5173`

### Environment Variables

**Backend** — create `backend/.env` (see `backend/.env.example`):

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3001`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:5173`) |

**Frontend** — create `frontend/.env`:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (default: `http://localhost:3001`) |
| `VITE_SOCKET_URL` | Socket.io server URL (default: `http://localhost:3001`) |

## Known Limitations
- Active room state (including the authoritative Yjs documents) is held in server memory, so scaling beyond a single server instance would require a shared adapter (e.g. Redis).
- Documents are persisted as plain text, so edit history is not retained across room restarts.

## Author
**Harsh Agrawal** — [GitHub](https://github.com/Harshagrawal526)
