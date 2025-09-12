import { TSEScraper } from '../scraper';
import { TSEData } from '../types';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

describe('TSEScraper', () => {
  let scraper: TSEScraper;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    scraper = new TSEScraper({
      baseUrl: 'https://test.example.com/page',
      maxPages: 2,
      timeout: 5000
    });

    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn()
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn()
    };

    const { chromium } = require('playwright');
    chromium.launch.mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultScraper = new TSEScraper();
      expect(defaultScraper).toBeDefined();
    });

    it('should merge provided options with defaults', () => {
      const customScraper = new TSEScraper({
        maxPages: 5,
        timeout: 10000
      });
      expect(customScraper).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should launch browser', async () => {
      await scraper.initialize();
      expect(mockBrowser).toBeDefined();
    });
  });

  describe('close', () => {
    it('should close browser if initialized', async () => {
      await scraper.initialize();
      await scraper.close();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle closing when browser is not initialized', async () => {
      await expect(scraper.close()).resolves.not.toThrow();
    });
  });

  describe('scrapePage', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should scrape a single page successfully', async () => {
      const mockData: TSEData = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      mockPage.evaluate.mockResolvedValue(mockData);

      const result = await scraper.scrapePage(1);

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://test.example.com/page1',
        { waitUntil: 'networkidle', timeout: 5000 }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        '#content div.wrapperTable table.textualData tbody tr',
        { timeout: 5000 }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle page scraping errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(scraper.scrapePage(1)).rejects.toThrow('Navigation failed');
    });
  });

  describe('scrapeAllPages', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should scrape all pages and combine results', async () => {
      const page1Data: TSEData = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System 1',
          manufacturer: 'Test Manufacturer 1',
          date_issuance: '01.01.2023'
        }
      };

      const page2Data: TSEData = {
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

      const result = await scraper.scrapeAllPages();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1234-2023']).toEqual(page1Data['1234-2023']);
      expect(result['5678-2023']).toEqual(page2Data['5678-2023']);
    });

    it('should continue scraping even if one page fails', async () => {
      const page2Data: TSEData = {
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

      const result = await scraper.scrapeAllPages();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to scrape page 1:',
        expect.any(Error)
      );
      expect(result['5678-2023']).toEqual(page2Data['5678-2023']);

      consoleSpy.mockRestore();
    });
  });

  describe('scrapeWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      const mockData: TSEData = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      mockPage.evaluate.mockResolvedValue(mockData);

      const result = await scraper.scrapeWithRetry(2);

      expect(result).toEqual(mockData);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should fail after max retries', async () => {
      const { chromium } = require('playwright');
      chromium.launch.mockRejectedValue(new Error('Browser launch failed'));

      await expect(scraper.scrapeWithRetry(2)).rejects.toThrow(
        'Failed to scrape data after 2 attempts'
      );
    });
  });
});


