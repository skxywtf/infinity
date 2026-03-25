"use client";

import React from 'react';

export default function OecdWidget() {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-white mb-2">G20 Macro Coverage (OECD)</h2>
      <p className="text-sm text-slate-400 mb-4">Live data feed connecting...</p>
      
      {/* We will put the real Recharts graph right here in the next step! */}
      <div className="h-64 bg-slate-800 rounded flex items-center justify-center animate-pulse">
        <span className="text-slate-500">Chart Loading...</span>
      </div>
    </div>
  );
}