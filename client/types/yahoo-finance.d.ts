declare module 'yahoo-finance' {
  interface Quote {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose: number;
    symbol: string;
  }

  interface Price {
    marketCap?: number;
    [key: string]: any;
  }

  interface SummaryDetail {
    earningsGrowth?: number;
    sector?: string;
    [key: string]: any;
  }

  interface QuoteResponse {
    price?: Price;
    summaryDetail?: SummaryDetail;
    [key: string]: any;
  }

  export default class YahooFinance {
    static quote(options: { symbol: string; modules: string[] }): Promise<QuoteResponse>;
    static historical(options: {
      symbol: string;
      from: Date;
      to: Date;
      period: string;
    }): Promise<Quote[]>;
  }
} 