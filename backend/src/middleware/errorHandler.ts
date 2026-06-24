import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(err);
};

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational || false;

  console.error(`[Error] ${statusCode} - ${err.message}`, config.isDev ? err.stack : '');

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Internal server error',
    ...(config.isDev && { stack: err.stack }),
  });
};
