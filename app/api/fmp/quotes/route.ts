import { NextResponse } from 'next/server';

export async function GET() {
  // Use your exact .env variable name directly
  const symbols = ['SPY', 'QQQ', 'GLD']; 

  try {
    // 1. Fetch Bitcoin (Public API)
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

    // 2. Fetch Stocks using your exact .env name: process.env.ALPHAVANTAGE_KEY
    const stockPromises = symbols.map(async (symbol) => {
      try {
        const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_KEY}`);
        const d = await res.json();
        
        const q = d["Global Quote"];
        
        if (!q || !q["05. price"]) return null;

        return {
          symbol: q["01. symbol"],
          name: symbol,
          price: parseFloat(q["05. price"]) || 0,
          changesPercentage: parseFloat(q["10. change percent"]?.replace('%', '')) || 0
        };
      } catch (e) { 
        return null; 
      }
    });

    const stockResults = (await Promise.all(stockPromises)).filter((item): item is any => item !== null);

    const finalData = [btcObject, ...stockResults];
    
    return NextResponse.json(finalData);

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json([]); 
  }
}