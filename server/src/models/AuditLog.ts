import mongoose, { Document, Schema } from 'mongoose';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  ROLE_CHANGE = 'role_change',
  USER_BAN = 'user_ban',
  USER_UNBAN = 'user_unban',
  PERMISSION_CHANGE = 'permission_change',
  ORDER_CREATE = 'order_create',
  ORDER_UPDATE = 'order_update',
  ORDER_CANCEL = 'order_cancel',
  REFUND = 'refund',
  DISCOUNT_APPLY = 'discount_apply',
  LOYALTY_REDEEM = 'loyalty_redeem',
}

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId; // User who performed the action (null for system actions)
  action: AuditAction;
  resource: string; // Resource type (e.g., 'user', 'order', 'product')
  resourceId?: mongoose.Types.ObjectId; // ID of the affected resource
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>; // Additional details about the action
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: [true, 'Action is required'],
      index: true,
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: [true, 'Status is required'],
      default: 'success',
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track createdAt
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });

// TTL index to automatically delete logs older than 1 year (optional, can be configured)
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

