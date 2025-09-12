import { TSEScraper } from './scraper';
import { TSESystem, TSEData, ScrapingOptions } from './types';

export { TSEScraper } from './scraper';
export { TSESystem, TSEData, ScrapingOptions } from './types';

// Main function for programmatic usage
export async function fetchTSEData(options?: Partial<ScrapingOptions>): Promise<TSEData> {
  const scraper = new TSEScraper(options);
  return await scraper.scrapeWithRetry();
}
