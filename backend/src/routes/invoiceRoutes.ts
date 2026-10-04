import { Router } from 'express';
import { createInvoice, getInvoices, getInvoiceById } from '../controllers/invoiceController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.post('/', requireAdmin, createInvoice);
router.get('/', requireAdmin, getInvoices);
router.get('/:id', getInvoiceById);

export default router;
