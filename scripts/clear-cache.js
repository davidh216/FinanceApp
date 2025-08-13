#!/usr/bin/env node

/**
 * Development Cache Clearing Utility
 * 
 * This script helps clear browser cache and service worker issues
 * during development. Run this when you're not seeing changes.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 FinanceApp Development Cache Clearing Utility');
console.log('===============================================\n');

// Clear build cache
const buildCachePath = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(buildCachePath)) {
  console.log('🗑️  Clearing build cache...');
  fs.rmSync(buildCachePath, { recursive: true, force: true });
  console.log('✅ Build cache cleared');
} else {
  console.log('ℹ️  No build cache found');
}

// Clear public cache files
const publicPath = path.join(__dirname, '..', 'public');
const cacheFiles = ['sw.js', 'workbox-*.js'];

cacheFiles.forEach(file => {
  const filePath = path.join(publicPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`🗑️  Clearing cache file: ${file}`);
    fs.unlinkSync(filePath);
    console.log(`✅ Cleared: ${file}`);
  }
});

console.log('\n🎯 Next Steps:');
console.log('1. Stop the development server (Ctrl+C)');
console.log('2. Run: npm start');
console.log('3. Clear browser cache: Ctrl+Shift+R');
console.log('4. Or use incognito/private mode');
console.log('\n✨ Cache clearing complete!');
