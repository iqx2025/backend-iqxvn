import rateLimit from 'express-rate-limit';
import config from '../config';
import logger from '../utils/logger';

/**
 * General rate limiter for all API endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) // minutes
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60)
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

/**
 * Stricter rate limiter for search endpoints
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau 1 phút.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for IP: ${req.ip}, query: ${req.query.q}`);
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau 1 phút.',
      retryAfter: 1
    });
  }
});

/**
 * More lenient rate limiter for company details
 */
export const companyDetailsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute for company details
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu chi tiết công ty, vui lòng thử lại sau.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Company details rate limit exceeded for IP: ${req.ip}, ticker: ${req.params.ticker}`);
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu chi tiết công ty, vui lòng thử lại sau.',
      retryAfter: 1
    });
  }
});
