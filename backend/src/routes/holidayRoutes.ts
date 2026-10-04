import express from 'express';
import { getHolidays, createHoliday, deleteHoliday } from '../controllers/holidayController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getHolidays);
router.post('/', verifyToken, requireAdmin, createHoliday);
router.delete('/:id', verifyToken, requireAdmin, deleteHoliday);

export default router;
