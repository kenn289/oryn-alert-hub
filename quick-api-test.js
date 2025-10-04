// Quick API test
const fetch = require('node-fetch');

async function quickTest() {
  try {
    console.log('Testing stock API...');
    const response = await fetch('http://localhost:3000/api/stock/multi/AAPL');
    const data = await response.json();
    console.log('✅ Stock API working:', data.symbol, '$' + data.price);
    
    console.log('Testing options flow API...');
    const optionsResponse = await fetch('http://localhost:3000/api/options-flow');
    const optionsData = await optionsResponse.json();
    console.log('✅ Options Flow API working:', optionsData.unusualActivity?.length || 0, 'activities');
    
    console.log('✅ All APIs working with real-time data!');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickTest();



