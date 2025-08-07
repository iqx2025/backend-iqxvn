# IQX Vietnamese Stocks API

Ứng dụng ExpressJS hiện đại với TypeScript và PostgreSQL để quản lý dữ liệu cổ phiếu Việt Nam từ Simplize.vn.

## 🚀 Tính năng

- **REST API hoàn chỉnh**: Cung cấp các endpoint GET để truy xuất dữ liệu cổ phiếu
- **Đồng bộ dữ liệu tự động**: Script npm để fetch dữ liệu từ Simplize.vn API với 128 concurrent requests
- **Top Lists**: Top gainers/losers, volume, market cap theo sàn giao dịch
- **Market Analysis**: Tổng quan thị trường, phân tích phân bố giá
- **Company Comparison**: So sánh nhiều công ty, tìm công ty tương tự
- **Advanced Filtering**: Lọc theo ngành nghề, lĩnh vực, sàn giao dịch
- **Kiến trúc MVC**: Tách biệt rõ ràng giữa Models, Views và Controllers
- **TypeScript**: Type safety và developer experience tốt hơn
- **PostgreSQL**: Database mạnh mẽ với schema được tối ưu
- **Rate Limiting**: Bảo vệ API khỏi spam và abuse
- **Logging**: Hệ thống log chi tiết với Winston
- **Error Handling**: Xử lý lỗi toàn diện
- **Security**: Helmet, CORS, input sanitization
- **Testing**: Unit tests với Jest
- **Documentation**: API documentation chi tiết

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm >= 8.0.0

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd be-iqx
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment

Sao chép file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iqx_stocks
DB_USER=postgres
DB_PASSWORD=your_password

# API Configuration
SIMPLIZE_API_BASE_URL=http://simplize.vn/_next/data/TjP_LuGmDMvtClpM082yf
SIMPLIZE_REQUEST_DELAY=1000
SIMPLIZE_MAX_RETRIES=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 4. Thiết lập database

Tạo database PostgreSQL:

```sql
CREATE DATABASE iqx_stocks;
CREATE USER iqx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE iqx_stocks TO iqx_user;
```

### 5. Build và chạy ứng dụng

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📊 Đồng bộ dữ liệu

### Đồng bộ tất cả ticker với 128 concurrent requests

```bash
npm run sync-data
```

### Đồng bộ với tùy chọn nâng cao

```bash
# Đồng bộ theo batch với 64 workers
npm run sync-data -- --batch-size 50 --workers 64

# Đồng bộ một phần danh sách với 256 workers
npm run sync-data -- --start 0 --end 100 --workers 256

# Đồng bộ ticker cụ thể với 5 lần retry
npm run sync-data -- --tickers VIC,VCB,HPG --max-retries 5

# Bỏ qua ticker đã tồn tại
npm run sync-data -- --skip-existing

# Sử dụng 512 workers với 10 lần retry (tốc độ cao)
npm run sync-data -- --workers 512 --max-retries 10

# Xem hướng dẫn đầy đủ
npm run sync-data -- --help
```

### Hiệu suất đồng bộ

- **Mặc định**: 128 concurrent requests, 3 lần retry
- **Tốc độ**: 60-240 ticker/phút (tùy thuộc vào network và API response time)
- **Auto retry**: Tự động thử lại 3 lần với exponential backoff khi gặp lỗi
- **Concurrent processing**: Xử lý song song nhiều ticker để tối ưu tốc độ

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Endpoints chính

#### 1. Lấy danh sách công ty
```http
GET /api/companies
```

**Query Parameters:**
- `page` (number): Trang hiện tại (mặc định: 1)
- `limit` (number): Số lượng kết quả mỗi trang (mặc định: 20, tối đa: 100)
- `search` (string): Tìm kiếm theo tên hoặc ticker
- `industry` (string): Lọc theo ngành nghề (slug)
- `sector` (string): Lọc theo lĩnh vực kinh tế (slug)
- `exchange` (string): Lọc theo sàn giao dịch (HOSE, HNX, UPCOM)
- `sortBy` (string): Sắp xếp theo trường
- `sortOrder` (string): Thứ tự sắp xếp (asc, desc)

**Ví dụ:**
```http
GET /api/companies?page=1&limit=20&search=VIC&industry=bat-dong-san&sortBy=market_cap&sortOrder=desc
```

#### 2. Tìm kiếm công ty
```http
GET /api/companies/search?q={query}
```

**Query Parameters:**
- `q` (string, bắt buộc): Từ khóa tìm kiếm
- `limit` (number): Số lượng kết quả tối đa (mặc định: 10, tối đa: 50)

