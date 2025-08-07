import { Pool, QueryResult } from 'pg';
import { Company, CompanyQueryParams, PaginatedResponse } from '../types';
import pool from '../config/database';
import logger from '../utils/logger';

export class CompanyModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Tạo hoặc cập nhật thông tin công ty
   */
  async upsert(companyData: Company): Promise<Company> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO companies (
          ticker, name_vi, name_en, industry_activity, bc_industry_group_id,
          bc_industry_group_slug, bc_industry_group_code, bc_industry_group_type,
          bc_economic_sector_id, bc_economic_sector_slug, bc_economic_sector_name,
          website, main_service, business_line, business_strategy, business_risk,
          business_overall, detail_info, market_cap, outstanding_shares_value,
          analysis_updated, stock_exchange, price_close, net_change, pct_change,
          price_reference, price_open, price_floor, price_low, price_high,
          price_ceiling, price_timestamp, price_type, volume_10d_avg, volume,
          pe_ratio, pb_ratio, eps_ratio, book_value, free_float_rate,
          valuation_point, growth_point, pass_performance_point, financial_health_point,
          dividend_point, image_url, dividend_yield_current, beta_5y,
          price_pct_chg_7d, price_pct_chg_30d, price_pct_chg_ytd, price_pct_chg_1y,
          price_pct_chg_3y, price_pct_chg_5y, company_quality, overall_risk_level,
          quality_valuation, ta_signal_1d, watchlist_count, roe, roa,
          revenue_5y_growth, net_income_5y_growth, revenue_ltm_growth,
          net_income_ltm_growth, revenue_growth_qoq, net_income_growth_qoq,
          type, country
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
          $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
          $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69
        )
        ON CONFLICT (ticker) DO UPDATE SET
          name_vi = EXCLUDED.name_vi,
          name_en = EXCLUDED.name_en,
          industry_activity = EXCLUDED.industry_activity,
          bc_industry_group_id = EXCLUDED.bc_industry_group_id,
          bc_industry_group_slug = EXCLUDED.bc_industry_group_slug,
          bc_industry_group_code = EXCLUDED.bc_industry_group_code,
          bc_industry_group_type = EXCLUDED.bc_industry_group_type,
          bc_economic_sector_id = EXCLUDED.bc_economic_sector_id,
          bc_economic_sector_slug = EXCLUDED.bc_economic_sector_slug,
          bc_economic_sector_name = EXCLUDED.bc_economic_sector_name,
          website = EXCLUDED.website,
          main_service = EXCLUDED.main_service,
          business_line = EXCLUDED.business_line,
          business_strategy = EXCLUDED.business_strategy,
          business_risk = EXCLUDED.business_risk,
          business_overall = EXCLUDED.business_overall,
          detail_info = EXCLUDED.detail_info,
          market_cap = EXCLUDED.market_cap,
          outstanding_shares_value = EXCLUDED.outstanding_shares_value,
          analysis_updated = EXCLUDED.analysis_updated,
          stock_exchange = EXCLUDED.stock_exchange,
          price_close = EXCLUDED.price_close,
          net_change = EXCLUDED.net_change,
          pct_change = EXCLUDED.pct_change,
          price_reference = EXCLUDED.price_reference,
          price_open = EXCLUDED.price_open,
          price_floor = EXCLUDED.price_floor,
          price_low = EXCLUDED.price_low,
          price_high = EXCLUDED.price_high,
          price_ceiling = EXCLUDED.price_ceiling,
          price_timestamp = EXCLUDED.price_timestamp,
          price_type = EXCLUDED.price_type,
          volume_10d_avg = EXCLUDED.volume_10d_avg,
          volume = EXCLUDED.volume,
          pe_ratio = EXCLUDED.pe_ratio,
          pb_ratio = EXCLUDED.pb_ratio,
          eps_ratio = EXCLUDED.eps_ratio,
          book_value = EXCLUDED.book_value,
          free_float_rate = EXCLUDED.free_float_rate,
          valuation_point = EXCLUDED.valuation_point,
          growth_point = EXCLUDED.growth_point,
          pass_performance_point = EXCLUDED.pass_performance_point,
          financial_health_point = EXCLUDED.financial_health_point,
          dividend_point = EXCLUDED.dividend_point,
          image_url = EXCLUDED.image_url,
          dividend_yield_current = EXCLUDED.dividend_yield_current,
          beta_5y = EXCLUDED.beta_5y,
          price_pct_chg_7d = EXCLUDED.price_pct_chg_7d,
          price_pct_chg_30d = EXCLUDED.price_pct_chg_30d,
          price_pct_chg_ytd = EXCLUDED.price_pct_chg_ytd,
          price_pct_chg_1y = EXCLUDED.price_pct_chg_1y,
          price_pct_chg_3y = EXCLUDED.price_pct_chg_3y,
          price_pct_chg_5y = EXCLUDED.price_pct_chg_5y,
          company_quality = EXCLUDED.company_quality,
          overall_risk_level = EXCLUDED.overall_risk_level,
          quality_valuation = EXCLUDED.quality_valuation,
          ta_signal_1d = EXCLUDED.ta_signal_1d,
          watchlist_count = EXCLUDED.watchlist_count,
          roe = EXCLUDED.roe,
          roa = EXCLUDED.roa,
          revenue_5y_growth = EXCLUDED.revenue_5y_growth,
          net_income_5y_growth = EXCLUDED.net_income_5y_growth,
          revenue_ltm_growth = EXCLUDED.revenue_ltm_growth,
          net_income_ltm_growth = EXCLUDED.net_income_ltm_growth,
          revenue_growth_qoq = EXCLUDED.revenue_growth_qoq,
          net_income_growth_qoq = EXCLUDED.net_income_growth_qoq,
          type = EXCLUDED.type,
          country = EXCLUDED.country,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [
        companyData.ticker,
        companyData.nameVi,
        companyData.nameEn,
        companyData.industryActivity,
        companyData.bcIndustryGroupId,
        companyData.bcIndustryGroupSlug,
        companyData.bcIndustryGroupCode,
        companyData.bcIndustryGroupType,
        companyData.bcEconomicSectorId,
        companyData.bcEconomicSectorSlug,
        companyData.bcEconomicSectorName,
        companyData.website,
        companyData.mainService,
        companyData.businessLine,
        companyData.businessStrategy,
        companyData.businessRisk,
        companyData.businessOverall,
        companyData.detailInfo,
        companyData.marketCap,
        companyData.outstandingSharesValue,
        companyData.analysisUpdated,
        companyData.stockExchange,
        companyData.priceClose,
        companyData.netChange,
        companyData.pctChange,
        companyData.priceReference,
        companyData.priceOpen,
        companyData.priceFloor,
        companyData.priceLow,
        companyData.priceHigh,
        companyData.priceCeiling,
        companyData.priceTimestamp,
        companyData.priceType,
        companyData.volume10dAvg,
        companyData.volume,
        companyData.peRatio,
        companyData.pbRatio,
        companyData.epsRatio,
        companyData.bookValue,
        companyData.freeFloatRate,
        companyData.valuationPoint,
        companyData.growthPoint,
        companyData.passPerformancePoint,
        companyData.financialHealthPoint,
        companyData.dividendPoint,
        companyData.imageUrl,
        companyData.dividendYieldCurrent,
        companyData.beta5y,
        companyData.pricePctChg7d,
        companyData.pricePctChg30d,
        companyData.pricePctChgYtd,
        companyData.pricePctChg1y,
        companyData.pricePctChg3y,
        companyData.pricePctChg5y,
        companyData.companyQuality,
        companyData.overallRiskLevel,
        companyData.qualityValuation,
        companyData.taSignal1d,
        companyData.watchlistCount,
        companyData.roe,
        companyData.roa,
        companyData.revenue5yGrowth,
        companyData.netIncome5yGrowth,
        companyData.revenueLtmGrowth,
        companyData.netIncomeLtmGrowth,
        companyData.revenueGrowthQoq,
        companyData.netIncomeGrowthQoq,
        companyData.type,
        companyData.country,
      ];

      const result: QueryResult<Company> = await client.query(query, values);
      return this.mapDbRowToCompany(result.rows[0]);
    } catch (error) {
      logger.error('Error upserting company:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lấy thông tin công ty theo ticker
   */
  async findByTicker(ticker: string): Promise<Company | null> {
    try {
      const query = 'SELECT * FROM companies WHERE ticker = $1';
      const result: QueryResult = await this.pool.query(query, [ticker.toUpperCase()]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDbRowToCompany(result.rows[0]);
    } catch (error) {
      logger.error('Error finding company by ticker:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách công ty với phân trang và tìm kiếm
   */
  async findAll(params: CompanyQueryParams): Promise<PaginatedResponse<Company>> {
    const {
      page = 1,
      limit = 20,
      search,
      industry,
      sector,
      exchange,
      sortBy = 'ticker',
      sortOrder = 'asc'
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (search) {
      conditions.push(`(
        ticker ILIKE $${paramIndex} OR
        name_vi ILIKE $${paramIndex} OR
        name_en ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (industry) {
      conditions.push(`bc_industry_group_slug = $${paramIndex}`);
      values.push(industry);
      paramIndex++;
    }

    if (sector) {
      conditions.push(`bc_economic_sector_slug = $${paramIndex}`);
      values.push(sector);
      paramIndex++;
    }

    if (exchange) {
      conditions.push(`stock_exchange = $${paramIndex}`);
      values.push(exchange.toUpperCase());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = [
      'ticker', 'name_vi', 'market_cap', 'price_close', 'pct_change',
      'pe_ratio', 'pb_ratio', 'roe', 'roa', 'created_at', 'updated_at'
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'ticker';
    const safeSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM companies ${whereClause}`;
      const countResult = await this.pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated data
      const dataQuery = `
        SELECT * FROM companies
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(limit, offset);

      const dataResult: QueryResult = await this.pool.query(dataQuery, values);
      const companies = dataResult.rows.map(row => this.mapDbRowToCompany(row));

      return {
        data: companies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding companies:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm công ty theo tên hoặc ticker
   */
  async search(query: string, limit: number = 10): Promise<Company[]> {
    try {
      const searchQuery = `
        SELECT * FROM companies
        WHERE ticker ILIKE $1 OR name_vi ILIKE $1 OR name_en ILIKE $1
        ORDER BY
          CASE
            WHEN ticker ILIKE $1 THEN 1
            WHEN name_vi ILIKE $2 THEN 2
            ELSE 3
          END,
          ticker
        LIMIT $3
      `;

      const searchTerm = `%${query}%`;
      const exactTerm = `${query}%`;

      const result: QueryResult = await this.pool.query(searchQuery, [searchTerm, exactTerm, limit]);
      return result.rows.map(row => this.mapDbRowToCompany(row));
    } catch (error) {
      logger.error('Error searching companies:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách ngành nghề
   */
  async getIndustries(): Promise<Array<{slug: string, name: string, count: number}>> {
    try {
      const query = `
        SELECT
          bc_industry_group_slug as slug,
          bc_industry_group_code as name,
          COUNT(*) as count
        FROM companies
        WHERE bc_industry_group_slug IS NOT NULL
        GROUP BY bc_industry_group_slug, bc_industry_group_code
        ORDER BY count DESC, bc_industry_group_slug
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting industries:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách lĩnh vực kinh tế
   */
  async getSectors(): Promise<Array<{slug: string, name: string, count: number}>> {
    try {
      const query = `
        SELECT
          bc_economic_sector_slug as slug,
          bc_economic_sector_name as name,
          COUNT(*) as count
        FROM companies
        WHERE bc_economic_sector_slug IS NOT NULL
        GROUP BY bc_economic_sector_slug, bc_economic_sector_name
        ORDER BY count DESC, bc_economic_sector_slug
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting sectors:', error);
      throw error;
    }
  }

  /**
   * Map database row to Company object
   */
  private mapDbRowToCompany(row: any): Company {
    return {
      id: row.id,
      ticker: row.ticker,
      nameVi: row.name_vi,
      nameEn: row.name_en,
      industryActivity: row.industry_activity,
      bcIndustryGroupId: row.bc_industry_group_id,
      bcIndustryGroupSlug: row.bc_industry_group_slug,
      bcIndustryGroupCode: row.bc_industry_group_code,
      bcIndustryGroupType: row.bc_industry_group_type,
      bcEconomicSectorId: row.bc_economic_sector_id,
      bcEconomicSectorSlug: row.bc_economic_sector_slug,
      bcEconomicSectorName: row.bc_economic_sector_name,
      website: row.website,
      mainService: row.main_service,
      businessLine: row.business_line,
      businessStrategy: row.business_strategy,
      businessRisk: row.business_risk,
      businessOverall: row.business_overall,
      detailInfo: row.detail_info,
      marketCap: row.market_cap,
      outstandingSharesValue: row.outstanding_shares_value,
      analysisUpdated: row.analysis_updated,
      stockExchange: row.stock_exchange,
      priceClose: parseFloat(row.price_close) || 0,
      netChange: parseFloat(row.net_change) || 0,
      pctChange: parseFloat(row.pct_change) || 0,
      priceReference: parseFloat(row.price_reference) || 0,
      priceOpen: parseFloat(row.price_open) || 0,
      priceFloor: parseFloat(row.price_floor) || 0,
      priceLow: parseFloat(row.price_low) || 0,
      priceHigh: parseFloat(row.price_high) || 0,
      priceCeiling: parseFloat(row.price_ceiling) || 0,
      priceTimestamp: row.price_timestamp,
      priceType: row.price_type,
      volume10dAvg: row.volume_10d_avg,
      volume: row.volume,
      peRatio: parseFloat(row.pe_ratio) || 0,
      pbRatio: parseFloat(row.pb_ratio) || 0,
      epsRatio: parseFloat(row.eps_ratio) || 0,
      bookValue: parseFloat(row.book_value) || 0,
      freeFloatRate: parseFloat(row.free_float_rate) || 0,
      valuationPoint: row.valuation_point,
      growthPoint: row.growth_point,
      passPerformancePoint: row.pass_performance_point,
      financialHealthPoint: row.financial_health_point,
      dividendPoint: row.dividend_point,
      imageUrl: row.image_url,
      dividendYieldCurrent: parseFloat(row.dividend_yield_current) || 0,
      beta5y: parseFloat(row.beta_5y) || 0,
      pricePctChg7d: parseFloat(row.price_pct_chg_7d) || 0,
      pricePctChg30d: parseFloat(row.price_pct_chg_30d) || 0,
      pricePctChgYtd: parseFloat(row.price_pct_chg_ytd) || 0,
      pricePctChg1y: parseFloat(row.price_pct_chg_1y) || 0,
      pricePctChg3y: parseFloat(row.price_pct_chg_3y) || 0,
      pricePctChg5y: parseFloat(row.price_pct_chg_5y) || 0,
      companyQuality: row.company_quality,
      overallRiskLevel: row.overall_risk_level,
      qualityValuation: row.quality_valuation,
      taSignal1d: row.ta_signal_1d,
      watchlistCount: row.watchlist_count,
      roe: parseFloat(row.roe) || 0,
      roa: parseFloat(row.roa) || 0,
      revenue5yGrowth: parseFloat(row.revenue_5y_growth) || 0,
      netIncome5yGrowth: parseFloat(row.net_income_5y_growth) || 0,
      revenueLtmGrowth: parseFloat(row.revenue_ltm_growth) || 0,
      netIncomeLtmGrowth: parseFloat(row.net_income_ltm_growth) || 0,
      revenueGrowthQoq: parseFloat(row.revenue_growth_qoq) || 0,
      netIncomeGrowthQoq: parseFloat(row.net_income_growth_qoq) || 0,
      type: row.type,
      country: row.country,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new CompanyModel();
