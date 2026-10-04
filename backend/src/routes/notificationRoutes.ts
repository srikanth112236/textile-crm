import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markAsRead);

export default router;
