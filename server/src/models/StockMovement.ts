import mongoose, { Document, Schema } from 'mongoose';

// =====================================================
// STOCK MOVEMENT INTERFACES
// =====================================================

// Movement types
export enum StockMovementType {
  STOCK_IN = 'stock_in', // Inventory received
  STOCK_OUT = 'stock_out', // Inventory removed (not order-related)
  ORDER = 'order', // Order fulfilled - stock reduced
  ORDER_CANCELLED = 'order_cancelled', // Order cancelled - stock returned
  ORDER_REFUND = 'order_refund', // Order refunded - stock returned
  TRANSFER = 'transfer', // Stock transferred between warehouses
  ADJUSTMENT = 'adjustment', // Manual stock adjustment
  DAMAGE = 'damage', // Damaged goods written off
  RETURN = 'return', // Customer return
  RECOUNT = 'recount', // Physical inventory recount
  EXPIRED = 'expired', // Expired products
  RESERVED = 'reserved', // Reserved for pending order
  UNRESERVED = 'unreserved', // Reservation released
}

// Movement status
export enum StockMovementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// Transfer details (for warehouse-to-warehouse transfers)
export interface ITransferDetails {
  fromWarehouseId: mongoose.Types.ObjectId;
  toWarehouseId: mongoose.Types.ObjectId;
  fromWarehouseName?: string;
  toWarehouseName?: string;
  transferNumber?: string;
  estimatedArrival?: Date;
  actualArrival?: Date;
}

// Main Stock Movement interface
export interface IStockMovement extends Document {
  movementNumber: string; // Unique movement reference (e.g., MOV-20250106-001)
  type: StockMovementType;
  status: StockMovementStatus;
  
  // Product info
  productId: mongoose.Types.ObjectId;
  productName?: string;
  variantSku?: string;
  
  // Quantity
  quantity: number; // Positive for incoming, negative for outgoing
  previousStock: number; // Stock before movement
  newStock: number; // Stock after movement
  
  // Warehouse info
  warehouseId?: mongoose.Types.ObjectId;
  warehouseName?: string;
  warehouseCode?: string;
  
  // Transfer details (for transfer type)
  transfer?: ITransferDetails;
  
  // Reference IDs
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  supplierId?: string;
  purchaseOrderNumber?: string;
  
  // Cost tracking
  unitCost?: number;
  totalCost?: number;
  
  // Additional info
  reason: string;
  notes?: string;
  location?: string; // Aisle/bin location
  batchNumber?: string; // For batch tracking
  expiryDate?: Date;
  
  // Audit info
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// MONGOOSE SCHEMAS
// =====================================================

const TransferDetailsSchema = new Schema<ITransferDetails>(
  {
    fromWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'From warehouse is required'],
    },
    toWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'To warehouse is required'],
    },
    fromWarehouseName: { type: String, trim: true },
    toWarehouseName: { type: String, trim: true },
    transferNumber: { type: String, trim: true, uppercase: true },
    estimatedArrival: { type: Date },
    actualArrival: { type: Date },
  },
  { _id: false }
);

const StockMovementSchema = new Schema<IStockMovement>(
  {
    movementNumber: {
      type: String,
      required: [true, 'Movement number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(StockMovementType),
      required: [true, 'Movement type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(StockMovementStatus),
      default: StockMovementStatus.COMPLETED,
      index: true,
    },
    
    // Product info
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    productName: { type: String, trim: true },
    variantSku: { type: String, trim: true, uppercase: true },
    
    // Quantity
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock is required'],
      min: 0,
    },
    newStock: {
      type: Number,
      required: [true, 'New stock is required'],
      min: 0,
    },
    
    // Warehouse info
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      index: true,
    },
    warehouseName: { type: String, trim: true },
    warehouseCode: { type: String, trim: true, uppercase: true },
    
    // Transfer details
    transfer: {
      type: TransferDetailsSchema,
    },
    
    // Reference IDs
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    orderNumber: { type: String, trim: true, uppercase: true },
    supplierId: { type: String, trim: true },
    purchaseOrderNumber: { type: String, trim: true, uppercase: true },
    
    // Cost tracking
    unitCost: { type: Number, min: 0 },
    totalCost: { type: Number, min: 0 },
    
    // Additional info
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    location: { type: String, trim: true, maxlength: [50, 'Location cannot exceed 50 characters'] },
    batchNumber: { type: String, trim: true, maxlength: [50, 'Batch number cannot exceed 50 characters'] },
    expiryDate: { type: Date },
    
    // Audit info
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    createdByName: { type: String, trim: true },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// =====================================================
// INDEXES
// =====================================================

StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ warehouseId: 1, createdAt: -1 });
StockMovementSchema.index({ type: 1, createdAt: -1 });
StockMovementSchema.index({ orderId: 1 });
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ 'transfer.fromWarehouseId': 1 });
StockMovementSchema.index({ 'transfer.toWarehouseId': 1 });

// =====================================================
// STATIC METHODS
// =====================================================

StockMovementSchema.statics.generateMovementNumber = async function (): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the last movement number for today
  const lastMovement = await this.findOne({
    movementNumber: { $regex: `^MOV-${dateStr}` },
  })
    .sort({ movementNumber: -1 })
    .lean();
  
  let sequence = 1;
  if (lastMovement) {
    const lastSequence = parseInt(lastMovement.movementNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }
  
  return `MOV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
};

StockMovementSchema.statics.getProductHistory = function (productId: string, limit = 50) {
  return this.find({ productId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email')
    .lean();
};

StockMovementSchema.statics.getWarehouseHistory = function (warehouseId: string, limit = 50) {
  return this.find({ warehouseId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId', 'name sku')
    .populate('createdBy', 'name email')
    .lean();
};

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);

