// Simplize API Response Types
export interface SimplizeApiResponse {
  pageProps: {
    ticker: string;
    summary: CompanySummary;
  };
  __N_SSG: boolean;
}

export interface CompanySummary {
  id: number;
  ticker: string;
  nameVi: string;
  nameEn: string;
  name: string;
  industryActivity: string;
  bcIndustryGroupId: number;
  bcIndustryGroupSlug: string;
  bcIndustryGroupCode: string;
  bcIndustryGroupType: string;
  bcEconomicSectorId: number;
  bcEconomicSectorSlug: string;
  bcEconomicSectorName: string;
  website: string;
  mainService: string;
  businessLine: string;
  businessStrategy: string;
  businessRisk: string;
  businessOverall: string;
  detailInfo: string;
  marketCap: number;
  outstandingSharesValue: number;
  analysisUpdated: string;
  stockExchange: string;
  priceClose: number;
  isInWatchlist: boolean;
  netChange: number;
  pctChange: number;
  priceReferrance: number;
  priceOpen: number;
  priceFloor: number;
  priceLow: number;
  priceHigh: number;
  priceCeiling: number;
  priceTimeStamp: string;
  priceType: number;
  volume10dAvg: number;
  volume: number;
  peRatio: number;
  pbRatio: number;
  epsRatio: number;
  bookValue: number;
  freeFloatRate: number;
  valuationPoint: number;
  growthPoint: number;
  passPerformancePoint: number;
  financialHealthPoint: number;
  dividendPoint: number;
  imageUrl: string;
  dividendYieldCurrent: number;
  beta5y: number;
  pricePctChg7d: number;
  pricePctChg30d: number;
  pricePctChgYtd: number;
  pricePctChg1y: number;
  pricePctChg3y: number;
  pricePctChg5y: number;
  companyQuality: number;
  overallRiskLevel: string;
  qualityValuation: string;
  taSignal1d: string;
  watchlistCount: number;
  roe: number;
  roa: number;
  revenue5yGrowth: number;
  netIncome5yGrowth: number;
  revenueLtmGrowth: number;
  netIncomeLtmGrowth: number;
  revenueGrowthQoq: number;
  netIncomeGrowthQoq: number;
  type: string;
  country: string;
}

// Database Model Types
export interface Company {
  id?: number;
  ticker: string;
  nameVi?: string;
  nameEn?: string;
  industryActivity?: string;
  bcIndustryGroupId?: number;
  bcIndustryGroupSlug?: string;
  bcIndustryGroupCode?: string;
  bcIndustryGroupType?: string;
  bcEconomicSectorId?: number;
  bcEconomicSectorSlug?: string;
  bcEconomicSectorName?: string;
  website?: string;
  mainService?: string;
  businessLine?: string;
  businessStrategy?: string;
  businessRisk?: string;
  businessOverall?: string;
  detailInfo?: string;
  marketCap?: number;
  outstandingSharesValue?: number;
  analysisUpdated?: Date | undefined;
  stockExchange?: string;
  priceClose?: number;
  netChange?: number;
  pctChange?: number;
  priceReference?: number;
  priceOpen?: number;
  priceFloor?: number;
  priceLow?: number;
  priceHigh?: number;
  priceCeiling?: number;
  priceTimestamp?: Date | undefined;
  priceType?: number;
  volume10dAvg?: number;
  volume?: number;
  peRatio?: number;
  pbRatio?: number;
  epsRatio?: number;
  bookValue?: number;
  freeFloatRate?: number;
  valuationPoint?: number;
  growthPoint?: number;
  passPerformancePoint?: number;
  financialHealthPoint?: number;
  dividendPoint?: number;
  imageUrl?: string;
  dividendYieldCurrent?: number;
  beta5y?: number;
  pricePctChg7d?: number;
  pricePctChg30d?: number;
  pricePctChgYtd?: number;
  pricePctChg1y?: number;
  pricePctChg3y?: number;
  pricePctChg5y?: number;
  companyQuality?: number;
  overallRiskLevel?: string;
  qualityValuation?: string;
  taSignal1d?: string;
  watchlistCount?: number;
  roe?: number;
  roa?: number;
  revenue5yGrowth?: number;
  netIncome5yGrowth?: number;
  revenueLtmGrowth?: number;
  netIncomeLtmGrowth?: number;
  revenueGrowthQoq?: number;
  netIncomeGrowthQoq?: number;
  type?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query Parameters
export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  sector?: string;
  exchange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error Types
export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
