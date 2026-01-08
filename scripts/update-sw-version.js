#!/usr/bin/env node
/**
 * Script to update the service worker build timestamp before each build.
 * This ensures users always get the latest version.
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

try {
  // Read current service worker
  let swContent = fs.readFileSync(SW_PATH, 'utf8');
  
  // Generate new build timestamp
  const buildTime = Date.now().toString();
  
  // Update existing timestamp pattern (matches: const BUILD_TIME = 'anything';)
  swContent = swContent.replace(
    /const BUILD_TIME = '[^']*';/,
    `const BUILD_TIME = '${buildTime}';`
  );
  
  // Write updated service worker
  fs.writeFileSync(SW_PATH, swContent);
  
  console.log(`✅ Service worker updated with build time: ${buildTime}`);
  console.log(`   Cache version: v3-${buildTime}`);
} catch (error) {
  console.error('❌ Failed to update service worker:', error);
  process.exit(1);
}
