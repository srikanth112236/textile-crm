import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateMFASecret, verifyMFAToken } from '../utils/mfa';
import { CustomError } from '../middleware/errorHandler';

/**
 * Setup MFA for user
 * POST /api/auth/mfa/setup
 */
export const setupMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await User.findById(req.user.userId).select('+mfaSecret');
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Generate MFA secret and QR code
    const { secret, qrCodeUrl } = await generateMFASecret(user.email);

    // Save secret to user (but don't enable MFA yet - user needs to verify first)
    user.mfaSecret = secret;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      secret,
      qrCodeUrl,
      message: 'Scan QR code with authenticator app, then verify with /api/auth/mfa/verify',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify MFA token and enable MFA
 * POST /api/auth/mfa/verify
 */
export const verifyMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const { token } = req.body;
    if (!token) {
      throw new CustomError('MFA token is required', 400);
    }

    const user = await User.findById(req.user.userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      throw new CustomError('MFA not set up. Please set up MFA first.', 400);
    }

    // Verify token
    const isValid = verifyMFAToken(user.mfaSecret, token);
    if (!isValid) {
      throw new CustomError('Invalid MFA token', 401);
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.status(200).json({
      message: 'MFA enabled successfully',
      mfaEnabled: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disable MFA
 * POST /api/auth/mfa/disable
 */
export const disableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const { token } = req.body;
    if (!token) {
      throw new CustomError('MFA token is required to disable MFA', 400);
    }

    const user = await User.findById(req.user.userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      throw new CustomError('MFA is not enabled', 400);
    }

    // Verify token before disabling
    const isValid = verifyMFAToken(user.mfaSecret, token);
    if (!isValid) {
      throw new CustomError('Invalid MFA token', 401);
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: 'MFA disabled successfully',
      mfaEnabled: false,
    });
  } catch (error) {
    next(error);
  }
};

// MFA middleware is now in server/src/middleware/mfa.ts
// Import and re-export for backward compatibility
export { requireMFA } from '../middleware/mfa';

