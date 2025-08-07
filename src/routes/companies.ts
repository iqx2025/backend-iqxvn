import { Router } from 'express';
import CompanyController from '../controllers/CompanyController';

const router = Router();

/**
 * @route GET /api/companies
 * @desc Lấy danh sách tất cả công ty với phân trang và lọc
 * @access Public
 * @params {number} page - Trang hiện tại (mặc định: 1)
 * @params {number} limit - Số lượng kết quả mỗi trang (mặc định: 20, tối đa: 100)
 * @params {string} search - Tìm kiếm theo tên hoặc ticker
 * @params {string} industry - Lọc theo ngành nghề (slug)
 * @params {string} sector - Lọc theo lĩnh vực kinh tế (slug)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 * @params {string} sortBy - Sắp xếp theo trường (ticker, name_vi, market_cap, price_close, pct_change, pe_ratio, pb_ratio, roe, roa)
 * @params {string} sortOrder - Thứ tự sắp xếp (asc, desc)
 */
router.get('/', CompanyController.getAllCompanies.bind(CompanyController));

/**
 * @route GET /api/companies/search
 * @desc Tìm kiếm công ty theo tên hoặc ticker
 * @access Public
 * @params {string} q - Từ khóa tìm kiếm (bắt buộc)
 * @params {number} limit - Số lượng kết quả tối đa (mặc định: 10, tối đa: 50)
 */
router.get('/search', CompanyController.searchCompanies.bind(CompanyController));

/**
 * @route GET /api/companies/industries
 * @desc Lấy danh sách các ngành nghề
 * @access Public
 */
router.get('/industries', CompanyController.getIndustries.bind(CompanyController));

/**
 * @route GET /api/companies/sectors
 * @desc Lấy danh sách các lĩnh vực kinh tế
 * @access Public
 */
router.get('/sectors', CompanyController.getSectors.bind(CompanyController));

/**
 * @route GET /api/companies/stats
 * @desc Lấy thống kê tổng quan về dữ liệu công ty
 * @access Public
 */
router.get('/stats', CompanyController.getStats.bind(CompanyController));

/**
 * @route GET /api/companies/top-gainers
 * @desc Lấy danh sách cổ phiếu tăng giá mạnh nhất
 * @access Public
 * @params {number} limit - Số lượng kết quả (mặc định: 10, tối đa: 50)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/top-gainers', CompanyController.getTopGainers.bind(CompanyController));

/**
 * @route GET /api/companies/top-losers
 * @desc Lấy danh sách cổ phiếu giảm giá mạnh nhất
 * @access Public
 * @params {number} limit - Số lượng kết quả (mặc định: 10, tối đa: 50)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/top-losers', CompanyController.getTopLosers.bind(CompanyController));

/**
 * @route GET /api/companies/top-volume
 * @desc Lấy danh sách cổ phiếu có khối lượng giao dịch cao nhất
 * @access Public
 * @params {number} limit - Số lượng kết quả (mặc định: 10, tối đa: 50)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/top-volume', CompanyController.getTopVolume.bind(CompanyController));

/**
 * @route GET /api/companies/top-value
 * @desc Lấy danh sách cổ phiếu có giá trị giao dịch cao nhất
 * @access Public
 * @params {number} limit - Số lượng kết quả (mặc định: 10, tối đa: 50)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/top-value', CompanyController.getTopValue.bind(CompanyController));

/**
 * @route GET /api/companies/top-market-cap
 * @desc Lấy danh sách công ty có vốn hóa thị trường lớn nhất
 * @access Public
 * @params {number} limit - Số lượng kết quả (mặc định: 10, tối đa: 50)
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/top-market-cap', CompanyController.getTopMarketCap.bind(CompanyController));

/**
 * @route GET /api/companies/price-ranges
 * @desc Lấy thống kê phân bố giá cổ phiếu theo khoảng
 * @access Public
 * @params {string} exchange - Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
 */
router.get('/price-ranges', CompanyController.getPriceRanges.bind(CompanyController));

/**
 * @route GET /api/companies/market-overview
 * @desc Lấy tổng quan thị trường theo sàn giao dịch
 * @access Public
 */
router.get('/market-overview', CompanyController.getMarketOverview.bind(CompanyController));

/**
 * @route GET /api/companies/industry/:slug
 * @desc Lấy danh sách công ty theo ngành nghề
 * @access Public
 * @params {string} slug - Slug của ngành nghề
 * @params {number} page - Trang hiện tại (mặc định: 1)
 * @params {number} limit - Số lượng kết quả mỗi trang (mặc định: 20, tối đa: 100)
 * @params {string} sortBy - Sắp xếp theo trường
 * @params {string} sortOrder - Thứ tự sắp xếp (asc, desc)
 */
router.get('/industry/:slug', CompanyController.getCompaniesByIndustry.bind(CompanyController));

/**
 * @route GET /api/companies/sector/:slug
 * @desc Lấy danh sách công ty theo lĩnh vực kinh tế
 * @access Public
 * @params {string} slug - Slug của lĩnh vực kinh tế
 * @params {number} page - Trang hiện tại (mặc định: 1)
 * @params {number} limit - Số lượng kết quả mỗi trang (mặc định: 20, tối đa: 100)
 * @params {string} sortBy - Sắp xếp theo trường
 * @params {string} sortOrder - Thứ tự sắp xếp (asc, desc)
 */
router.get('/sector/:slug', CompanyController.getCompaniesBySector.bind(CompanyController));

/**
 * @route GET /api/companies/exchange/:exchange
 * @desc Lấy danh sách công ty theo sàn giao dịch
 * @access Public
 * @params {string} exchange - Sàn giao dịch (HOSE, HNX, UPCOM)
 * @params {number} page - Trang hiện tại (mặc định: 1)
 * @params {number} limit - Số lượng kết quả mỗi trang (mặc định: 20, tối đa: 100)
 * @params {string} sortBy - Sắp xếp theo trường
 * @params {string} sortOrder - Thứ tự sắp xếp (asc, desc)
 */
router.get('/exchange/:exchange', CompanyController.getCompaniesByExchange.bind(CompanyController));

/**
 * @route GET /api/companies/compare
 * @desc So sánh nhiều công ty
 * @access Public
 * @params {string} tickers - Danh sách ticker phân cách bằng dấu phẩy (tối đa 10)
 */
router.get('/compare', CompanyController.compareCompanies.bind(CompanyController));

/**
 * @route GET /api/companies/similar/:ticker
 * @desc Lấy danh sách công ty tương tự
 * @access Public
 * @params {string} ticker - Mã ticker của công ty
 * @params {number} limit - Số lượng kết quả (mặc định: 5, tối đa: 20)
 */
router.get('/similar/:ticker', CompanyController.getSimilarCompanies.bind(CompanyController));

/**
 * @route GET /api/companies/:ticker
 * @desc Lấy thông tin chi tiết công ty theo ticker
 * @access Public
 * @params {string} ticker - Mã ticker của công ty
 */
router.get('/:ticker', CompanyController.getCompanyByTicker.bind(CompanyController));

export default router;
