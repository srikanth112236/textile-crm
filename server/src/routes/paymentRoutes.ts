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
import {
  completeRefund,
  createRefund,
  getOrderRefundContext,
  getPaymentsOverview,
  getRefundSummary,
  getRefundableOrders,
  getRefunds,
} from '../controllers/refundController';
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
router.get('/overview', requireAdmin, getPaymentsOverview);
router.get('/refunds', requireAdmin, getRefunds);
router.get('/refunds/summary', requireAdmin, getRefundSummary);
router.post('/refunds', requireAdmin, createRefund);
router.post('/refunds/:id/complete', requireAdmin, completeRefund);
router.get('/refundable-orders', requireAdmin, getRefundableOrders);
router.get('/orders/:id/refund-context', requireAdmin, getOrderRefundContext);

export default router;
