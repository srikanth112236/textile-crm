import express from 'express';
import {
  createReturnRequest,
  myReturnRequests,
  listReturnRequests,
  updateReturnRequest,
  sizeIssueReport,
} from '../controllers/returnController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

router.use(authenticate);
router.post('/', createReturnRequest);
router.get('/mine', myReturnRequests);
router.get('/admin', requireAdmin, listReturnRequests);
router.get('/admin/size-report', requireAdmin, sizeIssueReport);
router.put('/admin/:id', requireAdmin, updateReturnRequest);

export default router;
