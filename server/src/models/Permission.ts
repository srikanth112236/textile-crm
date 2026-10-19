import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  resource: string; // e.g., 'products', 'orders', 'users'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      lowercase: true,
      enum: [
        'products',
        'orders',
        'users',
        'categories',
        'discounts',
        'loyalty',
        'analytics',
        'settings',
      ],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
      enum: ['create', 'read', 'update', 'delete', 'manage'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
PermissionSchema.index({ name: 1 }, { unique: true });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);

