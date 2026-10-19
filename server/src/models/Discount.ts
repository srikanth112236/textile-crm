import mongoose, { Document, Schema } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface IDiscount extends Document {
  code: string;
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  minPurchase?: number; // Minimum purchase amount required (on qualifying subtotal when scoped)
  maxDiscount?: number; // Maximum discount amount (for percentage type)
  expiry: Date;
  usageLimit?: number; // Total usage limit (null = unlimited)
  usedCount: number; // Current usage count
  isActive: boolean;
  description?: string;
  firstOrderOnly?: boolean; // e.g. MENTOOS15 — only the customer's first order
  minItems?: number; // minimum total item quantity, e.g. BUY2GET10 combo
  applicableCategories?: mongoose.Types.ObjectId[]; // empty/undefined = storewide (FESTIVE20 = ethnic subtree)
  freeShipping?: boolean; // e.g. FREESHIP — zeroes shippingCost at order creation
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return /^[A-Z0-9-_]+$/.test(v);
        },
        message: 'Discount code can only contain uppercase letters, numbers, hyphens, and underscores',
      },
    },
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
      validate: {
        validator: function (v: number) {
          if (this.type === DiscountType.PERCENTAGE) {
            return v >= 0 && v <= 100;
          }
          return v >= 0;
        },
        message: 'Percentage discounts must be between 0 and 100',
      },
    },
    minPurchase: {
      type: Number,
      min: [0, 'Minimum purchase cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative'],
    },
    expiry: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    minItems: {
      type: Number,
      min: [0, 'Minimum items cannot be negative'],
    },
    applicableCategories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
      index: true,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DiscountSchema.index({ code: 1 }, { unique: true });
DiscountSchema.index({ isActive: 1, expiry: 1 });
DiscountSchema.index({ createdAt: -1 });

// Validate that expiry is in the future on create
DiscountSchema.pre('save', function (next) {
  if (this.isNew && this.expiry <= new Date()) {
    next(new Error('Expiry date must be in the future'));
    return;
  }
  next();
});

// Validate maxDiscount is provided for percentage type
DiscountSchema.pre('save', function (next) {
  if (this.type === DiscountType.PERCENTAGE && !this.maxDiscount && this.value > 0) {
    // Warn but don't fail - maxDiscount is optional but recommended
    console.warn('Warning: Percentage discount without maxDiscount may result in large discounts');
  }
  next();
});

export const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);

