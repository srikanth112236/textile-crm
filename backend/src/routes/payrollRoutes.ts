import { Router } from 'express';
import {
  generateMonthlyPayroll,
  getPayrolls,
  getMyPayslips,
  approveAndPayPayroll,
  bulkMarkPaid,
} from '../controllers/payrollController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.post('/generate', requireAdmin, generateMonthlyPayroll);
router.get('/all', requireAdmin, getPayrolls);
router.get('/my-payslips', getMyPayslips);
router.put('/approve/:id', requireAdmin, approveAndPayPayroll);
router.put('/bulk-pay', requireAdmin, bulkMarkPaid);

export default router;
