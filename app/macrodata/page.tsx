"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ChatPanel from '@/components/macrodata/ChatPanel';
import RegimeWidget from '@/components/macrodata/RegimeWidget';
import WTFNewsFeed from '@/components/macrodata/WTFNewsFeed';
import EconCalendar from '@/components/macrodata/EconCalendar';
import MacroBrief from '@/components/macrodata/MacroBrief';
import Fundamentals from '@/components/macrodata/Fundamentals';
import VintageTracker from '@/components/macrodata/VintageTracker';
import OecdWidget from '@/components/macrodata/OecdWidget';
import EcbWidget from '@/components/macrodata/EcbWidget';
import ConsensusWidget from '../../components/macrodata/ConsensusWidget';
import TickerCard from '@/components/macrodata/TickerCard';
import SentimentWidget from '@/components/macrodata/SentimentWidget';

const MacroLineChart = dynamic(
  () => import('@/components/macrodata/MacroLineChart'),
  { ssr: false, loading: () => <p style={{ color: '#888', padding: '20px' }}>Loading chart data...</p> }
);

const SPECIAL_TABS = ['Vintage Data', 'Calendar', 'WTF Brief', 'Fundamentals', 'Positioning', 'Global Macro'];
const HIDDEN_TABS = ['Recession Data'];

