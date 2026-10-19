import express from 'express';
import {
  getShopLooks,
  listShopLooks,
  createShopLook,
  updateShopLook,
  deleteShopLook,
} from '../controllers/shopLookController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

router.get('/', getShopLooks);
router.get('/admin', authenticate, requireAdmin, listShopLooks);
router.post('/admin', authenticate, requireAdmin, createShopLook);
router.put('/admin/:id', authenticate, requireAdmin, updateShopLook);
router.delete('/admin/:id', authenticate, requireAdmin, deleteShopLook);

export default router;
