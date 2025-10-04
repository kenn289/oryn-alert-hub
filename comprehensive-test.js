// Comprehensive Test Suite for Oryn Alert Hub
// This script tests all components and fixes issues

console.log('🧪 Starting Comprehensive Test Suite for Oryn Alert Hub...\n');

const BASE_URL = 'http://localhost:3000';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Test helper function
async function testEndpoint(name, url, expectedStatus = 200, method = 'GET', body = null) {
  testResults.total++;
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const isSuccess = response.status === expectedStatus;
    
    if (isSuccess) {
      console.log(`✅ ${name}: ${response.status} ${response.ok ? 'PASS' : 'FAIL'}`);
      testResults.passed++;
    } else {
      console.log(`❌ ${name}: ${response.status} (Expected: ${expectedStatus})`);
      testResults.failed++;
      const errorText = await response.text();
      testResults.errors.push(`${name}: ${errorText.substring(0, 100)}`);
    }
    
    return { success: isSuccess, response, data: isSuccess ? await response.json().catch(() => null) : null };
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  return await testEndpoint('Health Check', `${BASE_URL}/api/health`);
}

// Test 2: Database Setup Check
async function testDatabaseSetup() {
  console.log('\n🗄️ Testing Database Setup...');
  
  // Test if we can create a test user
  const testUser = {
    email: 'test@example.com',
    plan: 'free'
  };
  
  return await testEndpoint('Create Test User', `${BASE_URL}/api/admin/users`, 200, 'POST', testUser);
}

// Test 3: Support System
async function testSupportSystem() {
  console.log('\n🎫 Testing Support System...');
  
  const tests = [
    testEndpoint('Support Stats', `${BASE_URL}/api/support/stats`),
    testEndpoint('Support Tickets', `${BASE_URL}/api/support/tickets?userId=test`),
    testEndpoint('Create Ticket', `${BASE_URL}/api/support/tickets`, 200, 'POST', {
      subject: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      category: 'general',
      userEmail: 'test@example.com'
    })
  ];
  
  return await Promise.all(tests);
}

// Test 4: Notifications System
async function testNotificationsSystem() {
  console.log('\n🔔 Testing Notifications System...');
  
  const tests = [
    testEndpoint('Get Notifications', `${BASE_URL}/api/notifications?userId=test`),
    testEndpoint('Clear All Notifications', `${BASE_URL}/api/notifications/clear-all`, 200, 'POST', { userId: 'test' }),
    testEndpoint('Read All Notifications', `${BASE_URL}/api/notifications/read-all`, 200, 'POST', { userId: 'test' })
  ];
  
  return await Promise.all(tests);
}

// Test 5: Stock Data APIs
async function testStockDataAPIs() {
  console.log('\n📈 Testing Stock Data APIs...');
  
  const tests = [
    testEndpoint('Stock Status', `${BASE_URL}/api/stock/status`),
    testEndpoint('Stock Data (AAPL)', `${BASE_URL}/api/stock/AAPL`),
    testEndpoint('Multi Stock Data', `${BASE_URL}/api/stock/multi?symbols=AAPL,MSFT,GOOGL`)
  ];
  
  return await Promise.all(tests);
}

// Test 6: Payment System
async function testPaymentSystem() {
  console.log('\n💳 Testing Payment System...');
  
  const tests = [
    testEndpoint('Create Checkout Session', `${BASE_URL}/api/razorpay/create-checkout-session`, 200, 'POST', {
      amount: 99900, // ₹999 in paise
      currency: 'INR',
      plan: 'pro'
    }),
    testEndpoint('Verify Payment', `${BASE_URL}/api/razorpay/verify-payment`, 200, 'POST', {
      razorpay_payment_id: 'test_payment_id',
      razorpay_order_id: 'test_order_id',
      razorpay_signature: 'test_signature'
    })
  ];
  
  return await Promise.all(tests);
}

// Test 7: Admin System
async function testAdminSystem() {
  console.log('\n👑 Testing Admin System...');
  
  const tests = [
    testEndpoint('Admin Users', `${BASE_URL}/api/admin/users`),
    testEndpoint('Admin Tickets', `${BASE_URL}/api/admin/tickets`),
    testEndpoint('Admin Notifications', `${BASE_URL}/api/admin/notifications`)
  ];
  
  return await Promise.all(tests);
}

// Test 8: Master Dashboard
async function testMasterDashboard() {
  console.log('\n🎯 Testing Master Dashboard...');
  
  const tests = [
    testEndpoint('Master Users', `${BASE_URL}/api/master/users`),
    testEndpoint('Master Tickets', `${BASE_URL}/api/master/tickets`),
    testEndpoint('Master Notifications', `${BASE_URL}/api/master/notifications`)
  ];
  
  return await Promise.all(tests);
}

// Test 9: Options Flow
async function testOptionsFlow() {
  console.log('\n📊 Testing Options Flow...');
  
  return await testEndpoint('Options Flow', `${BASE_URL}/api/options-flow`);
}

// Test 10: Frontend Components (Basic)
async function testFrontendComponents() {
  console.log('\n🎨 Testing Frontend Components...');
  
  // Test if the main pages load
  const tests = [
    testEndpoint('Home Page', `${BASE_URL}/`, 200),
    testEndpoint('Dashboard', `${BASE_URL}/dashboard`, 200),
    testEndpoint('Auth Page', `${BASE_URL}/auth`, 200),
    testEndpoint('Support Page', `${BASE_URL}/support`, 200),
    testEndpoint('Admin Page', `${BASE_URL}/admin`, 200),
    testEndpoint('Master Dashboard', `${BASE_URL}/master-dashboard`, 200)
  ];
  
  return await Promise.all(tests);
}

// Test 11: Error Handling
async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling...');
  
  const tests = [
    testEndpoint('Invalid Endpoint', `${BASE_URL}/api/invalid-endpoint`, 404),
    testEndpoint('Invalid Stock Symbol', `${BASE_URL}/api/stock/INVALID_SYMBOL`, 400),
    testEndpoint('Invalid User ID', `${BASE_URL}/api/notifications?userId=invalid`, 400)
  ];
  
  return await Promise.all(tests);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive testing...\n');
  
  try {
    // Run all test suites
    await testHealthCheck();
    await testDatabaseSetup();
    await testSupportSystem();
    await testNotificationsSystem();
    await testStockDataAPIs();
    await testPaymentSystem();
    await testAdminSystem();
    await testMasterDashboard();
    await testOptionsFlow();
    await testFrontendComponents();
    await testErrorHandling();
    
    // Generate report
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total: ${testResults.total}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your Oryn Alert Hub is working perfectly!');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the issues above.');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    return { error: error.message };
  }
}

// Run the tests
runAllTests().then(results => {
  console.log('\n🏁 Testing completed!');
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
