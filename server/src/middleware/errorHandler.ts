import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Surface client mistakes as 4xx instead of a blanket 500: Mongoose
  // validation/cast failures are bad input, duplicate keys are conflicts.
  const name = (err as any).name;
  const derivedStatus =
    name === 'ValidationError' || name === 'CastError'
      ? 400
      : (err as any).code === 11000
        ? 409
        : undefined;

  const statusCode = err.statusCode || derivedStatus || 500;
  const message = err.message || 'Internal Server Error';

  // Log 500+ server errors in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

