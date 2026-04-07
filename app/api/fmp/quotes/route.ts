import { NextResponse } from 'next/server';

export async function GET() {
  const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY;
  const symbols = ['SPY', 'QQQ', 'GLD', 'BTCUSD']; // Using GLD for Gold as it's more stable on free tiers

  try {
    const fetchPromises = symbols.map(async (symbol) => {
      // 1. Handle Crypto via Binance (No key needed, 100% Free)
      if (symbol === 'BTCUSD') {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const d = await res.json();
        return {
          symbol: "BTC",
          price: parseFloat(d.lastPrice),
          changesPercentage: parseFloat(d.priceChangePercent),
          name: "Bitcoin"
        };
      }

      // 2. Handle Stocks/Indices via Alpha Vantage (Free tier)
      const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`);
      const d = await res.json();
      const quote = d["Global Quote"];
      
      return quote ? {
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        changesPercentage: parseFloat(quote["10. change percent"].replace('%', '')),
        name: symbol
      } : null;
    });

    const results = (await Promise.all(fetchPromises)).filter(Boolean);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Data Fetch Failed' }, { status: 500 });
  }
}