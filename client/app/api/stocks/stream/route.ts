import { NextResponse } from 'next/server';

const SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT",
  "JNJ", "MA", "PG", "HD", "BAC", "KO", "DIS", "PFE", "NFLX", "CSCO",
  "INTC", "PEP", "ABBV", "TMO", "AVGO", "COST", "MRK", "ABT", "DHR", "MCD",
  "TXN", "NKE", "VZ", "CMCSA", "ACN", "ADBE", "CRM", "UNH", "LIN", "PM",
  "ORCL", "AMD", "IBM", "QCOM", "INTU", "AMAT", "T", "LOW", "CAT", "GS"
];

// You'll need to add this to your .env file: ALPHA_VANTAGE_API_KEY=your_api_key
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function GET() {
  if (!ALPHA_VANTAGE_API_KEY) {
    return new NextResponse(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();
  let isStreamActive = true;
  let updateInterval: NodeJS.Timeout | null = null;
  let currentSymbolIndex = 0;
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    async start(c) {
      controller = c;
      
      const sendStockData = async (symbol: string) => {
        if (!isStreamActive || !controller) return;

        try {
          // Use the TIME_SERIES_DAILY endpoint
          const quoteResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`,
            { next: { revalidate: 60 } }
          );

          if (!quoteResponse.ok) {
            throw new Error(`HTTP error! status: ${quoteResponse.status}`);
          }

          const quoteData = await quoteResponse.json();
          
          if (quoteData['Error Message'] || quoteData['Note']) {
            if (quoteData['Note']?.includes('API call frequency')) {
              await new Promise(resolve => setTimeout(resolve, 60000));
              return sendStockData(symbol);
            }
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

          const stockData = {
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

          if (isStreamActive && controller) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(stockData)}\n\n`));
            } catch (error) {
              console.error('Error enqueueing data:', error);
              isStreamActive = false;
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          if (isStreamActive && controller) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                symbol,
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
              })}\n\n`));
            } catch (error) {
              console.error('Error enqueueing error data:', error);
              isStreamActive = false;
            }
          }
        }
      };

      // Function to process next symbol
      const processNextSymbol = async () => {
        if (!isStreamActive || !controller) return;
        
        const symbol = SYMBOLS[currentSymbolIndex];
        await sendStockData(symbol);
        
        currentSymbolIndex = (currentSymbolIndex + 1) % SYMBOLS.length;
        
        // Add delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 20000));
      };

      // Initial data fetch
      while (currentSymbolIndex < SYMBOLS.length && isStreamActive && controller) {
        await processNextSymbol();
      }

      // Set up periodic updates
      updateInterval = setInterval(async () => {
        if (!isStreamActive || !controller) {
          if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
          }
          return;
        }
        await processNextSymbol();
      }, 30000);

      // Cleanup function
      return () => {
        isStreamActive = false;
        controller = null;
        if (updateInterval) {
          clearInterval(updateInterval);
          updateInterval = null;
        }
      };
    },
    cancel() {
      isStreamActive = false;
      controller = null;
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 