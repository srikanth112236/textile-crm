import { Request, Response } from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { OtpCode, normalizePhone } from '../models/OtpCode';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import { safeRedisOperation } from '../config/redis';
import redisClient from '../config/redis';
import { UserRole } from '../types/roles';

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString('hex');
}

// POST /api/auth/otp/send { phone }
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({ phone: Joi.string().trim().required().max(20) });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Enter a valid mobile number' });
      return;
    }
    const phone = normalizePhone(value.phone);
    if (!phone) {
      res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      return;
    }

    // Rate limit: max 5 codes per 15 min per phone
    const recent = await OtpCode.countDocuments({ phone, createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } });
    if (recent >= 5) {
      res.status(429).json({ error: 'Too many OTP requests. Try again after 15 minutes.' });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await OtpCode.create({ phone, codeHash: hashCode(code), expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    // Send via SMS provider if configured, else log (dev) — plug MSG91/Twilio keys to go live
    let mock = true;
    if (process.env.SMS_PROVIDER === 'msg91' && process.env.MSG91_API_KEY) {
      try {
        const { default: axios } = await import('axios');
        await axios.post('https://control.msg91.com/api/v5/flow/', {
          flow_id: process.env.MSG91_FLOW_ID,
          sender: process.env.MSG91_SENDER || 'MENTOS',
          mobiles: `91${phone}`,
          OTP: code,
        }, { headers: { authkey: process.env.MSG91_API_KEY as string }, timeout: 15000 });
        mock = false;
      } catch (e) {
        console.error('MSG91 send failed, falling back to log:', (e as Error).message);
      }
    }
    if (mock) console.log(`[OTP → +91${phone}] code: ${code} (plug SMS_PROVIDER=msg91 to send real SMS)`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your mobile number. Valid for 5 minutes.',
      ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/auth/otp/verify { phone, code, name? }
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      phone: Joi.string().trim().required().max(20),
      code: Joi.string().trim().regex(/^\d{6}$/).required(),
      name: Joi.string().trim().max(100).optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Enter the 6-digit OTP' });
      return;
    }
    const phone = normalizePhone(value.phone);
    if (!phone) {
      res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      return;
    }

    const record = await OtpCode.findOne({ phone, verified: false }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) {
      res.status(400).json({ error: 'OTP expired. Request a new one.' });
      return;
    }
    if (record.attempts >= 5) {
      res.status(429).json({ error: 'Too many wrong attempts. Request a new OTP.' });
      return;
    }
    if (record.codeHash !== hashCode(value.code)) {
      record.attempts += 1;
      await record.save();
      res.status(400).json({ error: 'Incorrect OTP. Try again.' });
      return;
    }
    record.verified = true;
    await record.save();

    // Find-or-create user by phone
    let user = await User.findOne({ phone });
    if (!user) {
      const email = `${phone}@otp.mentoos.in`;
      const existingEmail = await User.findOne({ email });
      user = existingEmail || (await User.create({
        email,
        password: randomPassword(),
        role: UserRole.USER,
        phone,
        name: value.name || undefined,
      } as any));
      if (!user.phone) {
        user.phone = phone;
        await user.save();
      }
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account is banned' });
      return;
    }

    try {
      const { getOrCreateCode } = await import('./referralController');
      await getOrCreateCode(user._id.toString());
    } catch {
      // referrals optional
    }

    const payload: JWTPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await safeRedisOperation(async () => {
      await redisClient.setex(`refresh_token:${user!._id}`, 7 * 24 * 60 * 60, refreshToken);
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      message: 'OTP login successful',
      user: { id: user._id, email: user.email, phone: user.phone, role: user.role, mfaEnabled: user.mfaEnabled },
      accessToken,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
