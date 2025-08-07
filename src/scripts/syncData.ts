#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

import { testConnection, initializeDatabase } from '../config/database';
import SimplizeService from '../services/SimplizeService';
import CompanyModel from '../models/Company';
import logger from '../utils/logger';
import { Company } from '../types';

interface SyncOptions {
  batchSize?: number;
  startIndex?: number;
  endIndex?: number;
  specificTickers?: string[];
  skipExisting?: boolean;
  workers?: number;
  maxRetries?: number;
}

interface WorkerTask {
  ticker: string;
  retryCount: number;
}

interface WorkerResult {
  ticker: string;
  success: boolean;
  error?: string;
  data?: Company;
  attempts: number;
}

class DataSyncScript {
  private simplizeService: typeof SimplizeService;
  private companyModel: typeof CompanyModel;

  constructor() {
    this.simplizeService = SimplizeService;
    this.companyModel = CompanyModel;
  }

  /**
   * Đọc danh sách ticker từ file tickers.json
   */
  private loadTickers(): string[] {
    try {
      const tickersPath = path.join(process.cwd(), 'tickers.json');
      
      if (!fs.existsSync(tickersPath)) {
        throw new Error(`File tickers.json không tồn tại tại đường dẫn: ${tickersPath}`);
      }

      const tickersData = fs.readFileSync(tickersPath, 'utf-8');
      const tickers: string[] = JSON.parse(tickersData);

      if (!Array.isArray(tickers)) {
        throw new Error('File tickers.json phải chứa một mảng các ticker');
      }

      logger.info(`Đã tải ${tickers.length} ticker từ tickers.json`);
      return tickers.map(ticker => ticker.toUpperCase().trim()).filter(Boolean);
    } catch (error: any) {
      logger.error('Lỗi khi đọc file tickers.json:', error.message);
      throw error;
    }
  }

  /**
   * Lọc ticker cần đồng bộ
   */
  private async filterTickers(tickers: string[], options: SyncOptions): Promise<string[]> {
    let filteredTickers = [...tickers];

    // Lọc theo chỉ số bắt đầu và kết thúc
    if (options.startIndex !== undefined || options.endIndex !== undefined) {
      const start = options.startIndex || 0;
      const end = options.endIndex || tickers.length;
      filteredTickers = filteredTickers.slice(start, end);
      logger.info(`Lọc ticker từ chỉ số ${start} đến ${end}: ${filteredTickers.length} ticker`);
    }

    // Lọc theo danh sách ticker cụ thể
    if (options.specificTickers && options.specificTickers.length > 0) {
      const specificTickers = options.specificTickers.map(t => t.toUpperCase().trim());
      filteredTickers = filteredTickers.filter(ticker => specificTickers.includes(ticker));
      logger.info(`Lọc theo ticker cụ thể: ${filteredTickers.length} ticker`);
    }

    // Bỏ qua ticker đã tồn tại
    if (options.skipExisting) {
      const existingTickers: string[] = [];
      
      for (const ticker of filteredTickers) {
        const existing = await this.companyModel.findByTicker(ticker);
        if (existing) {
          existingTickers.push(ticker);
        }
      }
      
      filteredTickers = filteredTickers.filter(ticker => !existingTickers.includes(ticker));
      logger.info(`Bỏ qua ${existingTickers.length} ticker đã tồn tại. Còn lại: ${filteredTickers.length} ticker`);
    }

    return filteredTickers;
  }

  /**
   * Fetch dữ liệu với retry logic
   */
  private async fetchWithRetry(ticker: string, maxRetries: number): Promise<WorkerResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await this.simplizeService.fetchCompanyData(ticker);

        if (data) {
          return {
            ticker,
            success: true,
            data,
            attempts: attempt
          };
        } else {
          lastError = `No data returned for ${ticker}`;
          if (attempt < maxRetries) {
            // Wait before retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      ticker,
      success: false,
      error: lastError,
      attempts: maxRetries
    };
  }

