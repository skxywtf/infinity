import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // NY.GDP.MKTP.CD is the World Bank indicator for GDP (current US$)
    // We limit it to the 5 most recent data points
    const res = await fetch('https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json&per_page=5', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    const data = await res.json();
    
    // The World Bank returns metadata in index 0, and the actual data in index 1
    const rawData = data[1] || [];
    
    // Format the data for our frontend
    const formattedData = rawData.map((item: any) => ({
      year: item.date,
      value: (item.value / 1000000000000).toFixed(2) + 'T', // Convert to Trillions
      indicator: "US GDP"
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("World Bank API Error:", error);
    return NextResponse.json({ error: "Failed to fetch World Bank data" }, { status: 500 });
  }
}