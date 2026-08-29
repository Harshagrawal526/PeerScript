import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Editor from '../components/editor/Editor';
import RoomHeader from '../components/room/RoomHeader';
import Chat from '../components/room/Chat';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCollab } from '../hooks/useCollab';
import { api } from '../utils/api';
import OutputPanel from '../components/preview/OutputPanel';
import { usePreviewConsole } from '../hooks/usePreviewConsole';
import { useResizablePane } from '../hooks/useResizablePane';
import { useLivePreview } from '../hooks/useLivePreview';

function EditorPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [usersCount, setUsersCount] = useState(1);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);
  const [roomName, setRoomName] = useState('');

  const iframeRef = useRef(null);
  const { socket, connected } = useSocket();

  const { containerRef, paneHeight: editorHeight, startResize } = useResizablePane(50);

  const { logs, clearLogs } = usePreviewConsole(iframeRef);

  // Shared Yjs document + cursor presence for this room
  const collab = useCollab(socket, roomId, user?.username || 'Anonymous');

  // Each rebuild re-runs the room's code, so the previous run's output no
  // longer describes what is on screen.
  const { html, css, js, srcDoc } = useLivePreview(collab, clearLogs);

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

  useEffect(() => {
    if (!socket) return;

    socket.on('users-in-room', (count) => {
      setUsersCount(count);
    });

    return () => {
      socket.off('users-in-room');
    };
  }, [socket]);

  // Private-room gate: the server refuses join/sync for non-creators.
  // A successful sync clears the flag (e.g. after logging in as the creator).
  useEffect(() => {
    if (!socket) return;

    const onDenied = () => setAccessDenied(true);
    const onSynced = () => setAccessDenied(false);
    socket.on('room-access-denied', onDenied);
    socket.on('yjs-sync', onSynced);

    return () => {
      socket.off('room-access-denied', onDenied);
      socket.off('yjs-sync', onSynced);
    };
  }, [socket]);

  if (accessDenied) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">This room is private</h2>
          <p className="text-gray-600 mb-4">Only the room's creator can open it. If this is your room, log in first.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Log In
            </Link>
            <Link to="/" className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          onMouseDown={startResize}
          className="resize-handle h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 cursor-ns-resize hover:h-2.5 transition-all relative flex-shrink-0 group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-1 bg-white/60 rounded-full group-hover:bg-white/80 transition-colors"></div>
          </div>
        </div>

        <OutputPanel
          srcDoc={srcDoc}
          iframeRef={iframeRef}
          logs={logs}
          onClearLogs={clearLogs}
          height={outputHeight}
        />
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