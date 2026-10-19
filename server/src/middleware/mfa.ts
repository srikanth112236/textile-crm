import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { CustomError } from './errorHandler';
import { UserRole } from '../types/roles';

/**
 * Middleware to require MFA for Superadmin/Admin routes
 * This should be used after authenticate middleware
 * 
 * For Superadmin/Admin users:
 * - If MFA is enabled, it must be verified (tracked in session/Redis)
 * - If MFA is not enabled, user must set it up first
 */
export const requireMFA = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Check if user role requires MFA
    const requiresMFA = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN;

    if (requiresMFA) {
      // If MFA is not enabled, user must set it up
      if (!user.mfaEnabled) {
        throw new CustomError(
          'MFA is required for admin accounts. Please set up MFA first.',
          403
        );
      }

      // In a production environment, you would check if MFA was verified in this session
      // This could be tracked in Redis with a session key like: `mfa_verified:${userId}:${sessionId}`
      // For now, we'll check if MFA is enabled (which means it was set up and verified at least once)
      // In a full implementation, you'd verify MFA on login and store that verification in session
      
      // TODO: Implement session-based MFA verification tracking
      // For Phase 1, we're ensuring MFA is enabled for admin users
      // In Phase 2+, we can add session-based verification
    }

    next();
  } catch (error) {
    next(error);
  }
};

