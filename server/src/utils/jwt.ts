import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRY: StringValue = (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue;
const JWT_REFRESH_EXPIRY: StringValue = (process.env.JWT_REFRESH_EXPIRY || '7d') as StringValue;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate access token (15 minutes expiry)
export const generateAccessToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Generate refresh token (7 days expiry)
export const generateRefreshToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify token
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

