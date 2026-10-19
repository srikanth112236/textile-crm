import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/roles';

// Address subdocument schema
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

// Loyalty points history entry
export interface ILoyaltyPointsEntry {
  orderId?: mongoose.Types.ObjectId;
  points: number; // Positive for earned, negative for redeemed
  reason: string; // e.g., 'Order completed', 'Points redeemed', 'Admin adjustment'
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  mfaSecret?: string;
  mfaEnabled: boolean;
  // Profile fields
  name?: string;
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  // Body measurements for size recommendations (metric/imperial as labeled)
  measurements?: {
    heightCm?: number;
    weightKg?: number;
    chestIn?: number;
    waistIn?: number;
    hipIn?: number;
    fit?: 'slim' | 'regular' | 'relaxed' | 'oversized';
  };
  wishlist: mongoose.Types.ObjectId[]; // Array of product IDs
  // Loyalty points
  loyaltyPoints: number;
  loyaltyPointsHistory: ILoyaltyPointsEntry[];
  // Ban status
  isBanned: boolean;
  bannedAt?: Date;
  bannedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't return MFA secret by default
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    // Profile fields
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string | undefined) {
          if (!v) return true; // Optional field
          return /^\+?[\d\s\-()]+$/.test(v);
        },
        message: 'Please provide a valid phone number',
      },
    },
    avatar: {
      type: String,
      trim: true,
    },
    measurements: {
      type: new Schema(
        {
          heightCm: { type: Number, min: 140, max: 220 },
          weightKg: { type: Number, min: 35, max: 180 },
          chestIn: { type: Number, min: 28, max: 60 },
          waistIn: { type: Number, min: 22, max: 60 },
          hipIn: { type: Number, min: 28, max: 65 },
          fit: { type: String, enum: ['slim', 'regular', 'relaxed', 'oversized'], default: 'regular' },
        },
        { _id: false }
      ),
      required: false,
    },
    addresses: {
      type: [
        {
          street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true,
            maxlength: [200, 'Street address cannot exceed 200 characters'],
          },
          city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            maxlength: [100, 'City cannot exceed 100 characters'],
          },
          state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
            maxlength: [100, 'State cannot exceed 100 characters'],
          },
          zip: {
            type: String,
            required: [true, 'ZIP code is required'],
            trim: true,
            maxlength: [20, 'ZIP code cannot exceed 20 characters'],
          },
          country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            maxlength: [100, 'Country cannot exceed 100 characters'],
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
    wishlist: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
    // Loyalty points
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, 'Loyalty points cannot be negative'],
    },
    loyaltyPointsHistory: {
      type: [
        {
          orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
          },
          points: {
            type: Number,
            required: true,
          },
          reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Reason cannot exceed 200 characters'],
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    // Ban status
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    bannedAt: {
      type: Date,
    },
    bannedReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Ban reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes
// Note: email index is created automatically by unique: true in schema
// Only add explicit indexes for non-unique fields
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure only one default address exists
UserSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter((addr) => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      let foundFirst = false;
      this.addresses.forEach((addr) => {
        if (addr.isDefault && !foundFirst) {
          foundFirst = true;
        } else if (addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);

