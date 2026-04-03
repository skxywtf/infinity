"use client";

import { useEffect, useState } from "react";

interface QuoteData {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

export default function TickerCard({
  symbol,
  name,
  onDataFetched,
}: {
  symbol: string;
  name?: string;
  onDataFetched?: (data: any) => void;
}) {
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/finnhub/quote?symbol=${symbol}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (onDataFetched) {
            onDataFetched({ symbol: name || symbol, price: json.c, change: json.dp });
          }
        }
      } catch (error) {
        console.error("Failed to fetch quote", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 60000);
    return () => clearInterval(interval);
  }, [symbol, name, onDataFetched]);

  if (loading) {
    return (
      <div style={{
        minWidth: '200px',
        width: '200px',
        height: '130px',
        // ── Matte glass skeleton ──
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        {/* Skeleton lines */}
        <div style={{
          height: '12px', width: '40%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '4px',
          animation: 'shimmer-pulse 1.8s ease-in-out infinite',
        }} />
        <div style={{
          height: '22px', width: '55%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '4px',
          animation: 'shimmer-pulse 1.8s ease-in-out infinite',
        }} />
        <div style={{
          height: '10px', width: '70%',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          animation: 'shimmer-pulse 1.8s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes shimmer-pulse {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1;   }
          }
        `}</style>
      </div>
    );
  }

  if (!data) return null;

  const isPositive  = data.d >= 0;
  const accentColor = isPositive ? '#4caf50' : '#ff5252';
  const glowColor   = isPositive
    ? 'rgba(76,175,80,0.30)'
    : 'rgba(255,82,82,0.30)';
  const arrow = isPositive ? '↑' : '↓';

  return (
    <div
      style={{
        minWidth: '200px',
        width: '200px',
        // ── Matte glass card ──
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '14px',
        padding: '18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
        fontFamily: 'sans-serif',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        e.currentTarget.style.boxShadow   = `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.10)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        e.currentTarget.style.boxShadow   = '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.07)';
      }}
    >
      {/* ── Header: name + badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.5px',
        }}>
          {name || symbol.toUpperCase()}
        </span>

        <span style={{
          padding: '3px 7px',
          background: `${accentColor}18`,
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: `1px solid ${accentColor}40`,
          borderRadius: '6px',
          color: accentColor,
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          boxShadow: `0 0 8px ${glowColor}`,
        }}>
          {arrow} {Math.abs(data.dp).toFixed(2)}%
        </span>
      </div>

      {/* ── Main price ── */}
      <div>
        <div style={{
          fontSize: '26px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}>
          ${data.c.toFixed(2)}
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: accentColor,
          marginTop: '3px',
          textShadow: `0 0 8px ${glowColor}`,
        }}>
          {isPositive ? '+' : '-'}${Math.abs(data.d).toFixed(2)} Today
        </div>
      </div>

      {/* ── H / L footer ── */}
      <div style={{
        marginTop: '4px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.50)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>H:</span>
          <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 600 }}>
            ${data.h.toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>L:</span>
          <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 600 }}>
            ${data.l.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}