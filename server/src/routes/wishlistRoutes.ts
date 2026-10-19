import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All wishlist routes require authentication
router.get('/', authenticate, getWishlist);
router.get('/:productId/check', authenticate, checkWishlist);
router.post('/:productId', authenticate, addToWishlist);
router.delete('/:productId', authenticate, removeFromWishlist);

export default router;


