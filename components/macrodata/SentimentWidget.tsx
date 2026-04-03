'use client';

import React, { useEffect, useState } from 'react';

export default function SentimentWidget({ onDataFetched }: { onDataFetched?: (data: any) => void }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/api/alphavantage/sentiment');
        const data = await res.json();

        if (data.feed) {
          setNews(data.feed.slice(0, 5));

          if (onDataFetched) {
            const aiPayload = {
              section_title: "AI SENTIMENT",
              provider: "ALPHA VANTAGE",
              news_items: data.feed.slice(0, 5).map((item: any) => ({
                headline: item.title,
                sentiment: item.overall_sentiment_label,
              })),
            };
            onDataFetched(aiPayload);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sentiment", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [onDataFetched]);

  const getSentimentColor = (label: string) => {
    if (label.includes('Bullish')) return '#4caf82';
    if (label.includes('Bearish')) return '#e05c5c';
    return 'rgba(255,255,255,0.45)';
  };

  const formatLabel = (label: string) => {
    if (label === 'Somewhat-Bullish') return 'SLIGHT BULL';
    if (label === 'Somewhat-Bearish') return 'SLIGHT BEAR';
    return label.toUpperCase();
  };

  const avgScore = news.length > 0
    ? news.reduce((acc, item) => acc + parseFloat(item.overall_sentiment_score), 0) / news.length
    : 0;

  const gaugePosition = Math.max(0, Math.min(100, ((avgScore + 0.5) * 100)));

  return (
    <aside style={{
      // ── Matte glass surface ──
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    }}>

      {/* ── Header ── */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#d4af37',
        letterSpacing: '2px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textTransform: 'uppercase',
      }}>
        <span style={{ textShadow: '0 0 10px rgba(212,175,55,0.40)' }}>AI Sentiment</span>
        <span style={{
          background: 'rgba(212, 175, 55, 0.10)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(212,175,55,0.25)',
          color: '#d4af37',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '9px',
          letterSpacing: '1px',
        }}>
          ALPHA VANTAGE
        </span>
      </div>

      {loading ? (
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.45)',
          textAlign: 'center',
          padding: '20px 0',
          fontStyle: 'italic',
        }}>
          Analyzing market mood...
        </div>
      ) : (
        <>
          {/* ── Mood meter ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              <span>BEARISH</span>
              <span>NEUTRAL</span>
              <span>BULLISH</span>
            </div>

            {/* Gauge track */}
            <div style={{
              height: '8px',
              width: '100%',
              borderRadius: '4px',
              // FIX: Swapped to highly saturated, bright gradient values 
              background: 'linear-gradient(90deg, rgba(255,82,82,0.9) 0%, rgba(255,255,255,0.1) 50%, rgba(76,175,80,0.9) 100%)',
              // FIX: Added inner shadow for depth and stronger border
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 0 10px rgba(255,255,255,0.05), inset 0 2px 4px rgba(0,0,0,0.3)',
              position: 'relative',
            }}>
              {/* Indicator */}
              <div style={{
                position: 'absolute',
                top: '-5px',
                left: `calc(${gaugePosition}% - 6px)`,
                width: '12px',
                height: '18px',
                // FIX: Made the slider pure white with a stronger glow
                background: '#ffffff',
                borderRadius: '3px',
                boxShadow: '0 0 12px rgba(255,255,255,0.85), 0 0 4px rgba(0,0,0,0.5)',
                transition: 'left 1s ease-in-out',
              }} />
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.10)' }} />

          {/* ── News impact wire ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {news.map((item, idx) => {
              const sentColor = getSentimentColor(item.overall_sentiment_label);
              return (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  {/* Sentiment badge & source */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.50)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {item.source}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: sentColor,
                      background: `${sentColor}18`,
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: `1px solid ${sentColor}35`,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      letterSpacing: '0.3px',
                    }}>
                      {formatLabel(item.overall_sentiment_label)} ({item.overall_sentiment_score})
                    </span>
                  </div>

                  {/* Headline */}
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: '1.5',
                      fontWeight: 500,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                  >
                    {item.title.length > 70
                      ? item.title.substring(0, 70) + '...'
                      : item.title}
                  </div>

                  {/* Ticker tags */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {item.ticker_sentiment?.slice(0, 3).map((tickerData: any, i: number) => {
                      const tc = getSentimentColor(tickerData.ticker_sentiment_label);
                      return (
                        <span key={i} style={{
                          fontSize: '9px',
                          color: tc,
                          background: `${tc}14`,
                          backdropFilter: 'blur(25px)',
                          WebkitBackdropFilter: 'blur(25px)',
                          border: `1px solid ${tc}40`,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          letterSpacing: '0.3px',
                        }}>
                          {tickerData.ticker}
                        </span>
                      );
                    })}
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}