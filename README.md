# 🎨 PeerScript

A full-stack real-time collaborative code editor built with MERN stack + Socket.io

## 🚀 Live Demo
- **Application**: https://peer-script.vercel.app/
- **Backend API**: https://peerscript-backend.onrender.com

## 📁 Project Structure
```
peerscript/
├── frontend/      # React + Vite application
└── backend/       # Node.js + Express + Socket.io server
```

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Socket.io Client, CodeMirror
- **Backend**: Node.js, Express 5, Socket.io, MongoDB, JWT
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas

## ✨ Features
- ⚡ Real-time collaborative editing (Socket.io)
- 👁️ Live HTML/CSS/JS preview
- 💬 Built-in chat with persistent usernames
- 🔐 User authentication (JWT)
- 💾 Auto-save to MongoDB
- 🎨 Code formatting & export

## 🏃 Quick Start

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

# Set up environment variables
# Backend: Create backend/.env with MONGODB_URI, JWT_SECRET
# Frontend: Create frontend/.env with VITE_API_URL

# Run development servers
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

Visit `http://localhost:5173`


## 👨‍💻 Author
**Harsh Agrawal**