**Ví dụ:**
```http
GET /api/companies/search?q=Vingroup&limit=5
```

#### 3. Lấy thông tin công ty theo ticker
```http
GET /api/companies/{ticker}
```

**Ví dụ:**
```http
GET /api/companies/VIC
```

#### 4. Lấy danh sách ngành nghề
```http
GET /api/companies/industries
```

#### 5. Lấy danh sách lĩnh vực kinh tế
```http
GET /api/companies/sectors
```

#### 6. Lấy thống kê tổng quan
```http
GET /api/companies/stats
```

#### 7. Lấy top cổ phiếu tăng giá mạnh nhất
```http
GET /api/companies/top-gainers?limit=10&exchange=HOSE
```

#### 8. Lấy top cổ phiếu giảm giá mạnh nhất
```http
GET /api/companies/top-losers?limit=10&exchange=HOSE
```

#### 9. Lấy top cổ phiếu có khối lượng giao dịch cao nhất
```http
GET /api/companies/top-volume?limit=10
```

#### 10. Lấy top cổ phiếu có giá trị giao dịch cao nhất
```http
GET /api/companies/top-value?limit=10
```

#### 11. Lấy top công ty có vốn hóa lớn nhất
```http
GET /api/companies/top-market-cap?limit=10
```

#### 12. Lấy tổng quan thị trường theo sàn
```http
GET /api/companies/market-overview
```

#### 13. Lấy phân bố giá cổ phiếu
```http
GET /api/companies/price-ranges?exchange=HOSE
```

#### 14. Lấy công ty theo ngành nghề
```http
GET /api/companies/industry/tai-chinh-ngan-hang?page=1&limit=20
```

#### 15. Lấy công ty theo lĩnh vực kinh tế
```http
GET /api/companies/sector/tai-chinh?page=1&limit=20
```

#### 16. Lấy công ty theo sàn giao dịch
```http
GET /api/companies/exchange/HOSE?page=1&limit=20
```

#### 17. So sánh nhiều công ty
```http
GET /api/companies/compare?tickers=VIC,VCB,HPG,FPT
```

#### 18. Lấy công ty tương tự
```http
GET /api/companies/similar/VIC?limit=5
```

#### 19. Kiểm tra sức khỏe hệ thống
```http
GET /api/health
```

### Response Format

Tất cả API responses đều có format:

```json
{
  "success": true,
  "data": {...},
  "message": "Thông báo thành công"
}
```

Hoặc khi có lỗi:

```json
{
  "success": false,
  "error": "Thông báo lỗi"
}
```

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm test -- --coverage
```

## 📝 Scripts

- `npm run dev`: Chạy development server với hot reload
- `npm run build`: Build production
- `npm start`: Chạy production server
- `npm run sync-data`: Đồng bộ dữ liệu từ Simplize.vn với 128 concurrent requests
- `npm test`: Chạy tests
- `npm run lint`: Kiểm tra code style
- `npm run lint:fix`: Tự động sửa code style

## 🏗️ Cấu trúc dự án

```
src/
├── config/           # Cấu hình database và app
├── controllers/      # Controllers xử lý request
├── middleware/       # Middleware functions
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── scripts/         # Utility scripts
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── __tests__/       # Test files
└── app.ts           # Main application file
```

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Ngăn chặn spam và abuse
- **Input Sanitization**: Làm sạch dữ liệu đầu vào
- **Validation**: Kiểm tra dữ liệu với Joi
- **Error Handling**: Không expose sensitive information

## 📈 Performance

- **Compression**: Gzip compression cho responses
- **Database Indexing**: Indexes được tối ưu cho queries
- **Connection Pooling**: PostgreSQL connection pool
- **Caching Headers**: HTTP caching cho static data
- **Request Timing**: Monitor slow requests

## 🐛 Troubleshooting

### Database connection issues
1. Kiểm tra PostgreSQL service đang chạy
2. Xác nhận thông tin kết nối trong `.env`
3. Kiểm tra firewall và network settings

### API không trả về dữ liệu
1. Chạy script đồng bộ dữ liệu: `npm run sync-data`
2. Kiểm tra logs trong thư mục `logs/`
3. Verify Simplize.vn API availability

### Performance issues
1. Kiểm tra database indexes
2. Monitor slow query logs
3. Adjust rate limiting settings

## 📞 Hỗ trợ

- Email: your-email@example.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/be-iqx/issues)

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.
# backend-iqxvn
