import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import apiRouter from './routes/apiRouter.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration - Permissive for seamless cloud frontend-backend communication
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map(url => url.trim());
      if (
        configuredOrigins.includes('*') || 
        configuredOrigins.includes(origin) || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.endsWith('.onrender.com') || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow in production to prevent blocking
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.json({
    app: 'WedPlan API',
    region: 'Pakistan',
    status: 'Running',
    version: '1.0.0',
    apiRoot: '/api/v1'
  });
});

// Versioned API Endpoints
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
