const fs = require('fs');
const path = require('path');

// Copy server-simple.js from dist to api directory
const sourceFile = path.join(__dirname, 'dist', 'server-simple.js');
const destFile = path.join(__dirname, 'api', 'server-simple.js');

try {
  // Ensure api directory exists
  const apiDir = path.join(__dirname, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ Server copied to api directory successfully');
} catch (error) {
  console.error('❌ Error copying server:', error.message);
  process.exit(1);
}
