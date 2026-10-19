import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import {
  getUserOrders,
  getOrder,
  createOrder,
  createGuestOrder,
  updateOrderStatus,
  confirmPayment,
  refundOrder,
  completeManualRefund,
  cancelOrder,
  repeatOrder,
  getAllOrders,
  // Phase 9 additions
  addOrderNote,
  updateOrderPriority,
  assignOrder,
  bulkUpdateOrders,
  updateTracking,
  exportOrders,
  getOrderTimeline,
  toggleArchiveOrder,
} from '../controllers/orderController';

const router = express.Router();

// =====================================================
// ADMIN ROUTES (Admin/Superadmin only)
// =====================================================

// Must come before parameterized routes
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);
router.get('/admin/export', authenticate, requireAdmin, exportOrders);
router.post('/admin/bulk-update', authenticate, requireAdmin, bulkUpdateOrders);

// Admin order management
router.put('/admin/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.post('/admin/:id/payment/confirm', authenticate, requireAdmin, confirmPayment);
router.post('/admin/:id/refund', authenticate, requireAdmin, refundOrder);
router.post('/admin/:id/refund-complete', authenticate, requireAdmin, completeManualRefund);

// Phase 9: Order enhancements
router.post('/admin/:id/notes', authenticate, requireAdmin, addOrderNote);
router.put('/admin/:id/priority', authenticate, requireAdmin, updateOrderPriority);
router.put('/admin/:id/assign', authenticate, requireAdmin, assignOrder);
router.put('/admin/:id/tracking', authenticate, requireAdmin, updateTracking);
router.get('/admin/:id/timeline', authenticate, requireAdmin, getOrderTimeline);
router.put('/admin/:id/archive', authenticate, requireAdmin, toggleArchiveOrder);

// =====================================================
// GUEST ROUTES (no login — mobile number identifies the buyer)
// =====================================================
router.post('/guest', createGuestOrder);

// =====================================================
// USER ROUTES (Authenticated users)
// =====================================================

// Parameterized routes come after specific routes
router.get('/', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrder);
router.post('/', authenticate, createOrder);
router.post('/:id/cancel', authenticate, cancelOrder);
router.post('/:id/repeat', authenticate, repeatOrder);

export default router;
