'use client';
import React, { useEffect, useState } from 'react';

interface NewsItem { id: string; published_at: string; headline: string; source: string; url: string; }
interface WTFNewsFeedProps { seriesSlug?: string; maxItems?: number; }

const SOURCE_COLORS: Record<string, string> = {
  BLS:          '#4a90d9',
  BEA:          '#9b7fe8',
  FOMC:         '#d4af37',
  FED_SPEECHES: '#d4af37',
  TREASURY:     '#4caf82',
  IMF:          '#3ab8c4',
  REUTERS:      '#f59e42',
  YAHOO:        'rgba(255,255,255,0.55)',
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
              published_at: n.time
                ? new Date(n.time * 1000).toISOString()
                : new Date().toISOString(),
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
      // ── Matte glass panel ──
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: 20,
      maxHeight: 420,
      overflowY: 'auto',
    }}>

      {/* ── Header ── */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 16,
        letterSpacing: '2px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>LIVE WIRE</span>
        {feedSource === 'YAHOO' && (
          <span style={{
            color: 'rgba(255,255,255,0.50)',
            fontWeight: 600,
            fontSize: 9,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '2px 7px',
            borderRadius: 4,
            letterSpacing: '1px',
          }}>
            YAHOO
          </span>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 12,
            height: 12,
            border: '2px solid rgba(255,255,255,0.25)',
            borderTopColor: 'rgba(255,255,255,0.70)',
            borderRadius: '50%',
            animation: 'wire-spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          Connecting to wire...
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && (
        <div style={{
          color: 'rgba(255,255,255,0.40)',
          fontSize: 12,
          padding: '12px 0',
        }}>
          No items — run ingest_rss_feeds.py
        </div>
      )}

      {/* ── Feed items ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, idx) => {
          const srcColor = SOURCE_COLORS[item.source];
          return (
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
                borderBottom: idx < items.length - 1
                  ? '1px solid rgba(255,255,255,0.10)'
                  : 'none',
              }}
            >
              {/* ── Source + timestamp row ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 5,
              }}>
                {/* Source badge */}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: srcColor ?? 'rgba(255,255,255,0.55)',
                  textShadow: srcColor
                    ? `0 0 8px ${srcColor}55`
                    : 'none',
                  background: srcColor
                    ? `${srcColor}14`
                    : 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  border: `1px solid ${srcColor ? srcColor + '30' : 'rgba(255,255,255,0.12)'}`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.5px',
                }}>
                  {item.source}
                </span>

                {/* Timestamp */}
                <span style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  {timeAgo(item.published_at)}
                </span>
              </div>

              {/* ── Headline ── */}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.50,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.75)',
                  transition: 'color 0.2s',
                }}
                onMouseOver={e  => (e.currentTarget.style.color = '#60a5fa')}
                onMouseOut={e   => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              >
                {item.headline}
              </div>
            </a>
          );
        })}
      </div>

      <style>{`
        @keyframes wire-spin { to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}