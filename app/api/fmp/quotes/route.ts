import { NextResponse } from 'next/server';

export async function GET() {
  // Use the exact name you have in your .env / Vercel settings
  const ALPHA_KEY = process.env.ALPHAVANTAGE_KEY; 
  const symbols = ['SPY', 'QQQ', 'GLD']; 

  try {
    // 1. Fetch Bitcoin (Public API, no key needed)
    const btcRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { 
      next: { revalidate: 30 } 
    });
    const btcData = await btcRes.json();
    
    const btcObject = {
      symbol: "BTC",
      name: "Bitcoin",
      price: parseFloat(btcData.lastPrice) || 0,
      changesPercentage: parseFloat(btcData.priceChangePercent) || 0
    };

    // 2. Fetch Stocks
    const stockPromises = symbols.map(async (symbol) => {
      try {
        // We use ALPHA_KEY here which we defined at the top
        const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`);
        const d = await res.json();
        
        // Alpha Vantage returns an "Information" key if you hit the rate limit
        const q = d["Global Quote"];
        
        if (!q || !q["05. price"]) return null;

        return {
          symbol: q["01. symbol"],
          name: symbol,
          price: parseFloat(q["05. price"]) || 0,
          changesPercentage: parseFloat(q["10. change percent"]?.replace('%', '')) || 0
        };
      } catch (e) { 
        console.error(`Error fetching ${symbol}:`, e);
        return null; 
      }
    });

    const stockResults = (await Promise.all(stockPromises)).filter((item): item is any => item !== null);

    // 3. Combine results
    const finalData = [btcObject, ...stockResults];
    
    return NextResponse.json(finalData);

  } catch (error) {
    console.error("Route Error:", error);
    // Returning an empty array [] prevents the "Application Error" client-side crash
    return NextResponse.json([]);
  }
}