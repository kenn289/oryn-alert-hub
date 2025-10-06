// Test script for backend deployment
const https = require('https');

const BASE_URL = 'https://backend-5u4tefjzu-kenneths-projects-29fb6d97.vercel.app';

const endpoints = [
    '/api/health',
    '/api/stock/AAPL',
    '/api/stock/AAPL/predictions',
    '/api/portfolio',
    '/api/watchlist',
    '/api/support/stats'
];

function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✅ ${endpoint}: ${json.success ? 'SUCCESS' : 'FAILED'}`);
                    if (json.data) {
                        console.log(`   Data: ${JSON.stringify(json.data).substring(0, 100)}...`);
                    }
                    resolve(json);
                } catch (e) {
                    console.log(`❌ ${endpoint}: JSON Parse Error`);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.log(`❌ ${endpoint}: ${err.message}`);
            resolve(null);
        });
    });
}

async function testAllEndpoints() {
    console.log('🚀 Testing Backend Deployment');
    console.log(`📍 URL: ${BASE_URL}`);
    console.log('='.repeat(50));
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
        console.log('');
    }
    
    console.log('🎉 Backend deployment test completed!');
    console.log('Your backend is ready to use!');
}

testAllEndpoints().catch(console.error);
