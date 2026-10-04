import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} from '../controllers/leaveController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/all', requireAdmin, getAllLeaves);
router.put('/status/:id', requireAdmin, updateLeaveStatus);

export default router;
