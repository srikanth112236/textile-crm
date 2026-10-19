import express from 'express';
import {
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateCartDiscount,
} from '../controllers/discountController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

// Public routes (active discounts + cart pre-check; first-order evaluation
// uses the token when present, guests pass as new customers)
router.get('/', getDiscounts);
router.get('/:id', getDiscount);
router.post('/validate', optionalAuthenticate, validateCartDiscount);

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

export default router;

