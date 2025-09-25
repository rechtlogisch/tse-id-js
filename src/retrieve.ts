import { chromium, Browser, Page } from 'playwright';
import { List, Options } from './types';

export class Retrieve {
  private browser: Browser | null = null;
  private options: Options;

  constructor(options: Partial<Options> = {}) {
    this.options = {
      url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Zertifizierung-und-Anerkennung/Listen/Zertifizierte-Produkte-nach-TR/Technische_Sicherheitseinrichtungen/TSE_node.html?gts=913608_list%253Dtitle_text_sort%252Bdesc&gtp=913608_list%253D',
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

  async detectTotalPages(): Promise<number> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page: Page = await this.browser.newPage();
    
    try {
      const url = `${this.options.url}1`;
      console.log(`Detecting total pages from: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout 
      });

      // Wait for the table to be present
      await page.waitForSelector('#content div.wrapperTable table.textualData tbody tr', {
        timeout: this.options.timeout
      });

      const totalPages = await page.evaluate(() => {
        // Look for pagination elements - common patterns include:
        // 1. Links with page numbers
        // 2. "Next" button that indicates more pages
        // 3. Page count indicators
        
        let maxPage = 1;
        
        // Method 1: Look for pagination links with various patterns
        const allLinks = document.querySelectorAll('a');
        for (let i = 0; i < allLinks.length; i++) {
          const link = allLinks[i];
          const href = link.getAttribute('href');
          if (href) {
            // Look for various pagination patterns
            const patterns = [
              /[?&]p=(\d+)/,           // ?p=2 or &p=2
              /[?&]page=(\d+)/,       // ?page=2 or &page=2
              /[?&](\d+)$/,           // ?2 or &2 at end
              /gtp=913608_list%253D(\d+)/, // BSI specific pattern
              /page(\d+)/,            // page2, page3, etc.
              /p(\d+)/                // p2, p3, etc.
            ];
            
            for (const pattern of patterns) {
              const match = href.match(pattern);
              if (match) {
                const pageNum = parseInt(match[1]);
                if (pageNum > maxPage) {
                  maxPage = pageNum;
                }
              }
            }
          }
        }

        // Method 2: Look for "Next" button or navigation indicators
        if (maxPage === 1) {
          for (let i = 0; i < allLinks.length; i++) {
            const link = allLinks[i];
            const linkText = link.textContent?.toLowerCase() || '';
            const linkHref = link.getAttribute('href') || '';
            
            // Check for next/weiter buttons
            if (linkText.includes('next') || linkText.includes('weiter') || 
                linkText.includes('>') || linkText.includes('→') ||
                linkHref.toLowerCase().includes('next') || 
                linkHref.toLowerCase().includes('weiter')) {
              maxPage = Math.max(maxPage, 2); // At least 2 pages if there's a next button
            }
          }
        }

        // Method 3: Look for page count text like "Page 1 of 5" or "Seite 1 von 5"
        const pageCountText = document.body.textContent || '';
        const pageCountPatterns = [
          /(?:Page|Seite)\s+\d+\s+(?:of|von)\s+(\d+)/i,
          /(\d+)\s+(?:pages|seiten)/i,
          /showing\s+\d+.*?of\s+(\d+)/i,
          /anzeige\s+\d+.*?von\s+(\d+)/i
        ];
        
        for (const pattern of pageCountPatterns) {
          const match = pageCountText.match(pattern);
          if (match) {
            const foundPages = parseInt(match[1]);
            if (foundPages > maxPage) {
              maxPage = foundPages;
            }
          }
        }

        // Method 4: Look for numbered pagination (1, 2, 3, etc.)
        const numberedLinks = document.querySelectorAll('a[href*="p="], a[href*="page"]');
        for (let i = 0; i < numberedLinks.length; i++) {
          const link = numberedLinks[i];
          const linkText = link.textContent?.trim();
          const pageNum = parseInt(linkText);
          if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum;
          }
        }

        // Method 5: If we still only found 1 page, try to detect if there are more results
        if (maxPage === 1) {
          // Look for indicators that suggest more pages exist
          const hasMoreIndicators = document.body.textContent?.toLowerCase().includes('weiter') ||
                                  document.body.textContent?.toLowerCase().includes('next') ||
                                  document.body.textContent?.toLowerCase().includes('mehr') ||
                                  document.querySelector('a[href*="p=2"]') ||
                                  document.querySelector('a[href*="page=2"]');
          
          if (hasMoreIndicators) {
            maxPage = 3; // Default to 3 pages if we detect pagination indicators
          }
        }

        return maxPage;
      });

      console.log(`Detected ${totalPages} total pages`);
      return totalPages;

    } finally {
      await page.close();
    }
  }

  async retrieveAllPages(): Promise<List> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const allData: List = {};

    // Detect total pages if not specified
    let totalPages = this.options.pages;
    if (!totalPages) {
      totalPages = await this.detectTotalPages();
    }

    console.log(`Retrieving ${totalPages} pages...`);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const pageData = await this.retrievePage(pageNum);
        Object.assign(allData, pageData);
      } catch (error) {
        console.warn(`Failed to retrieve page ${pageNum}:`, error);
        // Continue with other pages even if one fails
      }
    }

    return allData;
  }

  async retrievePage(pageNum: number): Promise<List> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();
    
    try {
      const url = `${this.options.url}${pageNum}`;
      console.log(`Retrieving page ${pageNum}: ${url}`);
      
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
        const data: List = {};

        rows.forEach((row: Element) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            // Column 0: ID (like "BSI-K-TR-1234-2000")
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

  async withRetry(maxRetries: number = 3): Promise<List> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.initialize();
        const data = await this.retrieveAllPages();
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

    throw new Error(`Failed to retrieve data after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
