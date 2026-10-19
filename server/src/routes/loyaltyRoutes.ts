import express from 'express';
import {
  getLoyaltyBalance,
  getLoyaltyHistory,
  redeemPoints,
} from '../controllers/loyaltyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/balance', getLoyaltyBalance);
router.get('/history', getLoyaltyHistory);
router.post('/redeem', redeemPoints);

export default router;

