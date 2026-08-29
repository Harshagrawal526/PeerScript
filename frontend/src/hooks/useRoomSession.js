import { useEffect, useState } from 'react';
import { api } from '../utils/api';

// Membership of a room: joining and leaving it, its name, how many people are
// in it, and whether the server let us in at all.
export const useRoomSession = (socket, roomId, token) => {
  const [roomName, setRoomName] = useState('');
  const [usersCount, setUsersCount] = useState(1);
  const [accessDenied, setAccessDenied] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomDetails = async () => {
      try {
        const { ok, data } = await api.get(`/api/rooms/${roomId}`, token);
        if (ok) setRoomName(data.room.name);
      } catch (error) {
        console.error('Fetch room error:', error);
      }
    };

    fetchRoomDetails();
  }, [roomId, token]);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join-room', roomId);
    return () => socket.emit('leave-room', roomId);
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    const onUsersInRoom = (count) => setUsersCount(count);

    // Private-room gate: the server refuses join/sync for non-creators, and a
    // later successful sync clears it (e.g. after logging in as the creator).
    const onDenied = () => setAccessDenied(true);

    // The server could not read the room, so it is withholding the document
    // rather than serving an empty one that would overwrite the saved code.
    const onUnavailable = () => setUnavailable(true);

    const onSynced = () => {
      setAccessDenied(false);
      setUnavailable(false);
    };

    socket.on('users-in-room', onUsersInRoom);
    socket.on('room-access-denied', onDenied);
    socket.on('room-unavailable', onUnavailable);
    socket.on('yjs-sync', onSynced);

    return () => {
      // Detach by reference: socket.off with only an event name would also
      // remove listeners other parts of the app registered for it.
      socket.off('users-in-room', onUsersInRoom);
      socket.off('room-access-denied', onDenied);
      socket.off('room-unavailable', onUnavailable);
      socket.off('yjs-sync', onSynced);
    };
  }, [socket]);

  return { roomName, usersCount, accessDenied, unavailable };
};
