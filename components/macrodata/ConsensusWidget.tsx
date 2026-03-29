"use client";

import React, { useEffect, useState } from 'react';

export default function ConsensusWidget() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsensus = async () => {
      try {
        const response = await fetch('/api/consensus');
        const json = await response.json();
        
        if (json.data) {
          setForecasts(json.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch consensus data:", error);
        setLoading(false);
      }
    };

    fetchConsensus();
  }, []);

  // Group data by indicator so we can display it nicely in a table
  const groupedData = forecasts.reduce((acc: any, curr: any) => {
    if (!acc[curr.indicator]) acc[curr.indicator] = [];
    acc[curr.indicator].push(curr);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-[#0b0f0f] border border-[#1b2226] rounded-2xl shadow-lg w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Consensus Estimates</h2>
          <p className="text-xs text-[#888]">Philly Fed Survey of Professional Forecasters</p>
        </div>
        <div className="px-3 py-1 bg-[#1e3a8a33] border border-[#1e3a8a] rounded text-[#60a5fa] text-xs font-bold">
          Q-FORECAST
        </div>
      </div>
      
      {loading ? (
        <div className="w-full h-40 flex flex-col items-center justify-center bg-[#111] rounded-xl border border-[#1b2226] animate-pulse">
          <div className="w-6 h-6 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-[#888] text-xs">LOADING FORECASTS...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1b2226]">
                <th className="py-3 px-4 text-[#888] font-semibold text-sm">Indicator</th>
                <th className="py-3 px-4 text-[#888] font-semibold text-sm">Target Quarter</th>
                <th className="py-3 px-4 text-[#888] font-semibold text-sm text-right">Consensus %</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedData).map((indicator, idx) => (
                <React.Fragment key={indicator}>
                  {/* --- NEW: VISUAL SEPARATOR HEADER --- */}
                  <tr className="bg-[#141b1f] border-t-2 border-[#1b2226]">
                    <td colSpan={3} className="py-2 px-4 text-white font-bold text-sm tracking-wide">
                      {indicator}
                    </td>
                  </tr>

                  {/* --- DATA ROWS --- */}
                  {groupedData[indicator].map((item: any, itemIdx: number) => {
                    // Clean up the date string
                    const cleanDate = item.event_date ? item.event_date.split('T')[0] : '---';
                    
                    // Default to percentage
                    let displayValue = `${item.consensus.toFixed(1)}%`; 
                    
                    // SMART FALLBACK: If the number is huge (>100), we know Python hasn't been fixed yet. 
                    // Render it as $T. If it's small (e.g., 2.5), we know Python is fixed, render as %.
                    if (indicator.toLowerCase().includes('gdp') && item.consensus > 100) {
                       displayValue = `$${(item.consensus / 1000).toFixed(2)}T`;
                    }

                    return (
                      <tr key={`${idx}-${itemIdx}`} className="border-b border-[#1b2226]/50 hover:bg-[#111] transition-colors">
                        {/* Indent the first column slightly for a grouped look */}
                        <td className="py-3 px-4 pl-8 text-[#555] text-xs">
                          ↳ Target
                        </td>
                        <td className="py-3 px-4 text-[#aaa] text-sm">
                          {cleanDate}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-400 font-bold text-sm">
                          {displayValue}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}