declare module 'yfinance' {
  export class Ticker {
    constructor(ticker: string);
    info: Promise<{
      marketCap?: number;
      earningsGrowth?: number;
      sector?: string;
      [key: string]: any;
    }>;
    history(options: {
      period: string;
      interval: string;
    }): Promise<{
      Close: {
        values: number[];
      };
      [key: string]: any;
    }>;
  }
} 