import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = process.env.FMP_KEY; 
  
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  // The symbols you want in your sidebar
  const symbols = ['SPY', 'QQQ', 'GCUSD', 'CLUSD', 'DXUSD', 'BTCUSD']; 

  try {
    // We fetch each symbol individually using the 'stable/quote' link that worked for you
    const fetchPromises = symbols.map(symbol => 
      fetch(`https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${API_KEY}`, {
        next: { revalidate: 60 } // Refresh data every 60 seconds
      }).then(res => res.json())
    );

    const results = await Promise.all(fetchPromises);

    // Results come back as an array of arrays (e.g., [[{spy}], [{qqq}]]), 
    // so we flatten them into one single list for your component.
    const flattenedData = results.flat();

    return NextResponse.json(flattenedData);
  } catch (error) {
    console.error("FMP Individual Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}