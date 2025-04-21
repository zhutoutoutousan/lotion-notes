import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Set proxy for all HTTP requests
if(process.env.NODE_ENV === 'development') {
  process.env.HTTP_PROXY = 'http://127.0.0.1:10809';
  process.env.HTTPS_PROXY = 'http://127.0.0.1:10809';
}

// Suppress deprecation notices
yahooFinance.suppressNotices(['ripHistorical']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    console.log('Fetching stock data for:', ticker);
    // Get chart data with proper options
    const chart = await yahooFinance.chart(ticker, {
      period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      period2: new Date(),
      interval: '1d',
      includePrePost: false,
      events: 'div|split|earn'
    });

    console.log('Chart data:', chart);

    // Extract closing prices from the quotes array
    const prices = chart.quotes.map((quote) => quote.close);

    // Try to get quote data with retries
    let quote;
    let retries = 3;
    while (retries > 0) {
      try {
        quote = await yahooFinance.quote(ticker);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Return the data
    return NextResponse.json({
      prices,
      marketCap: quote?.marketCap || 0,
      earningsGrowth: quote?.earningsGrowth || 0,
      sector: quote?.sector || 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
} 