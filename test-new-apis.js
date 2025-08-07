#!/usr/bin/env node

/**
 * Test script for new stock market APIs
 * Usage: node test-new-apis.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3002;

// Test cases for new APIs
const testCases = [
  {
    name: 'Top Gainers',
    path: '/api/companies/top-gainers?limit=5',
    description: 'Lấy 5 cổ phiếu tăng giá mạnh nhất'
  },
  {
    name: 'Top Losers',
    path: '/api/companies/top-losers?limit=5',
    description: 'Lấy 5 cổ phiếu giảm giá mạnh nhất'
  },
  {
    name: 'Top Volume',
    path: '/api/companies/top-volume?limit=5',
    description: 'Lấy 5 cổ phiếu có khối lượng giao dịch cao nhất'
  },
  {
    name: 'Top Market Cap',
    path: '/api/companies/top-market-cap?limit=5',
    description: 'Lấy 5 công ty có vốn hóa lớn nhất'
  },
  {
    name: 'Market Overview',
    path: '/api/companies/market-overview',
    description: 'Tổng quan thị trường theo sàn giao dịch'
  },
  {
    name: 'Price Ranges',
    path: '/api/companies/price-ranges',
    description: 'Phân bố giá cổ phiếu theo khoảng'
  },
  {
    name: 'Compare Companies',
    path: '/api/companies/compare?tickers=VIC,VCB,HPG',
    description: 'So sánh 3 công ty VIC, VCB, HPG'
  },
  {
    name: 'Similar Companies',
    path: '/api/companies/similar/VIC?limit=3',
    description: 'Tìm 3 công ty tương tự VIC'
  },
  {
    name: 'Companies by Exchange',
    path: '/api/companies/exchange/HOSE?limit=5',
    description: 'Lấy 5 công ty trên sàn HOSE'
  }
];

/**
 * Make HTTP request and return promise
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Format response data for display
 */
function formatResponse(testCase, result) {
  console.log(`\n📊 ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  console.log(`🔗 ${testCase.path}`);
  
  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
    return;
  }
  
  console.log(`✅ Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log(`📈 Success: ${result.data.message}`);
    
    if (Array.isArray(result.data.data)) {
      console.log(`📊 Results: ${result.data.data.length} items`);
      
      // Show sample data based on API type
      if (testCase.name.includes('Top') && result.data.data.length > 0) {
        const sample = result.data.data[0];
        if (sample.ticker) {
          console.log(`📋 Sample: ${sample.ticker} - ${sample.nameVi || 'N/A'}`);
        }
      }
    } else if (result.data.data) {
      console.log(`📊 Data type: ${typeof result.data.data}`);
    }
  } else {
    console.log(`❌ Failed: ${result.data.message || 'Unknown error'}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Testing New Stock Market APIs');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await makeRequest(testCase.path);
      formatResponse(testCase, result);
      
      if (result.status === 200) {
        passed++;
      } else {
        failed++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`\n📊 ${testCase.name}`);
      console.log(`❌ Request failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check server logs for details.');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCases };
