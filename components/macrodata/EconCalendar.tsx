'use client';
import React, { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string; event_date: string; country: string; indicator: string;
  importance: number; prior: number | null; consensus: number | null;
  actual: number | null; surprise: number | null; source: string;
}

const IMPORTANCE_LABEL: Record<number, { label: string; color: string; glow: string }> = {
  3: { label: 'HIGH', color: '#e05c5c', glow: 'rgba(224,92,92,0.35)'  },
  2: { label: 'MED',  color: '#f59e42', glow: 'rgba(245,158,66,0.35)' },
  1: { label: 'LOW',  color: 'rgba(255,255,255,0.20)', glow: 'none'  },
};

function fmt(v: number | null) {
  if (v === null || v === undefined) return '—';
  return v.toFixed(2);
}
function surpriseColor(v: number | null) {
  if (v === null) return 'rgba(255,255,255,0.30)';
  if (v > 0)  return '#4caf82';
  if (v < 0)  return '#e05c5c';
  return 'rgba(255,255,255,0.45)';
}
function groupByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach(e => {
    const k = e.event_date.substring(0, 10);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });
  return groups;
}

export default function EconCalendar() {
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [history, setHistory] = useState<CalendarEvent[]>([]);
  const [tab, setTab]         = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/calendar?days_ahead=30&importance=2').then(r => { if (!r.ok) throw new Error('migrate'); return r.json(); }),
      fetch('/api/calendar/history?limit=40').then(r => { if (!r.ok) throw new Error('migrate'); return r.json(); }),
    ])
      .then(([upcoming, past]) => {
        setEvents(Array.isArray(upcoming) ? upcoming : []);
        setHistory(Array.isArray(past) ? past : []);
        setLoading(false);
      })
      .catch(() => { setNeedsMigration(true); setLoading(false); });
  }, []);

  if (needsMigration) return (
    <div style={{
      background: 'rgba(10,16,20,0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 40,
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
        Economic Calendar
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.8 }}>
        Database tables not yet created.<br />
        <code style={{ color: '#d4af37', fontSize: 12 }}>python -m macro_scripts.migrate_spec</code><br />
        <code style={{ color: '#d4af37', fontSize: 12 }}>python -m macro_scripts.ingest_spec_series</code>
      </div>
    </div>
  );

  const grouped     = groupByDate(tab === 'upcoming' ? events : history);
  const sortedDates = Object.keys(grouped).sort(
    tab === 'upcoming' ? (a, b) => a.localeCompare(b) : (a, b) => b.localeCompare(a)
  );

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
          Economic Calendar
        </h3>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 7,
          padding: 2,
        }}>
          {(['upcoming', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '5px 14px',
                fontSize: 10,
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 700,
                background: tab === t ? 'rgba(255,255,255,0.10)' : 'transparent',
                backdropFilter: tab === t ? 'blur(6px)' : 'none',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.30)',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>
          Loading calendar...
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && sortedDates.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          No events found. Run ingestion to populate calendar data.
        </div>
      )}

      {/* ── Column header labels ── */}
      {!loading && sortedDates.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 64px 64px 64px 64px',
          gap: 8,
          padding: '4px 10px',
          marginBottom: 4,
        }}>
          {['IMP', 'INDICATOR', 'PRIOR', 'CONS.', 'ACTUAL', 'SURP.'].map((h, i) => (
            <span key={h} style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.20)',
              letterSpacing: '0.8px',
              textAlign: i > 1 ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>
      )}

      {/* ── Event groups ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sortedDates.map(dateKey => {
          const dayEvents = grouped[dateKey]!;
          const d = new Date(dateKey + 'T12:00:00Z');
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <div key={dateKey}>
              {/* Date label */}
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#d4af37',
                letterSpacing: 2,
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid rgba(212,175,55,0.18)',
                textShadow: '0 0 10px rgba(212,175,55,0.30)',
              }}>
                {label.toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {dayEvents.map(ev => {
                  const imp = IMPORTANCE_LABEL[ev.importance] ?? IMPORTANCE_LABEL[1];
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr 64px 64px 64px 64px',
                        gap: 8,
                        alignItems: 'center',
                        padding: '9px 10px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.025)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.045)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: imp.color,
                        letterSpacing: '0.5px',
                        textShadow: imp.glow !== 'none' ? `0 0 6px ${imp.glow}` : 'none',
                      }}>
                        {imp.label}
                      </span>

                      <span style={{ fontSize: 12, fontWeight: 600, color: '#dde8e8' }}>
                        {ev.indicator}
                      </span>

                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', textAlign: 'right' }}>
                        {fmt(ev.prior)}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>
                        {fmt(ev.consensus)}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: ev.actual !== null ? 700 : 400,
                        color: ev.actual !== null ? '#fff' : 'rgba(255,255,255,0.15)',
                        textAlign: 'right',
                      }}>
                        {fmt(ev.actual)}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: surpriseColor(ev.surprise),
                        textAlign: 'right',
                        textShadow: ev.surprise !== null && ev.surprise !== 0
                          ? `0 0 6px ${surpriseColor(ev.surprise)}60`
                          : 'none',
                      }}>
                        {ev.surprise !== null ? `${ev.surprise > 0 ? '+' : ''}${fmt(ev.surprise)}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}