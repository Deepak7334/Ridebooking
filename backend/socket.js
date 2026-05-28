import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initIO = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    // Bypass for public tracking feature
    if (socket.handshake.auth.publicTracking) {
      socket.user = { role: 'guest', id: 'guest-' + Math.random().toString(36).substr(2, 9) };
      return next();
    }

    if (!token) return next(new Error('Authentication error'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'rapido-secret-2024');
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.user?.id} (${socket.user?.role})`);

    // ── Each user/driver joins their own personal room (for direct notifications) ──
    if (socket.user?.id) {
      socket.join(socket.user.id);
      console.log(`User ${socket.user.id} joined personal room`);
    }

    // ── Driver-specific: join available-drivers room when online ──
    socket.on('driver-online', () => {
      socket.join('available-drivers');
      console.log(`Driver ${socket.user?.id} joined available-drivers room`);
    });

    // ── Driver-specific: leave available-drivers room when offline ──
    socket.on('driver-offline', () => {
      socket.leave('available-drivers');
      console.log(`Driver ${socket.user?.id} left available-drivers room`);
    });

    // ── Join ride room (both user and driver) ──
    socket.on('join-ride', (rideId) => {
      socket.join(rideId);
      console.log(`Socket ${socket.user?.id} joined ride room: ${rideId}`);
    });

    socket.on('leave-ride', (rideId) => {
      socket.leave(rideId);
      console.log(`Socket ${socket.user?.id} left ride room: ${rideId}`);
    });

    // ── Driver location update via socket (low latency alternative to REST) ──
    socket.on('driver-location-update', ({ rideId, location }) => {
      if (rideId && location) {
        io.to(rideId).emit('ride-location-update', { location });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user?.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
