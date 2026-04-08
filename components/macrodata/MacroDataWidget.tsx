'use client';

import { useEffect, useState } from 'react';

// Define the shape of our data
interface MacroData {
  year: string;
  value: string;
  indicator: string;
}

export default function MacroDataWidget() {
  const [wbData, setWbData] = useState<MacroData[]>([]);
  const [imfData, setImfData] = useState<MacroData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both APIs at the same time to save loading time
    const fetchMacroData = async () => {
      try {
        const [wbResponse, imfResponse] = await Promise.all([
          fetch('/api/economics/worldbank'),
          fetch('/api/economics/imf')
        ]);

        const wbJson = await wbResponse.json();
        const imfJson = await imfResponse.json();

        // Safety check to ensure we got arrays back
        setWbData(Array.isArray(wbJson) ? wbJson : []);
        setImfData(Array.isArray(imfJson) ? imfJson : []);
      } catch (error) {
        console.error("Failed to load macro widgets", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-900 text-white rounded-lg animate-pulse">Loading Global Macro Data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      
      {/* World Bank Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
          World Bank (GDP)
        </h3>
        <div className="space-y-2">
          {wbData.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{item.year}</span>
              <span className="text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* IMF Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
          IMF (Interest Rates)
        </h3>
        <div className="space-y-2">
          {imfData.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{item.year}</span>
              <span className="text-green-400 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}