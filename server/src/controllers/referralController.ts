import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Referral, makeReferralCode } from '../models/Referral';
import { User } from '../models/User';

// Referral rewards (loyalty points; 100 pts = ₹1 at checkout)
export const REFERRER_POINTS = 500;
export const REFEREE_POINTS = 200;

export async function getOrCreateCode(userId: string) {
  let ref = await Referral.findOne({ userId });
  if (!ref) {
    ref = await Referral.create({ userId: new mongoose.Types.ObjectId(userId), code: makeReferralCode() });
  }
  return ref;
}

// GET /api/referrals/mine — my code + stats
export const myReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const ref = await getOrCreateCode(req.user!.userId);
    res.status(200).json({ success: true, data: { code: ref.code, referredCount: ref.referredCount, pointsEarned: ref.pointsEarned } });
  } catch (err) {
    console.error('My referral error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Called on registration when referralCode is supplied. Awards both sides.
export async function applyReferralSignup(newUserId: string, code: string): Promise<boolean> {
  try {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) return false;
    const ref = await Referral.findOne({ code: clean });
    if (!ref || ref.userId.toString() === newUserId.toString()) return false;
    const [referrer, referee] = await Promise.all([User.findById(ref.userId), User.findById(newUserId)]);
    if (!referrer || !referee) return false;
    referrer.loyaltyPoints += REFERRER_POINTS;
    referrer.loyaltyPointsHistory.push({ points: REFERRER_POINTS, reason: `Referral: new buyer joined (${clean})`, createdAt: new Date() });
    referee.loyaltyPoints += REFEREE_POINTS;
    referee.loyaltyPointsHistory.push({ points: REFEREE_POINTS, reason: 'Welcome referral bonus', createdAt: new Date() });
    ref.referredCount += 1;
    ref.pointsEarned += REFERRER_POINTS;
    await Promise.all([referrer.save(), referee.save(), ref.save()]);
    // Ensure the new buyer also gets their own code
    await getOrCreateCode(newUserId);
    return true;
  } catch (err) {
    console.error('applyReferralSignup error:', err);
    return false;
  }
}
