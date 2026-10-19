import express from 'express';
import { createAdmin, getUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireSuperadmin } from '../middleware/rbac';

const router = express.Router();

// All routes require superadmin access
router.use(authenticate);
router.use(requireSuperadmin);

// User management routes
router.post('/admins', createAdmin);
router.get('/users', getUsers);

export default router;

