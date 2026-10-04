import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getMyCustomerPortalData,
  requestCustomerInvoice,
} from '../controllers/customerController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/portal-data', getMyCustomerPortalData);
router.post('/request-invoice', requestCustomerInvoice);

router.get('/', requireAdmin, getCustomers);
router.get('/:id', getCustomerById);
router.post('/', requireAdmin, createCustomer);
router.put('/:id', requireAdmin, updateCustomer);
router.delete('/:id', requireAdmin, deleteCustomer);

export default router;
