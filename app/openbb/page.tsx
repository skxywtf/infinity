'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Newspaper, Activity, ArrowRight, Loader2 } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function OpenBBTerminal() {
    const [ticker, setTicker] = useState('AAPL'); // Default
    const [assetClass, setAssetClass] = useState('price'); // 'price' | 'crypto' | 'forex' | 'economy'
    // New State for Analysis View
    const [analysisView, setAnalysisView] = useState('summary'); // 'summary', 'financials', 'options', 'quantitative', 'news'

    const [loading, setLoading] = useState(false);

    // Data States
    const [priceData, setPriceData] = useState<any[]>([]);
    const [newsData, setNewsData] = useState<any[]>([]);
    const [profileData, setProfileData] = useState<any>(null);

    // New Data States
    const [technicalData, setTechnicalData] = useState<any[]>([]);
    const [quantitativeData, setQuantitativeData] = useState<any[]>([]);
    const [optionsData, setOptionsData] = useState<any[]>([]);
    const [fundamentalsData, setFundamentalsData] = useState<any[]>([]);
    const [bondsData, setBondsData] = useState<any[]>([]);

    // New Data States (Phase 3)
    const [analystsData, setAnalystsData] = useState<any[]>([]);
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [holdersData, setHoldersData] = useState<any[]>([]);

    // State for Phase 4
    const [marketData, setMarketData] = useState<any>({ gainers: [], losers: [], active: [] });
    const [showMacd, setShowMacd] = useState(false);
    const [showBbands, setShowBbands] = useState(false);

    const [error, setError] = useState('');
    const [chartReady, setChartReady] = useState(false);
    const [timeRange, setTimeRange] = useState('3M'); // Default to 3 Months

    // Search handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;
        await fetchData(ticker, assetClass, timeRange);
    };

    const fetchData = async (sym: string, type: string = 'price', range: string = '3M') => {
        setLoading(true);
        setError('');

        // Reset sub-data on new search
        setTechnicalData([]);
        setQuantitativeData([]);
        setOptionsData([]);
        setFundamentalsData([]);
        setAnalystsData([]);
        setEarningsData([]);
        setHoldersData([]);
        setMarketData({ gainers: [], losers: [], active: [] });

        try {
            // PHASE 4: Handle 'market' type specially
            if (type === 'market') {
                const mktRes = await fetch('/api/openbb', {
                    method: 'POST',
                    body: JSON.stringify({ ticker: 'MARKET', type: 'market' }),
                });
                const mktJson = await mktRes.json();
                setMarketData(mktJson.data || { gainers: [], losers: [], active: [] });
                setLoading(false);
                return;
            }

            // 1. Fetch Main Price/Data
            const priceRes = await fetch('/api/openbb', {
                method: 'POST',
                body: JSON.stringify({ ticker: sym, type: type, range }),
            });
            const priceJson = await priceRes.json();

            if (priceJson.error) throw new Error(priceJson.error);

            // Process data for Chart (ensure dates are readable)
            const cleanData = (priceJson.data || []).map((item: any) => ({
                ...item,
                dateStr: new Date(item.date || item.Date).toLocaleDateString(),
                close: item.Close || item.close,
            }));
            setPriceData(cleanData);

            // 2. Fetch News (Parallel)
            const newsRes = await fetch('/api/openbb', {
                method: 'POST',
                body: JSON.stringify({ ticker: sym, type: 'news' }),
            });
            const newsJson = await newsRes.json();
            setNewsData(newsJson.data || []);

            // 3. Fetch Profile (Parallel)
            if (type !== 'economy') {
                const profileRes = await fetch('/api/openbb', {
                    method: 'POST',
                    body: JSON.stringify({ ticker: sym, type: 'profile' }),
                });
                const profileJson = await profileRes.json();
                setProfileData(profileJson.data?.[0] || null);
            } else {
                setProfileData({ shortName: sym, currency: 'USD', marketCap: 0, sector: 'Macro', industry: 'Economy', exchange: 'FRED' });
            }

            // 4. Lazy Load / Parallel Load Analysis Data based on Asset Class
            if (type === 'price') {
                // For stocks, we fetch Technicals and Quant only (others removed)
                const techRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'technical' }) }).then(r => r.json());
                const quantRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'quantitative' }) }).then(r => r.json());

                const [tech, quant] = await Promise.all([techRes, quantRes]);

                setTechnicalData(tech.data || []);
                setQuantitativeData(quant.data || []);
            }

        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchData('AAPL', 'price', '3M');
        // Delay chart rendering slightly to allow DOM layout to settle
        const timer = setTimeout(() => setChartReady(true), 500);
        return () => clearTimeout(timer);
    }, []);

    // Handle Asset Class Switch
    const handleAssetChange = (newClass: string) => {
        if (newClass === assetClass) return;
        setAssetClass(newClass);
        // Default tickers for each class
        let newTicker = ticker;
        if (newClass === 'price') newTicker = 'AAPL';
        if (newClass === 'crypto') newTicker = 'BTC-USD';
        if (newClass === 'forex') newTicker = 'EURUSD=X';
        if (newClass === 'economy') newTicker = 'CPIAUCSL';
        if (newClass === 'market') newTicker = ''; // Market view has no ticker

        setTicker(newTicker);
        setAnalysisView('summary'); // Reset view
        fetchData(newTicker, newClass, timeRange);
    };

    // Handle Range Switch
    const handleRangeChange = (newRange: string) => {
        if (newRange === timeRange) return;
        setTimeRange(newRange);
        fetchData(ticker, assetClass, newRange);
    };

    // Helper to ensure valid news URL
    const getNewsUrl = (item: any) => {
        const url = item.url || item.URL || item.link;
        if (url && url !== '#' && url.startsWith('http')) return url;
        return `https://www.google.com/search?q=${encodeURIComponent(`${ticker} ${item.title || 'stock news'}`)}`;
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">

            {/* Header & Search */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight">
                        INFINITY <span className="text-white/20 font-light">|</span> TERMINAL
                    </h1>


                    {/* Top Bar: Asset Classes */}
                    <div className="flex items-center gap-4 mb-6 overflow-x-auto no-scrollbar">
                        {['price', 'crypto', 'forex', 'economy', 'market'].map((ac) => (
                            <button
                                key={ac}
                                onClick={() => handleAssetChange(ac)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap
                                        ${assetClass === ac
                                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {ac === 'price' ? 'Stocks' : ac}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder={
                            assetClass === 'crypto' ? "TICKER (e.g. BTC-USD)" :
                                assetClass === 'forex' ? "PAIR (e.g. EURUSD=X)" :
                                    assetClass === 'economy' ? "SERIES (e.g. CPIAUCSL)" :
                                        "ENTER TICKER (e.g. NVDA)"
                        }
                        className="block w-full pl-11 pr-4 py-3 bg-[#0A0C14] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-xl"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute inset-y-1 right-1 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SCAN'}
                    </button>
                </form>
            </header>

            {/* Error State */}
            {error && (
                <div className="mb-8 p-4 bg-red-950/30 border border-red-500/30 rounded-lg text-red-200 text-center">
                    Error: {error}
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Chart Section (Main - Left Column) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl min-h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {profileData?.shortName || ticker}
                                    {assetClass === 'crypto' && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/20">CRYPTO</span>}
                                    {assetClass === 'forex' && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/20">FOREX</span>}
                                    {assetClass === 'economy' && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">ECONOMY</span>}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-4xl font-mono font-bold text-cyan-400">
                                        {priceData[priceData.length - 1]?.close?.toFixed(2)}
                                    </span>
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{profileData?.currency || 'USD'}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                {['1W', '1M', '3M', '6M', '1Y', '5Y'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => { setTimeRange(range); fetchData(ticker, assetClass, range); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all
                                                ${timeRange === range ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CHART CONTROLS */}
                        {assetClass === 'price' && (
                            <div className="absolute top-4 right-4 flex gap-3 z-10">
                                <label className="flex items-center gap-2 text-xs text-slate-400 bg-black/40 px-2 py-1 rounded cursor-pointer hover:text-white border border-white/10 hover:border-cyan-500/50 transition-colors">
                                    <input type="checkbox" className="accent-cyan-500" checked={showMacd} onChange={e => setShowMacd(e.target.checked)} />
                                    MACD
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400 bg-black/40 px-2 py-1 rounded cursor-pointer hover:text-white border border-white/10 hover:border-cyan-500/50 transition-colors">
                                    <input type="checkbox" className="accent-cyan-500" checked={showBbands} onChange={e => setShowBbands(e.target.checked)} />
                                    BBands
                                </label>
                            </div>
                        )}

                        {/* MAIN VISUALIZATION: CHART or MARKET DASHBOARD */}
                        {assetClass === 'market' ? (
                            /* MARKET DATA DASHBOARD */
                            <div className="flex-1 w-full relative bg-white/5 rounded-xl border border-white/5 overflow-hidden p-6 overflow-y-auto custom-scrollbar">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-cyan-400" /> Market Overview
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Gainers */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                        <h4 className="text-green-400 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <TrendingUp size={14} /> Top Gainers
                                        </h4>
                                        <div className="space-y-3">
                                            {marketData.gainers?.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                                                    <div>
                                                        <div className="font-bold text-white">{item.symbol}</div>
                                                        <div className="text-xs text-slate-500 truncate w-24">{item.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-mono font-bold">+{item.change_percent?.toFixed(2)}%</div>
                                                        <div className="text-xs text-slate-400">${item.price?.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!marketData.gainers || marketData.gainers.length === 0) && <div className="text-slate-500 text-xs italic">No data</div>}
                                        </div>
                                    </div>

                                    {/* Losers */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                        <h4 className="text-red-400 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Activity size={14} /> Top Losers
                                        </h4>
                                        <div className="space-y-3">
                                            {marketData.losers?.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                                                    <div>
                                                        <div className="font-bold text-white">{item.symbol}</div>
                                                        <div className="text-xs text-slate-500 truncate w-24">{item.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-red-400 font-mono font-bold">{item.change_percent?.toFixed(2)}%</div>
                                                        <div className="text-xs text-slate-400">${item.price?.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!marketData.losers || marketData.losers.length === 0) && <div className="text-slate-500 text-xs italic">No data</div>}
                                        </div>
                                    </div>

                                    {/* Active */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                        <h4 className="text-cyan-400 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Activity size={14} /> Most Active
                                        </h4>
                                        <div className="space-y-3">
                                            {marketData.active?.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                                                    <div>
                                                        <div className="font-bold text-white">{item.symbol}</div>
                                                        <div className="text-xs text-slate-500 truncate w-24">{item.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-mono font-bold">{(item.volume / 1000000).toFixed(1)}M</div>
                                                        <div className="text-xs text-slate-400">Vol</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!marketData.active || marketData.active.length === 0) && <div className="text-slate-500 text-xs italic">No data</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* STANDARD DATA CHART */
                            <div className="h-[400px] w-full relative">
                                {!chartReady || loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-cyan-500" size={32} />
                                    </div>
                                ) : priceData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={priceData}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                            <XAxis
                                                dataKey="dateStr"
                                                stroke="#94a3b8"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                orientation="right"
                                                stroke="#94a3b8"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0A0C14', borderColor: '#334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#06b6d4' }}
                                                labelStyle={{ color: '#94a3b8' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="close"
                                                stroke="#06b6d4"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorPrice)"
                                                animationDuration={500}
                                            />
                                            {/* Phase 4 Overlays */}
                                            {showBbands && (
                                                <>
                                                    <Area type="monotone" dataKey="upper_band" stroke="#eab308" strokeWidth={1} fill="none" dot={false} strokeOpacity={0.7} />
                                                    <Area type="monotone" dataKey="lower_band" stroke="#eab308" strokeWidth={1} fill="none" dot={false} strokeOpacity={0.7} />
                                                </>
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : !loading && !priceData.length ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                        <p>No price data available.</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analysis Panel (Right Column) */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                <div className="glass-panel rounded-2xl flex-1 flex flex-col min-h-[600px] overflow-hidden">

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
                        {['summary', 'quantitative', 'news'].map(view => (
                            <button
                                key={view}
                                onClick={() => setAnalysisView(view)}
                                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                                        ${analysisView === view
                                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {view === 'quantitative' ? 'Quant' : view}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0A0C14]/50 backdrop-blur-sm z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                            </div>
                        ) : (
                            <>
                                {/* 1. SUMMARY VIEW (Key Metrics) */}
                                {analysisView === 'summary' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-cyan-400" />
                                            Key Metrics
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-slate-400 text-sm">Market Cap</span>
                                                <span className="font-mono">{profileData?.marketCap ? (profileData.marketCap / 1e9).toFixed(2) + 'B' : '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-slate-400 text-sm">Sector</span>
                                                <span className="text-right text-sm">{profileData?.sector || '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-slate-400 text-sm">Industry</span>
                                                <span className="text-right text-sm">{profileData?.industry || '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-slate-400 text-sm">Exchange</span>
                                                <span className="font-mono">{profileData?.exchange || '---'}</span>
                                            </div>
                                        </div>

                                        {/* Mini News Feed in Summary */}
                                        <div className="pt-6 border-t border-white/5">
                                            <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                                                <Newspaper className="h-3 w-3" /> Recent Headlines
                                            </h4>
                                            <div className="space-y-3">
                                                {newsData.slice(0, 3).map((item, idx) => (
                                                    <a key={idx} href={getNewsUrl(item)} target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-300 hover:text-cyan-400 truncate transition-colors">
                                                        • {item.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. FINANCIALS VIEW */}
                                {analysisView === 'financials' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Financial Statements</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-300">
                                                <thead className="text-xs uppercase text-slate-500 bg-white/5">
                                                    <tr>
                                                        <th className="px-2 py-2">Period</th>
                                                        <th className="px-2 py-2 text-right">Rev (B)</th>
                                                        <th className="px-2 py-2 text-right">Net (B)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fundamentalsData.length > 0 ? fundamentalsData.map((row, i) => (
                                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                            <td className="px-2 py-2 text-xs">{row.period || row.date}</td>
                                                            <td className="px-2 py-2 text-right text-green-400 font-mono">{(row.revenue / 1e9).toFixed(1)}</td>
                                                            <td className="px-2 py-2 text-right font-mono">{(row.netIncome / 1e9).toFixed(1)}</td>
                                                        </tr>
                                                    )) : <tr><td colSpan={3} className="p-4 text-center text-slate-500">No Data</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 3. OPTIONS VIEW */}
                                {analysisView === 'options' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold text-white">Options Chain</h3>
                                            <span className="text-xs text-slate-500 uppercase bg-white/5 px-2 py-1 rounded">Nearest Expiry</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <h4 className="text-center text-green-400 mb-2 font-bold text-xs uppercase border-b border-green-500/20 pb-1">Calls</h4>
                                                <div className="space-y-1">
                                                    {optionsData.filter(o => o.optionType === 'call').slice(0, 10).map((opt, i) => (
                                                        <div key={i} className="flex justify-between text-xs p-2 hover:bg-white/5 rounded">
                                                            <span className="text-slate-400 font-mono">{opt.strike}</span>
                                                            <span className="text-white font-bold">{opt.lastPrice?.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-center text-red-400 mb-2 font-bold text-xs uppercase border-b border-red-500/20 pb-1">Puts</h4>
                                                <div className="space-y-1">
                                                    {optionsData.filter(o => o.optionType === 'put').slice(0, 10).map((opt, i) => (
                                                        <div key={i} className="flex justify-between text-xs p-2 hover:bg-white/5 rounded">
                                                            <span className="text-slate-400 font-mono">{opt.strike}</span>
                                                            <span className="text-white font-bold">{opt.lastPrice?.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. QUANT VIEW */}
                                {analysisView === 'quantitative' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Fundamental Metrics</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {quantitativeData.length > 0 ? quantitativeData.map((metric, i) => (
                                                <div key={i} className="bg-white/5 p-3 rounded-lg text-center border border-white/5">
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{metric.metric}</div>
                                                    <div className="text-lg font-mono text-cyan-400 font-bold">{metric.value?.toFixed(2)}</div>
                                                </div>
                                            )) : <div className="col-span-2 text-center text-slate-500 py-10">No Data</div>}
                                        </div>
                                    </div>
                                )}

                                {/* 5. NEWS VIEW */}
                                {analysisView === 'news' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Newspaper className="h-4 w-4 text-purple-400" />
                                            Latest News
                                        </h3>
                                        <div className="space-y-3">
                                            {newsData.length === 0 ? (
                                                <p className="text-slate-500 text-sm">No news found.</p>
                                            ) : (
                                                newsData.map((item, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={getNewsUrl(item)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] uppercase text-cyan-500/70 font-bold bg-cyan-950/30 px-2 py-0.5 rounded">
                                                                {item.source || 'News'}
                                                            </span>
                                                            <span className="text-slate-500 text-[10px]">
                                                                {new Date(item.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-relaxed">
                                                            {item.title}
                                                        </h4>
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 6. ANALYSTS VIEW (Phase 3) */}
                                {analysisView === 'analysts' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Analyst Consensus</h3>
                                        {analystsData.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-xs uppercase text-slate-500 bg-white/5">
                                                        <tr>
                                                            <th className="px-2 py-2">Period</th>
                                                            <th className="px-2 py-2 text-right">Strong Buy</th>
                                                            <th className="px-2 py-2 text-right">Buy</th>
                                                            <th className="px-2 py-2 text-right">Hold</th>
                                                            <th className="px-2 py-2 text-right">Sell</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analystsData.slice(0, 5).map((row, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                                <td className="px-2 py-2 text-xs">{row.period || 'Current'}</td>
                                                                <td className="px-2 py-2 text-right text-green-400 font-bold">{row.strongBuy || row.strong_buy || 0}</td>
                                                                <td className="px-2 py-2 text-right text-green-300">{row.buy}</td>
                                                                <td className="px-2 py-2 text-right text-yellow-500">{row.hold}</td>
                                                                <td className="px-2 py-2 text-right text-red-500">{row.sell}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : <div className="text-center text-slate-500 py-10">No Analysts Data</div>}
                                    </div>
                                )}

                                {/* 7. EARNINGS VIEW (Phase 3) */}
                                {analysisView === 'earnings' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Earnings History</h3>
                                        {earningsData.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-xs uppercase text-slate-500 bg-white/5">
                                                        <tr>
                                                            <th className="px-2 py-2">Date</th>
                                                            <th className="px-2 py-2 text-right">EPS Est</th>
                                                            <th className="px-2 py-2 text-right">EPS Act</th>
                                                            <th className="px-2 py-2 text-right">Surprise</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {earningsData.slice(0, 5).map((row, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                                <td className="px-2 py-2 text-xs">{new Date(row.date || row.reportDate).toLocaleDateString()}</td>
                                                                <td className="px-2 py-2 text-right text-slate-400">{row.epsEstimate?.toFixed(2)}</td>
                                                                <td className="px-2 py-2 text-right font-bold text-white">{row.epsActual?.toFixed(2)}</td>
                                                                <td className={`px-2 py-2 text-right font-mono ${(row.surprisePercent || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {row.surprisePercent ? `${(row.surprisePercent * 100).toFixed(1)}%` : '---'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : <div className="text-center text-slate-500 py-10">No Earnings Data</div>}
                                    </div>
                                )}

                                {/* 8. HOLDERS VIEW (Phase 3) */}
                                {analysisView === 'holders' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Institutional Holders</h3>
                                        {holdersData.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-xs uppercase text-slate-500 bg-white/5">
                                                        <tr>
                                                            <th className="px-2 py-2">Holder</th>
                                                            <th className="px-2 py-2 text-right">Shares</th>
                                                            <th className="px-2 py-2 text-right">Value (M)</th>
                                                            <th className="px-2 py-2 text-right">% Out</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {holdersData.slice(0, 10).map((row, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                                <td className="px-2 py-2 text-xs truncate max-w-[150px]" title={row.holder || row.Holder}>{row.holder || row.Holder}</td>
                                                                <td className="px-2 py-2 text-right font-mono text-slate-400">{(row.shares || row.Shares).toLocaleString()}</td>
                                                                <td className="px-2 py-2 text-right font-mono text-green-400">{((row.value || row.Value) / 1e6).toFixed(0)}</td>
                                                                <td className="px-2 py-2 text-right font-mono">{(row.percentHeld || row['% Out'] || 0) + '%'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : <div className="text-center text-slate-500 py-10">No Holders Data</div>}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
