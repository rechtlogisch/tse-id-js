import { Retrieve } from '../retrieve';

// Integration tests that make real external calls
// These tests are slower and should be run separately
describe('Retrieve Integration Tests', () => {
  let retrieve: Retrieve;

  beforeEach(() => {
    retrieve = new Retrieve({
      url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Zertifizierung-und-Anerkennung/Listen/Zertifizierte-Produkte-nach-TR/Technische_Sicherheitseinrichtungen/TSE_node.html?gts=913608_list%253Dtitle_text_sort%252Bdesc&gtp=913608_list%253D',
      pages: 1, // Limit to 1 page for faster integration tests
      timeout: 10000 // Shorter timeout for faster failure
    });
  });

  afterEach(async () => {
    await retrieve.close();
  });

  describe('Real BSI Website Integration', () => {
    it('should successfully retrieve real BSI data', async () => {
      const data = await retrieve.withRetry(1); // Only 1 retry for faster tests
      
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
      
      // Check that we got some data
      const keys = Object.keys(data);
      expect(keys.length).toBeGreaterThan(0);
      
      // Check structure of first entry
      const firstKey = keys[0];
      const firstEntry = data[firstKey];
      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('year');
      expect(firstEntry).toHaveProperty('content');
      expect(firstEntry).toHaveProperty('manufacturer');
      expect(firstEntry).toHaveProperty('date_issuance');
    }, 30000); // 30 second timeout for integration test

    it('should detect total pages from real website', async () => {
      await retrieve.initialize();
      const totalPages = await retrieve.detectTotalPages();
      
      expect(totalPages).toBeGreaterThan(0);
      expect(typeof totalPages).toBe('number');
    }, 20000); // 20 second timeout

    it('should handle network errors gracefully', async () => {
      // Test with invalid URL to trigger network error
      const invalidRetrieve = new Retrieve({
        url: 'https://invalid-url-that-does-not-exist.com/',
        pages: 1,
        timeout: 5000
      });

      // The retrieve handles errors gracefully by returning empty data
      const result = await invalidRetrieve.withRetry(1);
      expect(result).toEqual({});
    }, 15000);
  });

  describe('Performance Tests', () => {
    it('should retrieve within reasonable time', async () => {
      const startTime = Date.now();
      
      const data = await retrieve.withRetry(1);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(Object.keys(data).length).toBeGreaterThan(0);
    }, 20000);
  });
});
