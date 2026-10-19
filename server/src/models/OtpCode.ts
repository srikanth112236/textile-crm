import mongoose, { Document, Schema } from 'mongoose';

// Mobile OTP codes for passwordless login. Code stored hashed, 5-min expiry, max 5 attempts.
export interface IOtpCode extends Document {
  phone: string; // normalized 10-digit Indian mobile
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    phone: { type: String, required: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OtpCodeSchema.index({ phone: 1, createdAt: -1 });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = mongoose.model<IOtpCode>('OtpCode', OtpCodeSchema);

export function normalizePhone(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
  if (/^[6-9]\d{9}$/.test(ten)) return ten;
  return null;
}
