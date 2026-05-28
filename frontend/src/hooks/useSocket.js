import { useEffect, useCallback } from 'react';
import { useSocket as useSocketContext } from '../context/SocketContext';

const useSocket = (eventHandlers = {}) => {
  const { socket, isConnected, emit, on, off } = useSocketContext();

  useEffect(() => {
    const cleanups = [];

    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        const cleanup = on(event, handler);
        cleanups.push(cleanup);
      }
    });

    // Cleanup on unmount
    return () => {
      cleanups.forEach((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, [eventHandlers, on]);

  // Helper methods for common ride events
  const joinRideRoom = useCallback((rideId) => {
    emit('join-ride', { rideId });
  }, [emit]);

  const leaveRideRoom = useCallback((rideId) => {
    emit('leave-ride', { rideId });
  }, [emit]);

  const updateDriverLocation = useCallback((location) => {
    emit('driver-location-update', location);
  }, [emit]);

  const updateUserLocation = useCallback((location) => {
    emit('user-location-update', location);
  }, [emit]);

  const requestRide = useCallback((rideData) => {
    emit('request-ride', rideData);
  }, [emit]);

  const cancelRideRequest = useCallback((rideId) => {
    emit('cancel-ride', { rideId });
  }, [emit]);

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
    joinRideRoom,
    leaveRideRoom,
    updateDriverLocation,
    updateUserLocation,
    requestRide,
    cancelRideRequest,
  };
};

export default useSocket;
