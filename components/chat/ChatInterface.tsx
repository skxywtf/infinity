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
    content: "**InfinityXZ Online.**\n\nI am connected to the World Trade Factory intelligence grid. Select an option below or ask me about stocks, sectors, or market news.",
    timestamp: new Date()
};

const QUICK_PROMPTS = [
    { label: "Market Heatmap", query: "Show me the market heatmap by sector" },
    { label: "Microsoft Financials", query: "Show me Microsoft financials table" },
    { label: "Stock Screener", query: "Open the stock screener" },
    { label: "NVDA Chart", query: "Show me NVDA chart" },
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [logs, setLogs] = useState<ThoughtLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showThoughts, setShowThoughts] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setLogs([]);

        try {
            // Send full context to AI
            const history = [...messages, userMsg].map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content
            }));

            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history })
            });

            if (!response.ok) throw new Error('AI Response Failed');

            const data = await response.json();

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date(),
                chartTicker: data.chartTicker,
                newsTicker: data.newsTicker,
                showHeatmap: data.showHeatmap,
                financialsTicker: data.financialsTicker,
                showScreener: data.showScreener
            };

            setMessages(prev => [...prev, aiMsg]);

            if (data.chartTicker) addLog(`Displaying Chart for ${data.chartTicker}`, 'info');
            if (data.newsTicker) addLog(`Displaying News for ${data.newsTicker}`, 'info');
            if (data.showHeatmap) addLog(`Displaying Market Heatmap`, 'step');
            if (data.showScreener) addLog(`Opening Stock Screener`, 'step');

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I encountered an error connecting to the AI brain. Please try again.",
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
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

    return (
        <div className="flex w-full h-full bg-[#060914] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex-1 flex flex-col relative z-10 min-w-0">
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

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth mr-1">
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}



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

                <div className="p-4 md:p-6 border-t border-white/10 bg-[#060914]/80 backdrop-blur-md">
                    <MessageInput onSend={handleSendMessage} disabled={isLoading} />
                    <div className="mt-2 text-center">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
                            Powered by InfinityXZ
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Quick Actions */}
            <div className="hidden md:flex flex-col w-64 border-l border-white/10 bg-[#0B101F]/50 backdrop-blur-sm relative z-10">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-xs font-bold text-white/60 tracking-wider uppercase">Quick Access</h3>
                </div>
                <div className="p-4 flex flex-col gap-3 overflow-y-auto">
                    {QUICK_PROMPTS.map(prompt => (
                        <button
                            key={prompt.label}
                            onClick={() => handleSendMessage(prompt.query)}
                            className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-cyan-400 text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all hover:translate-x-1 duration-200 group"
                        >
                            <span className="group-hover:text-cyan-300">{prompt.label}</span>
                        </button>
                    ))}

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            Select a tool to instantly visualize market data.
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showThoughts && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden md:block h-full border-l border-white/10 relative z-20 bg-[#060914]"
                    >
                        <ThoughtStream logs={logs} isProcessing={isLoading} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
