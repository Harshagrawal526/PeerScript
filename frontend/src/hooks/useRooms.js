import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';

// The signed-in user's rooms, and the mutations that keep the local list in
// step with the server. Callers decide how to report failures; this only
// reports whether the write landed.
export const useRooms = (token) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const fetchRooms = async () => {
      try {
        const { ok, data } = await api.get('/api/rooms/my-rooms', token);
        if (ok && !cancelled) setRooms(data.rooms);
      } catch (error) {
        console.error('Fetch rooms error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRooms();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const createRoom = useCallback(
    async (name) => {
      const { ok, data } = await api.post('/api/rooms', { name: name || 'Untitled Project' }, token);
      return ok ? data.room : null;
    },
    [token]
  );

  // Functional form: two writes resolving close together would otherwise both
  // start from the list as it was, and the slower one would undo the other.
  const deleteRoom = useCallback(
    async (roomId) => {
      const { ok } = await api.delete(`/api/rooms/${roomId}`, token);
      if (ok) setRooms((previous) => previous.filter((room) => room.roomId !== roomId));
      return ok;
    },
    [token]
  );

  const renameRoom = useCallback(
    async (roomId, name) => {
      const { ok, data } = await api.put(`/api/rooms/${roomId}`, { name }, token);
      if (ok) {
        setRooms((previous) =>
          previous.map((room) => (room.roomId === roomId ? { ...room, name: data.room.name } : room))
        );
      }
      return ok;
    },
    [token]
  );

  return { rooms, loading, createRoom, deleteRoom, renameRoom };
};
