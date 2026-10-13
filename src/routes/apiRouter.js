import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import adminRoutes from './adminRoutes.js';
import weddingRoutes from './weddingRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import planningRoutes from './planningRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import chatRoutes from './chatRoutes.js';

const apiRouter = express.Router();

// Mount API Route Modules
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/vendors', vendorRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/weddings', weddingRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/planning', planningRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/chat', chatRoutes);

// Root /api/v1 Directory Information
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WedPlan API v1 — Pakistan Wedding Management Platform',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      vendors: '/api/v1/vendors',
      services: '/api/v1/services',
      admin: '/api/v1/admin',
      weddings: '/api/v1/weddings',
      bookings: '/api/v1/bookings',
      planning: '/api/v1/planning',
      reviews: '/api/v1/reviews',
      notifications: '/api/v1/notifications',
      payments: '/api/v1/payments'
    },
    status: 'active'
  });
});

export default apiRouter;
