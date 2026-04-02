import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Grab the stock symbol from the URL (e.g., /api/finnhub/quote?symbol=AAPL)
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const apiKey = process.env.FINNHUB_API_KEY;

    try {
        // Fetch data directly from Finnhub
        const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds to avoid hitting rate limits
        );

        if (!response.ok) {
            throw new Error(`Finnhub API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Finnhub Quote Error:", error);
        return NextResponse.json({ error: "Failed to fetch data from Finnhub" }, { status: 500 });
    }
}