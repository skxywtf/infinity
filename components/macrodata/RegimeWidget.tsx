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

export default function RegimeWidget() {
  const [regime, setRegime] = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/regime')
      .then(r => r.json())
      .then(data => { setRegime(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const borderColor = regime?.color ?? '#444';

  return (
    <aside style={{
      background: '#0b0f0f',
      border: `1px solid ${borderColor}44`,
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '16px', letterSpacing: '1px' }}>
        MACRO REGIME
      </div>

      {loading && <div style={{ color: '#444', fontSize: '12px' }}>Calculating...</div>}
      {error  && <div style={{ color: '#e05c5c', fontSize: '12px' }}>Regime unavailable</div>}

      {regime && !loading && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
            padding: '10px 14px',
            background: `${borderColor}18`,
            borderRadius: '10px',
            border: `1px solid ${borderColor}55`,
          }}>
            <span style={{ fontSize: '20px' }}>{QUADRANT_ICONS[regime.quadrant] ?? '⬜'}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: borderColor, letterSpacing: '-0.5px' }}>
                {regime.quadrant.toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                {QUADRANT_DESC[regime.quadrant]}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px',
          }}>
            {('Goldilocks','Reflation','Deflation','Stagflation'] as const).map(q => (
              <div key={q} style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: regime.quadrant === q ? `${QUADRAMSICONS[q] ? '#1a1a1a' : '#111'}` : '#0f1212',
                border: `1px solid ${regime.quadrant === q ? borderColor + '66' : '#1b2226'}`,
                opacity: regime.quadrant === q ? 1 : 0.35,
              }}>
                <div style={{ fontSize: '10px', color: '#888', letterSpacing: '0.5px' }}>
                  {QUADRANT_ICONS[q]} {q}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <StatRow
              label="Growth (3m Ann.)"
              value={`${regime.growth_mom_annualized > 0 ? '+' : ''}${regime.growth_mom_annualized}%`}
              positive={regime.growth_mom_annualized > 0}
            />
            <StatRow
              label="CPI YoY"
              value={`${regime.cpi_yoy}%`}
              positive={regime.cpi_yoy < regime.cpi_yoy_avg_12m}
            />
            <StatRow
              label="CPI 12m Avg"
              value={`${regime.cpi_yoy_avg_12m}%`}
              neutral
            />
          </div>

          <div style={{ marginTop: '14px', fontSize: '10px', color: '#333', letterSpacing: '0.5px' }}>
            UPDATED {new Date(regime.calculated_at).toLocaleDateString()}
          </div>
        </>
      )}
    </aside>
  );
}

function StatRow({ label, value, positive, neutral }: {
  label: string; value: string; positive?: boolean; neutral?: boolean;
}) {
  const color = neutral ? '#666' : positive ? '#4caf82' : '#e05c5c';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', color: '#666' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
