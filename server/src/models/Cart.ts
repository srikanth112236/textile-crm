import mongoose, { Document, Schema } from 'mongoose';

// Cart item schema
export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  variations?: Array<{
    name: string;
    value: string;
  }>;
  price: number; // Snapshot price at time of adding to cart
  addedAt: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  abandonedNotifiedAt?: Date; // last abandoned-cart nudge (WhatsApp cooldown)
  updatedAt: Date;
  createdAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    variations: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          value: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // One cart per user
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    abandonedNotifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ updatedAt: 1 }); // For abandoned cart detection

export const Cart = mongoose.model<ICart>('Cart', CartSchema);


