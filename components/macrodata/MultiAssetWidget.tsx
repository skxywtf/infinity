'use client'; // This tells Next.js this is an interactive frontend component

import React, { useEffect, useState } from 'react';

// This acts as a "blueprint" so TypeScript knows what the data looks like
interface AssetQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
}

export default function MultiAssetWidget() {
  // useState holds our data. It starts as an empty array []
  const [quotes, setQuotes] = useState<AssetQuote[]>([]);
  // We use this to show a loading message while waiting for the data
  const [loading, setLoading] = useState(true);

  // useEffect runs automatically when the component first appears on the screen
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        // Go to the API route we just created in Step 1
        const res = await fetch('/api/fmp/quotes');
        const data = await res.json();
        
        // Save the data to our state and turn off loading
        setQuotes(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load quotes", error);
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []); // The empty brackets mean "only run this once"

  return (
    <aside style={{
      // ── Matte glass surface (Matching your other widgets) ──
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    }}>
      {/* ── Header ── */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.50)',
        letterSpacing: '2px',
      }}>
        LIVE MARKET OVERVIEW
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
          Connecting to markets...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* We "map" over the data array to create a row for each ticker */}
          {quotes.map((asset) => {
            const isPositive = asset.changesPercentage >= 0;
            const color = isPositive ? '#4caf82' : '#ff5252'; // Green or Neon Red

            return (
              <div 
                key={asset.symbol} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Left side: Ticker Symbol */}
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {asset.symbol}
                </span>

                {/* Right side: Price and Percentage */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                    ${asset.price.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: color,
                    textShadow: `0 0 8px ${color}60`, // Glow effect
                    width: '50px',
                    textAlign: 'right'
                  }}>
                    {isPositive ? '+' : ''}{asset.changesPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}