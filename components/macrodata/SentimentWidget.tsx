"use client";

import React, { useEffect, useState } from 'react';

export default function SentimentWidget() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        // Fetching from the API route we designed in the previous step
        const res = await fetch('/api/alphavantage/sentiment');
        const data = await res.json();
        
        if (data.feed) {
          setNews(data.feed.slice(0, 5)); // Grab top 5 articles
        }
      } catch (error) {
        console.error("Failed to fetch sentiment", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, []);

  // Helper to colorize the sentiment label
  const getSentimentColor = (label: string) => {
    if (label.includes('Bullish')) return '#4caf50'; // Green
    if (label.includes('Bearish')) return '#ff5252'; // Red
    return '#888888'; // Neutral Gray
  };

  // Helper to format the label text compactly
  const formatLabel = (label: string) => {
    if (label === 'Somewhat-Bullish') return 'SLIGHT BULL';
    if (label === 'Somewhat-Bearish') return 'SLIGHT BEAR';
    return label.toUpperCase();
  };

  // Calculate an average "Macro Mood" score based on the recent 5 articles (-1 to 1)
  // Alpha vantage scores usually range from -0.35 to 0.35 in their overall_sentiment_score
  const avgScore = news.length > 0 
    ? news.reduce((acc, item) => acc + parseFloat(item.overall_sentiment_score), 0) / news.length
    : 0;
  
  // Normalize score to a 0-100% scale for the UI gauge (assuming -0.5 is max fear, +0.5 is max greed)
  const gaugePosition = Math.max(0, Math.min(100, ((avgScore + 0.5) * 100)));

  return (
    <aside className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#d4af37', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>AI SENTIMENT</span>
        <span style={{ background: '#d4af3722', color: '#d4af37', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>ALPHA VANTAGE</span>
      </div>

      {loading ? (
        <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '20px 0' }}>Analyzing market mood...</div>
      ) : (
        <>
          {/* THE MOOD METER (10-second glance rule applied here) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', fontWeight: 600 }}>
              <span>BEARISH</span>
              <span>NEUTRAL</span>
              <span>BULLISH</span>
            </div>
            <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #ff5252 0%, #333333 50%, #4caf50 100%)', position: 'relative' }}>
              {/* The Indicator Triangle */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: `calc(${gaugePosition}% - 6px)`,
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #ffffff',
                transition: 'left 1s ease-in-out'
              }} />
            </div>
          </div>

          <div style={{ height: '1px', background: '#1b2226' }} />

          {/* THE IMPACT WIRE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {news.map((item, idx) => (
              <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Sentiment Badge & Source */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>{item.source}</span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    color: getSentimentColor(item.overall_sentiment_label),
                    background: `${getSentimentColor(item.overall_sentiment_label)}22`,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {formatLabel(item.overall_sentiment_label)} ({item.overall_sentiment_score})
                  </span>
                </div>

                {/* Headline */}
                <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', fontWeight: 500 }}>
                  {item.title.length > 70 ? item.title.substring(0, 70) + '...' : item.title}
                </div>

                {/* Ticker Impact Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {item.ticker_sentiment?.slice(0, 3).map((tickerData: any, i: number) => (
                    <span key={i} style={{ fontSize: '9px', color: getSentimentColor(tickerData.ticker_sentiment_label), border: `1px solid ${getSentimentColor(tickerData.ticker_sentiment_label)}55`, padding: '1px 4px', borderRadius: '3px' }}>
                      {tickerData.ticker}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}