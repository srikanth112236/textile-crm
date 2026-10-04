import { Router } from 'express';
import multer from 'multer';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  importExcelEmployees,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(verifyToken);

router.get('/', requireAdmin, getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', requireAdmin, createEmployee);
router.post('/import-excel', requireAdmin, upload.single('file'), importExcelEmployees);
router.put('/:id', requireAdmin, updateEmployee);
router.delete('/:id', requireAdmin, deleteEmployee);

export default router;
