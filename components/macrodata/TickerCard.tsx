"use client";

import { useEffect, useState } from "react";

interface QuoteData {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
}

export default function TickerCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/finnhub/quote?symbol=${symbol}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch quote", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
    // Optional: Refresh every 60 seconds
    const interval = setInterval(fetchQuote, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="w-64 h-32 bg-gray-900 rounded-xl animate-pulse border border-gray-800 p-4 flex flex-col justify-between">
        <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        <div className="h-8 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.d >= 0;
  const colorClass = isPositive ? "text-green-400" : "text-red-500";
  const bgBadgeClass = isPositive ? "bg-green-400/10" : "bg-red-500/10";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <div className="w-64 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col gap-3 font-sans transition-all hover:border-gray-700">
      {/* Header: Symbol & Badge */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold tracking-wider">{symbol.toUpperCase()}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${colorClass} ${bgBadgeClass}`}>
          {arrow} {Math.abs(data.dp).toFixed(2)}%
        </span>
      </div>

      {/* Main Price */}
      <div>
        <div className="text-3xl font-bold text-white">
          ${data.c.toFixed(2)}
        </div>
        <div className={`text-sm font-medium ${colorClass}`}>
          {isPositive ? "+" : "-"}${Math.abs(data.d).toFixed(2)} Today
        </div>
      </div>

      {/* Secondary Data Footer */}
      <div className="mt-2 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>H:</span> <span className="text-gray-300 font-medium">${data.h.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>L:</span> <span className="text-gray-300 font-medium">${data.l.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}