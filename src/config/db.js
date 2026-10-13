import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedplan_db';

  if (isConnected) {
    logger.db('MongoDB already connected.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Fail fast if local mongod is not reachable
    });

    isConnected = true;
    logger.db(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB Connection Failed: ${err.message}`);
    logger.warn(
      '\n' +
      '========================================================================\n' +
      ' [NOTE FOR DEVELOPER]:\n' +
      ' Local MongoDB server (mongod) is not currently running on this machine.\n' +
      ' To enable full database functionality:\n' +
      '   1. Either start local MongoDB service: "net start MongoDB"\n' +
      '   2. OR create a free MongoDB Atlas cloud database (https://www.mongodb.com/atlas)\n' +
      '      and paste your URI in "server/.env":\n' +
      '      MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/wedplan_db\n' +
      ' The backend API server will still start and serve health check endpoints.\n' +
      '========================================================================\n'
    );
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
