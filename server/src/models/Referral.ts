import mongoose, { Document, Schema } from 'mongoose';

// Referral code per user. New buyers signup with a code; both sides earn
// loyalty points (referrer on signup, referee bonus). Stats derived by count.
export interface IReferral extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  referredCount: number;
  pointsEarned: number;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    referredCount: { type: Number, default: 0, min: 0 },
    pointsEarned: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);

export function makeReferralCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `MENTOOS-${suffix}`;
}
