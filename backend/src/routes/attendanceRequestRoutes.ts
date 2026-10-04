import express from 'express';
import {
  createAttendanceRequest,
  getAttendanceRequests,
  updateAttendanceRequestStatus,
} from '../controllers/attendanceRequestController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAttendanceRequests);
router.post('/', verifyToken, createAttendanceRequest);
router.patch('/:id/status', verifyToken, requireAdmin, updateAttendanceRequestStatus);

export default router;
