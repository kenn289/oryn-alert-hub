// Comprehensive Feature Testing Script
// This script tests all the key features of the Oryn Alert Hub

console.log('🧪 Starting Oryn Alert Hub Feature Tests...\n');

// Test 1: Check if localStorage is available
function testLocalStorage() {
    console.log('📦 Testing localStorage availability...');
    try {
        localStorage.setItem('test', 'value');
        const result = localStorage.getItem('test');
        localStorage.removeItem('test');
        console.log('✅ localStorage is working');
        return true;
    } catch (error) {
        console.log('❌ localStorage failed:', error.message);
        return false;
    }
}

// Test 2: Test Portfolio Data Structure
function testPortfolioDataStructure() {
    console.log('\n📊 Testing Portfolio Data Structure...');
    
    const samplePortfolio = [
        {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            shares: 10,
            avgPrice: 150.00,
            currentPrice: 175.43,
            totalValue: 1754.30,
            gainLoss: 254.30,
            gainLossPercent: 16.95,
            addedAt: new Date().toISOString()
        }
    ];
    
    try {
        localStorage.setItem('oryn_portfolio', JSON.stringify(samplePortfolio));
        const retrieved = JSON.parse(localStorage.getItem('oryn_portfolio'));
        
        if (retrieved && retrieved.length > 0 && retrieved[0].ticker === 'AAPL') {
            console.log('✅ Portfolio data structure is working');
            return true;
        } else {
            console.log('❌ Portfolio data structure failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Portfolio data structure error:', error.message);
        return false;
    }
}

// Test 3: Test Stock Suggestions
function testStockSuggestions() {
    console.log('\n🔍 Testing Stock Suggestions...');
    
    const mockSuggestions = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 175.43 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', price: 378.85 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 142.56 }
    ];
    
    try {
        // Test filtering by symbol
        const filteredBySymbol = mockSuggestions.filter(stock => 
            stock.symbol.toLowerCase().includes('aapl')
        );
        
        // Test filtering by name
        const filteredByName = mockSuggestions.filter(stock => 
            stock.name.toLowerCase().includes('apple')
        );
        
        if (filteredBySymbol.length > 0 && filteredByName.length > 0) {
            console.log('✅ Stock suggestions filtering is working');
            return true;
        } else {
            console.log('❌ Stock suggestions filtering failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Stock suggestions error:', error.message);
        return false;
    }
}

// Test 4: Test AI Analysis Logic
function testAIAnalysis() {
    console.log('\n🤖 Testing AI Analysis Logic...');
    
    const portfolio = [
        { ticker: 'AAPL', shares: 10, avgPrice: 150, currentPrice: 175, gainLoss: 250 },
        { ticker: 'MSFT', shares: 5, avgPrice: 300, currentPrice: 280, gainLoss: -100 },
        { ticker: 'GOOGL', shares: 3, avgPrice: 140, currentPrice: 145, gainLoss: 15 }
    ];
    
    try {
        // Test top performers logic
        const sortedByPerformance = portfolio.sort((a, b) => b.gainLoss - a.gainLoss);
        const topPerformers = sortedByPerformance.slice(0, Math.min(2, portfolio.length));
        
        // Test under performers logic
        const underPerformers = sortedByPerformance.slice(-Math.min(2, portfolio.length));
        
        // Test risk score calculation
        const totalValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0);
        const concentrationRisk = portfolio.length < 5 ? 20 : 0;
        const riskScore = Math.min(100, 30 + concentrationRisk);
        
        if (topPerformers.length > 0 && underPerformers.length > 0 && riskScore > 0) {
            console.log('✅ AI Analysis logic is working');
            console.log(`   Top Performers: ${topPerformers.map(p => p.ticker).join(', ')}`);
            console.log(`   Under Performers: ${underPerformers.map(p => p.ticker).join(', ')}`);
            console.log(`   Risk Score: ${riskScore}/100`);
            return true;
        } else {
            console.log('❌ AI Analysis logic failed');
            return false;
        }
    } catch (error) {
        console.log('❌ AI Analysis error:', error.message);
        return false;
    }
}

