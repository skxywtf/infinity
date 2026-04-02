'use client';
import React, { useState } from 'react';

interface VintageTrackerProps {
  onDataFetched?: (data: any) => void;
}

export default function VintageTracker({ onDataFetched }: VintageTrackerProps) {
  const [seriesId, setSeriesId]       = useState('GDP');
  const [vintageDate, setVintageDate] = useState('2020-04-29');
  const [vintageData, setVintageData] = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  const fetchVintage = async () => {
    setIsLoading(true);
    setError('');
    setVintageData([]);
    try {
      const response = await fetch(`/api/vintage/${seriesId}?date=${vintageDate}`);
      const data     = await response.json();
      if (data.error) {
        setError(data.error);
        if (onDataFetched) onDataFetched(null);
      } else {
        const revData = data.reverse();
        setVintageData(revData);
        if (onDataFetched) {
          onDataFetched({
            title: `ALFRED Vintage Data Snapshot for ${seriesId}`,
            source: `ALFRED (Snapshot taken on ${vintageDate})`,
            series_id: seriesId,
            description: `Historical unrevised data exactly as it looked on ${vintageDate}.`,
            data_values: revData.slice(0, 15),
          });
        }
      }
    } catch {
      setError('Failed to connect to the server.');
      if (onDataFetched) onDataFetched(null);
    }
    setIsLoading(false);
  };

  // ── shared input style ──────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)',
    outline: 'none',
    fontSize: 13,
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      // ── Glass card ──
      background: 'rgba(10, 16, 20, 0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: 30,
      textAlign: 'left',
    }}>

      {/* ── Header ── */}
      <h2 style={{
        color: '#d4af37',
        margin: '0 0 10px 0',
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: '-0.3px',
        textShadow: '0 0 16px rgba(212,175,55,0.30)',
      }}>
        ALFRED Vintage Data Tracker
      </h2>
      <p style={{
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        marginBottom: 28,
        lineHeight: 1.6,
      }}>
        Select an economic indicator and a historical date to see exactly what the
        data looked like on that specific day, before any government revisions.
      </p>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>

        {/* Series selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.40)',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}>
            ECONOMIC INDICATOR
          </label>
          <select
            value={seriesId}
            onChange={e => setSeriesId(e.target.value)}
            style={{ ...inputBase, minWidth: 220 }}
            onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)')}
            onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <option value="GDP">Real GDP (Quarterly)</option>
            <option value="CPIAUCSL">CPI Inflation (Monthly)</option>
            <option value="PAYEMS">Nonfarm Payrolls / Jobs (Monthly)</option>
            <option value="UNRATE">Unemployment Rate (Monthly)</option>
          </select>
        </div>

        {/* Date picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.40)',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}>
            VINTAGE DATE (SNAPSHOT)
          </label>
          <input
            type="date"
            value={vintageDate}
            onChange={e => setVintageDate(e.target.value)}
            style={{ ...inputBase }}
            onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)')}
            onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* Fetch button */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <button
            onClick={fetchVintage}
            disabled={isLoading}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              background: isLoading
                ? 'rgba(212,175,55,0.25)'
                : 'rgba(212,175,55,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(212,175,55,0.30)',
              color: isLoading ? 'rgba(0,0,0,0.40)' : '#000',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '1px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 2px 16px rgba(212,175,55,0.28)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 4px 22px rgba(212,175,55,0.42)'; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 2px 16px rgba(212,175,55,0.28)'; }}
          >
            {isLoading ? 'FETCHING DATA…' : 'GET VINTAGE PRINT'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(224,92,92,0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#e05c5c',
          borderRadius: 8,
          border: '1px solid rgba(224,92,92,0.20)',
          marginBottom: 20,
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ── Data table ── */}
      {vintageData.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>

          {/* Table header */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.40)',
            fontSize: 11,
            letterSpacing: '1px',
          }}>
            <span>OBSERVATION DATE</span>
            <span>REPORTED VALUE</span>
          </div>

          {/* Rows */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {vintageData.slice(0, 50).map((row, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={index}
                  style={{
                    padding: '11px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: isLatest ? '#d4af37' : 'rgba(255,255,255,0.75)',
                    fontWeight: isLatest ? 700 : 400,
                    background: isLatest
                      ? 'rgba(212,175,55,0.06)'
                      : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isLatest) e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                  }}
                  onMouseLeave={e => {
                    if (!isLatest) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{row.date}</span>
                  <span style={{
                    textShadow: isLatest ? '0 0 10px rgba(212,175,55,0.40)' : 'none',
                  }}>
                    {row.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '9px 16px',
            textAlign: 'center',
            fontSize: 11,
            color: 'rgba(255,255,255,0.20)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            Showing the 50 most recent observations prior to {vintageDate}
          </div>
        </div>
      )}
    </div>
  );
}