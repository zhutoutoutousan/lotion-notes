import { NextResponse } from 'next/server';

const SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT",
  "JNJ", "MA", "PG", "HD", "BAC", "KO", "DIS", "PFE", "NFLX", "CSCO",
  "INTC", "PEP", "ABBV", "TMO", "AVGO", "COST", "MRK", "ABT", "DHR", "MCD",
  "TXN", "NKE", "VZ", "CMCSA", "ACN", "ADBE", "CRM", "UNH", "LIN", "PM",
  "ORCL", "AMD", "IBM", "QCOM", "INTU", "AMAT", "T", "LOW", "CAT", "GS"
];

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function fetchStockDataFromAlphaVantage(symbol: string) {
  try {
    // Fetch daily time series data
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`,
      { next: { revalidate: 60 } }
    );

    if (!quoteResponse.ok) {
      throw new Error(`HTTP error! status: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    
    if (quoteData['Error Message'] || quoteData['Note']) {
      throw new Error(quoteData['Error Message'] || quoteData['Note']);
    }

    const timeSeries = quoteData['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error(`No time series data found for ${symbol}`);
    }

    const dates = Object.keys(timeSeries).sort().reverse();
    const latestDate = dates[0];
    const previousDate = dates[1];
    
    if (!latestDate || !previousDate) {
      throw new Error(`Insufficient data for ${symbol}`);
    }

    const latestData = timeSeries[latestDate];
    const previousData = timeSeries[previousDate];

    const currentPrice = parseFloat(latestData['4. close']);
    const previousClose = parseFloat(previousData['4. close']);
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Fetch company overview data
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
      { next: { revalidate: 3600 } }
    );

    if (!overviewResponse.ok) {
      throw new Error(`HTTP error! status: ${overviewResponse.status}`);
    }

    const overviewData = await overviewResponse.json();

    return {
      symbol: symbol,
      name: overviewData.Name || symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: parseInt(latestData['5. volume']),
      marketCap: overviewData.MarketCapitalization ? parseFloat(overviewData.MarketCapitalization) : null,
      peRatio: overviewData.PERatio ? parseFloat(overviewData.PERatio) : null,
      sector: overviewData.Sector || "Unknown",
      dayHigh: parseFloat(latestData['2. high']),
      dayLow: parseFloat(latestData['3. low']),
      fiftyTwoWeekHigh: overviewData['52WeekHigh'] ? parseFloat(overviewData['52WeekHigh']) : null,
      fiftyTwoWeekLow: overviewData['52WeekLow'] ? parseFloat(overviewData['52WeekLow']) : null,
      dividendYield: overviewData.DividendYield ? parseFloat(overviewData.DividendYield) : null,
      sharesOutstanding: overviewData.SharesOutstanding ? parseFloat(overviewData.SharesOutstanding) : null
    };
  } catch (error) {
    console.error(`Error fetching data from Alpha Vantage for ${symbol}:`, error);
    return null;
  }
}

async function fetchStockDataFromYahooFinance(symbol: string) {
  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const quote = data.quoteResponse.result[0];

    if (!quote) {
      throw new Error(`No data found for ${symbol}`);
    }

    return {
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      sector: quote.sector || "Unknown",
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      dividendYield: quote.trailingAnnualDividendYield || 0,
      sharesOutstanding: quote.sharesOutstanding
    };
  } catch (error) {
    console.error(`Error fetching data from Yahoo Finance for ${symbol}:`, error);
    return null;
  }
}

async function fetchStockData(symbol: string) {
  // Try Alpha Vantage first
  let stockData = await fetchStockDataFromAlphaVantage(symbol);
  
  // If Alpha Vantage fails, try Yahoo Finance
  if (!stockData) {
    stockData = await fetchStockDataFromYahooFinance(symbol);
  }
  
  if (!stockData) {
    return {
      symbol,
      error: true,
      message: 'Failed to fetch data from both providers'
    };
  }
  
  return stockData;
}

export async function GET() {
  if (!ALPHA_VANTAGE_API_KEY) {
    return new NextResponse(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Process stocks in batches of 5 to avoid rate limits
        const batchSize = 5;
        for (let i = 0; i < SYMBOLS.length; i += batchSize) {
          const batch = SYMBOLS.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(symbol => fetchStockData(symbol)));
          
          // Send each stock's data as it becomes available
          for (const stock of batchResults) {
            if (!stock.error) {
              controller.enqueue(encoder.encode(JSON.stringify(stock) + '\n'));
            }
          }
          
          // Add delay between batches to avoid rate limits
          if (i + batchSize < SYMBOLS.length) {
            await new Promise(resolve => setTimeout(resolve, 20000));
          }
        }
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 