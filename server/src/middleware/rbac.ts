import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/roles';
import { CustomError } from './errorHandler';

// Role-based access control middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      throw new CustomError(
        'Insufficient permissions. You do not have access to this resource.',
        403
      );
    }

    next();
  };
};

// Convenience middleware for specific roles
export const requireSuperadmin = requireRole(UserRole.SUPERADMIN);
export const requireAdmin = requireRole(UserRole.SUPERADMIN, UserRole.ADMIN);
export const requireUser = requireRole(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER);

// Permission check helper (for fine-grained control)
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    [UserRole.USER]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPERADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

