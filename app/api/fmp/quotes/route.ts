import { NextResponse } from 'next/server';

export async function GET() {
  // We use your API key here on the server side
  const API_KEY = 'SPfmc8XE3Nw0yL5Odv6yjav4l6L3qV9M'; 
  
  // These are the tickers we want: SP500, Nasdaq, Gold, Crude Oil, US Dollar, Bitcoin
  const symbols = 'SPY,QQQ,GCUSD,CLUSD,DXUSD,BTCUSD'; 

  try {
    // 1. Ask FMP for the data
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`
    );
    
    // 2. Convert their response into JSON format
    const data = await response.json();
    
    // 3. Send it to our frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error("FMP Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}