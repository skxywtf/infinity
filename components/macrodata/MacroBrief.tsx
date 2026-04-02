'use client';
import React, { useEffect, useState } from 'react';

interface SkoreEntry { score: number; tag: 'Buy' | 'Hold' | 'Sell' | 'Watch'; rationale: string; }
interface Brief {
  id: string; generated_at: string; brief_type: string; trigger_series: string;
  content_md: string; skore_json: Record<string, SkoreEntry> | string; regime_json: unknown;
}

const TAG_STYLE: Record<string, { bg: string; color: string; glow: string }> = {
  Buy:   { bg: 'rgba(76,175,130,0.12)',  color: '#4caf82', glow: 'rgba(76,175,130,0.35)' },
  Sell:  { bg: 'rgba(224,92,92,0.12)',   color: '#e05c5c', glow: 'rgba(224,92,92,0.35)'  },
  Hold:  { bg: 'rgba(245,158,66,0.12)',  color: '#f59e42', glow: 'rgba(245,158,66,0.35)' },
  Watch: { bg: 'rgba(74,144,217,0.12)',  color: '#4a90d9', glow: 'rgba(74,144,217,0.35)' },
};

export default function MacroBrief() {
  const [brief, setBrief]         = useState<Brief | null>(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGen]      = useState(false);
  const [error, setError]         = useState('');

  const fetchLatest = () => {
    setLoading(true);
    fetch('/api/brief/latest')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: Brief) => { setBrief(d); setLoading(false); })
      .catch((c: unknown) => {
        setLoading(false);
        setError(c === 404 ? 'No brief yet. Click Generate.' : 'Failed to load.');
      });
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
      if (!res.ok) throw new Error('Failed');
      await fetchLatest();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    setGen(false);
  };

  const skore: Record<string, SkoreEntry> = brief
    ? (typeof brief.skore_json === 'string'
        ? (JSON.parse(brief.skore_json) as Record<string, SkoreEntry>)
        : (brief.skore_json as Record<string, SkoreEntry>))
    : {};

  return (
    <div style={{
      // ── Glass card ──
      background: 'rgba(10, 16, 20, 0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: 20,
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
          WTF Macro Brief
        </h3>

        <button
          onClick={generate}
          disabled={generating}
          style={{
            padding: '8px 18px',
            background: generating ? 'rgba(212,175,55,0.10)' : 'transparent',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(212,175,55,0.45)',
            borderRadius: 8,
            cursor: generating ? 'not-allowed' : 'pointer',
            color: generating ? 'rgba(212,175,55,0.45)' : '#d4af37',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1px',
            boxShadow: generating ? 'none' : '0 0 12px rgba(212,175,55,0.12)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!generating) e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; }}
          onMouseLeave={e => { if (!generating) e.currentTarget.style.background = 'transparent'; }}
        >
          {generating ? 'GENERATING...' : 'GENERATE'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          color: '#f59e42',
          fontSize: 12,
          marginBottom: 12,
          padding: '8px 12px',
          background: 'rgba(245,158,66,0.08)',
          border: '1px solid rgba(245,158,66,0.18)',
          borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && !error && (
        <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>Loading...</div>
      )}

      {/* ── Content ── */}
      {brief && !loading && (
        <>
          {/* Brief body */}
          <div style={{
            fontSize: 13,
            color: 'rgba(170,186,186,0.90)',
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 10,
            marginBottom: 16,
            borderLeft: '3px solid rgba(212,175,55,0.60)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)',
            lineHeight: 1.65,
          }}>
            {brief.content_md}
          </div>

          {/* Skore cards */}
          {Object.keys(skore).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(skore).map(([slug, entry]) => {
                const ts = TAG_STYLE[entry.tag] ?? TAG_STYLE['Watch'];
                return (
                  <div
                    key={slug}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: `0 2px 12px rgba(0,0,0,0.25), inset 0 0 0 1px ${ts.bg}`,
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${ts.color}30`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: '#dde8e8', fontSize: 13 }}>{slug}</span>
                      <span style={{
                        background: ts.bg,
                        backdropFilter: 'blur(6px)',
                        border: `1px solid ${ts.color}30`,
                        color: ts.color,
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        boxShadow: `0 0 8px ${ts.glow}`,
                      }}>
                        {entry.tag.toUpperCase()}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 11,
                      color: 'rgba(90,120,120,0.90)',
                      margin: '6px 0 0',
                      lineHeight: 1.5,
                    }}>
                      {entry.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}