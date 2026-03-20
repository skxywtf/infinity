'use client';
import React, { useEffect, useState } from 'react';

interface NewsItem { id: string; published_at: string; headline: string; source: string; url: string; }
interface WTFNewsFeedProps { seriesSlug?: string; maxItems?: number; }
const SOURCE_COLORS: Record<string,string> = { BLS:'#4a90d9', BEA:'#9b7fe8', FOMC:'#d4af37', FED_SPEECHES:'#d4af37', TREASURY:'#4caf82', IMF:'#3ab8c4', REUTERS:'#f59e42', YAHOO:'#888' };
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
  const [feedSource, setFeedSource] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(maxItems) });
    if (seriesSlug) params.set('series_slug', seriesSlug);

    // Try DB-backed feed first
    fetch(`/api/news/feed?${params}`)
      .then(r => { if (!r.ok) throw new Error('no_db'); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.map((n: any) => ({ id: n.id, published_at: n.published_at, headline: n.headline, source: n.source, url: n.url })));
          setFeedSource('DB');
        } else {
          throw new Error('db_empty');
        }
        setLoading(false);
      })
      .catch(() => {
        // Fall back to Yahoo /api/news
        fetch('/api/news')
          .then(r => r.json())
          .then(j => {
            const yahoo = (j.data || []).slice(0, maxItems);
            setItems(yahoo.map((n: any, i: number) => ({
              id: String(i),
              // Yahoo uses 'time' (unix seconds), not 'providerPublishTime'
              published_at: n.time ? new Date(n.time * 1000).toISOString() : new Date().toISOString(),
              headline: n.title || '',
              source: 'YAHOO',
              url: n.link || '#',
            })));
            setFeedSource('YAHOO');
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [seriesSlug, maxItems]);

  return (
    <aside style={{ flex: 1, background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', maxHeight: '420px', overflowY: 'auto' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '16px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>LIVE WIRE</span>
        {feedSource === 'YAHOO' && <span style={{ color: '#4a6868', fontWeight: 400, fontSize: '9px', opacity: 0.7 }}>YAHOO</span>}
      </div>
      {loading && <div style={{ color: '#333', fontSize: '12px' }}>Connecting to wire...</div>}
      {!loading && items.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No items — run ingest_rss_feeds.py</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map(item => (
          <a key={item.id} href={item.url.startsWith('_no_url_') ? '#' : item.url} target="_blank" rel="noreferrer"
             style={{ textDecoration: 'none', color: 'inherit', display: 'block', paddingBottom: '14px', borderBottom: '1px solid #1b2226' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: SOURCE_COLORS[item.source] ?? '#888', fontWeight: 700 }}>{item.source}</span>
              <span style={{ fontSize: '10px', color: '#333' }}>{timeAgo(item.published_at)}</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.45', fontWeight: 500, color: '#dde8e8' }}>{item.headline}</div>
          </a>
        ))}
      </div>
    </aside>
  );
}
