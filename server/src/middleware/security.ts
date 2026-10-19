import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { corsOrigin } from '../config/origins';

// Helmet configuration for security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:5000', 'https://textile-crm-backend.onrender.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
export const corsMiddleware = cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate limiting middleware — generous global cap so normal shopping
// (listing + filters + cart + wishlist fire together on every page load)
// never trips it; abuse protection lives on auth/OTP endpoints instead.
// Frontend reads `retryAfterSeconds` (or RateLimit-Reset header) and shows a
// plain-English "try again in N seconds" countdown.
export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP — normal browsing stays far below
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    const resetTime = (req as any).rateLimit?.resetTime;
    const msLeft = resetTime ? new Date(resetTime).getTime() - Date.now() : 60 * 1000;
    const retryAfterSeconds = Math.max(1, Math.min(60, Math.ceil(msLeft / 1000)));
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfterSeconds,
    });
  },
});

// Strict cap for auth / OTP endpoints (brute-force protection).
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many attempts. Please wait a moment and try again.',
      retryAfterSeconds: 60,
    });
  },
});

// Stricter rate limiting for GDPR endpoints (prevent abuse)
export const gdprRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour (export/delete operations)
  message: {
    error: 'Too many GDPR requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  skipFailedRequests: false,
});

// HTTPS enforcement middleware (production only)
export const httpsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.HTTPS_ENABLED === 'true' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};

