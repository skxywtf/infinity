'use client';
import React, { useEffect, useState } from 'react';

interface NewsItem { id: string; published_at: string; headline: string; source: string; url: string; }
interface WTFNewsFeedProps { seriesSlug?: string; maxItems?: number; }

const SOURCE_COLORS: Record<string, string> = {
  BLS: '#4a90d9', BEA: '#9b7fe8', FOMC: '#d4af37',
  FED_SPEECHES: '#d4af37', TREASURY: '#4caf82',
  IMF: '#3ab8c4', REUTERS: '#f59e42', YAHOO: '#888',
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  return m < 60 ? `${m}m ago` : h < 24 ? `${h}h ago` : `${dy}d ago`;
}

export default function WTFNewsFeed({ seriesSlug, maxItems = 15 }: WTFNewsFeedProps) {
  const [items, setItems]           = useState<NewsItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [feedSource, setFeedSource] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(maxItems) });
    if (seriesSlug) params.set('series_slug', seriesSlug);

    fetch(`/api/news/feed?${params}`)
      .then(r => { if (!r.ok) throw new Error('no_db'); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.map((n: any) => ({
            id: n.id, published_at: n.published_at,
            headline: n.headline, source: n.source, url: n.url,
          })));
          setFeedSource('DB');
        } else {
          throw new Error('db_empty');
        }
        setLoading(false);
      })
      .catch(() => {
        fetch('/api/news')
          .then(r => r.json())
          .then(j => {
            const yahoo = (j.data || []).slice(0, maxItems);
            setItems(yahoo.map((n: any, i: number) => ({
              id: String(i),
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
    <aside style={{
      flex: 1,
      // ── Glass panel ──
      background: 'rgba(10, 16, 20, 0.60)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: 20,
      maxHeight: 420,
      overflowY: 'auto',
    }}>

      {/* ── Header ── */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.30)',
        marginBottom: 16,
        letterSpacing: '2px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>LIVE WIRE</span>
        {feedSource === 'YAHOO' && (
          <span style={{
            color: 'rgba(255,255,255,0.20)',
            fontWeight: 400,
            fontSize: 9,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '2px 7px',
            borderRadius: 4,
            backdropFilter: 'blur(6px)',
          }}>
            YAHOO
          </span>
        )}
      </div>

      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>
          Connecting to wire...
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
          No items — run ingest_rss_feeds.py
        </div>
      )}

      {/* ── Feed items ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(item => (
          <a
            key={item.id}
            href={item.url.startsWith('_no_url_') ? '#' : item.url}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              paddingBottom: 14,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Source + timestamp */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 5,
            }}>
              <span style={{
                fontSize: 10,
                color: SOURCE_COLORS[item.source] ?? 'rgba(255,255,255,0.35)',
                fontWeight: 700,
                textShadow: SOURCE_COLORS[item.source]
                  ? `0 0 8px ${SOURCE_COLORS[item.source]}55`
                  : 'none',
              }}>
                {item.source}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
                {timeAgo(item.published_at)}
              </span>
            </div>

            {/* Headline */}
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.45,
                fontWeight: 500,
                color: 'rgba(221,232,232,0.88)',
                transition: 'color 0.2s',
              }}
              onMouseOver={e  => (e.currentTarget.style.color = '#60a5fa')}
              onMouseOut={e   => (e.currentTarget.style.color = 'rgba(221,232,232,0.88)')}
            >
              {item.headline}
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}