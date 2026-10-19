import express from 'express';
import {
  subscribeBackInStock,
  listBackInStock,
  deleteBackInStock,
  subscribePriceAlert,
  myPriceAlerts,
  listPriceAlerts,
  deletePriceAlert,
} from '../controllers/alertsController';
import { sendOtp, verifyOtp } from '../controllers/otpController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { authRateLimit } from '../middleware/security';

const router = express.Router();

// Mobile OTP login (public, brute-force capped)
router.post('/auth/otp/send', authRateLimit, sendOtp);
router.post('/auth/otp/verify', authRateLimit, verifyOtp);

// Back-in-stock (guest subscribe allowed — optional auth attaches userId)
router.post('/stock-alerts/subscribe', optionalAuthenticate, subscribeBackInStock);
router.get('/stock-alerts/admin', authenticate, requireAdmin, listBackInStock);
router.delete('/stock-alerts/:id', authenticate, deleteBackInStock);

// Price-drop alerts
router.post('/price-alerts/subscribe', authenticate, subscribePriceAlert);
router.get('/price-alerts/mine', authenticate, myPriceAlerts);
router.get('/price-alerts/admin', authenticate, requireAdmin, listPriceAlerts);
router.delete('/price-alerts/:id', authenticate, deletePriceAlert);

export default router;
