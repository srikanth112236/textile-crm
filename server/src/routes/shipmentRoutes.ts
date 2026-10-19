import express from 'express';
import {
  getServiceability,
  shipOrder,
  trackShipment,
  publicTrackByOrderNumber,
  shiprocketWebhook,
  cancelShipment,
  getShipmentOverview,
  assignAWB,
  requestPickup,
  getLabel,
  getInvoice,
  getManifest,
  syncShipments,
} from '../controllers/shipmentController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

router.get('/serviceability', getServiceability);
router.get('/track-order/:orderNumber', publicTrackByOrderNumber);
router.post('/webhook', shiprocketWebhook);

router.use(authenticate);
router.get('/track/:awb', trackShipment);
router.post('/orders/:id/ship', requireAdmin, shipOrder);
router.post('/orders/:id/assign-awb', requireAdmin, assignAWB);
router.post('/orders/:id/pickup', requireAdmin, requestPickup);
router.post('/orders/:id/label', requireAdmin, getLabel);
router.post('/orders/:id/invoice', requireAdmin, getInvoice);
router.post('/orders/:id/manifest', requireAdmin, getManifest);
router.post('/sync', requireAdmin, syncShipments);
router.post('/orders/:id/cancel-shipment', requireAdmin, cancelShipment);
router.get('/overview', requireAdmin, getShipmentOverview);

export default router;
