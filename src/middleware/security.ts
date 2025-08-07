import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import config from '../config';

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {return callback(null, true);}
    
    // In development, allow all origins
    if (config.server.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // In production, you should specify allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-frontend-domain.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Không được phép bởi CORS policy'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID'
  ]
};

/**
 * Helmet security configuration
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    // Most API responses should not be cached by browsers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Exception: static data that changes infrequently can be cached
    if (req.path.includes('/industries') || req.path.includes('/sectors')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    // Company data can be cached for a short time
    if (req.path.includes('/companies/') && !req.path.includes('/search')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // For GET requests, limit URL length
  if (req.method === 'GET' && req.url.length > 2048) {
    res.status(414).json({
      success: false,
      error: 'URL quá dài'
    });
    return;
  }

  next();
};

/**
 * IP whitelist middleware (optional, for admin endpoints)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || '';

    // In development, allow all IPs
    if (config.server.nodeEnv === 'development') {
      next();
      return;
    }

    if (!allowedIPs.includes(clientIP)) {
      res.status(403).json({
        success: false,
        error: 'IP không được phép truy cập'
      });
      return;
    }

    next();
  };
};

/**
 * Method restriction middleware
 */
export const allowedMethods = (methods: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      res.status(405).json({
        success: false,
        error: `Phương thức ${req.method} không được hỗ trợ`
      });
      return;
    }
    next();
  };
};
