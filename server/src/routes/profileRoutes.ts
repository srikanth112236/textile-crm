import express from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  exportUserData,
  deleteAccount,
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { gdprRateLimit } from '../middleware/security';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Profile endpoints
router.get('/', getProfile);
router.put('/', updateProfile);

// Address endpoints
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

// GDPR endpoints (with strict rate limiting)
router.get('/export', gdprRateLimit, exportUserData);
router.delete('/', gdprRateLimit, deleteAccount);

export default router;

