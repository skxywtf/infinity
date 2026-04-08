import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Pulls the API key exactly as you named it in your .env / Vercel
    const apiKey = process.env.FRED_API_KEY; 
    
    if (!apiKey) {
      throw new Error("Missing FRED_API_KEY environment variable");
    }

    // TB3MS = 3-Month Treasury Bill. frequency=a gives us the Annual average.
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=TB3MS&frequency=a&file_type=json&api_key=${apiKey}`;
    
    const res = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour to stay well within rate limits
    });
    
    if (!res.ok) {
      throw new Error(`FRED HTTP Error: ${res.status}`);
    }
    
    const data = await res.json();
    const observations = data.observations || [];
    
    // FRED returns historical data oldest-first. Grab the last 5 entries.
    const recentObs = observations.slice(-5);
    
    const formattedData = recentObs.map((item: any) => ({
      // FRED dates look like "2024-01-01", so we extract just the first 4 characters for the year
      year: item.date.substring(0, 4), 
      // Ensure the value maps correctly, defaulting to 0 if FRED returns "." for missing data
      value: item.value !== "." ? parseFloat(item.value).toFixed(2) + '%' : '0.00%',
      indicator: "US T-Bill Rate"
    }));

    // Reverse it so the newest year is at the top, matching your World Bank GDP list
    return NextResponse.json(formattedData.reverse());

  } catch (error: any) {
    console.warn("FRED API Failed, using fallback data:", error.message);
    
    // We keep the bulletproof fallback just in case FRED goes down for maintenance!
    const fallbackData = [
      { year: '2025', value: '0.00%', indicator: 'US T-Bill Rate' },
      { year: '2024', value: '5.25%', indicator: 'US T-Bill Rate' },
      { year: '2023', value: '5.02%', indicator: 'US T-Bill Rate' },
      { year: '2022', value: '2.01%', indicator: 'US T-Bill Rate' },
      { year: '2021', value: '0.04%', indicator: 'US T-Bill Rate' }
    ];

    return NextResponse.json(fallbackData);
  }
}