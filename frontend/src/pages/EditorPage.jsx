import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Editor from '../components/editor/Editor';
import RoomHeader from '../components/room/RoomHeader';
import Chat from '../components/room/Chat';
import { useSocket } from '../context/SocketContext';
import img from '../assets/img.svg';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

function EditorPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [usersCount, setUsersCount] = useState(1);
  const [codeLoaded, setCodeLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);
  const [editorHeight, setEditorHeight] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [roomName, setRoomName] = useState('');

  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const { socket, connected } = useSocket();
  
  // ADD THIS: Track if we're currently sending an update
  const isSendingUpdate = useRef(false);

  const HEADER_HEIGHT = 53;
  const MIN_HEIGHT = 5;
  const MAX_HEIGHT = 95;

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;

      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setRoomName(data.room.name);
        }
      } catch (error) {
        console.error('Fetch room error:', error);
      }
    };

    fetchRoomDetails();
  }, [roomId, token]);

  const clearCode = () => {
    if (window.confirm('Are you sure you want to clear all code? This will affect all users in the room.')) {
      setHtml('');
      setCss('');
      setJs('');
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
      console.log('Joined room:', roomId);
    }

    return () => {
      if (socket && roomId) {
        socket.emit('leave-room', roomId);
      }
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('load-code', (code) => {
      console.log('Loading existing code:', code);
      setHtml(code.html);
      setCss(code.css);
      setJs(code.js);
      setCodeLoaded(true);
    });

    return () => {
      socket.off('load-code');
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // MODIFIED: Only update if we're not currently sending
    socket.on('code-update', ({ language, code }) => {
      if (isSendingUpdate.current) {
        // Ignore updates while we're sending
        return;
      }

      if (language === 'html') setHtml(code);
      else if (language === 'css') setCss(code);
      else if (language === 'js') setJs(code);
    });

    return () => {
      socket.off('code-update');
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('users-in-room', (count) => {
      setUsersCount(count);
    });

    return () => {
      socket.off('users-in-room');
    };
  }, [socket]);

  // MODIFIED: HTML changes
  useEffect(() => {
    if (socket && roomId && codeLoaded) {
      isSendingUpdate.current = true;
      socket.emit('code-change', { roomId, language: 'html', code: html });
      setTimeout(() => {
        isSendingUpdate.current = false;
      }, 200); // Small delay to prevent immediate echo
    }
  }, [html, socket, roomId, codeLoaded]);

  // MODIFIED: CSS changes
  useEffect(() => {
    if (socket && roomId && codeLoaded) {
      isSendingUpdate.current = true;
      socket.emit('code-change', { roomId, language: 'css', code: css });
      setTimeout(() => {
        isSendingUpdate.current = false;
      }, 200);
    }
  }, [css, socket, roomId, codeLoaded]);

  // MODIFIED: JS changes
  useEffect(() => {
    if (socket && roomId && codeLoaded) {
      isSendingUpdate.current = true;
      socket.emit('code-change', { roomId, language: 'js', code: js });
      setTimeout(() => {
        isSendingUpdate.current = false;
      }, 200);
    }
  }, [js, socket, roomId, codeLoaded]);

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
        roomId={roomId}
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
          <Editor language="xml" displayName="HTML" value={html} onChange={setHtml} />
          <Editor language="css" displayName="CSS" value={css} onChange={setCss} />
          <Editor language="javascript" displayName="JS" value={js} onChange={setJs} />
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