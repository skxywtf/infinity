'use client';
import React, { useEffect, useState } from 'react';

interface NewsItem { id: string; published_at: string; headline: string; summary: string | null; source: string; url: string; related_series: string[] | null; }
interface WTFNewsFeedProps { seriesSlug?: string; maxItems?: number; }

const SOURCE_COLORS: Record<string,string> = { BLS: '#4a90d9', BEA: '#9b7fe8', FOMC: '#d4af37', FED_SPEECHES: '#d4af37', TREASURY: '#4caf82', IMF: '#3ab8c4', REUTERS: '#f59e42' };

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  const h = Math.floor(diff/3600000);
  const dy = Math.floor(diff/86400000);
  return m < 60 ? `${m}m ago` : h < 24 ? `${h}h ago` : `${dy}d ago`;
}

export default function WTFNewsFeed({ seriesSlug, maxItems = 15 }: WTFNewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'db'|'yahoo'|'empty'>('db');

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(maxItems) });
    if (seriesSlug) params.set('series_slug', seriesSlug);
    // Try new DB-backed feed first, fall back to Yahoo news
    fetch(`/api/news/feed?${params}`)
      .then(r => { if (!r.ok) throw new Error('no db'); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data); setSource('db'); setLoading(false);
        } else {
          // DB empty — fall back to Yahoo
          return fetch('/api/news').then(r => r.json()).then(j => {
            const yahooItems = (j.data || []).slice(0, maxItems).map((n: any, i: number) => ({
              id: String(i), published_at: new Date(n.providerPublishTime * 1000).toISOString(),
              headline: n.title, summary: null, source: 'YAHOO', url: n.link, related_series: null,
            }));
            setItems(yahooItems); setSource('yahoo'); setLoading(false);
          });
        }
      })
      .catch(() => {
        // Spec tables not yet migrated — fall back to Yahoo
        fetch('/api/news').then(r => r.json()).then(j => {
          const yahooItems = (j.data || []).slice(0, maxItems).map((n: any, i: number) => ({
            id: String(i), published_at: new Date(n.providerPublishTime * 1000).toISOString(),
            headline: n.title, summary: null, source: 'YAHOO', url: n.link, related_series: null,
          }));
          setItems(yahooItems); setSource('yahoo'); setLoading(false);
        }).catch(() => { setSource('empty'); setLoading(false); });
      });
  }, [seriesSlug, maxItems]);

  return (
    <aside style={{ flex: 1, background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', maxHeight: '420px', overflowY: 'auto' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '16px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>LIVE WIRE</span>
        {source === 'yahoo' && <span style={{ color: '#4a6868', fontWeight: 400, fontSize: '10px' }}>YAHOO</span>}
      </div>
      {loading && <div style={{ color: '#333', fontSize: '12px' }}>Connecting to wire...</div>}
      {!loading && items.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No items yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map(item => {
          const srcColor = SOURCE_COLORS[item.source] ?? '#888';
          return (
            <a key={item.id} href={item.url?.startsWith('_no_url_') ? '#' : item.url} target="_blank" rel="noreferrer"
               style={{ textDecoration: 'none', color: 'inherit', display: 'block', paddingBottom: '14px', borderBottom: '1px solid #1b2226' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', color: srcColor, fontWeight: 700 }}>{item.source}</span>
                <span style={{ fontSize: '10px', color: '#333' }}>{timeAgo(item.published_at)}</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.45', fontWeight: 500, color: '#dde8e8' }}>{item.headline}</div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
