// Socket.io service for managing real-time communication

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  initialize(socket) {
    this.socket = socket;
    this.setupDefaultListeners();
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    // Driver location update
    this.socket.on('driver-location', (data) => {
      this.emit('driver-location-update', data);
    });

    // Ride status update
    this.socket.on('ride-status', (data) => {
      this.emit('ride-status-update', data);
    });

    // Driver accepted ride
    this.socket.on('driver-accepted', (data) => {
      this.emit('driver-accepted', data);
    });

    // Driver arrived
    this.socket.on('driver-arrived', (data) => {
      this.emit('driver-arrived', data);
    });

    // Ride started
    this.socket.on('ride-started', (data) => {
      this.emit('ride-started', data);
    });

    // Ride completed
    this.socket.on('ride-completed', (data) => {
      this.emit('ride-completed', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      this.emit('socket-error', error);
    });
  }

  // Join a specific ride room
  joinRideRoom(rideId) {
    if (this.socket) {
      this.socket.emit('join-ride', { rideId });
    }
  }

  // Leave a ride room
  leaveRideRoom(rideId) {
    if (this.socket) {
      this.socket.emit('leave-ride', { rideId });
    }
  }

  // Update driver location
  updateDriverLocation(location) {
    if (this.socket) {
      this.socket.emit('driver-location', location);
    }
  }

  // Request a ride
  requestRide(rideData) {
    if (this.socket) {
      this.socket.emit('request-ride', rideData);
    }
  }

  // Cancel ride request
  cancelRideRequest(rideId) {
    if (this.socket) {
      this.socket.emit('cancel-ride', { rideId });
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Emit event to local listeners
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
