import { Router } from 'express';
import { getSalarySettings, updateSalarySettings } from '../controllers/salarySettingsController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/', getSalarySettings);
router.put('/', requireAdmin, updateSalarySettings);

export default router;
