import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { copyToClipboard } from '../../utils/roomUtils';
import { exportAsHTML } from '../../utils/exportUtils';

const RoomHeader = ({
  roomName,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Close the compact dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
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
    setMenuOpen(false);
    const result = exportAsHTML(html, css, js);
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  };

  const handleToggleChat = () => {
    setMenuOpen(false);
    onToggleChat();
  };

  const handleClearCode = () => {
    setMenuOpen(false);
    onClearCode();
  };

  const menuItems = [
    { label: 'Copy Link', icon: '🔗', onClick: handleCopyLink },
    { label: 'Export', icon: '💾', onClick: handleExport },
    { label: 'Chat', icon: '💬', onClick: handleToggleChat },
    { label: 'Clear', icon: '🗑️', onClick: handleClearCode, danger: true },
    { label: 'Leave', icon: '🚪', onClick: onLeaveRoom, danger: true }
  ];

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
        className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-3 flex justify-between items-center border-b-2 border-blue-400 text-white shadow-lg"
        style={{ marginRight: isChatOpen ? `${chatWidth}px` : '0' }}
      >
        {/* Left: User Info */}
        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated && user && (
            <div className="bg-white/20 px-3 py-1 rounded backdrop-blur-sm font-semibold">
              👋 {user.username}
            </div>
          )}

          <div className="bg-white/20 px-3 py-1 rounded backdrop-blur-sm whitespace-nowrap">
            👥 {usersCount} user{usersCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Center: Room Name (hidden on small screens, truncated otherwise) */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
          <div className="bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm font-bold text-lg max-w-[28vw] truncate">
            {roomName || 'Untitled Room'}
          </div>
        </div>

        {/* Right: full action row on large screens */}
        <div className="hidden lg:flex items-center gap-2">
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

        {/* Right: compact dropdown below lg */}
        <div className="flex lg:hidden items-center gap-2">
          <div
            className="flex items-center bg-white/20 px-2 py-2 rounded backdrop-blur-sm"
            title={connected ? 'Connected' : 'Disconnected'}
          >
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-3 py-1 rounded text-sm font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors cursor-pointer"
              title="Menu"
            >
              ☰ Menu
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[160px]">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full text-left px-4 py-2 transition-colors cursor-pointer flex items-center gap-2 ${
                      item.danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-blue-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomHeader;
