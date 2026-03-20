"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChatPanel from '@/components/macrodata/ChatPanel';
import RegimeWidget from '@/components/macrodata/RegimeWidget';
import WTFNewsFeed from '@/components/macrodata/WTFNewsFeed';
import EconCalendar from '@/components/macrodata/EconCalendar';
import MacroBrief from '@/components/macrodata/MacroBrief';
import VintageTracker from '@/components/macrodata/VintageTracker';

const MacroLineChart = dynamic(
  () => import('@/components/macrodata/MacroLineChart'),
  { ssr: false, loading: () => <p style={{ color: '#888', padding: '20px' }}>Loading chart data...</p> }
);

// --- ADDED 'Vintage Data' RIGHT BEFORE CALENDAR ---
const SPECIAL_TABS = ['Vintage Data', 'Calendar', 'WTF Brief', 'Positioning'];
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
        const r = await fetch('/api/news');
        const j = await r.json();
        setNews(j.data || []);
      } catch { setNews([]); }
    };

    (async () => {
      const [spy, ief, uup, btc, gold] = await Promise.all([
        fetchMarket('SPY'), fetchMarket('IEF'), fetchMarket('UUP'),
        fetchMarket('BTC-USD'), fetchMarket('GC=F'),
      ]);
      setMarket({ spy, ief, uup, btc, gold });
      fetchYahooNews();
    })();
  }, []);

  const dbTabs = Array.from(new Set(metadata.map((m: any) => m.tab_name)))
    .filter(tab => !HIDDEN_TABS.includes(tab));

  const allTabs = [
    ...dbTabs,
    ...SPECIAL_TABS.filter(t => !dbTabs.includes(t)),
  ];

  const activeCharts = metadata.filter((m: any) => m.tab_name === activeTab);

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
              <WatchlistItem label="S&P 500 (SPY)"    value={market.spy.price}  change={market.spy.change}  isPositive={market.spy.pos} />
              <WatchlistItem label="US 10Y Yield (IEF)" value={market.ief.price} change={market.ief.change} isPositive={market.ief.pos} />
              <WatchlistItem label="DXY Index (UUP)"  value={market.uup.price}  change={market.uup.change}  isPositive={market.uup.pos} />
              <WatchlistItem label="Bitcoin (BTC)"    value={market.btc.price}  change={market.btc.change}  isPositive={market.btc.pos} />
              <WatchlistItem label="Gold (GC=F)"      value={market.gold.price} change={market.gold.change} isPositive={market.gold.pos} />
              <div style={{ height: '1px', background: '#1b2226', margin: '5px 0' }} />
              <WatchlistItem label="Real GDP (BEA)" value={latestGDP !== null ? `${(latestGDP / 1000).toFixed(2)}T` : '---'} change="Quarterly" isPositive />
            </div>
          </aside>

          <RegimeWidget />
          <WTFNewsFeed maxItems={15} />

          <aside className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', textAlign: 'center', marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, marginBottom: '10px', letterSpacing: '1px', color: '#888' }}>SPONSORED</div>
            <div style={{ fontSize: '13px', color: '#aaa', padding: '10px 0', lineHeight: '1.5' }}>
              Advertisement Space Available<br />
              <span style={{ fontSize: '11px', opacity: 0.6 }}>(Contact sage@worldtradefactory.com)</span>
            </div>
          </aside>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1b2226', paddingBottom: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {allTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? '#1b2226' : 'transparent',
                color: activeTab === tab ? '#fff' : '#888',
                border: SPECIAL_TABS.includes(tab) ? '1px solid #1b222666' : 'none',
                padding: '10px 20px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, transition: '0.2s', whiteSpace: 'nowrap',
                ...(SPECIAL_TABS.includes(tab) && activeTab !== tab ? { color: '#d4af3799' } : {}),
                ...(SPECIAL_TABS.includes(tab) && activeTab === tab ? { borderColor: '#d4af3733', color: '#d4af37' } : {}),
              }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* --- NEW VINTAGE DATA CANVAS --- */}
            {activeTab === 'Vintage Data' && <VintageTracker />}

            {activeTab === 'Calendar' && <EconCalendar />}
            {activeTab === 'WTF Brief' && <MacroBrief />}
            {activeTab === 'Positioning' && activeCharts.length === 0 && (
              <div style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#444', fontSize: '13px' }}>
                No positioning data yet.
              </div>
            )}
            {!SPECIAL_TABS.includes(activeTab) && activeCharts.map((chart: any) => (
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
            {activeTab === 'Positioning' && activeCharts.map((chart: any) => (
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

      <ChatPanel activeTab={activeTab} activeCharts={activeCharts} market={market} news={news} dynamicTabs={allTabs} />

      <style jsx>{`
        .terminal-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
        .sidebar-container { display: none; flex-direction: column; gap: 30px; }
        .sidebar-container.open { display: flex; }
        .mobile-toggle { display: block; width: 100%; padding: 12px; background: #1b2226; color: white; border: 1px solid #333; border-radius: 8px; margin-bottom: 20px; font-weight: bold; cursor: pointer; text-align: center; }
        .chart-wrapper { height: 400px; width: 100%; }
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