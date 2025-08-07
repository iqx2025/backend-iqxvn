import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CompanyQueryParams, AppError } from '../types';
import CompanyModel from '../models/Company';
import logger from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().min(1).max(100),
  industry: Joi.string().trim().min(1).max(100),
  sector: Joi.string().trim().min(1).max(100),
  exchange: Joi.string().trim().valid('HOSE', 'HNX', 'UPCOM'),
  sortBy: Joi.string().valid('ticker', 'name_vi', 'market_cap', 'price_close', 'pct_change', 'pe_ratio', 'pb_ratio', 'roe', 'roa', 'created_at', 'updated_at').default('ticker'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

const searchSchema = Joi.object({
  q: Joi.string().required().trim().min(1).max(100),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const tickerSchema = Joi.object({
  ticker: Joi.string().required().trim().min(1).max(20).pattern(/^[A-Z0-9]+$/i),
});

const topListSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
  exchange: Joi.string().trim().valid('HOSE', 'HNX', 'UPCOM'),
});

const industrySchema = Joi.object({
  slug: Joi.string().required().trim().min(1).max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('ticker', 'name_vi', 'market_cap', 'price_close', 'pct_change', 'pe_ratio', 'pb_ratio', 'roe', 'roa').default('ticker'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

const exchangeSchema = Joi.object({
  exchange: Joi.string().required().trim().min(1).max(20),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('ticker', 'name_vi', 'market_cap', 'price_close', 'pct_change', 'pe_ratio', 'pb_ratio', 'roe', 'roa').default('ticker'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

const compareSchema = Joi.object({
  tickers: Joi.string().required().trim().min(1).max(200),
});

const similarSchema = Joi.object({
  ticker: Joi.string().required().trim().min(1).max(20).pattern(/^[A-Z0-9]+$/i),
  limit: Joi.number().integer().min(1).max(20).default(5),
});

export class CompanyController {
  /**
   * GET /api/companies
   * Lấy danh sách tất cả công ty với phân trang
   */
  async getAllCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = querySchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const queryParams: CompanyQueryParams = value;
      
      logger.info('Fetching companies with params:', queryParams);
      
      const result = await CompanyModel.findAll(queryParams);
      
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Lấy danh sách công ty thành công. Tìm thấy ${result.data.length} công ty.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/search?q={query}
   * Tìm kiếm công ty theo tên hoặc ticker
   */
  async searchCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = searchSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số tìm kiếm không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { q: query, limit } = value;
      
      logger.info(`Searching companies with query: "${query}"`);
      
      const companies = await CompanyModel.search(query, limit);
      
      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Tìm kiếm thành công. Tìm thấy ${companies.length} công ty phù hợp.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/:ticker
   * Lấy thông tin chi tiết công ty theo ticker
   */
  async getCompanyByTicker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate ticker parameter
      const { error, value } = tickerSchema.validate(req.params);
      if (error) {
        throw new AppError(`Ticker không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { ticker } = value;
      
      logger.info(`Fetching company details for ticker: ${ticker}`);
      
      const company = await CompanyModel.findByTicker(ticker);
      
      if (!company) {
        throw new AppError(`Không tìm thấy công ty với ticker: ${ticker}`, 404);
      }
      
      const response: ApiResponse<typeof company> = {
        success: true,
        data: company,
        message: `Lấy thông tin công ty ${ticker} thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/industries
   * Lấy danh sách các ngành nghề
   */
  async getIndustries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching industries list');
      
      const industries = await CompanyModel.getIndustries();
      
      const response: ApiResponse<typeof industries> = {
        success: true,
        data: industries,
        message: `Lấy danh sách ngành nghề thành công. Tìm thấy ${industries.length} ngành.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/sectors
   * Lấy danh sách các lĩnh vực kinh tế
   */
  async getSectors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching sectors list');
      
      const sectors = await CompanyModel.getSectors();
      
      const response: ApiResponse<typeof sectors> = {
        success: true,
        data: sectors,
        message: `Lấy danh sách lĩnh vực kinh tế thành công. Tìm thấy ${sectors.length} lĩnh vực.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/top-gainers
   * Lấy danh sách cổ phiếu tăng giá mạnh nhất
   */
  async getTopGainers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = topListSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { limit, exchange } = value;

      logger.info(`Fetching top ${limit} gainers${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT * FROM companies
        WHERE pct_change IS NOT NULL AND pct_change > 0
        ${exchange ? 'AND stock_exchange = $2' : ''}
        ORDER BY pct_change DESC
        LIMIT $1
      `;

      const params = exchange ? [limit, exchange] : [limit];
      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Lấy danh sách ${companies.length} cổ phiếu tăng giá mạnh nhất thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/top-losers
   * Lấy danh sách cổ phiếu giảm giá mạnh nhất
   */
  async getTopLosers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = topListSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { limit, exchange } = value;

      logger.info(`Fetching top ${limit} losers${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT * FROM companies
        WHERE pct_change IS NOT NULL AND pct_change < 0
        ${exchange ? 'AND stock_exchange = $2' : ''}
        ORDER BY pct_change ASC
        LIMIT $1
      `;

      const params = exchange ? [limit, exchange] : [limit];
      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Lấy danh sách ${companies.length} cổ phiếu giảm giá mạnh nhất thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/top-volume
   * Lấy danh sách cổ phiếu có khối lượng giao dịch cao nhất
   */
  async getTopVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = topListSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { limit, exchange } = value;

      logger.info(`Fetching top ${limit} volume${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT * FROM companies
        WHERE volume IS NOT NULL AND volume > 0
        ${exchange ? 'AND stock_exchange = $2' : ''}
        ORDER BY volume DESC
        LIMIT $1
      `;

      const params = exchange ? [limit, exchange] : [limit];
      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Lấy danh sách ${companies.length} cổ phiếu có khối lượng giao dịch cao nhất thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/top-value
   * Lấy danh sách cổ phiếu có giá trị giao dịch cao nhất
   */
  async getTopValue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = topListSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { limit, exchange } = value;

      logger.info(`Fetching top ${limit} value${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT *, (price_close * volume) as trade_value FROM companies
        WHERE price_close IS NOT NULL AND volume IS NOT NULL AND volume > 0
        ${exchange ? 'AND stock_exchange = $2' : ''}
        ORDER BY trade_value DESC
        LIMIT $1
      `;

      const params = exchange ? [limit, exchange] : [limit];
      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Lấy danh sách ${companies.length} cổ phiếu có giá trị giao dịch cao nhất thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/top-market-cap
   * Lấy danh sách công ty có vốn hóa thị trường lớn nhất
   */
  async getTopMarketCap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = topListSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { limit, exchange } = value;

      logger.info(`Fetching top ${limit} market cap${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT * FROM companies
        WHERE market_cap IS NOT NULL AND market_cap > 0
        ${exchange ? 'AND stock_exchange = $2' : ''}
        ORDER BY market_cap DESC
        LIMIT $1
      `;

      const params = exchange ? [limit, exchange] : [limit];
      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Lấy danh sách ${companies.length} công ty có vốn hóa lớn nhất thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/stats
   * Lấy thống kê tổng quan
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching companies statistics');

      // Get basic stats with direct count query
      const [industries, sectors, totalCompaniesResult] = await Promise.all([
        CompanyModel.getIndustries(),
        CompanyModel.getSectors(),
        CompanyModel['pool'].query('SELECT COUNT(*) as total FROM companies')
      ]);

      // Get total companies from direct count
      const totalCompanies = parseInt(totalCompaniesResult.rows[0]?.total || '0', 10);

      // Get exchange distribution
      const exchangeStats = await this.getExchangeStats();

      const stats = {
        totalCompanies,
        totalIndustries: industries.length,
        totalSectors: sectors.length,
        exchanges: exchangeStats,
        topIndustries: industries.slice(0, 10),
        topSectors: sectors.slice(0, 10),
      };

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Lấy thống kê thành công.'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/price-ranges
   * Lấy thống kê phân bố giá cổ phiếu theo khoảng
   */
  async getPriceRanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exchange = req.query.exchange as string;

      logger.info(`Fetching price ranges${exchange ? ` for ${exchange}` : ''}`);

      let query = `
        SELECT
          CASE
            WHEN price_close < 10000 THEN 'Dưới 10,000'
            WHEN price_close < 20000 THEN '10,000 - 20,000'
            WHEN price_close < 50000 THEN '20,000 - 50,000'
            WHEN price_close < 100000 THEN '50,000 - 100,000'
            WHEN price_close < 200000 THEN '100,000 - 200,000'
            ELSE 'Trên 200,000'
          END as price_range,
          COUNT(*) as count
        FROM companies
        WHERE price_close IS NOT NULL
        ${exchange ? 'AND stock_exchange = $1' : ''}
        GROUP BY price_range
        ORDER BY MIN(price_close)
      `;

      const params = exchange ? [exchange] : [];
      const result = await CompanyModel['pool'].query(query, params);

      const response: ApiResponse<typeof result.rows> = {
        success: true,
        data: result.rows,
        message: 'Lấy thống kê phân bố giá thành công.'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/market-overview
   * Lấy tổng quan thị trường theo sàn giao dịch
   */
  async getMarketOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching market overview');

      const query = `
        SELECT
          stock_exchange,
          COUNT(*) as total_companies,
          AVG(pct_change) as avg_change,
          SUM(CASE WHEN pct_change > 0 THEN 1 ELSE 0 END) as gainers,
          SUM(CASE WHEN pct_change < 0 THEN 1 ELSE 0 END) as losers,
          SUM(CASE WHEN pct_change = 0 THEN 1 ELSE 0 END) as unchanged,
          SUM(volume) as total_volume,
          SUM(market_cap) as total_market_cap
        FROM companies
        WHERE stock_exchange IS NOT NULL
        GROUP BY stock_exchange
        ORDER BY total_companies DESC
      `;

      const result = await CompanyModel['pool'].query(query);

      const response: ApiResponse<typeof result.rows> = {
        success: true,
        data: result.rows,
        message: 'Lấy tổng quan thị trường thành công.'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/industry/:slug
   * Lấy danh sách công ty theo ngành nghề
   */
  async getCompaniesByIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = industrySchema.validate({ ...req.params, ...req.query });
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { slug, page, limit, sortBy, sortOrder } = value;

      logger.info(`Fetching companies for industry: ${slug}`);

      const result = await CompanyModel.findAll({
        page,
        limit,
        industry: slug,
        sortBy,
        sortOrder
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Lấy danh sách công ty ngành ${slug} thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/sector/:slug
   * Lấy danh sách công ty theo lĩnh vực kinh tế
   */
  async getCompaniesBySector(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = industrySchema.validate({ ...req.params, ...req.query });
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { slug, page, limit, sortBy, sortOrder } = value;

      logger.info(`Fetching companies for sector: ${slug}`);

      const result = await CompanyModel.findAll({
        page,
        limit,
        sector: slug,
        sortBy,
        sortOrder
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Lấy danh sách công ty lĩnh vực ${slug} thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/exchange/:exchange
   * Lấy danh sách công ty theo sàn giao dịch
   */
  async getCompaniesByExchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = exchangeSchema.validate({ ...req.params, ...req.query });
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { exchange, page, limit, sortBy, sortOrder } = value;

      logger.info(`Fetching companies for exchange: ${exchange}`);

      const result = await CompanyModel.findAll({
        page,
        limit,
        exchange: exchange.toUpperCase(),
        sortBy,
        sortOrder
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Lấy danh sách công ty sàn ${exchange} thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to map database row to Company object
   */
  private mapDbRowToCompany(row: any): any {
    return {
      id: row.id,
      ticker: row.ticker,
      nameVi: row.name_vi,
      nameEn: row.name_en,
      industryActivity: row.industry_activity,
      bcIndustryGroupSlug: row.bc_industry_group_slug,
      stockExchange: row.stock_exchange,
      priceClose: parseFloat(row.price_close) || 0,
      netChange: parseFloat(row.net_change) || 0,
      pctChange: parseFloat(row.pct_change) || 0,
      volume: row.volume,
      marketCap: row.market_cap,
      peRatio: parseFloat(row.pe_ratio) || 0,
      pbRatio: parseFloat(row.pb_ratio) || 0,
      roe: parseFloat(row.roe) || 0,
      roa: parseFloat(row.roa) || 0,
      // Add other fields as needed
    };
  }

  /**
   * Helper method to get exchange statistics
   */
  private async getExchangeStats(): Promise<Array<{exchange: string, count: number}>> {
    try {
      const query = `
        SELECT 
          stock_exchange as exchange,
          COUNT(*) as count
        FROM companies 
        WHERE stock_exchange IS NOT NULL
        GROUP BY stock_exchange
        ORDER BY count DESC
      `;
      
      const result = await CompanyModel['pool'].query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting exchange stats:', error);
      return [];
    }
  }

  /**
   * GET /api/companies/compare
   * So sánh nhiều công ty
   */
  async compareCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = compareSchema.validate(req.query);
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { tickers } = value;
      const tickerList = tickers.split(',').map((t: string) => t.trim().toUpperCase()).slice(0, 10);

      if (tickerList.length === 0) {
        throw new AppError('Danh sách ticker không hợp lệ', 400);
      }

      logger.info(`Comparing companies: ${tickerList.join(', ')}`);

      const query = `
        SELECT * FROM companies
        WHERE ticker = ANY($1)
        ORDER BY ticker
      `;

      const result = await CompanyModel['pool'].query(query, [tickerList]);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `So sánh ${companies.length} công ty thành công.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/similar/:ticker
   * Lấy danh sách công ty tương tự
   */
  async getSimilarCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = similarSchema.validate({ ...req.params, ...req.query });
      if (error) {
        throw new AppError(`Tham số không hợp lệ: ${error.details[0]?.message || 'Unknown validation error'}`, 400);
      }

      const { ticker, limit } = value;

      logger.info(`Finding similar companies for: ${ticker}`);

      // First get the target company
      const targetCompany = await CompanyModel.findByTicker(ticker);
      if (!targetCompany) {
        throw new AppError(`Không tìm thấy công ty với ticker: ${ticker}`, 404);
      }

      // Find similar companies based on industry and market cap range
      const query = `
        SELECT * FROM companies
        WHERE ticker != $1
        AND bc_industry_group_slug = $2
        AND market_cap BETWEEN $3 AND $4
        ORDER BY ABS(market_cap - $5)
        LIMIT $6
      `;

      const marketCapLower = (targetCompany.marketCap || 0) * 0.5;
      const marketCapUpper = (targetCompany.marketCap || 0) * 2;

      const params = [
        ticker,
        targetCompany.bcIndustryGroupSlug,
        marketCapLower,
        marketCapUpper,
        targetCompany.marketCap || 0,
        limit
      ];

      const result = await CompanyModel['pool'].query(query, params);
      const companies = result.rows.map((row: any) => this.mapDbRowToCompany(row));

      const response: ApiResponse<typeof companies> = {
        success: true,
        data: companies,
        message: `Tìm thấy ${companies.length} công ty tương tự ${ticker}.`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new CompanyController();
