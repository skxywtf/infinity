'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import StockChart from './StockChart';
import { Timeline } from 'react-ts-tradingview-widgets';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isError?: boolean;
    chartTicker?: string;
    chartData?: any[];
    newsTicker?: string;
}

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center w-full my-4"
            >
                <span className="text-xs text-white/40 italic px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    {message.content}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
        >
            {/* Avatar */}
            <div className={`mt-1 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border ${isUser
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                }`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-sm border ${isUser
                ? 'bg-purple-600/20 border-purple-500/20 text-white rounded-tr-sm'
                : message.isError
                    ? 'bg-red-900/20 border-red-500/30 text-red-100 rounded-tl-sm'
                    : 'bg-white/5 border-white/10 text-white/90 rounded-tl-sm'
                }`}>
                {message.isError && (
                    <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        <span>System Error</span>
                    </div>
                )}

                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        a: ({ node, ...props }) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" target="_blank" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-xs text-orange-300" {...props} />,
                        pre: ({ node, ...props }) => <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto my-2 border border-white/10" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2 text-white/90" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-white/80" {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-cyan-500/50 pl-3 italic text-white/60 my-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-cyan-100" {...props} />,
                    }}>
                        {message.content}
                    </ReactMarkdown>
                </div>

                {message.chartTicker && (
                    <StockChart ticker={message.chartTicker} data={message.chartData} />
                )}

                {message.newsTicker && (
                    <div className="w-full h-[500px] mt-3 rounded-xl overflow-hidden border border-white/5 relative bg-black/20">
                        <Timeline
                            symbol={message.newsTicker}
                            colorTheme="dark"
                            width="100%"
                            height={500}
                            isTransparent
                        />
                    </div>
                )}

                <div className="mt-2 text-[10px] text-white/30 text-right flex items-center justify-end gap-1">
                    {timestamp(message.timestamp)}
                    {!isUser && <Sparkles size={8} className="text-cyan-500/50" />}
                </div>
            </div>
        </motion.div>
    );
}

function timestamp(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
