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
    const [showThoughts, setShowThoughts] = useState(false); // Default hidden for cleaner experience

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


        // 3. Response Generation
        try {
            // Intent Detection
            const isNews = text.toLowerCase().includes('news');

            // Log action
            addLog(isNews ? `Fetching news for ${ticker}...` : `Loading chart for ${ticker}`, 'info');
            await delay(500);

            const responseMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: isNews
                    ? `### ${ticker} MARKET NEWS\nHere are the latest headlines and updates for **${ticker}**.`
                    : `### ${ticker} CHART\nHere is the live technical chart for **${ticker}**.`,
                timestamp: new Date(),
                newsTicker: isNews ? ticker : undefined,
                chartTicker: !isNews ? ticker : undefined
            };

            setMessages(prev => [...prev, responseMsg]);

            // CALL BACKEND STREAM - DISABLED to satisfy "Just show graph/news" request
            // await runAnalysis(ticker);

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

    // Real Backend Integration
    const runAnalysis = async (ticker: string) => {
        const runId = Date.now().toString();

        // Initial Message Placeholder
        const initialMsg: Message = {
            id: runId,
            role: 'assistant',
            content: `Initiating real-time analysis for **${ticker}**...`,
            timestamp: new Date()
            // chartTicker removed - wait for result
        };
        setMessages(prev => [...prev, initialMsg]);

        // Accumulate reports
        let accumulatedContent = `Analysis for **${ticker}** initiated.\n\n`;

        try {
            const response = await fetch("/api/analyze-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker,
                    date: new Date().toISOString().split('T')[0],
                    research_depth: 1
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            let hasUpdatedContent = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        // Handle Log Events (Thought Stream)
                        if (data.type === 'log') {
                            addLog(data.content, 'info');
                        }
                        else if (data.type === 'status') {
                            addLog(`Status: ${data.content.status}`, 'step');
                        }
                        else if (data.type === 'error') {
                            addLog(`Error: ${data.content}`, 'error');
                        }

                        // Handle Report Events (Chat Content)
                        else if (data.type === 'report') {
                            // Filter reports to match "Simple Analysis" request (Only Market Report)
                            const { key, content } = data.content;
                            if (key === 'market_report') {
                                accumulatedContent = `### TECHNICAL ANALYSIS\n${content}\n`;
                                hasUpdatedContent = true;
                            }
                        }

                        // Handle Completion
                        else if (data.type === 'result') {
                            addLog("Analysis Sequence Completed", 'success');

                            // Finalize and Show Content in One Go
                            if (!hasUpdatedContent) {
                                accumulatedContent += "\n\n**Analysis Complete.**";
                            }

                            setMessages(prev => prev.map(m =>
                                m.id === runId
                                    ? { ...m, content: accumulatedContent, chartTicker: ticker }
                                    : m
                            ));
                        }

                    } catch (e) {
                        console.error("Stream parse error", e);
                    }
                }
            }

        } catch (error) {
            console.error(error);
            addLog(`Connection Failed: ${error}`, 'error');
            setMessages(prev => prev.map(m =>
                m.id === runId
                    ? { ...m, content: accumulatedContent + `\n\n**System Error:** Failed to connect to Trading Agent backend. Please check API keys.` as string, isError: true }
                    : m
            ));
        } finally {
            setIsLoading(false);
        }
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
                            Powered by InfinityXZ
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
