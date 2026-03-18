'use client';
import React, { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string;
  event_date: string;
  country: string;
  indicator: string;
  importance: number;
  prior: number | null;
  consensus: number | null;
  actual: number | null;
  surprise: number | null;
  source: string;
}

const IMPORTANCE_LABEL: Record<number, { label: string; color: string }> = {
  3: { label: 'HIGH',   color: '#e05c5c' },
  2: { label: 'MED',    color: '#f59e42' },
  1: { label: 'LOW',    color: '#4a6868' },
};

function fmt(v: number | null) {
  if (v === null || v === undefined) return '—';
  return v.toFixed(2);
}

function surpriseColor(v: number | null) {
  if (v === null) return '#666';
  if (v > 0) return '#4caf82';
  if (v < 0) return '#e05c5c';
  return '#888';
}

function groupByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach(e => {
    const dateKey = e.event_date.substring(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(e);
  });
  return groups;
}

export default function EconCalendar() {
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [history, setHistory] = useState<CalendarEvent[]>([]);
  const [tab, setTab]         = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/calendar?days_ahead=30&importance=2').then(r => r.json()),
      fetch('/api/calendar/history?limit=40').then(r => r.json()),
    ])
      .then(([upcoming, past]) => {
        setEvents(Array.isArray(upcoming) ? upcoming : []);
        setHistory(Array.isArray(past) ? past : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = groupByDate(tab === 'upcoming' ? events : history);
  const sortedDates = Object.keys(grouped).sort(
    tab === 'upcoming' ? (a, b) => a.localeCompare(b) : (a, b) => b.localeCompare(a)
  );

  return (
    <div style={{
      background: '#0b0f0f', border: '1px solid #1b2226',
      borderRadius: '16px', padding: '20px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Economic Calendar</h3>
        <div style={{ display: 'flex', background: '#1b2226', borderRadius: '6px', padding: '2px' }}>
          {(['upcoming', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 12px', fontSize: '10px', border: 'none',
              borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '1px', fontWeight: 700,
              background: tab === t ? '#333' : 'transparent',
              color: tab === t ? '#fff' : '#666',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {loading && <div style={{ color: '#444', fontSize: '12px' }}>Loading calendar...</div>}
      {!loading && sortedDates.length === 0 && (
        <div style={{ color: '#333', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No events found.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedDates.map(dateKey => {
          const dayEvents = grouped[dateKey]!;
          const d = new Date(dateKey + 'T12:00:00Z');
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <div key={dateKey}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#d4af37', letterSpacing: '2px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1b2226' }}>
                {label.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayEvents.map(ev => {
                  const imp = IMPORTANCE_LABEL[ev.importance] ?? IMPORTANCE_LABEL[1]!;
                  return (
                    <div key={ev.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 64px 64px 64px 64px', gap: '8px', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: '#080c0c', border: '1px solid #141e1e' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: imp.color, letterSpacing: '0.5px' }}>{imp.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#dde8e8' }}>{ev.indicator}</span>
                      <span style={{ fontSize: '11px', color: '#4a6868', textAlign: 'right' }}>{fmt(ev.prior)}</span>
                      <span style={{ fontSize: '11px', color: '#888', textAlign: 'right' }}>{fmt(ev.consensus)}</span>
                      <span style={{ fontSize: '11px', fontWeight: ev.actual !== null ? 700 : 400, color: ev.actual !== null ? '#fff' : '#333', textAlign: 'right' }}>{fmt(ev.actual)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: surpriseColor(ev.surprise), textAlign: 'right' }}>
                        {ev.surprise !== null ? `${ev.surprise > 0 ? '+' : ''}${fmt(ev.surprise)}` : '✅'}
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
