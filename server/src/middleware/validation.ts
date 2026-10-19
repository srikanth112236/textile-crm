import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { CustomError } from './errorHandler';

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Sanitize string inputs recursively
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return validator.escape(validator.trim(obj));
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Email validation helper
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

// Password validation helper
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol' };
  }
  return { valid: true };
};

// MongoDB ObjectId validation
export const validateObjectId = (id: string): boolean => {
  return validator.isMongoId(id);
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail: any) => detail.message);
      throw new CustomError(errors.join(', '), 400);
    }
    next();
  };
};

