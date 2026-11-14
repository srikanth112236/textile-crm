import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { CustomError } from './errorHandler';

// Input sanitization middleware
//
// IMPORTANT: we deliberately do NOT HTML-escape strings here. Running
// `validator.escape` on input corrupts the data that gets persisted: image
// URLs turn into "http:&#x2F;&#x2F;...", apostrophes in descriptions render
// literally ("don&#x27;t"), and search terms get mangled. Escaping belongs at
// render time, where React already escapes text safely.
//
// This middleware only trims surrounding whitespace and strips control
// characters, which is enough to keep stored values clean.
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // eslint-disable-next-line no-control-regex
  const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return validator.trim(obj).replace(CONTROL_CHARS, '');
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

