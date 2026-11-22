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

- **Scratchpad** — local-only HTML/CSS/JS editor for everyone (no account needed), persisted in browser `localStorage`
- Conflict-free real-time collaborative editing (Yjs CRDT over Socket.io) — requires sign-in
- Live cursors and selections of other users in the editor
- Live HTML/CSS/JS preview
- Console panel capturing console output and uncaught errors from the preview
- Built-in chat with persistent usernames
- User authentication with an HttpOnly cookie for HTTP requests and JWT authentication for Socket.io
- Auto-save to MongoDB
- Code formatting & export
- Save Scratchpad code to a new owned room with one click

## How It Works

### Scratchpad

A local-only HTML/CSS/JS editor available to all visitors without an account. Code is saved to browser `localStorage` and restored on page load. No server calls, no room, no collaboration traffic. Signed-in users can snapshot their Scratchpad into a new owned room with **Save to new room**.

### Collaborative editing

Each project has a room with a unique ID. Shared rooms require a signed-in account to create or join. Each room's HTML, CSS, and JavaScript are shared Yjs documents, which merge simultaneous edits from multiple users. Socket.io sends document updates and cursor presence between room members. The server keeps active documents in memory and saves them to MongoDB so they can be restored when someone rejoins.

### Authentication

When a user logs in, the backend puts the JWT in an HttpOnly cookie. The browser sends the cookie with HTTP requests, and the frontend does not store the token in sessionStorage or localStorage. On page load, `/api/auth/me` restores the user and token into frontend memory. Socket.io uses that in-memory token to authenticate its connection.

### Live preview and console

The preview runs in a sandboxed iframe. The iframe cannot access the app directly, so an injected bridge forwards console output and uncaught errors to the parent page using `postMessage`. The parent checks that messages came from its own preview frame before showing them in the Console tab.

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

| Variable             | Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------- |
| `PORT`               | Server port (default: `3001`)                                                         |
| `MONGODB_URI`        | MongoDB connection string                                                             |
| `JWT_SECRET`         | Secret key for signing JWTs                                                           |
| `JWT_EXPIRE`         | Token lifetime, e.g. `7d`                                                             |
| `JWT_COOKIE_MAX_AGE` | Cookie lifetime in milliseconds (default: `604800000`, or 7 days)                     |
| `NODE_ENV`           | Set to `production` when deploying so the auth cookie uses secure production settings |
| `CORS_ORIGINS`       | Comma-separated allowed origins (default: `http://localhost:5173`)                    |

**Frontend** — create `frontend/.env`:

| Variable          | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `VITE_API_URL`    | Backend base URL (default: `http://localhost:3001`)     |
| `VITE_SOCKET_URL` | Socket.io server URL (default: `http://localhost:3001`) |

## Known Limitations

- Active room state (including the authoritative Yjs documents) is held in server memory, so scaling beyond a single server instance would require a shared adapter (e.g. Redis).
- Documents are persisted as plain text, so edit history is not retained across room restarts.
- `/api/auth/me` returns the JWT to the frontend for Socket.io authentication, so malicious JavaScript running in the app could access it despite the HttpOnly cookie.

## Author

**Harsh Agrawal** — [GitHub](https://github.com/Harshagrawal526)
