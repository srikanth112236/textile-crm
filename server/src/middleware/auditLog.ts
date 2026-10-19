import { Request, Response, NextFunction } from 'express';
import { AuditLog, AuditAction } from '../models/AuditLog';

/**
 * Middleware to log API requests for audit trail
 * This should be added to routes that need auditing
 */
export const auditLogMiddleware = (
  action: AuditAction,
  resource: string,
  getResourceId?: (req: Request) => string | undefined
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json;

    // Override res.json to capture response
    res.json = function (body: any) {
      // Log the action after response
      setImmediate(async () => {
        try {
          const userId = (req as any).user?.id;
          const resourceId = getResourceId ? getResourceId(req) : req.params.id;

          await AuditLog.create({
            userId: userId || undefined,
            action,
            resource,
            resourceId: resourceId || undefined,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            status: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed',
            errorMessage: res.statusCode >= 400 ? (body?.error || 'Request failed') : undefined,
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit log error:', error);
        }
      });

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

