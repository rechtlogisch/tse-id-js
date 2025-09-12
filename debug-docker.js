#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('=== Docker Debug Information ===');

try {
  console.log('1. Node version:');
  console.log(process.version);
  
  console.log('\n2. Playwright version:');
  const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' });
  console.log(playwrightVersion);
  
  console.log('\n3. Browser cache directory:');
  console.log(process.env.PLAYWRIGHT_BROWSERS_PATH || 'Not set');
  
  console.log('\n4. Home directory:');
  console.log(process.env.HOME || 'Not set');
  
  console.log('\n5. Current working directory:');
  console.log(process.cwd());
  
  console.log('\n6. Files in /ms-playwright:');
  try {
    const files = execSync('ls -la /ms-playwright/', { encoding: 'utf8' });
    console.log(files);
  } catch (error) {
    console.log('Directory not found or not accessible');
  }
  
  console.log('\n7. Files in /root/.cache/ms-playwright:');
  try {
    const files = execSync('ls -la /root/.cache/ms-playwright/', { encoding: 'utf8' });
    console.log(files);
  } catch (error) {
    console.log('Directory not found or not accessible');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
