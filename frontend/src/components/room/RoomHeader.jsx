import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { copyToClipboard } from '../../utils/roomUtils';
import { exportAsHTML } from '../../utils/exportUtils';

const RoomHeader = ({ 
  roomId, 
  roomName, // NEW
  usersCount, 
  connected, 
  onLeaveRoom, 
  onClearCode,
  onToggleChat,
  isChatOpen,
  chatWidth,
  html,
  css,
  js
}) => {
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const { user, isAuthenticated } = useAuth();

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      showNotification('Room link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showNotification('Failed to copy link', 'error');
    }
  };

  const handleExport = () => {
    const result = exportAsHTML(html, css, js);
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  };

  return (
    <>
      {/* Notification Toast - Top Right */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-3 rounded-lg shadow-xl border-2 ${
            notification.type === 'success' ? 'bg-green-500 border-green-400' : 
            notification.type === 'error' ? 'bg-red-500 border-red-400' : 
            'bg-blue-500 border-blue-400'
          } text-white font-medium`}>
            {notification.message}
          </div>
        </div>
      )}

      <div 
  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-3 flex justify-between items-center border-b-2 border-blue-400 text-white shadow-lg transition-all duration-0"
  style={{ marginRight: isChatOpen ? `${chatWidth}px` : '0' }}
>
  {/* Left: User Info */}
  <div className="flex items-center gap-3 text-sm">
    {isAuthenticated && user && (
      <div className="bg-white/20 px-3 py-1 rounded backdrop-blur-sm font-semibold">
        👋 {user.username}
      </div>
    )}
    
    <div className="bg-white/20 px-3 py-1 rounded backdrop-blur-sm">
      👥 {usersCount} user{usersCount !== 1 ? 's' : ''}
    </div>
  </div>

  {/* Center: Room Name */}
  <div className="absolute left-1/2 transform -translate-x-1/2" >
    <div className="bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm font-bold text-lg" style={{ marginRight: isChatOpen ? `${chatWidth + 120}px` : '0' }}>
      {roomName || 'Untitled Room'}
    </div>
  </div>

  {/* Right: Actions */}
  <div className="flex items-center gap-2">
    <button
      onClick={handleCopyLink}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
        copied 
          ? 'bg-green-500 text-white' 
          : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
      }`}
    >
      {copied ? '✓ Copied!' : '🔗 Copy Link'}
    </button>
    
    <button
      onClick={handleExport}
      className="px-3 py-1 rounded text-sm font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors cursor-pointer"
    >
      💾 Export
    </button>

    <button
      onClick={onToggleChat}
      className="px-3 py-1 rounded text-sm font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors cursor-pointer"
    >
      💬 Chat
    </button>
    
    <button
      onClick={onClearCode}
      className="px-3 py-1 rounded text-sm font-medium bg-red-500/80 hover:bg-red-500 backdrop-blur-sm transition-colors cursor-pointer"
    >
      🗑️ Clear
    </button>

    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded backdrop-blur-sm">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
    </div>

    <button
      onClick={onLeaveRoom}
      className="px-3 py-1 rounded text-sm font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors cursor-pointer"
    >
      Leave
    </button>
  </div>
</div>
    </>
  );
};

export default RoomHeader;