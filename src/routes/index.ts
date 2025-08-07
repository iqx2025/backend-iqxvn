import { Router, Request, Response } from 'express';
import companiesRouter from './companies';
import { ApiResponse } from '../types';
import SimplizeService from '../services/SimplizeService';
import { testConnection } from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [dbHealth, apiHealth] = await Promise.all([
      testConnection(),
      SimplizeService.healthCheck()
    ]);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        simplizeApi: apiHealth ? 'healthy' : 'unhealthy'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    const statusCode = dbHealth && apiHealth ? 200 : 503;
    
    res.status(statusCode).json({
      success: statusCode === 200,
      data: health,
      message: statusCode === 200 ? 'Hệ thống hoạt động bình thường' : 'Một số dịch vụ gặp sự cố'
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi kiểm tra sức khỏe hệ thống',
      message: error.message
    });
  }
});

// API info endpoint
router.get('/', (req: Request, res: Response) => {
  const apiInfo = {
    name: 'IQX Vietnamese Stocks API',
    description: 'API quản lý dữ liệu cổ phiếu Việt Nam từ Simplize.vn',
    version: '1.0.0',
    endpoints: {
      companies: {
        'GET /api/companies': 'Lấy danh sách công ty với phân trang',
        'GET /api/companies/search?q={query}': 'Tìm kiếm công ty',
        'GET /api/companies/{ticker}': 'Lấy thông tin công ty theo ticker',
        'GET /api/companies/industries': 'Lấy danh sách ngành nghề',
        'GET /api/companies/sectors': 'Lấy danh sách lĩnh vực kinh tế',
        'GET /api/companies/stats': 'Lấy thống kê tổng quan'
      },
      system: {
        'GET /api/health': 'Kiểm tra sức khỏe hệ thống',
        'GET /api/': 'Thông tin API'
      }
    },
    documentation: 'https://github.com/your-repo/be-iqx',
    contact: 'your-email@example.com'
  };

  const response: ApiResponse<typeof apiInfo> = {
    success: true,
    data: apiInfo,
    message: 'Chào mừng đến với IQX Vietnamese Stocks API'
  };

  res.json(response);
});

// Mount routes
router.use('/companies', companiesRouter);

export default router;
