import mongoose, { Document, Schema } from 'mongoose';

// COD slab: different advance amount based on order value
export interface ICODSlab {
  minOrderValue: number;
  maxOrderValue?: number;
  amount: number;
}

export interface ISettings extends Document {
  key: string; // singleton key, always 'global'
  codConfirmation: {
    enabled: boolean;
    mode: 'fixed' | 'percent' | 'slab';
    defaultAmount: number; // e.g. 99
    fixedOptions: number[]; // [49, 99, 149, 199]
    percentValue: number; // e.g. 10 for 10%
    percentMaxCap?: number;
    slabs: ICODSlab[];
    minOrderValueForCOD: number; // COD allowed above this? 0 = always
    maxOrderValueForCOD?: number; // COD disabled above this (RTO risk)
    // Phase E: smart rules
    pincodeMode: 'none' | 'block' | 'allow'; // block = RTO blocklist, allow = serviceable-only
    pincodes: string[]; // 6-digit pincodes for the mode above
    trustedMinDelivered: number; // delivered orders (0 cancelled) to waive advance
    riskThreshold: number; // first-time orders above this value pay riskAdvance (0 = off)
    riskAdvance: number;
  };
  shipping: {
    freeShippingThreshold: number; // e.g. 999
    flatShippingCost: number; // e.g. 49
    codShippingExtra: number; // extra fee for COD logistics
    defaultWeightG: number; // fallback 500
    defaultLengthCm: number; // 30
    defaultWidthCm: number; // 25
    defaultHeightCm: number; // 3
    pickupPincode: string;
    pickupLocation: string;
  };
  payments: {
    razorpayEnabled: boolean;
    razorpayKeyId: string; // public key only — secret stays in env
    codEnabled: boolean;
    upiEnabled: boolean;
    cardEnabled: boolean;
    netbankingEnabled: boolean;
    walletEnabled: boolean;
  };
  shipment: {
    provider: 'shiprocket';
    shiprocketEnabled: boolean;
    pickupLocation: string;
    channelId: string;
    autoPush: boolean; // auto-push processing/packed orders to Shiprocket
  };
  refunds: {
    autoRefundOnCancel: boolean; // auto-route captured money back on cancel (default true)
    allowCustomerCancelHours: number | null; // customer cancel window; null = unlimited
    codAdvanceRefundable: boolean; // COD advance auto-refunded on cancel (default true)
  };
  whatsapp: {
    enabled: boolean;
    provider: 'interakt' | 'wati' | 'gupshup' | 'custom';
    supportNumber: string;
    orderTemplates: Record<string, string>;
  };
  storefront: {
    banners: Array<{
      image: string;
      title: string;
      subtitle?: string;
      link: string;
      isActive: boolean;
    }>;
    announcement: string;
  };
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CODSlabSchema = new Schema<ICODSlab>(
  {
    minOrderValue: { type: Number, required: true, min: 0 },
    maxOrderValue: { type: Number, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    codConfirmation: {
      enabled: { type: Boolean, default: true },
      mode: { type: String, enum: ['fixed', 'percent', 'slab'], default: 'fixed' },
      defaultAmount: { type: Number, default: 99, min: 0 },
      fixedOptions: { type: [Number], default: [49, 99, 149, 199] },
      percentValue: { type: Number, default: 10, min: 0, max: 100 },
      percentMaxCap: { type: Number, min: 0 },
      slabs: { type: [CODSlabSchema], default: [] },
      minOrderValueForCOD: { type: Number, default: 0, min: 0 },
      maxOrderValueForCOD: { type: Number, min: 0 },
      pincodeMode: { type: String, enum: ['none', 'block', 'allow'], default: 'none' },
      pincodes: { type: [String], default: [] },
      trustedMinDelivered: { type: Number, default: 2, min: 0 },
      riskThreshold: { type: Number, default: 0, min: 0 },
      riskAdvance: { type: Number, default: 149, min: 0 },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 999, min: 0 },
      flatShippingCost: { type: Number, default: 49, min: 0 },
      codShippingExtra: { type: Number, default: 0, min: 0 },
      defaultWeightG: { type: Number, default: 500, min: 1 },
      defaultLengthCm: { type: Number, default: 30, min: 1 },
      defaultWidthCm: { type: Number, default: 25, min: 1 },
      defaultHeightCm: { type: Number, default: 3, min: 1 },
      pickupPincode: { type: String, default: '515122', trim: true },
      pickupLocation: { type: String, default: 'Primary', trim: true },
    },
    payments: {
      razorpayEnabled: { type: Boolean, default: false },
      razorpayKeyId: { type: String, default: '', trim: true },
      codEnabled: { type: Boolean, default: true },
      upiEnabled: { type: Boolean, default: true },
      cardEnabled: { type: Boolean, default: true },
      netbankingEnabled: { type: Boolean, default: true },
      walletEnabled: { type: Boolean, default: true },
    },
    shipment: {
      provider: { type: String, default: 'shiprocket' },
      shiprocketEnabled: { type: Boolean, default: false },
      pickupLocation: { type: String, default: 'Primary', trim: true },
      channelId: { type: String, default: '', trim: true },
      autoPush: { type: Boolean, default: true },
    },
    refunds: {
      autoRefundOnCancel: { type: Boolean, default: true },
      allowCustomerCancelHours: { type: Number, min: 1, max: 720, default: null },
      codAdvanceRefundable: { type: Boolean, default: true },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, enum: ['interakt', 'wati', 'gupshup', 'custom'], default: 'interakt' },
      supportNumber: { type: String, default: '', trim: true },
      orderTemplates: { type: Schema.Types.Mixed, default: {} },
    },
    storefront: {
      banners: {
        type: [
          {
            image: { type: String, required: true, trim: true },
            title: { type: String, required: true, trim: true },
            subtitle: { type: String, trim: true },
            link: { type: String, required: true, trim: true },
            isActive: { type: Boolean, default: true },
          },
        ],
        default: [],
      },
      announcement: { type: String, default: 'Free shipping on orders over ₹999', trim: true },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const DEFAULT_SETTINGS: Omit<ISettings, keyof Document> = {
  key: 'global',
  codConfirmation: {
    enabled: true,
    mode: 'fixed',
    defaultAmount: 99,
    fixedOptions: [49, 99, 149, 199],
    percentValue: 10,
    slabs: [
      { minOrderValue: 0, maxOrderValue: 999, amount: 49 },
      { minOrderValue: 1000, maxOrderValue: 1999, amount: 99 },
      { minOrderValue: 2000, amount: 149 },
    ],
    minOrderValueForCOD: 0,
    pincodeMode: 'none',
    pincodes: [],
    trustedMinDelivered: 2,
    riskThreshold: 0,
    riskAdvance: 149,
  },
  shipping: {
    freeShippingThreshold: 999,
    flatShippingCost: 49,
    codShippingExtra: 0,
    defaultWeightG: 500,
    defaultLengthCm: 30,
    defaultWidthCm: 25,
    defaultHeightCm: 3,
    pickupPincode: '515122',
    pickupLocation: 'Primary',
  },
  payments: {
    razorpayEnabled: false,
    razorpayKeyId: '',
    codEnabled: true,
    upiEnabled: true,
    cardEnabled: true,
    netbankingEnabled: true,
    walletEnabled: true,
  },
  shipment: {
    provider: 'shiprocket',
    shiprocketEnabled: false,
    pickupLocation: 'Primary',
    channelId: '',
    autoPush: true,
  },
  refunds: {
    autoRefundOnCancel: true,
    allowCustomerCancelHours: null,
    codAdvanceRefundable: true,
  },
  whatsapp: {
    enabled: false,
    provider: 'interakt',
    supportNumber: '',
    orderTemplates: {},
  },
  storefront: {
    banners: [],
    announcement: 'Free shipping on orders over ₹999',
  },
} as unknown as Omit<ISettings, keyof Document>;

export function computeCODAdvance(orderValue: number, settings: ISettings): number {
  const cod = settings.codConfirmation;
  if (!cod.enabled) return 0;
  if (orderValue < cod.minOrderValueForCOD) return 0;
  if (cod.maxOrderValueForCOD && orderValue > cod.maxOrderValueForCOD) return 0;
  if (cod.mode === 'percent') {
    const raw = Math.round((orderValue * cod.percentValue) / 100);
    const capped = cod.percentMaxCap ? Math.min(raw, cod.percentMaxCap) : raw;
    return Math.min(capped, orderValue);
  }
  if (cod.mode === 'slab' && cod.slabs.length > 0) {
    const slab = cod.slabs.find(
      (s) => orderValue >= s.minOrderValue && (s.maxOrderValue === undefined || orderValue <= s.maxOrderValue)
    );
    if (slab) return Math.min(slab.amount, orderValue);
  }
  return Math.min(cod.defaultAmount, orderValue);
}

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
