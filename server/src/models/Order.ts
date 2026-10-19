import mongoose, { Document, Schema } from 'mongoose';

// Order item schema (matches cart item structure)
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  variations?: Array<{
    name: string;
    value: string;
  }>;
  price: number; // Snapshot price at time of order
  subtotal: number; // price * quantity
  fulfilledQuantity?: number; // For partial fulfillment
  warehouseId?: mongoose.Types.ObjectId; // Which warehouse fulfilled this item
}

// Shipping address schema (matches user address structure)
export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Order status enum
export enum OrderStatus {
  PENDING = 'pending', // Order created, awaiting payment confirmation
  PROCESSING = 'processing', // Payment confirmed, order being processed
  PACKED = 'packed', // Packed at warehouse, awaiting courier pickup
  PARTIALLY_FULFILLED = 'partially_fulfilled', // Some items shipped
  SHIPPED = 'shipped', // Order has been shipped
  OUT_FOR_DELIVERY = 'out_for_delivery', // With courier executive
  DELIVERED = 'delivered', // Order has been delivered
  CANCELLED = 'cancelled', // Order cancelled (stock returned)
  REFUNDED = 'refunded', // Order refunded (stock returned)
  ON_HOLD = 'on_hold', // Order on hold
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending', // Awaiting payment confirmation
  CONFIRMED = 'confirmed', // Payment confirmed by admin
  REFUNDED = 'refunded', // Payment refunded
  FAILED = 'failed', // Payment failed
  PARTIALLY_REFUNDED = 'partially_refunded', // Partial refund issued
}

// Order priority enum
export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Order flag enum for special handling
export enum OrderFlag {
  NONE = 'none',
  FRAGILE = 'fragile',
  GIFT = 'gift',
  INTERNATIONAL = 'international',
  VIP_CUSTOMER = 'vip_customer',
  FRAUD_REVIEW = 'fraud_review',
  SPECIAL_HANDLING = 'special_handling',
}

// Order note interface
export interface IOrderNote {
  _id?: mongoose.Types.ObjectId;
  content: string;
  type: 'internal' | 'customer' | 'system'; // Internal admin notes, customer-visible, system-generated
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Order timeline event
export interface IOrderTimelineEvent {
  _id?: mongoose.Types.ObjectId;
  event: string;
  description?: string;
  type: 'status_change' | 'note_added' | 'payment' | 'fulfillment' | 'system';
  metadata?: Record<string, any>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string; // Unique order number (e.g., ORD-20250101-001)
  items: IOrderItem[];
  total: number; // Total order amount
  subtotal?: number; // Before discounts/taxes
  taxAmount?: number;
  discountAmount?: number;
  discountCode?: string; // coupon applied, e.g. MENTOOS15
  shippingCost?: number;
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // e.g., "manual", "bank_transfer", etc.
  paymentNotes?: string; // Admin notes about payment
  refundAmount?: number; // Amount refunded (if any)
  refundNotes?: string; // Notes about refund
  // Manual-settlement destination (used when no online money to auto-refund)
  refundMethod?: 'source' | 'upi' | 'bank';
  refundUpiId?: string;
  refundBankName?: string;
  refundBankAccount?: string;
  refundBankIfsc?: string;
  refundStatus?: 'none' | 'pending' | 'processing' | 'completed';
  refundCompletedAt?: Date;
  refundReference?: string; // gateway refund id / manual transaction ref
  cancelledBy?: mongoose.Types.ObjectId; // User ID who cancelled (if cancelled by user)
  cancelledReason?: string; // Reason for cancellation
  
  // Phase 9 additions
  priority: OrderPriority;
  flags: OrderFlag[];
  notes: IOrderNote[];
  timeline: IOrderTimelineEvent[];
  assignedTo?: mongoose.Types.ObjectId; // Admin assigned to this order
  assignedToName?: string;
  internalReference?: string; // Internal reference number
  customerNotes?: string; // Notes from customer at checkout
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  fulfilledAt?: Date;
  isArchived?: boolean;
  tags?: string[]; // Custom tags for filtering
  source?: string; // Order source (web, mobile, api)
  ip?: string; // Customer IP for fraud detection

  // Phase 1: Razorpay + COD confirmation
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  codAdvancePaid?: number;
  codBalance?: number;

