import express from 'express';
import {
  getFeaturedUgc,
  getInstagramFeed,
  listUgc,
  createUgc,
  updateUgc,
  deleteUgc,
  syncInstagram,
} from '../controllers/ugcController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

// Public (cached, light — never blocks page render)
router.get('/featured', getFeaturedUgc);
router.get('/feed', getInstagramFeed);

// Admin
router.get('/admin', authenticate, requireAdmin, listUgc);
router.post('/admin', authenticate, requireAdmin, createUgc);
router.put('/admin/:id', authenticate, requireAdmin, updateUgc);
router.delete('/admin/:id', authenticate, requireAdmin, deleteUgc);
router.post('/admin/sync-instagram', authenticate, requireAdmin, syncInstagram);

export default router;
