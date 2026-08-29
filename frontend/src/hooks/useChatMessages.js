import { useCallback, useEffect, useState } from 'react';

const systemMessage = (text) => ({
  type: 'system',
  message: text,
  timestamp: Date.now()
});

// The room's chat transcript and the identity the server has accepted for us.
export const useChatMessages = (socket, roomId) => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (!socket) return;

    const onUsernameAutoSet = (data) => {
      setUsername(data.username);
      setIsUsernameSet(true);
      setUsernameError('');
    };
    const onChatMessage = (data) => setMessages((previous) => [...previous, data]);
    const onUserJoined = (data) =>
      setMessages((previous) => [...previous, systemMessage(`${data.username} joined the room`)]);
    const onUserLeft = (data) =>
      setMessages((previous) => [...previous, systemMessage(`${data.username} left the room`)]);
    const onUsernameTaken = () => {
      setUsernameError('Username already taken. Please choose another.');
      setIsUsernameSet(false);
    };
    const onUsernameAccepted = () => setUsernameError('');

    socket.on('username-auto-set', onUsernameAutoSet);
    socket.on('chat-message', onChatMessage);
    socket.on('user-joined-chat', onUserJoined);
    socket.on('user-left-chat', onUserLeft);
    socket.on('username-taken', onUsernameTaken);
    socket.on('username-accepted', onUsernameAccepted);

    return () => {
      // By reference: socket.off with only a name removes every listener for it.
      socket.off('username-auto-set', onUsernameAutoSet);
      socket.off('chat-message', onChatMessage);
      socket.off('user-joined-chat', onUserJoined);
      socket.off('user-left-chat', onUserLeft);
      socket.off('username-taken', onUsernameTaken);
      socket.off('username-accepted', onUsernameAccepted);
    };
  }, [socket]);

  // Typing a new name clears the rejection from the previous attempt.
  const changeUsername = useCallback((value) => {
    setUsername(value);
    setUsernameError('');
  }, []);

  const claimUsername = useCallback(() => {
    const claimed = username.trim();
    if (!claimed || !socket || !roomId) return;

    setUsernameError('');
    socket.emit('set-username', { roomId, username: claimed });
    setIsUsernameSet(true);
  }, [socket, roomId, username]);

  const sendMessage = useCallback(
    (text) => {
      const message = text.trim();
      if (!message || !socket || !roomId) return false;

      socket.emit('send-message', { roomId, message });
      return true;
    },
    [socket, roomId]
  );

  return {
    messages,
    username,
    changeUsername,
    isUsernameSet,
    usernameError,
    claimUsername,
    sendMessage
  };
};
