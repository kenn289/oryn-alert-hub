// Check API Endpoints Status
const BASE_URL = 'http://localhost:3000';

const endpoints = [
  '/api/health',
  '/api/support/stats',
  '/api/support/tickets?userId=test',
  '/api/notifications?userId=test',
  '/api/options-flow'
];

async function checkEndpoint(url) {
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    console.log(`${url}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`  Error: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`${url}: Error - ${error.message}`);
  }
}

async function checkAllEndpoints() {
  console.log('🔍 Checking API endpoints...\n');
  
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
  
  console.log('\n📋 If you see 404 errors:');
  console.log('1. Restart the development server: Ctrl+C then npm run dev');
  console.log('2. Check if the database fix was applied');
  console.log('3. Verify all API routes exist');
}

checkAllEndpoints();
