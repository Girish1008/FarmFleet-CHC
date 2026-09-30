import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Logger]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload parameters',
        details: err.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};
