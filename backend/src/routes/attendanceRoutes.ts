import { Router } from 'express';
import {
  clockIn,
  clockOut,
  getTodayStatus,
  getEmployeeAttendance,
  getAllAttendance,
} from '../controllers/attendanceController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today', getTodayStatus);
router.get('/my-history', getEmployeeAttendance);
router.get('/all', requireAdmin, getAllAttendance);

export default router;
