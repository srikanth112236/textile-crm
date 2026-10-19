import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

/**
 * Verify Google reCAPTCHA v3 token
 */
export const verifyRecaptcha = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip in development if RECAPTCHA_SECRET_KEY is not set
  if (!RECAPTCHA_SECRET_KEY || process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const recaptchaToken = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (!recaptchaToken) {
      throw new CustomError('reCAPTCHA token is required', 400);
    }

    // Verify with Google
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    const { success, score } = response.data;

    // reCAPTCHA v3 returns a score (0.0 to 1.0)
    // 1.0 is very likely a human, 0.0 is very likely a bot
    // Use a threshold (e.g., 0.5) to determine if request is valid
    if (!success || (score !== undefined && score < 0.5)) {
      throw new CustomError('reCAPTCHA verification failed', 400);
    }

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      next(error);
    } else {
      next(new CustomError('reCAPTCHA verification error', 400));
    }
  }
};

