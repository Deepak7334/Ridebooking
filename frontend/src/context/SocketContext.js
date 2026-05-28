import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Re-connect socket when user logs in/out

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-run whenever user login state changes

  const emit = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  // Driver: join available-drivers room when going online
  const driverGoOnline = useCallback(() => {
    if (socket) {
      socket.emit('driver-online');
      console.log('📡 Emitted driver-online');
    }
  }, [socket]);

  // Driver: leave available-drivers room when going offline
  const driverGoOffline = useCallback(() => {
    if (socket) {
      socket.emit('driver-offline');
      console.log('📴 Emitted driver-offline');
    }
  }, [socket]);

  const value = {
    socket,
    isConnected,
    error,
    emit,
    on,
    off,
    driverGoOnline,
    driverGoOffline,
    joinRideRoom: (rideId) => {
      if (socket) {
        socket.emit('join-ride', rideId);
        console.log('🚪 Joined ride room:', rideId);
      }
    },
    leaveRideRoom: (rideId) => {
      if (socket) {
        socket.emit('leave-ride', rideId);
        console.log('🚪 Left ride room:', rideId);
      }
    },
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
