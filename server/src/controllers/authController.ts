import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import { CustomError } from '../middleware/errorHandler';
import redisClient, { safeRedisOperation } from '../config/redis';
import { UserRole } from '../types/roles';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, role, adminSecret, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new CustomError('User with this email already exists', 400);
    }

    // Determine user role
    let userRole = UserRole.USER; // Default role

    // If role is specified, validate it
    if (role) {
      // Only allow admin/superadmin registration with secret key
      if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
        const requiredSecret = process.env.ADMIN_REGISTRATION_SECRET;
        
        if (!adminSecret || adminSecret !== requiredSecret) {
          throw new CustomError('Invalid admin registration secret', 403);
        }

        // Validate role
        if (role === UserRole.SUPERADMIN) {
          // Check if superadmin already exists (only one allowed)
          const existingSuperadmin = await User.findOne({ role: UserRole.SUPERADMIN });
          if (existingSuperadmin) {
            throw new CustomError('Superadmin already exists. Only one superadmin is allowed.', 400);
          }
          userRole = UserRole.SUPERADMIN;
        } else if (role === UserRole.ADMIN) {
          userRole = UserRole.ADMIN;
        }
      } else {
        // Regular users cannot specify role
        throw new CustomError('Invalid role specified', 400);
      }
    }

    // Create new user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      role: userRole,
    });

    await user.save();

    // Referral: award both sides + give the new buyer their own code
    let referralApplied = false;
    try {
      const { applyReferralSignup, getOrCreateCode } = await import('./referralController');
      if (referralCode) {
        referralApplied = await applyReferralSignup(user._id.toString(), referralCode);
      } else {
        await getOrCreateCode(user._id.toString());
      }
    } catch {
      // referrals optional
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis (7 days TTL) - optional if Redis not available
    await safeRedisOperation(async () => {
      await redisClient.setex(
        `refresh_token:${user._id}`,
        7 * 24 * 60 * 60, // 7 days in seconds
        refreshToken
      );
    });

    // Set refresh token in HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      referralApplied,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis - optional if Redis not available
    await safeRedisOperation(async () => {
      await redisClient.setex(
        `refresh_token:${user._id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );
    });

    // Set refresh token in HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get refresh token from cookie (preferred) or request body (fallback for compatibility)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new CustomError('Refresh token required', 400);
    }

    // Verify refresh token
    const { verifyToken } = await import('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    // Check if refresh token exists in Redis (optional - skip if Redis not available)
    const storedToken = await safeRedisOperation(async () => {
      return await redisClient.get(`refresh_token:${decoded.userId}`);
    });

    // Only validate against Redis if it's connected, otherwise just verify JWT
    if (storedToken !== false && storedToken !== refreshToken) {
      throw new CustomError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const payload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Update refresh token in Redis - optional if Redis not available
    await safeRedisOperation(async () => {
      await redisClient.setex(
        `refresh_token:${decoded.userId}`,
        7 * 24 * 60 * 60,
        newRefreshToken
      );
    });

    // Set new refresh token in HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    res.status(200).json({
      accessToken: newAccessToken,
      // Also returned for clients whose cookie never landed (e.g. proxied logins);
      // cookie remains the primary channel.
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    const userId = req.user.userId;

    // Delete refresh token from Redis - optional if Redis not available
    await safeRedisOperation(async () => {
      await redisClient.del(`refresh_token:${userId}`);
    });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

