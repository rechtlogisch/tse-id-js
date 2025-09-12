// Simple integration test
const { fetchTSEData } = require('./dist/index');

async function testIntegration() {
  try {
    console.log('Testing TSE data fetching...');
    const data = await fetchTSEData();
    
    console.log(`✅ Successfully fetched ${Object.keys(data).length} TSE entries`);
    
    // Check if we have the expected structure
    const firstKey = Object.keys(data)[0];
    const firstEntry = data[firstKey];
    
    if (firstEntry.id && firstEntry.year && firstEntry.content && firstEntry.manufacturer && firstEntry.date_issuance) {
      console.log('✅ Data structure is correct');
      console.log('Sample entry:', firstEntry);
    } else {
      console.log('❌ Data structure is incorrect');
      console.log('Sample entry:', firstEntry);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testIntegration();


