import express from 'express';
import { myReferral } from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/mine', myReferral);

export default router;
