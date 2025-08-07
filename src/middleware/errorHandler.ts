import { Request, Response, NextFunction } from 'express';
import { ApiError, AppError } from '../types';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as ApiError;
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Tài nguyên không tìm thấy';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const message = 'Dữ liệu trùng lặp';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // PostgreSQL errors
  if ((err as any).code) {
    switch ((err as any).code) {
      case '23505': // Unique violation
        error = new AppError('Dữ liệu đã tồn tại', 409);
        break;
      case '23503': // Foreign key violation
        error = new AppError('Dữ liệu tham chiếu không hợp lệ', 400);
        break;
      case '23502': // Not null violation
        error = new AppError('Thiếu dữ liệu bắt buộc', 400);
        break;
      case '42P01': // Undefined table
        error = new AppError('Lỗi cấu trúc database', 500);
        break;
      default:
        if (config.server.nodeEnv === 'development') {
          error = new AppError(`Database error: ${err.message}`, 500);
        } else {
          error = new AppError('Lỗi database', 500);
        }
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token không hợp lệ';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token đã hết hạn';
    error = new AppError(message, 401);
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  // Send error response
  const response = {
    success: false,
    error: error.message,
    ...(config.server.nodeEnv === 'development' && { stack: err.stack })
  };

  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 errors
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Không tìm thấy route ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
