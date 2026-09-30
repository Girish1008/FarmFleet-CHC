import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { initDatabaseConnection } from './services/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import bookingsRoutes from './routes/bookingsRoutes.js';
import voiceBookingRoutes from './routes/voiceBookingRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import machinesRoutes from './routes/machinesRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FarmFleet CHC Management REST API',
    version: '1.0.0',
    modules: {
      auth: 'online',
      bookings: 'online',
      voiceBooking: 'online',
      predictiveDuration: 'online',
      slotRecommender: 'online',
      dynamicRescheduler: 'online',
      liveTracking: 'online',
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/voice-booking', voiceBookingRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/chc/tracking', trackingRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/users', usersRoutes);

// Fallback 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);

// Start server
async function startServer() {
  await initDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚜 FarmFleet Backend Server running on port ${PORT}`);
    console.log(`📡 Base URL: http://localhost:${PORT}/api`);
    console.log(`🌾 Roles: ADMIN, CHC_MANAGER, OPERATOR, FARMER`);
    console.log(`🤖 AI Modules: Voice STT/NLP, Duration, Slots, Rescheduling, GPS`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
