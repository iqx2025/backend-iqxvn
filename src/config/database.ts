import { Pool, PoolConfig } from 'pg';
import config from './index';
import logger from '../utils/logger';

const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

// Initialize database tables
export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(20) UNIQUE NOT NULL,
        name_vi TEXT,
        name_en TEXT,
        industry_activity TEXT,
        bc_industry_group_id INTEGER,
        bc_industry_group_slug VARCHAR(100),
        bc_industry_group_code VARCHAR(20),
        bc_industry_group_type VARCHAR(20),
        bc_economic_sector_id INTEGER,
        bc_economic_sector_slug VARCHAR(100),
        bc_economic_sector_name VARCHAR(100),
        website TEXT,
        main_service TEXT,
        business_line TEXT,
        business_strategy TEXT,
        business_risk TEXT,
        business_overall TEXT,
        detail_info TEXT,
        market_cap BIGINT,
        outstanding_shares_value BIGINT,
        analysis_updated DATE,
        stock_exchange VARCHAR(10),
        price_close DECIMAL(15,2),
        net_change DECIMAL(15,2),
        pct_change DECIMAL(8,4),
        price_reference DECIMAL(15,2),
        price_open DECIMAL(15,2),
        price_floor DECIMAL(15,2),
        price_low DECIMAL(15,2),
        price_high DECIMAL(15,2),
        price_ceiling DECIMAL(15,2),
        price_timestamp TIMESTAMP,
        price_type INTEGER,
        volume_10d_avg BIGINT,
        volume BIGINT,
        pe_ratio DECIMAL(8,4),
        pb_ratio DECIMAL(8,4),
        eps_ratio DECIMAL(15,4),
        book_value DECIMAL(15,4),
        free_float_rate DECIMAL(8,4),
        valuation_point INTEGER,
        growth_point INTEGER,
        pass_performance_point INTEGER,
        financial_health_point INTEGER,
        dividend_point INTEGER,
        image_url TEXT,
        dividend_yield_current DECIMAL(8,4),
        beta_5y DECIMAL(8,4),
        price_pct_chg_7d DECIMAL(8,4),
        price_pct_chg_30d DECIMAL(8,4),
        price_pct_chg_ytd DECIMAL(8,4),
        price_pct_chg_1y DECIMAL(8,4),
        price_pct_chg_3y DECIMAL(8,4),
        price_pct_chg_5y DECIMAL(8,4),
        company_quality INTEGER,
        overall_risk_level VARCHAR(20),
        quality_valuation VARCHAR(10),
        ta_signal_1d VARCHAR(20),
        watchlist_count INTEGER,
        roe DECIMAL(8,4),
        roa DECIMAL(8,4),
        revenue_5y_growth DECIMAL(8,4),
        net_income_5y_growth DECIMAL(8,4),
        revenue_ltm_growth DECIMAL(8,4),
        net_income_ltm_growth DECIMAL(8,4),
        revenue_growth_qoq DECIMAL(8,4),
        net_income_growth_qoq DECIMAL(8,4),
        type VARCHAR(20),
        country VARCHAR(5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);
      CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(bc_industry_group_slug);
      CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(bc_economic_sector_slug);
      CREATE INDEX IF NOT EXISTS idx_companies_exchange ON companies(stock_exchange);
      CREATE INDEX IF NOT EXISTS idx_companies_name_vi ON companies USING gin(to_tsvector('simple', name_vi));
    `);

    // Create function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger to automatically update updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
      CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    logger.info('Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to initialize database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
