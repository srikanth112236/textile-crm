import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase, isMongoDBConnected } from './config/database';
import './config/redis'; // Initialize Redis connection
import { initializeElasticsearch } from './config/elasticsearch'; // Initialize Elasticsearch connection
import { helmetMiddleware, corsMiddleware, rateLimitMiddleware, httpsMiddleware } from './middleware/security';
import { sanitizeInput } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './config/socket';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Security middleware (order matters!)
app.use(httpsMiddleware);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Cookie parser middleware (needed for HttpOnly cookies)
app.use(cookieParser());

// Body parsing middleware (preserve raw body for Razorpay webhook signature verify)
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    if (req.originalUrl?.includes('/payments/webhook')) req.rawBody = buf;
    return;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Health check route
app.get('/api/health', (_req, res) => {
  const mongoStatus = isMongoDBConnected();
  res.status(mongoStatus ? 200 : 503).json({
    status: mongoStatus ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: mongoStatus ? 'connected' : 'disconnected',
    },
  });
});

// Serve static files for uploads with CORS headers
import path from 'path';
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://textile-crm-frontend.onrender.com');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads')));

// API routes
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import uploadRoutes from './routes/uploadRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import userRoutes from './routes/userRoutes';
import cartRoutes from './routes/cartRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import discountRoutes from './routes/discountRoutes';
import loyaltyRoutes from './routes/loyaltyRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import settingsRoutes from './routes/settingsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import alertsRoutes from './routes/alertsRoutes';
import ugcRoutes from './routes/ugcRoutes';
import shopLookRoutes from './routes/shopLookRoutes';
import returnRoutes from './routes/returnRoutes';
import referralRoutes from './routes/referralRoutes';
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipment', shipmentRoutes);
app.use('/api', alertsRoutes);
app.use('/api/ugc', ugcRoutes);
app.use('/api/shop-look', shopLookRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/referrals', referralRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection and start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Initialize Elasticsearch (optional, graceful degradation)
    initializeElasticsearch();
    
    // Initialize Socket.io
    initializeSocket(httpServer);

    // Fallback tracking sync for missed Shiprocket webhooks (opt-out: SHIPMENT_SYNC_ENABLED=false)
    try {
      const { startShipmentSync } = await import('./jobs/shipmentSync');
      startShipmentSync();
    } catch (err) {
      console.error('Failed to start shipment sync:', err);
    }

    // Abandoned online payments: expire stale ledgers, auto-cancel untouched
    // PENDING orders and release their stock (opt-out: PAYMENT_SWEEP_ENABLED=false)
    try {
      const { startPaymentSweep } = await import('./jobs/paymentSweep');
      startPaymentSweep();
    } catch (err) {
      console.error('Failed to start payment sweep:', err);
    }
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

