import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { setupMFA, verifyMFA, disableMFA } from '../controllers/mfaController';
import { authenticate } from '../middleware/auth';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { authRateLimit } from '../middleware/security';

const router = Router();

// Public routes (with reCAPTCHA + brute-force cap)
router.post('/register', authRateLimit, verifyRecaptcha, register);
router.post('/login', authRateLimit, verifyRecaptcha, login);
router.post('/refresh', authRateLimit, refresh);

// Protected routes
router.post('/logout', authenticate, logout);

// MFA routes
router.post('/mfa/setup', authenticate, setupMFA);
router.post('/mfa/verify', authenticate, verifyMFA);
router.post('/mfa/disable', authenticate, disableMFA);

export default router;

