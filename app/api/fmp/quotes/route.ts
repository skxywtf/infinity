import { NextResponse } from 'next/server';

export async function GET() {
  // Use the environment variable instead of the hardcoded string
  const API_KEY = process.env.FMP_KEY; 
  
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  const symbols = 'SPY,QQQ,GCUSD,CLUSD,DXUSD,BTCUSD'; 

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote-short/AAPL,MSFT,BTCUSD,EURUSD?apikey=${process.env.FMP_KEY}`
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("FMP Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}