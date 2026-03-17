'use client';
import React, { useEffect, useState } from 'react';

interface SkoreEntry { score: number; tag: 'Buy' | 'Hold' | 'Sell' | 'Watch'; rationale: string; }
interface RegimeInfo { growth_trend: string; inflation_trend: string; quadrant: string; }
interface Brief { id: string; generated_at: string; brief_type: string; trigger_series: string; content_md: string; skore_json: Record<string, SkoreEntry> | string; regime_json: RegimeInfo | string; }

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  Buy:   { bg: 'rgba(76,175,130,0.12)',  color: '#4caf82' },
  Sell:  { bg: 'rgba(224,92,92,0.12)',   color: '#e05c5c' },
  Hold:  { bg: 'rgba(245,158,66,0.12)',  color: '#f59e42' },
  Watch: { bg: 'rgba(74,144,217,0.12)',  color: '#4a90d9' },
};

function scoreBar(score: number) {
  const filled = Math.round(score);
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: '14px', height: '6px', borderRadius: '2px',
          background: i < filled ? (score >= 7 ? '#4caf82' : score >= 4 ? '#f59e42' : '#e05c5c') : '#1b2226',
          transition: '0.2s' }} />
      ))}
      <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px', fontWeight: 700 }}>{score}/10</span>
    </div>
  );
}

export default function MacroBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGen] = useState(false);
  const [error, setError] = useState('');

  const fetchLatest = () => {
    setLoading(true);
    fetch('/api/brief/latest')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setBrief(data); setLoading(false); })
      .catch(code => { setLoading(false); setError(code === 404 ? 'No brief yet. Click Generate.' : 'Failed to load.'); });
  };

  useEffect(() => { fetchLatest(); }, []);

  const generate = async () => {
    setGen(true); setError('');
    try {
      const res = await fetch('/api/brief/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_series: 'manual', brief_type: 'daily' }),
      });
      if (!res.ok) throw new Error('Generation failed');
      await fetchLatest();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    setGen(false);
  };

  const skore = brief ? (typeof brief.skore_json === 'string' ? JSON.parse(brief.skore_json) : (brief.skore_json ?? {})) : {};
  const regime = brief ? (typeof brief.regime_json === 'string' ? JSON.parse(brief.regime_json) : (brief.regime_json ?? null)) : null;

  return (
    <div style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>WTF Macro Brief</h3>
          {brief && <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#444' }}>Generated {new Date(brief.generated_at).toLocaleString()}</p>}
        </div>
        <button onClick={generate} disabled={generating} style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, border: '1px solid #d4af37', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', background: generating ? '#1b2226' : 'transparent', color: generating ? '#666' : '#d4af37' }}>
          {generating ? 'GENERATING...' : 'GENERATE'}
        </button>
      </div>
      {error && <div style={{ color: '#f59e42', fontSize: '12px', padding: '10px 14px', background: 'rgba(245,158,66,0.08)', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {loading && !error && <div style={{ color: '#444', fontSize: '12px' }}>Loading brief...</div>}
      {brief && !loading && (
        <>
          {regime && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 700 }}>{regime.quadrant?.toUpperCase()}</span>
              <span style={{ fontSize: '10px', color: '#666' }}>Growth {regime.growth_trend} Inflation {regime.inflation_trend}</span>
            </div>
          )}
          <div style={{ fontSize: '13px', lineHeight: '1.75', color: '#aababa', padding: '16px', background: '#080c0c', borderRadius: '10px', marginBottom: '20px', borderLeft: '3px solid #d4af37' }}>
            {brief.content_md}
          </div>
          {Object.keys(skore).length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#444', letterSpacing: '2px', marginBottom: '12px' }}>SKORE RATINGS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(skore).map(([slug, entry]: [string, any]) => {
                  const ts = TAG_STYLE[entry.tag] ?? TAG_STYLE['Watch'];
                  return (
                    <div key={slug} style={{ padding: '12px 14px', borderRadius: '10px', background: '#080c0c', border: '1px solid #141e1e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#dde8e8', fontFamily: 'monospace' }}>{slug}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, background: ts.bg, color: ts.color, padding: '3px 10px', borderRadius: '4px' }}>{entry.tag.toUpperCase()}</span>
                      </div>
                      {scoreBar(entry.score)}
                      <div style={{ fontSize: '11px', color: '#5a7878', marginTop: '8px', lineHeight: '1.5' }}>{entry.rationale}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
