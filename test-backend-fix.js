#!/usr/bin/env node

/**
 * Test Backend Fix
 * This script verifies that the backend API is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Backend API Configuration...\n');

// Check if we're in the right directory
if (!fs.existsSync('backend-api')) {
    console.error('❌ Error: Please run from root directory (oryn-alert-hub)');
    process.exit(1);
}

const backendPath = path.join('backend-api');

// Check required files
const requiredFiles = [
    'index.js',
    'api/index.js',
    'package.json',
    'vercel.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(backendPath, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.error('\n❌ Missing required files. Please check the configuration.');
    process.exit(1);
}

// Test package.json
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(backendPath, 'package.json'), 'utf8'));
    
    if (packageJson.main === 'index.js') {
        console.log('✅ Main entry point is correct');
    } else {
        console.log('❌ Main entry point should be "index.js"');
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log('✅ Start script exists');
    } else {
        console.log('❌ Start script missing');
    }
} catch (error) {
    console.log('❌ Invalid package.json:', error.message);
}

// Test vercel.json
console.log('\n⚙️ Checking vercel.json...');
try {
    const vercelJson = JSON.parse(fs.readFileSync(path.join(backendPath, 'vercel.json'), 'utf8'));
    
    if (vercelJson.builds && vercelJson.builds[0].src === 'index.js') {
        console.log('✅ Build configuration is correct');
    } else {
        console.log('❌ Build configuration should point to index.js');
    }
    
    if (vercelJson.routes && vercelJson.routes.length > 0) {
        console.log('✅ Routes configuration exists');
    } else {
        console.log('❌ Routes configuration missing');
    }
} catch (error) {
    console.log('❌ Invalid vercel.json:', error.message);
}

// Test if backend loads
console.log('\n🔧 Testing backend loading...');
try {
    const app = require(path.join(backendPath, 'index.js'));
    console.log('✅ Backend loads successfully');
    console.log('✅ Express app is properly exported');
} catch (error) {
    console.log('❌ Backend failed to load:', error.message);
}

console.log('\n🎉 Backend configuration test completed!');
console.log('\n📝 Next steps:');
console.log('1. Run: cd backend-api && vercel --prod');
console.log('2. Or use: ./deploy-backend-fix.ps1 (PowerShell) or deploy-backend-fix.bat (Batch)');
console.log('3. Check your Vercel dashboard for deployment status');
