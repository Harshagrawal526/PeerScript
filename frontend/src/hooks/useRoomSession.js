import { useEffect, useState } from 'react';
import { api } from '../utils/api';

// Membership of a room: joining and leaving, its name, size, and whether the
// server let us in at all.
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

    // The server refuses join/sync for non-creators; a later sync clears it.
    const onDenied = () => setAccessDenied(true);

    // Server withheld the document rather than serve an empty one that would
    // overwrite the room's saved code.
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
      // By reference: socket.off with only a name removes every listener for it.
      socket.off('users-in-room', onUsersInRoom);
      socket.off('room-access-denied', onDenied);
      socket.off('room-unavailable', onUnavailable);
      socket.off('yjs-sync', onSynced);
    };
  }, [socket]);

  return { roomName, usersCount, accessDenied, unavailable };
};
