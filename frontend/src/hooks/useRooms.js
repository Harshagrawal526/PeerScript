import { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api";

// The signed-in user's rooms, and the mutations that keep the local list in
// step with the server. Callers decide how to report failures; this only
// reports whether the write landed.
export const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRooms = async () => {
      try {
        const { ok, data } = await api.get("/api/rooms/my-rooms");
        if (ok && !cancelled) setRooms(data.rooms);
      } catch (error) {
        console.error("Fetch rooms error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  const createRoom = useCallback(async (name) => {
    const { ok, data } = await api.post("/api/rooms", {
      name: name || "Untitled Project",
    });
    return ok ? data.room : null;
  }, []);

  // Functional form: two writes resolving close together would otherwise both
  // start from the list as it was, and the slower one would undo the other.
  const deleteRoom = useCallback(async (roomId) => {
    const { ok } = await api.delete(`/api/rooms/${roomId}`);
    if (ok)
      setRooms((previous) => previous.filter((room) => room.roomId !== roomId));
    return ok;
  }, []);

  const renameRoom = useCallback(async (roomId, name) => {
    const { ok, data } = await api.put(`/api/rooms/${roomId}`, { name });
    if (ok) {
      setRooms((previous) =>
        previous.map((room) =>
          room.roomId === roomId ? { ...room, name: data.room.name } : room,
        ),
      );
    }
    return ok;
  }, []);

  return { rooms, loading, createRoom, deleteRoom, renameRoom };
};
