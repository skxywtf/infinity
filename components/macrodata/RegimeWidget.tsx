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
  const [regime, setRegime] = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/regime')
      .then(r => r.json())
      .then(data => { 
        setRegime(data); 
        setLoading(false); 
        if (onDataFetched) {
          onDataFetched(data);
        }
      })
      .catch(() => { setError(true); setLoading(false); });
      
    // THE FIX: Empty array guarantees this runs EXACTLY ONCE on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const borderColor = regime?.color ?? '#444';

  return (
    <aside style={{ background: '#0b0f0f', border: `1px solid ${borderColor}44`, borderRadius: '16px', padding: '20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '16px', letterSpacing: '1px' }}>MACROREGIME</div>
      {loading && <div style={{ color: '#444' }}>Calculating...</div>}
      {error && <div style={{ color: '#e05c5c' }}>Regime unavailable</div>}
      {regime && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 14px', background: `${borderColor}18`, borderRadius: '10px', border: `1px solid ${borderColor}55` }}>
            <span style={{ fontSize: '20px' }}>{QUADRANT_ICONS[regime.quadrant] ?? '⬜'}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: borderColor, letterSpacing: '-0.5px' }}>{regime.quadrant.toUpperCase()}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>{QUADRANT_DESC[regime.quadrant]}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            {(['Goldilocks','Reflation','Deflation','Stagflation'] as const).map(q => (
              <div key={q} style={{ padding: '8px 10px', borderRadius: '8px', background: regime.quadrant===q?'#1a1a1a':'#0f1212', border: `1px solid ${regime.quadrant===q?borderColor+'66':'#1b2226'}`, opacity: regime.quadrant===q?1:0.35 }}>
                <div style={{ fontSize: '10px', color: '#888' }}>{QUADRANT_ICONS[q]} {q}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: '#666' }}>Growth (3m)</span><span style={{ fontSize: '12px', fontWeight: 700, color: regime.growth_mom_annualized>0?'#4caf82':'#e05c5c' }}>{regime.growth_mom_annualized>0?'+':''}{regime.growth_mom_annualized}%</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: '#666' }}>CPIYoY</span><span style={{ fontSize: '12px', fontWeight: 700, color: regime.cpi_yoy<regime.cpi_yoy_avg_12m?'#4caf82':'#e05c5c' }}>{regime.cpi_yoy}%</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: '#666' }}>CPI12mAvg</span><span style={{ fontSize: '12px', fontWeight: 700, color: '#666' }}>{regime.cpi_yoy_avg_12m}%</span></div>
          </div>
        </>
      )}
    </aside>
  );
}