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
- **Frontend**: React 19, Vite, Tailwind CSS, Socket.io Client, CodeMirror
- **Backend**: Node.js, Express 5, Socket.io, MongoDB, JWT
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas

## Features
- Real-time collaborative editing (Socket.io)
- Live HTML/CSS/JS preview
- Built-in chat with persistent usernames
- User authentication (JWT)
- Auto-save to MongoDB
- Code formatting & export

## How It Works
Each project lives in a room identified by a unique room ID. Clients join the room over a Socket.io connection (authenticated via JWT when logged in), and every edit is broadcast to the other members of that room per file (HTML/CSS/JS) while being persisted to MongoDB, so the latest code is restored when someone joins later. The live preview is rendered client-side in a sandboxed iframe.

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

**Frontend** — create `frontend/.env`:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (default: `http://localhost:3001`) |
| `VITE_SOCKET_URL` | Socket.io server URL (default: `http://localhost:3001`) |

## Known Limitations
- Concurrent edits use last-write-wins per file rather than OT/CRDT-based merging, so simultaneous typing in the same file can drop keystrokes.
- Active room state is held in server memory, so scaling beyond a single server instance would require a shared adapter (e.g. Redis).

## Author
**Harsh Agrawal** — [GitHub](https://github.com/Harshagrawal526)
