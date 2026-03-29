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
                // Map through each indicator's forecasts
                groupedData[indicator].map((item: any, itemIdx: number) => {
                  
                  // 1. Clean up the date string (e.g., "2025-06-30")
                  const cleanDate = item.event_date ? item.event_date.split('T')[0] : '---';
                  
                  // 2. Format the value properly based on the indicator
                  let displayValue = `${item.consensus.toFixed(1)}%`; // Default to %
                  
                  // If the indicator is GDP, it's actually in Billions. Let's convert to Trillions ($T)
                  if (indicator.toLowerCase().includes('gdp')) {
                     displayValue = `$${(item.consensus / 1000).toFixed(2)}T`;
                  }

                  return (
                    <tr key={`${idx}-${itemIdx}`} className="border-b border-[#1b2226]/50 hover:bg-[#111] transition-colors">
                      <td className="py-3 px-4 text-white font-medium text-sm">
                        {itemIdx === 0 ? indicator : ""}
                      </td>
                      <td className="py-3 px-4 text-[#aaa] text-sm">
                        {cleanDate}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-bold text-sm">
                        {displayValue}
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}