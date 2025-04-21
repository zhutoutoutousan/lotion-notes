declare module 'yahoo-finance2' {
  interface Quote {
    marketCap?: number;
    earningsGrowth?: number;
    sector?: string;
    [key: string]: any;
  }

  interface ChartQuote {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose: number;
    [key: string]: any;
  }

  interface ChartResult {
    quotes: ChartQuote[];
    [key: string]: any;
  }

  interface ChartOptions {
    period1: Date;
    period2: Date;
    interval: string;
    [key: string]: any;
  }

  export default class YahooFinance {
    static quote(symbol: string): Promise<Quote>;
    static chart(symbol: string, options: ChartOptions): Promise<ChartResult>;
    static suppressNotices(notices: string[]): void;
  }
} 