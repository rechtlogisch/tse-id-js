export interface TSESystem {
  id: string;
  year: string;
  content: string;
  manufacturer: string;
  date_issuance: string;
}

export interface TSEData {
  [key: string]: TSESystem;
}

export interface ScrapingOptions {
  baseUrl: string;
  maxPages: number;
  timeout: number;
}


