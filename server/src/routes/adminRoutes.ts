import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  getAuditLogs,
  getPermissions,
  createPermission,
  updateRolePermissions,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireSuperadmin } from '../middleware/rbac';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User management routes (Admin/Superadmin)
router.get('/users', requireAdmin, getUsers);
router.get('/users/:id', requireAdmin, getUserById);
router.put('/users/:id', requireAdmin, updateUser);
router.post('/users/:id/ban', requireAdmin, banUser);
router.post('/users/:id/unban', requireAdmin, unbanUser);

// Audit logs (Admin/Superadmin)
router.get('/logs', requireAdmin, getAuditLogs);

// Permissions (Superadmin only)
router.get('/permissions', requireSuperadmin, getPermissions);
router.post('/permissions', requireSuperadmin, createPermission);

// Role permissions (Superadmin only)
router.put('/roles/:roleId/permissions', requireSuperadmin, updateRolePermissions);

export default router;