  /**
   * Đồng bộ dữ liệu sử dụng concurrent processing
   */
  private async syncWithWorkers(tickers: string[], options: SyncOptions): Promise<{ success: number; failed: number }> {
    const concurrency = options.workers || 128;
    const maxRetries = options.maxRetries || 3;

    logger.info(`🔧 Sử dụng ${concurrency} concurrent requests với ${maxRetries} lần retry tối đa`);

    let successCount = 0;
    let failedCount = 0;

    // Process tickers in chunks with controlled concurrency
    const chunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += concurrency) {
      chunks.push(tickers.slice(i, i + concurrency));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      if (!chunk) continue;

      logger.info(`📦 Xử lý chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} ticker)`);

      // Process all tickers in this chunk concurrently
      const promises = chunk.map(async (ticker, index) => {
        if (!ticker) return null;

        const globalIndex = chunkIndex * concurrency + index + 1;
        const progress = ((globalIndex / tickers.length) * 100).toFixed(1);

        try {
          logger.info(`[${globalIndex}/${tickers.length}] Đang xử lý ${ticker} (${progress}%)`);

          const result = await this.fetchWithRetry(ticker, maxRetries);

          if (result.success && result.data) {
            await this.companyModel.upsert(result.data);
            logger.info(`✓ [${globalIndex}/${tickers.length}] ${ticker} thành công (${progress}%) - ${result.attempts} lần thử`);
            return { success: true, ticker };
          } else {
            logger.warn(`✗ [${globalIndex}/${tickers.length}] ${ticker} thất bại (${progress}%) - ${result.attempts} lần thử: ${result.error}`);
            return { success: false, ticker, error: result.error };
          }
        } catch (error: any) {
          logger.error(`✗ [${globalIndex}/${tickers.length}] ${ticker} lỗi (${progress}%): ${error.message}`);
          return { success: false, ticker, error: error.message };
        }
      });

      // Wait for all promises in this chunk to complete
      const results = await Promise.all(promises);

      // Count results
      results.forEach(result => {
        if (result) {
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        }
      });

      logger.info(`✅ Chunk ${chunkIndex + 1} hoàn thành: ${results.filter(r => r?.success).length} thành công, ${results.filter(r => r && !r.success).length} thất bại`);

      // Small delay between chunks to avoid overwhelming the API
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Chạy script đồng bộ dữ liệu
   */
  async run(options: SyncOptions = {}): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('🚀 Bắt đầu script đồng bộ dữ liệu cổ phiếu');
      
      // Kiểm tra kết nối database
      logger.info('📊 Kiểm tra kết nối database...');
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Không thể kết nối đến database');
      }

      // Khởi tạo database
      logger.info('🔧 Khởi tạo cấu trúc database...');
      await initializeDatabase();

      // Kiểm tra Simplize API
      logger.info('🌐 Kiểm tra kết nối Simplize API...');
      const apiHealthy = await this.simplizeService.healthCheck();
      if (!apiHealthy) {
        logger.warn('⚠️ Simplize API có thể không hoạt động bình thường, nhưng vẫn tiếp tục...');
      }

      // Tải danh sách ticker
      logger.info('📋 Đang tải danh sách ticker...');
      const allTickers = this.loadTickers();
      
      // Lọc ticker cần đồng bộ
      const tickersToSync = await this.filterTickers(allTickers, options);
      
      if (tickersToSync.length === 0) {
        logger.info('ℹ️ Không có ticker nào cần đồng bộ');
        return;
      }

      logger.info(`📈 Sẽ đồng bộ ${tickersToSync.length} ticker`);

      // Chia thành các batch nếu cần
      const batchSize = options.batchSize || tickersToSync.length;
      const batches: string[][] = [];
      
      for (let i = 0; i < tickersToSync.length; i += batchSize) {
        batches.push(tickersToSync.slice(i, i + batchSize));
      }

      logger.info(`🔄 Chia thành ${batches.length} batch, mỗi batch ${batchSize} ticker`);

      // Xử lý từng batch
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (!batch) {continue;}

