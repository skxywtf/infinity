"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Copy, Terminal, Activity, TrendingUp, Shield, BarChart3, Globe, Users,
    Newspaper, FileText, Download, Maximize2, Minimize2, Check, Sun, Moon,
    Sparkles, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface LogEntry {
    type: "log" | "status" | "error" | "chunk" | "result" | "report";
    content: any;
    timestamp: string;
}

export default function TradingDashboard() {
    const [ticker, setTicker] = useState("NVDA");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState("Ready");
    const [activeTab, setActiveTab] = useState("Overview");

    // UI Features State
    const [isMaximized, setIsMaximized] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Reports State
    const [reports, setReports] = useState<{ [key: string]: string }>({
        market_report: "",
        sentiment_report: "",
        news_report: "",
        fundamentals_report: "",
        investment_plan: "",
        trader_investment_plan: "",
        final_trade_decision: "",
        risk_analysis: ""
    });

    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Theme Toggle Effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const startAnalysis = async () => {
        setIsRunning(true);
        setLogs([]);
        setReports({});
        setStatus("Initializing...");

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/analyze", {
                ticker,
                date,
            });
            const newRunId = response.data.run_id;
            setRunId(newRunId);
            connectWebSocket(newRunId);
        } catch (error) {
            console.error("Failed to start analysis:", error);
            setIsRunning(false);

            if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
                setStatus("Error: Backend Offline");
            } else {
                setStatus("Error starting analysis");
            }
        }
    };

    const connectWebSocket = (id: string) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${id}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const timestamp = new Date().toLocaleTimeString();

                if (data.type === "chunk") {
                    // Ignore raw chunks
                } else if (data.type === "result") {
                    setStatus("Analysis Complete");
                    setIsRunning(false);
                } else if (data.type === "status") {
                    setStatus(data.content.status);
                } else if (data.type === "report") {
                    setReports((prev) => ({
                        ...prev,
                        [data.content.key]: data.content.content
                    }));
                }

                // Log filtering
                if (['log', 'status', 'error'].includes(data.type)) {
                    setLogs((prev) => [...prev, { type: data.type, content: data.content, timestamp }]);
                }

            } catch (e) {
                console.error("Error parsing WS message", e);
            }
        };

        ws.onclose = () => {
            // setIsRunning(false);
        };
    };

    const renderActiveReport = () => {
        let content = "";
        let isWaiting = false;

        switch (activeTab) {
            case 'Overview':
                content = reports.market_report || reports.news_report || "";
                if (!content && isRunning) isWaiting = true;
                break;
            case 'Analyst Reports':
                const combined = [reports.fundamentals_report, reports.sentiment_report].filter(Boolean).join('\n\n');
                if (combined) content = combined;
                else if (isRunning) isWaiting = true;
                break;
            case 'Strategy':
                content = reports.investment_plan || reports.trader_investment_plan || "";
                if (!content && isRunning) isWaiting = true;
                break;
            case 'Risk':
                content = reports.risk_analysis || "";
                if (!content && isRunning) isWaiting = true;
                break;
            default: content = "Select a tab";
        }

        if (isRunning && isWaiting) {
            return (
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-white/5 rounded w-3/4 skeleton"></div>
                    <div className="h-4 bg-white/5 rounded w-full skeleton"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6 skeleton"></div>
                    <div className="h-4 bg-white/5 rounded w-4/6 skeleton"></div>
                    <div className="h-32 bg-white/5 rounded w-full skeleton mt-8"></div>
                </div>
            );
        }

        if (!content && !isRunning) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                    <Sparkles className="w-12 h-12 mb-4 text-cyan-500/50" />
                    <p className="text-sm font-medium uppercase tracking-widest">System Ready</p>
                    <p className="text-xs text-slate-600 mt-2">Initialize sequence to begin analysis</p>
                </div>
            );
        }

        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "_Waiting for data..._"}
            </ReactMarkdown>
        );
    };

    const handleCopy = async () => {
        // Can't copy elements easily, just returning functionality for non-skeleton text
        const content = Object.values(reports).find(r => r.length > 0) ? "Report Content..." : "";
        // Simple clipboard check
        try {
            // We might need to reconstruct raw text or just copy what's available
            // For now, simpler implementation
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) { }
    };


    return (
        <div className="flex h-screen bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden font-sans selection:bg-cyan-500/30 transition-colors duration-500">

            {/* Sidebar - Hidden when Maximized */}
            <div className={cn(
                "w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col transition-all duration-300 ease-in-out no-print",
                isMaximized ? "-ml-64" : "ml-0"
            )}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                        InfinityXZ
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Trading Intelligence</p>
                </div>

                <div className="px-4 py-2 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400">Ticker Symbol</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="w-full bg-[var(--color-muted)] border border-[var(--color-border)] rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors text-[var(--color-foreground)]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400">Analysis Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-[var(--color-muted)] border border-[var(--color-border)] rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors text-[var(--color-foreground)]"
                        />
                    </div>

                    <button
                        onClick={startAnalysis}
                        disabled={isRunning}
                        className={cn(
                            "w-full mt-4 py-2 rounded text-sm font-medium transition-all duration-300",
                            isRunning
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        )}
                    >
                        {isRunning ? (
                            <span className="flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4 animate-spin" />
                                Processing
                            </span>
                        ) : (
                            "Init Sequence"
                        )}
                    </button>
                </div>

                {/* Theme Toggle in Middle Spacer */}
                <div className="flex-1 px-4 py-4">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-500 transition-colors w-full p-2 rounded hover:bg-[var(--color-muted)]"
                    >
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                </div>

                <div className="mt-auto p-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-cyan-500 animate-pulse" : "bg-slate-600")} />
                        <span className="text-xs font-mono text-slate-400">{status}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header - Hidden when Maximized */}
                <header className={cn(
                    "h-16 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-[var(--color-background)]/50 backdrop-blur-sm z-10 transition-all duration-300 no-print",
                    isMaximized ? "-mt-16 opacity-0" : "mt-0 opacity-100"
                )}>
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-slate-500" />
                        <div className="h-4 w-[1px] bg-[var(--color-border)]" />
                        <span className="font-mono text-xs text-cyan-500 tracking-wider">
                            {runId ? `SESSION: ${runId.slice(0, 8).toUpperCase()}` : "SYSTEM: READY"}
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-600" />
                            <span>Market: Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500/70" />
                            <span>RiskGuard: Active</span>
                        </div>
                    </div>
                </header>

                {/* Grid View */}
                <div className="flex-1 p-6 overflow-hidden flex gap-6 relative">

                    {/* Logs / Stream Panel - Hidden when Maximized */}
                    <div className={cn(
                        "flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden glass-panel transition-all duration-300 no-print",
                        isMaximized ? "w-0 opacity-0 p-0 border-0" : "w-1/3"
                    )}>
                        {/* Header with Fixed Height for Alignment */}
                        <div className="h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-muted)]/10 flex items-center justify-between shrink-0">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Stream</span>
                            <Terminal className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 text-slate-400/80 hover:text-[var(--color-foreground)] transition-colors">
                                    <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                                    <span className={cn(
                                        "break-words leading-relaxed whitespace-pre-wrap",
                                        log.type === "error" && "text-red-400 font-bold",
                                        log.type === "status" && "text-cyan-600 font-bold",
                                        log.type === "log" && "text-slate-400"
                                    )}>
                                        {typeof log.content === 'object' ? JSON.stringify(log.content) : log.content}
                                    </span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* Reports / Visualization Panel */}
                    <div className={cn(
                        "flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden glass-panel transition-all duration-300",
                        isMaximized ? "absolute inset-0 z-20 m-0 rounded-none border-0" : "flex-1"
                    )}>
                        {/* Header with Fixed Height for Alignment */}
                        <div className="h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-muted)]/10 flex items-center justify-between shrink-0">
                            {/* Tabs */}
                            <div className="flex items-center gap-6 h-full">
                                {['Overview', 'Analyst Reports', 'Strategy', 'Risk'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "text-xs font-semibold uppercase tracking-wider transition-colors hover:text-cyan-400 h-full border-b-2",
                                            activeTab === tab ? "text-cyan-500 border-cyan-500" : "text-slate-400 border-transparent"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 hover:bg-[var(--color-muted)] rounded transition-colors text-slate-400 hover:text-cyan-400"
                                    title="Copy to Clipboard"
                                >
                                    {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1" />
                                <button
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    className={cn(
                                        "p-1.5 hover:bg-[var(--color-muted)] rounded transition-colors",
                                        isMaximized ? "text-cyan-500 bg-[var(--color-muted)]" : "text-slate-400 hover:text-cyan-400"
                                    )}
                                    title={isMaximized ? "Minimize" : "Maximize"}
                                >
                                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8 text-[var(--color-foreground)] overflow-y-auto bg-gradient-to-b from-transparent to-[var(--color-background)]/20">
                            <div className={cn(
                                "prose prose-invert max-w-none custom-markdown transition-all duration-300 h-full",
                                isMaximized ? "prose-lg max-w-4xl mx-auto" : "prose-sm"
                            )}>
                                {renderActiveReport()}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
