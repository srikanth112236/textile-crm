import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types/roles';

export interface IRole extends Document {
  name: string;
  permissions: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      enum: Object.values(UserRole),
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoleSchema.index({ name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);

