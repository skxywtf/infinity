'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, X, RefreshCw, Activity, Zap } from 'lucide-react';
import MessageBubble, { Message } from './MessageBubble';
import MessageInput from './MessageInput';
import ThoughtStream, { ThoughtLog } from './ThoughtStream';

const INITIAL_MESSAGE: Message = {
    id: 'init-1',
    role: 'assistant',
    content: "**InfinityXZ Online.**\n\nI am connected to the World Trade Factory intelligence grid. Enter a stock symbol (e.g., **$NVDA**, **BTC**, **AAPL**) to initiate a deep-dive analysis.",
    timestamp: new Date()
};

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [logs, setLogs] = useState<ThoughtLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showThoughts, setShowThoughts] = useState(true); // Default show on desktop

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        // 1. Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setLogs([]); // Clear previous logs on new run

        // 2. Extract Ticker (Simple Logic for now)
        const tickerMatch = text.match(/\$?([A-Za-z]{2,6})/);
        const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : null;

        if (!ticker) {
            setTimeout(() => {
                const errorMsg: Message = {
                    id: Date.now() + 1 + '',
                    role: 'assistant',
                    content: "I couldn't identify a valid stock ticker in your request. Please try again with a symbol like **NVDA** or **$TSLA**.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsLoading(false);
            }, 600);
            return;
        }

        // 3. Simulate Analysis / Call Backend
        try {
            // Add initial logs
            addLog(`Initializing analysis for ${ticker}...`, 'info');
            await delay(800);
            addLog(`Dispatching Analyst Agents...`, 'step');

            // CALL BACKEND STREAM
            // Since we don't have the Python stream route perfectly set up in Next.js yet,
            // we will simulate the "Thought Stream" for the UI demo using the logic we know exists.

            // Simulation of Graph Execution
            await simulateGraphExecution(ticker);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: Date.now() + 1 + '',
                role: 'assistant',
                content: "System Error: Connection to Trading Graph failed. Please check the backend status.",
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            addLog(`Critical Failure: ${error}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const addLog = (msg: string, type: ThoughtLog['type'] = 'info') => {
        setLogs(prev => [...prev, {
            id: Date.now() + Math.random().toString(),
            message: msg,
            type,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Temporary simulation until API connection is solidified
    const simulateGraphExecution = async (ticker: string) => {
        await delay(1000);
        addLog(`Market Analyst: Fetching price data from YFinance...`, 'info');
        await delay(1200);
        addLog(`Market Analyst: Price $124.30 | RSI: 65.4 | MACD: Bullish`, 'success');

        await delay(1000);
        addLog(`News Analyst: Scanning 45+ sources (Finnhub, OpenAI)...`, 'info');
        await delay(1500);
        addLog(`News Analyst: Detected 3 major headlines. Sentiment: POSITIVE`, 'success');

        await delay(800);
        addLog(`Fundamental Analyst: Checking Balance Sheet...`, 'info');
        await delay(1000);
        addLog(`Risk Manager: Evaluating volatility exposure...`, 'warning');

        await delay(1500);
        addLog(`Debate: Bull vs Bear Agents deliberating...`, 'step');
        await delay(2000);
        addLog(`Trader: Finalizing strategy...`, 'step');
        await delay(800);
        addLog(`Execution: Strategy Generated.`, 'success');

        const finalResponse: Message = {
            id: Date.now() + '',
            role: 'assistant',
            content: `# Analysis Report: ${ticker}\n\n**Recommendation: BUY**\n\n### Rationale\nOur analysts have converged on a bullish outlook for ${ticker}. The price action indicates strong support at current levels, with technical indicators signaling upside potential.\n\n### Key Data Points\n*   **Price:** $429.30\n*   **RSI:** 65.4 (Neutral-Bullish)\n*   **Sentiment:** 8.2/10\n\n*See the intraday chart below for detailed price action.*`,
            timestamp: new Date(),
            chartTicker: ticker
        };
        setMessages(prev => [...prev, finalResponse]);
    };

    return (
        <div className="flex w-full h-full bg-[#060914] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative z-10 min-w-0">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                        </div>
                        <span className="font-bold tracking-wide text-sm text-white/90">XperienZ <span className="text-cyan-400">Live</span></span>
                    </div>

                    <button
                        onClick={() => setShowThoughts(!showThoughts)}
                        className={`p-2 rounded-lg transition-colors hidden md:block ${showThoughts ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/40 hover:text-white'}`}
                        title="Toggle Neural Stream"
                    >
                        <Activity size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth mr-1">
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {/* Quick Action Chips */}
                    {messages.length === 1 && !isLoading && (
                        <div className="flex flex-wrap gap-2 px-12 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {['$NVDA', '$TSLA', 'BITCOIN', '$AMD'].map(ticker => (
                                <button
                                    key={ticker}
                                    onClick={() => handleSendMessage(ticker)}
                                    className="px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs font-mono hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all cursor-pointer hover:scale-105"
                                >
                                    {ticker}
                                </button>
                            ))}
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Zap size={16} className="text-cyan-400 animate-pulse" />
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1s_infinite_0ms]" />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1s_infinite_200ms]" />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1s_infinite_400ms]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 md:p-6 border-t border-white/10 bg-[#060914]/80 backdrop-blur-md">
                    <MessageInput onSend={handleSendMessage} disabled={isLoading} />
                    <div className="mt-2 text-center">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
                            Powered by TradingAgents Architecture
                        </span>
                    </div>
                </div>
            </div>

            {/* Side Panel (Thought Stream) */}
            <AnimatePresence>
                {showThoughts && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden md:block h-full border-l border-white/10 relative z-20"
                    >
                        <ThoughtStream logs={logs} isProcessing={isLoading} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
