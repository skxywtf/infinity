"use client";

import React, { useEffect, useState } from 'react';

interface ConsensusWidgetProps {
  onDataFetched?: (data: any) => void;
}

export default function ConsensusWidget({ onDataFetched }: ConsensusWidgetProps) {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsensus = async () => {
      try {
        const response = await fetch('/api/consensus');
        const json = await response.json();
        
        if (json.data) {
          setForecasts(json.data);
          if (onDataFetched) {
            onDataFetched(json.data);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch consensus data:", error);
        setLoading(false);
      }
    };

    fetchConsensus();
  }, [onDataFetched]);

  const groupedData = forecasts.reduce((acc: any, curr: any) => {
    if (!acc[curr.indicator]) acc[curr.indicator] = [];
    acc[curr.indicator].push(curr);
    return acc;
  }, {});

  return (
    <div style={{
      // ── Matte glass surface ──
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '24px',
      width: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{
            margin: '0 0 4px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.3px',
          }}>
            Consensus Estimates
          </h2>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.70)',
            letterSpacing: '0.2px',
          }}>
            Philly Fed Survey of Professional Forecasters
          </p>
        </div>

        {/* Badge */}
        <div style={{
          padding: '4px 10px',
          background: 'rgba(30, 58, 138, 0.30)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(96, 165, 250, 0.25)',
          borderRadius: '6px',
          color: '#60a5fa',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          boxShadow: '0 0 12px rgba(59,130,246,0.12)',
        }}>
          Q-FORECAST
        </div>
      </div>

      {loading ? (
        /* ── Loading state ── */
        <div style={{
          width: '100%',
          height: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          gap: '12px',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(59,130,246,0.80)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.50)',
            fontSize: '11px',
            letterSpacing: '2px',
            fontWeight: 600,
          }}>
            LOADING FORECASTS...
          </span>
        </div>
      ) : (
        /* ── Table ── */
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                {['Indicator', 'Target Quarter', 'Consensus %'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    color: 'rgba(255,255,255,0.70)',
                    fontWeight: 600,
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    textAlign: i === 2 ? 'right' : 'left',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Object.keys(groupedData).map((indicator, idx) => (
                <React.Fragment key={indicator}>

                  {/* ── Group header row ── */}
                  <tr style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderTop: '2px solid rgba(255,255,255,0.10)',
                  }}>
                    <td colSpan={3} style={{
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      letterSpacing: '0.3px',
                    }}>
                      {indicator}
                    </td>
                  </tr>

                  {/* ── Data rows ── */}
                  {groupedData[indicator].map((item: any, itemIdx: number) => {
                    const cleanDate = item.event_date ? item.event_date.split('T')[0] : '---';
                    let displayValue = `${item.consensus.toFixed(1)}%`;
                    if (indicator.toLowerCase().includes('gdp') && item.consensus > 100) {
                      displayValue = `$${(item.consensus / 1000).toFixed(2)}T`;
                    }

                    return (
                      <tr
                        key={`${idx}-${itemIdx}`}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          transition: 'background 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{
                          padding: '12px 16px 12px 32px',
                          color: 'rgba(255,255,255,0.40)',
                          fontSize: '12px',
                        }}>
                          ↳ Target
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          color: 'rgba(255,255,255,0.70)',
                          fontSize: '13px',
                        }}>
                          {cleanDate}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          color: '#60a5fa',
                          fontWeight: 700,
                          fontSize: '13px',
                          textShadow: '0 0 10px rgba(96,165,250,0.35)',
                        }}>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}