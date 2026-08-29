import React, { useCallback, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Editor from '../components/editor/Editor';
import RoomHeader from '../components/room/RoomHeader';
import Chat from '../components/room/Chat';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCollab } from '../hooks/useCollab';
import OutputPanel from '../components/preview/OutputPanel';
import { usePreviewConsole } from '../hooks/usePreviewConsole';
import { useDragResize } from '../hooks/useDragResize';
import { useLivePreview } from '../hooks/useLivePreview';
import { useRoomSession } from '../hooks/useRoomSession';
import Notice from '../components/ui/Notice';

function EditorPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);

  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const { socket, connected } = useSocket();

  const { roomName, usersCount, accessDenied } = useRoomSession(socket, roomId, token);

  // The editor pane is sized as a percentage of the split container.
  const measureEditorHeight = useCallback((event) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return ((event.clientY - rect.top) / rect.height) * 100;
  }, []);

  const { size: editorHeight, startResize } = useDragResize({
    initial: 50,
    min: 5,
    max: 95,
    measure: measureEditorHeight,
    bodyClass: 'resizing'
  });

  const { logs, clearLogs } = usePreviewConsole(iframeRef);

  // Shared Yjs document + cursor presence for this room
  const collab = useCollab(socket, roomId, user?.username || 'Anonymous');

  // Each rebuild re-runs the room's code, so the previous run's output no
  // longer describes what is on screen.
  const { html, css, js, srcDoc } = useLivePreview(collab, clearLogs);

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

  if (accessDenied) {
    return (
      <Notice
        title="This room is private"
        titleClassName="text-red-600"
        message="Only the room's creator can open it. If this is your room, log in first."
      >
        <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Log In
        </Link>
        <Link to="/" className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
          Go to Home
        </Link>
      </Notice>
    );
  }

  if (!roomId) {
    return (
      <Notice
        title="No Room Selected"
        titleClassName="text-orange-600"
        message="Please create or join a room from the home page"
      >
        <Link to="/" className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">
          Go to Home
        </Link>
      </Notice>
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
          <Editor language="html" ytext={collab?.ytexts.html} awareness={collab?.awareness} />
          <Editor language="css" ytext={collab?.ytexts.css} awareness={collab?.awareness} />
          <Editor language="js" ytext={collab?.ytexts.js} awareness={collab?.awareness} />
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