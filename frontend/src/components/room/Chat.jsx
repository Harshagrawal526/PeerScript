import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDragResize } from '../../hooks/useDragResize';
import { useChatMessages } from '../../hooks/useChatMessages';

const MIN_WIDTH_PERCENT = 0.10;
const MAX_WIDTH_PERCENT = 0.35;

// The panel is anchored to the right edge, so its width is the distance from
// the pointer to that edge.
const measureChatWidth = (event) => window.innerWidth - event.clientX;
const minChatWidth = () => window.innerWidth * MIN_WIDTH_PERCENT;
const maxChatWidth = () => window.innerWidth * MAX_WIDTH_PERCENT;

const Chat = ({ socket, roomId, isOpen, onToggle, onResize }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatRef = useRef(null);
  
  const { isAuthenticated } = useAuth();

  const {
    messages,
    username,
    changeUsername,
    isUsernameSet,
    usernameError,
    claimUsername,
    sendMessage
  } = useChatMessages(socket, roomId);

  const { size: chatWidth, startResize } = useDragResize({
    initial: 320,
    min: minChatWidth,
    max: maxChatWidth,
    measure: measureChatWidth,
    bodyClass: 'chat-resizing'
  });

  useEffect(() => {
    onResize?.(chatWidth);
  }, [chatWidth, onResize]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 240);
      textareaRef.current.style.height = newHeight + 'px';
      
      if (textareaRef.current.scrollHeight > 240) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [newMessage]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    claimUsername();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (sendMessage(newMessage)) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };


  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={chatRef}
      className="fixed right-0 top-0 h-screen bg-white border-l-2 border-blue-300 shadow-2xl flex flex-col z-30"
      style={{ width: `${chatWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className="chat-resize-handle absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-blue-400 transition-colors group"
        style={{ marginLeft: '-3px' }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-blue-400/50 rounded-full group-hover:bg-blue-500 transition-colors"></div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold">💬 Chat</h3>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close chat"
          className="text-white hover:text-blue-100 transition-colors text-xl cursor-pointer"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Username setup (anonymous users only) */}
      {!isUsernameSet ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleSetUsername} className="w-full">
            <label className="block text-gray-700 font-semibold mb-2">
              {isAuthenticated 
                ? 'Setting up your chat...' 
                : 'Enter your name to start chatting:'}
            </label>
            
            {!isAuthenticated && (
              <>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => changeUsername(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 mb-3"
                  autoFocus
                />
                {usernameError && (
                  <p className="text-red-500 text-sm mb-3">{usernameError}</p>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
                >
                  Join Chat
                </button>
              </>
            )}
            
            {isAuthenticated && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Please wait...</p>
              </div>
            )}
          </form>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-blue-50 to-purple-50">
            {isAuthenticated && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-2 text-center text-sm text-blue-800">
                ✅ Chatting as <strong>{username}</strong>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-4xl mb-2">💬</p>
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-xs text-gray-500 italic my-2">
                      {msg.message}
                    </div>
                  ) : (
                    <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        msg.isOwn 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-blue-200'
                      }`}>
                        <p className={`text-xs font-semibold mb-1 ${
                          msg.isOwn ? 'text-blue-100' : 'text-blue-600'
                        }`}>
                          {msg.username}
                        </p>
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-2 border-blue-200">
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Shift+Enter for new line)"
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                maxLength={500}
                rows={1}
                style={{ minHeight: '40px', maxHeight: '240px' }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer"
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;