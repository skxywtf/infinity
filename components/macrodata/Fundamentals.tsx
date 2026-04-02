'use client';
import React, { useState } from 'react';

type Section = 'income' | 'balance' | 'cashflow';
const SECTION_LABELS: Record<Section, string> = {
  income: 'Income Statement',
  balance: 'Balance Sheet',
  cashflow: 'Cash Flow',
};
const HIGHLIGHT = new Set(['Revenue','Gross Profit','Operating Income','Net Income','EPS (Diluted)']);

function fmt(val: number | null | undefined, label: string): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (label === 'EPS (Diluted)') return `$${val.toFixed(2)}`;
  const a = Math.abs(val);
  if (a >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function pct(curr: number | null | undefined, prev: number | null | undefined) {
  if (!curr || !prev || prev === 0) return null;
  const c = ((curr - prev) / Math.abs(prev)) * 100;
  return `${c >= 0 ? '+' : ''}${c.toFixed(1)}%`;
}

function Table({ section, years, label }: { section: any; years: number[]; label: string }) {
  const rows = Object.entries(section);
  if (!rows.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section label */}
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        color: '#d4af37',
        marginBottom: 10,
        textShadow: '0 0 10px rgba(212,175,55,0.35)',
      }}>
        {label.toUpperCase()}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left',
                padding: '8px 10px',
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 600,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                width: 180,
                letterSpacing: '0.3px',
              }}>
                Line Item
              </th>
              {years.map(yr => (
                <th key={yr} style={{
                  textAlign: 'right',
                  padding: '8px 10px',
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 600,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  minWidth: 72,
                }}>
                  {yr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map(([rowLabel, values]) => {
              const isKey = HIGHLIGHT.has(rowLabel);
              return (
                <tr
                  key={rowLabel}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{
                    padding: '7px 10px',
                    color: isKey ? '#dde8e8' : 'rgba(255,255,255,0.30)',
                    fontWeight: isKey ? 600 : 400,
                    borderLeft: isKey ? '2px solid rgba(212,175,55,0.50)' : '2px solid transparent',
                  }}>
                    {rowLabel}
                  </td>
                  {years.map((yr, i) => {
                    const val = values[yr];
                    const prev = i > 0 ? values[years[i - 1]] : null;
                    const ch = i > 0 ? pct(val, prev) : null;
                    const pos = ch && !ch.startsWith('-');
                    return (
                      <td key={yr} style={{ textAlign: 'right', padding: '7px 10px' }}>
                        <div style={{
                          fontWeight: isKey ? 700 : 400,
                          color: isKey ? '#fff' : 'rgba(255,255,255,0.50)',
                        }}>
                          {fmt(val, rowLabel)}
                        </div>
                        {ch && (
                          <div style={{
                            fontSize: 9,
                            color: pos ? '#4caf82' : '#e05c5c',
                            marginTop: 1,
                            textShadow: pos
                              ? '0 0 6px rgba(76,175,130,0.40)'
                              : '0 0 6px rgba(224,92,92,0.40)',
                          }}>
                            {ch}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Fundamentals() {
  const [ticker, setTicker]   = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<any>(null);
  const [error, setError]     = useState('');
  const [section, setSection] = useState<Section>('income');
  const [years, setYears]     = useState(5);

  const lookup = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res  = await fetch(`/api/edgar/${t}?years=${years}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed'); return; }
      setData(json);
    } catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const active = data
    ? (section === 'income' ? data.incomeStatement
      : section === 'balance' ? data.balanceSheet
      : data.cashFlowStatement)
    : null;

  return (
    <div style={{
      // ── Glass card ──
      background: 'rgba(10, 16, 20, 0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: 24,
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            Fundamentals
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.25)',
            marginTop: 2,
            letterSpacing: 1,
          }}>
            SEC EDGAR · XBRL · ANNUAL 10-K
          </div>
        </div>

        {data && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{data.company.name}</div>
            <div style={{
              fontSize: 10,
              color: '#4caf82',
              letterSpacing: 1,
              textShadow: '0 0 8px rgba(76,175,130,0.40)',
            }}>
              {data.company.ticker} · CIK {data.company.cik}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls row ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="TICKER (AAPL · MSFT · NVDA · TSLA)"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'monospace',
            letterSpacing: 1,
            transition: 'border-color 0.2s',
          }}
          onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />

        <select
          value={years}
          onChange={e => setYears(Number(e.target.value))}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            outline: 'none',
          }}
        >
          {[3, 5, 7, 10].map(y => <option key={y} value={y}>{y}Y</option>)}
        </select>

        <button
          onClick={lookup}
          disabled={loading}
          style={{
            background: loading ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.90)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(212,175,55,0.30)',
            color: loading ? 'rgba(0,0,0,0.45)' : '#000',
            borderRadius: 8,
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
            boxShadow: loading ? 'none' : '0 2px 14px rgba(212,175,55,0.28)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'LOADING…' : 'PULL'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          color: '#e05c5c',
          fontSize: 12,
          padding: '10px 14px',
          background: 'rgba(224,92,92,0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(224,92,92,0.18)',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div style={{
          color: 'rgba(255,255,255,0.20)',
          fontSize: 12,
          textAlign: 'center',
          padding: 40,
        }}>
          Fetching SEC EDGAR data…
        </div>
      )}

      {/* ── Data view ── */}
      {data && !loading && (
        <>
          {/* Section tabs */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: 12,
          }}>
            {(Object.keys(SECTION_LABELS) as Section[]).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  background: section === s ? 'rgba(255,255,255,0.07)' : 'transparent',
                  backdropFilter: section === s ? 'blur(8px)' : 'none',
                  WebkitBackdropFilter: section === s ? 'blur(8px)' : 'none',
                  color: section === s ? '#d4af37' : 'rgba(255,255,255,0.25)',
                  border: '1px solid',
                  borderColor: section === s ? 'rgba(212,175,55,0.30)' : 'transparent',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: 1,
                  boxShadow: section === s ? '0 0 12px rgba(212,175,55,0.10)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {SECTION_LABELS[s].toUpperCase()}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.15)',
              alignSelf: 'center',
            }}>
              FY {data.fiscalYears[0]}–{data.fiscalYears[data.fiscalYears.length - 1]}
            </div>
          </div>

          {active && <Table section={active} years={data.fiscalYears} label={SECTION_LABELS[section]} />}

          {data.warnings.length > 0 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
              Missing: {data.warnings.join(', ')}
            </div>
          )}
        </>
      )}

      {/* ── Empty state ── */}
      {!data && !loading && !error && (
        <div style={{
          textAlign: 'center',
          padding: '30px 0',
          color: 'rgba(255,255,255,0.15)',
          fontSize: 12,
        }}>
          Enter a ticker to pull SEC 10-K financials
        </div>
      )}
    </div>
  );
}