  // Phase 2: Shiprocket
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketAWB?: string;
  shiprocketCourier?: string;
  shiprocketCourierId?: string;
  shiprocketStatus?: string;
  shiprocketPickupScheduled?: boolean;
  pickupLocation?: string;
  packageWeightG?: number;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
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
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    fulfilledQuantity: {
      type: Number,
      min: [0, 'Fulfilled quantity cannot be negative'],
      default: 0,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
  },
  { _id: true }
);

const OrderNoteSchema = new Schema<IOrderNote>(
  {
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['internal', 'customer', 'system'],
      default: 'internal',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    createdByName: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const OrderTimelineEventSchema = new Schema<IOrderTimelineEvent>(
  {
    event: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['status_change', 'note_added', 'payment', 'fulfillment', 'system'],
      default: 'system',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
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
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function (v: IOrderItem[]) {
          return v.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    subtotal: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
    },
    taxAmount: {
      type: Number,
      min: [0, 'Tax amount cannot be negative'],
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative'],
      default: 0,
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [32, 'Discount code too long'],
    },
    shippingCost: {
      type: Number,
      min: [0, 'Shipping cost cannot be negative'],
      default: 0,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
      default: 'manual',
    },
    paymentNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Payment notes cannot exceed 500 characters'],
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundMethod: {
      type: String,
      enum: ['source', 'upi', 'bank'],
      default: 'source',
    },
    refundUpiId: { type: String, trim: true, maxlength: [100, 'UPI ID too long'] },
    refundBankName: { type: String, trim: true, maxlength: [100, 'Account name too long'] },
    refundBankAccount: { type: String, trim: true, maxlength: [30, 'Account number too long'] },
    refundBankIfsc: { type: String, trim: true, uppercase: true, maxlength: [11, 'IFSC too long'] },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processing', 'completed'],
      default: 'none',
    },
    refundCompletedAt: { type: Date },
    refundReference: { type: String, trim: true, maxlength: [100, 'Reference too long'] },
    refundNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund notes cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    
    // Phase 9 additions
    priority: {
      type: String,
      enum: Object.values(OrderPriority),
      default: OrderPriority.NORMAL,
      index: true,
    },
    flags: {
      type: [String],
      enum: Object.values(OrderFlag),
      default: [OrderFlag.NONE],
    },
    notes: {
      type: [OrderNoteSchema],
      default: [],
    },
    timeline: {
      type: [OrderTimelineEventSchema],
      default: [],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedToName: {
      type: String,
      trim: true,
    },
    internalReference: {
      type: String,
      trim: true,
      maxlength: [100, 'Internal reference cannot exceed 100 characters'],
    },
    customerNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Customer notes cannot exceed 1000 characters'],
    },
    trackingNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Tracking number cannot exceed 100 characters'],
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    fulfilledAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      trim: true,
      default: 'web',
    },
    ip: {
      type: String,
      trim: true,
    },
    // Phase 1: Razorpay + COD
    razorpayOrderId: { type: String, trim: true, index: true },
    razorpayPaymentId: { type: String, trim: true, index: true },
    codAdvancePaid: { type: Number, min: 0, default: 0 },
    codBalance: { type: Number, min: 0, default: 0 },
    // Phase 2: Shiprocket
    shiprocketOrderId: { type: String, trim: true, index: true },
    shiprocketShipmentId: { type: String, trim: true },
    shiprocketAWB: { type: String, trim: true, index: true },
    shiprocketCourier: { type: String, trim: true },
    shiprocketCourierId: { type: String, trim: true },
    shiprocketStatus: { type: String, trim: true },
    shiprocketPickupScheduled: { type: Boolean, default: false },
    pickupLocation: { type: String, trim: true },
    packageWeightG: { type: Number, min: 0 },
    packageLengthCm: { type: Number, min: 0 },
    packageWidthCm: { type: Number, min: 0 },
    packageHeightCm: { type: Number, min: 0 },
  },
  {
    timestamps: true,
  }
);

// Validate that orderNumber exists before saving (custom validator)
OrderSchema.pre('validate', function (next) {
  if (this.isNew && !this.orderNumber) {
    // If orderNumber is missing, it will be generated in pre-save hook
    // This is just a safety check
    return next();
  }
  next();
});

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ priority: 1, createdAt: -1 });
OrderSchema.index({ assignedTo: 1, status: 1 });
OrderSchema.index({ isArchived: 1 });
OrderSchema.index({ tags: 1 });
OrderSchema.index({ 'items.productId': 1 });

// Note: Order number generation is now handled in the controller using generateOrderNumber utility
// This ensures proper handling with MongoDB transactions and sessions

// Auto-update payment status when order status changes to processing.
// Narrowed: COD orders with balance still due are NOT paid in full, so they
// stay PENDING (previously any PENDING→PROCESSING move, including COD
// advance verification, was wrongly flipped to CONFIRMED).
OrderSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === OrderStatus.PROCESSING) {
    if (this.paymentStatus === PaymentStatus.PENDING) {
      const isCod = (this as any).paymentMethod === 'cod';
      const balanceDue = (this as any).codBalance || 0;
      if (!(isCod && balanceDue > 0)) {
        this.paymentStatus = PaymentStatus.CONFIRMED;
      }
    }
  }
  next();
});

// Add timeline event when status changes
OrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const event: IOrderTimelineEvent = {
      event: `Status changed to ${this.status}`,
      description: `Order status updated to ${this.status}`,
      type: 'status_change',
      metadata: { newStatus: this.status },
      createdAt: new Date(),
    };
    this.timeline.push(event);
  }
  
  // Set fulfilledAt when all items are fulfilled
  if (this.isModified('items') && this.status !== OrderStatus.CANCELLED && this.status !== OrderStatus.REFUNDED) {
    const allFulfilled = this.items.every(
      (item) => (item.fulfilledQuantity || 0) >= item.quantity
    );
    if (allFulfilled && !this.fulfilledAt) {
      this.fulfilledAt = new Date();
    }
  }
  
  // Set deliveredAt when status changes to delivered
  if (this.isModified('status') && this.status === OrderStatus.DELIVERED && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  next();
});

// Add timeline event when created
OrderSchema.pre('save', function (next) {
  if (this.isNew) {
    const event: IOrderTimelineEvent = {
      event: 'Order created',
      description: `Order ${this.orderNumber} was created`,
      type: 'system',
      metadata: { orderNumber: this.orderNumber },
      createdAt: new Date(),
    };
    this.timeline.push(event);
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

