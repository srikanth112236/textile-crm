import mongoose, { Document, Schema } from 'mongoose';

// =====================================================
// WAREHOUSE INTERFACES
// =====================================================

// Address for warehouse location
export interface IWarehouseAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Warehouse contact information
export interface IWarehouseContact {
  name?: string;
  email?: string;
  phone?: string;
}

// Warehouse settings
export interface IWarehouseSettings {
  priority: number; // For fulfillment order (lower = higher priority)
  maxCapacity?: number; // Max stock capacity
  handlingTime?: number; // Days to process and ship
  supportedRegions?: string[]; // Countries/regions this warehouse ships to
  isPickup?: boolean; // Supports customer pickup
}

// Stock entry for a product in this warehouse
export interface IWarehouseStock {
  productId: mongoose.Types.ObjectId;
  variantSku?: string; // For variant-specific stock
  quantity: number;
  reservedQuantity: number; // Reserved for pending orders
  availableQuantity: number; // quantity - reservedQuantity
  reorderPoint: number; // Alert when stock falls below
  reorderQuantity: number; // Suggested reorder amount
  lastStockUpdate: Date;
  location?: string; // Aisle/bin location within warehouse
}

// Main Warehouse interface
export interface IWarehouse extends Document {
  name: string;
  code: string; // Unique short code (e.g., "WH-NYC", "WH-LAX")
  address: IWarehouseAddress;
  contact?: IWarehouseContact;
  settings: IWarehouseSettings;
  isActive: boolean;
  isDefault: boolean; // Default warehouse for new products
  stock: IWarehouseStock[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// MONGOOSE SCHEMAS
// =====================================================

const WarehouseAddressSchema = new Schema<IWarehouseAddress>(
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

const WarehouseContactSchema = new Schema<IWarehouseContact>(
  {
    name: { type: String, trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    phone: { type: String, trim: true, maxlength: [20, 'Phone cannot exceed 20 characters'] },
  },
  { _id: false }
);

const WarehouseSettingsSchema = new Schema<IWarehouseSettings>(
  {
    priority: { type: Number, default: 0, min: 0 },
    maxCapacity: { type: Number, min: 0 },
    handlingTime: { type: Number, default: 1, min: 0 },
    supportedRegions: { type: [String], default: [] },
    isPickup: { type: Boolean, default: false },
  },
  { _id: false }
);

const WarehouseStockSchema = new Schema<IWarehouseStock>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    variantSku: { type: String, trim: true, uppercase: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, min: 0, default: 0 },
    availableQuantity: { type: Number, min: 0, default: 0 },
    reorderPoint: { type: Number, min: 0, default: 10 },
    reorderQuantity: { type: Number, min: 0, default: 50 },
    lastStockUpdate: { type: Date, default: Date.now },
    location: { type: String, trim: true, maxlength: [50, 'Location cannot exceed 50 characters'] },
  },
  { _id: true }
);

// Pre-save hook to calculate available quantity
WarehouseStockSchema.pre('save', function (next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  this.lastStockUpdate = new Date();
  next();
});

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
      maxlength: [100, 'Warehouse name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Warehouse code cannot exceed 20 characters'],
      validate: {
        validator: function (v: string) {
          return /^[A-Z0-9\-]+$/.test(v);
        },
        message: 'Warehouse code must contain only uppercase letters, numbers, and hyphens',
      },
    },
    address: {
      type: WarehouseAddressSchema,
      required: [true, 'Warehouse address is required'],
    },
    contact: {
      type: WarehouseContactSchema,
    },
    settings: {
      type: WarehouseSettingsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    stock: {
      type: [WarehouseStockSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// =====================================================
// INDEXES
// =====================================================

WarehouseSchema.index({ code: 1 });
WarehouseSchema.index({ isActive: 1 });
WarehouseSchema.index({ isDefault: 1 });
WarehouseSchema.index({ 'settings.priority': 1 });
WarehouseSchema.index({ 'stock.productId': 1 });
WarehouseSchema.index({ 'stock.variantSku': 1 });
WarehouseSchema.index({ 'address.country': 1, 'address.state': 1 });

// =====================================================
// PRE-SAVE HOOKS
// =====================================================

// Ensure only one default warehouse
WarehouseSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    // Unset default from other warehouses
    await mongoose.model('Warehouse').updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// =====================================================
// STATIC METHODS
// =====================================================

WarehouseSchema.statics.getActiveWarehouses = function () {
  return this.find({ isActive: true }).sort({ 'settings.priority': 1 });
};

WarehouseSchema.statics.getDefaultWarehouse = function () {
  return this.findOne({ isDefault: true, isActive: true });
};

WarehouseSchema.statics.getWarehouseStock = async function (productId: string, warehouseId?: string) {
  const query: any = { 'stock.productId': productId };
  if (warehouseId) {
    query._id = warehouseId;
  }
  
  const warehouses = await this.find(query).select('name code stock').lean();
  
  return warehouses.map((wh: IWarehouse) => ({
    warehouseId: wh._id,
    warehouseName: wh.name,
    warehouseCode: wh.code,
    stock: wh.stock.filter((s: IWarehouseStock) => s.productId.toString() === productId),
  }));
};

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

