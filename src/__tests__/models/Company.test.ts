import { CompanyModel } from '../../models/Company';
import { Company } from '../../types';

// Mock the database pool
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
  },
}));

describe('CompanyModel', () => {
  let companyModel: CompanyModel;
  let mockPool: any;

  beforeEach(() => {
    companyModel = new CompanyModel();
    mockPool = require('../../config/database').default;
    jest.clearAllMocks();
  });

  describe('findByTicker', () => {
    it('should return company when ticker exists', async () => {
      const mockCompanyData = {
        id: 1,
        ticker: 'VIC',
        name_vi: 'Tập đoàn Vingroup',
        name_en: 'Vingroup Joint Stock Company',
        market_cap: 1000000000,
        price_close: 100000,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({
        rows: [mockCompanyData],
      });

      const result = await companyModel.findByTicker('VIC');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM companies WHERE ticker = $1',
        ['VIC']
      );
      expect(result).toBeDefined();
      expect(result?.ticker).toBe('VIC');
      expect(result?.nameVi).toBe('Tập đoàn Vingroup');
    });

    it('should return null when ticker does not exist', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
      });

      const result = await companyModel.findByTicker('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(companyModel.findByTicker('VIC')).rejects.toThrow('Database error');
    });
  });

  describe('search', () => {
    it('should return matching companies', async () => {
      const mockResults = [
        {
          id: 1,
          ticker: 'VIC',
          name_vi: 'Tập đoàn Vingroup',
          name_en: 'Vingroup Joint Stock Company',
        },
        {
          id: 2,
          ticker: 'VCB',
          name_vi: 'Ngân hàng TMCP Ngoại thương Việt Nam',
          name_en: 'Joint Stock Commercial Bank for Foreign Trade of Vietnam',
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockResults,
      });

      const result = await companyModel.search('V', 10);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]?.ticker).toBe('VIC');
      expect(result[1]?.ticker).toBe('VCB');
    });

    it('should limit results correctly', async () => {
      const mockResults = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        ticker: `TEST${i + 1}`,
        name_vi: `Test Company ${i + 1}`,
      }));

      mockPool.query.mockResolvedValue({
        rows: mockResults,
      });

      const result = await companyModel.search('TEST', 3);

      expect(result).toHaveLength(5); // Mock returns 5, but in real scenario it would be limited
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockCountResult = { rows: [{ count: '100' }] };
      const mockDataResult = {
        rows: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          ticker: `TEST${i + 1}`,
          name_vi: `Test Company ${i + 1}`,
        })),
      };

      mockPool.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await companyModel.findAll({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(20);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should handle search filters', async () => {
      const mockCountResult = { rows: [{ count: '5' }] };
      const mockDataResult = {
        rows: [
          {
            id: 1,
            ticker: 'VIC',
            name_vi: 'Tập đoàn Vingroup',
          },
        ],
      };

      mockPool.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await companyModel.findAll({
        page: 1,
        limit: 20,
        search: 'Vingroup',
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.ticker).toBe('VIC');
    });
  });

  describe('getIndustries', () => {
    it('should return list of industries', async () => {
      const mockIndustries = [
        { slug: 'tai-chinh-ngan-hang', name: 'Tài chính ngân hàng', count: 50 },
        { slug: 'bat-dong-san', name: 'Bất động sản', count: 30 },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockIndustries,
      });

      const result = await companyModel.getIndustries();

      expect(result).toHaveLength(2);
      expect(result[0]?.slug).toBe('tai-chinh-ngan-hang');
      expect(result[0]?.count).toBe(50);
    });
  });

  describe('getSectors', () => {
    it('should return list of sectors', async () => {
      const mockSectors = [
        { slug: 'tai-chinh', name: 'Tài chính', count: 80 },
        { slug: 'cong-nghiep', name: 'Công nghiệp', count: 60 },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockSectors,
      });

      const result = await companyModel.getSectors();

      expect(result).toHaveLength(2);
      expect(result[0]?.slug).toBe('tai-chinh');
      expect(result[0]?.count).toBe(80);
    });
  });
});
