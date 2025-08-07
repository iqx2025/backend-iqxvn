import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import cors from 'cors';
import config from './config';
import { testConnection, initializeDatabase } from './config/database';
import logger from './utils/logger';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { httpLogger, requestTimer, requestId } from './middleware/logging';
import { corsOptions, helmetConfig, securityHeaders, requestSizeLimiter, allowedMethods } from './middleware/security';
import { sanitizeInput } from './middleware/validation';

// Import routes
import apiRoutes from './routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Trust proxy (important for rate limiting and IP detection)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmetConfig);
    this.app.use(cors(corsOptions));
    this.app.use(securityHeaders);
    this.app.use(requestSizeLimiter);

    // Logging and monitoring
    this.app.use(requestId);
    this.app.use(requestTimer);
    this.app.use(httpLogger);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Input sanitization
    this.app.use(sanitizeInput);

    // Rate limiting
    this.app.use(generalLimiter);

    // Only allow GET, HEAD, OPTIONS methods for this API
    this.app.use(allowedMethods(['GET', 'HEAD', 'OPTIONS']));
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Chào mừng đến với IQX Vietnamese Stocks API',
        version: '1.0.0',
        documentation: '/api',
        health: '/api/health'
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      logger.info('🔌 Đang kiểm tra kết nối database...');
      const dbConnected = await testConnection();

      if (!dbConnected) {
        throw new Error('Không thể kết nối đến database');
      }

      // Initialize database
      logger.info('🔧 Đang khởi tạo cấu trúc database...');
      await initializeDatabase();

      // Start server
      const port = config.server.port;
      this.app.listen(port, () => {
        logger.info(`🚀 Server đang chạy trên port ${port}`);
        logger.info(`📊 Environment: ${config.server.nodeEnv}`);
        logger.info(`🌐 API URL: http://localhost:${port}/api`);
        logger.info(`❤️ Health check: http://localhost:${port}/api/health`);

        if (config.server.nodeEnv === 'development') {
          logger.info(`📖 API Documentation: http://localhost:${port}/api`);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error: any) {
      logger.error('💥 Lỗi khởi động server:', error.message);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`📴 Nhận tín hiệu ${signal}. Đang tắt server một cách an toàn...`);

      // Close server
      const server = this.app.listen();
      server.close(() => {
        logger.info('✅ Server đã được tắt an toàn');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('⚠️ Buộc tắt server sau 30 giây');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Create and start the application
const app = new App();

// Start server if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app.app;