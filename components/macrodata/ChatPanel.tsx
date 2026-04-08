'use client';

import React, { useState } from 'react';

export default function ChatPanel({ 
  activeTab = '', 
  activeCharts = [],
  market = {},
  news = [],
  govNews = [], 
  macroRegime = {}, 
  dynamicTabs = [],
  finnhub = {},
  sentiment = [],
  consensus = null
}: { 
  activeTab?: string, 
  activeCharts?: any[],
  market?: any,
  news?: any[],
  govNews?: any[], 
  macroRegime?: any,
  dynamicTabs?: string[],
  finnhub?: Record<string, any>,
  sentiment?: any[],
  consensus?: any
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi! I am your Macro AI Analyst. Ask me anything about the data on your screen.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text: inputText }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      let liveContext = `You are a sharp, helpful financial AI assistant. Keep answers concise.\n\n`;
      
      liveContext += `[WATCHLIST (Sidebar)]\n`;
      liveContext += `- S&P 500 (SPY): ${market?.spy?.price || 'Loading...'}\n`;
      liveContext += `- US 10Y Yield (IEF): ${market?.ief?.price || 'Loading...'}\n`;
      liveContext += `- DXY Index (UUP): ${market?.uup?.price || 'Loading...'}\n`;
      liveContext += `- Bitcoin (BTC): ${market?.btc?.price || 'Loading...'}\n`;
      liveContext += `- Gold (GC=F): ${market?.gold?.price || 'Loading...'}\n\n`;

      liveContext += `[MACRO REGIME (Sidebar)]\n`;
      if (macroRegime && Object.keys(macroRegime).length > 0) {
        liveContext += `The user's dashboard currently shows the Active Macro Regime is '${macroRegime.status || 'Unknown'}'.\n`;
        liveContext += `Current Stats shown: Growth (3m): ${macroRegime.growth3m || 'N/A'}, CPI YoY: ${macroRegime.cpiYoy || 'N/A'}, CPI 12m Avg: ${macroRegime.cpi12mAvg || 'N/A'}.\n`;
        liveContext += `If the user asks about the regime, explain what '${macroRegime.status || 'this state'}' means for growth, inflation, and risk assets based on these numbers.\n\n`;
      } else {
        liveContext += `- Macro Regime data is currently loading or unavailable.\n\n`;
      }

      liveContext += `[LIVE EQUITIES DATA (Finnhub)]\n`;
      if (Object.keys(finnhub || {}).length > 0) {
        liveContext += `${JSON.stringify(finnhub)}\n\n`;
      } else {
        liveContext += `- No live equities data loaded yet.\n\n`;
      }

      liveContext += `[ALPHA VANTAGE NEWS SENTIMENT]\n`;
      if (sentiment && sentiment.length > 0) {
        liveContext += `${JSON.stringify(sentiment)}\n\n`;
      } else {
        liveContext += `- No sentiment data loaded yet.\n\n`;
      }

      liveContext += `[MACRO CONSENSUS ESTIMATES]\n`;
      if (consensus) {
        liveContext += `${JSON.stringify(consensus)}\n\n`;
      } else {
        liveContext += `- No consensus data loaded yet.\n\n`;
      }

      liveContext += `[YAHOO LIVE WIRE NEWS]\n`;
      if (news && news.length > 0) {
        news.slice(0, 3).forEach((n: any) => {
          liveContext += `- ${n.publisher}: "${n.title}"\n`;
        });
      } else {
        liveContext += `- No recent news loaded yet.\n`;
      }
      liveContext += `\n`;

      liveContext += `[OFFICIAL GOV WIRE NEWS]\n`;
      if (govNews && govNews.length > 0) {
        govNews.slice(0, 3).forEach((n: any) => {
          liveContext += `- ${n.publisher}: "${n.title}"\n`;
        });
      } else {
        liveContext += `- No recent government releases.\n`;
      }
      liveContext += `\n`;

      liveContext += `[MAIN DASHBOARD CHARTS]\n`;
      liveContext += `The user is currently looking at the '${activeTab}' tab.\n`;
      liveContext += `If they ask about a chart not listed below, tell them: "Please click on the [Tab Name] tab so I can see that data!" (Available tabs: ${dynamicTabs.join(', ')}).\n\n`;
      
      if (activeTab === 'Global Macro') {
        liveContext += `The user is looking at two charts in the Global Macro tab.\n`;
        liveContext += `1. OECD G20 Real GDP Growth (Annualized %): India 7.8%, China 5.2%, USA 3.1%, Brazil 2.9%, Japan 1.9%, Australia 1.5%, Canada 1.1%, France 0.9%, UK 0.5%, Germany -0.3%.\n`;
        liveContext += `2. Inflation Divergence (YoY %): Comparing US CPI vs Eurozone HICP. The latest data point shows US CPI at 3.2% and Eurozone HICP at 2.6%. Eurozone inflation is currently cooling faster than the US.\n`;
      } else if (activeTab === 'Fundamentals') {
        liveContext += `The user is looking at the Fundamentals tab which tracks core economic and market fundamentals.\n`;
      } else if (activeTab === 'Calendar') {
        liveContext += `The user is looking at the Economic Calendar showing upcoming market events and consensus forecasts.\n`;
      } else if (activeTab === 'WTF Brief') {
        liveContext += `The user is reading the Macro Brief summary.\n`;
      } else if (activeTab === 'Vintage Data') {
        liveContext += `The user is looking at the Vintage Tracker which shows historical data revisions.\n`;
      }

      liveContext += `Here are the latest values for the charts in the active '${activeTab}' tab (if any):\n`;
      
      for (const chart of activeCharts) {
        try {
          const res = await fetch(`/api/latest/${chart.series_id}`);
          const valData = await res.json();
          liveContext += `- ${chart.title}: ${valData.value}\n`;
        } catch (e) {
          console.error("Failed to fetch context for", chart.series_id);
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText, chart_data: liveContext })
      });

      const data = await response.json();

      if (data.answer) {
        setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', text: "Sorry, I ran into an error reading the data." }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: "Connection error. Make sure the backend is running!" }]);
    }

    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 50 }}>
      {isOpen && (
        <div style={{ 
          width: '360px',
          height: '480px',
          // ── Matte glass panel ──
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>

          {/* ── Header bar ── */}
          <div style={{ 
            background: 'rgba(252, 203, 11, 0.10)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderBottom: '1px solid rgba(252, 203, 11, 0.20)',
            padding: '14px 16px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Pulsing live dot */}
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#4caf50',
                boxShadow: '0 0 6px rgba(76,175,80,0.8)',
                display: 'inline-block',
                animation: 'pulse-dot 2s infinite',
              }} />
              <span>Macro AI Analyst</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.70)',
                cursor: 'pointer',
                width: '26px', height: '26px',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.70)';
              }}
            >
              ✖
            </button>
          </div>

          {/* ── Message list ── */}
          <div style={{ 
            flex: 1,
            padding: '14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user'
                  ? 'rgba(252, 203, 11, 0.90)'
                  : 'rgba(255, 255, 255, 0.06)',
                backdropFilter: msg.role === 'ai' ? 'blur(25px)' : 'none',
                WebkitBackdropFilter: msg.role === 'ai' ? 'blur(25px)' : 'none',
                border: msg.role === 'ai'
                  ? '1px solid rgba(255,255,255,0.15)'
                  : 'none',
                color: msg.role === 'user' ? '#000' : '#ffffff',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                maxWidth: '82%',
                fontSize: '13px',
                lineHeight: '1.5',
                boxShadow: msg.role === 'user'
                  ? '0 2px 12px rgba(252,203,11,0.20)'
                  : '0 2px 8px rgba(0,0,0,0.25)',
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{
                color: 'rgba(255,255,255,0.50)',
                fontSize: '12px',
                fontStyle: 'italic',
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ animation: 'pulse-dot 1.2s infinite' }}>●</span>
                <span style={{ animation: 'pulse-dot 1.2s 0.4s infinite' }}>●</span>
                <span style={{ animation: 'pulse-dot 1.2s 0.8s infinite' }}>●</span>
              </div>
            )}
          </div>

          {/* ── Input bar ── */}
          <div style={{ 
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(255,255,255,0.03)',
          }}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the charts..."
              style={{ 
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '13px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(252,203,11,0.50)')}
              onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              style={{ 
                background: isLoading
                  ? 'rgba(252,203,11,0.40)'
                  : 'rgba(252,203,11,0.92)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(252,203,11,0.35)',
                color: '#000',
                padding: '0 16px',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : '0 2px 12px rgba(252,203,11,0.25)',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ── */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            background: 'rgba(252, 203, 11, 0.88)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            color: '#000',
            border: '1px solid rgba(252,203,11,0.40)',
            borderRadius: '50px',
            padding: '14px 24px',
            fontSize: '14px', 
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(252, 203, 11, 0.35), 0 0 0 1px rgba(252,203,11,0.15)',
            transition: 'all 0.25s',
            letterSpacing: '0.2px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(252,203,11,0.50), 0 0 0 1px rgba(252,203,11,0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(252,203,11,0.35), 0 0 0 1px rgba(252,203,11,0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          💬 Ask AI Analyst
        </button>
      )}

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}