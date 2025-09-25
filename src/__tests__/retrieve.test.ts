import { Retrieve } from '../retrieve';
import { List } from '../types';

// Mock Playwright completely
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

describe('Retrieve', () => {
  let retrieve: Retrieve;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    retrieve = new Retrieve({
      url: 'https://test.example.com/page',
      pages: 2,
      timeout: 5000
    });

    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined)
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined)
    };

    const { chromium } = require('playwright');
    chromium.launch.mockResolvedValue(mockBrowser);

    // Suppress console.log and console.warn during tests for cleaner output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultRetrieve = new Retrieve();
      expect(defaultRetrieve).toBeDefined();
    });

    it('should merge provided options with defaults', () => {
      const customRetrieve = new Retrieve({
        pages: 5,
        timeout: 10000
      });
      expect(customRetrieve).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should launch browser', async () => {
      await retrieve.initialize();
      expect(mockBrowser).toBeDefined();
    });
  });

  describe('close', () => {
    it('should close browser if initialized', async () => {
      await retrieve.initialize();
      await retrieve.close();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle closing when browser is not initialized', async () => {
      await expect(retrieve.close()).resolves.not.toThrow();
    });
  });

  describe('retrievePage', () => {
    beforeEach(async () => {
      await retrieve.initialize();
    });

    it('should retrieve a single page successfully', async () => {
      const mockData: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      mockPage.evaluate.mockResolvedValue(mockData);

      const result = await retrieve.retrievePage(1);

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://test.example.com/page1',
        { waitUntil: 'domcontentloaded', timeout: 5000 }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        '#content div.wrapperTable table.textualData tbody tr',
        { timeout: 5000 }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle page retrieve errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Navigation failed');
    });
  });

  describe('detectTotalPages', () => {
    beforeEach(async () => {
      await retrieve.initialize();
    });

    it('should detect total pages from pagination links', async () => {
      mockPage.evaluate.mockResolvedValue(3);

      const totalPages = await retrieve.detectTotalPages();

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://test.example.com/page1',
        { waitUntil: 'domcontentloaded', timeout: 5000 }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        '#content div.wrapperTable table.textualData tbody tr',
        { timeout: 5000 }
      );
      expect(totalPages).toBe(3);
    });

    it('should handle browser not initialized error', async () => {
      const uninitializedRetrieve = new Retrieve({
        url: 'https://test.example.com/page',
        timeout: 5000
      });
      
      await expect(uninitializedRetrieve.detectTotalPages()).rejects.toThrow(
        'Browser not initialized. Call initialize() first.'
      );
    });
  });

  describe('retrieveAllPages', () => {
    beforeEach(async () => {
      await retrieve.initialize();
    });

    it('should retrieve all pages and combine results', async () => {
      const page1Data: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System 1',
          manufacturer: 'Test Manufacturer 1',
          date_issuance: '01.01.2023'
        }
      };

      const page2Data: List = {
        '5678-2023': {
          id: '5678',
          year: '2023',
          content: 'Test TSE System 2',
          manufacturer: 'Test Manufacturer 2',
          date_issuance: '02.01.2023'
        }
      };

      mockPage.evaluate
        .mockResolvedValueOnce(page1Data)
        .mockResolvedValueOnce(page2Data);

      const result = await retrieve.retrieveAllPages();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1234-2023']).toEqual(page1Data['1234-2023']);
      expect(result['5678-2023']).toEqual(page2Data['5678-2023']);
    });

    it('should continue retrieve even if one page fails', async () => {
      const page2Data: List = {
        '5678-2023': {
          id: '5678',
          year: '2023',
          content: 'Test TSE System 2',
          manufacturer: 'Test Manufacturer 2',
          date_issuance: '02.01.2023'
        }
      };

      mockPage.evaluate
        .mockRejectedValueOnce(new Error('Page 1 failed'))
        .mockResolvedValueOnce(page2Data);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await retrieve.retrieveAllPages();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve page 1:',
        expect.any(Error)
      );
      expect(result['5678-2023']).toEqual(page2Data['5678-2023']);

      consoleSpy.mockRestore();
    });

    it('should auto-detect pages when pages is not specified', async () => {
      const autoDetectRetrieve = new Retrieve({
        url: 'https://test.example.com/page',
        timeout: 5000
        // pages not specified
      });
      
      await autoDetectRetrieve.initialize();

      const page1Data: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System 1',
          manufacturer: 'Test Manufacturer 1',
          date_issuance: '01.01.2023'
        }
      };

      const page2Data: List = {
        '5678-2023': {
          id: '5678',
          year: '2023',
          content: 'Test TSE System 2',
          manufacturer: 'Test Manufacturer 2',
          date_issuance: '02.01.2023'
        }
      };

      // Mock detectTotalPages to return 2
      jest.spyOn(autoDetectRetrieve, 'detectTotalPages').mockResolvedValue(2);

      mockPage.evaluate
        .mockResolvedValueOnce(page1Data)
        .mockResolvedValueOnce(page2Data);

      const result = await autoDetectRetrieve.retrieveAllPages();

      expect(autoDetectRetrieve.detectTotalPages).toHaveBeenCalled();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1234-2023']).toEqual(page1Data['1234-2023']);
      expect(result['5678-2023']).toEqual(page2Data['5678-2023']);

      await autoDetectRetrieve.close();
    });
  });

  describe('withRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      const mockData: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      // Mock the methods to succeed on second attempt
      jest.spyOn(retrieve, 'initialize')
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      
      jest.spyOn(retrieve, 'retrieveAllPages').mockResolvedValue(mockData);
      jest.spyOn(retrieve, 'close').mockResolvedValue(undefined);

      const result = await retrieve.withRetry(2);

      expect(result).toEqual(mockData);
      expect(retrieve.initialize).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      jest.spyOn(retrieve, 'initialize').mockRejectedValue(new Error('Browser launch failed'));
      jest.spyOn(retrieve, 'close').mockResolvedValue(undefined);

      // Suppress console warnings for this test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await expect(retrieve.withRetry(2)).rejects.toThrow(
        'Failed to retrieve data after 2 attempts'
      );

      // Restore console.warn
      consoleSpy.mockRestore();
    });

    it('should use default maxRetries when not provided', async () => {
      const mockData: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      jest.spyOn(retrieve, 'initialize').mockResolvedValue(undefined);
      jest.spyOn(retrieve, 'retrieveAllPages').mockResolvedValue(mockData);
      jest.spyOn(retrieve, 'close').mockResolvedValue(undefined);

      const result = await retrieve.withRetry();

      expect(result).toEqual(mockData);
    });
  });

  describe('error handling', () => {
    it('should handle browser not initialized error in retrieveAllPages', async () => {
      await expect(retrieve.retrieveAllPages()).rejects.toThrow(
        'Browser not initialized. Call initialize() first.'
      );
    });

    it('should handle browser not initialized error in retrievePage', async () => {
      await expect(retrieve.retrievePage(1)).rejects.toThrow(
        'Browser not initialized'
      );
    });

    it('should handle timeout errors', async () => {
      await retrieve.initialize();
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Timeout');
    });

    it('should handle evaluate errors', async () => {
      await retrieve.initialize();
      mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Evaluation failed');
    });
  });

  describe('browser initialization', () => {
    it('should handle executable path from environment', async () => {
      const originalEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = '/custom/path/chromium';
      
      const { chromium } = require('playwright');
      const launchSpy = jest.spyOn(chromium, 'launch');
      
      await retrieve.initialize();
      
      expect(launchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          executablePath: '/custom/path/chromium'
        })
      );
      
      // Restore environment
      if (originalEnv) {
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = originalEnv;
      } else {
        delete process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      }
    });
  });

  describe('detectTotalPages', () => {
    it('should return a number', async () => {
      await retrieve.initialize();
      
      // Mock the page.evaluate to return a simple number
      mockPage.evaluate.mockResolvedValue(3);

      const result = await retrieve.detectTotalPages();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle page.evaluate errors', async () => {
      await retrieve.initialize();
      
      mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));

      await expect(retrieve.detectTotalPages()).rejects.toThrow('Evaluation failed');
    });
  });

  describe('retrievePage data extraction', () => {
    it('should return data object', async () => {
      await retrieve.initialize();
      
      // Mock the page.evaluate to return sample data
      mockPage.evaluate.mockResolvedValue({
        '0781-2025': {
          id: '0781',
          year: '2025',
          content: 'EPSON USB TSE',
          manufacturer: 'Epson Europe BV',
          date_issuance: '30.04.2025'
        }
      });

      const result = await retrieve.retrievePage(1);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle page.evaluate errors in retrievePage', async () => {
      await retrieve.initialize();
      
      mockPage.evaluate.mockRejectedValue(new Error('Retrieve failed'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Retrieve failed');
    });

    it('should handle waitForSelector timeout', async () => {
      await retrieve.initialize();
      
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Timeout');
    });

    it('should handle page.goto errors', async () => {
      await retrieve.initialize();
      
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(retrieve.retrievePage(1)).rejects.toThrow('Navigation failed');
    });
  });

  describe('retrieveAllPages', () => {
    it('should retrieve multiple pages', async () => {
      await retrieve.initialize();
      
      // Mock detectTotalPages to return 2
      jest.spyOn(retrieve, 'detectTotalPages').mockResolvedValue(2);
      
      // Mock retrievePage to return different data for each page
      jest.spyOn(retrieve, 'retrievePage')
        .mockResolvedValueOnce({ 'page1': { id: '1', year: '2023', content: 'Test 1', manufacturer: 'Test', date_issuance: '01.01.2023' } })
        .mockResolvedValueOnce({ 'page2': { id: '2', year: '2023', content: 'Test 2', manufacturer: 'Test', date_issuance: '02.01.2023' } });

      const result = await retrieve.retrieveAllPages();
      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle retrievePage errors in retrieveAllPages', async () => {
      await retrieve.initialize();
      
      jest.spyOn(retrieve, 'detectTotalPages').mockResolvedValue(2);
      jest.spyOn(retrieve, 'retrievePage')
        .mockResolvedValueOnce({ 'page1': { id: '1', year: '2023', content: 'Test 1', manufacturer: 'Test', date_issuance: '01.01.2023' } })
        .mockRejectedValueOnce(new Error('Page 2 failed'));

      // retrieveAllPages continues even if one page fails, so it should resolve with partial data
      const result = await retrieve.retrieveAllPages();
      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

});


