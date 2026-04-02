'use client';
import React, { useEffect, useState } from 'react';

interface RegimeData {
  quadrant: string;
  color: string;
  growth_trend: string;
  inflation_trend: string;
  growth_mom_annualized: number;
  cpi_yoy: number;
  cpi_yoy_avg_12m: number;
  calculated_at: string;
}

const QUADRANT_ICONS: Record<string, string> = {
  Goldilocks:  '🟢',
  Reflation:   '🟡',
  Stagflation: '🔴',
  Deflation:   '🔵',
};
const QUADRANT_DESC: Record<string, string> = {
  Goldilocks:  'Growth ↑ · Inflation ↓',
  Reflation:   'Growth ↑ · Inflation ↑',
  Stagflation: 'Growth ↓ · Inflation ↑',
  Deflation:   'Growth ↓ · Inflation ↓',
};

interface RegimeWidgetProps {
  onDataFetched?: (data: any) => void;
}

export default function RegimeWidget({ onDataFetched }: RegimeWidgetProps) {
  const [regime, setRegime]   = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch('/api/regime-v2')
      .then(r => r.json())
      .then(data => {
        setRegime(data);
        setLoading(false);
        if (onDataFetched) onDataFetched(data);
      })
      .catch(() => { setError(true); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accentColor = regime?.color ?? 'rgba(255,255,255,0.20)';

  return (
    <aside style={{
      // ── Glass card — accent border driven by regime color ──
      background: 'rgba(10, 16, 20, 0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: `1px solid ${accentColor}40`,
      borderRadius: 16,
      boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${accentColor}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
      padding: 20,
      transition: 'border-color 0.5s, box-shadow 0.5s',
    }}>

      {/* ── Label ── */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.28)',
        marginBottom: 16,
        letterSpacing: '2px',
      }}>
        MACROREGIME
      </div>

      {/* ── States ── */}
      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>
          Calculating...
        </div>
      )}
      {error && (
        <div style={{ color: '#e05c5c', fontSize: 12 }}>
          Regime unavailable
        </div>
      )}

      {regime && !loading && (
        <>
          {/* ── Active quadrant pill ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            padding: '12px 14px',
            background: `${accentColor}14`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            border: `1px solid ${accentColor}45`,
            boxShadow: `0 0 22px ${accentColor}10`,
          }}>
            <span style={{ fontSize: 20 }}>
              {QUADRANT_ICONS[regime.quadrant] ?? '⬜'}
            </span>
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 900,
                color: accentColor,
                letterSpacing: '-0.5px',
                textShadow: `0 0 14px ${accentColor}55`,
              }}>
                {regime.quadrant.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                {QUADRANT_DESC[regime.quadrant]}
              </div>
            </div>
          </div>

          {/* ── 2 × 2 quadrant grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginBottom: 16,
          }}>
            {(['Goldilocks','Reflation','Deflation','Stagflation'] as const).map(q => {
              const isActive = regime.quadrant === q;
              return (
                <div
                  key={q}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isActive
                      ? `${accentColor}12`
                      : 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    border: `1px solid ${isActive ? accentColor + '55' : 'rgba(255,255,255,0.05)'}`,
                    opacity: isActive ? 1 : 0.35,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    color: isActive ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.38)',
                  }}>
                    {QUADRANT_ICONS[q]} {q}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Stats rows ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                label: 'Growth (3m)',
                value: `${regime.growth_mom_annualized > 0 ? '+' : ''}${regime.growth_mom_annualized}%`,
                color: regime.growth_mom_annualized > 0 ? '#4caf82' : '#e05c5c',
                glow:  regime.growth_mom_annualized > 0
                  ? 'rgba(76,175,130,0.40)'
                  : 'rgba(224,92,92,0.40)',
              },
              {
                label: 'CPI YoY',
                value: `${regime.cpi_yoy}%`,
                color: regime.cpi_yoy < regime.cpi_yoy_avg_12m ? '#4caf82' : '#e05c5c',
                glow:  regime.cpi_yoy < regime.cpi_yoy_avg_12m
                  ? 'rgba(76,175,130,0.40)'
                  : 'rgba(224,92,92,0.40)',
              },
              {
                label: 'CPI 12m Avg',
                value: `${regime.cpi_yoy_avg_12m}%`,
                color: 'rgba(255,255,255,0.38)',
                glow:  'none',
              },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                  {stat.label}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: stat.color,
                  textShadow: stat.glow !== 'none' ? `0 0 8px ${stat.glow}` : 'none',
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}