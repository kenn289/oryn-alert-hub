#!/usr/bin/env node

/**
 * Comprehensive Route Testing Script
 * Tests all routes in the Oryn Alert Hub application
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Route test configuration
const ROUTE_TESTS = {
  // Public routes - should be accessible without authentication
  public: [
    { path: '/', expectedStatus: 200, description: 'Home page' },
    { path: '/docs', expectedStatus: 200, description: 'Documentation page' },
    { path: '/auth', expectedStatus: 200, description: 'Authentication page' },
    { path: '/api/health', expectedStatus: 200, description: 'Health check API' }
  ],
  
  // Protected routes - should redirect to auth if not authenticated
  protected: [
    { path: '/dashboard', expectedStatus: 302, description: 'Dashboard (redirects to auth)' },
    { path: '/analytics', expectedStatus: 302, description: 'Analytics (redirects to auth)' },
    { path: '/insights', expectedStatus: 302, description: 'Insights (redirects to auth)' },
    { path: '/options', expectedStatus: 302, description: 'Options (redirects to auth)' },
    { path: '/team', expectedStatus: 302, description: 'Team (redirects to auth)' },
    { path: '/support', expectedStatus: 302, description: 'Support (redirects to auth)' }
  ],
  
  // API routes - should be accessible
  api: [
    { path: '/api/stock/multi/AAPL', expectedStatus: 200, description: 'Stock data API' },
    { path: '/api/options-flow', expectedStatus: 200, description: 'Options flow API' }
  ],
  
  // Error routes - should return 404
  error: [
    { path: '/nonexistent', expectedStatus: 404, description: 'Non-existent page' },
    { path: '/invalid-route', expectedStatus: 404, description: 'Invalid route' }
  ]
}

async function testRoute(route) {
  try {
    console.log(`Testing ${route.path}...`)
    const response = await fetch(`${BASE_URL}${route.path}`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    })
    
    const status = response.status
    const isSuccess = status === route.expectedStatus
    
    console.log(`${isSuccess ? '✅' : '❌'} ${route.path} - ${status} (expected ${route.expectedStatus}) - ${route.description}`)
    
    if (!isSuccess) {
      console.log(`   Expected: ${route.expectedStatus}, Got: ${status}`)
    }
    
    return { route, status, success: isSuccess }
  } catch (error) {
    console.log(`❌ ${route.path} - Error: ${error.message} - ${route.description}`)
    return { route, status: 'ERROR', success: false, error: error.message }
  }
}

async function testAllRoutes() {
  console.log('🚀 Starting comprehensive route testing...\n')
  
  const results = {
    public: [],
    protected: [],
    api: [],
    error: []
  }
  
  // Test public routes
  console.log('📖 Testing Public Routes:')
  console.log('========================')
  for (const route of ROUTE_TESTS.public) {
    const result = await testRoute(route)
    results.public.push(result)
  }
  
  console.log('\n🔒 Testing Protected Routes:')
  console.log('============================')
  for (const route of ROUTE_TESTS.protected) {
    const result = await testRoute(route)
    results.protected.push(result)
  }
  
  console.log('\n🔌 Testing API Routes:')
  console.log('======================')
  for (const route of ROUTE_TESTS.api) {
    const result = await testRoute(route)
    results.api.push(result)
  }
  
  console.log('\n❌ Testing Error Routes:')
  console.log('========================')
  for (const route of ROUTE_TESTS.error) {
    const result = await testRoute(route)
    results.error.push(result)
  }
  
  // Summary
  console.log('\n📋 Test Results Summary:')
  console.log('========================')
  
  const categories = ['public', 'protected', 'api', 'error']
  let totalTests = 0
  let totalPassed = 0
  
  for (const category of categories) {
    const categoryResults = results[category]
    const passed = categoryResults.filter(r => r.success).length
    const total = categoryResults.length
    
    console.log(`${category.toUpperCase()}: ${passed}/${total} passed`)
    totalTests += total
    totalPassed += passed
  }
  
  console.log(`\nOVERALL: ${totalPassed}/${totalTests} tests passed`)
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All routes are working correctly!')
    console.log('✅ Public routes accessible')
    console.log('✅ Protected routes properly secured')
    console.log('✅ API routes responding')
    console.log('✅ Error handling working')
  } else {
    console.log('\n⚠️ Some routes need attention:')
    const failedTests = []
    for (const category of categories) {
      const failed = results[category].filter(r => !r.success)
      failedTests.push(...failed)
    }
    
    if (failedTests.length > 0) {
      console.log('Failed routes:')
      failedTests.forEach(test => {
        console.log(`- ${test.route.path}: ${test.status} (expected ${test.route.expectedStatus})`)
      })
    }
  }
  
  return totalPassed === totalTests
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAllRoutes().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}

module.exports = { testAllRoutes, testRoute, ROUTE_TESTS }