// ─── Shared glass style tokens ───────────────────────────────────────────────
const glass = {
  base: {
    background: 'rgba(11, 20, 22, 0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
  } as React.CSSProperties,
  accent: {
    background: 'rgba(11, 20, 22, 0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  } as React.CSSProperties,
};
// ─────────────────────────────────────────────────────────────────────────────

export default function MacroPage() {
  const [activeTab, setActiveTab]     = useState('');
  const [metadata, setMetadata]       = useState<any[]>([]);
  const [recessionData, setRecession] = useState<any[]>([]);
  const [latestGDP, setLatestGDP]     = useState<number | null>(null);
  const [isSidebarOpen, setSidebar]   = useState(false);

  const [market, setMarket] = useState<any>({
    spy:  { price: '---', change: '0.00%', pos: true },
    ief:  { price: '---', change: '0.00%', pos: true },
    uup:  { price: '---', change: '0.00%', pos: true },
    btc:  { price: '---', change: '0.00%', pos: true },
    gold: { price: '---', change: '0.00%', pos: true },
  });

  const [news, setNews] = useState<any[]>([]);
  const [govNews, setGovNews] = useState<any[]>([]);
  const [vintageChatData, setVintageChatData] = useState<any>(null);
  const [macroRegimeChatData, setMacroRegimeChatData] = useState<any>({});
  const [finnhubChatData, setFinnhubChatData] = useState<Record<string, any>>({});
  const [sentimentChatData, setSentimentChatData] = useState<any[]>([]);
  const [consensusChatData, setConsensusChatData] = useState<any>(null);

  const handleRegimeData = useCallback((data: any) => {
    setMacroRegimeChatData({
      status: data.quadrant,
      growth3m: `${data.growth_mom_annualized > 0 ? '+' : ''}${data.growth_mom_annualized}%`,
      cpiYoy: `${data.cpi_yoy}%`,
      cpi12mAvg: `${data.cpi_yoy_avg_12m}%`
    });
  }, []);

  const handleFinnhubData = useCallback((data: any) => {
    setFinnhubChatData(prev => ({ ...prev, [data.symbol]: data }));
  }, []);

  const handleSentimentData = useCallback((data: any) => {
    setSentimentChatData(data);
  }, []);

  const handleConsensusData = useCallback((data: any) => {
    setConsensusChatData(data);
  }, []);

  useEffect(() => {
    fetch('/api/tabs').then(r => r.json()).then(data => {
      setMetadata(data);
      if (data.length > 0) setActiveTab(data[0].tab_name);
    }).catch(console.error);

    fetch('/api/latest/BEA_REAL_GDP').then(r => r.json()).then(d => {
      const v = parseFloat(d.value);
      setLatestGDP(isNaN(v) ? null : v);
    }).catch(console.error);

    fetch('/api/data/USREC').then(r => r.json()).then(data => {
      setRecession(data.map((d: any) => ({ time: d.date, value: parseFloat(d.value) })));
    }).catch(console.error);

    const fetchMarket = async (symbol: string) => {
      try {
        const r = await fetch(`/api/market/${symbol}`);
        if (!r.ok) throw new Error('bad');
        return await r.json();
      } catch { return { price: '---', change: '0.00%', pos: true }; }
    };

    const fetchYahooNews = async () => {
      try {
        const r = await fetch(`/api/news?bustcache=${Date.now()}`);
        const j = await r.json();
        setNews(j.data || []);
      } catch { setNews([]); }
    };

    const fetchGovNews = async () => {
      try {
        const r = await fetch('/api/gov-news');
        const j = await r.json();
        setGovNews(j.data || []);
      } catch { setGovNews([]); }
    };

    (async () => {
      const [spy, ief, uup, btc, gold] = await Promise.all([
        fetchMarket('SPY'), fetchMarket('IEF'), fetchMarket('UUP'),
        fetchMarket('BTC-USD'), fetchMarket('GC=F'),
      ]);
      setMarket({ spy, ief, uup, btc, gold });
      fetchYahooNews();
      fetchGovNews();
    })();
  }, []);

  const dbTabs = Array.from(new Set(metadata.map((m: any) => m.tab_name)))
    .filter(tab => !HIDDEN_TABS.includes(tab));

  const allTabs = [
    ...dbTabs,
    ...SPECIAL_TABS.filter(t => !dbTabs.includes(t)),
  ];

  let activeCharts = metadata.filter((m: any) => m.tab_name === activeTab);

  if (activeTab === 'Vintage Data' && vintageChatData) {
    activeCharts = [vintageChatData];
  }

  return (
    // ── Page root: deep dark background with subtle radial glow ───────────────
    <main style={{
      maxWidth: '1800px',
      margin: '0 auto',
      padding: '20px',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(16,32,40,0.9) 0%, #050a0b 60%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'sans-serif',
      position: 'relative',
    }}>

      {/* Ambient background glow orbs — purely decorative */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '30%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '10%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            margin: 0,
            color: '#fff',
            textShadow: '0 0 30px rgba(255,255,255,0.15)',
          }}>
            SKXY TERMINAL
          </h1>
        </div>
        <div style={{
          textAlign: 'right',
          fontSize: '11px',
          opacity: 0.55,
          letterSpacing: '1px',
        }}>
          <div>LIVE CONNECTION: <span style={{ color: '#4caf50', textShadow: '0 0 8px rgba(76,175,80,0.6)' }}>ACTIVE</span></div>
          <div>DATASET: US_MACRO_CORE</div>
        </div>
      </header>

      {/* ── Mobile toggle ───────────────────────────────────────────────────── */}
      <button className="mobile-toggle" onClick={() => setSidebar(!isSidebarOpen)}>
        {isSidebarOpen ? 'Hide Terminal Menu ▲' : 'Show Terminal Menu ▼'}
      </button>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="terminal-grid" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>

          {/* Watchlist glass card */}
          <aside style={{
            ...glass.accent,
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '20px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Watchlist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <WatchlistItem label="S&P 500 (SPY)"      value={market.spy.price}  change={market.spy.change}  isPositive={market.spy.pos} />
              <WatchlistItem label="US 10Y Yield (IEF)" value={market.ief.price}  change={market.ief.change}  isPositive={market.ief.pos} />
              <WatchlistItem label="DXY Index (UUP)"    value={market.uup.price}  change={market.uup.change}  isPositive={market.uup.pos} />
              <WatchlistItem label="Bitcoin (BTC)"      value={market.btc.price}  change={market.btc.change}  isPositive={market.btc.pos} />
              <WatchlistItem label="Gold (GC=F)"        value={market.gold.price} change={market.gold.change} isPositive={market.gold.pos} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <WatchlistItem
                label="Real GDP (BEA)"
                value={latestGDP !== null ? `${(latestGDP / 1000).toFixed(2)}T` : '---'}
                change="Quarterly"
                isPositive
              />
            </div>
          </aside>

          <RegimeWidget onDataFetched={handleRegimeData} />
          <WTFNewsFeed maxItems={15} />
          <SentimentWidget onDataFetched={handleSentimentData} />

          {/* Gov Wire glass card */}
          <aside style={{
            ...glass.accent,
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#60a5fa',
              marginBottom: '15px',
              letterSpacing: '2px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>GOV WIRE</span>
              <span style={{
                background: 'rgba(30,58,138,0.5)',
                border: '1px solid rgba(96,165,250,0.2)',
                color: '#bfdbfe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '9px',
                letterSpacing: '1px',
                backdropFilter: 'blur(8px)',
              }}>
                OFFICIAL
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {govNews.length > 0 ? govNews.slice(0, 5).map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#60a5fa',
                    fontWeight: 'bold',
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>{item.publisher.toUpperCase()}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 'normal' }}>{getTimeAgo(item.time)}</span>
                  </div>
                  <div
                    style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', transition: 'color 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseOut={e  => (e.currentTarget.style.color = '#cbd5e1')}
                  >
                    {item.title}
                  </div>
                </a>
              )) : (
                <div style={{ fontSize: '12px', color: '#555' }}>Loading official releases...</div>
              )}
            </div>
          </aside>

          {/* Sponsored glass card */}
          <aside style={{
            ...glass.base,
            padding: '20px',
            textAlign: 'center',
            marginTop: 'auto',
            border: '1px dashed rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: '10px', letterSpacing: '2px' }}>
              SPONSORED
            </div>
            <div style={{ fontSize: '13px', color: '#666', padding: '10px 0', lineHeight: '1.6' }}>
              Advertisement Space Available<br />
              <span style={{ fontSize: '11px', opacity: 0.5 }}>(Contact sage@worldtradefactory.com)</span>
            </div>
          </aside>
        </div>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* Ticker row */}
          <div className="hide-scrollbar" style={{
            display: 'flex',
            gap: '15px',
            overflowX: 'auto',
            paddingBottom: '10px',
            WebkitOverflowScrolling: 'touch',
          }}>
            <TickerCard symbol="AAPL" name="Apple"  onDataFetched={handleFinnhubData} />
            <TickerCard symbol="TSLA" name="Tesla"  onDataFetched={handleFinnhubData} />
            <TickerCard symbol="NVDA" name="NVIDIA" onDataFetched={handleFinnhubData} />
            <TickerCard symbol="META" name="Meta"   onDataFetched={handleFinnhubData} />
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '12px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            {allTabs.map(tab => {
              const isActive   = activeTab === tab;
              const isSpecial  = SPECIAL_TABS.includes(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: isActive
                      ? (isSpecial
                          ? 'rgba(212,175,55,0.12)'
                          : 'rgba(255,255,255,0.08)')
                      : 'transparent',
                    backdropFilter: isActive ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isActive ? 'blur(12px)' : 'none',
                    color: isSpecial
                      ? (isActive ? '#d4af37' : 'rgba(212,175,55,0.5)')
                      : (isActive ? '#fff'    : 'rgba(255,255,255,0.45)'),
                    border: isSpecial
                      ? (isActive
                          ? '1px solid rgba(212,175,55,0.35)'
                          : '1px solid rgba(212,175,55,0.12)')
                      : (isActive
                          ? '1px solid rgba(255,255,255,0.12)'
                          : '1px solid transparent'),
                    boxShadow: isActive && isSpecial
                      ? '0 0 12px rgba(212,175,55,0.12)'
                      : isActive
                        ? '0 0 12px rgba(255,255,255,0.04)'
                        : 'none',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {activeTab === 'Vintage Data' && <VintageTracker onDataFetched={setVintageChatData} />}
            {activeTab === 'Calendar'     && <EconCalendar />}
            {activeTab === 'WTF Brief'    && <MacroBrief />}
            {activeTab === 'Fundamentals' && <Fundamentals />}
            {activeTab === 'Global Macro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <OecdWidget />
                <EcbWidget />
                <ConsensusWidget onDataFetched={handleConsensusData} />
              </div>
            )}

            {activeTab === 'Positioning' && activeCharts.length === 0 && (
              <div style={{
                ...glass.base,
                padding: '40px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '13px',
              }}>
                No positioning data yet.
              </div>
            )}

            {/* Chart cards */}
            {(!SPECIAL_TABS.includes(activeTab) || activeTab === 'Positioning') && activeCharts.map((chart: any) => (
              <div
                key={chart.series_id}
                className="card chart-wrapper"
                style={{
                  ...glass.accent,
                  padding: '20px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)')}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '-0.5px',
                  }}>
                    {chart.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
                    Source: {chart.source}
                  </p>
                </div>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <MacroLineChart seriesId={chart.series_id} recessionData={recessionData} />
                </div>
              </div>
            ))}

            {!SPECIAL_TABS.includes(activeTab) && activeCharts.length === 0 && activeTab !== '' && (
              <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading charts...</p>
            )}
          </div>
        </section>
      </div>

      <ChatPanel
        activeTab={activeTab}
        activeCharts={activeCharts}
        market={market}
        news={news}
        govNews={govNews}
        macroRegime={macroRegimeChatData}
        dynamicTabs={allTabs}
        finnhub={finnhubChatData}
        sentiment={sentimentChatData}
        consensus={consensusChatData}
      />

      <style jsx>{`
        .terminal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        .sidebar-container {
          display: none;
          flex-direction: column;
          gap: 20px;
        }
        .sidebar-container.open { display: flex; }

        .mobile-toggle {
          display: block;
          width: 100%;
          padding: 12px;
          background: rgba(27, 34, 38, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: white;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: bold;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
        }
        .mobile-toggle:hover {
          background: rgba(40, 52, 58, 0.7);
        }

        .chart-wrapper {
          height: 400px;
          width: 100%;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (min-width: 1024px) {
          .terminal-grid { grid-template-columns: 320px 1fr; }
          .sidebar-container { display: flex; }
          .mobile-toggle { display: none; }
          .chart-wrapper { height: 550px; width: 95%; }
        }
      `}</style>
    </main>
  );
}

// ── WatchlistItem ─────────────────────────────────────────────────────────────
function WatchlistItem({ label, value, change, isPositive }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{value}</div>
        <div style={{
          fontSize: '11px',
          color: isPositive ? '#4caf50' : '#ff5252',
          textShadow: isPositive
            ? '0 0 8px rgba(76,175,80,0.4)'
            : '0 0 8px rgba(255,82,82,0.4)',
        }}>
          {change}
        </div>
      </div>
    </div>
  );
}

// ── getTimeAgo ────────────────────────────────────────────────────────────────
function getTimeAgo(timeNum: number) {
  if (!timeNum) return '';
  const diff = new Date().getTime() - new Date(timeNum * 1000).getTime();
  const mins  = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
}