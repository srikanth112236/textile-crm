import express from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  getCODQuote,
  testWhatsApp,
} from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

// Public: safe storefront + checkout config (free-ship threshold, COD options, razorpay keyId)
router.get('/', getPublicSettings);
router.post('/cod-quote', getCODQuote);

// Admin
router.get('/admin', authenticate, requireAdmin, getAdminSettings);
router.put('/admin', authenticate, requireAdmin, updateSettings);
router.post('/admin/whatsapp-test', authenticate, requireAdmin, testWhatsApp);

export default router;
