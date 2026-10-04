import { Router } from 'express';
import { registerAdmin, registerCompany, login, changePassword, getMe, updateMyProfile } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/register-admin', registerAdmin);
router.post('/register-company', registerCompany);
router.post('/login', login);
router.post('/change-password', verifyToken, changePassword);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateMyProfile);

export default router;
