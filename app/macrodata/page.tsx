"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ChatPanel from '@/components/macrodata/ChatPanel';
import RegimeWidget from '@/components/macrodata/RegimeWidget';
import WTFNewsFeed from '@/components/macrodata/WTFNewsFeed';
import EconCalendar from '@/components/macrodata/EconCalendar';
import MacroBrief from '@/components/macrodata/MacroBrief';
import Fundamentals from '@/components/macrodata/Fundamentals'; // <-- Sage's new import
import VintageTracker from '@/components/macrodata/VintageTracker'; // <-- Your import
import OecdWidget from '@/components/macrodata/OecdWidget'; // <-- Your import
import EcbWidget from '@/components/macrodata/EcbWidget';
import ConsensusWidget from '../../components/macrodata/ConsensusWidget';
import TickerCard from '@/components/macrodata/TickerCard'; // <-- NEW: Finnhub Ticker Import (adjust path if needed)
import SentimentWidget from '@/components/macrodata/SentimentWidget';

const MacroLineChart = dynamic(
  () => import('@/components/macrodata/MacroLineChart'),
  { ssr: false, loading: () => <p style={{ color: '#888', padding: '20px' }}>Loading chart data...</p> }
);

// COMBINED: Includes Sage's 'Fundamentals' AND your 'Vintage Data' & 'Global Macro'
const SPECIAL_TABS = ['Vintage Data', 'Calendar', 'WTF Brief', 'Fundamentals', 'Positioning', 'Global Macro'];
const HIDDEN_TABS = ['Recession Data'];

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
  
  // YOURS: State to store official Government News
  const [govNews, setGovNews] = useState<any[]>([]);
  
  // YOURS: State to catch the Vintage Data for the AI
  const [vintageChatData, setVintageChatData] = useState<any>(null);

  // --- NEW: State to catch the Macro Regime Data for the AI ---
  const [macroRegimeChatData, setMacroRegimeChatData] = useState<any>({});

  // --- NEW: Frozen Callback to prevent infinite loops ---
  const handleRegimeData = useCallback((data: any) => {
    setMacroRegimeChatData({
      status: data.quadrant,
      growth3m: `${data.growth_mom_annualized > 0 ? '+' : ''}${data.growth_mom_annualized}%`,
      cpiYoy: `${data.cpi_yoy}%`,
      cpi12mAvg: `${data.cpi_yoy_avg_12m}%`
    });
  }, []); // <-- Empty array means this function NEVER changes identity

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

    // Updated to fetch Finnhub and bust the Vercel cache!
    const fetchYahooNews = async () => {
      try {
        // Adding the timestamp forces Vercel to run your Python code instead of using the cache
        const r = await fetch(`/api/news?bustcache=${Date.now()}`);
        const j = await r.json();
        setNews(j.data || []);
      } catch { setNews([]); }
    };

    // YOURS: Fetch the Government RSS Feed
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
      fetchGovNews(); // Trigger the Gov fetch!
    })();
  }, []);

  const dbTabs = Array.from(new Set(metadata.map((m: any) => m.tab_name)))
    .filter(tab => !HIDDEN_TABS.includes(tab));

  const allTabs = [
    ...dbTabs,
    ...SPECIAL_TABS.filter(t => !dbTabs.includes(t)),
  ];

  let activeCharts = metadata.filter((m: any) => m.tab_name === activeTab);
  
  // YOURS: Vintage Data AI override
  if (activeTab === 'Vintage Data' && vintageChatData) {
    activeCharts = [vintageChatData];
  }

  return (
    <main style={{ maxWidth: '1800px', margin: '0 auto', padding: '20px', backgroundColor: '#000', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1b2226', paddingBottom: '15px' }}>
        <div><h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, color: '#fff' }}>SKXY TERMINAL</h1></div>
        <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.5, letterSpacing: '1px' }}>
          <div>LIVE CONNECTION: <span style={{ color: '#4caf50' }}>ACTIVE</span></div>
          <div>DATASET: US_MACRO_CORE</div>
        </div>
      </header>

      <button className="mobile-toggle" onClick={() => setSidebar(!isSidebarOpen)}>
        {isSidebarOpen ? 'Hide Terminal Menu ▲' : 'Show Terminal Menu ▼'}
      </button>

      <div className="terminal-grid">
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
          <aside className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '20px', letterSpacing: '1px' }}>WATCHLIST</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <WatchlistItem label="S&P 500 (SPY)"      value={market.spy.price}  change={market.spy.change}  isPositive={market.spy.pos} />
              <WatchlistItem label="US 10Y Yield (IEF)" value={market.ief.price}  change={market.ief.change}  isPositive={market.ief.pos} />
              <WatchlistItem label="DXY Index (UUP)"    value={market.uup.price}  change={market.uup.change}  isPositive={market.uup.pos} />
              <WatchlistItem label="Bitcoin (BTC)"      value={market.btc.price}  change={market.btc.change}  isPositive={market.btc.pos} />
              <WatchlistItem label="Gold (GC=F)"        value={market.gold.price} change={market.gold.change} isPositive={market.gold.pos} />
              <div style={{ height: '1px', background: '#1b2226', margin: '5px 0' }} />
              <WatchlistItem label="Real GDP (BEA)" value={latestGDP !== null ? `${(latestGDP / 1000).toFixed(2)}T` : '---'} change="Quarterly" isPositive />
            </div>
          </aside>

          {/* --- FIX: Pass the frozen callback to RegimeWidget --- */}
          <RegimeWidget onDataFetched={handleRegimeData} />
          
          {/* --- YAHOO NEWS BAR --- */}
          <WTFNewsFeed maxItems={15} />

          {/* --- NEW: ALPHA VANTAGE AI SENTIMENT --- */}
          <SentimentWidget />

          {/* --- YOURS: OFFICIAL GOVERNMENT WIRE --- */}
          <aside className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', marginBottom: '15px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>GOV WIRE</span>
              <span style={{ background: '#1e3a8a', color: '#bfdbfe', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>OFFICIAL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {govNews.length > 0 ? govNews.slice(0, 5).map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.publisher.toUpperCase()}</span>
                    <span style={{ color: '#888', fontWeight: 'normal' }}>{getTimeAgo(item.time)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#60a5fa'} onMouseOut={(e) => e.currentTarget.style.color = '#e2e8f0'}>{item.title}</div>
                </a>
              )) : (
                <div style={{ fontSize: '12px', color: '#888' }}>Loading official releases...</div>
              )}
            </div>
          </aside>

          <aside className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', textAlign: 'center', marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, marginBottom: '10px', letterSpacing: '1px', color: '#888' }}>SPONSORED</div>
            <div style={{ fontSize: '13px', color: '#aaa', padding: '10px 0', lineHeight: '1.5' }}>
              Advertisement Space Available<br />
              <span style={{ fontSize: '11px', opacity: 0.6 }}>(Contact sage@worldtradefactory.com)</span>
            </div>
          </aside>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* --- NEW: FINNHUB LIVE TICKERS ROW --- */}
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
            <TickerCard symbol="AAPL" name="Apple" />
            <TickerCard symbol="TSLA" name="Tesla" />
            <TickerCard symbol="NVDA" name="NVIDIA" />
            <TickerCard symbol="META" name="Meta" />
          </div>

          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1b2226', paddingBottom: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {allTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? '#1b2226' : 'transparent',
                color: SPECIAL_TABS.includes(tab) 
                  ? (activeTab === tab ? '#d4af37' : '#d4af3799') 
                  : (activeTab === tab ? '#fff' : '#888'),
                border: SPECIAL_TABS.includes(tab)
                  ? (activeTab === tab ? '1px solid #d4af3733' : '1px solid #1b222666')
                  : 'none',
                padding: '10px 20px', 
                borderRadius: '8px',
                cursor: 'pointer', 
                fontWeight: 600, 
                transition: '0.2s', 
                whiteSpace: 'nowrap',
              }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* --- COMBINED SPECIAL CUSTOM TABS --- */}
            {activeTab === 'Vintage Data' && <VintageTracker onDataFetched={setVintageChatData} />}
            {activeTab === 'Calendar'     && <EconCalendar />}
            {activeTab === 'WTF Brief'    && <MacroBrief />}
            {activeTab === 'Fundamentals' && <Fundamentals />}
            {activeTab === 'Global Macro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <OecdWidget />
                <EcbWidget />
                {/* ADD THIS LINE BELOW */}
                <ConsensusWidget /> 
              </div>
            )}
            
            {activeTab === 'Positioning' && activeCharts.length === 0 && (
              <div style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#444', fontSize: '13px' }}>
                No positioning data yet.
              </div>
            )}

            {/* --- STANDARD DATABASE TABS + POSITIONING --- */}
            {(!SPECIAL_TABS.includes(activeTab) || activeTab === 'Positioning') && activeCharts.map((chart: any) => (
              <div key={chart.series_id} className="card chart-wrapper" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', overflow: 'hidden' }}>
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{chart.title}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Source: {chart.source}</p>
                </div>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <MacroLineChart seriesId={chart.series_id} recessionData={recessionData} />
                </div>
              </div>
            ))}
            
            {!SPECIAL_TABS.includes(activeTab) && activeCharts.length === 0 && activeTab !== '' && (
              <p style={{ color: '#888' }}>Loading charts...</p>
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
        macroRegime={macroRegimeChatData} /* <-- NEW: Real dynamic data injected here! */
        dynamicTabs={allTabs} 
      />

      <style jsx>{`
        .terminal-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
        .sidebar-container { display: none; flex-direction: column; gap: 30px; }
        .sidebar-container.open { display: flex; }
        .mobile-toggle { display: block; width: 100%; padding: 12px; background: #1b2226; color: white; border: 1px solid #333; border-radius: 8px; margin-bottom: 20px; font-weight: bold; cursor: pointer; text-align: center; }
        .chart-wrapper { height: 400px; width: 100%; }
        
        /* Utility class to hide the scrollbar for the ticker row but keep it scrollable */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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

function WatchlistItem({ label, value, change, isPositive }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 600, fontSize: '13px', color: '#aaa' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
        <div style={{ fontSize: '11px', color: isPositive ? '#4caf50' : '#ff5252' }}>{change}</div>
      </div>
    </div>
  );
}

// YOURS: Helper to parse GovWire time
function getTimeAgo(timeNum: number) {
  if (!timeNum) return '';
  const diff = new Date().getTime() - new Date(timeNum * 1000).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}