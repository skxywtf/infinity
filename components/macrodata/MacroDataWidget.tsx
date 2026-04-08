'use client';

import { useEffect, useState } from 'react';

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
    const fetchMacroData = async () => {
      try {
        const [wbResponse, imfResponse] = await Promise.all([
          fetch('/api/economics/worldbank'),
          fetch('/api/economics/imf')
        ]);

        const wbJson = await wbResponse.json();
        const imfJson = await imfResponse.json();

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

  // Helper function to handle '0.00T', '0.00%', or '0' strings from the API
  const formatValue = (val: string) => {
    if (!val) return 'TBD';
    
    // parseFloat cleanly strips letters/symbols, turning "0.00T" into the number 0
    const num = parseFloat(val);
    
    // If it parses to exactly 0, the data hasn't been officially released yet
    if (num === 0) return 'TBD';
    
    return val;
  };

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center border border-gray-800 bg-gray-900/30 rounded-xl">
        <span className="text-gray-500 font-mono text-sm animate-pulse">FETCHING MACRO_CORE...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 mb-6">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        <h2 className="text-gray-300 font-bold text-sm tracking-[0.2em] uppercase">
          System: Global_Macro_Snapshot
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World Bank GDP Grid */}
        <div className="bg-black/40 border border-gray-800/50 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-400 text-xs font-semibold tracking-wider">US REAL GDP (WORLD BANK)</h3>
            <span className="text-[10px] text-gray-600 font-mono">ANNUAL (CURRENT US$)</span>
          </div>
          
          <div className="flex flex-col gap-1">
            {wbData.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center py-1.5 border-b border-gray-800/30 last:border-0 ${
                  index === 0 ? 'text-white' : 'text-gray-500' // Highlights the most recent year
                }`}
              >
                <span className="font-mono text-sm">{item.year}</span>
                <span className={`font-mono ${index === 0 ? 'text-lg font-bold text-green-400' : 'text-sm'}`}>
                  {formatValue(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* IMF T-Bill Grid */}
        <div className="bg-black/40 border border-gray-800/50 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-400 text-xs font-semibold tracking-wider">US T-BILL RATE (IMF)</h3>
            <span className="text-[10px] text-gray-600 font-mono">ANNUAL AVG</span>
          </div>
          
          <div className="flex flex-col gap-1">
            {imfData.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center py-1.5 border-b border-gray-800/30 last:border-0 ${
                  index === 0 ? 'text-white' : 'text-gray-500' // Highlights the most recent year
                }`}
              >
                <span className="font-mono text-sm">{item.year}</span>
                <span className={`font-mono ${index === 0 ? 'text-lg font-bold text-yellow-400' : 'text-sm'}`}>
                  {formatValue(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}