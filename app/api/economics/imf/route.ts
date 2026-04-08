import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. We added standard headers to prevent the IMF API from blocking the cloud server
    const res = await fetch('http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A.US.FITB_PA', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });
    
    // 2. Catch bad status codes from the IMF before trying to parse JSON
    if (!res.ok) {
      throw new Error(`IMF responded with status: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    const series = data?.CompactData?.DataSet?.Series;
    const obs = series?.Obs || [];
    
    const formattedData = obs.map((item: any) => ({
      year: item['@TIME_PERIOD'],
      value: parseFloat(item['@OBS_VALUE']).toFixed(2) + '%',
      indicator: "US T-Bill Rate"
    })).slice(-5); 

    return NextResponse.json(formattedData.reverse());
  } catch (error: any) {
    console.error("IMF API Error Details:", error.message || error);
    
    // 3. We are now returning the EXACT error details to your frontend console!
    return NextResponse.json({ 
      error: "Failed to fetch IMF data", 
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
}