import express from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearUserCart,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All cart routes require authentication (no guest checkout)
router.get('/', authenticate, getCart);
router.post('/items', authenticate, addItem);
router.put('/items/:itemId', authenticate, updateItem);
router.delete('/items/:itemId', authenticate, removeItem);
router.delete('/', authenticate, clearUserCart);

export default router;


