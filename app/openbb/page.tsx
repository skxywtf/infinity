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

        try {
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
                // For stocks, we fetch everything
                const techRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'technical' }) }).then(r => r.json());
                const quantRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'quantitative' }) }).then(r => r.json());
                const fundRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'fundamentals' }) }).then(r => r.json());
                // Options can be heavy, maybe fetch on click? For now fetch top
                const optRes = fetch('/api/openbb', { method: 'POST', body: JSON.stringify({ ticker: sym, type: 'options' }) }).then(r => r.json());

                const [tech, quant, fund, opt] = await Promise.all([techRes, quantRes, fundRes, optRes]);

                setTechnicalData(tech.data || []);
                setQuantitativeData(quant.data || []);
                setFundamentalsData(fund.data || []);
                setOptionsData(opt.data || []);
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

        setTicker(newTicker);
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


                    {/* Asset Class Tabs */}
                    <div className="flex gap-2 mt-4">
                        {['price', 'crypto', 'forex', 'economy'].map((cls) => (
                            <button
                                key={cls}
                                onClick={() => handleAssetChange(cls)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                    ${assetClass === cls
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {cls === 'price' ? 'Stocks' : cls}
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
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    {profileData?.shortName || ticker}
                                    <span className="text-sm font-normal text-slate-500 bg-white/5 py-1 px-2 rounded">{profileData?.currency || 'USD'}</span>
                                </h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-4xl font-mono font-medium text-cyan-400">
                                        {priceData.length > 0 ? (priceData[priceData.length - 1]?.close || 0).toFixed(2) : '---'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['1D', '1W', '1M', '3M', '6M', '1Y'].map(time => (
                                    <button
                                        key={time}
                                        onClick={() => handleRangeChange(time)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${time === timeRange ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Area - Robust Container */}
                        <div className="flex-1 w-full relative bg-white/5 rounded-xl border border-white/5 overflow-hidden min-h-[400px]">

                            {/* Loading Overlay */}
                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#0A0C14]/80 backdrop-blur-sm">
                                    <div className="flex items-center space-x-3 bg-[#0A0C14] px-6 py-3 rounded-full border border-cyan-500/30">
                                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                                        <span className="text-cyan-400 font-medium tracking-wide text-sm animate-pulse">Analyzing Market Data...</span>
                                    </div>
                                </div>
                            )}

                            {/* Chart - Delayed Render to fix width(-1) crash */}
                            {!loading && priceData.length > 0 && chartReady ? (
                                <div className="w-full h-full absolute inset-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={priceData}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis
                                                dataKey="dateStr"
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={12}
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
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : !loading && !priceData.length ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <p>No price data available.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Analysis Panel (Right Column) */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                    <div className="glass-panel rounded-2xl flex-1 flex flex-col min-h-[600px] overflow-hidden">

                        {/* Tab Navigation */}
                        <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
                            {['summary', 'financials', 'options', 'quantitative', 'news'].map(view => (
                                <button
                                    key={view}
                                    onClick={() => setAnalysisView(view)}
                                    className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                                        ${analysisView === view
                                            ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {view}
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
                                            <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
