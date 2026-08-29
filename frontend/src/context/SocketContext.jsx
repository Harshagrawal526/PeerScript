import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config';
const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components -- hook lives with its provider; only costs HMR granularity
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
        token: token || null
      }
    });

    newSocket.on('connect', () => setConnected(true));

    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- socket must live in state so consumers re-render when it is (re)created
    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]); // Reconnect when the auth token changes

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};