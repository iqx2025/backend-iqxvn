import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SimplizeApiResponse, CompanySummary, Company } from '../types';
import config from '../config';
import logger from '../utils/logger';

export class SimplizeService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private requestDelay: number;
  private maxRetries: number;

  constructor() {
    this.baseUrl = config.simplize.baseUrl;
    this.requestDelay = config.simplize.requestDelay;
    this.maxRetries = config.simplize.maxRetries;

    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug(`Simplize API response: ${response.status} for ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`Simplize API error: ${error.message} for ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Lấy thông tin công ty từ Simplize API
   */
  async fetchCompanyData(ticker: string): Promise<Company | null> {
    const url = `${this.baseUrl}/co-phieu/${ticker}/ho-so-doanh-nghiep.json?ticker=${ticker}`;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Fetching data for ${ticker} (attempt ${attempt}/${this.maxRetries})`);
        
        const response: AxiosResponse<SimplizeApiResponse> = await this.axiosInstance.get(url);
        
        if (response.data && response.data.pageProps && response.data.pageProps.summary) {
          const companyData = this.transformSimplizeData(response.data.pageProps.summary);
          logger.info(`Successfully fetched data for ${ticker}`);
          return companyData;
        } else {
          logger.warn(`Invalid response structure for ${ticker}`);
          return null;
        }
      } catch (error: any) {
        logger.error(`Attempt ${attempt} failed for ${ticker}:`, error.message);
        
        if (attempt === this.maxRetries) {
          logger.error(`All attempts failed for ${ticker}`);
          return null;
        }
        
        // Wait before retry
        await this.delay(this.requestDelay * attempt);
      }
    }
    
    return null;
  }

  /**
   * Lấy dữ liệu cho nhiều ticker
   */
  async fetchMultipleCompanies(tickers: string[]): Promise<Company[]> {
    const results: Company[] = [];
    const total = tickers.length;

    logger.info(`Starting to fetch data for ${total} companies`);

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      if (!ticker) {continue;} // Skip undefined/empty tickers

      const progress = ((i + 1) / total * 100).toFixed(1);

      logger.info(`Processing ${ticker} (${i + 1}/${total} - ${progress}%)`);

      try {
        const companyData = await this.fetchCompanyData(ticker);

        if (companyData) {
          results.push(companyData);
          logger.info(`✓ Successfully processed ${ticker}`);
        } else {
          logger.warn(`✗ Failed to process ${ticker}`);
        }
      } catch (error: any) {
        logger.error(`✗ Error processing ${ticker}:`, error.message);
      }

      // Add delay between requests to avoid rate limiting
      if (i < tickers.length - 1) {
        await this.delay(this.requestDelay);
      }
    }

    logger.info(`Completed fetching data. Successfully processed ${results.length}/${total} companies`);
    return results;
  }

  /**
   * Transform Simplize API data to our Company model
   */
  private transformSimplizeData(summary: CompanySummary): Company {
    // Parse analysis updated date
    let analysisUpdated: Date | undefined;
    if (summary.analysisUpdated) {
      try {
        // Handle different date formats from Simplize
        const dateStr = summary.analysisUpdated;
        if (dateStr.includes('/')) {
          // Format: DD/MM/YYYY
          const dateParts = dateStr.split('/');
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];

          if (day && month && year) {
            analysisUpdated = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        } else {
          analysisUpdated = new Date(dateStr);
        }
      } catch (error) {
        logger.warn(`Failed to parse analysis date: ${summary.analysisUpdated}`);
      }
    }

    // Parse price timestamp
    let priceTimestamp: Date | undefined;
    if (summary.priceTimeStamp) {
      try {
        // Format: DD/MM/YYYY HH:mm:ss
        const parts = summary.priceTimeStamp.split(' ');
        const datePart = parts[0];
        const timePart = parts[1];

        if (datePart && timePart) {
          const dateParts = datePart.split('/');
          const timeParts = timePart.split(':');

          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];
          const hour = timeParts[0];
          const minute = timeParts[1];
          const second = timeParts[2];

          if (day && month && year && hour && minute && second) {
            priceTimestamp = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute),
              parseInt(second)
            );
          }
        }
      } catch (error) {
        logger.warn(`Failed to parse price timestamp: ${summary.priceTimeStamp}`);
      }
    }

    return {
      ticker: summary.ticker,
      nameVi: summary.nameVi || summary.name,
      nameEn: summary.nameEn,
      industryActivity: summary.industryActivity,
      bcIndustryGroupId: summary.bcIndustryGroupId,
      bcIndustryGroupSlug: summary.bcIndustryGroupSlug,
      bcIndustryGroupCode: summary.bcIndustryGroupCode,
      bcIndustryGroupType: summary.bcIndustryGroupType,
      bcEconomicSectorId: summary.bcEconomicSectorId,
      bcEconomicSectorSlug: summary.bcEconomicSectorSlug,
      bcEconomicSectorName: summary.bcEconomicSectorName,
      website: summary.website,
      mainService: summary.mainService,
      businessLine: summary.businessLine,
      businessStrategy: summary.businessStrategy,
      businessRisk: summary.businessRisk,
      businessOverall: summary.businessOverall,
      detailInfo: summary.detailInfo,
      marketCap: summary.marketCap,
      outstandingSharesValue: summary.outstandingSharesValue,
      analysisUpdated,
      stockExchange: summary.stockExchange,
      priceClose: summary.priceClose,
      netChange: summary.netChange,
      pctChange: summary.pctChange,
      priceReference: summary.priceReferrance, // Note: API has typo "priceReferrance"
      priceOpen: summary.priceOpen,
      priceFloor: summary.priceFloor,
      priceLow: summary.priceLow,
      priceHigh: summary.priceHigh,
      priceCeiling: summary.priceCeiling,
      priceTimestamp,
      priceType: summary.priceType,
      volume10dAvg: summary.volume10dAvg,
      volume: summary.volume,
      peRatio: summary.peRatio,
      pbRatio: summary.pbRatio,
      epsRatio: summary.epsRatio,
      bookValue: summary.bookValue,
      freeFloatRate: summary.freeFloatRate,
      valuationPoint: summary.valuationPoint,
      growthPoint: summary.growthPoint,
      passPerformancePoint: summary.passPerformancePoint,
      financialHealthPoint: summary.financialHealthPoint,
      dividendPoint: summary.dividendPoint,
      imageUrl: summary.imageUrl,
      dividendYieldCurrent: summary.dividendYieldCurrent,
      beta5y: summary.beta5y,
      pricePctChg7d: summary.pricePctChg7d,
      pricePctChg30d: summary.pricePctChg30d,
      pricePctChgYtd: summary.pricePctChgYtd,
      pricePctChg1y: summary.pricePctChg1y,
      pricePctChg3y: summary.pricePctChg3y,
      pricePctChg5y: summary.pricePctChg5y,
      companyQuality: summary.companyQuality,
      overallRiskLevel: summary.overallRiskLevel,
      qualityValuation: summary.qualityValuation,
      taSignal1d: summary.taSignal1d,
      watchlistCount: summary.watchlistCount,
      roe: summary.roe,
      roa: summary.roa,
      revenue5yGrowth: summary.revenue5yGrowth,
      netIncome5yGrowth: summary.netIncome5yGrowth,
      revenueLtmGrowth: summary.revenueLtmGrowth,
      netIncomeLtmGrowth: summary.netIncomeLtmGrowth,
      revenueGrowthQoq: summary.revenueGrowthQoq,
      netIncomeGrowthQoq: summary.netIncomeGrowthQoq,
      type: summary.type,
      country: summary.country,
    };
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  /**
   * Get health check for Simplize API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a well-known ticker
      const testTicker = 'VIC';
      const url = `${this.baseUrl}/co-phieu/${testTicker}/ho-so-doanh-nghiep.json?ticker=${testTicker}`;
      
      const response = await this.axiosInstance.get(url, { timeout: 10000 });
      return response.status === 200 && response.data?.pageProps?.summary;
    } catch (error) {
      logger.error('Simplize API health check failed:', error);
      return false;
    }
  }
}

export default new SimplizeService();
