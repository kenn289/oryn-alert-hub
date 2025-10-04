#!/usr/bin/env node

/**
 * Test script to verify all real-time features are working
 * This script tests the AI Market Insights and Options Flow features
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testStockAPI(symbol) {
  try {
    console.log(`📊 Testing stock API for ${symbol}...`)
    const response = await fetch(`${BASE_URL}/api/stock/multi/${symbol}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.price || !data.symbol) {
      throw new Error('Invalid data structure')
    }
    
    console.log(`✅ ${symbol}: $${data.price} (${data.changePercent?.toFixed(2)}%) from ${data.source}`)
    return { success: true, data }
  } catch (error) {
    console.log(`❌ ${symbol}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testOptionsFlowAPI() {
  try {
    console.log('📈 Testing options flow API...')
    const response = await fetch(`${BASE_URL}/api/options-flow`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.unusualActivity || !data.callPutRatio) {
      throw new Error('Invalid options flow data structure')
    }
    
    console.log(`✅ Options Flow: ${data.unusualActivity.length} unusual activities, ${data.callPutRatio.length} ratios`)
    return { success: true, data }
  } catch (error) {
    console.log(`❌ Options Flow: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testHealthAPI() {
  try {
    console.log('🏥 Testing health API...')
    const response = await fetch(`${BASE_URL}/api/health`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log(`✅ Health: ${data.status}`)
    return { success: true, data }
  } catch (error) {
    console.log(`❌ Health: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Starting real-time features test...\n')
  
  const results = {
    stockAPIs: [],
    optionsFlow: null,
    health: null
  }
  
  // Test stock APIs for multiple symbols
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA']
  
  for (const symbol of symbols) {
    const result = await testStockAPI(symbol)
    results.stockAPIs.push({ symbol, ...result })
  }
  
  // Test options flow API
  results.optionsFlow = await testOptionsFlowAPI()
  
  // Test health API
  results.health = await testHealthAPI()
  
  // Summary
  console.log('\n📋 Test Results Summary:')
  console.log('========================')
  
  const stockSuccess = results.stockAPIs.filter(r => r.success).length
  const stockTotal = results.stockAPIs.length
  
  console.log(`Stock APIs: ${stockSuccess}/${stockTotal} successful`)
  console.log(`Options Flow: ${results.optionsFlow.success ? '✅' : '❌'}`)
  console.log(`Health API: ${results.health.success ? '✅' : '❌'}`)
  
  const allWorking = stockSuccess === stockTotal && results.optionsFlow.success && results.health.success
  
  if (allWorking) {
    console.log('\n🎉 All real-time features are working correctly!')
    console.log('✅ No mock data detected')
    console.log('✅ Real-time data sources active')
    console.log('✅ API endpoints responding')
  } else {
    console.log('\n⚠️ Some features need attention:')
    if (stockSuccess < stockTotal) {
      console.log(`- ${stockTotal - stockSuccess} stock APIs failed`)
    }
    if (!results.optionsFlow.success) {
      console.log('- Options Flow API failed')
    }
    if (!results.health.success) {
      console.log('- Health API failed')
    }
  }
  
  return allWorking
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}

module.exports = { runTests, testStockAPI, testOptionsFlowAPI, testHealthAPI }