import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  if (!ALPHA_VANTAGE_API_KEY) {
    return new NextResponse(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { symbol } = params;

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

    return new NextResponse(JSON.stringify(stockData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return new NextResponse(JSON.stringify({ 
      symbol,
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 