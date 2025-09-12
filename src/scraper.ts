import { chromium, Browser, Page } from 'playwright';
import { TSESystem, TSEData, ScrapingOptions } from './types';

export class TSEScraper {
  private browser: Browser | null = null;
  private options: ScrapingOptions;

  constructor(options: Partial<ScrapingOptions> = {}) {
    this.options = {
      baseUrl: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Zertifizierung-und-Anerkennung/Listen/Zertifizierte-Produkte-nach-TR/Technische_Sicherheitseinrichtungen/TSE_node.html?gts=913608_list%253Dtitle_text_sort%252Bdesc&gtp=913608_list%253D',
      maxPages: 3,
      timeout: 30000,
      ...options
    };
  }

  async initialize(): Promise<void> {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-zygote'
      ]
    };

    // Use system Chromium if available (for Docker Alpine)
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }

    this.browser = await chromium.launch(launchOptions);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeAllPages(): Promise<TSEData> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const allData: TSEData = {};

    for (let pageNum = 1; pageNum <= this.options.maxPages; pageNum++) {
      try {
        const pageData = await this.scrapePage(pageNum);
        Object.assign(allData, pageData);
      } catch (error) {
        console.warn(`Failed to scrape page ${pageNum}:`, error);
        // Continue with other pages even if one fails
      }
    }

    return allData;
  }

  async scrapePage(pageNum: number): Promise<TSEData> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();
    
    try {
      const url = `${this.options.baseUrl}${pageNum}`;
      console.log(`Scraping page ${pageNum}: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout 
      });

      // Wait for the table to be present
      await page.waitForSelector('#content div.wrapperTable table.textualData tbody tr', {
        timeout: this.options.timeout
      });

      const pageData = await page.evaluate(() => {
        const rows = document.querySelectorAll('#content div.wrapperTable table.textualData tbody tr');
        const data: TSEData = {};

        rows.forEach((row: Element) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            // Extract data from table cells - the actual structure seems to be:
            // Column 0: ID (like "BSI-K-TR-0781-2025")
            // Column 1: Content/Description
            // Column 2: Manufacturer
            // Column 3: Date of issuance
            
            const fullId = cells[0]?.textContent?.trim() || '';
            const content = cells[1]?.textContent?.replace(/\s+/g, ' ').trim() || '';
            const manufacturer = cells[2]?.textContent?.trim() || '';
            const dateIssuance = cells[3]?.textContent?.trim() || '';

            if (fullId) {
              // Extract ID and year from the full ID (e.g., "BSI-K-TR-0781-2025" -> "0781", "2025")
              const idMatch = fullId.match(/BSI-K-TR-(\d+)-(\d+)/);
              if (idMatch) {
                const id = idMatch[1];
                const year = idMatch[2];
                const key = `${id}-${year}`;
                
                data[key] = {
                  id,
                  year,
                  content,
                  manufacturer,
                  date_issuance: dateIssuance
                };
              }
            }
          }
        });

        return data;
      });

      console.log(`Found ${Object.keys(pageData).length} entries on page ${pageNum}`);
      return pageData;

    } finally {
      await page.close();
    }
  }

  async scrapeWithRetry(maxRetries: number = 3): Promise<TSEData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.initialize();
        const data = await this.scrapeAllPages();
        await this.close();
        return data;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await this.close();
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    throw new Error(`Failed to scrape data after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
