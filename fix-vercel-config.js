#!/usr/bin/env node

/**
 * Fix Vercel Configuration Script
 * This script helps fix the deployment configuration for the Oryn Alert Hub project
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Vercel Configuration...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: Please run this script from the root directory (oryn-alert-hub)');
    process.exit(1);
}

// Create a proper vercel.json for the backend-api directory
const backendVercelConfig = {
    "version": 2,
    "functions": {
        "api/index.js": {
            "maxDuration": 60
        }
    },
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "/api/index.js"
        },
        {
            "src": "/(.*)",
            "dest": "/api/index.js"
        }
    ],
    "env": {
        "NODE_ENV": "production",
        "CORS_ORIGINS": "https://oryn-pi.vercel.app,https://oryn-pi.vercel.app",
        "RATE_LIMIT_WINDOW_MS": "60000",
        "RATE_LIMIT_MAX_REQUESTS": "100"
    }
};

// Write the backend vercel.json
const backendVercelPath = path.join('backend-api', 'vercel.json');
fs.writeFileSync(backendVercelPath, JSON.stringify(backendVercelConfig, null, 2));
console.log('✅ Created backend-api/vercel.json');

// Create deployment instructions
const deploymentInstructions = `
# Vercel Deployment Instructions

## For Frontend (Next.js):
1. Go to Vercel Dashboard
2. Create a new project
3. Connect your GitHub repository
4. Settings:
   - Root Directory: (leave empty)
   - Framework: Next.js
   - Build Command: npm run build
   - Output Directory: .next

## For Backend API (Express.js):
1. Go to Vercel Dashboard
2. Create a new project
3. Connect your GitHub repository
4. Settings:
   - Root Directory: backend-api
   - Framework: Other
   - Build Command: npm install
   - Output Directory: (leave empty)

## Environment Variables:

### Frontend:
- NEXT_PUBLIC_BASE_URL=https://your-frontend-domain.vercel.app
- NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
- BACKEND_URL=https://your-backend-domain.vercel.app

### Backend:
- NODE_ENV=production
- CORS_ORIGINS=https://your-frontend-domain.vercel.app
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX_REQUESTS=100

## Quick Deploy Commands:
\`\`\`bash
# Deploy frontend
vercel --prod

# Deploy backend
cd backend-api
vercel --prod
\`\`\`
`;

fs.writeFileSync('VERCEL_DEPLOYMENT_INSTRUCTIONS.md', deploymentInstructions);
console.log('✅ Created VERCEL_DEPLOYMENT_INSTRUCTIONS.md');

console.log('\n🎉 Configuration fixed!');
console.log('📝 Next steps:');
console.log('1. Read VERCEL_DEPLOYMENT_INSTRUCTIONS.md for detailed steps');
console.log('2. Deploy frontend from root directory: vercel --prod');
console.log('3. Deploy backend from backend-api directory: cd backend-api && vercel --prod');
console.log('4. Update environment variables in Vercel dashboard');
