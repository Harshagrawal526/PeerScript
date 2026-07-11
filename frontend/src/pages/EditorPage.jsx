import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Editor from '../components/editor/Editor';
import RoomHeader from '../components/room/RoomHeader';
import Chat from '../components/room/Chat';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCollab } from '../hooks/useCollab';
import { api } from '../utils/api';

function EditorPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [usersCount, setUsersCount] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);
  const [editorHeight, setEditorHeight] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [roomName, setRoomName] = useState('');

  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const { socket, connected } = useSocket();

  // Shared Yjs document + cursor presence for this room
  const collab = useCollab(socket, roomId, user?.username || 'Anonymous');

  const HEADER_HEIGHT = 53;
  const MIN_HEIGHT = 5;
  const MAX_HEIGHT = 95;

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;

      try {
        const { ok, data } = await api.get(`/api/rooms/${roomId}`, token);
        if (ok) {
          setRoomName(data.room.name);
        }
      } catch (error) {
        console.error('Fetch room error:', error);
      }
    };

    fetchRoomDetails();
  }, [roomId, token]);

  const clearCode = () => {
    if (!collab) return;
    if (window.confirm('Are you sure you want to clear all code? This will affect all users in the room.')) {
      collab.ydoc.transact(() => {
        Object.values(collab.ytexts).forEach((ytext) => {
          ytext.delete(0, ytext.length);
        });
      });
    }
  };

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', roomId);
    }
    navigate('/');
  };

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const totalHeight = rect.height;
      const mouseY = e.clientY - rect.top;

      let newEditorHeight = (mouseY / totalHeight) * 100;
      newEditorHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newEditorHeight));

      setEditorHeight(newEditorHeight);
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.classList.remove('resizing');

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('resizing');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing');
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
    }

    return () => {
      if (socket && roomId) {
        socket.emit('leave-room', roomId);
      }
    };
  }, [socket, roomId]);

  // Mirror the shared Y.Texts into React state for the live preview and export
  useEffect(() => {
    if (!collab) return;

    const { ytexts } = collab;
    const sync = () => {
      setHtml(ytexts.html.toString());
      setCss(ytexts.css.toString());
      setJs(ytexts.js.toString());
    };

    sync();
    ytexts.html.observe(sync);
    ytexts.css.observe(sync);
    ytexts.js.observe(sync);

    return () => {
      ytexts.html.unobserve(sync);
      ytexts.css.unobserve(sync);
      ytexts.js.unobserve(sync);
    };
  }, [collab]);

  useEffect(() => {
    if (!socket) return;

    socket.on('users-in-room', (count) => {
      setUsersCount(count);
    });

    return () => {
      socket.off('users-in-room');
    };
  }, [socket]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(`
        <html>
          <body>${html}</body>
          <style>${css}</style>
          <script>${js}</script>
        </html>
      `);
    }, 250);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">No Room Selected</h2>
          <p className="text-gray-600 mb-4">Please create or join a room from the home page</p>
          <Link to="/" className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const outputHeight = 100 - editorHeight;

  return (
    <div className="h-screen flex flex-col bg-blue-50">
      <RoomHeader
        roomName={roomName}
        usersCount={usersCount}
        connected={connected}
        onLeaveRoom={leaveRoom}
        onClearCode={clearCode}
        onToggleChat={toggleChat}
        isChatOpen={isChatOpen}
        chatWidth={chatWidth}
        html={html}
        css={css}
        js={js}
      />

      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ marginRight: isChatOpen ? `${chatWidth}px` : '0' }}
      >
        <div
          className="flex bg-blue-100/50 border-b-2 border-blue-200 overflow-hidden"
          style={{ height: `${editorHeight}%` }}
        >
          <Editor language="html" displayName="HTML" ytext={collab?.ytexts.html} awareness={collab?.awareness} />
          <Editor language="css" displayName="CSS" ytext={collab?.ytexts.css} awareness={collab?.awareness} />
          <Editor language="js" displayName="JS" ytext={collab?.ytexts.js} awareness={collab?.awareness} />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="resize-handle h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 cursor-ns-resize hover:h-2.5 transition-all relative flex-shrink-0 group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-1 bg-white/60 rounded-full group-hover:bg-white/80 transition-colors"></div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center text-xl py-2 font-semibold shadow-md flex-shrink-0">
          OUTPUT
        </div>

        <div
          className="flex bg-blue-50 overflow-hidden"
          style={{ height: `${outputHeight}%` }}
        >
          <iframe
            srcDoc={srcDoc}
            title="output"
            sandbox="allow-scripts"
            frameBorder="0"
            width="100%"
            height="100%"
            className="bg-white"
          />
        </div>
      </div>

      <Chat
        socket={socket}
        roomId={roomId}
        isOpen={isChatOpen}
        onToggle={toggleChat}
        onResize={setChatWidth}
      />
    </div>
  );
}

export default EditorPage;