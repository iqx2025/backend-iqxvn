import request from 'supertest';
import express from 'express';
import { CompanyController } from '../../controllers/CompanyController';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the CompanyModel
jest.mock('../../models/Company', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByTicker: jest.fn(),
    search: jest.fn(),
    getIndustries: jest.fn(),
    getSectors: jest.fn(),
  },
}));

describe('CompanyController', () => {
  let app: express.Application;
  let companyController: CompanyController;
  let mockCompanyModel: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    companyController = new CompanyController();
    mockCompanyModel = require('../../models/Company').default;
    
    // Setup routes
    app.get('/companies', companyController.getAllCompanies.bind(companyController));
    app.get('/companies/search', companyController.searchCompanies.bind(companyController));
    app.get('/companies/industries', companyController.getIndustries.bind(companyController));
    app.get('/companies/sectors', companyController.getSectors.bind(companyController));
    app.get('/companies/:ticker', companyController.getCompanyByTicker.bind(companyController));
    
    // Error handler
    app.use(errorHandler);
    
    jest.clearAllMocks();
  });

  describe('GET /companies', () => {
    it('should return paginated companies list', async () => {
      const mockResponse = {
        data: [
          { id: 1, ticker: 'VIC', nameVi: 'Tập đoàn Vingroup' },
          { id: 2, ticker: 'VCB', nameVi: 'Ngân hàng Vietcombank' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      };

      mockCompanyModel.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(100);
      expect(mockCompanyModel.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'ticker',
        sortOrder: 'asc',
      });
    });

    it('should handle query parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      };

      mockCompanyModel.findAll.mockResolvedValue(mockResponse);

      await request(app)
        .get('/companies?page=2&limit=10&search=VIC&industry=tai-chinh')
        .expect(200);

      expect(mockCompanyModel.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'VIC',
        industry: 'tai-chinh',
        sortBy: 'ticker',
        sortOrder: 'asc',
      });
    });

    it('should validate query parameters', async () => {
      await request(app)
        .get('/companies?page=0')
        .expect(400);

      await request(app)
        .get('/companies?limit=101')
        .expect(400);
    });
  });

  describe('GET /companies/search', () => {
    it('should return search results', async () => {
      const mockResults = [
        { id: 1, ticker: 'VIC', nameVi: 'Tập đoàn Vingroup' },
      ];

      mockCompanyModel.search.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/companies/search?q=VIC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ticker).toBe('VIC');
      expect(mockCompanyModel.search).toHaveBeenCalledWith('VIC', 10);
    });

    it('should require search query', async () => {
      await request(app)
        .get('/companies/search')
        .expect(400);
    });

    it('should validate search query length', async () => {
      await request(app)
        .get('/companies/search?q=')
        .expect(400);

      const longQuery = 'a'.repeat(101);
      await request(app)
        .get(`/companies/search?q=${longQuery}`)
        .expect(400);
    });
  });

  describe('GET /companies/:ticker', () => {
    it('should return company details', async () => {
      const mockCompany = {
        id: 1,
        ticker: 'VIC',
        nameVi: 'Tập đoàn Vingroup',
        marketCap: 1000000000,
      };

      mockCompanyModel.findByTicker.mockResolvedValue(mockCompany);

      const response = await request(app)
        .get('/companies/VIC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ticker).toBe('VIC');
      expect(mockCompanyModel.findByTicker).toHaveBeenCalledWith('VIC');
    });

    it('should return 404 for non-existent ticker', async () => {
      mockCompanyModel.findByTicker.mockResolvedValue(null);

      await request(app)
        .get('/companies/NONEXISTENT')
        .expect(404);
    });

    it('should validate ticker format', async () => {
      await request(app)
        .get('/companies/invalid-ticker!')
        .expect(400);
    });
  });

  describe('GET /companies/industries', () => {
    it('should return industries list', async () => {
      const mockIndustries = [
        { slug: 'tai-chinh', name: 'Tài chính', count: 50 },
        { slug: 'bat-dong-san', name: 'Bất động sản', count: 30 },
      ];

      mockCompanyModel.getIndustries.mockResolvedValue(mockIndustries);

      const response = await request(app)
        .get('/companies/industries')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].slug).toBe('tai-chinh');
    });
  });

  describe('GET /companies/sectors', () => {
    it('should return sectors list', async () => {
      const mockSectors = [
        { slug: 'tai-chinh', name: 'Tài chính', count: 80 },
        { slug: 'cong-nghiep', name: 'Công nghiệp', count: 60 },
      ];

      mockCompanyModel.getSectors.mockResolvedValue(mockSectors);

      const response = await request(app)
        .get('/companies/sectors')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].slug).toBe('tai-chinh');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      mockCompanyModel.findAll.mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get('/companies')
        .expect(500);
    });

    it('should handle validation errors', async () => {
      await request(app)
        .get('/companies?page=invalid')
        .expect(400);
    });
  });
});
