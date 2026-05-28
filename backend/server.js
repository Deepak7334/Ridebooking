// backend/server.js
// NOTE: dotenv MUST be called before route imports in CommonJS, but ES modules hoist imports.
// Solution: Use node --require dotenv/config OR ensure JWT_SECRET defaults match everywhere.
// All auth middleware fallback to 'rapido-secret-2024' consistently.

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env - this runs, but ES module imports above are already evaluated.
// Route files read process.env.JWT_SECRET lazily inside handlers (not at module level), so this works.
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/auth.routes.js';
import rideRoutesFactory from './routes/ride.routes.js';
import adminRoutes from './routes/admin.routes.js';
import driverRoutes from './routes/driver/driver.routes.js';
import { initIO } from './socket.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => res.json({ status: 'Rapido Backend Running 🚀', time: new Date() }));

// Initialize Socket.io
const io = initIO(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutesFactory(io));
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rapido')
  .then(() => {
    console.log('✅ MongoDB connected to Rapido database');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '*** (from .env)' : 'rapido-secret-2024 (fallback)'}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
