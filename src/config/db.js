import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async (retryCount = 0) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedplan_db';

  if (isConnected) {
    logger.db('MongoDB already connected.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000 // 15s timeout for cloud environments like Render
    });

    isConnected = true;
    logger.db(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB Connection Failed: ${err.message}`);

    // Automatically retry in cloud environments if IP whitelist is propagating
    if (retryCount < 5) {
      const nextAttempt = retryCount + 1;
      logger.info(`Retrying MongoDB connection in 10 seconds (attempt ${nextAttempt}/5)...`);
      setTimeout(() => connectDB(nextAttempt), 10000);
    } else {
      logger.warn(
        '\n' +
        '========================================================================\n' +
        ' [NOTE FOR RENDER DEPLOYMENT / MONGODB ATLAS]:\n' +
        ' MongoDB Atlas rejected the connection because Render IP is not whitelisted.\n' +
        ' Quick Fix in 2 minutes:\n' +
        '   1. Go to MongoDB Atlas (https://cloud.mongodb.com)\n' +
        '   2. Click "Network Access" under "Security" on the left menu.\n' +
        '   3. Click "Add IP Address" -> Click "Allow Access From Anywhere" (0.0.0.0/0).\n' +
        '   4. Click "Confirm" and wait 1 minute for it to become Active.\n' +
        '   5. On Render dashboard, click "Manual Deploy" -> "Deploy latest commit".\n' +
        '========================================================================\n'
      );
    }
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
