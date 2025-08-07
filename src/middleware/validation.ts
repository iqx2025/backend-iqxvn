import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../types';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(`Dữ liệu không hợp lệ: ${errorMessage}`, 400));
    }

    // Replace the original property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize params
  if (req.params) {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }

  next();
};

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate ticker format
 */
export const validateTicker = (req: Request, res: Response, next: NextFunction) => {
  const { ticker } = req.params;
  
  if (!ticker) {
    return next(new AppError('Ticker là bắt buộc', 400));
  }

  // Vietnamese stock tickers are typically 3-10 characters, alphanumeric
  const tickerRegex = /^[A-Z0-9]{1,10}$/i;
  
  if (!tickerRegex.test(ticker)) {
    return next(new AppError('Ticker không hợp lệ. Ticker phải là 1-10 ký tự chữ và số.', 400));
  }

  // Convert to uppercase for consistency
  req.params.ticker = ticker.toUpperCase();
  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new AppError('Trang phải là số nguyên dương', 400));
    }
    req.query.page = pageNum.toString();
  }

  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new AppError('Giới hạn phải là số nguyên từ 1 đến 100', 400));
    }
    req.query.limit = limitNum.toString();
  }

  next();
};

/**
 * Validate search query
 */
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return next(new AppError('Từ khóa tìm kiếm là bắt buộc', 400));
  }

  const query = q.trim();
  
  if (query.length < 1) {
    return next(new AppError('Từ khóa tìm kiếm không được để trống', 400));
  }

  if (query.length > 100) {
    return next(new AppError('Từ khóa tìm kiếm không được quá 100 ký tự', 400));
  }

  // Sanitize the search query
  req.query.q = sanitizeString(query);
  next();
};
