import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  razorpayWebhook,
  refundPayment,
  getPaymentMethods,
  getPaymentsLedger,
  getOrdersPaymentSummary,
  guestCreatePaymentOrder,
  guestVerifyPayment,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

router.get('/methods', getPaymentMethods);
// Raw body is preserved via express.json verify in server.ts (req.rawBody).
// Keep plain handler so global JSON parser + rawBody both work.
router.post('/webhook', razorpayWebhook);
router.post('/guest-create-order', guestCreatePaymentOrder);
router.post('/guest-verify', guestVerifyPayment);

router.use(authenticate);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/refund', requireAdmin, refundPayment);
router.get('/ledger', requireAdmin, getPaymentsLedger);
router.get('/orders-summary', requireAdmin, getOrdersPaymentSummary);

export default router;
