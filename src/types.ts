export interface Tse {
  id: string;
  year: string;
  content: string;
  manufacturer: string;
  date_issuance: string;
}

export interface List {
  [key: string]: Tse;
}

export interface Options {
  url: string;
  timeout: number;
  pages?: number; // typically auto-detected
}


