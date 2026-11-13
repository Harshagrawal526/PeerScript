import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token || null,
      },
    });

    newSocket.on("connect", () => setConnected(true));

    newSocket.on("disconnect", () => setConnected(false));

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]); // Reconnect when the auth token changes

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
