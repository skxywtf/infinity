import { NextResponse } from 'next/server';

export async function GET() {
  // Use the environment variable from Vercel
  const API_KEY = process.env.FMP_KEY; 
  
  if (!API_KEY) {
    console.error("FMP_KEY is missing in environment variables");
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  // Your requested symbols
  const symbols = 'SPY,QQQ,GCUSD,CLUSD,DXUSD,BTCUSD'; 

  try {
    /**
     * UPDATED FOR 2026 STABLE API:
     * 1. Uses /stable/batch-quote instead of /api/v3/quote-short
     * 2. Uses the 'symbols' parameter for multiple tickers
     */
    const url = `https://financialmodelingprep.com/stable/batch-quote?symbols=${symbols}&apikey=${API_KEY}`;
    
    const response = await fetch(url, {
      // Prevents aggressive caching so you get live-ish prices
      next: { revalidate: 60 } 
    });
    
    const data = await response.json();

    // Check if FMP returned an error object instead of an array
    if (data && typeof data === 'object' && data['Error Message']) {
      console.error("FMP API Error Response:", data['Error Message']);
      return NextResponse.json({ error: data['Error Message'] }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("FMP Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}