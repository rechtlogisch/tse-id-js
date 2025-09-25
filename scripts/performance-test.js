#!/usr/bin/env node

const { performance } = require('perf_hooks');
const { execSync } = require('child_process');
const fs = require('fs');

async function measurePerformance() {
  console.log('🚀 Starting TSE Retrieve Performance Test\n');
  
  const results = {
    coldStart: 0,
    cachedDependencies: 0,
    dataRetrieved: 0,
    timestamp: new Date().toISOString()
  };

  // Test 1: Cold Start (clean environment)
  console.log('📊 Testing Cold Start Performance...');
  const coldStartStart = performance.now();
  
  try {
    // Simulate clean environment by removing node_modules
    if (fs.existsSync('node_modules')) {
      execSync('rm -rf node_modules', { stdio: 'pipe' });
    }
    
    // Install dependencies
    execSync('npm ci', { stdio: 'pipe' });
    
    // Install Playwright browsers
    execSync('npx playwright install --with-deps chromium', { stdio: 'pipe' });
    
    // Build and run
    execSync('npm run build', { stdio: 'pipe' });
    execSync('node dist/cli.js --output cold-start-test.json', { stdio: 'pipe' });
    
    const coldStartEnd = performance.now();
    results.coldStart = Math.round((coldStartEnd - coldStartStart) / 1000);
    
    console.log(`✅ Cold Start: ${results.coldStart}s`);
  } catch (error) {
    console.error('❌ Cold Start failed:', error.message);
  }

  // Test 2: Cached Dependencies
  console.log('\n📊 Testing Cached Dependencies Performance...');
  const cachedStart = performance.now();
  
  try {
    // Run with cached dependencies
    execSync('node dist/cli.js --output cached-test.json', { stdio: 'pipe' });
    
    const cachedEnd = performance.now();
    results.cachedDependencies = Math.round((cachedEnd - cachedStart) / 1000);
    
    console.log(`✅ Cached Dependencies: ${results.cachedDependencies}s`);
  } catch (error) {
    console.error('❌ Cached Dependencies failed:', error.message);
  }

  // Test 3: Data Verification
  console.log('\n📊 Verifying Data Retrieval...');
  try {
    const data = JSON.parse(fs.readFileSync('cached-test.json', 'utf8'));
    results.dataRetrieved = Object.keys(data).length;
    console.log(`✅ Data Retrieved: ${results.dataRetrieved} entries`);
  } catch (error) {
    console.error('❌ Data verification failed:', error.message);
  }

  // Cleanup
  try {
    if (fs.existsSync('cold-start-test.json')) fs.unlinkSync('cold-start-test.json');
    if (fs.existsSync('cached-test.json')) fs.unlinkSync('cached-test.json');
  } catch (error) {
    // Ignore cleanup errors
  }

  // Results Summary
  console.log('\n📈 Performance Test Results:');
  console.log('================================');
  console.log(`Cold Start: ${results.coldStart}s`);
  console.log(`Cached Dependencies: ${results.cachedDependencies}s`);
  console.log(`Data Retrieved: ${results.dataRetrieved} entries`);
  console.log(`Timestamp: ${results.timestamp}`);
  
  // Performance Analysis
  console.log('\n🔍 Performance Analysis:');
  if (results.coldStart > 0 && results.cachedDependencies > 0) {
    const improvement = Math.round(((results.coldStart - results.cachedDependencies) / results.coldStart) * 100);
    console.log(`Caching improvement: ${improvement}% faster`);
  }
  
  if (results.coldStart < 120) {
    console.log('✅ Cold start is under 2 minutes - excellent!');
  } else if (results.coldStart < 180) {
    console.log('⚠️  Cold start is 2-3 minutes - good, but could be improved');
  } else {
    console.log('❌ Cold start is over 3 minutes - needs optimization');
  }
  
  if (results.cachedDependencies < 30) {
    console.log('✅ Cached execution is under 30 seconds - excellent!');
  } else if (results.cachedDependencies < 60) {
    console.log('⚠️  Cached execution is 30-60 seconds - good');
  } else {
    console.log('❌ Cached execution is over 1 minute - needs optimization');
  }

  // Save results
  fs.writeFileSync('performance-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to performance-results.json');
}

if (require.main === module) {
  measurePerformance().catch(console.error);
}

module.exports = { measurePerformance };
