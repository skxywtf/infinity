import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Optional: Allow the frontend to request sentiment for a specific ticker (e.g., ?ticker=AAPL)
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Alpha Vantage API key missing" }, { status: 500 });
    }

    // Build the URL based on whether a ticker was provided
    let url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&sort=LATEST&apikey=${apiKey}`;
    if (ticker) {
        url += `&tickers=${ticker}`;
    }

    try {
        // Fetch data and cache it for 30 minutes (1800 seconds) to protect your free tier limits!
        const response = await fetch(url, { 
            next: { revalidate: 1800 } 
        });

        if (!response.ok) {
            throw new Error(`Alpha Vantage responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Alpha Vantage sometimes returns an "Information" key if the rate limit is hit
        if (data.Information) {
             return NextResponse.json({ error: "Rate limit reached", details: data.Information }, { status: 429 });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Alpha Vantage Sentiment Error:", error);
        return NextResponse.json({ error: "Failed to fetch sentiment data" }, { status: 500 });
    }
}