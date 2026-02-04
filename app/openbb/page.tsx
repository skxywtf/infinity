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
    const [loading, setLoading] = useState(false);
    const [priceData, setPriceData] = useState<any[]>([]);
    const [newsData, setNewsData] = useState<any[]>([]);
    const [profileData, setProfileData] = useState<any>(null);
    const [error, setError] = useState('');
    const [chartReady, setChartReady] = useState(false);

    // Search handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;
        await fetchData(ticker);
    };

    const fetchData = async (sym: string) => {
        setLoading(true);
        setError('');

        try {
            // 1. Fetch Price
            const priceRes = await fetch('/api/openbb', {
                method: 'POST',
                body: JSON.stringify({ ticker: sym, type: 'price' }),
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
            const profileRes = await fetch('/api/openbb', {
                method: 'POST',
                body: JSON.stringify({ ticker: sym, type: 'profile' }),
            });
            const profileJson = await profileRes.json();
            setProfileData(profileJson.data?.[0] || null);

        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchData('AAPL');
        // Delay chart rendering slightly to allow DOM layout to settle
        const timer = setTimeout(() => setChartReady(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">

            {/* Header & Search */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight">
                        INFINITY <span className="text-white/20 font-light">|</span> TERMINAL
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm tracking-wide">
                        Powered by local <strong className="text-cyan-400">OpenBB</strong> runtime
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="ENTER TICKER (e.g. NVDA)"
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

                {/* Chart Section (Main) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl min-h-[500px] flex flex-col">
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
                                    <button key={time} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${time === '6M' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Area - Robust Container */}
                        <div className="h-[400px] w-full relative bg-white/5 rounded-xl border border-white/5 overflow-hidden">

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
                                <div className="w-full h-full">
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

                {/* Sidebar (Stats & News) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Key Stats */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            Key Metrics
                        </h3>
                        {loading ? (
                            <div className="space-y-4 animate-pulse opacity-50">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-white/10 rounded"></div>)}
                            </div>
                        ) : (
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
                        )}
                    </div>

                    {/* Latest News */}
                    <div className="glass-panel p-6 rounded-2xl max-h-[400px] overflow-y-auto custom-scrollbar">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-purple-400" />
                            Latest News
                        </h3>
                        {loading ? (
                            <div className="space-y-4 animate-pulse opacity-50">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/10 rounded-xl"></div>)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {newsData.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No news found.</p>
                                ) : (
                                    newsData.map((item, idx) => (
                                        <a
                                            key={idx}
                                            href={item.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group p-3 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] uppercase text-cyan-500/70 font-bold bg-cyan-950/30 px-2 py-0.5 rounded">
                                                    {item.source || 'News'}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2">
                                                {item.title}
                                            </h4>
                                        </a>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
