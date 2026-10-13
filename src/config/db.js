import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;
let isConnecting = false;

export const connectDB = async (retryCount = 0) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedplan_db';

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (isConnecting) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000
    });

    isConnected = true;
    isConnecting = false;
    logger.db(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    isConnected = false;
    isConnecting = false;
    logger.error(`MongoDB Connection Failed: ${err.message}`);

    // Continuously retry in background every 15-20 seconds until connected
    const delay = Math.min(25000, 10000 + (retryCount % 4) * 5000);
    logger.info(`Retrying MongoDB connection in ${Math.round(delay / 1000)}s (attempt ${retryCount + 1})...`);
    setTimeout(() => connectDB(retryCount + 1), delay);
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.db('MongoDB reconnected.');
  });
};

export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

export default connectDB;
