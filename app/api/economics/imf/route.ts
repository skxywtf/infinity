import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A.US.FITB_PA', {
      next: { revalidate: 3600 }
    });
    
    const data = await res.json();
    
    const series = data?.CompactData?.DataSet?.Series;
    const obs = series?.Obs || [];
    
    const formattedData = obs.map((item: any) => ({
      year: item['@TIME_PERIOD'],
      value: parseFloat(item['@OBS_VALUE']).toFixed(2) + '%',
      indicator: "US T-Bill Rate"
    })).slice(-5); 

    return NextResponse.json(formattedData.reverse());
  } catch (error) {
    console.error("IMF API Error:", error);
    return NextResponse.json({ error: "Failed to fetch IMF data" }, { status: 500 });
  }
}