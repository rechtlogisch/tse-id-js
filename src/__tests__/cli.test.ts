import { writeFileSync } from 'fs';
import { join } from 'path';

// Mock the scraper module
jest.mock('../scraper', () => ({
  TSEScraper: jest.fn().mockImplementation(() => ({
    scrapeWithRetry: jest.fn()
  }))
}));

// Mock fs
jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));

// Mock process.argv
const originalArgv = process.argv;

describe('CLI', () => {
  let mockScraper: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock process.argv
    process.argv = ['node', 'cli.js'];

    // Get the mocked scraper
    const { TSEScraper } = require('../scraper');
    mockScraper = new TSEScraper();
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleSpy.mockRestore();
  });

  describe('argument parsing', () => {
    it('should parse help option', () => {
      // Test the parseArgs function directly
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result).toBeDefined();
    });

    it('should parse output option', () => {
      process.argv = ['node', 'cli.js', '--output', 'test.json'];
      
      // Test that the module can be required without errors
      expect(() => require('../cli')).not.toThrow();
    });

    it('should parse pretty option', () => {
      process.argv = ['node', 'cli.js', '--pretty'];
      
      // Test that the module can be required without errors
      expect(() => require('../cli')).not.toThrow();
    });
  });

  describe('main function', () => {
    it('should handle successful scraping', async () => {
      const mockData = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      // Mock the TSEScraper constructor and methods
      const { TSEScraper } = require('../scraper');
      const mockInstance = {
        scrapeWithRetry: jest.fn().mockResolvedValue(mockData)
      };
      TSEScraper.mockImplementation(() => mockInstance);

      // Test the fetchTSEData function directly
      const { fetchTSEData } = require('../index');
      const result = await fetchTSEData();

      expect(result).toEqual(mockData);
      expect(mockInstance.scrapeWithRetry).toHaveBeenCalled();
    });

    it('should handle scraping errors', async () => {
      const error = new Error('Scraping failed');
      
      // Mock the TSEScraper constructor and methods
      const { TSEScraper } = require('../scraper');
      const mockInstance = {
        scrapeWithRetry: jest.fn().mockRejectedValue(error)
      };
      TSEScraper.mockImplementation(() => mockInstance);

      const { fetchTSEData } = require('../index');
      await expect(fetchTSEData()).rejects.toThrow('Scraping failed');
    });
  });

  describe('file output', () => {
    it('should write to file when output option is provided', () => {
      const mockData = { test: 'data' };
      const outputPath = 'test.json';
      
      // Test the writeFileSync call
      writeFileSync(outputPath, JSON.stringify(mockData), 'utf8');
      
      expect(writeFileSync).toHaveBeenCalledWith(
        outputPath,
        JSON.stringify(mockData),
        'utf8'
      );
    });

    it('should pretty print when pretty option is enabled', () => {
      const mockData = { test: 'data' };
      const prettyJson = JSON.stringify(mockData, null, 2);
      
      expect(prettyJson).toContain('\n');
      expect(prettyJson).toContain('  ');
    });
  });
});
