import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import config from '../config';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for request ID (if you implement it)
morgan.token('request-id', (req: Request) => {
  return (req as any).requestId || '-';
});

// Custom token for user agent
morgan.token('user-agent-short', (req: Request) => {
  const userAgent = req.get('User-Agent') || '';
  // Shorten user agent for cleaner logs
  if (userAgent.includes('Chrome')) {return 'Chrome';}
  if (userAgent.includes('Firefox')) {return 'Firefox';}
  if (userAgent.includes('Safari')) {return 'Safari';}
  if (userAgent.includes('Edge')) {return 'Edge';}
  if (userAgent.includes('curl')) {return 'curl';}
  if (userAgent.includes('Postman')) {return 'Postman';}
  return 'Other';
});

// Define log format based on environment
const logFormat = config.server.nodeEnv === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent-short" :response-time ms'
  : ':method :url :status :response-time ms - :res[content-length] bytes';

// Create morgan middleware
export const httpLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      // Remove trailing newline
      const cleanMessage = message.trim();
      
      // Parse the log message to determine log level
      if (cleanMessage.includes(' 4') || cleanMessage.includes(' 5')) {
        // 4xx or 5xx status codes
        logger.warn(cleanMessage);
      } else {
        logger.info(cleanMessage);
      }
    }
  },
  skip: (req: Request, res: Response) => {
    // Skip logging for health checks in production
    if (config.server.nodeEnv === 'production' && req.path === '/api/health') {
      return true;
    }
    return false;
  }
});

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: Function) => {
  const start = Date.now();

  // Set the header before the response is sent
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', duration);
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`, {
        method: req.method,
        url: req.url,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Request ID middleware (optional)
export const requestId = (req: Request, res: Response, next: Function) => {
  const id = Math.random().toString(36).substr(2, 9);
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};