        logger.info(`\n📦 Xử lý batch ${batchIndex + 1}/${batches.length} (${batch.length} ticker)`);

        const result = await this.syncWithWorkers(batch, options);
        totalSuccess += result.success;
        totalFailed += result.failed;

        logger.info(`✅ Batch ${batchIndex + 1} hoàn thành: ${result.success} thành công, ${result.failed} thất bại`);
        
        // Nghỉ giữa các batch
        if (batchIndex < batches.length - 1) {
          logger.info('⏳ Nghỉ 5 giây trước batch tiếp theo...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Thống kê kết quả
      const duration = Math.round((Date.now() - startTime) / 1000);
      const successRate = ((totalSuccess / tickersToSync.length) * 100).toFixed(1);

      logger.info('\n🎉 Hoàn thành script đồng bộ dữ liệu!');
      logger.info(`📊 Thống kê:`);
      logger.info(`   - Tổng số ticker: ${tickersToSync.length}`);
      logger.info(`   - Thành công: ${totalSuccess} (${successRate}%)`);
      logger.info(`   - Thất bại: ${totalFailed}`);
      logger.info(`   - Thời gian: ${duration} giây`);
      
      if (totalSuccess > 0) {
        logger.info(`   - Tốc độ trung bình: ${(totalSuccess / duration * 60).toFixed(1)} ticker/phút`);
      }

    } catch (error: any) {
      logger.error('💥 Lỗi trong quá trình đồng bộ:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: SyncOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--batch-size': {
        const batchSizeArg = args[++i];
        if (batchSizeArg) {
          options.batchSize = parseInt(batchSizeArg, 10);
        }
        break;
      }
      case '--start': {
        const startArg = args[++i];
        if (startArg) {
          options.startIndex = parseInt(startArg, 10);
        }
        break;
      }
      case '--end': {
        const endArg = args[++i];
        if (endArg) {
          options.endIndex = parseInt(endArg, 10);
        }
        break;
      }
      case '--tickers': {
        const tickersArg = args[++i];
        if (tickersArg) {
          options.specificTickers = tickersArg.split(',').map(t => t.trim());
        }
        break;
      }
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--workers': {
        const workersArg = args[++i];
        if (workersArg) {
          options.workers = parseInt(workersArg, 10);
        }
        break;
      }
      case '--max-retries': {
        const retriesArg = args[++i];
        if (retriesArg) {
          options.maxRetries = parseInt(retriesArg, 10);
        }
        break;
      }
      case '--help':
        console.log(`
Sử dụng: npm run sync-data [options]

Options:
  --batch-size <number>     Số lượng ticker xử lý trong mỗi batch (mặc định: tất cả)
  --start <number>          Chỉ số bắt đầu trong danh sách ticker
  --end <number>            Chỉ số kết thúc trong danh sách ticker
  --tickers <list>          Danh sách ticker cụ thể (phân cách bằng dấu phẩy)
  --skip-existing           Bỏ qua các ticker đã có trong database
  --workers <number>        Số lượng worker threads (mặc định: 128)
  --max-retries <number>    Số lần retry tối đa khi lỗi (mặc định: 3)
  --help                    Hiển thị hướng dẫn này

Ví dụ:
  npm run sync-data                                    # Đồng bộ tất cả ticker với 128 workers
  npm run sync-data -- --batch-size 50                # Đồng bộ theo batch 50 ticker
  npm run sync-data -- --start 0 --end 100            # Đồng bộ 100 ticker đầu tiên
  npm run sync-data -- --tickers VIC,VCB,HPG          # Đồng bộ ticker cụ thể
  npm run sync-data -- --skip-existing                # Bỏ qua ticker đã tồn tại
  npm run sync-data -- --workers 64 --max-retries 5   # Sử dụng 64 workers và 5 lần retry
        `);
        process.exit(0);
    }
  }

  const syncScript = new DataSyncScript();
  
  try {
    await syncScript.run(options);
    process.exit(0);
  } catch (error) {
    logger.error('Script thất bại:', error);
    process.exit(1);
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default DataSyncScript;
