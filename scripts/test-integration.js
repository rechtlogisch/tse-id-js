// Simple integration test
const { retrieve } = require('./dist/index');

async function testIntegration() {
  try {
    console.log('Testing retrieve...');
    const data = await retrieve();
    
    console.log(`✅ Successfully retrieved ${Object.keys(data).length} entries`);
    
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


