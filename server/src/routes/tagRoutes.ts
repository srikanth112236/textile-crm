import express from 'express';
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getTagAnalytics,
} from '../controllers/tagController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

// Public routes
router.get('/', optionalAuthenticate, getTags);
router.get('/:id', optionalAuthenticate, getTag);

// Protected routes (Admin/Superadmin only)
router.post('/', authenticate, requireAdmin, createTag);
router.put('/:id', authenticate, requireAdmin, updateTag);
router.delete('/:id', authenticate, requireAdmin, deleteTag);

// Analytics route (Admin/Superadmin only)
router.get('/analytics/usage', authenticate, requireAdmin, getTagAnalytics);

export default router;