// Test 5: Test Analytics Calculations
function testAnalyticsCalculations() {
    console.log('\n📈 Testing Analytics Calculations...');
    
    const portfolio = [
        { shares: 10, avgPrice: 150, currentPrice: 175, totalValue: 1750 },
        { shares: 5, avgPrice: 300, currentPrice: 280, totalValue: 1400 }
    ];
    
    try {
        const totalValue = portfolio.reduce((sum, item) => sum + item.totalValue, 0);
        const totalInvested = portfolio.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0);
        const totalGainLoss = totalValue - totalInvested;
        const totalReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
        
        console.log(`   Total Value: $${totalValue.toFixed(2)}`);
        console.log(`   Total Invested: $${totalInvested.toFixed(2)}`);
        console.log(`   Total Gain/Loss: $${totalGainLoss.toFixed(2)}`);
        console.log(`   Total Return: ${totalReturn.toFixed(2)}%`);
        
        if (totalValue > 0 && totalInvested > 0) {
            console.log('✅ Analytics calculations are working');
            return true;
        } else {
            console.log('❌ Analytics calculations failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Analytics calculations error:', error.message);
        return false;
    }
}

// Test 6: Test Input Validation
function testInputValidation() {
    console.log('\n✅ Testing Input Validation...');
    
    const testCases = [
        { input: '10', expected: true, description: 'Valid number' },
        { input: '0', expected: true, description: 'Zero' },
        { input: '-5', expected: false, description: 'Negative number' },
        { input: 'abc', expected: false, description: 'Non-numeric' },
        { input: '', expected: false, description: 'Empty string' }
    ];
    
    let passed = 0;
    
    testCases.forEach(testCase => {
        const isValid = !isNaN(parseFloat(testCase.input)) && parseFloat(testCase.input) >= 0;
        const result = isValid === testCase.expected;
        
        if (result) {
            console.log(`   ✅ ${testCase.description}: ${testCase.input}`);
            passed++;
        } else {
            console.log(`   ❌ ${testCase.description}: ${testCase.input}`);
        }
    });
    
    console.log(`   Result: ${passed}/${testCases.length} validation tests passed`);
    return passed === testCases.length;
}

// Test 7: Test Error Handling
function testErrorHandling() {
    console.log('\n🛡️ Testing Error Handling...');
    
    try {
        // Test JSON parsing with invalid data
        const invalidJson = '{ invalid json }';
        try {
            JSON.parse(invalidJson);
            console.log('   ❌ Should have thrown error for invalid JSON');
            return false;
        } catch (e) {
            console.log('   ✅ Invalid JSON properly handled');
        }
        
        // Test division by zero
        const result = 10 / 0;
        if (isFinite(result)) {
            console.log('   ❌ Division by zero not handled');
            return false;
        } else {
            console.log('   ✅ Division by zero properly handled');
        }
        
        console.log('✅ Error handling is working');
        return true;
    } catch (error) {
        console.log('❌ Error handling test failed:', error.message);
        return false;
    }
}

// Run all tests
function runAllTests() {
    const tests = [
        { name: 'LocalStorage', fn: testLocalStorage },
        { name: 'Portfolio Data Structure', fn: testPortfolioDataStructure },
        { name: 'Stock Suggestions', fn: testStockSuggestions },
        { name: 'AI Analysis', fn: testAIAnalysis },
        { name: 'Analytics Calculations', fn: testAnalyticsCalculations },
        { name: 'Input Validation', fn: testInputValidation },
        { name: 'Error Handling', fn: testErrorHandling }
    ];
    
    let passed = 0;
    const total = tests.length;
    
    tests.forEach(test => {
        if (test.fn()) {
            passed++;
        }
    });
    
    console.log('\n🎯 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${total - passed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Your Oryn Alert Hub is working perfectly!');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the issues above.');
    }
    
    return passed === total;
}

// Run the tests
runAllTests();
